import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Schedule } from "@shared/schema";
import { format, isToday, isTomorrow, addDays, isAfter } from "date-fns";
import { Dumbbell, Clock, Edit, MoreHorizontal, Play, Terminal } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export function UpcomingWorkouts() {
  const [, setLocation] = useLocation();
  const [showAll, setShowAll] = useState(false);
  
  const { data: schedules, isLoading } = useQuery<Schedule[]>({
    queryKey: ["/api/schedules"],
  });

  // Filter upcoming schedules (today and future dates)
  const upcomingSchedules = schedules?.filter(schedule => 
    isAfter(new Date(schedule.date), addDays(new Date(), -1))
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Display max 4 upcoming workouts, unless showAll is true
  const displayedSchedules = showAll 
    ? upcomingSchedules 
    : upcomingSchedules?.slice(0, 4);

  // Format the date for display
  const formatScheduleDate = (date: Date | string) => {
    const scheduleDate = new Date(date);
    
    if (isToday(scheduleDate)) {
      return 'Today';
    } else if (isTomorrow(scheduleDate)) {
      return 'Tomorrow';
    } else {
      return format(scheduleDate, 'EEE, MMM d');
    }
  };

  const handleStartWorkout = (scheduleId: number) => {
    // Navigate to workout page with schedule ID
    setLocation(`/workout?scheduleId=${scheduleId}`);
  };

  const handleEditSchedule = (scheduleId: number) => {
    // Navigate to calendar page with schedule ID for editing
    setLocation(`/calendar?edit=${scheduleId}`);
  };

  return (
    <Card>
      <CardHeader className="p-6 border-b border-gray-200">
        <CardTitle className="text-lg font-semibold text-gray-900">Upcoming Workouts</CardTitle>
      </CardHeader>
      
      <CardContent className="p-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : !displayedSchedules || displayedSchedules.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-gray-500 mb-4">No upcoming workouts scheduled</p>
            <Button onClick={() => setLocation("/calendar")}>
              Schedule a Workout
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedSchedules.map((schedule) => {
              const isCurrentDay = isToday(new Date(schedule.date));
              const formattedTime = format(new Date(schedule.date), 'h:mm a');
              
              return (
                <div 
                  key={schedule.id}
                  className={`p-4 rounded-lg ${
                    isCurrentDay 
                      ? 'bg-primary-50 border border-primary-100' 
                      : 'border border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`text-sm font-medium ${
                        isCurrentDay ? 'text-primary-800' : 'text-gray-600'
                      }`}>
                        {formatScheduleDate(schedule.date)} - {formattedTime}
                      </p>
                      <h3 className="font-semibold text-gray-900 mt-1">{schedule.title}</h3>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleStartWorkout(schedule.id)}>
                          <Play className="mr-2 h-4 w-4" />
                          <span>Start Workout</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditSchedule(schedule.id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {schedule.details && (
                    <div className="mt-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Dumbbell className="mr-2 h-4 w-4 text-gray-500" />
                        <span>{schedule.details}</span>
                      </div>
                    </div>
                  )}
                  {isCurrentDay && (
                    <div className="mt-4 flex space-x-2">
                      <Button 
                        className="flex-1"
                        onClick={() => handleStartWorkout(schedule.id)}
                      >
                        Start
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => handleEditSchedule(schedule.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {upcomingSchedules && upcomingSchedules.length > 4 && (
          <div className="mt-6">
            <Button 
              variant="link" 
              className="w-full text-primary hover:text-primary/80"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'Show Less' : `View All (${upcomingSchedules.length})`}
            </Button>
          </div>
        )}
        
        <div className="mt-6">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setLocation("/calendar")}
          >
            View Full Calendar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
