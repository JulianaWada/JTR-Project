import clsx, { type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  extend: {
    // Teach tailwind-merge the project's custom tokens so overrides like `max-w-3xl` replace `max-w-site`.
    theme: { container: ["site"] },
    classGroups: { "font-family": ["font-display"] },
  },
});

/** Joins class names and lets later Tailwind classes override earlier ones. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
