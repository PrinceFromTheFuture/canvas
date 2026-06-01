import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { renderReportWeb } from "../eval/compile";
import { projectElement } from "../eval/json";
import * as pdf from "../pdf/index";
import * as React from "react";

const SAMPLE = `export default function Report() {
  return (
    <ReportRoot>
      <H1>{title}</H1>
      <Sections items={sections.map((s) => ({ title: s.name, body: <Text>{s.detail}</Text> }))} />
    </ReportRoot>
  );
}`;

const data = {
  title: "Q3 Summary",
  sections: [
    { name: "Revenue", detail: "Revenue grew 12%" },
    { name: "Costs", detail: "Costs fell 3%" },
  ],
};

describe("report rendering", () => {
  it("compiles and renders a valid report on the web target", async () => {
    const el = await renderReportWeb({ source: SAMPLE, data });
    expect(el).not.toBeNull();
    const html = renderToStaticMarkup(el!);
    expect(html).toContain("Q3 Summary");
    // Web Sections shows the first section's body by default + all titles as controls.
    expect(html).toContain("Revenue grew 12%");
    expect(html).toContain("Costs");
  });

  it("projects an element tree to JSON with vocabulary type names", async () => {
    const el = await renderReportWeb({ source: SAMPLE, data });
    const json = projectElement(el!);
    expect(json).not.toBeNull();
    expect(typeof json === "object" && json !== null && "type" in json).toBe(true);
  });

  it("PDF Sections satisfies the static-projection invariant (reveals all)", () => {
    const items = [
      { title: "A", body: "a" },
      { title: "B", body: "b" },
      { title: "C", body: "c" },
    ];
    const tree = pdf.Sections({ items }) as React.ReactElement;
    // The pdf branch maps over ALL items (vs web which shows one at a time).
    const children = React.Children.toArray(
      (tree.props as { children?: React.ReactNode }).children,
    );
    expect(children).toHaveLength(items.length);
  });
});
