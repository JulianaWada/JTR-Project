import { notFound } from "next/navigation";

// Any unknown path inside a locale renders the localised 404 page.
export default function CatchAll() {
  notFound();
}
