import { BASE_PATH } from "@/lib/env";

/** Files in /public are served under the base path, e.g. asset("/brand/jtr-emblem.png"). */
export function asset(path: string) {
  return `${BASE_PATH}${path}`;
}
