import { useQuery } from "@tanstack/react-query";
import { Message } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

export function MessageList({ visibility = "public" }: { visibility?: string }) {
  const { user } = useAuth();

  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages", { visibility }],
    queryFn: async ({ queryKey }) => {
      const [_, params] = queryKey;
      const searchParams = new URLSearchParams(params as Record<string, string>);
      const res = await fetch(`/api/messages?${searchParams}`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!messages?.length) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No messages found
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <Card key={message.id}>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium">
                {message.visibility === "public"
                  ? "Public Message"
                  : message.visibility === "domain"
                  ? `Domain: ${message.domain}`
                  : "Admin Only"}
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                {format(new Date(message.createdAt), "PPp")}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{message.content}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
