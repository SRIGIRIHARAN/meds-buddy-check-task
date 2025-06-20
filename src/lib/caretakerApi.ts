// src/lib/caretakerApi.ts
import { supabase } from "./supabaseClient";

export async function fetchPatientsForCaretaker(caretakerId: string) {
  return supabase
    .from("caretaker_patients")
    .select("patient_id")
    .eq("caretaker_id", caretakerId);
}