import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import crypto from 'crypto';

// ============================================================================
// PART 3, 4, 5 & 6: PRODUCTION AI ARCHITECTURE, ERROR HANDLING & TELEMETRY
// ============================================================================

export type AIErrorCategory =
  | 'HTTP_429_RATE_LIMIT'
  | 'DAILY_QUOTA_EXCEEDED'
  | 'HTTP_503_OVERLOAD'
  | 'HTTP_500_INTERNAL'
  | 'HTTP_401_403_AUTH'
  | 'NETWORK_TIMEOUT'
  | 'INVALID_MODEL_CONFIG'
  | 'UNKNOWN_AI_ERROR';

export class AIServiceError extends Error {
  public readonly category: AIErrorCategory;
  public readonly statusCode: number;
  public readonly retryAfterSeconds?: number;
  public readonly provider: string;
  public readonly model?: string;
  public readonly userMessage: string;

  constructor(params: {
    category: AIErrorCategory;
    statusCode: number;
    userMessage: string;
    technicalMessage: string;
    provider: string;
    model?: string;
    retryAfterSeconds?: number;
  }) {
    super(params.technicalMessage);
    this.name = 'AIServiceError';
    this.category = params.category;
    this.statusCode = params.statusCode;
    this.userMessage = params.userMessage;
    this.provider = params.provider;
    this.model = params.model;
    this.retryAfterSeconds = params.retryAfterSeconds;
  }
}

export interface AIUsageLogEntry {
  id: string;
  timestamp: string;
  feature: string;
  featureLabel: string;
  userId: string;
  userName: string;
  userRole: string;
  provider: string;
  model: string;
  status: 'success' | 'failed';
  latencyMs: number;
  cached: boolean;
  errorCategory?: AIErrorCategory;
  promptTokensEstimate: number;
  completionTokensEstimate: number;
}

interface ModelHealthState {
  model: string;
  status: 'healthy' | 'rate_limited' | 'daily_quota_exhausted' | 'overloaded_503' | 'invalid_model';
  cooldownUntil: number;
  successCount: number;
  failureCount: number;
  lastUsedAt?: string;
  lastErrorCategory?: AIErrorCategory;
}

// Primary Gemini Model Pool ordered for speed, reliability, and independent quota buckets
const GEMINI_MODEL_POOL = [
  'gemini-3.5-flash-lite',
  'gemini-3-flash-preview',
  'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite-preview',
  'gemini-3.1-flash-lite',
];

const modelHealthMap = new Map<string, ModelHealthState>(
  GEMINI_MODEL_POOL.map((m) => [
    m,
    {
      model: m,
      status: 'healthy',
      cooldownUntil: 0,
      successCount: 0,
      failureCount: 0,
    },
  ])
);

// Telemetry & Monitoring State
const aiUsageLogs: AIUsageLogEntry[] = [];
const errorCategoryCounts: Record<AIErrorCategory, number> = {
  HTTP_429_RATE_LIMIT: 0,
  DAILY_QUOTA_EXCEEDED: 0,
  HTTP_503_OVERLOAD: 0,
  HTTP_500_INTERNAL: 0,
  HTTP_401_403_AUTH: 0,
  NETWORK_TIMEOUT: 0,
  INVALID_MODEL_CONFIG: 0,
  UNKNOWN_AI_ERROR: 0,
};

const featureUsageCounts: Record<
  string,
  { label: string; total: number; success: number; failed: number; avgLatencyMs: number }
> = {};

let currentActiveProvider = 'Google Gemini API';
let currentActiveModel = 'gemini-3.5-flash-lite';
let totalAIRequests = 0;
let successfulAIRequests = 0;
let failedAIRequests = 0;
let cachedAIResponses = 0;

// In-flight deduplication map: requestHash -> Promise
const inFlightRequests = new Map<string, Promise<{ text: string; model: string; provider: string; cached: boolean }>>();

// Response cache: requestHash -> { text, model, provider, expiresAt }
const responseCache = new Map<
  string,
  { text: string; model: string; provider: string; expiresAt: number }
>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Per-user sliding window rate limiter
const userRequestTimestamps = new Map<string, number[]>();
const MAX_REQUESTS_PER_MINUTE_PER_USER = 20;

// Concurrency control
let activeOutboundRequests = 0;
const MAX_CONCURRENT_REQUESTS = 5;

