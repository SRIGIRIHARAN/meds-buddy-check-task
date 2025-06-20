import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { User } from "lucide-react";
import { format, isToday, isBefore, startOfDay } from "date-fns";
import MedicationForm from "@/components/MedicationForm";
import MedicationList from "@/components/MedicationList";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { fetchMedications } from "@/lib/medicationApi";
import { fetchMedicationLogsForMonth } from "@/lib/medicationLogApi";

const PatientDashboard = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const today = new Date();
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth() + 1;

  const { data: medications, isLoading: medsLoading, isError: medsError } = useQuery({
    queryKey: ["medications", user?.id],
    queryFn: () => fetchMedications(user!.id).then(res => res.data || []),
    enabled: !!user,
  });

  const { data: logsData, isLoading: logsLoading, isError: logsError } = useQuery({
    queryKey: ["medication_logs_month", user?.id, year, month],
    queryFn: () => fetchMedicationLogsForMonth(user!.id, year, month).then(res => res.data || []),
    enabled: !!user,
  });

  const logsByDate: Record<string, any[]> = {};
  if (logsData) {
    for (const log of logsData) {
      if (!logsByDate[log.date]) logsByDate[log.date] = [];
      logsByDate[log.date].push(log);
    }
  }

  function getDayStatus(date: Date) {
    const dateStr = format(date, "yyyy-MM-dd");
    const isPast = isBefore(date, startOfDay(today));
    const isCurrentDay = isToday(date);

    if (!medications || medications.length === 0) return null;

    const logs = logsByDate[dateStr] || [];
    const takenMedIds = new Set(logs.filter(l => l.taken).map(l => l.medication_id));
    const allTaken = medications.every(med => takenMedIds.has(med.id));
    if (allTaken && logs.length > 0) return "taken";
    if (isPast && !allTaken) return "missed";
    if (isCurrentDay) return "today";
    return null;
  }

  function getAdherencePercentage() {
    if (!medications || medications.length === 0) return 0;
    const daysInMonth = new Date(year, month, 0).getDate();
    let totalDoses = 0;
    let takenDoses = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      totalDoses += medications.length;
      const logs = logsByDate[dateStr] || [];
      takenDoses += logs.filter(l => l.taken).length;
    }
    return totalDoses === 0 ? 0 : Math.round((takenDoses / totalDoses) * 100);
  }

  if (medsLoading || logsLoading) {
    return <div className="p-8 text-center text-lg">Loading dashboard...</div>;
  }
  if (medsError || logsError) {
    return <div className="p-8 text-center text-red-500">Failed to load data. Please try again.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-green-500 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-bold">
              Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 18 ? "Afternoon" : "Evening"}!
            </h2>
            <p className="text-white/90 text-lg">Ready to stay on track with your medication?</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="text-2xl font-bold">{getAdherencePercentage()}%</div>
            <div className="text-white/80">Monthly Adherence</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="text-2xl font-bold">{format(today, "MMMM d, yyyy")}</div>
            <div className="text-white/80">Today's Date</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="text-2xl font-bold">{medications.length}</div>
            <div className="text-white/80">Medications</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 order-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Medication Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={date => date && setSelectedDate(date)}
                className="w-full"
                modifiersClassNames={{
                  selected: "bg-blue-600 text-white hover:bg-blue-700",
                }}
                components={{
                  DayContent: ({ date }) => {
                    const status = getDayStatus(date);
                    return (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <span>{date.getDate()}</span>
                        {status === "taken" && (
                          <div className="absolute bottom-8 left-5 inset-0 flex items-center justify-center">
                            <span className="w-4 h-4 bg-green-400 rounded-full"></span>
                          </div>
                        )}
                        {status === "missed" && (
                          <div className="absolute bottom-8 left-5 inset-0 flex items-center justify-center">
                            <span className="w-4 h-4 bg-red-400 rounded-full"></span>
                          </div>
                        )}
                        {status === "today" && (
                          <div className="absolute inset-0 bottom-8 left-5 flex items-center justify-center">
                            <span className="w-4 h-4 bg-blue-400 rounded-full"></span>
                          </div>
                        )}
                      </div>
                    );
                  }
                }}
              />
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Medication taken</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <span>Missed medication</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Today</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2 order-1 flex flex-col gap-6">
          <MedicationForm />
          <MedicationList />
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
