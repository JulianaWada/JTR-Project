"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Icon } from "./icons";

/** A password box with an eye button so people can check what they typed. */
export function PasswordInput({ className = "", ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={shown ? "text" : "password"} className={`input pr-12 ${className}`} />
      <button
        type="button"
        onClick={() => setShown((v) => !v)}
        aria-label={shown ? "Hide password" : "Show password"}
        aria-pressed={shown}
        title={shown ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-1.5 my-auto grid size-9 place-items-center rounded-lg text-muted transition hover:bg-primary/10 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
      >
        <Icon name={shown ? "eyeOff" : "eye"} className="size-5" />
      </button>
    </div>
  );
}
