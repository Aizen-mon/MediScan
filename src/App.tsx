import { useEffect, useState } from 'react';
import { useUser, useAuth, SignIn, SignedIn, SignedOut } from '@clerk/clerk-react';
import { Dashboard } from './components/Dashboard';
import { medicineAPI } from './utils/api';

export interface User {
  name: string;
  email: string;
  role: 'MANUFACTURER' | 'DISTRIBUTOR' | 'PHARMACY' | 'CUSTOMER' | 'ADMIN';
  token: string;
}

export interface Medicine {
  batchID: string;
  name: string;
  manufacturer: string;
  mfgDate: string;
  expDate: string;
  currentOwner: string;
  currentOwnerRole?: string;
  ownerHistory: { owner: string; role: string; date?: string; time?: string }[];
  verified?: boolean;
  status?: string;
}

export function App() {
  const { user: clerkUser, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isLoadingMedicines, setIsLoadingMedicines] = useState(false);

  // Sync Clerk user with our User state
  useEffect(() => {
    if (isLoaded && clerkUser) {
      const role = (clerkUser.publicMetadata?.role as string) || 'CUSTOMER';
      const primaryEmail = clerkUser.primaryEmailAddress?.emailAddress;
      
      // Validate that user has a valid email address
      if (!primaryEmail) {
        console.error('User does not have a valid email address');
        return;
      }
      
      setUser({
        name: clerkUser.fullName || clerkUser.firstName || 'User',
        email: primaryEmail,
        role: role as User['role'],
        token: '', // Will be set when needed
      });
    } else if (isLoaded && !clerkUser) {
      setUser(null);
      setMedicines([]);
    }
  }, [clerkUser, isLoaded]);

  // Load medicines when user is authenticated
  useEffect(() => {
    const loadMedicines = async () => {
      if (!user) return;
      
      setIsLoadingMedicines(true);
      try {
        const token = await getToken();
        if (!token) return;

        // Load medicines based on user role
        // Non-customers (manufacturers, distributors, pharmacies) see only their own medicines
        // Customers can verify any medicine but don't load all by default
        const filters = user.role !== 'CUSTOMER' ? { owner: user.email } : {};
        const response = await medicineAPI.list(token, filters);
        
        if (response.success && response.medicines) {
          setMedicines(response.medicines);
        }
      } catch (error) {
        console.error('Failed to load medicines:', error);
      } finally {
        setIsLoadingMedicines(false);
      }
    };

    loadMedicines();
  }, [user, getToken]);

  const handleLogout = () => {
    setUser(null);
    setMedicines([]);
  };

  const handleRegisterMedicine = async (
    medicine: Omit<Medicine, 'currentOwner' | 'currentOwnerRole' | 'ownerHistory' | 'verified'>
  ) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    if (user.role !== 'MANUFACTURER') {
      return { success: false, error: 'Only manufacturers can register medicines' };
    }

    try {
      const token = await getToken();
      if (!token) return { success: false, error: 'Failed to get authentication token' };

      console.log('Registering medicine:', medicine);
      console.log('Using token:', token ? 'Token present' : 'No token');

      const response = await medicineAPI.register(token, {
        batchID: medicine.batchID,
        name: medicine.name,
        manufacturer: medicine.manufacturer,
        mfgDate: medicine.mfgDate,
        expDate: medicine.expDate,
      });

      console.log('Register response:', response);

      if (response.success) {
        // Reload medicines to get the updated list
        const listResponse = await medicineAPI.list(token, { owner: user.email });
        if (listResponse.success && listResponse.medicines) {
          setMedicines(listResponse.medicines);
        }
        return { success: true };
      }

      return { success: false, error: response.error || response.message || 'Registration failed' };
    } catch (error: any) {
      console.error('Registration error:', error);
      return { success: false, error: error.message || 'Registration failed' };
    }
  };

  const handleTransfer = async (batchID: string, newOwnerEmail: string, newOwnerRole: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const token = await getToken();
      if (!token) return { success: false, error: 'Failed to get authentication token' };

      const response = await medicineAPI.transfer(token, batchID, {
        newOwnerEmail,
        newOwnerRole,
      });

      if (response.success) {
        // Reload medicines to get the updated list
        const filters = user.role !== 'CUSTOMER' ? { owner: user.email } : {};
        const listResponse = await medicineAPI.list(token, filters);
        if (listResponse.success && listResponse.medicines) {
          setMedicines(listResponse.medicines);
        }
        return { success: true };
      }

      return { success: false, error: response.error || 'Transfer failed' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Transfer failed' };
    }
  };

  const handleVerify = async (
    batchID: string
  ): Promise<{ verified: boolean; medicine?: Medicine; error?: string }> => {
    try {
      // First check if medicine exists in our local list
      const localMedicine = medicines.find((m) => m.batchID === batchID);
      if (localMedicine) {
        return { verified: true, medicine: localMedicine };
      }
      
      // If not found locally and user is authenticated, try to fetch from backend
      if (user) {
        try {
          const token = await getToken();
          if (token) {
            const response = await medicineAPI.list(token, { batchID });
            if (response.success && response.medicines && response.medicines.length > 0) {
              return { verified: true, medicine: response.medicines[0] };
            }
          }
        } catch (error: any) {
          console.error('Backend verification failed:', error);
          // Fall through to not found error
        }
      }
      
      return { verified: false, error: 'Medicine not found in registry' };
    } catch (error: any) {
      return { verified: false, error: error.message || 'Verification failed' };
    }
  };

  const getMedicineByBatch = (batchID: string) => {
    return medicines.find((m) => m.batchID === batchID);
  };

  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SignedOut>
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">MediScan</h1>
              <p className="text-gray-600">Medicine Verification System</p>
              <p className="text-sm text-gray-500 mt-2">
                Sign in to access the platform
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <SignIn 
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "shadow-none"
                  }
                }}
              />
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-semibold text-blue-900 mb-2">📌 Important: Setting Up User Roles</p>
              <p className="text-xs text-blue-800 mb-2">
                After signing up, you need to set your role in Clerk Dashboard:
              </p>
              <ol className="text-xs text-blue-800 space-y-1 ml-4 list-decimal">
                <li>Go to Clerk Dashboard → Users</li>
                <li>Click on your user</li>
                <li>Go to "Metadata" tab</li>
                <li>Add to Public Metadata: <code className="bg-blue-100 px-1 rounded">{"{ \"role\": \"MANUFACTURER\" }"}</code></li>
              </ol>
              <p className="text-xs text-blue-700 mt-2">
                Available roles: MANUFACTURER, DISTRIBUTOR, PHARMACY, CUSTOMER, ADMIN
              </p>
            </div>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        {user && (
          <Dashboard
            user={user}
            medicines={medicines}
            isLoadingMedicines={isLoadingMedicines}
            onLogout={handleLogout}
            onRegisterMedicine={handleRegisterMedicine}
            onTransfer={handleTransfer}
            onVerify={handleVerify}
            getMedicineByBatch={getMedicineByBatch}
          />
        )}
      </SignedIn>
    </>
  );
}