function getGeminiClient(): GoogleGenAI {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.API_KEY ||
    '';
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function getSecondaryProviderConfig(): {
  enabled: boolean;
  providerName: string;
  endpoint: string;
  apiKey: string;
  model: string;
} | null {
  if (process.env.OPENAI_API_KEY) {
    return {
      enabled: true,
      providerName: 'OpenAI Fallback API',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_FALLBACK_MODEL || 'gpt-4o-mini',
    };
  }
  if (process.env.GROQ_API_KEY) {
    return {
      enabled: true,
      providerName: 'Groq Fallback API',
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      apiKey: process.env.GROQ_API_KEY,
      model: 'llama-3.3-70b-versatile',
    };
  }
  if (process.env.OPENROUTER_API_KEY) {
    return {
      enabled: true,
      providerName: 'OpenRouter Fallback API',
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      apiKey: process.env.OPENROUTER_API_KEY,
      model: 'google/gemini-2.5-flash',
    };
  }
  if (process.env.SECONDARY_AI_API_KEY && process.env.SECONDARY_AI_ENDPOINT) {
    return {
      enabled: true,
      providerName: process.env.SECONDARY_AI_PROVIDER_NAME || 'Secondary AI Provider',
      endpoint: process.env.SECONDARY_AI_ENDPOINT,
      apiKey: process.env.SECONDARY_AI_API_KEY,
      model: process.env.SECONDARY_AI_MODEL || 'gpt-4o-mini',
    };
  }
  return null;
}

/**
 * Inspects an error thrown by Gemini or network fetch and classifies it into one of the 7 strict categories
 */
export function classifyAIError(err: any): {
  category: AIErrorCategory;
  statusCode: number;
  retryAfterSeconds?: number;
  userMessage: string;
  technicalSummary: string;
} {
  const rawMsg = String(err?.message || err || '');
  const status = Number(err?.status || err?.statusCode || 0);

  // Extract Retry-After or retryDelay if present in error details
  let retryAfterSeconds: number | undefined;
  const retryMatch =
    rawMsg.match(/retryDelay["\s:]+(\d+)s/i) ||
    rawMsg.match(/retry in (\d+(?:\.\d+)?)\s*s/i) ||
    rawMsg.match(/Retry-After["\s:]+(\d+)/i);
  if (retryMatch && retryMatch[1]) {
    retryAfterSeconds = Math.ceil( parseFloat(retryMatch[1]) );
  }

  // 1. Timeout
  if (
    rawMsg.toLowerCase().includes('timed out') ||
    rawMsg.toLowerCase().includes('timeout') ||
    rawMsg.includes('ETIMEDOUT') ||
    rawMsg.includes('AbortError')
  ) {
    return {
      category: 'NETWORK_TIMEOUT',
      statusCode: 504,
      userMessage: 'The AI request timed out while generating your analysis. Please click retry to try again.',
      technicalSummary: 'Request timed out waiting for upstream AI model response.',
    };
  }

  // 2. Invalid API Key / Permissions (401 / 403)
  if (
    status === 401 ||
    status === 403 ||
    rawMsg.includes('PERMISSION_DENIED') ||
    rawMsg.includes('API_KEY_INVALID') ||
    rawMsg.includes('UNAUTHENTICATED') ||
    rawMsg.includes('insufficient authentication scopes')
  ) {
    return {
      category: 'HTTP_401_403_AUTH',
      statusCode: 403,
      userMessage: 'AI service authentication error. Please verify the server-side API key configuration.',
      technicalSummary: 'Upstream authentication/permission rejected (401/403).',
    };
  }

  // 3. Invalid Model Configuration (404 / unsupported)
  if (
    status === 404 ||
    rawMsg.includes('NOT_FOUND') ||
    rawMsg.includes('no longer available') ||
    rawMsg.includes('is not found for API version')
  ) {
    return {
      category: 'INVALID_MODEL_CONFIG',
      statusCode: 404,
      userMessage: 'The requested AI model configuration was updated. Automatically switching to an active model.',
      technicalSummary: 'Model not found or deprecated (404).',
    };
  }

  // 4. Quota vs Rate Limit (429 / RESOURCE_EXHAUSTED)
  if (
    status === 429 ||
    rawMsg.includes('429') ||
    rawMsg.includes('RESOURCE_EXHAUSTED') ||
    rawMsg.toLowerCase().includes('quota') ||
    rawMsg.toLowerCase().includes('rate limit')
  ) {
    const isDailyQuota =
      rawMsg.includes('PerDay') ||
      rawMsg.includes('GenerateRequestsPerDay') ||
      rawMsg.toLowerCase().includes('exceeded your current quota') ||
      rawMsg.toLowerCase().includes('daily');

    if (isDailyQuota) {
      return {
        category: 'DAILY_QUOTA_EXCEEDED',
        statusCode: 429,
        retryAfterSeconds,
        userMessage:
          'Daily AI request quota has been reached for the primary model. Please retry in a few moments or check your API plan.',
        technicalSummary: 'Daily quota exhausted (429 RESOURCE_EXHAUSTED).',
      };
    }

    return {
      category: 'HTTP_429_RATE_LIMIT',
      statusCode: 429,
      retryAfterSeconds: retryAfterSeconds || 3,
      userMessage: `Per-minute AI rate limit reached. Please wait ${retryAfterSeconds || 5} seconds and retry.`,
      technicalSummary: `Per-minute rate limit (429). Retry-After: ${retryAfterSeconds || 3}s`,
    };
  }

  // 5. Temporary Service Overload (503 / UNAVAILABLE / high demand)
  if (
    status === 503 ||
    rawMsg.includes('503') ||
    rawMsg.includes('UNAVAILABLE') ||
    rawMsg.toLowerCase().includes('high demand') ||
    rawMsg.toLowerCase().includes('overloaded')
  ) {
    return {
      category: 'HTTP_503_OVERLOAD',
      statusCode: 503,
      retryAfterSeconds: retryAfterSeconds || 2,
      userMessage:
        'The AI service is temporarily experiencing high demand. Please retry in a few moments.',
      technicalSummary: 'Upstream model experiencing temporary 503 high demand.',
    };
  }

  // 6. Internal Server Error (500 / INTERNAL)
  if (status === 500 || rawMsg.includes('500') || rawMsg.includes('INTERNAL')) {
    return {
      category: 'HTTP_500_INTERNAL',
      statusCode: 500,
      userMessage: 'The AI provider encountered an internal server error. Please retry your request.',
      technicalSummary: 'Upstream 500 internal error.',
    };
  }

  return {
    category: 'UNKNOWN_AI_ERROR',
    statusCode: 500,
    userMessage: 'Unable to complete the AI request at this moment. Please try again.',
    technicalSummary: rawMsg.slice(0, 160) || 'Unhandled AI generation error.',
  };
}

export function checkUserRateLimit(userId: string): { allowed: boolean; retryAfterSeconds?: number } {
  const key = userId || 'anonymous';
  const now = Date.now();
  const windowStart = now - 60 * 1000;
  const recent = (userRequestTimestamps.get(key) || []).filter((ts) => ts > windowStart);

  if (recent.length >= MAX_REQUESTS_PER_MINUTE_PER_USER) {
    const oldest = recent[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + 60 * 1000 - now) / 1000));
    return { allowed: false, retryAfterSeconds };
  }

  recent.push(now);
  userRequestTimestamps.set(key, recent);
  return { allowed: true };
}

function recordUsageTelemetry(entry: Omit<AIUsageLogEntry, 'id' | 'timestamp'>) {
  totalAIRequests++;
  if (entry.status === 'success') {
    successfulAIRequests++;
    currentActiveProvider = entry.provider;
    currentActiveModel = entry.model;
  } else {
    failedAIRequests++;
    if (entry.errorCategory) {
      errorCategoryCounts[entry.errorCategory] =
        (errorCategoryCounts[entry.errorCategory] || 0) + 1;
    }
  }
  if (entry.cached) {
    cachedAIResponses++;
  }

  const featStats = featureUsageCounts[entry.feature] || {
    label: entry.featureLabel,
    total: 0,
    success: 0,
    failed: 0,
    avgLatencyMs: 0,
  };
  const prevTotalLatency = featStats.avgLatencyMs * featStats.total;
  featStats.total += 1;
  if (entry.status === 'success') featStats.success += 1;
  else featStats.failed += 1;
  featStats.avgLatencyMs = Math.round((prevTotalLatency + entry.latencyMs) / featStats.total);
  featureUsageCounts[entry.feature] = featStats;

  const logItem: AIUsageLogEntry = {
    ...entry,
    id: 'ailog_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    timestamp: new Date().toISOString(),
  };

  aiUsageLogs.unshift(logItem);
  if (aiUsageLogs.length > 150) {
    aiUsageLogs.pop();
  }
}

export function getAIMonitoringStats() {
  const now = Date.now();
  const secondary = getSecondaryProviderConfig();
  const modelsStatus = Array.from(modelHealthMap.values()).map((m) => {
    const isCooledDown = m.cooldownUntil > now;
    return {
      model: m.model,
      status: isCooledDown ? m.status : 'healthy',
      cooldownRemainingSeconds: isCooledDown ? Math.ceil((m.cooldownUntil - now) / 1000) : 0,
      successCount: m.successCount,
      failureCount: m.failureCount,
      lastUsedAt: m.lastUsedAt || null,
      lastErrorCategory: m.lastErrorCategory || null,
    };
  });

  return {
    totalRequests: totalAIRequests,
    successfulRequests: successfulAIRequests,
    failedRequests: failedAIRequests,
    cachedResponses: cachedAIResponses,
    successRate:
      totalAIRequests > 0 ? Math.round((successfulAIRequests / totalAIRequests) * 100) : 100,
    currentProvider: currentActiveProvider,
    currentModel: currentActiveModel,
    secondaryProviderConfigured: Boolean(secondary?.enabled),
    secondaryProviderName: secondary?.providerName || 'Not Configured (Gemini Multi-Model Pool Active)',
    modelsStatus,
    usageByFeature: Object.entries(featureUsageCounts).map(([key, val]) => ({
      feature: key,
      label: val.label,
      total: val.total,
      success: val.success,
      failed: val.failed,
      avgLatencyMs: val.avgLatencyMs,
    })),
    errorCategories: errorCategoryCounts,
    recentLogs: aiUsageLogs.slice(0, 40),
  };
}

async function callSecondaryProvider(params: {
  contents: string;
  systemInstruction?: string;
  jsonMode?: boolean;
}): Promise<{ text: string; model: string; provider: string }> {
  const sec = getSecondaryProviderConfig();
  if (!sec || !sec.enabled) {
    throw new Error('No secondary AI provider configured.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 35000);
  try {
    const messages: { role: string; content: string }[] = [];
    if (params.systemInstruction) {
      messages.push({ role: 'system', content: params.systemInstruction });
    }
    messages.push({ role: 'user', content: params.contents });

    const bodyPayload: Record<string, any> = {
      model: sec.model,
      messages,
    };
    if (params.jsonMode) {
      bodyPayload.response_format = { type: 'json_object' };
    }

    const res = await fetch(sec.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sec.apiKey}`,
      },
      body: JSON.stringify(bodyPayload),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Secondary provider HTTP ${res.status}: ${errText.slice(0, 200)}`);
    }

    const data: any = await res.json();
    const text = data?.choices?.[0]?.message?.content || '';
    if (!text) {
      throw new Error('Empty response from secondary AI provider.');
    }
    return {
      text,
      model: sec.model,
      provider: sec.providerName,
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Core Resilient AI Execution Engine with:
 * - Request Deduplication
 * - Response Caching
 * - Per-user Rate Limiting
 * - Multi-Model Health Routing
 * - Controlled Exponential Backoff & Retry-After Support
 * - Secondary Provider Fallback
 */
async function executeResilientAIRequest(params: {
  feature: string;
  featureLabel: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  contents: string;
  config?: Record<string, any>;
  forceRefresh?: boolean;
}): Promise<{ text: string; model: string; provider: string; cached: boolean }> {
  const startTime = Date.now();
  const userId = params.userId || 'anonymous_user';
  const userName = params.userName || 'Platform User';
  const userRole = params.userRole || 'founder';

  // 1. Check per-user rate limit
  const rateCheck = checkUserRateLimit(userId);
  if (!rateCheck.allowed) {
    errorCategoryCounts.HTTP_429_RATE_LIMIT++;
    const err = new AIServiceError({
      category: 'HTTP_429_RATE_LIMIT',
      statusCode: 429,
      retryAfterSeconds: rateCheck.retryAfterSeconds,
      provider: 'Server Rate Limiter',
      userMessage: `You are sending AI requests too quickly. Please wait ${rateCheck.retryAfterSeconds} seconds before trying again.`,
      technicalMessage: `Per-user rate limit exceeded for user ${userId}`,
    });
    recordUsageTelemetry({
      feature: params.feature,
      featureLabel: params.featureLabel,
      userId,
      userName,
      userRole,
      provider: currentActiveProvider,
      model: currentActiveModel,
      status: 'failed',
      latencyMs: Date.now() - startTime,
      cached: false,
      errorCategory: 'HTTP_429_RATE_LIMIT',
      promptTokensEstimate: Math.ceil(params.contents.length / 4),
      completionTokensEstimate: 0,
    });
    throw err;
  }

  // 2. Compute deterministic deduplication & cache key
  const hashInput = JSON.stringify({
    f: params.feature,
    c: params.contents.trim(),
    s: params.config?.systemInstruction || '',
    m: params.config?.responseMimeType || 'text/plain',
  });
  const requestHash = crypto.createHash('sha256').update(hashInput).digest('hex');

  // 3. Check response cache unless forceRefresh is set
  if (!params.forceRefresh) {
    const cachedEntry = responseCache.get(requestHash);
    if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
      recordUsageTelemetry({
        feature: params.feature,
        featureLabel: params.featureLabel,
        userId,
        userName,
        userRole,
        provider: cachedEntry.provider,
        model: cachedEntry.model,
        status: 'success',
        latencyMs: Math.max(1, Date.now() - startTime),
        cached: true,
        promptTokensEstimate: Math.ceil(params.contents.length / 4),
        completionTokensEstimate: Math.ceil(cachedEntry.text.length / 4),
      });
      return {
        text: cachedEntry.text,
        model: cachedEntry.model,
        provider: cachedEntry.provider,
        cached: true,
      };
    }
  }

  // 4. Deduplicate identical in-flight requests
  const existingInFlight = inFlightRequests.get(requestHash);
  if (existingInFlight) {
    return existingInFlight;
  }

  const executionPromise = (async () => {
    // Wait neatly if concurrency limit is reached
    let waitCount = 0;
    while (activeOutboundRequests >= MAX_CONCURRENT_REQUESTS && waitCount < 20) {
      await new Promise((r) => setTimeout(r, 250));
      waitCount++;
    }

    activeOutboundRequests++;
    try {
      const ai = getGeminiClient();
      const now = Date.now();

      // Order candidate models: healthy models first, then models whose cooldown expired
      const availableModels = GEMINI_MODEL_POOL.filter((modelName) => {
        const state = modelHealthMap.get(modelName);
        if (!state) return true;
        if (state.status === 'invalid_model') return false;
        return state.cooldownUntil <= now;
      });

      // If all models are in cooldown, still try the top two resilient models
      const candidateModels =
        availableModels.length > 0
          ? availableModels
          : ['gemini-3.5-flash-lite', 'gemini-3-flash-preview', 'gemini-3.5-flash'];

      let lastClassifiedError: ReturnType<typeof classifyAIError> | null = null;
      let lastModelTried = candidateModels[0];

      for (const model of candidateModels) {
        lastModelTried = model;
        const maxAttempts = 2;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          let timeoutId: ReturnType<typeof setTimeout> | null = null;
          try {
            const modelConfig: Record<string, any> = { ...(params.config || {}) };
            delete modelConfig.temperature;
            if (model === 'gemini-3.8-flash') {
              modelConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
            }

            const response = await Promise.race([
              ai.models.generateContent({
                model,
                contents: params.contents,
                config: modelConfig,
              }),
              new Promise<never>((_, reject) => {
                timeoutId = setTimeout(
                  () => reject(new Error(`Request timed out on ${model} after 35s`)),
                  35000
                );
              }),
            ]);

            if (timeoutId) clearTimeout(timeoutId);

            if (response && response.text) {
              const health = modelHealthMap.get(model);
              if (health) {
                health.status = 'healthy';
                health.cooldownUntil = 0;
                health.successCount += 1;
                health.lastUsedAt = new Date().toISOString();
              }

              const resultPayload = {
                text: response.text,
                model,
                provider: 'Google Gemini API',
                cached: false,
              };

              responseCache.set(requestHash, {
                text: response.text,
                model,
                provider: 'Google Gemini API',
                expiresAt: Date.now() + CACHE_TTL_MS,
              });

              recordUsageTelemetry({
                feature: params.feature,
                featureLabel: params.featureLabel,
                userId,
                userName,
                userRole,
                provider: 'Google Gemini API',
                model,
                status: 'success',
                latencyMs: Date.now() - startTime,
                cached: false,
                promptTokensEstimate: Math.ceil(params.contents.length / 4),
                completionTokensEstimate: Math.ceil(response.text.length / 4),
              });

              return resultPayload;
            }
          } catch (err: any) {
            if (timeoutId) clearTimeout(timeoutId);
            const classified = classifyAIError(err);
            lastClassifiedError = classified;

            const health = modelHealthMap.get(model);
            if (health) {
              health.failureCount += 1;
              health.lastErrorCategory = classified.category;
            }

            // Handle each error category according to Part 3 requirements:
            if (classified.category === 'DAILY_QUOTA_EXCEEDED') {
              // Do NOT repeatedly retry an exhausted daily quota on this model!
              if (health) {
                health.status = 'daily_quota_exhausted';
                health.cooldownUntil = Date.now() + 60 * 60 * 1000; // 1 hour cooldown
              }
              break; // Switch immediately to next model in pool
            }

            if (classified.category === 'INVALID_MODEL_CONFIG') {
              if (health) {
                health.status = 'invalid_model';
                health.cooldownUntil = Date.now() + 24 * 60 * 60 * 1000;
              }
              break; // Switch immediately
            }

            if (classified.category === 'HTTP_401_403_AUTH') {
              // Invalid API key — do not retry across Gemini models, break to check secondary provider
              break;
            }

            if (classified.category === 'HTTP_429_RATE_LIMIT') {
              if (health) {
                health.status = 'rate_limited';
                const waitSec = Math.min(classified.retryAfterSeconds || 3, 15);
                health.cooldownUntil = Date.now() + waitSec * 1000;
              }
              // If retry-after is short (<= 3s) and attempt === 1, respect Retry-After and retry once; otherwise switch model immediately
              if (attempt === 1 && (classified.retryAfterSeconds || 3) <= 3) {
                await new Promise((r) =>
                  setTimeout(r, (classified.retryAfterSeconds || 2) * 1000)
                );
                continue;
              }
              break;
            }

            if (
              classified.category === 'HTTP_503_OVERLOAD' ||
              classified.category === 'HTTP_500_INTERNAL'
            ) {
              if (health) {
                health.status = 'overloaded_503';
                health.cooldownUntil = Date.now() + 30 * 1000; // 30s cooldown
              }
              // Controlled exponential backoff on temporary 503/500 before switching model
              if (attempt < maxAttempts) {
                const backoffMs = 600 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 250);
                await new Promise((r) => setTimeout(r, backoffMs));
                continue;
              }
              break;
            }

            // Timeout or other transient error
            if (attempt < maxAttempts) {
              await new Promise((r) => setTimeout(r, 500));
            }
          }
        }
      }

      // PART 4: Optional Secondary AI Provider Fallback if all Gemini models failed
      const secondaryConfig = getSecondaryProviderConfig();
      if (secondaryConfig && secondaryConfig.enabled) {
        try {
          const secResult = await callSecondaryProvider({
            contents: params.contents,
            systemInstruction: params.config?.systemInstruction,
            jsonMode: params.config?.responseMimeType === 'application/json',
          });

          responseCache.set(requestHash, {
            text: secResult.text,
            model: secResult.model,
            provider: secResult.provider,
            expiresAt: Date.now() + CACHE_TTL_MS,
          });

          recordUsageTelemetry({
            feature: params.feature,
            featureLabel: params.featureLabel,
            userId,
            userName,
            userRole,
            provider: secResult.provider,
            model: secResult.model,
            status: 'success',
            latencyMs: Date.now() - startTime,
            cached: false,
            promptTokensEstimate: Math.ceil(params.contents.length / 4),
            completionTokensEstimate: Math.ceil(secResult.text.length / 4),
          });

          return {
            text: secResult.text,
            model: secResult.model,
            provider: secResult.provider,
            cached: false,
          };
        } catch (secErr: any) {
          console.error('[AI Security Log] Secondary provider fallback failed:', secErr?.message);
        }
      }

      // If no secondary provider succeeded, record failure and throw structured AIServiceError
      const finalError = lastClassifiedError || {
        category: 'UNKNOWN_AI_ERROR' as AIErrorCategory,
        statusCode: 503,
        userMessage: 'AI service is temporarily unavailable. Please retry in a few moments.',
        technicalSummary: 'All configured AI models failed.',
      };

      recordUsageTelemetry({
        feature: params.feature,
        featureLabel: params.featureLabel,
        userId,
        userName,
        userRole,
        provider: 'Google Gemini API',
        model: lastModelTried,
        status: 'failed',
        latencyMs: Date.now() - startTime,
        cached: false,
        errorCategory: finalError.category,
        promptTokensEstimate: Math.ceil(params.contents.length / 4),
        completionTokensEstimate: 0,
      });

      throw new AIServiceError({
        category: finalError.category,
        statusCode: finalError.statusCode,
        retryAfterSeconds: finalError.retryAfterSeconds,
        provider: 'Google Gemini API',
        model: lastModelTried,
        userMessage: finalError.userMessage,
        technicalMessage: finalError.technicalSummary,
      });
    } finally {
      activeOutboundRequests = Math.max(0, activeOutboundRequests - 1);
      inFlightRequests.delete(requestHash);
    }
  })();

  inFlightRequests.set(requestHash, executionPromise);
  return executionPromise;
}

export interface AIGenerateRequest {
  feature:
    | 'startup_assistant'
    | 'business_idea'
    | 'business_plan'
    | 'market_research'
    | 'growth_strategy'
    | 'progress_analysis'
    | 'milestone_suggestions'
    | 'mentor_recommendation'
    | 'risk_analysis'
    | 'report_generator'
    | 'admin_insights'
    | 'mentor_feedback_assistant'
    | 'course_suggest';
  prompt?: string;
  context?: Record<string, any>;
  userId?: string;
  userName?: string;
  userRole?: string;
  forceRefresh?: boolean;
}

const FEATURE_LABELS: Record<string, string> = {
  startup_assistant: 'AI Startup Assistant',
  business_idea: 'AI Business Idea Generator',
  business_plan: 'AI Business Plan Generator',
  market_research: 'AI Market Research Assistant',
  growth_strategy: 'AI Growth Recommendations',
  progress_analysis: 'AI Progress Analysis',
  milestone_suggestions: 'AI Milestone Suggestions',
  mentor_recommendation: 'AI Mentor Recommendation',
  risk_analysis: 'AI Startup Risk Analysis',
  report_generator: 'AI Progress Report Generator',
  admin_insights: 'AI Admin Ecosystem Insights',
  mentor_feedback_assistant: 'AI Mentor Feedback Assistant',
  course_suggest: 'Courses & Learning Syllabus AI',
  course_recommendations: 'Courses & Learning AI Recommendations',
  startup_analysis_360: 'AI Incubation Hub 360° Analysis',
};

export async function handleAIGenerate(request: AIGenerateRequest): Promise<{
  text: string;
  model: string;
  provider: string;
  cached: boolean;
}> {
  const { feature, prompt, context = {}, userId, userName, userRole, forceRefresh } = request;

  let systemInstruction =
    'You are an elite startup incubator partner and AI strategic advisor. You provide sharp, hyper-actionable, structured guidance with concrete frameworks, benchmarks, and metrics. Always format your responses with clean Markdown headers, bullet points, and highlighted insights. CRITICAL: All financial advice, valuations, pricing, revenue figures, asks, and monetary metrics must be in Indian Rupees (INR ₹) using the Indian numbering system (Lakhs and Crores, e.g., ₹10 Lakhs, ₹5 Crores, ₹25,00,000). Never quote in US Dollars ($).';

  let userPrompt = prompt || '';

  switch (feature) {
    case 'startup_assistant':
      systemInstruction =
        'You are the Incubator AI Assistant. You help startup founders troubleshoot execution, prepare for investor pitch meetings, draft customer discovery questions, and navigate incubator resources. All monetary amounts must be in Indian Rupees (INR ₹).';
      userPrompt = `Startup Context:
Name: ${context.startupName || 'PulseAI'}
Industry: ${context.industry || 'HealthTech & AI'}
Stage: ${context.stage || 'Early Traction'}
Description: ${context.description || 'Medical edge AI for diagnostics'}
Monthly Revenue: ₹${context.revenue || '12,50,000'}
Target Funding: ₹${context.fundingRequired || '5,00,00,000'}

Founder Query: ${prompt || 'How should we structure our enterprise pilot agreements to maximize our valuation before our upcoming ₹5 Crore seed round?'}`;
      break;

    case 'business_idea':
      systemInstruction =
        'You are an expert venture capitalist and startup ideation strategist. You evaluate startup ideas using problem-solution fit, defensibility, unit economics, and market timing. All financials in Indian Rupees (INR ₹).';
      userPrompt = `Generate a rigorous breakdown for this startup concept: "${prompt || 'AI-driven maritime logistics optimization'}". Include:
1. One-Sentence High-Concept Pitch (e.g., "X for Y")
2. The Urgent Hair-on-Fire Problem
3. Defensible Solution & Tech Moat
4. Target Ideal Customer Profile (ICP)
5. Pricing Model & Revenue Streams (in INR ₹)
6. Initial Validation Experiments (Under ₹1,00,000 budget)`;
      break;

    case 'business_plan':
      systemInstruction =
        'You are a senior partner at Y Combinator. Provide an executive Lean Canvas and strategic business roadmap. All monetary values in Indian Rupees (INR ₹).';
      userPrompt = `Build an executive Business Plan & Lean Canvas for the following startup:
Name: ${context.startupName || 'PulseAI Diagnostics'}
Domain: ${context.industry || 'HealthTech'}
Stage: ${context.stage || 'Seed'}
Details: ${prompt || 'Edge AI diagnostics for hospitals to reduce ICU alarms and mortality.'}

Include: Value Proposition, Key Metrics (North Star), Revenue Model, Cost Structure, Unfair Advantage, Channels, and 6-Month Milestones.`;
      break;

    case 'market_research':
      systemInstruction =
        'You are an equity research analyst and tech market intelligence expert. Provide structured TAM, SAM, SOM analysis with competitive positioning matrix in Indian Rupees (INR ₹).';
      userPrompt = `Conduct comprehensive market research and competitive breakdown for:
Industry: ${context.industry || 'AI Healthcare & Edge Diagnostics'}
Startup: ${context.startupName || 'PulseAI Diagnostics'}
Focus: ${prompt || 'Clinical ICU telemetry and predictive diagnostics'}`;
      break;

    case 'growth_strategy':
      systemInstruction =
        'You are a world-class Head of Growth and B2B SaaS GTM strategist. All budgets and CAC/LTV figures in Indian Rupees (INR ₹).';
      userPrompt = `Design a hyper-growth GTM playbook for:
Startup: ${context.startupName || 'PulseAI Diagnostics'}
Target: ${prompt || 'Scale from 3 pilot clinics to 20 hospital networks with positive unit economics'}
Detail: B2B Enterprise Outbound, Strategic Channel Partnerships, Content Moat, and Sales Cycle compression.`;
      break;

    case 'progress_analysis':
      systemInstruction =
        'You are the Incubator Managing Director analyzing portfolio progress and milestone velocity.';
      userPrompt = `Analyze the current incubation velocity for ${context.startupName || 'Portfolio Startup'}:
Milestones Summary: ${JSON.stringify(context.milestones || ['Deploy edge inference', 'SOC 2 Type 1 completed', 'Seed round outreach'])}
Current Progress: ${context.progress || 68}%
Feedback History: ${context.feedback || 'Fast product execution; needs tighter pricing model'}
Provide: Execution Velocity Score (1-10), Critical Bottlenecks, and Immediate Next 14-Day Sprint Priorities.`;
      break;

    case 'milestone_suggestions':
      systemInstruction =
        'You are an incubation program director specializing in weighted milestone goal setting. All funding targets and budgets must be in Indian Rupees (INR ₹).';
      userPrompt = `Suggest 5 high-impact, weighted milestone goals for:
Startup: ${context.startupName || 'PulseAI Diagnostics'}
Stage: ${context.stage || 'Early Traction'}
Focus Goal: ${prompt || 'Prepare for ₹5 Crore Seed Round over next 90 days'}
For each milestone, provide: Title, Category (Product/Traction/Fundraising/Legal), Recommended Weight (1-10), Target Deadline window, and Measurable Acceptance Criteria.`;
      break;

    case 'mentor_recommendation':
      systemInstruction = 'You are an intelligent incubator matchmaking algorithm.';
      userPrompt = `Recommend the ideal mentor expertise profile and specific advisory agenda for:
Startup: ${context.startupName || 'PulseAI Diagnostics'}
Current Stage: ${context.stage || 'Early Traction'}
Needs: ${prompt || 'Navigating CDSCO/FDA pathway, hospital procurement, and enterprise pricing.'}
Available Mentors: ${JSON.stringify(context.mentorsList || ['Dr. Sarah Chen (B2B SaaS & AI)', 'Marcus Aurelius (Fintech & Legal)', 'Elena Rostova (Growth & GTM)'])}
Recommend the top mentor match and formulate a tailored 4-session mentorship curriculum.`;
      break;

    case 'risk_analysis':
      systemInstruction =
        'You are a veteran VC due-diligence lead and risk auditor. All monetary references in Indian Rupees (INR ₹).';
      userPrompt = `Perform a rigorous 360-degree risk assessment for:
Startup: ${context.startupName || 'PulseAI'}
Details: ${prompt || 'Healthcare edge inference models with patient telemetry data'}
Cover:
1. Regulatory & Compliance Risk
2. Technical & Model Drift Risk
3. Go-To-Market & Sales Cycle Friction
4. Capital & Burn Rate Runway Risk
5. Mitigation Strategies for each.`;
      break;

    case 'report_generator':
      systemInstruction =
        'You are an incubator operations director compiling an executive investor board memo. All financials must be expressed in Indian Rupees (INR ₹) using Lakhs and Crores.';
      userPrompt = `Generate a formal Incubator Cohort Progress Report for:
Startup: ${context.startupName || 'PulseAI Diagnostics'}
Cohort: ${context.cohortName || 'Winter 2026 Batch'}
Progress: ${context.progress || 68}%
Funding Status: Raised ₹${context.fundingRaised || '1,50,00,000'} of ₹${context.fundingRequired || '5,00,00,000'}
Include: Executive Summary, Key Accomplishments, KPI Dashboard, Mentor Evaluation, and 90-Day Outlook.`;
      break;

    case 'admin_insights':
      systemInstruction =
        'You are the chief venture scout and portfolio operations strategist for the incubator.';
      userPrompt = `Analyze our global incubator portfolio metrics:
Total Startups: ${context.totalStartups || 8}
Active Cohorts: ${context.activeCohorts || 2}
Total Mentoring Touchpoints: ${context.sessionsCount || 24}
Average Portfolio Velocity: ${context.avgProgress || 58}%
Provide: Program Health Assessment, High-Performing Cohort Highlights, At-Risk Founder Interventions, and Resource Allocation Recommendations.`;
      break;

    case 'mentor_feedback_assistant':
      systemInstruction =
        'You are an executive startup coach assisting mentors in delivering high-impact, constructive feedback.';
      userPrompt = `Help a mentor polish their coaching notes and action plan for a founder:
Session Notes: "${prompt || 'Founder is moving fast on tech, but pitch deck still lacks clear competitive differentiation from Epic Systems.'}"
Startup: ${context.startupName || 'PulseAI Diagnostics'}
Output:
1. Encouraging, Motivating Opening
2. Clear Critique & Tactical Suggestions
3. 3 Prioritized Action Items with accountability measures.`;
      break;

    case 'course_suggest':
      systemInstruction =
        'You are an incubator curriculum designer. Return a clean Markdown syllabus for founders.';
      userPrompt = `Generate a comprehensive startup workshop module based on:
Topic / Title: "${prompt || 'AI for Founders: Architecture, Security & Go-To-Market'}"
Category: "${context.category || 'Technology'}"
Provide:
- Course Title
- Category
- Compelling 2-paragraph Course Description
- Recommended Duration (in hours)
- 4-Module Breakdown with lesson objectives`;
      break;

    default:
      userPrompt = prompt || 'Provide strategic guidance for startup incubation.';
  }

  return executeResilientAIRequest({
    feature,
    featureLabel: FEATURE_LABELS[feature] || feature,
    userId,
    userName,
    userRole,
    contents: userPrompt,
    config: { systemInstruction },
    forceRefresh,
  });
}

function parseJsonFromGemini(text: string): any {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
    cleaned = cleaned.replace(/\s*```$/i, '');
  }
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace !== -1) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
  } else if (firstBracket !== -1) {
    const lastBracket = cleaned.lastIndexOf(']');
    if (lastBracket !== -1) {
      cleaned = cleaned.substring(firstBracket, lastBracket + 1);
    }
  }
  return JSON.parse(cleaned);
}

// ============================================================================
// PART 1: COURSES & LEARNING AI PERSONALIZED RECOMMENDATIONS
// ============================================================================

export interface CourseRecommendInput {
  userId?: string;
  userRole?: string;
  founderName: string;
  startupName?: string;
  industry?: string;
  stage?: string;
  experience?: string;
  skills?: string;
  interests?: string;
  learningGoals?: string;
  existingCatalogTitles?: string[];
  forceRefresh?: boolean;
}

export async function generateCourseRecommendationsAI(input: CourseRecommendInput) {
  const systemInstruction = `You are a world-class startup incubator education director and curriculum architect.
Your mission is to formulate personalized, high-impact learning curricula tailored to a user's role, startup industry, current skill level, learning goals, and startup development stage.
You MUST output ONLY a valid JSON object (no preface, no markdown fences).

The JSON format must strictly adhere to:
{
  "recommendations": [
    {
      "id": "rec_1",
      "title": "Title of the course or curriculum",
      "category": "Technical" | "Entrepreneurship" | "Business Management" | "Marketing & Sales" | "Finance & Fundraising" | "Product Development" | "Leadership",
      "description": "Concise 2-sentence overview of what this course covers and its practical methodology.",
      "whyRecommended": "2 sentences explaining why this course fits the user's role, startup industry, stage, and skill gap.",
      "skillsLearned": ["Skill 1", "Skill 2", "Skill 3", "Skill 4"],
      "difficulty": "Beginner" | "Intermediate" | "Advanced",
      "duration": "e.g., 4 weeks (3 hrs/week) or 8 hours",
      "objectives": [
        "Measurable learning objective 1",
        "Measurable learning objective 2",
        "Measurable learning objective 3"
      ],
      "suggestedNextSteps": [
        "Actionable next step 1 to apply immediately to the startup",
        "Actionable next step 2"
      ],
      "platforms": ["Platform or Provider Name, e.g. Y Combinator Startup School, Stanford Online, Harvard Business School Online, Coursera"],
      "url": "https://www.startupschool.org"
    }
  ]
}

Recommend 5 high-impact courses spanning technical foundations, business/GTM, finance/fundraising (in INR ₹), product development, and leadership.`;

  const catalogContext =
    input.existingCatalogTitles && input.existingCatalogTitles.length > 0
      ? `\n- Existing Incubator Catalog Courses: ${input.existingCatalogTitles.join(', ')}`
      : '';

  const userPrompt = `Generate personalized course recommendations for this Startup Platform User:
- User Name: ${input.founderName || 'Founder'}
- User Role: ${input.userRole || 'Founder'}
- Startup Name: ${input.startupName || 'Startup Venture'}
- Startup Industry: ${input.industry || 'Technology & Software'}
- Startup Development Stage: ${input.stage || 'Early Traction'}
- Current Skill Level & Experience: ${input.experience || 'First-time founder'}
- Skills Gaps to Bridge: ${input.skills || 'Technical background, needs enterprise sales and fundraising mastery'}
- Interests & Focus Areas: ${input.interests || 'B2B GTM, investor pitches, cloud architecture'}
- Specific Learning Goals: ${input.learningGoals || 'Accelerate path to ₹5 Crore Seed funding and build repeatable enterprise sales pipeline'}${catalogContext}`;

  const response = await executeResilientAIRequest({
    feature: 'course_recommendations',
    featureLabel: FEATURE_LABELS.course_recommendations,
    userId: input.userId,
    userName: input.founderName,
    userRole: input.userRole || 'founder',
    contents: userPrompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
    },
    forceRefresh: input.forceRefresh,
  });

  const parsed = parseJsonFromGemini(response.text || '');
  if (parsed && Array.isArray(parsed.recommendations)) {
    const items = parsed.recommendations.map((item: any, idx: number) => ({
      ...item,
      id: item.id || `rec_${Date.now()}_${idx}`,
      description: item.description || item.whyRecommended || '',
      whyRecommended: item.whyRecommended || item.description || '',
      objectives: Array.isArray(item.objectives) ? item.objectives : [],
      suggestedNextSteps: Array.isArray(item.suggestedNextSteps)
        ? item.suggestedNextSteps
        : [
            'Complete Module 1 and align key takeaways with your 30-day startup milestone plan.',
            'Review course deliverables with your assigned incubator mentor during your next 1:1 session.',
          ],
    }));

    return {
      recommendations: items,
      modelUsed: response.model,
      providerUsed: response.provider,
      cached: response.cached,
    };
  }
  throw new Error('Invalid JSON structure returned by AI provider.');
}

// ============================================================================
// PART 2: AI INCUBATION HUB — 360° STARTUP ASSISTANT & ANALYSIS
// ============================================================================

export interface StartupAnalysisInput {
  userId?: string;
  userRole?: string;
  founderName?: string;
  startup: {
    name: string;
    industry?: string;
    stage?: string;
    businessModel?: string;
    targetCustomers?: string;
    description?: string;
    monthlyRevenue?: number;
    fundingRequired?: number;
    fundingRaised?: number;
    progress?: number;
  };
  prompt: string;
  forceRefresh?: boolean;
}

export async function generateStartupAnalysisAI(input: StartupAnalysisInput) {
  const systemInstruction = `You are an elite incubation director, venture capitalist partner, and startup strategist.
You provide deep, actionable, non-superficial startup assessments covering:
1. Startup Idea & Value Proposition
2. Business Model & Unit Economics
3. Market Opportunity (TAM/SAM/SOM)
4. Target Customers (ICP)
5. Competitor Analysis
6. Revenue Model & Streams
7. Financial Planning & Burn/Runway
8. Risks and Challenges
9. Growth Strategy
10. Funding Readiness

CRITICAL CURRENCY INSTRUCTION: All financial recommendations, unit economics, valuation targets, round asks, revenue metrics, cost structures, and KPIs MUST strictly be formatted in Indian Rupees (INR ₹) using the Indian numbering system (Lakhs and Crores, e.g. ₹5 Crores, ₹50 Lakhs, ₹12.5 Lakhs). Never quote in US Dollars ($).
You must return ONLY a valid JSON object matching the exact schema below:

{
  "overview": {
    "summary": "Executive summary of the startup idea, market opportunity, and current positioning",
    "valueProposition": "Analysis of the unique value proposition and defensibility moat",
    "stageReadiness": "Current operational and product readiness for its declared stage",
    "readinessScore": 8.5
  },
  "businessAnalysis": {
    "businessModel": "In-depth review of the core business model, revenue model, unit economics, and margins in INR ₹",
    "revenueOpportunities": ["Revenue stream 1 (with INR pricing benchmark)", "Revenue stream 2", "Revenue stream 3"],
    "swot": {
      "strengths": ["Strength 1", "Strength 2", "Strength 3"],
      "weaknesses": ["Weakness 1", "Weakness 2", "Weakness 3"],
      "opportunities": ["Market opportunity 1", "Market opportunity 2", "Market opportunity 3"],
      "threats": ["Risk / challenge 1", "Risk / challenge 2", "Risk / challenge 3"]
    }
  },
  "marketAnalysis": {
    "targetMarket": "Detailed target customers (ICP), market segmentation, and TAM/SAM/SOM opportunity in INR ₹",
    "competitorAnalysis": "Direct and indirect competitor landscape and competitive differentiation",
    "marketPositioning": "Strategic market positioning and defensible wedges",
    "customerAcquisition": ["Acquisition channel 1", "Acquisition channel 2", "Acquisition channel 3"]
  },
  "productDevelopment": {
    "mvpRecommendations": "Product architecture, technical risks & challenges, and MVP execution recommendations",
    "roadmap": ["Phase 1 milestone", "Phase 2 milestone", "Phase 3 milestone"],
    "featurePrioritization": ["High priority feature", "Medium priority feature", "Later phase feature"],
    "uxImprovements": ["UX / workflow improvement 1", "UX / workflow improvement 2", "UX / workflow improvement 3"]
  },
  "businessGrowth": {
    "gtmStrategy": "Comprehensive growth strategy and Go-To-Market execution playbook",
    "partnerships": ["Strategic partnership vector 1", "Strategic partnership vector 2"],
    "scalingRecommendations": ["Scaling recommendation 1", "Scaling recommendation 2", "Scaling recommendation 3"]
  },
  "fundingGuidance": {
    "investmentReadiness": "Funding readiness evaluation and investor due-diligence checklist",
    "fundingOptions": ["Recommended funding option 1", "Recommended funding option 2", "Recommended funding option 3"],
    "financialPlanning": "Financial planning, runway, burn rate management, and capital allocation strategy in INR ₹",
    "targetValuationOrAsk": "Recommended seed/angel round size and valuation parameters in INR ₹ (e.g. ₹5 Crores at ₹35–₹45 Crores post-money valuation)"
  },
  "actionPlan": {
    "immediatePriorities": ["Day 1-7 priority 1", "Day 1-7 priority 2", "Day 1-7 priority 3"],
    "shortTermGoals": ["Day 8-30 milestone 1", "Day 8-30 milestone 2", "Day 8-30 milestone 3"],
    "midTermGoals": ["Day 31-90 objective 1", "Day 31-90 objective 2", "Day 31-90 objective 3"],
    "kpis": ["North star KPI 1", "Traction KPI 2", "Financial KPI 3 (in INR ₹)", "Operational KPI 4"]
  }
}`;

  const userPrompt = `Perform a comprehensive, institutional-grade startup incubation analysis for:
- Startup Name: ${input.startup.name || 'Startup'}
- Industry: ${input.startup.industry || 'Technology'}
- Development Stage: ${input.startup.stage || 'MVP'}
- Business Model: ${input.startup.businessModel || 'B2B SaaS'}
- Target Customers: ${input.startup.targetCustomers || 'Enterprise & Mid-Market Organizations'}
- Startup Idea & Description: ${input.startup.description || 'Not provided'}
- Monthly Revenue: ₹${input.startup.monthlyRevenue ?? 0}
- Funding Raised: ₹${input.startup.fundingRaised ?? 0}
- Target Funding Ask: ₹${input.startup.fundingRequired ?? 0}
- Current Execution Progress: ${input.startup.progress ?? 50}%
- Specific Founder Query / Focus: ${input.prompt || 'Provide a complete strategic acceleration analysis across all dimensions.'}
Ensure all monetary values and valuation guidance are strictly in Indian Rupees (INR ₹).`;

  const response = await executeResilientAIRequest({
    feature: 'startup_analysis_360',
    featureLabel: FEATURE_LABELS.startup_analysis_360,
    userId: input.userId,
    userName: input.founderName || 'Founder',
    userRole: input.userRole || 'founder',
    contents: userPrompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
    },
    forceRefresh: input.forceRefresh,
  });

  const parsed = parseJsonFromGemini(response.text || '');
  if (parsed && parsed.overview && parsed.businessAnalysis && parsed.marketAnalysis) {
    if (!parsed.fullMarkdown) {
      const ov = parsed.overview || {};
      const ba = parsed.businessAnalysis || {};
      const ma = parsed.marketAnalysis || {};
      const pd = parsed.productDevelopment || {};
      const bg = parsed.businessGrowth || {};
      const fg = parsed.fundingGuidance || {};
      const ap = parsed.actionPlan || {};
      parsed.fullMarkdown = [
        `# ${input.startup.name || 'Startup'} — Institutional Incubation Analysis`,
        `## A. Startup Overview & Readiness (Score: ${ov.readinessScore ?? 8.5}/10)`,
        `**Executive Summary:** ${ov.summary || ''}`,
        `**Value Proposition:** ${ov.valueProposition || ''}`,
        `**Stage Readiness:** ${ov.stageReadiness || ''}`,
        `## B. Business Model, Revenue Model & SWOT Analysis`,
        `**Business Model & Unit Economics:** ${ba.businessModel || ''}`,
        `**Revenue Opportunities:**\n${(ba.revenueOpportunities || []).map((r: string) => `- ${r}`).join('\n')}`,
        `## C. Market Opportunity, Target Customers & Competitor Analysis`,
        `**Target Market & Customers:** ${ma.targetMarket || ''}`,
        `**Competitor Analysis:** ${ma.competitorAnalysis || ''}`,
        `**Market Positioning:** ${ma.marketPositioning || ''}`,
        `## D. Product Development, Risks & Roadmap`,
        `**MVP & Risk Mitigation:** ${pd.mvpRecommendations || ''}`,
        `**Product Roadmap:**\n${(pd.roadmap || []).map((r: string) => `- ${r}`).join('\n')}`,
        `## E. Growth Strategy & Go-To-Market Playbook`,
        `**GTM Strategy:** ${bg.gtmStrategy || ''}`,
        `**Scaling Recommendations:**\n${(bg.scalingRecommendations || []).map((r: string) => `- ${r}`).join('\n')}`,
        `## F. Funding Readiness & Financial Planning (INR ₹)`,
        `**Investment Readiness:** ${fg.investmentReadiness || ''}`,
        `**Target Round & Valuation:** ${fg.targetValuationOrAsk || ''}`,
        `**Financial Planning:** ${fg.financialPlanning || ''}`,
        `## G. 90-Day Execution Action Plan`,
        `**Immediate Priorities (Days 1–7):**\n${(ap.immediatePriorities || []).map((r: string) => `- ${r}`).join('\n')}`,
        `**Short-Term Milestones (Days 8–30):**\n${(ap.shortTermGoals || []).map((r: string) => `- ${r}`).join('\n')}`,
        `**Mid-Term Objectives (Days 31–90):**\n${(ap.midTermGoals || []).map((r: string) => `- ${r}`).join('\n')}`,
      ].join('\n\n');
    }
    return {
      analysis: parsed,
      modelUsed: response.model,
      providerUsed: response.provider,
      cached: response.cached,
    };
  }
  throw new Error('Invalid JSON structure returned by AI provider for startup analysis.');
}
