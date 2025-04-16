import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { Workout, ExerciseSet, Exercise, Schedule, insertWorkoutSchema, insertExerciseSchema, insertExerciseSetSchema, insertScheduleSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  setupAuth(app);

  // Middleware to ensure user is authenticated
  const ensureAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).send("Unauthorized");
  };

  // Workout routes
  app.post("/api/workouts", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const workoutData = insertWorkoutSchema.parse({
        ...req.body,
        userId,
        date: new Date(req.body.date)
      });
      const workout = await storage.createWorkout(workoutData);
      res.status(201).json(workout);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create workout" });
      }
    }
  });

  app.get("/api/workouts", ensureAuthenticated, async (req, res) => {
    const userId = req.user!.id;
    const workouts = await storage.getWorkoutsByUserId(userId);
    res.json(workouts);
  });

  app.get("/api/workouts/:id", ensureAuthenticated, async (req, res) => {
    const userId = req.user!.id;
    const workoutId = parseInt(req.params.id);
    const workout = await storage.getWorkoutById(workoutId);
    
    if (!workout) {
      return res.status(404).json({ error: "Workout not found" });
    }
    
    if (workout.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized access to workout" });
    }
    
    // Get all exercise sets for this workout
    const exerciseSets = await storage.getExerciseSetsByWorkoutId(workoutId);
    
    // Get the exercise details for each set
    const exerciseDetails = await Promise.all(
      exerciseSets.map(async (set) => {
        const exercise = await storage.getExerciseById(set.exerciseId);
        return {
          ...set,
          exercise
        };
      })
    );
    
    res.json({
      ...workout,
      exercises: exerciseDetails
    });
  });

  app.put("/api/workouts/:id", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const workoutId = parseInt(req.params.id);
      const workout = await storage.getWorkoutById(workoutId);
      
      if (!workout) {
        return res.status(404).json({ error: "Workout not found" });
      }
      
      if (workout.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized access to workout" });
      }
      
      const updateData = {
        ...req.body,
        date: req.body.date ? new Date(req.body.date) : workout.date
      };
      
      const updatedWorkout = await storage.updateWorkout(workoutId, updateData);
      res.json(updatedWorkout);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update workout" });
      }
    }
  });

  app.delete("/api/workouts/:id", ensureAuthenticated, async (req, res) => {
    const userId = req.user!.id;
    const workoutId = parseInt(req.params.id);
    const workout = await storage.getWorkoutById(workoutId);
    
    if (!workout) {
      return res.status(404).json({ error: "Workout not found" });
    }
    
    if (workout.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized access to workout" });
    }
    
    await storage.deleteWorkout(workoutId);
    res.status(204).send();
  });

  // Exercise routes
  app.post("/api/exercises", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Check if exercise already exists
      const existingExercise = await storage.getExerciseByName(userId, req.body.name);
      if (existingExercise) {
        return res.json(existingExercise);
      }
      
      const exerciseData = insertExerciseSchema.parse({
        ...req.body,
        userId
      });
      const exercise = await storage.createExercise(exerciseData);
      res.status(201).json(exercise);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create exercise" });
      }
    }
  });

  app.get("/api/exercises", ensureAuthenticated, async (req, res) => {
    const userId = req.user!.id;
    const exercises = await storage.getExercisesByUserId(userId);
    res.json(exercises);
  });

  // Exercise Set routes
  app.post("/api/exercise-sets", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Verify workout belongs to user
      const workout = await storage.getWorkoutById(req.body.workoutId);
      if (!workout || workout.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized access to workout" });
      }
      
      // Verify exercise belongs to user
      const exercise = await storage.getExerciseById(req.body.exerciseId);
      if (!exercise || exercise.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized access to exercise" });
      }
      
      const exerciseSetData = insertExerciseSetSchema.parse(req.body);
      const exerciseSet = await storage.createExerciseSet(exerciseSetData);
      res.status(201).json(exerciseSet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create exercise set" });
      }
    }
  });

  app.put("/api/exercise-sets/:id", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const setId = parseInt(req.params.id);
      const exerciseSet = await storage.getExerciseSetById(setId);
      
      if (!exerciseSet) {
        return res.status(404).json({ error: "Exercise set not found" });
      }
      
      // Verify workout belongs to user
      const workout = await storage.getWorkoutById(exerciseSet.workoutId);
      if (!workout || workout.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized access to workout" });
      }
      
      const updatedSet = await storage.updateExerciseSet(setId, req.body);
      res.json(updatedSet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update exercise set" });
      }
    }
  });

  app.delete("/api/exercise-sets/:id", ensureAuthenticated, async (req, res) => {
    const userId = req.user!.id;
    const setId = parseInt(req.params.id);
    const exerciseSet = await storage.getExerciseSetById(setId);
    
    if (!exerciseSet) {
      return res.status(404).json({ error: "Exercise set not found" });
    }
    
    // Verify workout belongs to user
    const workout = await storage.getWorkoutById(exerciseSet.workoutId);
    if (!workout || workout.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized access to workout" });
    }
    
    await storage.deleteExerciseSet(setId);
    res.status(204).send();
  });

  // Schedule routes
  app.post("/api/schedules", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const scheduleData = insertScheduleSchema.parse({
        ...req.body,
        userId,
        date: new Date(req.body.date)
      });
      const schedule = await storage.createSchedule(scheduleData);
      res.status(201).json(schedule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create schedule" });
      }
    }
  });

  app.get("/api/schedules", ensureAuthenticated, async (req, res) => {
    const userId = req.user!.id;
    const schedules = await storage.getSchedulesByUserId(userId);
    res.json(schedules);
  });

  app.put("/api/schedules/:id", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const scheduleId = parseInt(req.params.id);
      const schedule = await storage.getScheduleById(scheduleId);
      
      if (!schedule) {
        return res.status(404).json({ error: "Schedule not found" });
      }
      
      if (schedule.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized access to schedule" });
      }
      
      const updateData = {
        ...req.body,
        date: req.body.date ? new Date(req.body.date) : schedule.date
      };
      
      const updatedSchedule = await storage.updateSchedule(scheduleId, updateData);
      res.json(updatedSchedule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update schedule" });
      }
    }
  });

  app.delete("/api/schedules/:id", ensureAuthenticated, async (req, res) => {
    const userId = req.user!.id;
    const scheduleId = parseInt(req.params.id);
    const schedule = await storage.getScheduleById(scheduleId);
    
    if (!schedule) {
      return res.status(404).json({ error: "Schedule not found" });
    }
    
    if (schedule.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized access to schedule" });
    }
    
    await storage.deleteSchedule(scheduleId);
    res.status(204).send();
  });

  // Progress tracking route - for a specific exercise over time
  app.get("/api/progress/:exerciseId", ensureAuthenticated, async (req, res) => {
    const userId = req.user!.id;
    const exerciseId = parseInt(req.params.exerciseId);
    
    // Verify exercise belongs to user
    const exercise = await storage.getExerciseById(exerciseId);
    if (!exercise || exercise.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized access to exercise" });
    }
    
    // Get all workouts for this user
    const workouts = await storage.getWorkoutsByUserId(userId);
    
    // For each workout, get all exercise sets
    const progressData = await Promise.all(
      workouts.map(async (workout) => {
        const exerciseSets = await storage.getExerciseSetsByWorkoutId(workout.id);
        
        // Find sets that match the requested exercise
        const matchingSets = exerciseSets.filter(set => set.exerciseId === exerciseId);
        
        if (matchingSets.length === 0) {
          return null;
        }
        
        // Find the max weight for this exercise in this workout
        let maxWeight = 0;
        let totalVolume = 0;
        
        matchingSets.forEach(set => {
          const setsArray = set.sets as unknown as Array<{ reps: number, weight: number }>;
          
          setsArray.forEach(s => {
            if (s.weight > maxWeight) {
              maxWeight = s.weight;
            }
            totalVolume += s.reps * s.weight;
          });
        });
        
        return {
          date: workout.date,
          maxWeight,
          totalVolume
        };
      })
    );
    
    // Filter out null values and sort by date
    const filteredData = progressData
      .filter(data => data !== null)
      .sort((a, b) => new Date(a!.date).getTime() - new Date(b!.date).getTime());
    
    res.json(filteredData);
  });

  const httpServer = createServer(app);
  return httpServer;
}
