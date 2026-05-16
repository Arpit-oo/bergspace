"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Shield, Mail, MessageSquare } from "lucide-react";

export function SettingsView() {
  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-[#1A1A1A]">Settings</h1>

      {/* Microsoft Entra ID SSO */}
      <div className="bg-white border border-[#E8E2D6] rounded-xl overflow-hidden">
        <div className="px-5 py-5 border-b border-[#E8E2D6]">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5" style={{ color: "#C45A2D" }} />
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-[#1A1A1A]">
                Microsoft Entra ID (Azure AD) SSO
              </h2>
              <p className="text-sm text-[#5C564C] mt-0.5">
                Enable Single Sign-On via Microsoft Entra ID for your organization.
              </p>
            </div>
          </div>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full bg-yellow-50 text-yellow-700">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C08B30]" />
              Not Configured
            </span>
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <Label htmlFor="tenant-id" className="text-sm font-medium text-[#1A1A1A] mb-1 block">Tenant ID</Label>
              <Input
                id="tenant-id"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="border-[#E8E2D6] text-sm"
              />
            </div>
            <div>
              <Label htmlFor="client-id" className="text-sm font-medium text-[#1A1A1A] mb-1 block">Client ID (Application ID)</Label>
              <Input
                id="client-id"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="border-[#E8E2D6] text-sm"
              />
            </div>
            <div>
              <Label htmlFor="client-secret" className="text-sm font-medium text-[#1A1A1A] mb-1 block">Client Secret</Label>
              <Input
                id="client-secret"
                type="password"
                placeholder="Enter client secret"
                className="border-[#E8E2D6] text-sm"
              />
            </div>
          </div>
          <div className="bg-[#FEFCF9] rounded-xl p-4 text-sm text-[#5C564C] border border-[#E8E2D6]">
            <p className="font-medium text-[#1A1A1A] mb-2">Setup Instructions:</p>
            <ol className="list-decimal list-inside flex flex-col gap-1 text-sm">
              <li>Go to Azure Portal &rarr; App registrations &rarr; New registration</li>
              <li>Set name: &quot;BergSpace Portal&quot;</li>
              <li>
                Redirect URI:{" "}
                <code className="font-mono text-xs bg-[#F5F1EA] px-1 py-0.5 rounded">
                  https://your-domain.com/api/auth/callback
                </code>
              </li>
              <li>Copy Tenant ID, Client ID from Overview page</li>
              <li>Create Client Secret under Certificates &amp; secrets</li>
              <li>Add API permissions: User.Read, GroupMember.Read.All</li>
            </ol>
          </div>
          <Button
            onClick={() =>
              toast.info(
                "Configure Entra ID credentials in Supabase Dashboard → Auth → Providers → Azure"
              )
            }
            className="self-start text-white border-0"
            style={{ backgroundColor: "#C45A2D" }}
          >
            Save SSO Configuration
          </Button>
        </div>
      </div>

      <Separator className="bg-[#E8E2D6]" />

      {/* Email Notifications */}
      <div className="bg-white border border-[#E8E2D6] rounded-xl overflow-hidden">
        <div className="px-5 py-5 border-b border-[#E8E2D6]">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5" style={{ color: "#C45A2D" }} />
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-[#1A1A1A]">Email Notifications</h2>
              <p className="text-sm text-[#5C564C] mt-0.5">
                Configure email delivery for goal submissions, approvals, and reminders.
              </p>
            </div>
          </div>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-50 text-green-700">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3D9A5F]" />
              Active (Supabase Built-in)
            </span>
          </div>
          <p className="text-sm text-[#5C564C]">
            Email notifications are delivered via Supabase&apos;s built-in email
            service. Triggers:
          </p>
          <ul className="text-sm text-[#5C564C] list-disc list-inside flex flex-col gap-1">
            <li>Goal sheet submitted &rarr; Manager notified</li>
            <li>Goal sheet approved &rarr; Employee notified</li>
            <li>Goal sheet returned &rarr; Employee notified</li>
            <li>Check-in window opens &rarr; All employees notified</li>
            <li>Escalation triggered &rarr; Chain notified</li>
            <li>Shared goal assigned &rarr; Employee notified</li>
          </ul>
        </div>
      </div>

      <Separator className="bg-[#E8E2D6]" />

      {/* Teams Integration */}
      <div className="bg-white border border-[#E8E2D6] rounded-xl overflow-hidden">
        <div className="px-5 py-5 border-b border-[#E8E2D6]">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5" style={{ color: "#C45A2D" }} />
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-[#1A1A1A]">
                Microsoft Teams Integration
              </h2>
              <p className="text-sm text-[#5C564C] mt-0.5">
                Send adaptive card notifications to Teams channels.
              </p>
            </div>
          </div>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full bg-yellow-50 text-yellow-700">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C08B30]" />
              Not Configured
            </span>
          </div>
          <div>
            <Label htmlFor="teams-webhook" className="text-sm font-medium text-[#1A1A1A] mb-1 block">Incoming Webhook URL</Label>
            <Input
              id="teams-webhook"
              placeholder="https://outlook.office.com/webhook/..."
              className="border-[#E8E2D6] text-sm"
            />
          </div>
          <div className="bg-[#FEFCF9] rounded-xl p-4 text-sm text-[#5C564C] border border-[#E8E2D6]">
            <p className="font-medium text-[#1A1A1A] mb-2">Setup Instructions:</p>
            <ol className="list-decimal list-inside flex flex-col gap-1 text-sm">
              <li>Open Microsoft Teams &rarr; select a channel</li>
              <li>Click &#x22EF; &rarr; Connectors &rarr; Incoming Webhook</li>
              <li>Name it &quot;BergSpace&quot; and copy the URL</li>
              <li>Paste the URL above</li>
            </ol>
          </div>
          <Button
            onClick={() =>
              toast.info(
                "Teams webhook integration ready. Configure the webhook URL to enable."
              )
            }
            className="self-start text-white border-0"
            style={{ backgroundColor: "#C45A2D" }}
          >
            Save Teams Configuration
          </Button>
        </div>
      </div>
    </div>
  );
}
