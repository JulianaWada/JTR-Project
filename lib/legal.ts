import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const DIR = path.join(process.cwd(), "content/legal");

/** Reads content/legal/<doc>.<locale>.mdx, falling back to the English <doc>.mdx. */
export async function getLegalDoc(doc: "privacy" | "terms", locale: string) {
  for (const [file, contentLocale] of [[`${doc}.${locale}.mdx`, locale], [`${doc}.mdx`, "en"]]) {
    try {
      const { data, content } = matter(await fs.readFile(path.join(DIR, file), "utf8"));
      return { content, updated: String(data.updated), contentLocale };
    } catch {}
  }
  throw new Error(`Missing legal document: ${doc}`);
}
