"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Notification } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Bell,
  Check,
  CheckCheck,
  Loader2,
  Target,
  AlertTriangle,
  Calendar,
  Share2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

const typeIcons: Record<string, React.ElementType> = {
  goal_submitted: Target,
  goal_approved: Check,
  goal_returned: ArrowLeft,
  checkin_reminder: Calendar,
  escalation: AlertTriangle,
  shared_goal_assigned: Share2,
};

const typeDotColors: Record<string, string> = {
  goal_submitted: "#C45A2D",
  goal_approved: "#3D9A5F",
  goal_returned: "#D94F3D",
  checkin_reminder: "#C08B30",
  escalation: "#D94F3D",
  shared_goal_assigned: "#C45A2D",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [viewingNotification, setViewingNotification] = useState<Notification | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const fetchNotifications = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth/login");
      return;
    }

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setNotifications(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Check if telegram is linked
  useEffect(() => {
    async function checkTelegram() {
      const { data } = await supabase.from("telegram_links").select("id").limit(1);
      if (data && data.length > 0) setTelegramLinked(true);
    }
    checkTelegram();
  }, []);

  async function generateLinkCode() {
    const res = await fetch("/api/telegram/link-code", { method: "POST" });
    const data = await res.json();
    if (data.code) {
      setLinkCode(data.code);
      toast.success("Link code generated!");
    } else {
      toast.error("Failed to generate code");
    }
  }

  async function markAsRead(id: string) {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (error) {
      toast.error("Failed to mark as read");
      return;
    }

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  }

  async function markAllAsRead() {
    setMarkingAll(true);
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) {
      setMarkingAll(false);
      return;
    }

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds);

    if (error) {
      toast.error("Failed to mark all as read");
    } else {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success("All notifications marked as read");
    }
    setMarkingAll(false);
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-[#A89F91]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Telegram Link section */}
      <div className="bg-white border border-[#E8E2D6] rounded-xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-[#1A1A1A]">Telegram Notifications</h3>
            <p className="text-sm text-[#8C8578] mt-1">Get goal updates and take actions directly from Telegram</p>
          </div>
          {telegramLinked ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#3D9A5F]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3D9A5F]" />
              Linked
            </span>
          ) : (
            <button onClick={generateLinkCode} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{backgroundColor:"#C45A2D"}}>
              Link Telegram
            </button>
          )}
        </div>
        {linkCode && (
          <div className="mt-4 p-4 bg-[#F5F1EA] rounded-lg">
            <p className="text-sm text-[#5C564C]">Open Telegram → search <strong>@BergSpacebot</strong></p>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-3">
                <span className="shrink-0 w-5 h-5 rounded-full bg-[#1A1A1A] text-white text-[10px] font-bold flex items-center justify-center">1</span>
                <p className="text-sm text-[#5C564C]">Send <code className="font-mono font-semibold bg-white px-2 py-0.5 rounded border border-[#E8E2D6]">/start</code> to the bot</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="shrink-0 w-5 h-5 rounded-full bg-[#1A1A1A] text-white text-[10px] font-bold flex items-center justify-center">2</span>
                <p className="text-sm text-[#5C564C]">Then send the link code:</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <code className="text-lg font-mono font-bold text-[#1A1A1A] bg-white px-4 py-2 rounded border border-[#E8E2D6]">/link {linkCode}</code>
              <button onClick={() => {navigator.clipboard.writeText(`/link ${linkCode}`); toast.success("Copied!")}} className="text-xs text-[#8C8578] hover:text-[#1A1A1A]">Copy</button>
            </div>
            <p className="text-xs text-[#A89F91] mt-2">Code expires in 10 minutes</p>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-[#1A1A1A]">Notifications</h1>
          {unreadCount > 0 && (
            <span className="font-mono text-xs font-medium tabular-nums px-2.5 py-0.5 rounded-full" style={{ backgroundColor: "#FEF2EE", color: "#C45A2D" }}>
              {unreadCount} unread
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            disabled={markingAll}
            className="gap-1.5 border-[#E8E2D6] text-[#5C564C] text-sm"
          >
            {markingAll ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <CheckCheck className="h-3 w-3" />
            )}
            Mark All Read
          </Button>
        )}
      </div>

      {notifications.length === 0 && (
        <div className="border border-dashed border-[#E8E2D6] rounded-xl bg-white py-12 text-center">
          <Bell className="h-8 w-8 mx-auto mb-2 text-[#E8E2D6]" />
          <p className="text-sm text-[#A89F91]">No notifications yet.</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {notifications.map((notif) => {
          const Icon = typeIcons[notif.type] || Bell;
          const dotColor = typeDotColors[notif.type] || "#A89F91";
          const time = new Date(notif.created_at).toLocaleString();

          return (
            <div
              key={notif.id}
              className="border border-[#E8E2D6] rounded-xl bg-white p-4 hover:bg-[#FEFCF9] transition-colors cursor-pointer"
              onClick={() => { markAsRead(notif.id); setViewingNotification(notif); }}
            >
              <div className="flex items-start gap-3">
                {/* Unread dot indicator */}
                <div
                  className="mt-1.5 w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: !notif.is_read ? dotColor : "transparent" }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm text-[#1A1A1A] ${!notif.is_read ? "font-medium" : ""}`}>
                      {notif.title}
                    </p>
                    <span className="font-mono text-xs text-[#A89F91] tabular-nums shrink-0">
                      {time}
                    </span>
                  </div>
                  <p className="text-sm text-[#5C564C] mt-0.5">
                    {notif.message}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {notif.link && (
                      <Link href={notif.link}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          style={{ color: "#C45A2D" }}
                        >
                          View
                        </Button>
                      </Link>
                    )}
                    {!notif.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-[#5C564C]"
                        onClick={() => markAsRead(notif.id)}
                      >
                        Mark as read
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!viewingNotification} onOpenChange={(o) => !o && setViewingNotification(null)}>
        <DialogContent className="max-w-xl p-6 bg-white border border-[#E8E2D6]">
          {viewingNotification && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold text-[#1A1A1A]">{viewingNotification.title}</DialogTitle>
                <DialogDescription className="text-xs text-[#A89F91] font-mono">
                  {new Date(viewingNotification.created_at).toLocaleString()}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-[#5C564C] leading-relaxed whitespace-pre-wrap">{viewingNotification.message}</p>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-[#E8E2D6]">
                {viewingNotification.link && (
                  <a href={viewingNotification.link} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: "#C45A2D" }}>
                    View Details
                  </a>
                )}
                <Button variant="outline" onClick={() => setViewingNotification(null)} className="border-[#E8E2D6]">Close</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
