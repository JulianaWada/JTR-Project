"use client";

import { Amaka, Appear, Boutique, Chidi, Chip, Kemi, SceneTitle, Studio, Tolu } from "../cartoon";
import type { AnimatedLesson, SceneProps } from "../types";
import { Card, Checklist } from "./shared";

/*
 * Boost Sales with AI, Lesson 6: Your AI sales plan (final project).
 */

const PIECES: [string, string, string][] = [
  ["👩🏾‍💼", "Customer profile", "#e4572e"],
  ["📣", "12 adverts and posts", "#1563d6"],
  ["💬", "Reply bank, top 10 questions", "#0f7b4a"],
  ["🔁", "Follow-up sequence", "#8a3fd1"],
  ["📈", "One number to track", "#9a5b00"],
];

/* 1. Put it all together */
function Together({ step, talking }: SceneProps) {
  return (
    <g>
      <Boutique />
      <SceneTitle text="Your AI sales plan" />
      <Amaka x={200} y={505} pose={step === 0 ? "wave" : "point"} talking={talking} />
      <Card x={380} y={95} w={530} h={400} title="🗂️ 30-day AI sales plan">
        {PIECES.map(([icon, text, colour], i) => (
          <Appear key={text} show={step >= 1} from="right" delay={i * 700}>
            <g transform={`translate(24 ${66 + i * 64})`}>
              <rect width="480" height="52" rx="14" fill={colour} opacity="0.12" />
              <rect width="8" height="52" rx="4" fill={colour} />
              <text x="26" y="34" fontSize="22">
                {icon}
              </text>
              <text x="66" y="33" fontSize="19" fontWeight={700} fill="#0a1a33">
                {text}
              </text>
            </g>
          </Appear>
        ))}
      </Card>
    </g>
  );
}

/* 2. Your 30-day calendar */
function Calendar({ step, talking }: SceneProps) {
  const posts = [1, 3, 6, 8, 10, 13, 15, 17, 20, 22, 25, 27];
  const followUps = [2, 5, 9, 12, 16, 19, 23, 26, 29];
  return (
    <g>
      <Studio tone="#d4e3f7" />
      <SceneTitle text="Plan your 30 days" />
      <Chidi x={130} y={515} scale={0.8} pose="point" talking={talking} />
      <Card x={270} y={90} w={640} h={410}>
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
          <text key={d} x={50 + i * 86} y="34" fontSize="14" fontWeight={800} fill="#44546a" textAnchor="middle">
            {d}
          </text>
        ))}
        {Array.from({ length: 30 }, (_, k) => {
          const day = k + 1;
          const col = k % 7;
          const row = Math.floor(k / 7);
          const post = posts.includes(day);
          const follow = followUps.includes(day);
          return (
            <g key={day} transform={`translate(${12 + col * 86} ${50 + row * 70})`}>
              <rect width="76" height="60" rx="10" fill="#f3f5f8" />
              <text x="8" y="18" fontSize="12" fontWeight={700} fill="#6b7a8f">
                {day}
              </text>
              {post && (
                <Appear show={step >= 1} from="pop" delay={posts.indexOf(day) * 120}>
                  <text x="38" y="46" fontSize="22" textAnchor="middle">
                    📣
                  </text>
                </Appear>
              )}
              {follow && (
                <Appear show={step >= 2} from="pop" delay={followUps.indexOf(day) * 120}>
                  <text x="38" y="46" fontSize="22" textAnchor="middle">
                    🔁
                  </text>
                </Appear>
              )}
            </g>
          );
        })}
      </Card>
    </g>
  );
}

/* 3. Track one number */
function Track({ step, talking }: SceneProps) {
  const bars = [6, 9, 13, 18];
  return (
    <g>
      <Studio tone="#d5ede2" />
      <SceneTitle text="Track one number" />
      <Amaka x={140} y={515} scale={0.85} pose={step >= 1 ? "cheer" : "point"} talking={talking} mood={step >= 1 ? "excited" : "happy"} />
      <Card x={300} y={90} w={600} h={380} title="Enquiries per week">
        {bars.map((v, i) => (
          <g key={i}>
            <rect
              x={70 + i * 130}
              y={330 - v * 14}
              width="80"
              height={v * 14}
              rx="10"
              fill={i === bars.length - 1 ? "#16a34a" : "#1563d6"}
              className="ac-grow"
              style={{ transform: step >= 1 || i === 0 ? "scaleY(1)" : "scaleY(0.04)", transitionDelay: `${i * 300}ms` }}
            />
            <text x={110 + i * 130} y="360" fontSize="15" fontWeight={700} fill="#44546a" textAnchor="middle">
              Week {i + 1}
            </text>
            <Appear show={step >= 1 || i === 0} from="pop" delay={i * 300 + 600}>
              <text x={110 + i * 130} y={318 - v * 14} fontSize="18" fontWeight={800} fill="#0a1a33" textAnchor="middle">
                {v}
              </text>
            </Appear>
          </g>
        ))}
      </Card>
    </g>
  );
}

