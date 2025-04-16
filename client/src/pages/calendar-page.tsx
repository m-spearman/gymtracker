import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/layouts/AppLayout";
import { CalendarView } from "@/components/calendar/CalendarView";
import { ScheduleForm } from "@/components/calendar/ScheduleForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function CalendarPage() {
  const [location, setLocation] = useLocation();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [editScheduleId, setEditScheduleId] = useState<number | null>(null);
  
  // Parse edit parameter from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editParam = params.get("edit");
    if (editParam) {
      setEditScheduleId(parseInt(editParam));
      setIsFormOpen(true);
    }
  }, [location]);
  
  // Fetch the schedule if editing
  const { data: editSchedule } = useQuery({
    queryKey: ["/api/schedules", editScheduleId],
    enabled: !!editScheduleId,
  });
  
  const handleAddSchedule = (date?: Date) => {
    setSelectedDate(date);
    setEditScheduleId(null);
    setIsFormOpen(true);
  };
  
  const handleEditSchedule = (scheduleId: number) => {
    setEditScheduleId(scheduleId);
    setIsFormOpen(true);
  };
  
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedDate(undefined);
    setEditScheduleId(null);
    
    // Clear the edit parameter from URL if it exists
    if (window.location.search.includes("edit=")) {
      setLocation("/calendar");
    }
  };
  
  return (
    <AppLayout>
      <div className="px-4 py-6 max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Workout Calendar</h1>
            <p className="mt-1 text-gray-600">Schedule and plan your upcoming training sessions</p>
          </div>
          <Button onClick={() => handleAddSchedule()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Workout
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={isFormOpen ? "hidden lg:block lg:col-span-2" : "col-span-full"}>
            <Card>
              <CardHeader className="p-6 border-b border-gray-200">
                <CardTitle className="text-lg font-semibold text-gray-900">Calendar</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <CalendarView 
                  onAddSchedule={handleAddSchedule}
                  onEditSchedule={handleEditSchedule}
                />
              </CardContent>
            </Card>
          </div>
          
          {isFormOpen && (
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {editScheduleId ? "Edit Workout" : "Schedule Workout"}
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={handleCloseForm}>
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <ScheduleForm 
                    initialDate={selectedDate}
                    scheduleId={editScheduleId}
                    schedule={editSchedule}
                    onSuccess={handleCloseForm}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
