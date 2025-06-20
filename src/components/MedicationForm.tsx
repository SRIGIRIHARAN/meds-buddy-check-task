import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addMedication } from "@/lib/medicationApi";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";

const frequencies = [
  "Once daily",
  "Twice daily",
  "Every other day",
  "Weekly",
  "As needed"
];

const MedicationForm = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState(frequencies[0]);
  const [loading, setLoading] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      setLoading(true);
      const { error } = await addMedication({
        user_id: user!.id,
        name,
        dosage,
        frequency,
      });
      setLoading(false);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Medication added!", variant: "default" });
      setName("");
      setDosage("");
      setFrequency(frequencies[0]);
      queryClient.invalidateQueries({ queryKey: ["medications", user!.id] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <form
          onSubmit={e => {
            e.preventDefault();
            if (!name.trim() || !dosage.trim()) {
              toast({ title: "All fields are required", variant: "destructive" });
              return;
            }
            mutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="name">Medication Name</Label>
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="e.g. Paracetamol"
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="dosage">Dosage</Label>
            <Input
              id="dosage"
              value={dosage}
              onChange={e => setDosage(e.target.value)}
              required
              placeholder="e.g. 500mg"
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="frequency">Frequency</Label>
            <select
              id="frequency"
              value={frequency}
              onChange={e => setFrequency(e.target.value)}
              className="w-full border rounded-md p-2"
              disabled={loading}
            >
              {frequencies.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Adding..." : "Add Medication"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default MedicationForm;