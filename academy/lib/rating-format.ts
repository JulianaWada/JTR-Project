/** Average stars and how many students rated a course. */
export type RatingSummary = { average: number; count: number };

/** 4.666 → "4.7". */
export function formatRating(average: number) {
  return (Math.round(average * 10) / 10).toFixed(1);
}
