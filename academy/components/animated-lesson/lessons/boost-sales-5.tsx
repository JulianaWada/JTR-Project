"use client";

import { Amaka, Appear, Bubble, Chidi, Chip, Phone, SceneTitle, Studio, Tick, Tolu } from "../cartoon";
import type { AnimatedLesson, SceneProps } from "../types";
import { AiChat, Card, Checklist, Msg } from "./shared";

/*
 * Boost Sales with AI, Lesson 5: Follow up and close.
 */

/* 1. Most sales happen after the follow-up */
const DAYS: [string, string, number][] = [
  ["Day 1", "Hi Tolu! The blue gown is still here for you 💙", 1],
  ["Day 3", "Quick reminder: free delivery ends Friday 🚚", 2],
  ["Day 7", "No pressure at all. Here whenever you're ready 🙂", 3],
];

function FollowUp({ step }: SceneProps) {
  return (
    <g>
      <Studio tone="#d4e3f7" />
      <SceneTitle text="Most sales happen after the follow-up" />
      <Tolu x={140} y={515} scale={0.8} pose="hold" mood={step >= 3 ? "excited" : "happy"} />
      <Appear show={step === 0} from="pop">
        <Bubble x={210} y={110} lines={["I'll get back to you…"]} width={240} />
      </Appear>
      {DAYS.map(([day, text, at], i) => (
        <Appear key={day} show={step >= at} from="right">
          <g transform={`translate(330 ${110 + i * 110})`}>
            <rect width="110" height="80" rx="16" fill="#0a1a33" />
            <text x="55" y="48" fontSize="22" fontWeight={800} fill="#ffd45c" textAnchor="middle">
              {day}
            </text>
            <rect x="124" width="440" height="80" rx="16" fill="#dcf8c6" />
            <text x="144" y="48" fontSize="16" fontWeight={600} fill="#1b1b1b">
              {text}
            </text>
          </g>
        </Appear>
      ))}
      <Appear show={step >= 3} from="pop" delay={1200}>
        <g transform="translate(830 400)">
          <Tick x={0} y={0} r={34} />
          <text x="0" y="70" fontSize="18" fontWeight={800} fill="#16a34a" textAnchor="middle">
            Sold!
          </text>
        </g>
      </Appear>
    </g>
  );
}

/* 2. Let AI write the sequence */
function Sequence({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#e9dcff" />
      <SceneTitle text="Let AI write the follow-ups" />
      <Chidi x={130} y={515} scale={0.8} pose="present" talking={talking} />
      <AiChat
        x={260}
        y={110}
        scale={1.05}
        prompt={["Write a 3-message follow-up sequence for", "a customer who asked about my gowns.", "Make each message gentler than the last."]}
        showPrompt
        showReply={step >= 1}
        replyTitle="✨ Your sequence"
        reply={["Day 1: a friendly reminder", "Day 3: a helpful extra", "Day 7: a kind, no-pressure note"]}
      />
      <Appear show={step >= 1} from="pop" delay={1600}>
        <Chip x={720} y={440} icon="🕊️" text="Gentler each time" width={210} />
      </Appear>
    </g>
  );
}

/* 3. Keep a lead list */
const LEADS: [string, string, string, string][] = [
  ["Tolu", "Mon 3rd", "Blue gown, size 14", "Day 3 ✓"],
  ["Ngozi", "Tue 4th", "2 office gowns", "Day 1 ✓"],
  ["Funmi", "Wed 5th", "Delivery to Ajah", "Today"],
  ["Bisi", "Thu 6th", "Red gown price", "Tomorrow"],
];

function LeadList({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#d5ede2" />
      <SceneTitle text="Keep a simple lead list" />
      <Amaka x={130} y={515} scale={0.8} pose="point" talking={talking} />
      <Card x={260} y={100} w={660} h={340}>
        <rect width="660" height="56" rx="22" fill="#0f7b4a" />
        <rect y="30" width="660" height="26" fill="#0f7b4a" />
        {["Name", "Date", "Asked about", "Follow up"].map((h, i) => (
          <text key={h} x={[24, 140, 270, 520][i]} y="36" fontSize="16" fontWeight={800} fill="#fff">
            {h}
          </text>
        ))}
        {LEADS.map((row, r) => (
          <Appear key={row[0]} show={step >= (r < 2 ? 0 : 1)} from="left" delay={r * 400}>
            <g transform={`translate(0 ${70 + r * 64})`}>
              <rect x="10" width="640" height="54" rx="10" fill={r % 2 ? "#f3f5f8" : "#fff"} />
              {row.map((cell, c) => (
                <text key={c} x={[24, 140, 270, 520][c]} y="34" fontSize="16" fontWeight={c === 0 ? 700 : 500} fill={c === 3 && cell.includes("✓") ? "#16a34a" : "#0a1a33"}>
                  {cell}
                </text>
              ))}
            </g>
          </Appear>
        ))}
      </Card>
    </g>
  );
}

