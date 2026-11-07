import React, { useState } from 'react';
import { Package, Plus, Sparkles, ExternalLink, CheckCircle2, Shield, X, IndianRupee } from 'lucide-react';
import { Resource, ResourceRequest, Startup } from '../../types';
import { formatINR } from '../../utils/currency';

interface ResourcesPageProps {
  resources: Resource[];
  resourceRequests: ResourceRequest[];
  startups: Startup[];
  onAddResource: (data: Partial<Resource>) => Promise<void>;
  onRequestResource: (resourceId: string, startupId: string, reason: string) => Promise<void>;
}

export const ResourcesPage: React.FC<ResourcesPageProps> = ({
  resources,
  resourceRequests,
  startups,
  onAddResource,
  onRequestResource,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeRequestResource, setActiveRequestResource] = useState<Resource | null>(null);
  const [selectedStartupId, setSelectedStartupId] = useState(startups[0]?.id || '');
  const [requestReason, setRequestReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New resource fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Resource['category']>('Cloud Credits');
  const [provider, setProvider] = useState('');
  const [valueAmount, setValueAmount] = useState('200000');
  const [totalUnits, setTotalUnits] = useState('15');
  const [description, setDescription] = useState('');
  const [eligibility, setEligibility] = useState('All active cohort startups');

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setIsSubmitting(true);
    await onAddResource({
      name,
      category,
      provider,
      valueAmount: Number(valueAmount),
      totalUnits: Number(totalUnits),
      availableUnits: Number(totalUnits),
      description,
      eligibility,
    });
    setIsSubmitting(false);
    setIsAddModalOpen(false);
    setName('');
    setDescription('');
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRequestResource || !selectedStartupId) return;
    setIsSubmitting(true);
    await onRequestResource(activeRequestResource.id, selectedStartupId, requestReason);
    setIsSubmitting(false);
    setActiveRequestResource(null);
    setRequestReason('');
  };

  return (
    <div className="space-y-6">
      {/* Header matching Screenshot 7 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-widest text-[#6355F4] uppercase">
            WORKSPACE
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mt-1">Resources</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Manage your inventory and current allocations.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#6355F4] hover:bg-[#5244E0] text-white text-xs font-semibold shadow-md shadow-purple-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add resource</span>
        </button>
      </div>

      {resources.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 border border-gray-100 shadow-xs flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#6355F4] flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No resources yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mt-1 mb-6">
            Add your first resource to start building your workspace data.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#6355F4] hover:bg-[#5244E0] text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Add record
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
          {resources.map((resource) => (
            <div
              key={resource.id}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-[#6355F4]">
                      {resource.category}
                    </span>
                    <h4 className="text-base font-bold text-gray-900 mt-1.5">{resource.name}</h4>
                    <p className="text-xs text-gray-400">Provided by {resource.provider}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-base font-extrabold text-gray-900">
                      {formatINR(resource.valueAmount)}
                    </span>
                    <span className="block text-[10px] text-gray-400">Per Startup</span>
                  </div>
                </div>

                <p className="text-xs text-gray-600 mb-4 leading-relaxed">{resource.description}</p>

                <div className="p-3 bg-gray-50/70 rounded-xl text-xs text-gray-500 space-y-1 mb-4">
                  <div className="flex justify-between text-[11px]">
                    <span>Available Allocations:</span>
                    <strong className="text-gray-800">
                      {resource.availableUnits} / {resource.totalUnits}
                    </strong>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Eligibility:</span>
                    <span className="text-gray-700">{resource.eligibility}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                {resource.accessUrl && (
                  <a
                    href={resource.accessUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-gray-500 hover:text-[#6355F4] flex items-center gap-1 font-medium"
                  >
                    Partner Docs <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                <button
                  onClick={() => setActiveRequestResource(resource)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#6355F4] hover:bg-[#5244E0] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer ml-auto"
                >
                  Request Allocation
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Request Resource Modal */}
      {activeRequestResource && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Request Resource</h3>
                <p className="text-xs text-gray-500">{activeRequestResource.name}</p>
              </div>
              <button
                onClick={() => setActiveRequestResource(null)}
                className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Select Startup</label>
                <select
                  value={selectedStartupId}
                  onChange={(e) => setSelectedStartupId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                >
                  {startups.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  How will your startup utilize this resource?
                </label>
                <textarea
                  rows={3}
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder="e.g. Scaling our AI clinical inference workload on Cloud Run..."
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#6355F4] hover:bg-[#5244E0] text-white font-semibold text-xs py-3 rounded-xl shadow-md transition-all cursor-pointer mt-2"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Allocation Request'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Resource Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Add Resource Perk</h3>
                <p className="text-xs text-gray-500">Create a new partner credit or tool allocation</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateResource} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Resource Title</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. AWS Activate (₹20 Lakhs Credits)"
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                  >
                    <option value="Cloud Credits">Cloud Credits</option>
                    <option value="Legal & IP">Legal & IP</option>
                    <option value="Coworking & Labs">Coworking & Labs</option>
                    <option value="Prototyping">Prototyping</option>
                    <option value="Marketing & PR">Marketing & PR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Provider</label>
                  <input
                    type="text"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    placeholder="Amazon Web Services"
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Perk Value (₹)</label>
                  <input
                    type="number"
                    value={valueAmount}
                    onChange={(e) => setValueAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Total Available Units</label>
                  <input
                    type="number"
                    value={totalUnits}
                    onChange={(e) => setTotalUnits(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Terms, credits duration, and activation process..."
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#6355F4]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#6355F4] hover:bg-[#5244E0] text-white font-semibold text-xs py-3 rounded-xl shadow-md transition-all cursor-pointer mt-2"
              >
                {isSubmitting ? 'Saving...' : 'Add Resource Perk'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
