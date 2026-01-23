import { useState } from 'react';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';

export interface User {
  name: string;
  email: string;
  role: 'MANUFACTURER' | 'DISTRIBUTOR' | 'PHARMACY' | 'CUSTOMER';
  token: string;
}

export interface Medicine {
  batchID: string;
  name: string;
  manufacturer: string;
  mfgDate: string;
  expDate: string;
  currentOwner: string;
  currentOwnerRole: string;
  ownerHistory: { owner: string; role: string; date: string }[];
  verified: boolean;
}

// Mock data for demo purposes
const mockUsers = [
  { email: 'manufacturer@pharma.com', password: 'demo123', name: 'PharmaCorp Inc.', role: 'MANUFACTURER' as const },
  { email: 'distributor@pharma.com', password: 'demo123', name: 'MedDistro Ltd.', role: 'DISTRIBUTOR' as const },
  { email: 'pharmacy@pharma.com', password: 'demo123', name: 'HealthPlus Pharmacy', role: 'PHARMACY' as const },
  { email: 'customer@pharma.com', password: 'demo123', name: 'John Doe', role: 'CUSTOMER' as const },
];

const initialMedicines: Medicine[] = [
  {
    batchID: 'BATCH-001',
    name: 'Paracetamol 500mg',
    manufacturer: 'PharmaCorp Inc.',
    mfgDate: '2024-01-15',
    expDate: '2026-01-15',
    currentOwner: 'manufacturer@pharma.com',
    currentOwnerRole: 'MANUFACTURER',
    ownerHistory: [{ owner: 'PharmaCorp Inc.', role: 'MANUFACTURER', date: '2024-01-15' }],
    verified: true,
  },
  {
    batchID: 'BATCH-002',
    name: 'Amoxicillin 250mg',
    manufacturer: 'PharmaCorp Inc.',
    mfgDate: '2024-02-20',
    expDate: '2025-08-20',
    currentOwner: 'distributor@pharma.com',
    currentOwnerRole: 'DISTRIBUTOR',
    ownerHistory: [
      { owner: 'PharmaCorp Inc.', role: 'MANUFACTURER', date: '2024-02-20' },
      { owner: 'MedDistro Ltd.', role: 'DISTRIBUTOR', date: '2024-03-01' },
    ],
    verified: true,
  },
];

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>(initialMedicines);

  const handleLogin = (email: string, password: string): { success: boolean; error?: string } => {
    const foundUser = mockUsers.find((u) => u.email === email && u.password === password);
    if (foundUser) {
      setUser({
        name: foundUser.name,
        email: foundUser.email,
        role: foundUser.role,
        token: 'mock-jwt-token-' + Date.now(),
      });
      return { success: true };
    }
    return { success: false, error: 'Invalid email or password' };
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handleRegisterMedicine = (medicine: Omit<Medicine, 'currentOwner' | 'currentOwnerRole' | 'ownerHistory' | 'verified'>) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    if (user.role !== 'MANUFACTURER') return { success: false, error: 'Only manufacturers can register medicines' };
    if (medicines.find((m) => m.batchID === medicine.batchID)) {
      return { success: false, error: 'Batch ID already exists' };
    }

    const newMedicine: Medicine = {
      ...medicine,
      currentOwner: user.email,
      currentOwnerRole: user.role,
      ownerHistory: [{ owner: user.name, role: user.role, date: new Date().toISOString().split('T')[0] }],
      verified: true,
    };

    setMedicines([...medicines, newMedicine]);
    return { success: true };
  };

  const handleTransfer = (batchID: string, newOwnerEmail: string, newOwnerRole: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    const medicineIndex = medicines.findIndex((m) => m.batchID === batchID);
    if (medicineIndex === -1) return { success: false, error: 'Medicine not found' };

    const medicine = medicines[medicineIndex];
    if (medicine.currentOwner !== user.email) {
      return { success: false, error: 'You are not the current owner of this medicine' };
    }

    const newOwner = mockUsers.find((u) => u.email === newOwnerEmail);
    const ownerName = newOwner ? newOwner.name : newOwnerEmail;

    const updatedMedicine: Medicine = {
      ...medicine,
      currentOwner: newOwnerEmail,
      currentOwnerRole: newOwnerRole,
      ownerHistory: [
        ...medicine.ownerHistory,
        { owner: ownerName, role: newOwnerRole, date: new Date().toISOString().split('T')[0] },
      ],
    };

    const updatedMedicines = [...medicines];
    updatedMedicines[medicineIndex] = updatedMedicine;
    setMedicines(updatedMedicines);

    return { success: true };
  };

  const handleVerify = (batchID: string): { verified: boolean; medicine?: Medicine; error?: string } => {
    const medicine = medicines.find((m) => m.batchID === batchID);
    if (!medicine) {
      return { verified: false, error: 'Medicine not found in registry' };
    }
    return { verified: true, medicine };
  };

  const getMedicineByBatch = (batchID: string) => {
    return medicines.find((m) => m.batchID === batchID);
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <Dashboard
      user={user}
      medicines={medicines.filter((m) => m.currentOwner === user.email || user.role === 'CUSTOMER')}
      onLogout={handleLogout}
      onRegisterMedicine={handleRegisterMedicine}
      onTransfer={handleTransfer}
      onVerify={handleVerify}
      getMedicineByBatch={getMedicineByBatch}
    />
  );
}