/* 4. Submit your plan */
function Submit({ step, talking }: SceneProps) {
  return (
    <g>
      <Boutique dim />
      <SceneTitle text="Submit your final project" />
      <Amaka x={190} y={510} pose="present" talking={talking} />
      <Card x={370} y={100} w={540} h={340} title="📝 Final project">
        <Checklist
          x={24}
          y={70}
          step={step}
          items={[
            ["Put your plan in a Google Doc, PDF or slides", 0],
            ["Include all five parts", 0],
            ["Submit the link under Assignments", 1],
            ["Get feedback from your teacher", 1],
          ]}
          size={17}
        />
      </Card>
    </g>
  );
}

/* 5. Congratulations */
function Celebrate({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#fbe7cf" />
      <SceneTitle text="Congratulations!" />
      {Array.from({ length: 24 }, (_, i) => (
        <rect
          key={i}
          x={(i * 83) % 940}
          y={60 + ((i * 47) % 160)}
          width="10"
          height="16"
          rx="3"
          fill={["#e4572e", "#1563d6", "#f2b134", "#16a34a", "#8a3fd1"][i % 5]}
          transform={`rotate(${(i * 37) % 90} ${(i * 83) % 940} ${60 + ((i * 47) % 160)})`}
          className="ac-float"
        />
      ))}
      <Chidi x={150} y={510} scale={0.8} pose="cheer" mood="excited" />
      <Amaka x={330} y={510} scale={0.85} pose={step >= 2 ? "wave" : "cheer"} mood="excited" talking={talking} />
      <Tolu x={640} y={510} scale={0.78} flip pose="cheer" mood="excited" />
      <Kemi x={810} y={510} scale={0.78} flip pose="cheer" mood="excited" />
      <Appear show={step >= 0} from="pop" delay={400}>
        <g transform="translate(380 90)">
          <rect width="200" height="140" rx="16" fill="#fff" stroke="#f2b134" strokeWidth="4" />
          <image href="/academy/brand/jtr-emblem.png" x="76" y="12" width="48" height="48" />
          <text x="100" y="86" fontSize="16" fontWeight={800} fill="#0a1a33" textAnchor="middle">
            Certificate
          </text>
          <text x="100" y="110" fontSize="12" fontWeight={600} fill="#44546a" textAnchor="middle">
            Boost Sales with AI
          </text>
        </g>
      </Appear>
      <Appear show={step >= 1} from="pop">
        <Chip x={600} y={110} icon="✨" text="Keep asking the AI tutor" width={260} />
      </Appear>
    </g>
  );
}

export const boostSalesLesson6: AnimatedLesson = {
  id: "boost-sales-with-ai/6",
  title: "Your AI sales plan",
  scenes: [
    {
      heading: "Your AI sales plan",
      Scene: Together,
      steps: [
        { say: "Welcome to the final lesson! Now you put everything together into a thirty-day AI sales plan for your own business." },
        { say: "It has five parts: your customer profile, twelve adverts or posts written with AI and edited by you, your reply bank for the top ten questions, your follow-up sequence, and one number you will track." },
      ],
    },
    {
      heading: "Plan your 30 days",
      Scene: Calendar,
      tryIt: "Here is my customer profile and my products: [paste]. Make a 30-day plan with 12 posts and when to follow up with leads, as a simple table.",
      steps: [
        { say: "Spread the work over thirty days, so it is easy to keep up." },
        { say: "Schedule your twelve posts, about three each week." },
        { say: "And set your follow-up days, so no lead is forgotten." },
      ],
    },
    {
      heading: "Track one number",
      Scene: Track,
      steps: [
        { say: "Pick one number to track, for example enquiries per week, or sales per week." },
        { say: "Check it every week. When the number grows, you know your plan is working." },
      ],
    },
    {
      heading: "Submit your final project",
      Scene: Submit,
      steps: [
        { say: "Put your plan in a Google Doc, a PDF or slides, with all five parts." },
        { say: "Submit the link under Assignments, and your teacher will send you feedback." },
      ],
    },
    {
      heading: "Congratulations!",
      Scene: Celebrate,
      steps: [
        { say: "Congratulations! Finish all the lessons and your final project to earn your certificate." },
        { say: "Keep using the AI tutor here in the academy whenever you have a question." },
        { say: "Thank you for learning with JTR Academy. Now go and sell more with AI!" },
      ],
    },
  ],
};
