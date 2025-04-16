import { InsertUser, User, InsertWorkout, Workout, InsertExercise, Exercise, InsertExerciseSet, ExerciseSet, InsertSchedule, Schedule, Set } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Workout methods
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  getWorkoutById(id: number): Promise<Workout | undefined>;
  getWorkoutsByUserId(userId: number): Promise<Workout[]>;
  updateWorkout(id: number, workout: Partial<InsertWorkout>): Promise<Workout | undefined>;
  deleteWorkout(id: number): Promise<boolean>;
  
  // Exercise methods
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  getExerciseById(id: number): Promise<Exercise | undefined>;
  getExercisesByUserId(userId: number): Promise<Exercise[]>;
  getExerciseByName(userId: number, name: string): Promise<Exercise | undefined>;
  
  // Exercise Set methods
  createExerciseSet(exerciseSet: InsertExerciseSet): Promise<ExerciseSet>;
  getExerciseSetById(id: number): Promise<ExerciseSet | undefined>;
  getExerciseSetsByWorkoutId(workoutId: number): Promise<ExerciseSet[]>;
  updateExerciseSet(id: number, exerciseSet: Partial<InsertExerciseSet>): Promise<ExerciseSet | undefined>;
  deleteExerciseSet(id: number): Promise<boolean>;
  
  // Schedule methods
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  getScheduleById(id: number): Promise<Schedule | undefined>;
  getSchedulesByUserId(userId: number): Promise<Schedule[]>;
  updateSchedule(id: number, schedule: Partial<InsertSchedule>): Promise<Schedule | undefined>;
  deleteSchedule(id: number): Promise<boolean>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private workouts: Map<number, Workout>;
  private exercises: Map<number, Exercise>;
  private exerciseSets: Map<number, ExerciseSet>;
  private schedules: Map<number, Schedule>;
  sessionStore: session.SessionStore;
  
  private userIdCounter: number;
  private workoutIdCounter: number;
  private exerciseIdCounter: number;
  private exerciseSetIdCounter: number;
  private scheduleIdCounter: number;

  constructor() {
    this.users = new Map();
    this.workouts = new Map();
    this.exercises = new Map();
    this.exerciseSets = new Map();
    this.schedules = new Map();
    
    this.userIdCounter = 1;
    this.workoutIdCounter = 1;
    this.exerciseIdCounter = 1;
    this.exerciseSetIdCounter = 1;
    this.scheduleIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    this.users.set(id, user);
    return user;
  }
  
  // Workout methods
  async createWorkout(insertWorkout: InsertWorkout): Promise<Workout> {
    const id = this.workoutIdCounter++;
    const createdAt = new Date();
    const workout: Workout = { ...insertWorkout, id, createdAt };
    this.workouts.set(id, workout);
    return workout;
  }
  
  async getWorkoutById(id: number): Promise<Workout | undefined> {
    return this.workouts.get(id);
  }
  
  async getWorkoutsByUserId(userId: number): Promise<Workout[]> {
    return Array.from(this.workouts.values())
      .filter(workout => workout.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  
  async updateWorkout(id: number, workout: Partial<InsertWorkout>): Promise<Workout | undefined> {
    const existingWorkout = this.workouts.get(id);
    if (!existingWorkout) return undefined;
    
    const updatedWorkout = { ...existingWorkout, ...workout };
    this.workouts.set(id, updatedWorkout);
    return updatedWorkout;
  }
  
  async deleteWorkout(id: number): Promise<boolean> {
    return this.workouts.delete(id);
  }
  
  // Exercise methods
  async createExercise(insertExercise: InsertExercise): Promise<Exercise> {
    const id = this.exerciseIdCounter++;
    const createdAt = new Date();
    const exercise: Exercise = { ...insertExercise, id, createdAt };
    this.exercises.set(id, exercise);
    return exercise;
  }
  
  async getExerciseById(id: number): Promise<Exercise | undefined> {
    return this.exercises.get(id);
  }
  
  async getExercisesByUserId(userId: number): Promise<Exercise[]> {
    return Array.from(this.exercises.values())
      .filter(exercise => exercise.userId === userId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  
  async getExerciseByName(userId: number, name: string): Promise<Exercise | undefined> {
    return Array.from(this.exercises.values())
      .find(exercise => exercise.userId === userId && exercise.name.toLowerCase() === name.toLowerCase());
  }
  
  // Exercise Set methods
  async createExerciseSet(insertExerciseSet: InsertExerciseSet): Promise<ExerciseSet> {
    const id = this.exerciseSetIdCounter++;
    const createdAt = new Date();
    const exerciseSet: ExerciseSet = { ...insertExerciseSet, id, createdAt };
    this.exerciseSets.set(id, exerciseSet);
    return exerciseSet;
  }
  
  async getExerciseSetById(id: number): Promise<ExerciseSet | undefined> {
    return this.exerciseSets.get(id);
  }
  
  async getExerciseSetsByWorkoutId(workoutId: number): Promise<ExerciseSet[]> {
    return Array.from(this.exerciseSets.values())
      .filter(set => set.workoutId === workoutId);
  }
  
  async updateExerciseSet(id: number, exerciseSet: Partial<InsertExerciseSet>): Promise<ExerciseSet | undefined> {
    const existingSet = this.exerciseSets.get(id);
    if (!existingSet) return undefined;
    
    const updatedSet = { ...existingSet, ...exerciseSet };
    this.exerciseSets.set(id, updatedSet);
    return updatedSet;
  }
  
  async deleteExerciseSet(id: number): Promise<boolean> {
    return this.exerciseSets.delete(id);
  }
  
  // Schedule methods
  async createSchedule(insertSchedule: InsertSchedule): Promise<Schedule> {
    const id = this.scheduleIdCounter++;
    const createdAt = new Date();
    const schedule: Schedule = { ...insertSchedule, id, createdAt };
    this.schedules.set(id, schedule);
    return schedule;
  }
  
  async getScheduleById(id: number): Promise<Schedule | undefined> {
    return this.schedules.get(id);
  }
  
  async getSchedulesByUserId(userId: number): Promise<Schedule[]> {
    return Array.from(this.schedules.values())
      .filter(schedule => schedule.userId === userId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  
  async updateSchedule(id: number, schedule: Partial<InsertSchedule>): Promise<Schedule | undefined> {
    const existingSchedule = this.schedules.get(id);
    if (!existingSchedule) return undefined;
    
    const updatedSchedule = { ...existingSchedule, ...schedule };
    this.schedules.set(id, updatedSchedule);
    return updatedSchedule;
  }
  
  async deleteSchedule(id: number): Promise<boolean> {
    return this.schedules.delete(id);
  }
}

export const storage = new MemStorage();
