import { eq } from "drizzle-orm";
import { db, datasets, reports, type DatasetProfile, type Report } from "@arb/db";
import { getRows, type Row } from "@arb/data";
import type { UIMessage } from "ai";

export interface RunInputs {
  report: Report;
  rows: Row[];
  profile: DatasetProfile | null;
  conversation: UIMessage[];
}

/** Load everything the run loop needs: report, conversation, dataset rows. */
export async function loadRunInputs(reportId: string): Promise<RunInputs> {
  const [report] = await db.select().from(reports).where(eq(reports.id, reportId)).limit(1);
  if (!report) throw new Error(`Report ${reportId} not found`);

  let rows: Row[] = [];
  let profile: DatasetProfile | null = null;
  if (report.datasetId) {
    const [dataset] = await db.select().from(datasets).where(eq(datasets.id, report.datasetId)).limit(1);
    if (dataset) {
      profile = dataset.profile ?? null;
      rows = await getRows(dataset.storageRef);
    }
  }

  return {
    report,
    rows,
    profile,
    conversation: (report.conversation ?? []) as unknown as UIMessage[],
  };
}
