// src/components/PatientRealtimeLogs.tsx
import { useEffect, useState, useCallback } from "react";
import { fetchMedicationLogsForMonth } from "@/lib/medicationLogApi";
import { useMedicationLogSubscription } from "@/lib/useMedicationLogSubscription";
import { MedicationLog } from "@/types/medicationLog";
import { format } from "date-fns";
import { supabase } from "@/lib/supabaseClient";

interface Props {
  patientId: string;
}

export default function PatientRealtimeLogs({ patientId }: Props) {
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [loading, setLoading] = useState(true);
  

  // Fetch logs for this month
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const { data, error } = await fetchMedicationLogsForMonth(
      patientId,
      now.getFullYear(),
      now.getMonth() + 1
    );
    if (!error && data) setLogs(data);
    setLoading(false);
  }, [patientId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Subscribe to real-time updates
  useMedicationLogSubscription(patientId, ({ new: newLog, eventType }) => {
    setLogs((prev) => {
      if (eventType === "INSERT" || eventType === "UPDATE") {
        // Replace or add
        const idx = prev.findIndex(
          (l) => l.medication_id === newLog.medication_id && l.date === newLog.date
        );
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = newLog;
          return updated;
        }
        return [...prev, newLog];
      } else if (eventType === "DELETE") {
        return prev.filter(
          (l) => !(l.medication_id === newLog.medication_id && l.date === newLog.date)
        );
      }
      return prev;
    });
  });

  // Calculate adherence
  const total = logs.length;
  const taken = logs.filter((l) => l.taken).length;
  const adherence = total ? Math.round((taken / total) * 100) : 0;

  return (
    <div>
      <h3 className="text-lg font-bold mb-2">Patient Medication Logs (Real-Time)</h3>
      <div>Adherence this month: <b>{adherence}%</b></div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <ul className="mt-2 space-y-1">
          {logs
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((log) => (
              <li key={log.id} className="flex items-center gap-2">
                <span>{format(new Date(log.date), "MMM d")}</span>
                <span>{log.taken ? "✅ Taken" : "❌ Missed"}</span>
                {log.proof_photo_url && (
                  <a
                    href={supabase.storage.from('proof-photos').getPublicUrl(log.proof_photo_url).data.publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    📷
                  </a>
                )}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}