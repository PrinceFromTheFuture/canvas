import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db, reportRuns, reports } from "@arb/db";
import { startRun, RunConflictError } from "@arb/ai";
import { enqueueRun, requestCancel, tailRun } from "@arb/streaming";
import { protectedProcedure, router } from "../trpc";

async function assertReportOwner(reportId: string, userId: string) {
  const [report] = await db.select().from(reports).where(eq(reports.id, reportId)).limit(1);
  if (!report) throw new TRPCError({ code: "NOT_FOUND" });
  if (report.ownerId !== userId) throw new TRPCError({ code: "FORBIDDEN" });
  return report;
}

export const runRouter = router({
  /**
   * Start a generation turn: append the user message, acquire the DB run lock,
   * and enqueue the job for a worker. The lock (partial unique index) makes a
   * double-start return CONFLICT instead of spawning two producers.
   */
  start: protectedProcedure
    .input(z.object({ reportId: z.string().uuid(), message: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const report = await assertReportOwner(input.reportId, ctx.userId);

      const userMessage = {
        id: nanoid(),
        role: "user",
        parts: [{ type: "text", text: input.message }],
      };
      const conversation = [...((report.conversation ?? []) as unknown[]), userMessage];
      await db
        .update(reports)
        .set({ conversation: conversation as never, prompt: input.message, updatedAt: new Date() })
        .where(eq(reports.id, input.reportId));

      let runId: string;
      try {
        runId = await startRun(input.reportId);
      } catch (err) {
        if (err instanceof RunConflictError) {
          throw new TRPCError({ code: "CONFLICT", message: err.message });
        }
        throw err;
      }

      await enqueueRun({ runId, reportId: input.reportId });
      return { runId };
    }),

  /**
   * Tail the run's Redis stream. `fromId` makes resume/reconnect a cursor
   * replay: pass the last seen stream id and you get exactly what you missed
   * plus live updates, ending on the terminal marker. SSE transport.
   */
  subscribe: protectedProcedure
    .input(z.object({ runId: z.string().uuid(), fromId: z.string().optional() }))
    .subscription(async function* ({ ctx, input, signal }) {
      const [run] = await db.select().from(reportRuns).where(eq(reportRuns.id, input.runId)).limit(1);
      if (!run) throw new TRPCError({ code: "NOT_FOUND" });
      await assertReportOwner(run.reportId, ctx.userId);

      for await (const event of tailRun(input.runId, { fromId: input.fromId, signal })) {
        yield event;
      }
    }),

  /** Out-of-band cooperative cancel via the cross-process Redis flag. */
  cancel: protectedProcedure
    .input(z.object({ runId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [run] = await db.select().from(reportRuns).where(eq(reportRuns.id, input.runId)).limit(1);
      if (!run) throw new TRPCError({ code: "NOT_FOUND" });
      await assertReportOwner(run.reportId, ctx.userId);
      await requestCancel(input.runId);
      return { ok: true };
    }),
});
