import { router } from "./trpc";
import { reportRouter } from "./routers/report";
import { datasetRouter } from "./routers/dataset";
import { runRouter } from "./routers/run";

export const appRouter = router({
  report: reportRouter,
  dataset: datasetRouter,
  run: runRouter,
});

export type AppRouter = typeof appRouter;
