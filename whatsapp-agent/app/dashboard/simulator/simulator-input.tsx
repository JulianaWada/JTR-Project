"use client";

import { useRef, useTransition } from "react";

export function SimulatorInput({ action }: { action: (form: FormData) => Promise<void> }) {
  const ref = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  return (
    <form
      ref={ref}
      action={(form) =>
        start(async () => {
          ref.current?.reset();
          await action(form);
        })
      }
      className="flex items-center gap-2 bg-[#f0f0f0] p-2"
    >
      <input
        name="text"
        autoComplete="off"
        placeholder={pending ? "Typing…" : "Message"}
        className="flex-1 rounded-full bg-white px-4 py-2 text-sm outline-none"
        maxLength={1000}
        required
      />
      <button aria-label="Send" disabled={pending} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#00a884] text-white disabled:opacity-50">
        ➤
      </button>
    </form>
  );
}
