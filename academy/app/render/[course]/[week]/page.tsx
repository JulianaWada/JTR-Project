import { notFound } from "next/navigation";
import { CleanLessonRender } from "@/components/animated-lesson/clean-render";
import { animatedLessonId } from "@/lib/animated-lessons";

/** Clean, control-free lesson for recording videos locally. Not available on the live site. */
export default async function RenderPage({ params }: PageProps<"/render/[course]/[week]">) {
  if (process.env.NODE_ENV === "production") notFound();
  const { course, week } = await params;
  const id = animatedLessonId(course, Number(week));
  if (!id) notFound();
  return <CleanLessonRender lessonId={id} />;
}
