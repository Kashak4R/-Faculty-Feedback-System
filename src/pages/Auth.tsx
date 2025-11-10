import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { GraduationCap, Users } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Get user role from profiles and redirect accordingly
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();
        
        if (profile?.role === "student") {
          navigate("/student-dashboard");
        } else if (profile?.role === "faculty") {
          navigate("/faculty-dashboard");
        } else {
          navigate("/");
        }
      }
    };
    checkSession();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;
    const role = formData.get("role") as string;
    const enrollmentNumber = formData.get("enrollmentNumber") as string;
    const department = formData.get("department") as string;

    try {
      // Validate role is selected for signup
      if (!isLogin && !role) {
        toast.error("Please select your role (Student or Faculty)");
        setLoading(false);
        return;
      }

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        // Get user role from profiles and redirect to appropriate dashboard
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();

          if (profile?.role === "student") {
            navigate("/student-dashboard");
          } else if (profile?.role === "faculty") {
            navigate("/faculty-dashboard");
          } else {
            navigate("/");
          }
        }
        
        toast.success("Welcome back!");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              role,
              enrollment_number: enrollmentNumber,
              department,
            },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) throw error;

        if (data.user) {
          // Update profile with role (trigger should have created profile, but we ensure role is set)
          const { error: profileError } = await supabase
            .from("profiles")
            .update({ role: role })
            .eq("id", data.user.id);

          if (profileError) {
            // If profile doesn't exist, create it with role
            await supabase.from("profiles").insert({
              id: data.user.id,
              name,
              email,
              role: role,
            });
          }

          // Insert role-specific data
          if (role === "student") {
            await supabase.from("students").insert({
              id: data.user.id,
              name,
              email,
              enrollment_number: enrollmentNumber,
            });

            toast.success("Account created successfully!");
            navigate("/student-dashboard");
          } else if (role === "faculty") {
            await supabase.from("faculty").insert({
              id: data.user.id,
              name,
              email,
              department,
            });

            toast.success("Account created successfully!");
            navigate("/faculty-dashboard");
          }
        }
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Student-Faculty Portal</CardTitle>
          <CardDescription>
            {isLogin ? "Sign in to your account" : "Create a new account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={isLogin ? "login" : "signup"} onValueChange={(v) => setIsLogin(v === "login")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label>I am a</Label>
                  <RadioGroup name="role" defaultValue="student" required>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent transition-colors">
                      <RadioGroupItem value="student" id="student" />
                      <Label htmlFor="student" className="flex items-center gap-2 cursor-pointer flex-1">
                        <GraduationCap className="h-4 w-4 text-primary" />
                        <span>Student</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent transition-colors">
                      <RadioGroupItem value="faculty" id="faculty" />
                      <Label htmlFor="faculty" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Users className="h-4 w-4 text-primary" />
                        <span>Faculty</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div id="student-fields" className="space-y-2">
                  <Label htmlFor="enrollmentNumber">Enrollment Number (for students)</Label>
                  <Input
                    id="enrollmentNumber"
                    name="enrollmentNumber"
                    type="text"
                    placeholder="ENR001"
                  />
                </div>
                
                <div id="faculty-fields" className="space-y-2">
                  <Label htmlFor="department">Department (for faculty)</Label>
                  <Input
                    id="department"
                    name="department"
                    type="text"
                    placeholder="Computer Science"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
