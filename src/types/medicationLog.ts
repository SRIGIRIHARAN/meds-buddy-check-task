export interface MedicationLog {
    id: string;
    user_id: string;
    medication_id: string;
    date: string; // YYYY-MM-DD
    taken: boolean;
    proof_photo_url?: string;
    created_at: string;
  }