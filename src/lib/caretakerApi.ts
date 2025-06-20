// src/lib/caretakerApi.ts
import { supabase } from "./supabaseClient";

export async function fetchPatientsForCaretaker(caretakerId: string) {
  return supabase
    .from("caretaker_patients")
    .select("patient_id")
    .eq("caretaker_id", caretakerId);
}

// Fetch all medications for a patient
export async function fetchPatientMedications(patientId: string) {
  return supabase
    .from("medications")
    .select("*")
    .eq("user_id", patientId);
}

// Fetch all medication logs for a patient for a given date range
export async function fetchPatientMedicationLogsForMonth(patientId: string, start: string, end: string) {
  return supabase
    .from("medication_logs")
    .select("*")
    .eq("user_id", patientId)
    .gte("date", start)
    .lte("date", end);
}