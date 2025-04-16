import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { format, subDays, subMonths, subYears, isAfter, isBefore } from "date-fns";
import { Exercise } from "@shared/schema";

type TimeRange = "week" | "month" | "3months" | "year" | "all";
type ChartType = "line" | "bar";
type MetricType = "maxWeight" | "totalVolume";

interface ProgressPoint {
  date: string;
  maxWeight: number;
  totalVolume: number;
}

export function ProgressTracking() {
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("");
  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  const [chartType, setChartType] = useState<ChartType>("line");
  const [metric, setMetric] = useState<MetricType>("maxWeight");

  // Get all exercises
  const { data: exercises, isLoading: exercisesLoading } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises"],
  });

  // Set default exercise when data loads
  useState(() => {
    if (exercises && exercises.length > 0 && !selectedExerciseId) {
      setSelectedExerciseId(exercises[0].id.toString());
    }
  });

  // Get progress data for selected exercise
  const { data: progressData, isLoading: progressLoading } = useQuery<ProgressPoint[]>({
    queryKey: ["/api/progress", selectedExerciseId],
    enabled: !!selectedExerciseId,
  });

  // Filter data based on time range
  const filteredData = progressData?.filter(item => {
    if (!item.date) return false;
    
    const date = new Date(item.date);
    const now = new Date();
    
    if (timeRange === "week") {
      return isAfter(date, subDays(now, 7));
    } else if (timeRange === "month") {
      return isAfter(date, subMonths(now, 1));
    } else if (timeRange === "3months") {
      return isAfter(date, subMonths(now, 3));
    } else if (timeRange === "year") {
      return isAfter(date, subYears(now, 1));
    }
    return true; // "all"
  });

  // Format date for display
  const formatChartDate = (date: string) => {
    if (!date) return "";
    const dateObj = new Date(date);
    
    if (timeRange === "week") {
      return format(dateObj, "EEE");
    } else if (timeRange === "month") {
      return format(dateObj, "MMM d");
    } else if (timeRange === "3months") {
      return format(dateObj, "MMM d");
    } else if (timeRange === "year") {
      return format(dateObj, "MMM");
    }
    return format(dateObj, "MMM yyyy");
  };

  // Calculate improvement
  const calculateImprovement = () => {
    if (!filteredData || filteredData.length < 2) return { value: 0, percentage: "0" };
    
    const values = filteredData.map(d => d[metric]).filter(v => v !== 0);
    if (values.length < 2) return { value: 0, percentage: "0" };
    
    const first = values[0];
    const last = values[values.length - 1];
    const difference = last - first;
    
    const percentage = ((difference / first) * 100).toFixed(1);
    
    return { 
      value: difference,
      percentage 
    };
  };

  // Get current metric stats
  const getMetricStats = () => {
    if (!filteredData || filteredData.length === 0) {
      return {
        max: 0,
        average: 0,
        improvement: { value: 0, percentage: "0" }
      };
    }
    
    const values = filteredData.map(d => d[metric]);
    const max = Math.max(...values);
    const sum = values.reduce((a, b) => a + b, 0);
    const average = Math.round(sum / values.length);
    
    return {
      max,
      average,
      improvement: calculateImprovement()
    };
  };

  const isLoading = exercisesLoading || progressLoading || !selectedExerciseId;
  const stats = getMetricStats();
  const metricLabel = metric === "maxWeight" ? "lbs" : "volume";

  // Selected exercise name
  const selectedExerciseName = exercises?.find(e => e.id.toString() === selectedExerciseId)?.name || "";

  // Format chart data
  const chartData = filteredData?.map(item => ({
    ...item,
    date: formatChartDate(item.date),
  })) || [];
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold text-gray-900">Progress Tracking</CardTitle>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Select
                value={selectedExerciseId}
                onValueChange={setSelectedExerciseId}
                disabled={isLoading}
              >
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
              
              <Select value={metric} onValueChange={(value) => setMetric(value as MetricType)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maxWeight">Max Weight</SelectItem>
                  <SelectItem value="totalVolume">Total Volume</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
              <TabsList>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="3months">3 Months</TabsTrigger>
                <TabsTrigger value="year">Year</TabsTrigger>
                <TabsTrigger value="all">All Time</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Tabs value={chartType} onValueChange={(value) => setChartType(value as ChartType)}>
              <TabsList>
                <TabsTrigger value="line">Line</TabsTrigger>
                <TabsTrigger value="bar">Bar</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {isLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-[400px] border border-dashed border-gray-300 rounded-md">
              <p className="text-gray-500">No data available for this exercise</p>
            </div>
          ) : (
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "line" ? (
                  <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={['auto', 'auto']} />
                    <Tooltip 
                      formatter={(value) => [`${value} ${metricLabel}`, metric === "maxWeight" ? "Max Weight" : "Total Volume"]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey={metric}
                      name={metric === "maxWeight" ? "Max Weight" : "Total Volume"}
                      stroke="#3B82F6"
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2, fill: "white" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                ) : (
                  <BarChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={['auto', 'auto']} />
                    <Tooltip 
                      formatter={(value) => [`${value} ${metricLabel}`, metric === "maxWeight" ? "Max Weight" : "Total Volume"]}
                    />
                    <Legend />
                    <Bar
                      dataKey={metric}
                      name={metric === "maxWeight" ? "Max Weight" : "Total Volume"}
                      fill="#3B82F6"
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Current Max</h3>
                <p className="text-3xl font-bold text-gray-900">{stats.max} {metricLabel}</p>
                <p className="text-sm text-gray-500 mt-2">Highest recorded value</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Average</h3>
                <p className="text-3xl font-bold text-gray-900">{stats.average} {metricLabel}</p>
                <p className="text-sm text-gray-500 mt-2">Average over time period</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Improvement</h3>
                <p className={`text-3xl font-bold ${
                  parseFloat(stats.improvement.percentage) > 0 
                    ? 'text-green-500' 
                    : parseFloat(stats.improvement.percentage) < 0 
                      ? 'text-red-500' 
                      : 'text-gray-900'
                }`}>
                  {stats.improvement.percentage}%
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {stats.improvement.value > 0 
                    ? `+${stats.improvement.value}` 
                    : stats.improvement.value} {metricLabel}
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
