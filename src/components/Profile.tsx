import { useState } from 'react';
import { Building2, Save, User as UserIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { authAPI } from '../utils/api';

interface ProfileProps {
  user: {
    name: string;
    email: string;
    role: string;
    companyName?: string;
  };
  onUpdate: () => void;
  getToken: () => Promise<string | null>;
}

export function Profile({ user, onUpdate, getToken }: ProfileProps) {
  const [companyName, setCompanyName] = useState(user.companyName || '');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const token = await getToken();
      if (!token) {
        setMessage({ type: 'error', text: 'Authentication failed' });
        setIsLoading(false);
        return;
      }

      const response = await authAPI.updateProfile(token, { companyName: companyName.trim() });
      
      if (response.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully! Company name can only be changed once.' });
        // Reload the user to get updated data
        setTimeout(() => {
          onUpdate();
          window.location.reload();
        }, 1500);
      } else {
        setMessage({ type: 'error', text: response.error || 'Update failed' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Update failed' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <UserIcon className="w-6 h-6 text-indigo-500" />
          Profile Settings
        </h2>
        <p className="text-gray-500 mt-1">Manage your account information</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Account Information</h3>
        <div className="space-y-3 text-sm">
          <div>
            <label className="text-gray-500">Name:</label>
            <p className="font-medium text-gray-900">{user.name}</p>
          </div>
          <div>
            <label className="text-gray-500">Email:</label>
            <p className="font-medium text-gray-900">{user.email}</p>
          </div>
          <div>
            <label className="text-gray-500">Role:</label>
            <p className="font-medium text-gray-900">{user.role}</p>
          </div>
        </div>
      </div>

      {user.role !== 'CUSTOMER' && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Company Information</h3>
          
          {message && (
            <div
              className={`flex items-center gap-2 p-4 rounded-xl mb-4 ${
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
            <label className="text-sm font-medium text-gray-700">
              Company Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g., Pharma Industries Ltd"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                required
                disabled={!!user.companyName}
              />
            </div>
            {user.companyName ? (
              <p className="text-xs text-amber-600 font-medium">
                ⚠️ Company name can only be changed once. Contact administrator to update.
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                This name will be displayed when transferring medicines. Can only be set once.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !companyName.trim() || !!user.companyName}
            className="mt-4 w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : user.companyName ? (
              <>
                <AlertCircle className="w-5 h-5" />
                Already Set
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </form>
      )}

      {user.role === 'CUSTOMER' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="text-blue-700">
            Customers don't need to set a company name
          </p>
        </div>
      )}
    </div>
  );
}
