import { supabase } from "./supabaseClient";
import { MedicationLog } from "@/types/medicationLog";

export async function fetchMedicationLog(userId: string, medicationId: string, date: string) {
  return supabase
    .from("medication_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("medication_id", medicationId)
    .eq("date", date)
    .single();
}

export async function markMedicationAsTaken({
  user_id,
  medication_id,
  date,
  proof_photo_url,
}: {
  user_id: string;
  medication_id: string;
  date: string;
  proof_photo_url?: string;
}) {
  return supabase
    .from("medication_logs")
    .upsert([
      {
        user_id,
        medication_id,
        date,
        taken: true,
        proof_photo_url: proof_photo_url || null,
      },
    ], { onConflict: "user_id,medication_id,date" });
}

export async function fetchMedicationLogsForToday(userId: string, date: string) {
    return supabase
      .from("medication_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date);
  }

  export async function fetchMedicationLogsForMonth(userId: string, year: number, month: number) {
    // month: 1-based (1=Jan, 12=Dec)
    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = new Date(year, month, 0).getDate(); // last day of month
    const end = `${year}-${String(month).padStart(2, "0")}-${endDate}`;
    return supabase
      .from("medication_logs")
      .select("*")
      .eq("user_id", userId)
      .gte("date", start)
      .lte("date", end);
  }