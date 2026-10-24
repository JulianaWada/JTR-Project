import clsx from "clsx";
import type { Message } from "@/lib/db/schema";
import { formatLagos } from "@/lib/time";

const AUTHOR_LABEL: Record<Message["author"], string> = {
  customer: "",
  ai: "AI assistant",
  owner: "You",
  system: "Automatic",
};

/** WhatsApp-style formatting: *bold*, _italic_ and clickable links. */
function formatWhatsApp(text: string) {
  const parts = text.split(/(https?:\/\/\S+|\*[^*\n]+\*|_[^_\n]+_)/g);
  return parts.map((part, i) => {
    if (/^https?:\/\//.test(part)) {
      return (
        <a key={i} href={part} target="_blank" rel="noreferrer" className="break-all text-sky-700 underline">
          {part}
        </a>
      );
    }
    if (/^\*[^*]+\*$/.test(part)) return <strong key={i}>{part.slice(1, -1)}</strong>;
    if (/^_[^_]+_$/.test(part)) return <em key={i}>{part.slice(1, -1)}</em>;
    return <span key={i}>{part}</span>;
  });
}

export function ChatThread({ messages, perspective }: { messages: Message[]; perspective: "owner" | "customer" }) {
  return (
    <div className="space-y-2">
      {messages.map((m) => {
        const outgoing = m.direction === "out";
        // In the simulator the customer's own messages sit on the right, like on their phone.
        const right = perspective === "owner" ? outgoing : !outgoing;
        return (
          <div key={m.id} className={clsx("flex", right ? "justify-end" : "justify-start")}>
            <div
              className={clsx(
                "max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap shadow-sm",
                right ? "bg-wa-bubble" : "bg-white",
              )}
            >
              {perspective === "owner" && outgoing && (
                <p className={clsx("mb-0.5 text-[11px] font-semibold", m.author === "ai" ? "text-emerald-700" : m.author === "owner" ? "text-electric" : "text-slate-500")}>
                  {AUTHOR_LABEL[m.author]}
                </p>
              )}
              <div>{formatWhatsApp(m.body)}</div>
              <p className="mt-1 text-right text-[10px] text-slate-500">
                {formatLagos(m.createdAt, { withDate: false })}
                {outgoing && m.status === "failed" && <span className="ml-1 text-red-600" title={m.error ?? ""}>· not delivered</span>}
                {outgoing && m.status === "read" && <span className="ml-1 text-sky-600">✓✓</span>}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
