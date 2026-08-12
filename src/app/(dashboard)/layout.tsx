import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SignOutButton } from "./sign-out-button";

const NAV = [
  { href: "/", label: "ダッシュボード" },
  { href: "/projects", label: "案件管理" },
  { href: "/expenses", label: "経費入力" },
  { href: "/settlements", label: "立替精算" },
  { href: "/revenue-split", label: "個人別売上" },
] as const;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const [{ data: { user } }, { data: members }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("members").select("id, name").eq("is_active", true).order("name"),
  ]);
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 flex-col border-r border-slate-200 bg-slate-50">
        <div className="border-b border-slate-200 px-4 py-3">
          <span className="text-sm font-semibold text-slate-900">財務管理</span>
        </div>
        <nav className="flex-1 px-2 py-3">
          <div className="space-y-0.5">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-200"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="mt-4 border-t border-slate-200 pt-4">
            <span className="block px-3 text-sm font-semibold text-slate-900">タスク管理</span>
            <div className="mt-1 space-y-0.5">
              <Link href="/tasks" className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-200">
                タスク一覧
              </Link>
              {(members ?? []).map((m) => (
                <Link
                  key={m.id}
                  href={`/tasks?assigned=${m.id}`}
                  className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-200"
                >
                  {m.name}タスク一覧
                </Link>
              ))}
            </div>
          </div>
        </nav>
        <div className="border-t border-slate-200 px-4 py-3">
          <p className="truncate text-xs text-slate-500">{user.email}</p>
          <SignOutButton />
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-white p-6">{children}</main>
    </div>
  );
}
