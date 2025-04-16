import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Schedule } from "@shared/schema";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, Save } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const scheduleFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.date({
    required_error: "Please select a date",
  }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please enter a valid time"),
  recurring: z.string().optional(),
  details: z.string().optional(),
});

type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

interface ScheduleFormProps {
  initialDate?: Date;
  scheduleId?: number | null;
  schedule?: Schedule | null;
  onSuccess?: () => void;
}

export function ScheduleForm({ initialDate, scheduleId, schedule, onSuccess }: ScheduleFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [date, setDate] = useState<Date | undefined>(initialDate || new Date());
  
  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      title: "",
      date: initialDate || new Date(),
      time: format(new Date(), "HH:mm"),
      recurring: "",
      details: "",
    },
  });
  
  // Set form values when editing a schedule
  useEffect(() => {
    if (schedule) {
      const scheduleDate = new Date(schedule.date);
      setDate(scheduleDate);
      
      form.setValue("title", schedule.title);
      form.setValue("date", scheduleDate);
      form.setValue("time", format(scheduleDate, "HH:mm"));
      form.setValue("recurring", schedule.recurring || "");
      form.setValue("details", schedule.details || "");
    }
  }, [schedule, form]);
  
  // Create schedule mutation
  const createScheduleMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/schedules", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      toast({
        title: "Workout scheduled",
        description: "Your workout has been scheduled successfully",
      });
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to schedule workout",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update schedule mutation
  const updateScheduleMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", `/api/schedules/${scheduleId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      toast({
        title: "Schedule updated",
        description: "Your workout schedule has been updated successfully",
      });
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update schedule",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: ScheduleFormValues) => {
    // Combine date and time
    const dateTime = new Date(values.date);
    const [hours, minutes] = values.time.split(':').map(Number);
    dateTime.setHours(hours, minutes);
    
    const scheduleData = {
      title: values.title,
      date: dateTime.toISOString(),
      recurring: values.recurring || null,
      details: values.details || null,
    };
    
    if (scheduleId) {
      updateScheduleMutation.mutate(scheduleData);
    } else {
      createScheduleMutation.mutate(scheduleData);
    }
  };
  
  const isPending = createScheduleMutation.isPending || updateScheduleMutation.isPending;
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Workout Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Chest Day, Leg Day, etc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className="w-full pl-3 text-left font-normal"
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={(date) => {
                      field.onChange(date);
                      setDate(date);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Time</FormLabel>
              <FormControl>
                <Input type="time" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="recurring"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recurring</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Not recurring" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">Not recurring</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="details"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Details (optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Planned exercises, notes, etc." 
                  className="resize-none" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="pt-4">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            {scheduleId ? "Update Schedule" : "Schedule Workout"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
