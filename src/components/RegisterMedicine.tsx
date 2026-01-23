import { useState } from 'react';
import { Pill, Calendar, Building2, Hash, CheckCircle2, AlertCircle } from 'lucide-react';
import type { Medicine } from '../App';

interface RegisterMedicineProps {
  onRegister: (
    medicine: Omit<Medicine, 'currentOwner' | 'currentOwnerRole' | 'ownerHistory' | 'verified'>
  ) => { success: boolean; error?: string };
}

export function RegisterMedicine({ onRegister }: RegisterMedicineProps) {
  const [formData, setFormData] = useState({
    batchID: '',
    name: '',
    manufacturer: '',
    mfgDate: '',
    expDate: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const result = onRegister(formData);
    if (result.success) {
      setMessage({ type: 'success', text: 'Medicine registered successfully!' });
      setFormData({ batchID: '', name: '', manufacturer: '', mfgDate: '', expDate: '' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Registration failed' });
    }
    setIsLoading(false);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Pill className="w-6 h-6 text-emerald-500" />
          Register New Medicine
        </h2>
        <p className="text-gray-500 mt-1">Add a new medicine to the verification system</p>
      </div>

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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Batch ID</label>
            <div className="relative">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.batchID}
                onChange={(e) => setFormData({ ...formData, batchID: e.target.value })}
                placeholder="e.g., BATCH-003"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Medicine Name</label>
            <div className="relative">
              <Pill className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Aspirin 100mg"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Manufacturer</label>
          <div className="relative">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={formData.manufacturer}
              onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              placeholder="e.g., PharmaCorp Inc."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Manufacturing Date</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={formData.mfgDate}
                onChange={(e) => setFormData({ ...formData, mfgDate: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Expiry Date</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={formData.expDate}
                onChange={(e) => setFormData({ ...formData, expDate: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Register Medicine
            </>
          )}
        </button>
      </form>
    </div>
  );
}
