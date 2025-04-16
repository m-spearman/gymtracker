import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { WorkoutForm } from "@/components/workout/WorkoutForm";
import { AppLayout } from "@/layouts/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Workout, ExerciseSet } from "@shared/schema";
import { Loader2, ArrowLeft } from "lucide-react";

export default function WorkoutPage() {
  const [location, navigate] = useLocation();
  const [view, setView] = useState<string | null>(null);
  const [edit, setEdit] = useState<string | null>(null);
  const [scheduleId, setScheduleId] = useState<string | null>(null);
  
  // Parse query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setView(params.get("view"));
    setEdit(params.get("edit"));
    setScheduleId(params.get("scheduleId"));
  }, [location]);
  
  // If we're viewing a workout
  const { data: viewWorkout, isLoading: viewLoading } = useQuery<any>({
    queryKey: ["/api/workouts", view ? parseInt(view) : null],
    enabled: !!view,
  });
  
  // If we're starting from a schedule
  const { data: schedule, isLoading: scheduleLoading } = useQuery<any>({
    queryKey: ["/api/schedules", scheduleId ? parseInt(scheduleId) : null],
    enabled: !!scheduleId,
  });
  
  const isLoading = viewLoading || scheduleLoading;
  
  // Handle back button
  const handleBack = () => {
    navigate("/");
  };
  
  // If we're viewing a workout
  if (view) {
    return (
      <AppLayout>
        <div className="px-4 py-6 max-w-7xl mx-auto">
          <div className="mb-6 flex items-center">
            <Button variant="ghost" onClick={handleBack} className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">View Workout</h1>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !viewWorkout ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">Workout not found</p>
                <Button onClick={handleBack} className="mt-4">
                  Go back to dashboard
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900">{viewWorkout.name}</CardTitle>
                      <p className="text-gray-500 mt-1">
                        {format(new Date(viewWorkout.date), "MMMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                    <Button onClick={() => navigate(`/workout?edit=${view}`)}>
                      Edit Workout
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-500">Duration</p>
                      <p className="text-lg font-semibold">{viewWorkout.duration} minutes</p>
                    </div>
                    {viewWorkout.exercises && (
                      <div className="p-4 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-500">Exercises</p>
                        <p className="text-lg font-semibold">{viewWorkout.exercises.length}</p>
                      </div>
                    )}
                    <div className="p-4 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-500">Total Volume</p>
                      <p className="text-lg font-semibold">
                        {viewWorkout.exercises?.reduce((total: number, ex: any) => {
                          const sets = ex.sets || [];
                          return total + sets.reduce((setTotal: number, set: any) => 
                            setTotal + (set.reps * set.weight), 0);
                        }, 0).toLocaleString()} lbs
                      </p>
                    </div>
                  </div>
                  
                  {viewWorkout.notes && (
                    <div className="mb-8">
                      <h3 className="font-medium text-gray-900 mb-2">Notes</h3>
                      <p className="text-gray-700 bg-gray-50 p-4 rounded-md">{viewWorkout.notes}</p>
                    </div>
                  )}
                  
                  <h3 className="font-medium text-gray-900 mb-4">Exercises</h3>
                  <div className="space-y-6">
                    {viewWorkout.exercises?.map((exercise: any, index: number) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-lg mb-4">{exercise.exercise?.name || 'Unknown Exercise'}</h4>
                        
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Set</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reps</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {Array.isArray(exercise.sets) ? exercise.sets.map((set: any, setIndex: number) => (
                                <tr key={setIndex}>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{setIndex + 1}</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{set.reps}</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{set.weight} lbs</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{set.reps * set.weight} lbs</td>
                                </tr>
                              )) : (
                                <tr>
                                  <td colSpan={4} className="px-4 py-2 text-center text-sm text-gray-500">No set data available</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </AppLayout>
    );
  }
  
  // If we're editing or creating a workout
  return (
    <AppLayout>
      <div className="px-4 py-6 max-w-7xl mx-auto">
        <div className="mb-6 flex items-center">
          <Button variant="ghost" onClick={handleBack} className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            {edit ? "Edit Workout" : "Log Workout"}
          </h1>
        </div>
        
        <WorkoutForm 
          workoutId={edit ? parseInt(edit) : undefined} 
          onSuccess={handleBack}
        />
      </div>
    </AppLayout>
  );
}
