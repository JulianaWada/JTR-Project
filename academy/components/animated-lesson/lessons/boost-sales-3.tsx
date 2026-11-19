"use client";

import { Amaka, Appear, Boutique, Chidi, SceneTitle, Studio, Tolu, Typed } from "../cartoon";
import type { AnimatedLesson, SceneProps } from "../types";
import { AiChat, Card, Checklist, Dress, Post } from "./shared";

/*
 * Boost Sales with AI, Lesson 3: Words that sell.
 * Amaka writes adverts for Tolu, her ideal customer, with Problem, Promise, Proof, Push.
 */

const FORMULA: [string, string, string][] = [
  ["Problem", "No time to shop for work clothes?", "#e4572e"],
  ["Promise", "Office-ready outfits at your door in 24 hours.", "#1563d6"],
  ["Proof", "★★★★★ Loved by 200+ Lagos women.", "#16a34a"],
  ["Push", "Send 'STYLE' on WhatsApp to order.", "#8a3fd1"],
];

/* 1. Words for Tolu */
function Intro({ step, talking }: SceneProps) {
  return (
    <g>
      <Boutique />
      <SceneTitle text="Words that sell" />
      <Amaka x={300} y={505} pose={step === 0 ? "wave" : "point"} talking={talking} />
      <Appear show from="right" delay={300}>
        <Tolu x={720} y={505} scale={0.92} flip mood={step >= 1 ? "excited" : "happy"} />
      </Appear>
      <Appear show={step >= 1} from="pop">
        <g transform="translate(470 120)" className="ac-float">
          <rect width="150" height="96" rx="16" fill="#fff" />
          <text x="75" y="44" fontSize="34" textAnchor="middle">
            💬
          </text>
          <text x="75" y="78" fontSize="16" fontWeight={700} fill="#0a1a33" textAnchor="middle">
            Words for Tolu
          </text>
        </g>
      </Appear>
    </g>
  );
}

/* 2. Problem, Promise, Proof, Push */
function Formula({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#e9dcff" />
      <SceneTitle text="Problem, Promise, Proof, Push" />
      <Amaka x={130} y={515} scale={0.8} pose="point" talking={talking} />
      <Post
        x={600}
        y={90}
        scale={1}
        lines={FORMULA.map(([label, text, colour], i) => (
          <Appear key={label} show={step >= i + 1} from="left">
            <g transform={`translate(14 ${246 + i * 36})`}>
              <rect width="8" height="26" rx="4" fill={colour} />
              <text x="16" y="18" fontSize="12.5" fontWeight={600} fill="#0a1a33">
                {text}
              </text>
            </g>
          </Appear>
        ))}
      >
        <Dress x={110} y={90} colour="#1d4e89" scale={0.9} />
        <Dress x={190} y={90} colour="#e4572e" scale={0.9} />
      </Post>
      {FORMULA.map(([label, , colour], i) => (
        <Appear key={label} show={step >= i + 1} from="pop">
          <g transform={`translate(290 ${110 + i * 92})`}>
            <rect width="280" height="76" rx="18" fill="#fff" />
            <rect width="12" height="76" rx="6" fill={colour} />
            <text x="28" y="32" fontSize="20" fontWeight={800} fill={colour}>
              {i + 1}. {label}
            </text>
            <text x="28" y="58" fontSize="13" fill="#44546a">
              {["Name the pain", "What changes for them", "Why they should believe you", "One clear next step"][i]}
            </text>
          </g>
        </Appear>
      ))}
      <Appear show={step === 0} from="pop">
        <text x="430" y="300" fontSize="60" textAnchor="middle">
          📣
        </text>
      </Appear>
    </g>
  );
}

