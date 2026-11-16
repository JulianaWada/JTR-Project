// Runs in the browser. Campaign links look like https://www.jtechright.com/en?utm_source=instagram&utm_campaign=december-offer
// and the sign-up form records them, so the admin board can show which campaign brought each member.

/** Keeps ?utm_source / utm_medium / utm_campaign from the link a visitor arrived on, for the sign-up form. */
export function rememberCampaign() {
  try {
    const q = new URLSearchParams(window.location.search);
    const utm = { utmSource: q.get("utm_source"), utmMedium: q.get("utm_medium"), utmCampaign: q.get("utm_campaign") };
    if (utm.utmSource || utm.utmMedium || utm.utmCampaign) sessionStorage.setItem("jtr_utm", JSON.stringify(utm));
  } catch {}
}

export function readCampaign(): Record<string, string> {
  try {
    const stored = JSON.parse(sessionStorage.getItem("jtr_utm") ?? "{}") as Record<string, string | null>;
    return Object.fromEntries(Object.entries(stored).filter((e): e is [string, string] => typeof e[1] === "string").map(([k, v]) => [k, v.slice(0, 100)]));
  } catch {
    return {};
  }
}

