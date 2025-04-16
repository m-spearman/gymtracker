import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Calendar, 
  Views, 
  momentLocalizer,
  SlotInfo,
  Event
} from "react-big-calendar";
import moment from "moment";
import { Schedule } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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

// Import react-big-calendar styles
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Badge } from "@/components/ui/badge";

// Set up the localizer for react-big-calendar
const localizer = momentLocalizer(moment);

interface CalendarViewProps {
  onAddSchedule: (date?: Date) => void;
  onEditSchedule: (scheduleId: number) => void;
}

interface CalendarEvent extends Event {
  id: number;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: any;
}

export function CalendarView({ onAddSchedule, onEditSchedule }: CalendarViewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  
  // Fetch schedules
  const { data: schedules, isLoading } = useQuery<Schedule[]>({
    queryKey: ["/api/schedules"],
  });
  
  // Delete schedule mutation
  const deleteScheduleMutation = useMutation({
    mutationFn: async (scheduleId: number) => {
      await apiRequest("DELETE", `/api/schedules/${scheduleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      toast({
        title: "Schedule deleted",
        description: "The workout schedule has been deleted",
      });
      setDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete schedule",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Convert schedules to calendar events
  useEffect(() => {
    if (schedules) {
      const calendarEvents: CalendarEvent[] = schedules.map(schedule => {
        const start = new Date(schedule.date);
        const end = new Date(start);
        end.setHours(start.getHours() + 1); // Assume 1 hour duration
        
        return {
          id: schedule.id,
          title: schedule.title,
          start,
          end,
          allDay: false,
          resource: {
            recurring: schedule.recurring,
            details: schedule.details,
            schedule
          }
        };
      });
      
      setEvents(calendarEvents);
    }
  }, [schedules]);
  
  // Handle slot selection (clicking on a time slot)
  const handleSelectSlot = (slotInfo: SlotInfo) => {
    onAddSchedule(slotInfo.start);
  };
  
  // Handle event selection (clicking on an event)
  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };
  
  // Handle event edit
  const handleEditEvent = (event: CalendarEvent) => {
    onEditSchedule(event.id);
  };
  
  // Handle event delete confirmation
  const handleDeleteConfirm = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setDeleteDialogOpen(true);
  };
  
  // Handle event delete
  const handleDeleteEvent = () => {
    if (selectedEvent) {
      deleteScheduleMutation.mutate(selectedEvent.id);
    }
  };
  
  // Custom event component
  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const isRecurring = event.resource?.recurring;
    
    return (
      <div className="flex items-center justify-between p-1">
        <div className="flex items-center overflow-hidden">
          <span className="truncate">{event.title}</span>
          {isRecurring && (
            <Badge variant="outline" className="ml-1 text-xs">
              {isRecurring}
            </Badge>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEditEvent(event)}>
              <Edit className="mr-2 h-4 w-4" />
              <span>Edit</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleDeleteConfirm(event)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };
  
  if (isLoading) {
    return <Skeleton className="h-[600px] w-full" />;
  }
  
  return (
    <div className="h-[600px] p-4">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        components={{
          event: EventComponent,
        }}
        views={[Views.MONTH, Views.WEEK, Views.DAY]}
        defaultView={Views.MONTH}
        defaultDate={new Date()}
      />
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the scheduled workout "{selectedEvent?.title}".
              {selectedEvent?.resource?.recurring && (
                <div className="mt-2">
                  <Badge variant="outline">
                    This is a {selectedEvent.resource.recurring} recurring workout
                  </Badge>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteEvent} 
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteScheduleMutation.isPending}
            >
              {deleteScheduleMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