/* 3. Let AI write five */
function FiveCaptions({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#d4e3f7" />
      <SceneTitle text="Let AI write the first drafts" />
      <Chidi x={130} y={515} scale={0.8} pose="present" mood={step >= 1 ? "excited" : "happy"} talking={talking} />
      <AiChat x={250} y={110} scale={0.95} prompt={["Write 5 Instagram captions for my office", "gowns using Problem, Promise, Proof, Push.", "Audience: working women in Lagos, 25 to 35."]} showPrompt />
      {[0, 1, 2, 3, 4].map((i) => (
        <Appear key={i} show={step >= 1} from="right" delay={i * 350}>
          <g transform={`translate(${700 + (i % 2) * 20} ${100 + i * 74}) rotate(${(i - 2) * 2})`}>
            <rect width="210" height="60" rx="12" fill="#fff" stroke="#c7d2de" />
            <text x="14" y="26" fontSize="14" fontWeight={800} fill="#1563d6">
              Caption {i + 1}
            </text>
            <rect x="14" y="36" width={150 - i * 10} height="7" rx="3.5" fill="#dfe6ef" />
          </g>
        </Appear>
      ))}
      <Appear show={step >= 2} from="pop">
        <g transform="translate(340 400)">
          <rect width="320" height="80" rx="18" fill="#0a1a33" />
          <text x="20" y="34" fontSize="15" fontWeight={700} fill="#ffd45c">
            Also try:
          </text>
          <text x="20" y="60" fontSize="15" fontWeight={600} fill="#fff">
            “Make this shorter and warmer.”
          </text>
        </g>
      </Appear>
    </g>
  );
}

/* 4. Make it sound like you */
function YourVoice({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#d5ede2" />
      <SceneTitle text="Make it sound like you" />
      <Amaka x={130} y={515} scale={0.8} pose="present" talking={talking} />
      {["“New week, new slay 💃🏾", "“Your Friday fit is here", "“Na your size we get! 👗"].map((t, i) => (
        <Appear key={t} show from="left" delay={i * 400}>
          <g transform={`translate(260 ${110 + i * 80}) rotate(${-3 + i * 3})`}>
            <rect width="230" height="62" rx="12" fill="#fff" stroke="#c7d2de" />
            <text x="12" y="22" fontSize="11" fontWeight={700} fill="#e4572e">
              My best post {i + 1}
            </text>
            <text x="12" y="44" fontSize="14" fontWeight={600} fill="#0a1a33">
              {t}…”
            </text>
          </g>
        </Appear>
      ))}
      <Appear show={step >= 1} from="up">
        <g transform="translate(540 120)">
          <rect width="360" height="56" rx="14" fill="#1563d6" />
          <Typed text="“Write in this same voice.”" show={step >= 1} x="18" y="36" fontSize="19" fontWeight={700} fill="#fff" />
        </g>
      </Appear>
      <Appear show={step >= 2} from="up">
        <Card x={540} y={200} w={360} h={160} title="✨ In your voice" tone="#16a34a">
          {["Monday meeting? We've got you 💼", "Office gowns that fit and flatter.", "Na your size we get! DM 'STYLE' 👗"].map((t, i) => (
            <Appear key={t} show={step >= 2} from="left" delay={300 + i * 500}>
              <text x="24" y={76 + i * 26} fontSize="15" fontWeight={600} fill="#0a1a33">
                {t}
              </text>
            </Appear>
          ))}
        </Card>
      </Appear>
    </g>
  );
}

/* 5. Always edit */
function AlwaysEdit({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#f6ead2" />
      <SceneTitle text="Always add your own touch" />
      <Chidi x={130} y={515} scale={0.8} pose="point" talking={talking} />
      <Card x={270} y={100} w={640} h={330} title="✏️ Editing the caption">
        <text x="24" y="90" fontSize="19" fontWeight={600} fill="#0a1a33">
          Office gowns that fit and flatter.
        </text>
        <Appear show={step >= 1} from="left">
          <g transform="translate(24 120)">
            <rect width="590" height="44" rx="12" fill="#e8f7ee" />
            <text x="14" y="29" fontSize="17" fontWeight={600} fill="#0f7b4a">
              💬 “Fits me perfectly, I wore it to my interview!” · Ngozi
            </text>
          </g>
        </Appear>
        <Appear show={step >= 2} from="left">
          <g transform="translate(24 176)">
            <rect width="590" height="44" rx="12" fill="#e7efff" />
            <text x="14" y="29" fontSize="17" fontWeight={600} fill="#1563d6">
              📍 Pick up in Yaba or delivery across Lagos
            </text>
          </g>
        </Appear>
        <Appear show={step >= 3} from="left">
          <g transform="translate(24 232)">
            <rect width="590" height="44" rx="12" fill="#fff4d6" />
            <text x="14" y="29" fontSize="17" fontWeight={700} fill="#9a5b00">
              🏷️ Only ₦18,500 this week
            </text>
          </g>
        </Appear>
      </Card>
      <Appear show={step >= 1} from="pop">
        <g transform="translate(860 330) rotate(30)" className="ac-float">
          <rect x="-8" y="-60" width="16" height="90" rx="4" fill="#f2b134" />
          <path d="M-8 30 L0 48 L8 30Z" fill="#0a1a33" />
        </g>
      </Appear>
    </g>
  );
}

