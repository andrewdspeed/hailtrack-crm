import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, Phone, Mail, Clock } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface ChatInterfaceProps {
  customerId: number;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  senderType: "customer" | "staff";
  senderName: string;
  vehicleId?: number;
}

export function ChatInterface({
  customerId,
  customerName,
  customerPhone,
  customerEmail,
  senderType,
  senderName,
  vehicleId,
}: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages
  const { data: messages = [], refetch, isLoading } = useQuery({
    queryKey: ["messaging.getByCustomerId", customerId],
    queryFn: () =>
      trpc.messaging.getByCustomerId.query({
        customerId,
        limit: 100,
      }),
    refetchInterval: 3000, // Poll every 3 seconds
  });

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: (text: string) =>
      trpc.messaging.send.mutate({
        customerId,
        vehicleId,
        senderType,
        senderName,
        message: text,
      }),
    onSuccess: () => {
      setMessage("");
      toast.success("Message sent");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to send message");
      console.error(error);
    },
  });

  // Mark messages as read
  const markAsReadMutation = useMutation({
    mutationFn: (messageIds: number[]) =>
      trpc.messaging.markAsRead.mutate({ messageIds }),
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark unread messages as read
  useEffect(() => {
    const unreadIds = messages
      .filter(m => !m.isRead && m.senderType !== senderType)
      .map(m => m.id);

    if (unreadIds.length > 0) {
      markAsReadMutation.mutate(unreadIds);
    }
  }, [messages]);

  const handleSend = () => {
    if (!message.trim()) return;
    sendMutation.mutate(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background rounded-lg border">
      {/* Header */}
      <div className="p-4 border-b bg-muted/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">{customerName}</h3>
            <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
              {customerPhone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {customerPhone}
                </div>
              )}
              {customerEmail && (
                <div className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {customerEmail}
                </div>
              )}
            </div>
          </div>
          <Badge variant="outline">{senderType === "staff" ? "Staff" : "Customer"}</Badge>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No messages yet. Start a conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.senderType === senderType ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.senderType === senderType
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{msg.senderName}</span>
                  <span className="text-xs opacity-70 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm break-words">{msg.message}</p>
                {msg.attachmentUrl && (
                  <a
                    href={msg.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs underline mt-1 block"
                  >
                    View attachment
                  </a>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-muted/30">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={sendMutation.isPending}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={sendMutation.isPending || !message.trim()}
            size="icon"
          >
            {sendMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
