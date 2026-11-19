"use client";

import { Amaka, Appear, Chidi, Chip, Phone, Studio, Tick } from "../cartoon";
import type { AnimatedLesson, AnimatedScene, SceneProps } from "../types";
import { Msg } from "./shared";
import { Robot } from "./agents-shared";

/*
 * Intro and outro for "How to Build AI Agents Without Code":
 * lesson 1 opens with a short introduction to the whole course; every lesson opens with a title card
 * and ends with a branded outro.
 */

const COURSE = "How to Build AI Agents Without Code";

const LESSONS = [
  "What an AI agent can do",
  "Your brain sheet",
  "Set up your accounts",
  "Build the assistant",
  "Orders and payments",
  "Test, launch, improve",
];

/** Navy backdrop with soft blue light and yellow sparkles, for title cards. */
function Stage() {
  return (
    <g>
      <defs>
        <radialGradient id="frame-glow" cx="70%" cy="40%" r="75%">
          <stop offset="0" stopColor="#1f4f9e" />
          <stop offset="1" stopColor="#0a1a33" />
        </radialGradient>
      </defs>
      <rect width="960" height="540" fill="url(#frame-glow)" />
      {Array.from({ length: 26 }, (_, i) => (
        <circle key={i} cx={(i * 149) % 960} cy={(i * 83) % 540} r={i % 4 === 0 ? 2.6 : 1.4} fill="#fff" opacity="0.35" />
      ))}
      {[
        [560, 80, 1],
        [880, 470, 0.8],
        [70, 470, 0.6],
      ].map(([x, y, s]) => (
        <g key={x} transform={`translate(${x} ${y}) scale(${s})`}>
          <path d="M0 -22 l6 16 l16 6 l-16 6 l-6 16 l-6 -16 l-16 -6 l16 -6z" fill="#ffd45c" className="ac-pulse" />
        </g>
      ))}
      <rect y="524" width="960" height="16" fill="#f2b134" />
    </g>
  );
}

function TitleText({ x, y, lines, size = 50 }: { x: number; y: number; lines: string[]; size?: number }) {
  return (
    <g>
      {lines.map((l, i) => (
        <text key={l} x={x} y={y + i * (size + 8)} fontSize={size} fontWeight={800} fill="#ffffff" fontFamily="var(--font-heading)">
          {l}
        </text>
      ))}
    </g>
  );
}

/* Course intro 1: welcome */
function Welcome({ step, talking }: SceneProps) {
  return (
    <g>
      <Stage />
      <g transform="translate(60 92)">
        <rect width="250" height="40" rx="20" fill="#f2b134" />
        <text x="125" y="27" fontSize="17" fontWeight={800} fill="#0a1a33" textAnchor="middle" letterSpacing="1.5">
          NEW VIDEO COURSE
        </text>
      </g>
      <TitleText x={60} y={196} lines={["How to Build", "AI Agents", "Without Code"]} size={54} />
      <Appear show={step >= 1} from="left">
        <g>
          <Chip x={60} y={390} icon="💬" text="Answers customers" width={230} tone="#16a34a" />
          <Chip x={300} y={390} icon="🛒" text="Takes orders" width={180} tone="#16a34a" />
          <Chip x={60} y={448} icon="💳" text="Sends payment links" width={240} tone="#16a34a" />
          <Chip x={310} y={448} icon="🌙" text="Day and night" width={180} tone="#16a34a" />
        </g>
      </Appear>
      <Phone x={600} y={110} scale={1.05} title="Amaka's Styles">
        <Msg y={8} text={["Hi! Do you deliver", "to Ikeja?"]} />
        <Msg y={54} text={["Yes! ₦2,500, delivered", "tomorrow 🚚 Want to", "order? 💃🏾"]} me width={136} delay={900} />
        <Msg y={116} text={["Yes please!"]} show={step >= 1} />
      </Phone>
      <g className="ac-float">
        <Robot x={850} y={330} scale={0.62} wave={step === 0} />
      </g>
      <Amaka x={540} y={520} scale={0.5} pose={step === 0 ? "wave" : "cheer"} mood="excited" talking={talking} />
    </g>
  );
}

/* Course intro 2: what you will learn */
function Overview({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#d4e3f7" />
      <g transform="translate(24 22)">
        <rect width="290" height="46" rx="23" fill="#0a1a33" />
        <text x="20" y="31" fontSize="21" fontWeight={700} fill="#fff" fontFamily="var(--font-heading)">
          What you will learn
        </text>
      </g>
      <Chidi x={110} y={515} scale={0.7} pose="present" talking={talking} />
      {LESSONS.map((t, i) => (
        <Appear key={t} show from="up" delay={i * 380}>
          <g transform={`translate(${230 + (i % 3) * 240} ${100 + Math.floor(i / 3) * 120})`}>
            <rect x="3" y="6" width="220" height="100" rx="18" fill="#0a1a33" opacity="0.14" />
            <rect width="220" height="100" rx="18" fill="#fff" />
            <circle cx="34" cy="34" r="20" fill="#f2b134" />
            <text x="34" y="41" fontSize="20" fontWeight={800} fill="#0a1a33" textAnchor="middle">
              {i + 1}
            </text>
            <text x="16" y="80" fontSize="16" fontWeight={700} fill="#1563d6">
              {t}
            </text>
          </g>
        </Appear>
      ))}
      <Appear show={step >= 1} from="up">
        <g>
          <Chip x={230} y={360} icon="🤖" text="Botpress: free to start" width={250} />
          <Chip x={490} y={360} icon="💳" text="Paystack payments" width={220} />
          <Chip x={230} y={420} icon="✨" text="ChatGPT or Claude" width={220} />
        </g>
      </Appear>
      <Appear show={step >= 1} from="pop" delay={700}>
        <g transform="translate(740 350) rotate(4)">
          <rect x="3" y="6" width="180" height="120" rx="12" fill="#0a1a33" opacity="0.15" />
          <rect width="180" height="120" rx="12" fill="#fff" stroke="#f2b134" strokeWidth="5" />
          <text x="90" y="40" fontSize="13" fontWeight={800} fill="#1563d6" textAnchor="middle" letterSpacing="2">
            CERTIFICATE
          </text>
          <Tick x={90} y={80} r={20} />
        </g>
      </Appear>
    </g>
  );
}

