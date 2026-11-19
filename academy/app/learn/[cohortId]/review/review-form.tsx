"use client";

import { useActionState, useState } from "react";
import { STAR_PATH } from "@/components/stars";
import { MAX_COMMENT, MAX_FEEDBACK } from "@/lib/review-limits";
import { saveReview } from "./actions";

const WORDS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

export function ReviewForm({
  cohortId,
  rating: initialRating,
  comment,
  feedback,
  teacherName,
  editing,
}: {
  cohortId: string;
  rating: number;
  comment: string;
  feedback: string;
  teacherName: string;
  editing: boolean;
}) {
  const [state, action, pending] = useActionState(saveReview.bind(null, cohortId), undefined);
  const [rating, setRating] = useState(initialRating);
  const [hover, setHover] = useState(0);
  const shown = hover || rating;
  return (
    <form action={action} className="space-y-6">
      <fieldset>
        <legend className="label">Your rating</legend>
        <div className="flex flex-wrap items-center gap-3" onMouseLeave={() => setHover(0)}>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className="cursor-pointer" onMouseEnter={() => setHover(n)}>
                <input type="radio" name="rating" value={n} checked={rating === n} onChange={() => setRating(n)} className="peer sr-only" />
                <span className="sr-only">
                  {n} {n === 1 ? "star" : "stars"}
                </span>
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden
                  className={`size-10 rounded-md transition-transform peer-focus-visible:ring-2 peer-focus-visible:ring-primary hover:scale-110 ${n <= shown ? "text-gold" : "text-line"}`}
                >
                  <path d={STAR_PATH} fill="currentColor" />
                </svg>
              </label>
            ))}
          </div>
          <span className="text-sm font-medium text-ink">{shown ? WORDS[shown] : "Tap a star"}</span>
        </div>
      </fieldset>

      <div>
        <label className="label" htmlFor="comment">
          Your review <span className="font-normal text-muted">(shown on the course page)</span>
        </label>
        <textarea
          className="input min-h-32"
          id="comment"
          name="comment"
          defaultValue={comment}
          maxLength={MAX_COMMENT}
          placeholder="What did you learn? What changed for your business? Who would you recommend it to?"
        />
        <p className="mt-1 text-xs text-muted">Shown with your first name and the first letter of your surname, e.g. &quot;Ada O.&quot;</p>
      </div>

      <div>
        <label className="label" htmlFor="feedback">
          Private feedback for {teacherName} <span className="font-normal text-muted">(optional, only your teacher sees this)</span>
        </label>
        <textarea
          className="input min-h-28"
          id="feedback"
          name="feedback"
          defaultValue={feedback}
          maxLength={MAX_FEEDBACK}
          placeholder="Anything that could be better: a lesson that was hard to follow, something you wish the course covered…"
        />
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      {state?.ok && <p className="text-sm text-success">Thank you! Your review has been saved.</p>}
      <button className="btn-primary" disabled={pending}>
        {pending ? "Saving…" : editing ? "Update my review" : "Submit my review"}
      </button>
    </form>
  );
}
