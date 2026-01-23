import { Package, Calendar, Building2, User, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { Medicine } from '../App';

interface MedicineListProps {
  medicines: Medicine[];
  userRole: string;
  isLoading?: boolean;
}

export function MedicineList({ medicines, userRole, isLoading }: MedicineListProps) {
  const roleColors: Record<string, string> = {
    MANUFACTURER: 'bg-purple-100 text-purple-700',
    DISTRIBUTOR: 'bg-blue-100 text-blue-700',
    PHARMACY: 'bg-green-100 text-green-700',
    CUSTOMER: 'bg-orange-100 text-orange-700',
  };

  const isExpired = (expDate: string) => {
    return new Date(expDate) < new Date();
  };

  const isExpiringSoon = (expDate: string) => {
    const exp = new Date(expDate);
    const now = new Date();
    const threeMonths = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    return exp > now && exp < threeMonths;
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="w-6 h-6 text-indigo-500" />
          {userRole === 'CUSTOMER' ? 'All Medicines' : 'Your Medicines'}
        </h2>
        <p className="text-gray-500 mt-1">
          {userRole === 'CUSTOMER'
            ? 'View all medicines in the system'
            : 'Medicines currently under your ownership'}
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-1">Loading medicines...</h3>
          <p className="text-gray-400">Please wait</p>
        </div>
      ) : medicines.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-1">No medicines found</h3>
          <p className="text-gray-400">
            {userRole === 'MANUFACTURER'
              ? 'Register your first medicine to get started'
              : 'No medicines are currently assigned to you'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {medicines.map((medicine) => (
            <div
              key={medicine.batchID}
              className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-gray-300 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 line-clamp-1">{medicine.name}</h3>
                    <p className="text-xs text-gray-500">{medicine.batchID}</p>
                  </div>
                </div>
                {medicine.verified && (
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="truncate">{medicine.manufacturer}</span>
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>MFG: {medicine.mfgDate}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span
                    className={`${
                      isExpired(medicine.expDate)
                        ? 'text-red-600 font-medium'
                        : isExpiringSoon(medicine.expDate)
                        ? 'text-amber-600 font-medium'
                        : 'text-gray-600'
                    }`}
                  >
                    EXP: {medicine.expDate}
                  </span>
                  {isExpired(medicine.expDate) && (
                    <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                      Expired
                    </span>
                  )}
                  {isExpiringSoon(medicine.expDate) && !isExpired(medicine.expDate) && (
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className={`text-xs px-2 py-0.5 rounded-full ${roleColors[medicine.currentOwnerRole]}`}>
                    {medicine.currentOwnerRole}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  {medicine.ownerHistory.length} owner{medicine.ownerHistory.length !== 1 ? 's' : ''} in chain
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
