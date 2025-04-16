import { useLocation } from "wouter";
import { Plus, ChartLine, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function QuickActions() {
  const [, setLocation] = useLocation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="rounded-full bg-primary-50 p-3 mr-4">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Log Workout</h3>
              <p className="text-sm text-gray-600">Record your latest gym session</p>
            </div>
          </div>
          <Button 
            className="mt-4 w-full" 
            onClick={() => setLocation("/workout")}
          >
            Add Workout
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="rounded-full bg-green-100 p-3 mr-4">
              <ChartLine className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">View Progress</h3>
              <p className="text-sm text-gray-600">See how you're improving</p>
            </div>
          </div>
          <Button 
            variant="secondary" 
            className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white" 
            onClick={() => setLocation("/progress")}
          >
            Check Progress
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="rounded-full bg-blue-100 p-3 mr-4">
              <CalendarPlus className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Schedule Workout</h3>
              <p className="text-sm text-gray-600">Plan your next training session</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="mt-4 w-full" 
            onClick={() => setLocation("/calendar")}
          >
            Open Calendar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
