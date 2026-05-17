"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  Users,
  BarChart3,
  Settings,
  Bell,
  LogOut,
  AlertTriangle,
  Calendar,
  Share2,
  ClipboardList,
  ChevronDown,
  Search,
  Eye,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["employee", "manager", "admin"] },
    ],
  },
  {
    label: "Goals",
    items: [
      { label: "My Goals", href: "/dashboard/goals", icon: FileText, roles: ["employee"] },
      { label: "My Check-ins", href: "/dashboard/my-checkins", icon: Calendar, roles: ["employee"] },
      { label: "Notifications", href: "/dashboard/notifications", icon: Bell, roles: ["employee"] },
      { label: "Team Goals", href: "/dashboard/team", icon: Users, roles: ["manager"] },
      { label: "Approvals", href: "/dashboard/approvals", icon: CheckSquare, roles: ["manager"] },
      { label: "Check-ins", href: "/dashboard/checkins", icon: ClipboardList, roles: ["manager"] },
      { label: "Shared Goals", href: "/dashboard/shared-goals", icon: Share2, roles: ["manager", "admin"] },
    ],
  },
  {
    label: "Organization",
    items: [
      { label: "Employees", href: "/dashboard/employees", icon: Users, roles: ["admin"] },
      { label: "Goal Cycles", href: "/dashboard/cycles", icon: Calendar, roles: ["admin"] },
      { label: "Escalations", href: "/dashboard/escalations", icon: AlertTriangle, roles: ["admin"] },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Reports", href: "/dashboard/reports", icon: BarChart3, roles: ["manager", "admin"] },
      { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3, roles: ["admin"] },
      { label: "Audit Log", href: "/dashboard/audit", icon: ClipboardList, roles: ["admin"] },
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "Settings", href: "/dashboard/settings", icon: Settings, roles: ["admin"] },
      { label: "Accessibility", href: "/dashboard/accessibility", icon: Eye, roles: ["employee", "manager", "admin"] },
    ],
  },
];

function PeakMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M2 19.2 L8.4 8.2 L11.3 13 L15.3 6 L22 19.2 Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14.05 8.2 L15.3 6 L16.55 8.2 L15.85 8.9 L15.3 8.3 L14.75 8.9 Z" fill="currentColor" stroke="none" />
      <path d="M7.5 9.7 L8.4 8.2 L9.3 9.7 L8.8 10.2 L8.4 9.7 L8 10.2 Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function DashboardShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const initials = profile.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar — dark, minimal */}
      <aside className="w-[240px] shrink-0 flex flex-col bg-[#1A1714] text-[#A89F91] border-r border-[#2E2A24]">
        {/* Logo */}
        <div className="h-14 flex items-center gap-2.5 px-5 border-b border-[#2E2A24]">
          <div className="text-[#C45A2D]">
            <PeakMark size={18} />
          </div>
          <span className="text-[13px] font-semibold tracking-wide text-[#F5F1EA]">
            BERGSPACE
          </span>
        </div>

        {/* Search */}
        <div className="px-3 pt-3 pb-1">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[#2E2A24] text-[#8C8578] text-[13px]">
            <Search className="h-3.5 w-3.5" />
            <span>Search...</span>
            <span className="ml-auto text-[10px] bg-[#3D3830] px-1.5 py-0.5 rounded text-[#A89F91]">⌘K</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          {navGroups.map((group, gi) => {
            const visible = group.items.filter((i) => i.roles.includes(profile.role));
            if (!visible.length) return null;

            return (
              <div key={gi} className={gi > 0 ? "mt-5" : ""}>
                {group.label && (
                  <div className="px-2 mb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[#6B6358]">
                    {group.label}
                  </div>
                )}
                {visible.map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        flex items-center gap-2.5 px-2.5 py-[7px] rounded-md text-[14px] transition-all duration-150
                        ${active
                          ? "bg-[#2E2A24] text-[#F5F1EA] font-medium"
                          : "text-[#A89F91] hover:text-[#F5F1EA] hover:bg-[#2E2A24]/50"
                        }
                      `}
                    >
                      <item.icon className="h-4 w-4 shrink-0 opacity-70" strokeWidth={1.75} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-[#2E2A24] p-3">
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full flex items-center gap-2.5 p-2 rounded-md hover:bg-[#2E2A24] transition-colors">
              <div className="h-7 w-7 rounded-full bg-[#C45A2D] flex items-center justify-center text-[10px] font-semibold text-white shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-[13px] font-medium text-[#F5F1EA] truncate">
                  {profile.full_name}
                </div>
                <div className="text-xs text-[#8C8578] truncate">
                  {profile.department?.name || profile.role}
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-[#6B6358] shrink-0" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-[216px] mb-1">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{profile.full_name}</p>
                <p className="text-xs text-muted-foreground">{profile.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/dashboard/notifications")}>
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-500 focus:text-red-500">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#FEFCF9]">
        {/* Top bar */}
        <header className="h-14 shrink-0 flex items-center justify-between px-8 bg-white border-b border-[#E5E5E5]">
          <div className="flex items-center gap-3">
            <span className={`
              text-[11px] font-medium px-2 py-0.5 rounded-full
              ${profile.role === "admin"
                ? "bg-[#FEF3EE] text-[#C45A2D]"
                : profile.role === "manager"
                  ? "bg-[#F0FDF4] text-[#16A34A]"
                  : "bg-[#F5F5F5] text-[#737373]"
              }
            `}>
              {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
            </span>
            {profile.department && (
              <span className="text-[13px] text-[#A3A3A3]">
                {profile.department.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/notifications"
              className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-[#F5F5F5] transition-colors text-[#737373] hover:text-[#171717]"
            >
              <Bell className="h-4 w-4" strokeWidth={1.75} />
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1200px] mx-auto px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
