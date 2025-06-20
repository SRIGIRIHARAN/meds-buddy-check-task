import { supabase } from "./supabaseClient";
import { Medication } from "@/types/medication";

export async function fetchMedications(userId: string) {
  return supabase
    .from("medications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
}

export async function addMedication(med: Omit<Medication, "id" | "created_at">) {
  return supabase
    .from("medications")
    .insert([med])
    .select()
    .single();
}

export async function deleteMedication(id: string, userId: string) {
  return supabase
    .from("medications")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
}

export async function updateMedication(id: string, userId: string, updates: Partial<Omit<Medication, "id" | "user_id" | "created_at">>) {
    return supabase
      .from("medications")
      .update(updates)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();
  }