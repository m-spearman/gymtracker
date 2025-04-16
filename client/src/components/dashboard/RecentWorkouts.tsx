import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Workout, Exercise, ExerciseSet } from "@shared/schema";
import { formatDistanceToNow, format } from "date-fns";

// Helper function to format workout data
async function formatWorkoutData(workout: Workout) {
  // Fetch exercise sets for this workout
  const exerciseSetsRes = await fetch(`/api/workouts/${workout.id}`);
  const workoutDetail = await exerciseSetsRes.json();
  
  // Extract exercise names
  const exerciseNames = workoutDetail.exercises?.map((ex: any) => 
    ex.exercise?.name || 'Unknown Exercise'
  ).join(', ');
  
  // Calculate total volume
  let totalVolume = 0;
  workoutDetail.exercises?.forEach((ex: any) => {
    const sets = ex.sets || [];
    if (Array.isArray(sets)) {
      sets.forEach((set: any) => {
        totalVolume += (set.reps || 0) * (set.weight || 0);
      });
    }
  });
  
  return {
    ...workout,
    exercises: exerciseNames,
    volume: totalVolume,
  };
}

export function RecentWorkouts() {
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const pageSize = 5;
  
  const { data: workouts, isLoading } = useQuery<Workout[]>({
    queryKey: ["/api/workouts"],
  });

  // Format workouts with additional information
  const { data: formattedWorkouts, isLoading: detailsLoading } = useQuery({
    queryKey: ["/api/workouts/formatted"],
    enabled: !!workouts && workouts.length > 0,
    queryFn: async () => {
      if (!workouts) return [];
      
      const formatted = await Promise.all(
        workouts.map(formatWorkoutData)
      );
      
      return formatted;
    }
  });

  // Calculate pagination
  const totalWorkouts = formattedWorkouts?.length || 0;
  const totalPages = Math.ceil(totalWorkouts / pageSize);
  const currentPageWorkouts = formattedWorkouts?.slice(
    (page - 1) * pageSize, 
    page * pageSize
  );

  const isDataLoading = isLoading || detailsLoading;

  return (
    <Card className="mt-8">
      <CardHeader className="p-6 border-b border-gray-200">
        <CardTitle className="text-lg font-semibold text-gray-900">Recent Workouts</CardTitle>
      </CardHeader>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Workout</TableHead>
              <TableHead>Exercises</TableHead>
              <TableHead>Volume</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isDataLoading ? (
              Array(3).fill(0).map((_, i) => (
                <TableRow key={i}>
                  {Array(6).fill(0).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : !currentPageWorkouts || currentPageWorkouts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <p className="text-gray-500 mb-4">No workout history found</p>
                  <Button onClick={() => setLocation("/workout")}>
                    Log Your First Workout
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              currentPageWorkouts.map((workout) => (
                <TableRow key={workout.id}>
                  <TableCell>
                    <div className="text-sm text-gray-900">{format(new Date(workout.date), 'MMM d, yyyy')}</div>
                    <div className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(workout.date), { addSuffix: true })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-gray-900">{workout.name}</div>
                  </TableCell>
                  <TableCell className="max-w-[250px] truncate">
                    <div className="text-sm text-gray-500">{workout.exercises}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500">{workout.volume.toLocaleString()} lbs</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500">{workout.duration} min</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="link" 
                      className="text-primary font-medium mr-2"
                      onClick={() => setLocation(`/workout?view=${workout.id}`)}
                    >
                      View
                    </Button>
                    <Button 
                      variant="link" 
                      className="text-gray-600 font-medium"
                      onClick={() => setLocation(`/workout?edit=${workout.id}`)}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {totalPages > 1 && (
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{((page - 1) * pageSize) + 1}</span> to{" "}
            <span className="font-medium">
              {Math.min(page * pageSize, totalWorkouts)}
            </span> of{" "}
            <span className="font-medium">{totalWorkouts}</span> workouts
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline" 
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline" 
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
