import { notFound } from "next/navigation";
import { CleanLessonRender } from "@/components/animated-lesson/clean-render";
import { AgentsThumbnail, SalesThumbnail } from "@/components/animated-lesson/thumbnail";
import { animatedLessonId } from "@/lib/animated-lessons";

/** Clean, control-free lesson (or the course thumbnail, week "thumbnail") for recording videos locally. Not available on the live site. */
export default async function RenderPage({ params }: PageProps<"/render/[course]/[week]">) {
  if (process.env.NODE_ENV === "production") notFound();
  const { course, week } = await params;
  if (week === "thumbnail" && course === "ai-agents-without-code") return <AgentsThumbnail />;
  if (week === "thumbnail" && course === "boost-sales-with-ai") return <SalesThumbnail />;
  const id = animatedLessonId(course, Number(week));
  if (!id) notFound();
  return <CleanLessonRender lessonId={id} />;
}
