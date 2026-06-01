"use client";

import { useState } from "react";
import type { UIMessage } from "ai";
import { MessageParts } from "./MessageParts";

export function Chat({
  messages,
  streaming,
  error,
  onSend,
  onStop,
}: {
  messages: UIMessage[];
  streaming: boolean;
  error?: string | null;
  onSend: (text: string) => void;
  onStop: () => void;
}) {
  const [text, setText] = useState("");

  function submit() {
    const value = text.trim();
    if (!value || streaming) return;
    onSend(value);
    setText("");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {messages.length === 0 ? (
          <p className="text-sm text-[var(--chrome-muted)]">
            Describe the report you want. e.g. &ldquo;Summarize revenue by region with a bar chart and a
            top-10 table.&rdquo;
          </p>
        ) : (
          messages.map((m, i) => (
            <div key={m.id || `msg-${i}`} className={m.role === "user" ? "self-end max-w-[85%]" : "self-start max-w-[95%]"}>
              <div
                className={
                  m.role === "user"
                    ? "rounded-lg bg-[var(--chrome-accent)] px-3 py-2 text-white"
                    : "rounded-lg border border-[var(--chrome-border)] bg-[var(--chrome-panel)] px-3 py-2"
                }
              >
                <MessageParts message={m} />
              </div>
            </div>
          ))
        )}
        {streaming ? <div className="text-xs text-[var(--chrome-muted)]">Generating...</div> : null}
        {error ? <div className="text-xs text-red-500">{error}</div> : null}
      </div>

      <div className="border-t border-[var(--chrome-border)] p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={2}
            placeholder="Describe or refine the report..."
            className="flex-1 resize-none rounded-md bg-[var(--chrome-bg)] border border-[var(--chrome-border)] px-3 py-2 text-sm outline-none focus:border-[var(--chrome-accent)]"
          />
          {streaming ? (
            <button onClick={onStop} className="rounded-md border border-[var(--chrome-border)] px-4 py-2 text-sm">
              Stop
            </button>
          ) : (
            <button onClick={submit} className="rounded-md bg-[var(--chrome-accent)] px-4 py-2 text-sm font-medium text-white">
              Send
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
