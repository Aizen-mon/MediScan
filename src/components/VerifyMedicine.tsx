import { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Search,
  Package,
  Shield,
  Clock,
  Building2,
  Calendar,
  User,
  ArrowRight,
  Box,
} from 'lucide-react';
import type { Medicine } from '../App';

interface VerifyMedicineProps {
  onVerify: (batchID: string) => { verified: boolean; medicine?: Medicine; error?: string };
}

export function VerifyMedicine({ onVerify }: VerifyMedicineProps) {
  const [batchID, setBatchID] = useState('');
  const [result, setResult] = useState<{ verified: boolean; medicine?: Medicine; error?: string } | null>(
    null
  );
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    if (!batchID.trim()) return;

    setIsVerifying(true);
    setResult(null);

    await new Promise((resolve) => setTimeout(resolve, 800));

    const verifyResult = onVerify(batchID);
    setResult(verifyResult);
    setIsVerifying(false);
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      MANUFACTURER: 'bg-purple-100 text-purple-700 border-purple-200',
      DISTRIBUTOR: 'bg-blue-100 text-blue-700 border-blue-200',
      PHARMACY: 'bg-green-100 text-green-700 border-green-200',
      CUSTOMER: 'bg-orange-100 text-orange-700 border-orange-200',
    };
    return colors[role] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="w-6 h-6 text-green-500" />
          Verify Medicine
        </h2>
        <p className="text-gray-500 mt-1">Check medicine authenticity and ownership history</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={batchID}
              onChange={(e) => setBatchID(e.target.value)}
              placeholder="Enter Batch ID to verify (e.g., BATCH-001)"
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
            />
          </div>
          <button
            onClick={handleVerify}
            disabled={isVerifying || !batchID.trim()}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-green-200 hover:shadow-xl hover:shadow-green-300 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
          >
            {isVerifying ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Search className="w-5 h-5" />
                Verify
              </>
            )}
          </button>
        </div>

        {result && (
          <div
            className={`rounded-2xl overflow-hidden ${
              result.verified
                ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200'
                : 'bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200'
            }`}
          >
            {/* Status Header */}
            <div
              className={`p-4 flex items-center gap-3 ${
                result.verified ? 'bg-green-100/50' : 'bg-red-100/50'
              }`}
            >
              {result.verified ? (
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              ) : (
                <XCircle className="w-8 h-8 text-red-600" />
              )}
              <div>
                <h3 className={`text-lg font-bold ${result.verified ? 'text-green-800' : 'text-red-800'}`}>
                  {result.verified ? '✓ Verified Authentic' : '✗ Verification Failed'}
                </h3>
                <p className={result.verified ? 'text-green-600' : 'text-red-600'}>
                  {result.verified
                    ? 'This medicine is registered and authenticated'
                    : result.error || 'Medicine not found in the registry'}
                </p>
              </div>
            </div>

            {/* Medicine Details */}
            {result.medicine && (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-4 bg-white rounded-xl shadow-sm">
                    <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Medicine Name</p>
                      <p className="font-semibold text-gray-900">{result.medicine.name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-white rounded-xl shadow-sm">
                    <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Manufacturer</p>
                      <p className="font-semibold text-gray-900">{result.medicine.manufacturer}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-white rounded-xl shadow-sm">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Manufacturing Date</p>
                      <p className="font-semibold text-gray-900">{result.medicine.mfgDate}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-white rounded-xl shadow-sm">
                    <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Expiry Date</p>
                      <p className="font-semibold text-gray-900">{result.medicine.expDate}</p>
                    </div>
                  </div>
                  {result.medicine.totalUnits !== undefined && (
                    <div className="flex items-start gap-3 p-4 bg-white rounded-xl shadow-sm">
                      <Box className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Stock Status</p>
                        <p className="font-semibold text-gray-900">
                          {result.medicine.remainingUnits ?? result.medicine.totalUnits} / {result.medicine.totalUnits} units
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Ownership History */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Ownership History
                  </h4>
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                    <div className="space-y-4">
                      {result.medicine.ownerHistory.map((entry, index) => (
                        <div key={index} className="relative flex items-start gap-4 pl-10">
                          <div
                            className={`absolute left-2.5 w-3 h-3 rounded-full ${
                              index === result.medicine!.ownerHistory.length - 1
                                ? 'bg-green-500 ring-4 ring-green-100'
                                : 'bg-gray-300'
                            }`}
                          />
                          <div className="flex-1 p-3 bg-white rounded-lg shadow-sm border border-gray-100">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium text-gray-900">{entry.owner}</span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full border ${getRoleColor(
                                  entry.role
                                )}`}
                              >
                                {entry.role}
                              </span>
                              {index < result.medicine!.ownerHistory.length - 1 && (
                                <ArrowRight className="w-4 h-4 text-gray-300" />
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{entry.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
