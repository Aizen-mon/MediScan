import { useState } from 'react';
import { ArrowRightLeft, Mail, UserCircle, Package, CheckCircle2, AlertCircle } from 'lucide-react';
import type { Medicine } from '../App';

interface TransferOwnershipProps {
  medicines: Medicine[];
  onTransfer: (batchID: string, newOwnerEmail: string, newOwnerRole: string) => { success: boolean; error?: string };
}

export function TransferOwnership({ medicines, onTransfer }: TransferOwnershipProps) {
  const [formData, setFormData] = useState({
    batchID: '',
    newOwnerEmail: '',
    newOwnerRole: 'DISTRIBUTOR',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const result = onTransfer(formData.batchID, formData.newOwnerEmail, formData.newOwnerRole);
    if (result.success) {
      setMessage({ type: 'success', text: 'Ownership transferred successfully!' });
      setFormData({ batchID: '', newOwnerEmail: '', newOwnerRole: 'DISTRIBUTOR' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Transfer failed' });
    }
    setIsLoading(false);
  };

  const roles = ['DISTRIBUTOR', 'PHARMACY', 'CUSTOMER'];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <ArrowRightLeft className="w-6 h-6 text-blue-500" />
          Transfer Ownership
        </h2>
        <p className="text-gray-500 mt-1">Transfer medicine ownership to another party</p>
      </div>

      {medicines.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">You don't own any medicines to transfer</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
          {message && (
            <div
              className={`flex items-center gap-2 p-4 rounded-xl ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-100 text-green-700'
                  : 'bg-red-50 border border-red-100 text-red-700'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              {message.text}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Select Medicine</label>
            <div className="relative">
              <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={formData.batchID}
                onChange={(e) => setFormData({ ...formData, batchID: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                required
              >
                <option value="">Select a medicine batch</option>
                {medicines.map((med) => (
                  <option key={med.batchID} value={med.batchID}>
                    {med.batchID} - {med.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">New Owner Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={formData.newOwnerEmail}
                onChange={(e) => setFormData({ ...formData, newOwnerEmail: e.target.value })}
                placeholder="e.g., distributor@pharma.com"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">New Owner Role</label>
            <div className="relative">
              <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={formData.newOwnerRole}
                onChange={(e) => setFormData({ ...formData, newOwnerRole: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                required
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <ArrowRightLeft className="w-5 h-5" />
                Transfer Ownership
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
