import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AuditPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/dashboard");

  const { data: logs } = await supabase
    .from("audit_log")
    .select("*, changed_by_profile:profiles!audit_log_changed_by_fkey(id, full_name, email)")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1A1A1A]">Audit Log</h1>
        <span className="font-mono text-xs tabular-nums text-[#5C564C] border border-[#E8E2D6] rounded-full px-3 py-1">
          {logs?.length || 0} entries
        </span>
      </div>

      <div className="bg-white border border-[#E8E2D6] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E8E2D6]">
          <h2 className="text-sm font-semibold tracking-tight text-[#1A1A1A]">Recent Changes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F5F1EA]">
                {["Timestamp", "Table", "Field", "Old Value", "", "New Value", "Changed By", "Reason"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#A89F91] whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs?.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-[#F5F1EA] hover:bg-[#FEFCF9] transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-[11px] text-[#A89F91] tabular-nums whitespace-nowrap">
                    {new Date(entry.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-[11px] text-[#5C564C] border border-[#E8E2D6] rounded px-1.5 py-0.5">
                      {entry.table_name}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-[#1A1A1A]">
                    {entry.field_name}
                  </td>
                  <td className="px-4 py-3">
                    {entry.old_value !== null ? (
                      <span className="inline-block font-mono text-[11px] bg-red-50 text-red-700 px-2 py-0.5 rounded">
                        {entry.old_value}
                      </span>
                    ) : (
                      <span className="text-[#A89F91]">{"—"}</span>
                    )}
                  </td>
                  <td className="px-1 py-3 text-[#A89F91] text-sm text-center">
                    {entry.old_value !== null || entry.new_value !== null ? "→" : ""}
                  </td>
                  <td className="px-4 py-3">
                    {entry.new_value !== null ? (
                      <span className="inline-block font-mono text-[11px] bg-green-50 text-green-700 px-2 py-0.5 rounded">
                        {entry.new_value}
                      </span>
                    ) : (
                      <span className="text-[#A89F91]">{"—"}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#1A1A1A]">
                    {entry.changed_by_profile?.full_name || entry.changed_by}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#A89F91] max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
                    {entry.reason || "—"}
                  </td>
                </tr>
              ))}
              {(!logs || logs.length === 0) && (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center text-[#A89F91] text-sm py-12"
                  >
                    <div className="border border-dashed border-[#E8E2D6] rounded-xl mx-4 py-8">
                      No audit entries found.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
