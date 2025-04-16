import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subWeeks, subMonths, subYears, isAfter } from "date-fns";
import { Exercise } from "@shared/schema";

type TimeFrame = "week" | "month" | "year";
type MetricType = "maxWeight" | "totalVolume";

type ProgressPoint = {
  date: string;
  maxWeight: number;
  totalVolume: number;
};

export function ProgressChart() {
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("");
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("week");
  const [metric, setMetric] = useState<MetricType>("maxWeight");

  // Get all exercises for the user
  const { data: exercises, isLoading: exercisesLoading } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises"],
  });

  // Set first exercise as default when data loads
  useEffect(() => {
    if (exercises && exercises.length > 0 && !selectedExerciseId) {
      setSelectedExerciseId(exercises[0].id.toString());
    }
  }, [exercises, selectedExerciseId]);

  // Get progress data for selected exercise
  const { data: progressData, isLoading: progressLoading } = useQuery<ProgressPoint[]>({
    queryKey: ["/api/progress", selectedExerciseId],
    enabled: !!selectedExerciseId,
  });

  // Filter data based on selected time frame
  const filteredData = progressData?.filter(item => {
    const date = new Date(item.date);
    const now = new Date();
    
    if (timeFrame === "week") {
      return isAfter(date, subWeeks(now, 1));
    } else if (timeFrame === "month") {
      return isAfter(date, subMonths(now, 1));
    } else if (timeFrame === "year") {
      return isAfter(date, subYears(now, 1));
    }
    return true;
  });

  // Format date based on time frame
  const formatChartDate = (date: string) => {
    const dateObj = new Date(date);
    if (timeFrame === "week") {
      return format(dateObj, "EEE");
    } else if (timeFrame === "month") {
      return format(dateObj, "MMM d");
    } else if (timeFrame === "year") {
      return format(dateObj, "MMM");
    }
    return date;
  };

  // Calculate improvement percentage
  const calculateImprovement = () => {
    if (!filteredData || filteredData.length < 2) return null;
    
    const firstValue = filteredData[0][metric];
    const lastValue = filteredData[filteredData.length - 1][metric];
    
    if (firstValue <= 0) return null;
    
    const percentage = ((lastValue - firstValue) / firstValue) * 100;
    return percentage.toFixed(1);
  };

  // Calculate average value
  const calculateAverage = () => {
    if (!filteredData || filteredData.length === 0) return null;
    
    const sum = filteredData.reduce((acc, curr) => acc + curr[metric], 0);
    return Math.round(sum / filteredData.length);
  };

  // Get current max value
  const getCurrentMax = () => {
    if (!filteredData || filteredData.length === 0) return null;
    return Math.max(...filteredData.map(item => item[metric]));
  };

  // Transform data for chart
  const chartData = filteredData?.map(item => ({
    ...item,
    date: formatChartDate(item.date),
  }));

  const isLoading = exercisesLoading || progressLoading || !selectedExerciseId;

  const metricLabel = metric === "maxWeight" ? "lbs" : "volume";
  const metricName = metric === "maxWeight" ? "Max Weight" : "Total Volume";

  return (
    <Card>
      <CardHeader className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">Progress Tracking</CardTitle>
          {isLoading ? (
            <Skeleton className="h-9 w-32" />
          ) : (
            <Select value={selectedExerciseId} onValueChange={setSelectedExerciseId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select exercise" />
              </SelectTrigger>
              <SelectContent>
                {exercises?.map((exercise) => (
                  <SelectItem key={exercise.id} value={exercise.id.toString()}>
                    {exercise.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="mb-6 flex justify-between">
          <Tabs value={timeFrame} onValueChange={(value) => setTimeFrame(value as TimeFrame)}>
            <TabsList>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Select value={metric} onValueChange={(value) => setMetric(value as MetricType)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select metric" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="maxWeight">Max Weight</SelectItem>
              <SelectItem value="totalVolume">Volume</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Skeleton className="h-full w-full" />
            </div>
          ) : !chartData || chartData.length === 0 ? (
            <div className="flex items-center justify-center h-full border border-dashed border-gray-300 rounded-md">
              <p className="text-gray-500">No data available for this exercise</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  unit={metric === "maxWeight" ? " lbs" : ""}
                />
                <Tooltip 
                  formatter={(value) => [`${value} ${metricLabel}`, metricName]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey={metric}
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ r: 5, strokeWidth: 2, fill: "white" }}
                  activeDot={{ r: 7 }}
                  name={metricName}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        
        <div className="mt-6 border-t border-gray-200 pt-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-500">Current Max</p>
              {isLoading ? (
                <Skeleton className="h-7 w-20 mx-auto" />
              ) : (
                <p className="text-xl font-semibold text-gray-900">
                  {getCurrentMax() ? `${getCurrentMax()} ${metricLabel}` : 'N/A'}
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Average</p>
              {isLoading ? (
                <Skeleton className="h-7 w-20 mx-auto" />
              ) : (
                <p className="text-xl font-semibold text-gray-900">
                  {calculateAverage() ? `${calculateAverage()} ${metricLabel}` : 'N/A'}
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Improvement</p>
              {isLoading ? (
                <Skeleton className="h-7 w-20 mx-auto" />
              ) : (
                <p className={`text-xl font-semibold ${
                  calculateImprovement() && parseFloat(calculateImprovement()!) > 0 
                    ? 'text-green-500' 
                    : parseFloat(calculateImprovement()!) < 0 
                      ? 'text-red-500'
                      : 'text-gray-900'
                }`}>
                  {calculateImprovement() ? `${calculateImprovement()}%` : 'N/A'}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
