import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Dumbbell, Home, ChartLine, Calendar, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const { logoutMutation } = useAuth();
  const [location] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navItems = [
    { path: "/", label: "Dashboard", icon: <Home className="h-5 w-5 mr-3" /> },
    { path: "/workout", label: "Log Workout", icon: <Dumbbell className="h-5 w-5 mr-3" /> },
    { path: "/progress", label: "Progress", icon: <ChartLine className="h-5 w-5 mr-3" /> },
    { path: "/calendar", label: "Calendar", icon: <Calendar className="h-5 w-5 mr-3" /> },
  ];

  return (
    <aside className="hidden md:flex md:w-64 flex-col fixed inset-y-0 bg-white border-r border-gray-200 z-10">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <Dumbbell className="text-primary h-6 w-6 mr-3" />
          <h1 className="text-xl font-bold text-gray-800">GymTrackr</h1>
        </div>
      </div>
      
      <nav className="flex-1 pt-4 pb-4 overflow-y-auto">
        <div className="px-2 space-y-1">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <a className={cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-md",
                location === item.path
                  ? "bg-primary-50 text-primary"
                  : "text-gray-700 hover:bg-gray-100"
              )}>
                {item.icon}
                {item.label}
              </a>
            </Link>
          ))}
        </div>
      </nav>
      
      <div className="border-t border-gray-200 p-4">
        <Button 
          variant="ghost" 
          className="flex w-full items-center justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="h-5 w-5 mr-3" />
          {logoutMutation.isPending ? "Logging out..." : "Logout"}
        </Button>
      </div>
    </aside>
  );
}
