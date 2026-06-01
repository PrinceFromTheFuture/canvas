import { z } from "zod";
import { db, datasets } from "@arb/db";
import { parseDataset, putRows } from "@arb/data";
import { protectedProcedure, router } from "../trpc";

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export const datasetRouter = router({
  /**
   * Upload + parse + profile in one step. The base64 path keeps the MVP to a
   * single transport (tRPC); large files would move to a presigned direct
   * upload later. We persist parsed rows (not the raw upload) so the worker
   * reads structured data back cheaply.
   */
  upload: protectedProcedure
    .input(
      z.object({
        filename: z.string(),
        mediaType: z.string(),
        contentBase64: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const bytes = Buffer.from(input.contentBase64, "base64");
      if (bytes.byteLength > MAX_UPLOAD_BYTES) {
        throw new Error(`File too large (max ${MAX_UPLOAD_BYTES} bytes)`);
      }
      const { rows, profile } = parseDataset({ filename: input.filename, mediaType: input.mediaType, bytes });
      const storageRef = await putRows(rows);
      const [dataset] = await db
        .insert(datasets)
        .values({
          ownerId: ctx.userId,
          filename: input.filename,
          mediaType: input.mediaType,
          storageRef,
          rowCount: profile.rowCount,
          profile,
        })
        .returning({ id: datasets.id });
      return { id: dataset!.id, profile };
    }),
});
