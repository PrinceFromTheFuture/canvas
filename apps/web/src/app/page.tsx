import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { logoutAction } from "@/lib/authActions";
import { Dashboard } from "@/components/Dashboard";

export default async function HomePage() {
  const userId = await getUserId();
  if (!userId) redirect("/login");

  return (
    <main className="mx-auto max-w-5xl p-6">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Reports</h1>
          <p className="text-sm text-[var(--chrome-muted)]">Upload data, describe a report, share a link.</p>
        </div>
        <form action={logoutAction}>
          <button className="text-sm text-[var(--chrome-muted)] hover:text-[var(--chrome-text)]">Sign out</button>
        </form>
      </header>
      <Dashboard />
    </main>
  );
}