/* 4. Talking about price */
const PACKAGES: [string, string, string, string][] = [
  ["Basic", "₦15,000", "1 gown", "#6b7a8f"],
  ["Standard", "₦25,000", "Gown + free delivery", "#1563d6"],
  ["Premium", "₦40,000", "2 gowns + styling", "#8a3fd1"],
];

function Price({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#f6ead2" />
      <SceneTitle text="Talking about price" />
      <Amaka x={130} y={515} scale={0.8} pose="present" talking={talking} />
      <Appear show={step === 0} from="up">
        <g>
          {["✓ Fully lined, made to last", "✓ Fits your shape, free swap", "✓ At your door in 24 hours"].map((t, i) => (
            <Appear key={t} show={step === 0} from="left" delay={i * 500}>
              <g transform={`translate(300 ${120 + i * 70})`}>
                <rect width="360" height="54" rx="14" fill="#fff" />
                <text x="18" y="35" fontSize="18" fontWeight={700} fill="#0f7b4a">
                  {t}
                </text>
              </g>
            </Appear>
          ))}
          <Appear show={step === 0} from="pop" delay={1800}>
            <g transform="translate(720 220) rotate(-6)">
              <path d="M0 0 L150 0 L176 30 L150 60 L0 60Z" fill="#f2b134" />
              <text x="20" y="40" fontSize="26" fontWeight={800} fill="#0a1a33">
                ₦18,500
              </text>
            </g>
          </Appear>
          <text x="480" y="380" fontSize="20" fontWeight={700} fill="#44546a" textAnchor="middle">
            Value first, then the price
          </text>
        </g>
      </Appear>
      {PACKAGES.map(([name, price, what, colour], i) => (
        <Appear key={name} show={step >= 1} from="up" delay={i * 350}>
          <g transform={`translate(${290 + i * 215} ${i === 1 ? 110 : 140})`}>
            <rect x="4" y="8" width="195" height={i === 1 ? 290 : 250} rx="20" fill="#0a1a33" opacity="0.15" />
            <rect width="195" height={i === 1 ? 290 : 250} rx="20" fill="#fff" />
            <rect width="195" height="54" rx="20" fill={colour} />
            <rect y="30" width="195" height="24" fill={colour} />
            <text x="97" y="36" fontSize="19" fontWeight={800} fill="#fff" textAnchor="middle">
              {name}
            </text>
            <text x="97" y="110" fontSize="28" fontWeight={800} fill="#0a1a33" textAnchor="middle">
              {price}
            </text>
            <text x="97" y="150" fontSize="14" fontWeight={600} fill="#44546a" textAnchor="middle">
              {what}
            </text>
            {i === 1 && (
              <text x="97" y="250" fontSize="14" fontWeight={800} fill="#1563d6" textAnchor="middle">
                ⭐ Most chosen
              </text>
            )}
          </g>
        </Appear>
      ))}
    </g>
  );
}

/* 5. Practise haggling with AI */
function Haggle({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#e9dcff" />
      <SceneTitle text="Practise with AI" />
      <Chidi x={130} y={515} scale={0.8} pose="hold" talking={talking} mood={step >= 2 ? "excited" : "happy"} />
      <Phone x={280} y={110} scale={1.15} title="AI practice">
        <Msg y={10} text={["🎭 Act as a customer who", "haggles hard. Start now."]} me width={130} />
        <Msg y={60} text={["Abeg, ₦10,000 last price? 😄"]} show={step >= 1} />
        <Msg y={100} text={["It's lined and made to last.", "Our Basic option starts", "at ₦15,000 🙂"]} me width={136} show={step >= 1} delay={1400} />
        <Msg y={160} text={["✨ Great reply! You kept", "the value and gave options."]} show={step >= 2} />
      </Phone>
      <Appear show={step >= 2} from="pop">
        <Chip x={560} y={200} icon="💪🏾" text="Practise until it feels easy" width={300} tone="#16a34a" />
      </Appear>
    </g>
  );
}

