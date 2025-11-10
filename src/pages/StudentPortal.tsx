import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Send, MessageSquare } from "lucide-react";
import { analyzeSentiment } from "@/lib/sentiment";
import { SentimentBadge } from "@/components/SentimentBadge";
import NavBar from "@/components/NavBar";

interface Faculty {
  id: string;
  name: string;
  department: string;
}

interface Feedback {
  id: string;
  feedback_text: string;
  sentiment: string;
  created_at: string;
  faculty: {
    name: string;
  };
}

export default function StudentPortal() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [studentData, setStudentData] = useState<any>(null);
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [myFeedback, setMyFeedback] = useState<Feedback[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchFacultyList();
      fetchMyFeedback();
    }
  }, [user]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast.error("Please login to access student portal");
      navigate("/auth");
      return;
    }

    // Check user role from profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!profile || profile.role !== "student") {
      toast.error("Unauthorized: This portal is for students only");
      navigate("/");
      return;
    }

    setUser(session.user);

    const { data: student } = await supabase
      .from("students")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (!student) {
      toast.error("Student profile not found");
      await supabase.auth.signOut();
      navigate("/auth");
      return;
    }

    setStudentData(student);
  };

  const fetchFacultyList = async () => {
    const { data, error } = await supabase
      .from("faculty")
      .select("id, name, department")
      .order("name");

    if (error) {
      toast.error("Failed to load faculty list");
      return;
    }

    setFacultyList(data || []);
  };

  const fetchMyFeedback = async () => {
    const { data, error } = await supabase
      .from("feedback")
      .select(`
        id,
        feedback_text,
        sentiment,
        created_at,
        faculty:faculty_id (name)
      `)
      .eq("student_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching feedback:", error);
      return;
    }

    setMyFeedback(data || []);
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFaculty || !feedbackText.trim()) {
      toast.error("Please select a faculty and enter feedback");
      return;
    }

    setSubmitting(true);

    try {
      const sentiment = analyzeSentiment(feedbackText);

      const { error } = await supabase.from("feedback").insert({
        student_id: user.id,
        faculty_id: selectedFaculty,
        feedback_text: feedbackText.trim(),
        sentiment,
      });

      if (error) throw error;

      toast.success("Feedback submitted successfully!");
      setFeedbackText("");
      setSelectedFaculty("");
      fetchMyFeedback();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };


  if (!user || !studentData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10">
      <NavBar userRole="student" userName={studentData.name} />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                Submit Feedback
              </CardTitle>
              <CardDescription>Share your feedback with faculty members</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="faculty">Select Faculty</Label>
                  <Select value={selectedFaculty} onValueChange={setSelectedFaculty}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a faculty member" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {facultyList.map((faculty) => (
                        <SelectItem key={faculty.id} value={faculty.id}>
                          {faculty.name} - {faculty.department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feedback">Your Feedback</Label>
                  <Textarea
                    id="feedback"
                    placeholder="Share your thoughts, suggestions, or concerns..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    rows={6}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Your feedback will be analyzed for sentiment automatically
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Feedback"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                My Feedback History
              </CardTitle>
              <CardDescription>
                {myFeedback.length} feedback{myFeedback.length !== 1 ? 's' : ''} submitted
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {myFeedback.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No feedback submitted yet
                  </p>
                ) : (
                  myFeedback.map((feedback) => (
                    <div
                      key={feedback.id}
                      className="p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-medium">
                          To: {feedback.faculty.name}
                        </p>
                        <SentimentBadge sentiment={feedback.sentiment} />
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {feedback.feedback_text}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(feedback.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
