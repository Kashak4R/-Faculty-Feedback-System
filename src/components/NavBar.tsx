import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, GraduationCap } from "lucide-react";
import { toast } from "sonner";

interface NavBarProps {
  userRole: "student" | "faculty";
  userName?: string;
}

export default function NavBar({ userRole, userName }: NavBarProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to logout");
    } else {
      toast.success("Logged out successfully");
      navigate("/");
    }
  };

  return (
    <nav className="bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {userRole === "student" ? "Student Portal" : "Faculty Portal"}
            </h1>
            {userName && (
              <p className="text-sm text-muted-foreground">Welcome, {userName}</p>
            )}
          </div>
        </div>
        <Button variant="outline" onClick={handleLogout} className="gap-2">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </nav>
  );
}
