/** The embeddable player address for a YouTube, Vimeo, Loom or Google Drive link, or null for any other link. */
export function videoEmbedUrl(link: string): string | null {
  let u: URL;
  try {
    u = new URL(link);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^(www|m)\./, "");
  if (host === "youtu.be") return youTube(u.pathname.slice(1));
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (u.searchParams.get("v")) return youTube(u.searchParams.get("v")!);
    const match = u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]+)/);
    return match ? youTube(match[1]) : null;
  }
  if (host === "vimeo.com") {
    const match = u.pathname.match(/^\/(\d+)(?:\/(\w+))?/);
    return match ? `https://player.vimeo.com/video/${match[1]}${match[2] ? `?h=${match[2]}` : ""}` : null;
  }
  if (host === "player.vimeo.com") return link;
  if (host === "loom.com") {
    const match = u.pathname.match(/^\/(?:share|embed)\/(\w+)/);
    return match ? `https://www.loom.com/embed/${match[1]}` : null;
  }
  if (host === "drive.google.com") {
    const match = u.pathname.match(/^\/file\/d\/([\w-]+)/);
    return match ? `https://drive.google.com/file/d/${match[1]}/preview` : null;
  }
  return null;
}

function youTube(id: string) {
  return /^[\w-]{6,}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : null;
}
