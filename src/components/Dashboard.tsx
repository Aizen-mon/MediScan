import { useState } from 'react';
import { useClerk, useAuth } from '@clerk/clerk-react';
import {
  Shield,
  LogOut,
  Package,
  QrCode,
  ArrowRightLeft,
  CheckCircle2,
  User,
  Menu,
  X,
  Pill,
  ShoppingCart,
} from 'lucide-react';
import type { User as UserType, Medicine } from '../App';
import { RegisterMedicine } from './RegisterMedicine';
import { TransferOwnership } from './TransferOwnership';
import { GenerateQR } from './GenerateQR';
import { VerifyMedicine } from './VerifyMedicine';
import { MedicineList } from './MedicineList';
import { PurchaseMedicine } from './PurchaseMedicine';
import { Profile } from './Profile';

interface DashboardProps {
  user: UserType;
  medicines: Medicine[];
  isLoadingMedicines?: boolean;
  onLogout: () => void;
  onRegisterMedicine: (
    medicine: Omit<Medicine, 'currentOwner' | 'currentOwnerRole' | 'ownerHistory' | 'verified'>
  ) => { success: boolean; error?: string };
  onTransfer: (batchID: string, newOwnerEmail: string, newOwnerRole: string, unitsToTransfer: number) => Promise<{ success: boolean; error?: string }>;
  onPurchase: (batchID: string, unitsPurchased: number, customerEmail: string) => Promise<{ success: boolean; error?: string }>;
  onVerify: (batchID: string) => { verified: boolean; medicine?: Medicine; error?: string };
  getMedicineByBatch: (batchID: string) => Medicine | undefined;
}

type Tab = 'overview' | 'register' | 'transfer' | 'purchase' | 'qrcode' | 'verify' | 'profile';

const roleColors: Record<string, string> = {
  MANUFACTURER: 'bg-purple-100 text-purple-700',
  DISTRIBUTOR: 'bg-blue-100 text-blue-700',
  PHARMACY: 'bg-green-100 text-green-700',
  CUSTOMER: 'bg-orange-100 text-orange-700',
  ADMIN: 'bg-red-100 text-red-700',
};

export function Dashboard({
  user,
  medicines,
  isLoadingMedicines,
  onLogout,
  onRegisterMedicine,
  onTransfer,
  onPurchase,
  onVerify,
  getMedicineByBatch,
}: DashboardProps) {
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    onLogout();
  };

  const tabs = [
    { id: 'overview' as Tab, label: 'Overview', icon: Package, show: true },
    { id: 'register' as Tab, label: 'Register Medicine', icon: Pill, show: user.role === 'MANUFACTURER' },
    { id: 'transfer' as Tab, label: 'Transfer', icon: ArrowRightLeft, show: user.role !== 'CUSTOMER' },
    { id: 'purchase' as Tab, label: 'Process Sale', icon: ShoppingCart, show: user.role === 'PHARMACY' || user.role === 'DISTRIBUTOR' },
    { id: 'qrcode' as Tab, label: 'QR Code', icon: QrCode, show: true },
    { id: 'verify' as Tab, label: 'Verify', icon: CheckCircle2, show: true },
    { id: 'profile' as Tab, label: 'Profile', icon: User, show: true },
  ].filter((tab) => tab.show);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-900 hidden sm:block">MediScan</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${roleColors[user.role]}`}>
                    {user.role}
                  </span>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-xl"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white p-4">
            <div className="flex flex-col gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 mb-8 text-white shadow-lg shadow-emerald-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">Welcome back, {user.name}!</h1>
              <p className="text-emerald-100">
                {user.role === 'MANUFACTURER'
                  ? 'Manage and register new medicines'
                  : user.role === 'DISTRIBUTOR'
                  ? 'Track and transfer medicine ownership'
                  : user.role === 'PHARMACY'
                  ? 'Verify and dispense medicines safely'
                  : 'Verify your medicine authenticity'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold">{medicines.length}</p>
                <p className="text-sm text-emerald-100">Total Medicines</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {activeTab === 'overview' && (
            <MedicineList medicines={medicines} userRole={user.role} userEmail={user.email} isLoading={isLoadingMedicines} />
          )}
          {activeTab === 'register' && user.role === 'MANUFACTURER' && (
            <RegisterMedicine onRegister={onRegisterMedicine} />
          )}
          {activeTab === 'transfer' && (
            <TransferOwnership
              medicines={medicines}
              getToken={getToken}
              onTransfer={onTransfer}
              userEmail={user.email}
            />
          )}
          {activeTab === 'purchase' && (user.role === 'PHARMACY' || user.role === 'DISTRIBUTOR') && (
            <PurchaseMedicine
              medicines={medicines}
              onPurchase={onPurchase}
              userEmail={user.email}
            />
          )}
          {activeTab === 'qrcode' && (
            <GenerateQR getMedicineByBatch={getMedicineByBatch} />
          )}
          {activeTab === 'verify' && <VerifyMedicine onVerify={onVerify} />}
          {activeTab === 'profile' && (
            <Profile user={user} getToken={getToken} onUpdate={() => {}} />
          )}
        </div>
      </main>
    </div>
  );
}
