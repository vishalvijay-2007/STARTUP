import React from 'react';

interface SvgIconProps {
  className?: string;
  size?: number | string;
}

export const SvgRupeeSymbol: React.FC<SvgIconProps> = ({ className = 'w-4 h-4', size }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <path d="M6 3h12" />
    <path d="M6 8h12" />
    <path d="M6 3v13" />
    <path d="M12 3c4 0 7 2 7 5.5S16 14 12 14" />
    <path d="M11 14l8 7" />
  </svg>
);

export const SvgDockerWhale: React.FC<SvgIconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* Containers */}
    <rect x="7" y="5" width="2" height="2" />
    <rect x="10" y="5" width="2" height="2" />
    <rect x="4" y="8" width="2" height="2" />
    <rect x="7" y="8" width="2" height="2" />
    <rect x="10" y="8" width="2" height="2" />
    <rect x="13" y="8" width="2" height="2" />
    <rect x="4" y="11" width="2" height="2" />
    <rect x="7" y="11" width="2" height="2" />
    <rect x="10" y="11" width="2" height="2" />
    <rect x="13" y="11" width="2" height="2" />
    {/* Whale hull & tail */}
    <path d="M2 13c1 4 4 6 9 6 7 0 10-4 11-7-1 0-3-1-4-1-1 0-2 1-3 1-3 0-5-2-5-5-2 0-6 2-8 6z" />
  </svg>
);

export const SvgRocketIcon: React.FC<SvgIconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    <circle cx="15" cy="9" r="1" fill="currentColor" />
  </svg>
);

export const SvgShieldVerified: React.FC<SvgIconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const SvgGrowthAnalytics: React.FC<SvgIconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
    <path d="M3 13l6-6 4 4 8-8" />
  </svg>
);
