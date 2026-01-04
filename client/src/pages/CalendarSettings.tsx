import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function CalendarSettings() {
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Mock user ID - in production, get from auth context
  const userId = 1;

  const checkConnection = trpc.calendar.isConnected.useQuery({ userId });

  useEffect(() => {
    if (checkConnection.data) {
      setIsConnected(checkConnection.data.connected);
      setIsChecking(false);
    }
  }, [checkConnection.data]);

  const getAuthUrl = trpc.calendar.getAuthUrl.useQuery(
    { redirectUri: `${window.location.origin}/api/auth/google/callback` },
    { enabled: false }
  );

  const handleConnect = async () => {
    try {
      const result = await getAuthUrl.refetch();
      if (result.data) {
        // Open Google OAuth in new window
        window.location.href = result.data.authUrl;
      }
    } catch (error) {
      toast.error("Failed to initiate Google Calendar connection");
      console.error(error);
    }
  };

  const exchangeCode = trpc.calendar.exchangeCode.useMutation();

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    
    if (code) {
      // Exchange code for tokens
      const redirectUri = `${window.location.origin}/api/auth/google/callback`;
      exchangeCode.mutate({
        code,
        redirectUri,
        userId,
      }, {
        onSuccess: () => {
          toast.success("Google Calendar connected successfully!");
          setIsConnected(true);
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
        },
        onError: (error: any) => {
          toast.error("Failed to connect Google Calendar");
          console.error(error);
        }
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Calendar Integration</h1>
          <p className="text-muted-foreground">
            Connect your Google Calendar to automatically sync scheduled appointments
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Google Calendar</CardTitle>
                  <CardDescription>
                    Sync lead appointments with your Google Calendar
                  </CardDescription>
                </div>
              </div>
              
              {isChecking ? (
                <div className="text-sm text-muted-foreground">Checking...</div>
              ) : isConnected ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <XCircle className="h-5 w-5" />
                  <span className="font-medium">Not Connected</span>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {!isConnected ? (
              <>
                <div className="space-y-2">
                  <h3 className="font-semibold">Why connect Google Calendar?</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Automatically create calendar events when leads are scheduled</li>
                    <li>• Include customer details, vehicle info, and appointment notes</li>
                    <li>• Get reminders 24 hours and 30 minutes before appointments</li>
                    <li>• Sync across all your devices</li>
                  </ul>
                </div>

                <Button onClick={handleConnect} className="w-full md:w-auto">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Connect Google Calendar
                </Button>

                <div className="text-xs text-muted-foreground">
                  By connecting, you authorize Hail Solutions CRM to create and manage calendar events on your behalf.
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <h3 className="font-semibold">Calendar Integration Active</h3>
                  <p className="text-sm text-muted-foreground">
                    When you move a lead to "Scheduled" status, a calendar event will automatically be created in your Google Calendar.
                  </p>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <h4 className="font-medium text-sm">What's included in calendar events:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Customer name and contact information</li>
                    <li>• Vehicle details (year, make, model)</li>
                    <li>• Appointment address</li>
                    <li>• Any notes you've added to the lead</li>
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {isConnected && (
          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                  <div>
                    <strong>Create or update a lead</strong>
                    <p className="text-muted-foreground">Add customer and vehicle information to your CRM</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <div>
                    <strong>Move to "Scheduled" status</strong>
                    <p className="text-muted-foreground">Set the appointment date and time</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    3
                  </span>
                  <div>
                    <strong>Calendar event created automatically</strong>
                    <p className="text-muted-foreground">Check your Google Calendar - the appointment is there!</p>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
