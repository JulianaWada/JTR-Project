import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Jules TechRight: websites, mobile apps and agentic AI";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Social preview image. Text stays in Latin script so it renders with the built-in font in every language.
export default async function OpenGraphImage() {
  const emblem = await readFile(path.join(process.cwd(), "public/brand/jtr-emblem.png"));
  const emblemSrc = `data:image/png;base64,${emblem.toString("base64")}`;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background: "radial-gradient(circle at 80% 20%, #12305a 0%, #07111f 60%)",
          color: "#e6ebf2",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ display: "flex", color: "#6bb4ff", fontSize: 26, letterSpacing: 4 }}>WEBSITES · APPS · AGENTIC AI</div>
          <div style={{ display: "flex", fontSize: 64, fontWeight: 700, lineHeight: 1.1, marginTop: 24, maxWidth: 720 }}>
            Transforming ideas into innovative digital experiences
          </div>
          <div style={{ display: "flex", marginTop: 36, fontSize: 30, color: "#9aa8ba" }}>Jules TechRight</div>
        </div>
        <img src={emblemSrc} width={300} height={300} alt="" />
      </div>
    ),
    size,
  );
}
