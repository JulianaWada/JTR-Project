import { serveCourseFile } from "@/lib/course-files";

/** Lesson narration (private/lessons): only for the course's paid students and its teacher. */
export async function GET(request: Request, { params }: RouteContext<"/lessons/[...path]">) {
  return serveCourseFile(request, "lessons", (await params).path);
}