/* 6. Assignment */
function Assignment({ step, talking }: SceneProps) {
  return (
    <g>
      <Boutique dim />
      <SceneTitle text="Your assignment" />
      <Amaka x={190} y={510} pose={step >= 2 ? "wave" : "present"} talking={talking} />
      <Card x={370} y={100} w={540} h={330} title="📝 Five adverts">
        <Checklist
          x={24}
          y={70}
          step={step}
          items={[
            ["Pick one product", 0],
            ["Write 5 adverts with Problem, Promise, Proof, Push", 0],
            ["Edit each one: a quote, a place, a price", 1],
            ["Submit them under Assignments", 1],
          ]}
          size={17}
        />
      </Card>
      <Appear show={step >= 2} from="up">
        <g transform="translate(560 460)">
          <rect width="340" height="52" rx="26" fill="#0a1a33" />
          <text x="170" y="33" fontSize="18" fontWeight={700} fill="#ffd45c" textAnchor="middle">
            Next: Lesson 4 · Reply fast, sell more
          </text>
        </g>
      </Appear>
    </g>
  );
}

export const boostSalesLesson3: AnimatedLesson = {
  id: "boost-sales-with-ai/3",
  title: "Words that sell",
  scenes: [
    {
      heading: "Words that sell",
      Scene: Intro,
      steps: [
        { say: "Welcome back! In lesson two, Amaka got to know Tolu, her ideal customer." },
        { say: "Today, she will use AI to write the words that make Tolu want to buy." },
      ],
    },
    {
      heading: "Problem, Promise, Proof, Push",
      Scene: Formula,
      steps: [
        { say: "Most good adverts follow a simple formula: Problem, Promise, Proof, Push." },
        { say: "Problem. Name the pain. No time to shop for work clothes?" },
        { say: "Promise. Say what changes. Office-ready outfits at your door in twenty-four hours." },
        { say: "Proof. Give a reason to believe you, like reviews or numbers." },
        { say: "Push. End with one clear next step. Send STYLE on WhatsApp to order." },
      ],
    },
    {
      heading: "Let AI write the first drafts",
      Scene: FiveCaptions,
      tryIt: "Write 5 Instagram captions for [your product] using Problem, Promise, Proof, Push. Audience: [your customer profile].",
      steps: [
        { say: "Now let AI do the first drafts. Ask for five captions using the formula, for your customer." },
        { say: "In seconds, you have five different adverts to choose from." },
        { say: "You can also ask AI to make a caption shorter, warmer, or end with a call to action." },
      ],
    },
    {
      heading: "Make it sound like you",
      Scene: YourVoice,
      tryIt: "Here are 3 of my best posts: [paste them]. Write 5 new captions for [your product] in this same voice.",
      steps: [
        { say: "Want it to sound like you? Paste three of your best past posts." },
        { say: "Then ask: write in this same voice." },
        { say: "Now the adverts sound like your brand, not like a robot." },
      ],
    },
    {
      heading: "Always add your own touch",
      Scene: AlwaysEdit,
      steps: [
        { say: "Always edit what AI gives you. Add three real things." },
        { say: "A real customer quote," },
        { say: "a local detail, like where you deliver," },
        { say: "and a real price. That is what makes people trust you." },
      ],
    },
    {
      heading: "Your assignment",
      Scene: Assignment,
      steps: [
        { say: "Your assignment: pick one product and write five adverts using Problem, Promise, Proof, Push." },
        { say: "Edit each one with a quote, a place and a price, then submit them under Assignments." },
        { say: "In lesson four, we will use AI to reply to customers fast. See you there!" },
      ],
    },
  ],
};
