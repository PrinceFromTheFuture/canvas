import { transform } from "esbuild";

/**
 * Transpile authored TSX to evaluable JS.
 *
 * We use `format: 'cjs'` here (NOT esm) deliberately. Part I of the plan
 * notes that esbuild CJS breaks `react-runner` because react-runner does not
 * provide a `module` object. Our evaluator DOES provide `module`/`exports`
 * (see runner.ts), so CJS is the correct, simplest target: it lets us read
 * the default export via `module.exports.default` after running the code in a
 * Function with the curated scope injected as arguments.
 *
 * `jsx: 'transform'` emits `React.createElement`, and React comes from scope.
 */
export async function transformReportSource(source: string): Promise<string> {
  const result = await transform(source, {
    loader: "tsx",
    format: "cjs",
    target: "es2020",
    jsx: "transform",
  });
  return result.code;
}
