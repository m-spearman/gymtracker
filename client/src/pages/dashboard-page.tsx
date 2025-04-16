import { AppLayout } from "@/layouts/AppLayout";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ProgressChart } from "@/components/dashboard/ProgressChart";
import { UpcomingWorkouts } from "@/components/dashboard/UpcomingWorkouts";
import { RecentWorkouts } from "@/components/dashboard/RecentWorkouts";

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="px-4 py-6 max-w-7xl mx-auto">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-gray-600">Track your fitness journey and see your progress</p>
        </div>

        {/* Quick Actions */}
        <QuickActions />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Progress Chart */}
          <div className="lg:col-span-2">
            <ProgressChart />
          </div>

          {/* Upcoming Workouts */}
          <div className="lg:col-span-1">
            <UpcomingWorkouts />
          </div>
        </div>

        {/* Recent Workouts */}
        <RecentWorkouts />
      </div>
    </AppLayout>
  );
}
