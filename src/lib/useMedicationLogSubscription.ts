// src/lib/useMedicationLogSubscription.ts
import { useEffect } from "react";
import { supabase } from "./supabaseClient";
import { MedicationLog } from "@/types/medicationLog";

export function useMedicationLogSubscription(
  patientId: string,
  onChange: (payload: { new: MedicationLog; old: MedicationLog | null; eventType: string }) => void
) {
  useEffect(() => {
    if (!patientId) return;

    const channel = supabase
      .channel('medication_logs')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'medication_logs',
          filter: `user_id=eq.${patientId}`,
        },
        (payload) => {
          onChange({
            new: payload.new as MedicationLog,
            old: payload.old as MedicationLog | null,
            eventType: payload.eventType,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [patientId, onChange]);
}