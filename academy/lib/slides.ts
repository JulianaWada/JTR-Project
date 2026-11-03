import type { LessonSlides } from "@/lib/db/schema";

/** A PowerPoint link the teacher can give a lesson: a web address, or a file in this site's public/slides folder. */
function isSlidesLink(file: string) {
  return /^https:\/\/\S+$/.test(file) || /^\/academy\/slides\/[\w./-]+$/.test(file);
}

/**
 * The lesson's slides from the teacher's PowerPoint link. The slide images stay while the link is unchanged;
 * a new link has no images, so the lesson page shows the file in Microsoft's PowerPoint viewer instead.
 */
export function slidesFrom(file: string, current: LessonSlides | null): LessonSlides | null | { error: string } {
  const link = file.trim();
  if (!link) return null;
  if (current?.file === link) return current;
  if (!isSlidesLink(link)) return { error: "The slides link must start with https:// (for example a OneDrive or Dropbox share link)." };
  return { file: link, images: [] };
}

/** Full address of the slides file, for downloading and for the PowerPoint viewer. */
export function slidesFileUrl(slides: LessonSlides, appUrl: string) {
  return slides.file.startsWith("/") ? `${appUrl}${slides.file}` : slides.file;
}

/** Microsoft's free PowerPoint viewer, for slides that only have a file (it needs a public link). */
export function officeViewerUrl(fileUrl: string) {
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
}
