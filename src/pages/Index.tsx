import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, MessageSquare } from "lucide-react";

export default function Index() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthAndRedirect();
  }, []);

  const checkAuthAndRedirect = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Session error:", sessionError);
        setLoading(false);
        return;
      }
      
      if (!session) {
        setLoading(false);
        return;
      }

      // Check user role from profiles
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        setLoading(false);
        return;
      }

      if (profile?.role) {
        if (profile.role === "student") {
          navigate("/student-dashboard");
          return;
        } else if (profile.role === "faculty") {
          navigate("/faculty-dashboard");
          return;
        }
      } else {
        console.warn("User has no role assigned:", profile);
      }
    } catch (error) {
      console.error("Error in checkAuthAndRedirect:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-primary/10 p-4 rounded-full">
              <GraduationCap className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Student-Faculty Feedback System
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A modern platform connecting students and faculty through meaningful feedback. 
            Share thoughts, track sentiment, and improve educational experiences.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Student Portal</CardTitle>
              </div>
              <CardDescription>
                Submit feedback to faculty members and track your submission history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                <li className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Select faculty from dropdown
                </li>
                <li className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Automatic sentiment analysis
                </li>
                <li className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  View your feedback history
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Faculty Portal</CardTitle>
              </div>
              <CardDescription>
                View all feedback from students with sentiment analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                <li className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  View all student feedback
                </li>
                <li className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Sentiment distribution analytics
                </li>
                <li className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Track feedback trends
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button size="lg" onClick={() => navigate("/auth")} className="shadow-md">
            Get Started
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Sign up or log in to access your portal
          </p>
        </div>
      </main>
    </div>
  );
}
