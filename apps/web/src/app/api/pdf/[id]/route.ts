import { createElement } from "react";
import { Document, Page, renderToBuffer } from "@react-pdf/renderer";
import { buildScope, renderToElement } from "@arb/report-language/eval";
import { buildRenderBundle } from "@arb/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Server PDF export. The SAME compiled report code is evaluated against the
 * PDF scope (@react-pdf primitives) instead of the web scope, then wrapped in
 * a Document/Page. This is the second target of the one-source/two-renderers
 * design; interactivity collapses to its static projection (e.g. Sections
 * reveals all).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bundle = await buildRenderBundle(id);
  if (!bundle.hasReport || !bundle.compiledCode) {
    return new Response("Report has no content", { status: 404 });
  }

  const scope = await buildScope("pdf", bundle.data);
  const element = renderToElement(bundle.compiledCode, scope);
  if (!element) return new Response("Failed to render report", { status: 500 });

  const doc = createElement(
    Document,
    null,
    createElement(Page, { size: "A4", style: { padding: 32, backgroundColor: "#ffffff" } }, element),
  );

  const buffer = await renderToBuffer(doc);
  const safeTitle = bundle.title.replace(/[^a-z0-9-_]+/gi, "_").slice(0, 60) || "report";
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeTitle}.pdf"`,
    },
  });
}