/* 6. Close the sale */
function Close({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#d4e3f7" />
      <SceneTitle text="Make paying easy" />
      <Amaka x={130} y={515} scale={0.8} pose={step >= 3 ? "cheer" : "point"} talking={talking} />
      {[
        ["💳", "One clear payment link", 1],
        ["🚚", "A clear delivery time", 1],
        ["💌", "A thank-you message", 2],
      ].map(([icon, text, at], i) => (
        <Appear key={text as string} show={step >= (at as number)} from="right" delay={(i % 2) * 500}>
          <Chip x={290} y={120 + i * 74} icon={icon as string} text={text as string} width={290} />
        </Appear>
      ))}
      <Phone x={640} y={100} scale={1.15} title="Tolu">
        <Msg y={10} text={["Ready to pay!"]} />
        <Appear show={step >= 1} from="pop">
          <g transform="translate(30 46)">
            <rect width="114" height="40" rx="10" fill="#0ba4db" />
            <text x="57" y="25" fontSize="12" fontWeight={800} fill="#fff" textAnchor="middle">
              Pay ₦18,500
            </text>
          </g>
        </Appear>
        <Msg y={96} text={["Paid! Arrives tomorrow", "by 4pm 🚚"]} me width={130} show={step >= 1} delay={1200} />
        <Msg y={140} text={["Thank you Tolu! 💙 Would", "you leave us a review?"]} me width={136} show={step >= 2} />
        <Appear show={step >= 3} from="pop">
          <g transform="translate(6 190)">
            <rect width="138" height="48" rx="10" fill="#fff" />
            <text x="10" y="20" fontSize="13" fill="#f2b134">
              ★★★★★
            </text>
            <text x="10" y="38" fontSize="9.5" fill="#1b1b1b">
              Perfect fit, fast delivery!
            </text>
          </g>
        </Appear>
      </Phone>
      <Appear show={step === 0} from="pop">
        <text x="420" y="300" fontSize="70" textAnchor="middle">
          🤝
        </text>
      </Appear>
    </g>
  );
}

/* 7. Practice */
function Wrap({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#d5ede2" />
      <SceneTitle text="Your practice" />
      <Chidi x={190} y={510} pose={step >= 1 ? "wave" : "present"} talking={talking} />
      <Card x={370} y={100} w={540} h={300} title="📝 This week">
        <Checklist
          x={24}
          y={70}
          step={step}
          items={[
            ["Start your lead list", 0],
            ["Write a 3-message follow-up sequence", 0],
            ["Make Basic, Standard and Premium options", 0],
            ["Practise haggling with AI", 0],
          ]}
          size={17}
        />
      </Card>
      <Appear show={step >= 1} from="up">
        <g transform="translate(560 440)">
          <rect width="340" height="52" rx="26" fill="#0a1a33" />
          <text x="170" y="33" fontSize="18" fontWeight={700} fill="#ffd45c" textAnchor="middle">
            Next: Lesson 6 · Your AI sales plan
          </text>
        </g>
      </Appear>
    </g>
  );
}

export const boostSalesLesson5: AnimatedLesson = {
  id: "boost-sales-with-ai/5",
  title: "Follow up and close",
  scenes: [
    {
      heading: "Most sales happen after the follow-up",
      Scene: FollowUp,
      steps: [
        { say: "Many customers say, I'll get back to you. And then they don't." },
        { say: "A friendly follow-up one day later," },
        { say: "another three days later," },
        { say: "and a last, gentle one after seven days, recovers many of these sales." },
      ],
    },
    {
      heading: "Let AI write the follow-ups",
      Scene: Sequence,
      tryIt: "Write a 3-message WhatsApp follow-up sequence for a customer who asked about [product]. Make each message gentler than the last.",
      steps: [
        { say: "Ask AI to write a three-message follow-up sequence that gets gentler each time." },
        { say: "Now you never have to think about what to say. Just copy, adjust and send." },
      ],
    },
    {
      heading: "Keep a simple lead list",
      Scene: LeadList,
      steps: [
        { say: "Keep a simple list of every lead: their name, the date, and what they asked about. A spreadsheet works well." },
        { say: "Each day, check who needs a follow-up, so nobody is forgotten." },
      ],
    },
    {
      heading: "Talking about price",
      Scene: Price,
      steps: [
        { say: "When you talk about price, lead with the value first. What they get, and why it lasts." },
        { say: "Then offer options: a basic, a standard and a premium package. Most people choose the middle one." },
      ],
    },
    {
      heading: "Practise with AI",
      Scene: Haggle,
      tryIt: "Act as a customer who haggles hard over my [product] at [price]. After each of my replies, tell me how I did.",
      steps: [
        { say: "Want to get better at price talks? Ask AI to play a customer who haggles." },
        { say: "Reply as you would in real life." },
        { say: "AI tells you how you did. Practise until it feels easy." },
      ],
    },
    {
      heading: "Make paying easy",
      Scene: Close,
      steps: [
        { say: "Finally, make paying easy." },
        { say: "Send one clear payment link, and a clear delivery time." },
        { say: "After they pay, send a thank-you message and ask for a review." },
        { say: "Every review helps you win the next customer." },
      ],
    },
    {
      heading: "Your practice",
      Scene: Wrap,
      steps: [
        { say: "This week, start your lead list, write your follow-up sequence, make your three options, and practise with AI." },
        { say: "In lesson six, you will put it all together in your AI sales plan. See you there!" },
      ],
    },
  ],
};
