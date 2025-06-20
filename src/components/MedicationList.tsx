import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchMedications, deleteMedication, updateMedication } from "@/lib/medicationApi";
import { fetchMedicationLogsForToday, markMedicationAsTaken } from "@/lib/medicationLogApi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Trash2, Pencil, Check, X, Image as ImageIcon } from "lucide-react";
import { Medication } from "@/types/medication";
import { format } from "date-fns";
import { supabase } from "@/lib/supabaseClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const frequencies = [
  "Once daily",
  "Twice daily",
  "Every other day",
  "Weekly",
  "As needed"
];

const todayStr = format(new Date(), "yyyy-MM-dd");

const MedicationList = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ name: string; dosage: string; frequency: string }>({
    name: "",
    dosage: "",
    frequency: frequencies[0],
  });
  const [proofPhoto, setProofPhoto] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch all medications
  const { data: medications, isLoading, isError } = useQuery({
    queryKey: ["medications", user!.id],
    queryFn: async () => {
      const { data, error } = await fetchMedications(user!.id);
      if (error) throw error;
      return data as Medication[];
    }
  });

  const { data: logsData } = useQuery({
    queryKey: ["medication_logs_today", user!.id, todayStr],
    queryFn: async () => {
      const { data, error } = await fetchMedicationLogsForToday(user!.id, todayStr);
      if (error) throw error;
      return data || [];
    }
  });

  const logsMap = new Map<string, any>();
  if (logsData) {
    for (const log of logsData) {
      logsMap.set(log.medication_id, log);
    }
  }

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('delete_medication_and_logs', { 
        medication_id_to_delete: id 
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Medication Deleted", description: "The medication and its logs have been removed.", variant: "default" });
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      queryClient.invalidateQueries({ queryKey: ['medication_logs_today'] });
      queryClient.invalidateQueries({ queryKey: ['medication_logs_month'] });
      queryClient.invalidateQueries({ queryKey: ['caretaker_logs'] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: { name: string; dosage: string; frequency: string } }) => {
      const { error } = await updateMedication(id, user!.id, updates);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Medication updated", variant: "default" });
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["medications", user!.id] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const markAsTakenMutation = useMutation({
    mutationFn: async ({ medication_id, proofPhoto }: { medication_id: string; proofPhoto?: File }) => {
      let proof_photo_url: string | undefined = undefined;
      if (proofPhoto) {
        setUploading(true);
        const { data, error } = await supabase.storage
          .from("proof-photos")
          .upload(`${user!.id}/${medication_id}/${todayStr}-${proofPhoto.name}`, proofPhoto, { upsert: true });
        setUploading(false);
        if (error) throw error;
        proof_photo_url = data?.path;
      }
      const { error } = await markMedicationAsTaken({
        user_id: user!.id,
        medication_id,
        date: todayStr,
        proof_photo_url,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Medication marked as taken!", variant: "default" });
      queryClient.invalidateQueries({ queryKey: ["medication_logs_today", user!.id, todayStr] });
      setProofPhoto(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  if (isLoading) return <div>Loading medications...</div>;
  if (isError) return <div className="text-red-500">Failed to load medications.</div>;
  if (!medications || medications.length === 0) return <div className="text-center text-muted-foreground">No medications added yet.</div>;

  return (
    <>
      <div className="space-y-4">
        {medications.map(med => {
          const log = logsMap.get(med.id);

          if (log && log.taken) {
            return (
              <Card key={med.id} className="bg-green-50 border-green-200">
                <CardContent className="flex flex-col md:flex-row items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Check className="w-8 h-8 text-green-600" />
                    <div>
                      <div className="font-bold text-lg text-green-800">Medication Completed!</div>
                      <div className="text-green-700">Great job! You've taken <b>{med.name}</b> for {todayStr}.</div>
                      {log.proof_photo_url && (
                        <a
                          href={supabase.storage.from('proof-photos').getPublicUrl(log.proof_photo_url).data.publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block mt-2 text-blue-600 underline"
                        >
                          View Proof Photo
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          }

          return (
            <Card key={med.id} className="shadow-none border border-gray-200">
              <CardContent className="flex items-center justify-between p-4">
                {editingId === med.id ? (
                  <form
                    className="flex flex-col md:flex-row md:items-center gap-2 w-full"
                    onSubmit={e => {
                      e.preventDefault();
                      updateMutation.mutate({ id: med.id, updates: editValues });
                    }}
                  >
                    <div className="flex-1 flex flex-col md:flex-row gap-2">
                      <Input
                        value={editValues.name}
                        onChange={e => setEditValues(v => ({ ...v, name: e.target.value }))}
                        required
                        className="font-bold"
                      />
                      <Input
                        value={editValues.dosage}
                        onChange={e => setEditValues(v => ({ ...v, dosage: e.target.value }))}
                        required
                      />
                      <select
                        value={editValues.frequency}
                        onChange={e => setEditValues(v => ({ ...v, frequency: e.target.value }))}
                        className="border rounded-md p-2"
                      >
                        {frequencies.map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" size="icon" className="text-green-600 border-green-200 hover:bg-green-50" disabled={updateMutation.isPending}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button type="button" size="icon" variant="outline" onClick={() => setEditingId(null)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div>
                      <div className="font-bold text-lg">{med.name}</div>
                      <div className="text-sm text-muted-foreground">{med.dosage} &middot; {med.frequency}</div>
                    </div>
                    <div className="flex gap-2">
                      <form
                        onSubmit={e => {
                          e.preventDefault();
                          markAsTakenMutation.mutate({ medication_id: med.id, proofPhoto });
                        }}
                        className="flex items-center gap-2"
                      >
                        <Label className="flex items-center gap-1 cursor-pointer">
                          <ImageIcon className="w-4 h-4" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => setProofPhoto(e.target.files?.[0] || null)}
                          />
                          {proofPhoto ? proofPhoto.name : "Take Photo"}
                        </Label>
                        <Button
                          type="submit"
                          size="sm"
                          className="bg-green-600 text-white"
                          disabled={markAsTakenMutation.isPending || uploading}
                        >
                          Mark as Taken
                        </Button>
                      </form>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setEditingId(med.id);
                          setEditValues({ name: med.name, dosage: med.dosage, frequency: med.frequency });
                        }}
                        className="text-blue-500 border-blue-200 hover:bg-blue-50"
                        aria-label="Edit medication"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setDeletingId(med.id);
                          setIsConfirmOpen(true);
                        }}
                        disabled={deleteMutation.isPending}
                        className="text-red-500 border-red-200 hover:bg-red-50"
                        aria-label="Delete medication"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              medication and all of its associated logs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingId) {
                  deleteMutation.mutate(deletingId);
                }
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MedicationList;