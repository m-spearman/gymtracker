import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { format } from "date-fns";
import { Loader2, Plus, Trash2, Save } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertWorkoutSchema, Exercise, Workout, Set } from "@shared/schema";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Form schema for validation
const workoutFormSchema = z.object({
  name: z.string().min(1, "Workout name is required"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
  duration: z.number().min(1, "Duration must be at least 1 minute"),
  exercises: z.array(
    z.object({
      exerciseId: z.string().min(1, "Please select an exercise"),
      exerciseName: z.string().optional(),
      sets: z.array(
        z.object({
          reps: z.number().min(1, "Reps must be at least 1"),
          weight: z.number().min(0, "Weight must be at least 0"),
        })
      ).min(1, "At least one set is required"),
    })
  ).min(1, "At least one exercise is required"),
});

type WorkoutFormValues = z.infer<typeof workoutFormSchema>;

interface WorkoutFormProps {
  workoutId?: number;
  onSuccess?: () => void;
}

export function WorkoutForm({ workoutId, onSuccess }: WorkoutFormProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [customExerciseName, setCustomExerciseName] = useState("");
  
  // Get all exercises
  const { data: exercises, isLoading: exercisesLoading } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises"],
  });

  // Get workout data if editing
  const { data: workout, isLoading: workoutLoading } = useQuery<any>({
    queryKey: ["/api/workouts", workoutId],
    enabled: !!workoutId,
  });

  const form = useForm<WorkoutFormValues>({
    resolver: zodResolver(workoutFormSchema),
    defaultValues: {
      name: "",
      date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      notes: "",
      duration: 60,
      exercises: [
        {
          exerciseId: "",
          sets: [{ reps: 8, weight: 0 }],
        },
      ],
    },
  });

  const { fields: exerciseFields, append: appendExercise, remove: removeExercise } = 
    useFieldArray({
      control: form.control,
      name: "exercises",
    });
    
  // Add set to a specific exercise
  const addSet = (exerciseIndex: number) => {
    const exercises = form.getValues().exercises;
    const exercise = exercises[exerciseIndex];
    const sets = [...exercise.sets];
    
    // Copy values from the last set if it exists
    const lastSet = sets[sets.length - 1];
    const newSet = lastSet ? { ...lastSet } : { reps: 8, weight: 0 };
    
    sets.push(newSet);
    
    form.setValue(`exercises.${exerciseIndex}.sets`, sets);
  };
  
  // Remove set from a specific exercise
  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const exercises = form.getValues().exercises;
    if (exercises[exerciseIndex].sets.length <= 1) {
      toast({
        title: "Cannot remove last set",
        description: "An exercise must have at least one set",
        variant: "destructive",
      });
      return;
    }
    
    const sets = [...exercises[exerciseIndex].sets];
    sets.splice(setIndex, 1);
    form.setValue(`exercises.${exerciseIndex}.sets`, sets);
  };

  // Create new exercise mutation
  const createExerciseMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/exercises", { name });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
      toast({
        title: "Exercise created",
        description: `${data.name} has been added to your exercises`,
      });
      setCustomExerciseName("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create exercise",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create workout mutation
  const createWorkoutMutation = useMutation({
    mutationFn: async (data: any) => {
      // First create the workout
      const workoutRes = await apiRequest("POST", "/api/workouts", {
        name: data.name,
        date: data.date,
        notes: data.notes,
        duration: data.duration,
      });
      const workout = await workoutRes.json();
      
      // Then create exercise sets for each exercise
      const exerciseSetPromises = data.exercises.map(async (ex: any) => {
        return apiRequest("POST", "/api/exercise-sets", {
          workoutId: workout.id,
          exerciseId: parseInt(ex.exerciseId),
          sets: ex.sets,
        });
      });
      
      await Promise.all(exerciseSetPromises);
      
      return workout;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      toast({
        title: "Workout saved",
        description: "Your workout has been logged successfully",
      });
      if (onSuccess) {
        onSuccess();
      } else {
        setLocation("/");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save workout",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update workout mutation
  const updateWorkoutMutation = useMutation({
    mutationFn: async (data: any) => {
      // Update the workout
      const workoutRes = await apiRequest("PUT", `/api/workouts/${workoutId}`, {
        name: data.name,
        date: data.date,
        notes: data.notes,
        duration: data.duration,
      });
      
      // Delete existing exercise sets and create new ones
      // (simplified approach for the MVP)
      const workout = await workoutRes.json();
      
      // Then create exercise sets for each exercise
      const exerciseSetPromises = data.exercises.map(async (ex: any) => {
        return apiRequest("POST", "/api/exercise-sets", {
          workoutId: workout.id,
          exerciseId: parseInt(ex.exerciseId),
          sets: ex.sets,
        });
      });
      
      await Promise.all(exerciseSetPromises);
      
      return workout;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workouts", workoutId] });
      toast({
        title: "Workout updated",
        description: "Your workout has been updated successfully",
      });
      if (onSuccess) {
        onSuccess();
      } else {
        setLocation("/");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update workout",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Set form values when editing a workout
  useEffect(() => {
    if (workout && !workoutLoading) {
      form.setValue("name", workout.name);
      form.setValue("date", format(new Date(workout.date), "yyyy-MM-dd'T'HH:mm"));
      form.setValue("notes", workout.notes || "");
      form.setValue("duration", workout.duration || 60);
      
      if (workout.exercises && workout.exercises.length > 0) {
        const formattedExercises = workout.exercises.map((ex: any) => ({
          exerciseId: ex.exercise.id.toString(),
          sets: Array.isArray(ex.sets) ? ex.sets : [],
        }));
        
        form.setValue("exercises", formattedExercises);
      }
    }
  }, [workout, workoutLoading, form]);

  // Function to handle exercise selection
  const handleExerciseChange = (value: string, index: number) => {
    if (value === "new") {
      // Show input for new exercise name
      form.setValue(`exercises.${index}.exerciseId`, "");
      form.setValue(`exercises.${index}.exerciseName`, "");
    } else {
      form.setValue(`exercises.${index}.exerciseId`, value);
      // Clear custom exercise name if a predefined exercise is selected
      form.setValue(`exercises.${index}.exerciseName`, undefined);
    }
  };

  // Function to create new exercise
  const handleCreateExercise = (name: string, index: number) => {
    if (!name.trim()) {
      toast({
        title: "Exercise name required",
        description: "Please enter a name for the new exercise",
        variant: "destructive",
      });
      return;
    }
    
    createExerciseMutation.mutate(name, {
      onSuccess: (newExercise) => {
        form.setValue(`exercises.${index}.exerciseId`, newExercise.id.toString());
        form.setValue(`exercises.${index}.exerciseName`, undefined);
      }
    });
  };

  const onSubmit = (data: WorkoutFormValues) => {
    if (workoutId) {
      updateWorkoutMutation.mutate(data);
    } else {
      createWorkoutMutation.mutate(data);
    }
  };

  const isLoading = exercisesLoading || workoutLoading;
  const isSaving = createWorkoutMutation.isPending || updateWorkoutMutation.isPending;

  return (
    <Card>
      <CardHeader className="p-6 border-b border-gray-200">
        <CardTitle className="text-lg font-semibold text-gray-900">
          {workoutId ? "Edit Workout" : "Log Workout"}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workout Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Chest Day, Full Body, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date & Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1} 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value))} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="How was your workout?" 
                          className="resize-none" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="border-t border-gray-200 pt-6">
                <h3 className="font-medium text-gray-900 mb-4">Exercises</h3>
                
                {exerciseFields.map((exerciseField, exerciseIndex) => (
                  <div key={exerciseField.id} className="mb-8 p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium">Exercise {exerciseIndex + 1}</h4>
                      {exerciseFields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExercise(exerciseIndex)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>
                    
                    <div className="mb-4">
                      <FormField
                        control={form.control}
                        name={`exercises.${exerciseIndex}.exerciseId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Exercise</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={(value) => handleExerciseChange(value, exerciseIndex)}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select an exercise" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {exercises?.map((exercise) => (
                                  <SelectItem key={exercise.id} value={exercise.id.toString()}>
                                    {exercise.name}
                                  </SelectItem>
                                ))}
                                <SelectItem value="new">+ Add New Exercise</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {form.watch(`exercises.${exerciseIndex}.exerciseId`) === "" && (
                        <div className="mt-2 flex items-end gap-2">
                          <FormItem className="flex-1">
                            <FormLabel>New Exercise Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter exercise name" 
                                value={form.watch(`exercises.${exerciseIndex}.exerciseName`) || ""}
                                onChange={(e) => form.setValue(`exercises.${exerciseIndex}.exerciseName`, e.target.value)}
                              />
                            </FormControl>
                          </FormItem>
                          <Button 
                            type="button"
                            onClick={() => handleCreateExercise(
                              form.watch(`exercises.${exerciseIndex}.exerciseName`) || "", 
                              exerciseIndex
                            )}
                            disabled={createExerciseMutation.isPending}
                          >
                            {createExerciseMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <Plus className="h-4 w-4 mr-1" />
                            )}
                            Add
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-12 gap-2 font-medium text-sm text-gray-500 py-1 px-2">
                        <div className="col-span-2 md:col-span-1">Set</div>
                        <div className="col-span-4 md:col-span-5">Reps</div>
                        <div className="col-span-4 md:col-span-5">Weight (lbs)</div>
                        <div className="col-span-2 md:col-span-1"></div>
                      </div>
                      
                      {form.watch(`exercises.${exerciseIndex}.sets`)?.map((set, setIndex) => (
                        <div key={setIndex} className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-2 md:col-span-1 text-center text-sm font-medium">
                            {setIndex + 1}
                          </div>
                          <div className="col-span-4 md:col-span-5">
                            <FormField
                              control={form.control}
                              name={`exercises.${exerciseIndex}.sets.${setIndex}.reps`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      min={1} 
                                      {...field} 
                                      onChange={(e) => field.onChange(parseInt(e.target.value))} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="col-span-4 md:col-span-5">
                            <FormField
                              control={form.control}
                              name={`exercises.${exerciseIndex}.sets.${setIndex}.weight`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      min={0} 
                                      step={2.5}
                                      {...field} 
                                      onChange={(e) => field.onChange(parseFloat(e.target.value))} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="col-span-2 md:col-span-1 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeSet(exerciseIndex, setIndex)}
                              className="h-8 w-8 text-gray-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addSet(exerciseIndex)}
                        className="w-full mt-2"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Set
                      </Button>
                    </div>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => appendExercise({ 
                    exerciseId: "", 
                    sets: [{ reps: 8, weight: 0 }] 
                  })}
                  className="w-full mt-2"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Exercise
                </Button>
              </div>
              
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/")}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  {workoutId ? "Update Workout" : "Save Workout"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
