import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { MessageSquare, TrendingUp, BarChart3 } from "lucide-react";
import { SentimentBadge } from "@/components/SentimentBadge";
import NavBar from "@/components/NavBar";

interface Feedback {
  id: string;
  feedback_text: string;
  sentiment: string;
  created_at: string;
  students: {
    name: string;
  };
}

interface SentimentStats {
  Positive: number;
  Neutral: number;
  Negative: number;
}

export default function FacultyPortal() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [facultyData, setFacultyData] = useState<any>(null);
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<SentimentStats>({ Positive: 0, Neutral: 0, Negative: 0 });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchFeedback();
    }
  }, [user]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast.error("Please login to access faculty portal");
      navigate("/auth");
      return;
    }

    // Check user role from profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!profile || profile.role !== "faculty") {
      toast.error("Unauthorized: This portal is for faculty only");
      navigate("/");
      return;
    }

    setUser(session.user);

    const { data: faculty } = await supabase
      .from("faculty")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (!faculty) {
      toast.error("Faculty profile not found");
      await supabase.auth.signOut();
      navigate("/auth");
      return;
    }

    setFacultyData(faculty);
  };

  const fetchFeedback = async () => {
    const { data, error } = await supabase
      .from("feedback")
      .select(`
        id,
        feedback_text,
        sentiment,
        created_at,
        students:student_id (name)
      `)
      .eq("faculty_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching feedback:", error);
      toast.error("Failed to load feedback");
      return;
    }

    setFeedbackList(data || []);
    calculateStats(data || []);
  };

  const calculateStats = (feedback: Feedback[]) => {
    const sentimentCounts = feedback.reduce(
      (acc, item) => {
        acc[item.sentiment as keyof SentimentStats] = (acc[item.sentiment as keyof SentimentStats] || 0) + 1;
        return acc;
      },
      { Positive: 0, Neutral: 0, Negative: 0 }
    );

    setStats(sentimentCounts);
  };


  if (!user || !facultyData) {
    return null;
  }

  const total = feedbackList.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10">
      <NavBar userRole="faculty" userName={`${facultyData.name} (${facultyData.department})`} />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{total}</div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Positive</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{stats.Positive}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {total > 0 ? Math.round((stats.Positive / total) * 100) : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Sentiment Distribution</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-success/20 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-success h-full transition-all"
                      style={{ width: total > 0 ? `${(stats.Positive / total) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-12">{stats.Positive}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-neutral/20 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-neutral h-full transition-all"
                      style={{ width: total > 0 ? `${(stats.Neutral / total) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-12">{stats.Neutral}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-destructive/20 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-destructive h-full transition-all"
                      style={{ width: total > 0 ? `${(stats.Negative / total) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-12">{stats.Negative}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Recent Feedback</CardTitle>
            <CardDescription>All feedback submitted to you by students</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {feedbackList.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">
                  No feedback received yet
                </p>
              ) : (
                feedbackList.map((feedback) => (
                  <div
                    key={feedback.id}
                    className="p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-medium">From: {feedback.students.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(feedback.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <SentimentBadge sentiment={feedback.sentiment} />
                    </div>
                    <p className="text-sm leading-relaxed">{feedback.feedback_text}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
