"use client";

import type { UIMessage } from "ai";

type AnyPart = { type: string; text?: string; state?: string; toolName?: string; input?: unknown; output?: unknown };

function toolLabel(part: AnyPart): { name: string; state: string } {
  // v5 tool parts look like "tool-<name>" (or "dynamic-tool").
  const name = part.toolName ?? (part.type.startsWith("tool-") ? part.type.slice(5) : part.type);
  return { name, state: part.state ?? "" };
}

export function MessageParts({ message }: { message: UIMessage }) {
  const parts = (message.parts ?? []) as AnyPart[];
  return (
    <div className="flex flex-col gap-2">
      {parts.map((part, i) => {
        if (part.type === "text" && part.text) {
          return (
            <p key={i} className="whitespace-pre-wrap text-sm leading-relaxed">
              {part.text}
            </p>
          );
        }
        if (part.type === "reasoning" && part.text) {
          return (
            <p key={i} className="whitespace-pre-wrap text-xs italic text-[var(--chrome-muted)]">
              {part.text}
            </p>
          );
        }
        if (part.type.startsWith("tool-") || part.type === "dynamic-tool") {
          const { name, state } = toolLabel(part);
          const committed = name === "writeReport" && (part.output as { ok?: boolean })?.ok;
          return (
            <div key={i} className="inline-flex w-fit items-center gap-2 rounded-md border border-[var(--chrome-border)] bg-[var(--chrome-bg)] px-2 py-1 text-xs text-[var(--chrome-muted)]">
              <span className={committed ? "text-emerald-400" : ""}>
                {committed ? "Report updated" : `${name}`}
              </span>
              {state ? <span className="opacity-60">{state}</span> : null}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