function lessonCard(n: number, title: string) {
  return function LessonCard({ talking }: SceneProps) {
    return (
      <g>
        <Stage />
        <text x="60" y="130" fontSize="20" fontWeight={700} fill="#b4bfcd" letterSpacing="1">
          {COURSE.toUpperCase()}
        </text>
        <g transform="translate(60 168)">
          <rect width="150" height="46" rx="23" fill="#f2b134" />
          <text x="75" y="31" fontSize="22" fontWeight={800} fill="#0a1a33" textAnchor="middle">
            Lesson {n}
          </text>
        </g>
        <TitleText x={60} y={290} lines={wrap(title, 22)} size={50} />
        <g className="ac-float">
          <Robot x={790} y={300} scale={0.95} wave />
        </g>
        <Appear show from="up" delay={300}>
          <Chidi x={650} y={520} scale={0.5} pose="wave" talking={talking} />
        </Appear>
      </g>
    );
  };
}

function outro(n: number, next?: string) {
  return function Outro({ talking }: SceneProps) {
    return (
      <g>
        <Stage />
        <image href="/academy/brand/jtr-emblem.png" x="400" y="62" width="160" height="160" />
        <text x="480" y="270" fontSize="40" fontWeight={800} fill="#fff" textAnchor="middle" letterSpacing="6" fontFamily="var(--font-heading)">
          JTR ACADEMY
        </text>
        <text x="480" y="312" fontSize="20" fontWeight={600} fill="#b4bfcd" textAnchor="middle">
          {n < 6 ? `End of lesson ${n}` : "Course complete 🎉"} · Thank you for learning with us
        </text>
        {next && (
          <Appear show from="up" delay={500}>
            <g transform="translate(260 340)">
              <rect width="440" height="54" rx="27" fill="#f2b134" />
              <text x="220" y="35" fontSize="19" fontWeight={800} fill="#0a1a33" textAnchor="middle">
                Next: {next}
              </text>
            </g>
          </Appear>
        )}
        <text x="480" y="450" fontSize="18" fontWeight={700} fill="#ffd45c" textAnchor="middle">
          academy.jtechright.com
        </text>
        <Amaka x={130} y={520} scale={0.5} pose="wave" mood="happy" talking={talking} />
        <Chidi x={830} y={520} scale={0.5} pose="wave" />
      </g>
    );
  };
}

function wrap(text: string, max: number) {
  const out: string[] = [];
  for (const word of text.split(" ")) {
    const last = out[out.length - 1];
    if (last && (last + " " + word).length <= max) out[out.length - 1] = last + " " + word;
    else out.push(word);
  }
  return out;
}

const COURSE_INTRO: AnimatedScene[] = [
  {
    heading: "Welcome to the course",
    Scene: Welcome,
    steps: [
      { say: "Welcome to How to Build AI Agents Without Code, from JTR Academy!" },
      { say: "In this course, you will build your own AI assistant for WhatsApp or Instagram. It answers your customers day and night, takes orders, and sends a payment link. And you won't write a single line of code." },
    ],
  },
  {
    heading: "What you will learn",
    Scene: Overview,
    steps: [
      { say: "In six short lessons, you will learn what an AI agent can do, write its brain sheet, set up your accounts, build the assistant, take orders and payments, and then test and launch it." },
      { say: "You will use Botpress, which is free to start, with Paystack for payments. Finish your final project, and you get a certificate. Let's begin!" },
    ],
  },
];

/** Adds the intro (and, for lesson 1, the course introduction) and the outro to a lesson of this course. */
export function withCourseFrame(lesson: AnimatedLesson): AnimatedLesson {
  const n = Number(lesson.id.split("/")[1]);
  const next = LESSONS[n];
  return {
    ...lesson,
    scenes: [
      ...(n === 1 ? COURSE_INTRO : []),
      { heading: `Lesson ${n}`, Scene: lessonCard(n, lesson.title), steps: [{ say: `Lesson ${n}. ${lesson.title}.` }] },
      ...lesson.scenes,
      {
        heading: "JTR Academy",
        Scene: outro(n, next ? `Lesson ${n + 1} · ${next}` : undefined),
        steps: [{ say: n < 6 ? `That's the end of lesson ${n}. Thank you for learning with JTR Academy!` : "That's the end of the course. Thank you for learning with JTR Academy, and well done!" }],
      },
    ],
  };
}
