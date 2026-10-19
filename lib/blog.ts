import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { routing } from "@/i18n/routing";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

export type PostMeta = {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  readingMinutes: number;
  /** The language the returned content is actually in (may fall back to English). */
  contentLocale: string;
};

export type Post = PostMeta & { content: string };

/**
 * Posts live in /content/blog as `<slug>.mdx` (English, required) with optional
 * translations next to them as `<slug>.<locale>.mdx`, e.g. `my-post.fr.mdx`.
 */
async function listSlugs() {
  const files = await fs.readdir(BLOG_DIR);
  return files.filter((f) => /^[a-z0-9-]+\.mdx$/.test(f)).map((f) => f.replace(/\.mdx$/, ""));
}

async function readPostFile(slug: string, locale: string) {
  const candidates =
    locale === routing.defaultLocale ? [[`${slug}.mdx`, locale]] : [[`${slug}.${locale}.mdx`, locale], [`${slug}.mdx`, routing.defaultLocale]];
  for (const [file, contentLocale] of candidates) {
    try {
      const raw = await fs.readFile(path.join(BLOG_DIR, file), "utf8");
      return { raw, contentLocale };
    } catch {}
  }
  return null;
}

export async function getPost(slug: string, locale: string): Promise<Post | null> {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  const file = await readPostFile(slug, locale);
  if (!file) return null;
  const { data, content } = matter(file.raw);
  const words = content.trim().split(/\s+/).length;
  return {
    slug,
    title: String(data.title),
    description: String(data.description ?? ""),
    date: String(data.date),
    author: String(data.author ?? "JTR Team"),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    readingMinutes: Math.max(1, Math.round(words / 220)),
    contentLocale: file.contentLocale,
    content,
  };
}

export async function getAllPosts(locale: string): Promise<PostMeta[]> {
  const slugs = await listSlugs();
  const posts = await Promise.all(slugs.map((s) => getPost(s, locale)));
  return posts
    .filter((p): p is Post => p !== null)
    .map((post): PostMeta => {
      const meta: Partial<Post> = { ...post };
      delete meta.content;
      return meta as PostMeta;
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getAllSlugs() {
  return listSlugs();
}
