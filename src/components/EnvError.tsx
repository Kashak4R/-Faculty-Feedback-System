import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function EnvError() {
  const missingVars = [];
  if (!import.meta.env.VITE_SUPABASE_URL) missingVars.push('VITE_SUPABASE_URL');
  if (!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) missingVars.push('VITE_SUPABASE_PUBLISHABLE_KEY');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/10 p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <CardTitle className="text-2xl">Configuration Error</CardTitle>
          </div>
          <CardDescription>
            Missing required environment variables
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Environment Variables Missing</AlertTitle>
            <AlertDescription>
              The following environment variables are required but not configured:
              <ul className="list-disc list-inside mt-2 space-y-1">
                {missingVars.map((varName) => (
                  <li key={varName} className="font-mono text-sm">{varName}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <h3 className="font-semibold">How to fix:</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium mb-1">For Vercel Deployment:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2 text-muted-foreground">
                  <li>Go to your Vercel project settings</li>
                  <li>Navigate to "Environment Variables"</li>
                  <li>Add the following variables:
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1 font-mono">
                      <li>VITE_SUPABASE_URL = your_supabase_url</li>
                      <li>VITE_SUPABASE_PUBLISHABLE_KEY = your_supabase_anon_key</li>
                    </ul>
                  </li>
                  <li>Redeploy your application</li>
                </ol>
              </div>
              
              <div>
                <p className="font-medium mb-1">For Local Development:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2 text-muted-foreground">
                  <li>Create a <code className="bg-muted px-1 rounded">.env</code> file in the project root</li>
                  <li>Add the following variables:
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1 font-mono">
                      <li>VITE_SUPABASE_URL=your_supabase_url</li>
                      <li>VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key</li>
                    </ul>
                  </li>
                  <li>Restart your development server</li>
                </ol>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

