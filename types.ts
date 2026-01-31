
export interface Medication {
  id: string;
  name: string;
  dosage: string;
  refNumber: string; // الرقم المكتوب على الدواء
  currentStock: number;
  minThreshold: number;
  category: string;
  expiryDate: string;
  imageUrl?: string;
  lastUpdated: string;
  type: 'drug' | 'vaccine_adult' | 'vaccine_child';
}

export interface AdministrationLog {
  id: string;
  medicationId: string;
  medicationName: string;
  quantityGiven: number;
  preCount: number;
  postCount: number;
  adminBy: string;
  patientId: string;
  timestamp: string;
  verified: boolean;
  notes?: string;
}

export interface PharmacyRequest {
  id: string;
  items: {
    medicationId: string;
    name: string;
    quantity: number;
  }[];
  requestDate: string;
  receiveDate?: string;
  nurseManagerSignature: string;
  pharmacistSignature?: string;
  status: 'pending' | 'received';
}

export interface DisposalRecord {
  id: string;
  items: {
    medicationId: string;
    name: string;
    quantity: number;
    reason: 'expired' | 'surplus';
  }[];
  requestDate: string;
  completionDate?: string;
  nurseSignature: string;
  supervisorSignature?: string;
  status: 'pending' | 'completed';
}

export interface PillCountResult {
  count: number;
  confidence: number;
  identifiedMedication?: string;
  warning?: string;
}

export type ViewState = 'login' | 'dashboard' | 'inventory' | 'administer' | 'history' | 'patients' | 'vaccinations_adult' | 'vaccinations_child' | 'pharmacy_request' | 'disposal';
