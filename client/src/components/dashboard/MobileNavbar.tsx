import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  Menu, X, Dumbbell, Home, ChartLine, Calendar, User, LogOut 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MobileNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { logoutMutation } = useAuth();
  const [location] = useLocation();

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    if (!menuOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate();
    setMenuOpen(false);
  };

  const navItems = [
    { path: "/", label: "Dashboard", icon: <Home className="h-5 w-5 mr-3" /> },
    { path: "/workout", label: "Log Workout", icon: <Dumbbell className="h-5 w-5 mr-3" /> },
    { path: "/progress", label: "Progress", icon: <ChartLine className="h-5 w-5 mr-3" /> },
    { path: "/calendar", label: "Calendar", icon: <Calendar className="h-5 w-5 mr-3" /> },
  ];

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center">
          <Dumbbell className="text-primary h-6 w-6 mr-2" />
          <h1 className="text-lg font-bold text-gray-800">GymTrackr</h1>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={toggleMenu} 
          className="p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>
      
      {/* Mobile Menu */}
      <div className={cn(
        "md:hidden fixed inset-0 bg-gray-800 bg-opacity-75 z-20 transition-opacity",
        menuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <div className={cn(
          "fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-xl p-6 flex flex-col transition-transform",
          menuOpen ? "translate-x-0" : "translate-x-full"
        )}>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold text-gray-800">Menu</h2>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleMenu} 
              className="p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <a 
                  className={cn(
                    "block px-3 py-3 rounded-md font-medium",
                    location === item.path
                      ? "bg-primary-50 text-primary"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                  onClick={() => setMenuOpen(false)}
                >
                  <div className="flex items-center">
                    {item.icon}
                    {item.label}
                  </div>
                </a>
              </Link>
            ))}
          </nav>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-5 w-5 mr-3" />
              {logoutMutation.isPending ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <a 
                className={cn(
                  "flex flex-col items-center py-3 px-2",
                  location === item.path
                    ? "text-primary"
                    : "text-gray-500"
                )}
              >
                {React.cloneElement(item.icon, { className: "h-5 w-5 mb-1", mr: undefined })}
                <span className="text-xs">{item.label.replace(" ", "")}</span>
              </a>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
