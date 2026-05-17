"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Profile, Department } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Send, Loader2, Users, Building, X, Bell, Mail, MessageSquare } from "lucide-react";

interface AnnouncementsViewProps {
  profile: Profile;
  users: (Profile & { departments?: { name: string } })[];
  departments: Department[];
}

export function AnnouncementsView({ profile, users, departments }: AnnouncementsViewProps) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [channels, setChannels] = useState({ inApp: true, email: false, telegram: false });
  const [loading, setSending] = useState(false);
  const [sent, setSent] = useState(0);
  const supabase = createClient();

  function selectAll(role?: string) {
    const ids = users.filter(u => !role || u.role === role).map(u => u.id);
    setSelectedIds(new Set(ids));
  }

  function selectDepartment(deptId: string) {
    const ids = users.filter(u => u.department_id === deptId).map(u => u.id);
    setSelectedIds(prev => new Set([...prev, ...ids]));
  }

  function toggleUser(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function removeUser(id: string) {
    setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
  }

  async function sendAnnouncement() {
    if (!subject.trim()) { toast.error("Subject required"); return; }
    if (!message.trim()) { toast.error("Message required"); return; }
    if (selectedIds.size === 0) { toast.error("Select at least one recipient"); return; }

    setSending(true);
    setSent(0);
    let count = 0;

    for (const userId of selectedIds) {
      // In-App notification
      if (channels.inApp) {
        await supabase.from("notifications").insert({
          user_id: userId,
          type: "checkin_reminder",
          title: subject,
          message: message,
          link: "/dashboard/notifications",
        });
      }

      // Email
      if (channels.email) {
        try {
          await fetch("/api/notifications/email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "announcement", recipientId: userId, subject, message }),
          });
        } catch {}
      }

      // Telegram
      if (channels.telegram) {
        try {
          await fetch("/api/notifications/telegram", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "announcement", recipientId: userId, employeeName: `${subject}\n\n${message}` }),
          });
        } catch {}
      }

      count++;
      setSent(count);
    }

    toast.success(`Announcement sent to ${count} recipients`);
    setSubject("");
    setMessage("");
    setSelectedIds(new Set());
    setSending(false);
  }

  const selectedUsers = users.filter(u => selectedIds.has(u.id));

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-[#1A1A1A]">Send Announcement</h1>
      <p className="text-[#8C8578]">Broadcast notifications to employees and managers via multiple channels.</p>

      <div className="bg-white border border-[#E8E2D6] rounded-xl p-6 space-y-5">
        {/* Subject */}
        <div>
          <Label className="text-sm font-medium text-[#1A1A1A] mb-1.5 block">Subject</Label>
          <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g., Q2 Check-in Reminder" className="border-[#E8E2D6]" />
        </div>

        {/* Message */}
        <div>
          <Label className="text-sm font-medium text-[#1A1A1A] mb-1.5 block">Message</Label>
          <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Write your announcement..." rows={4} className="border-[#E8E2D6] resize-none" />
        </div>

        {/* Quick Select */}
        <div>
          <Label className="text-sm font-medium text-[#1A1A1A] mb-2 block">Recipients</Label>
          <div className="flex flex-wrap gap-2 mb-3">
            <button onClick={() => selectAll()} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#E8E2D6] hover:bg-[#F5F1EA] transition-colors text-[#1A1A1A]">
              <Users className="h-3 w-3" /> All Users
            </button>
            <button onClick={() => selectAll("employee")} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#E8E2D6] hover:bg-[#F5F1EA] transition-colors text-[#1A1A1A]">
              All Employees
            </button>
            <button onClick={() => selectAll("manager")} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#E8E2D6] hover:bg-[#F5F1EA] transition-colors text-[#1A1A1A]">
              All Managers
            </button>
            {departments.map(d => (
              <button key={d.id} onClick={() => selectDepartment(d.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#E8E2D6] hover:bg-[#F5F1EA] transition-colors text-[#5C564C]">
                <Building className="h-3 w-3" /> {d.name}
              </button>
            ))}
          </div>

          {/* Selected recipients pills */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3 p-3 bg-[#F5F1EA] rounded-lg">
              {selectedUsers.map(u => (
                <span key={u.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white border border-[#E8E2D6] text-xs font-medium text-[#1A1A1A]">
                  {u.full_name}
                  <button onClick={() => removeUser(u.id)} className="text-[#A89F91] hover:text-[#D94F3D]"><X className="h-3 w-3" /></button>
                </span>
              ))}
              <span className="text-xs text-[#8C8578] self-center ml-2">{selectedUsers.length} selected</span>
            </div>
          )}

          {/* Individual user checkboxes */}
          <div className="max-h-48 overflow-y-auto border border-[#E8E2D6] rounded-lg divide-y divide-[#F5F1EA]">
            {users.map(u => (
              <label key={u.id} className="flex items-center gap-3 px-3 py-2 hover:bg-[#FEFCF9] cursor-pointer">
                <Checkbox checked={selectedIds.has(u.id)} onCheckedChange={() => toggleUser(u.id)} />
                <span className="text-sm text-[#1A1A1A]">{u.full_name}</span>
                <span className="text-xs text-[#A89F91]">{u.email}</span>
                <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#F5F1EA] text-[#8C8578] uppercase">{u.role}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Channels */}
        <div>
          <Label className="text-sm font-medium text-[#1A1A1A] mb-2 block">Channels</Label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={channels.inApp} onCheckedChange={(c) => setChannels(prev => ({ ...prev, inApp: !!c }))} />
              <Bell className="h-3.5 w-3.5 text-[#8C8578]" />
              <span className="text-sm text-[#1A1A1A]">In-App</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={channels.email} onCheckedChange={(c) => setChannels(prev => ({ ...prev, email: !!c }))} />
              <Mail className="h-3.5 w-3.5 text-[#8C8578]" />
              <span className="text-sm text-[#1A1A1A]">Email</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={channels.telegram} onCheckedChange={(c) => setChannels(prev => ({ ...prev, telegram: !!c }))} />
              <MessageSquare className="h-3.5 w-3.5 text-[#8C8578]" />
              <span className="text-sm text-[#1A1A1A]">Telegram</span>
            </label>
          </div>
        </div>

        {/* Send */}
        <div className="flex items-center justify-between pt-2 border-t border-[#E8E2D6]">
          {loading ? (
            <p className="text-sm text-[#8C8578]">Sending to {sent}/{selectedIds.size} recipients...</p>
          ) : (
            <p className="text-sm text-[#8C8578]">{selectedIds.size} recipient{selectedIds.size !== 1 ? "s" : ""} selected</p>
          )}
          <Button onClick={sendAnnouncement} disabled={loading || selectedIds.size === 0} className="gap-2 text-white" style={{ backgroundColor: "#C45A2D" }}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send Announcement
          </Button>
        </div>
      </div>
    </div>
  );
}
