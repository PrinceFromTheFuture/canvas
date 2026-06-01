import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { Builder } from "@/components/Builder";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) redirect("/login");

  const { id } = await params;
  const appUrl = process.env.APP_URL ?? "";
  return <Builder reportId={id} appUrl={appUrl} />;
}
