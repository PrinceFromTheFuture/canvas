import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db, reports } from "@arb/db";
import { buildRenderBundle } from "@arb/ai";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../trpc";

async function ownedReport(id: string, userId: string) {
  const [report] = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
  if (!report) throw new TRPCError({ code: "NOT_FOUND" });
  if (report.ownerId !== userId) throw new TRPCError({ code: "FORBIDDEN" });
  return report;
}

export const reportRouter = router({
  create: protectedProcedure
    .input(z.object({ title: z.string().optional(), prompt: z.string().optional(), datasetId: z.string().uuid().optional() }))
    .mutation(async ({ ctx, input }) => {
      const [report] = await db
        .insert(reports)
        .values({
          ownerId: ctx.userId,
          // 21-char URL-safe slug: unguessable enough for unlisted sharing.
          slug: nanoid(21),
          title: input.title ?? "Untitled report",
          prompt: input.prompt ?? "",
          datasetId: input.datasetId ?? null,
        })
        .returning();
      return report;
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return db.select().from(reports).where(eq(reports.ownerId, ctx.userId)).orderBy(desc(reports.updatedAt));
  }),

  getById: protectedProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
    return ownedReport(input.id, ctx.userId);
  }),

  /** Public read used by the /r/:slug viewer. Only unlisted reports resolve. */
  getBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
    const [report] = await db.select().from(reports).where(eq(reports.slug, input.slug)).limit(1);
    if (!report || report.visibility !== "unlisted") throw new TRPCError({ code: "NOT_FOUND" });
    return {
      id: report.id,
      title: report.title,
      slug: report.slug,
      sourceJsx: report.sourceJsx,
      dataSnapshot: report.dataSnapshot,
      updatedAt: report.updatedAt,
    };
  }),

  /** Compiled code + data for the live builder preview (owner only). */
  renderBundle: protectedProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
    await ownedReport(input.id, ctx.userId);
    return buildRenderBundle(input.id);
  }),

  setVisibility: protectedProcedure
    .input(z.object({ id: z.string().uuid(), visibility: z.enum(["private", "unlisted"]) }))
    .mutation(async ({ ctx, input }) => {
      await ownedReport(input.id, ctx.userId);
      await db.update(reports).set({ visibility: input.visibility, updatedAt: new Date() }).where(eq(reports.id, input.id));
      return { ok: true };
    }),

  attachDataset: protectedProcedure
    .input(z.object({ id: z.string().uuid(), datasetId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ownedReport(input.id, ctx.userId);
      await db.update(reports).set({ datasetId: input.datasetId, updatedAt: new Date() }).where(and(eq(reports.id, input.id)));
      return { ok: true };
    }),
});
