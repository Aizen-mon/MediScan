/**
 * API Service Layer for MediScan Frontend
 * Handles all backend API communications
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface ApiResponse<T = any> {
  success?: boolean;
  error?: string;
  message?: string;
  data?: T;
}

/**
 * Generic fetch wrapper with error handling
 */
async function fetchAPI<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  } catch (error) {
    console.error(`Network error while calling API [${endpoint}]:`, error);
    const message =
      error instanceof Error
        ? `Network error: ${error.message}`
        : `Network error while calling ${endpoint}`;
    throw new Error(message);
  }

  let data: any;
  try {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // Non-JSON response
      const text = await response.text();
      console.error(
        `Expected JSON response from API [${endpoint}], but received:`,
        text.substring(0, 200)
      );
      throw new Error(`Invalid (non-JSON) response from server`);
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error(`Failed to parse JSON response from API [${endpoint}]:`, error);
      throw new Error(`Invalid JSON response from server`);
    }
    // Re-throw other errors (e.g., the explicit non-JSON error above)
    throw error;
  }

  if (!response.ok) {
    const message =
      (data && (data.error || data.message)) || `HTTP ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}

/**
 * Get auth headers with Clerk session token
 */
function getAuthHeaders(sessionToken: string | null): HeadersInit {
  if (!sessionToken) {
    return {};
  }
  return {
    Authorization: `Bearer ${sessionToken}`,
  };
}

// ============================================
// AUTH API
// ============================================

export const authAPI = {
  /**
   * Get current user profile
   */
  getProfile: async (sessionToken: string) => {
    return fetchAPI('/auth/profile', {
      headers: getAuthHeaders(sessionToken),
    });
  },

  /**
   * Update user role (Admin only)
   */
  updateRole: async (sessionToken: string, userId: string, role: string) => {
    return fetchAPI('/auth/role', {
      method: 'PUT',
      headers: getAuthHeaders(sessionToken),
      body: JSON.stringify({ userId, role }),
    });
  },
};

// ============================================
// MEDICINE API
// ============================================

export const medicineAPI = {
  /**
   * Get list of medicines (with optional filters)
   */
  list: async (sessionToken: string, filters?: { status?: string; owner?: string }) => {
    let endpoint = '/medicine/list';
    
    if (filters && Object.keys(filters).length > 0) {
      const params: string[] = [];
      if (filters.status) params.push(`status=${encodeURIComponent(filters.status)}`);
      if (filters.owner) params.push(`owner=${encodeURIComponent(filters.owner)}`);
      endpoint += `?${params.join('&')}`;
    }
    
    return fetchAPI(endpoint, {
      headers: getAuthHeaders(sessionToken),
    });
  },

  /**
   * Register a new medicine (Manufacturer only)
   */
  register: async (sessionToken: string, medicineData: {
    batchID: string;
    name: string;
    manufacturer: string;
    mfgDate: string;
    expDate: string;
  }) => {
    return fetchAPI('/medicine/register', {
      method: 'POST',
      headers: getAuthHeaders(sessionToken),
      body: JSON.stringify(medicineData),
    });
  },

  /**
   * Transfer medicine ownership
   */
  transfer: async (sessionToken: string, batchID: string, transferData: {
    newOwnerEmail: string;
    newOwnerRole: string;
  }) => {
    return fetchAPI(`/medicine/transfer/${batchID}`, {
      method: 'POST',
      headers: getAuthHeaders(sessionToken),
      body: JSON.stringify(transferData),
    });
  },

  /**
   * Block a medicine (Admin only)
   */
  block: async (sessionToken: string, batchID: string) => {
    return fetchAPI(`/medicine/block/${batchID}`, {
      method: 'POST',
      headers: getAuthHeaders(sessionToken),
    });
  },

  /**
   * Generate QR code for a medicine
   */
  generateQR: async (sessionToken: string, batchID: string) => {
    return fetchAPI(`/medicine/qrcode/${batchID}`, {
      headers: getAuthHeaders(sessionToken),
    });
  },

  /**
   * Verify a medicine (Public - no auth required)
   */
  verify: async (batchID: string, signature: string) => {
    return fetchAPI(`/medicine/verify/${batchID}?sig=${signature}`);
  },
};

// ============================================
// LOGS API
// ============================================

export const logsAPI = {
  /**
   * Get scan logs (Admin only)
   */
  getScanLogs: async (sessionToken: string) => {
    return fetchAPI('/logs', {
      headers: getAuthHeaders(sessionToken),
    });
  },
};

// ============================================
// HEALTH CHECK
// ============================================

export const healthAPI = {
  /**
   * Check API health
   */
  check: async () => {
    return fetchAPI('/health');
  },
};

export default {
  auth: authAPI,
  medicine: medicineAPI,
  logs: logsAPI,
  health: healthAPI,
};
