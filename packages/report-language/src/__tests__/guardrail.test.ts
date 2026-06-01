import { describe, expect, it } from "vitest";
import { guardrail } from "../eval/guardrail";

describe("guardrail", () => {
  it("accepts a valid report over the vocabulary", () => {
    const src = `export default function Report() {
      return (
        <ReportRoot>
          <H1>{title}</H1>
          <Stat value={rows.length} label="Rows" />
        </ReportRoot>
      );
    }`;
    const res = guardrail(src, { dataKeys: ["title", "rows"] });
    expect(res.ok).toBe(true);
  });

  it("rejects intrinsic (lowercase) JSX elements", () => {
    const src = `export default function Report() { return <div>nope</div>; }`;
    const res = guardrail(src);
    expect(res.ok).toBe(false);
    expect(res.violations.join(" ")).toMatch(/intrinsic element <div>/);
  });

  it("rejects imports", () => {
    const src = `import fs from "fs";\nexport default function Report() { return <Text>x</Text>; }`;
    const res = guardrail(src);
    expect(res.ok).toBe(false);
    expect(res.violations.join(" ")).toMatch(/import is not allowed/);
  });

  it("rejects fetch and unknown globals", () => {
    const src = `export default function Report() { fetch("/x"); return <Text>{window.location}</Text>; }`;
    const res = guardrail(src);
    expect(res.ok).toBe(false);
    expect(res.violations.join(" ")).toMatch(/fetch/);
    expect(res.violations.join(" ")).toMatch(/unknown identifier "window"/);
  });

  it("allows local bindings and map callbacks", () => {
    const src = `export default function Report() {
      const labels = items.map((it) => it.name);
      return <Stack>{labels.map((l, i) => <Text key={i}>{l}</Text>)}</Stack>;
    }`;
    const res = guardrail(src, { dataKeys: ["items"] });
    expect(res.ok).toBe(true);
  });
});
