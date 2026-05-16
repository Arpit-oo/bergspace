import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function EmployeesPage() {
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

  const { data: employees } = await supabase
    .from("profiles")
    .select("*, department:departments(*)")
    .order("full_name");

  const managerIds = [...new Set(employees?.map((e) => e.manager_id).filter(Boolean) || [])];
  const { data: managers } = managerIds.length > 0
    ? await supabase.from("profiles").select("id, full_name").in("id", managerIds)
    : { data: [] };
  const managerMap = new Map((managers || []).map((m) => [m.id, m.full_name]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1A1A1A]">All Employees</h1>
        <span className="font-mono text-xs tabular-nums text-[#5C564C] border border-[#E8E2D6] rounded-full px-3 py-1">
          {employees?.length || 0} total
        </span>
      </div>

      <div className="bg-white border border-[#E8E2D6] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E8E2D6]">
          <h2 className="text-sm font-semibold tracking-tight text-[#1A1A1A]">Employee Directory</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F5F1EA]">
                {["Name", "Email", "Role", "Department", "Manager", "Status"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#A89F91]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees?.map((emp) => (
                <tr
                  key={emp.id}
                  className="border-b border-[#F5F1EA] hover:bg-[#FEFCF9] transition-colors"
                >
                  <td className="px-4 py-3 text-sm font-medium text-[#1A1A1A]">
                    {emp.full_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#5C564C]">{emp.email}</td>
                  <td className="px-4 py-3">
                    {emp.role === "admin" ? (
                      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}>
                        ADMIN
                      </span>
                    ) : emp.role === "manager" ? (
                      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-50 text-green-700">
                        MGR
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F5F1EA] text-[#5C564C]">
                        EMP
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#1A1A1A]">
                    {emp.department?.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#1A1A1A]">
                    {(emp.manager_id && managerMap.get(emp.manager_id)) || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {emp.is_active ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#3D9A5F]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#3D9A5F]" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D94F3D]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D94F3D]" />
                        Inactive
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {(!employees || employees.length === 0) && (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center text-[#A89F91] text-sm py-12 border border-dashed border-[#E8E2D6] rounded-xl m-4"
                  >
                    No employees found.
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
