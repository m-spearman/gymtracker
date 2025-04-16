import { AppLayout } from "@/layouts/AppLayout";
import { ProgressTracking } from "@/components/progress/ProgressTracking";

export default function ProgressPage() {
  return (
    <AppLayout>
      <div className="px-4 py-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Progress Tracking</h1>
          <p className="mt-1 text-gray-600">Monitor your strength gains and track improvements over time</p>
        </div>
        
        <ProgressTracking />
      </div>
    </AppLayout>
  );
}
