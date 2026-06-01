import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, reports } from "@arb/db";
import { buildRenderBundle } from "@arb/ai";
import { ReportView } from "@/components/ReportView";

export const dynamic = "force-dynamic";

/**
 * Public, anonymous read-only viewer. Resolves only `unlisted` reports by
 * their unguessable slug. The report is compiled server-side; the client
 * evaluates it (interactive web branch). This is the shareable artifact.
 */
export default async function ViewerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [report] = await db.select().from(reports).where(eq(reports.slug, slug)).limit(1);
  if (!report || report.visibility !== "unlisted") notFound();

  const bundle = await buildRenderBundle(report.id);

  return (
    <main style={{ background: "#ffffff", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 24px", borderBottom: "1px solid #ececec" }}>
        <a href={`/api/pdf/${report.id}`} style={{ fontSize: 13, color: "#0b62d6", textDecoration: "none" }}>
          Download PDF
        </a>
      </div>
      {bundle.hasReport && bundle.compiledCode ? (
        <ReportView compiledCode={bundle.compiledCode} data={bundle.data} />
      ) : (
        <div style={{ padding: 48, color: "#767676" }}>This report has no content yet.</div>
      )}
    </main>
  );
}
