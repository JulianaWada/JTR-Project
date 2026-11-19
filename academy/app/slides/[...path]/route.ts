import { serveCourseFile } from "@/lib/course-files";

/** Lesson slides (private/slides): only for the course's paid students (once the class has opened) and its teacher. */
export async function GET(request: Request, { params }: RouteContext<"/slides/[...path]">) {
  return serveCourseFile(request, "slides", (await params).path);
}
