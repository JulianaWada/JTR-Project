"use client";

import { Amaka, Appear, Chidi, Chip, Phone, SceneTitle, Studio, Tolu, Typed } from "../cartoon";
import type { AnimatedLesson, SceneProps } from "../types";
import { AiChat, Card, Checklist, Msg } from "./shared";

/*
 * Boost Sales with AI, Lesson 4: Reply fast, sell more.
 * Chidi answers Amaka's WhatsApp customers quickly with an AI-drafted reply bank.
 */

function Clock({ x, y, r = 60, spin = false }: { x: number; y: number; r?: number; spin?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r + 6} fill="#0a1a33" opacity="0.15" />
      <circle r={r} fill="#fff" stroke="#0a1a33" strokeWidth="6" />
      {[0, 90, 180, 270].map((a) => (
        <rect key={a} x="-2" y={-r + 8} width="4" height="10" fill="#0a1a33" transform={`rotate(${a})`} />
      ))}
      <rect x="-3" y={-r * 0.5} width="6" height={r * 0.5} rx="3" fill="#0a1a33" />
      <g>
        <rect x="-2" y={-r * 0.8} width="4" height={r * 0.8} rx="2" fill="#e4572e" />
        {spin && <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="2.4s" repeatCount="indefinite" />}
      </g>
      <circle r="6" fill="#0a1a33" />
    </g>
  );
}

/* 1. Speed wins sales */
function Speed({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#d5ede2" />
      <SceneTitle text="Speed wins sales" />
      <Tolu x={150} y={510} scale={0.85} pose="hold" mood={step >= 1 ? "excited" : "happy"} />
      <Phone x={300} y={110} scale={1.15} title="Amaka's Styles">
        <Msg y={10} text={["Hi! Is the blue gown", "available in size 14?"]} />
        <Msg y={56} text={["Yes it is! ₦18,500, delivered", "to Lekki tomorrow 💙"]} me width={130} show={step >= 1} />
        <Msg y={102} text={["Perfect, I'll take it!"]} show={step >= 1} delay={1200} />
      </Phone>
      <Clock x={680} y={220} spin={step === 0} />
      <Appear show={step === 0} from="pop">
        <Chip x={590} y={320} icon="⏳" text="Over 1 hour? They buy elsewhere" width={330} />
      </Appear>
      <Appear show={step >= 1} from="pop">
        <Chip x={590} y={320} icon="⚡" text="Replied in 2 minutes" width={250} tone="#16a34a" />
      </Appear>
      <Appear show={step >= 1} from="up" delay={600}>
        <Chidi x={895} y={515} scale={0.55} pose="cheer" talking={talking} />
      </Appear>
    </g>
  );
}

/* 2. Reply bank */
const QUESTIONS: [string, string][] = [
  ["/price", "Gowns are ₦15,000 to ₦40,000."],
  ["/delivery", "Lagos in 24 hours, other states 3 days."],
  ["/sizes", "Sizes 8 to 22, and we swap free."],
  ["/pay", "Transfer or a card payment link."],
  ["/returns", "Free size swap within 7 days."],
];

function ReplyBank({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#d4e3f7" />
      <SceneTitle text="Build a reply bank" />
      <Chidi x={120} y={515} scale={0.75} pose="present" talking={talking} />
      <Appear show={step <= 1} from="up">
        <AiChat
          x={240}
          y={110}
          scale={0.95}
          prompt={["Draft friendly replies to my 15 most", "common customer questions. Here are", "my business facts: [paste]"]}
          showPrompt
        />
      </Appear>
      {QUESTIONS.map(([key, answer], i) => (
        <Appear key={key} show={step >= 1} from="right" delay={i * 300}>
          <g transform={`translate(650 ${100 + i * 74})`}>
            <rect width="270" height="62" rx="14" fill="#fff" />
            <text x="14" y="25" fontSize="15" fontWeight={800} fill="#0b7a5b">
              {key}
            </text>
            <text x="14" y="47" fontSize="12.5" fontWeight={600} fill="#0a1a33">
              {answer}
            </text>
          </g>
        </Appear>
      ))}
      <Appear show={step >= 2} from="up">
        <Phone x={330} y={120} scale={1.1} title="Customer">
          <Msg y={10} text={["How much is delivery", "to Ikeja?"]} />
          <g transform="translate(6 222)">
            <rect width="138" height="26" rx="13" fill="#fff" />
            <Typed text="/delivery" show={step >= 2} delay={300} speed={120} x="10" y="17" fontSize="11" fontWeight={700} fill="#0b7a5b" />
          </g>
          <Msg y={60} text={["Lagos in 24 hours, other", "states in 3 days 🚚"]} me width={130} show={step >= 2} delay={1800} />
        </Phone>
      </Appear>
    </g>
  );
}

/* 3. "Too expensive" */
function TooExpensive({ step }: SceneProps) {
  return (
    <g>
      <Studio tone="#f6ead2" />
      <SceneTitle text="When they say it's too expensive" />
      <Tolu x={140} y={515} scale={0.8} pose="hold" mood={step >= 2 ? "excited" : "thinking"} />
      <Phone x={260} y={120} scale={1.1} title="Tolu">
        <Msg y={10} text={["It's too expensive 😅"]} />
        <Msg y={50} text={["It's fully lined and made to", "last, with a free size swap.", "Pay in 2 parts if you like 💙"]} me width={136} show={step >= 2} />
        <Msg y={116} text={["Okay, I'll take it!"]} show={step >= 2} delay={1500} />
      </Phone>
      <AiChat
        x={500}
        y={110}
        scale={0.95}
        prompt={["A customer says my ₦18,500 gown is too", "expensive. Give me 3 polite replies that", "explain the value without cutting the price."]}
        showPrompt={step >= 1}
        showReply={step >= 1}
        reply={["1. Fully lined, made to last…", "2. Free size swap, no stress…", "3. Pay in two parts…"]}
      />
      <Appear show={step >= 2} from="pop">
        <Chip x={560} y={430} icon="💎" text="Explain the value, keep your price" width={340} tone="#16a34a" />
      </Appear>
    </g>
  );
}

/* 4. An upset customer */
function UpsetCustomer({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#e9dcff" />
      <SceneTitle text="Calm replies win customers back" />
      <Chidi x={130} y={515} scale={0.8} pose="point" talking={talking} />
      <Phone x={260} y={120} scale={1.1} title="Customer">
        <Msg y={10} text={["My order is late!!"]} />
        <Msg y={50} text={["So sorry for the wait! It", "arrives today by 4pm, and", "your next delivery is free 🙏"]} me width={136} show={step >= 1} />
        <Msg y={116} text={["Thank you, that's kind 🙏"]} show={step >= 1} delay={1500} />
      </Phone>
      <AiChat
        x={500}
        y={110}
        scale={0.95}
        prompt={["Here is a message from an upset customer:", "[paste]. Write a calm, apologetic reply", "that offers a solution."]}
        showPrompt
        showReply={step >= 1}
        reply={["✓ Says sorry", "✓ Gives a clear time", "✓ Offers something kind"]}
      />
    </g>
  );
}

/* 5. An AI sales agent */
function SalesAgent({ step, talking }: SceneProps) {
  return (
    <g>
      <rect width="960" height="540" fill="#14254a" />
      {Array.from({ length: 30 }, (_, i) => (
        <circle key={i} cx={(i * 137) % 960} cy={(i * 71) % 300} r={i % 3 === 0 ? 2.5 : 1.5} fill="#fff" opacity="0.7" />
      ))}
      <circle cx="820" cy="110" r="44" fill="#fff3c4" />
      <circle cx="840" cy="98" r="44" fill="#14254a" />
      <SceneTitle text="Going further: an AI sales agent" />
      <text x="140" y="150" fontSize="22" fontWeight={700} fill="#ffd45c">
        2:14 AM
      </text>
      <Amaka x={190} y={510} scale={0.8} pose="present" talking={talking} />
      <Phone x={380} y={110} scale={1.15} title="Amaka's Styles">
        <Msg y={10} text={["Hi, do you have the red", "gown in size 12?"]} />
        <Msg y={56} text={["Yes! ₦18,500. Shall I", "reserve it for you? 🤖"]} me width={130} show={step >= 0} delay={1200} />
        <Msg y={102} text={["Yes please"]} show={step >= 1} />
        <Appear show={step >= 1} from="pop" delay={700}>
          <g transform="translate(30 140)">
            <rect width="114" height="40" rx="10" fill="#0ba4db" />
            <text x="57" y="25" fontSize="12" fontWeight={800} fill="#fff" textAnchor="middle">
              Pay ₦18,500
            </text>
          </g>
        </Appear>
        <Msg y={192} text={["Paid ✅ Thank you!"]} show={step >= 1} delay={1800} />
      </Phone>
      <Appear show={step >= 1} from="pop">
        <Chip x={640} y={220} icon="🛒" text="Takes the order" />
      </Appear>
      <Appear show={step >= 1} from="pop" delay={600}>
        <Chip x={640} y={290} icon="💳" text="Sends a payment link" width={250} />
      </Appear>
      <Appear show={step >= 2} from="pop">
        <g transform="translate(640 370)">
          <rect width="270" height="70" rx="18" fill="#fff" />
          <image href="/academy/brand/jtr-emblem.png" x="12" y="11" width="48" height="48" />
          <text x="72" y="32" fontSize="15" fontWeight={800} fill="#0a1a33">
            JTR builds these
          </text>
          <text x="72" y="52" fontSize="13" fill="#44546a">
            for businesses like yours
          </text>
        </g>
      </Appear>
    </g>
  );
}

/* 6. Practise */
function Practise({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#d4e3f7" />
      <SceneTitle text="Your practice" />
      <Chidi x={190} y={510} pose={step >= 1 ? "wave" : "present"} talking={talking} />
      <Card x={370} y={100} w={540} h={300} title="📝 This week">
        <Checklist
          x={24}
          y={70}
          step={step}
          items={[
            ["List your 15 most common questions", 0],
            ["Ask AI to draft a reply for each", 0],
            ["Save them as WhatsApp quick replies", 0],
            ["Prepare a calm reply for upset customers", 0],
          ]}
          size={17}
        />
      </Card>
      <Appear show={step >= 1} from="up">
        <g transform="translate(560 440)">
          <rect width="340" height="52" rx="26" fill="#0a1a33" />
          <text x="170" y="33" fontSize="18" fontWeight={700} fill="#ffd45c" textAnchor="middle">
            Next: Lesson 5 · Follow up and close
          </text>
        </g>
      </Appear>
    </g>
  );
}

export const boostSalesLesson4: AnimatedLesson = {
  id: "boost-sales-with-ai/4",
  title: "Reply fast, sell more",
  scenes: [
    {
      heading: "Speed wins sales",
      Scene: Speed,
      steps: [
        { say: "Here is a simple truth. Customers who wait more than an hour for a reply often buy somewhere else." },
        { say: "With AI, Chidi replies in two minutes, clearly and kindly, even on a busy day. And the sale is made." },
      ],
    },
    {
      heading: "Build a reply bank",
      Scene: ReplyBank,
      tryIt: "Here are my business facts: [paste]. Draft friendly WhatsApp replies to my 15 most common customer questions: price, delivery time, sizes, payment methods and returns.",
      steps: [
        { say: "Build a reply bank. Ask AI to draft replies to your fifteen most common questions." },
        { say: "Price, delivery time, sizes, payment methods, and returns." },
        { say: "Save them as WhatsApp Business quick replies. Type a short word, tap, and the full answer is sent." },
      ],
    },
    {
      heading: "When they say it's too expensive",
      Scene: TooExpensive,
      tryIt: "A customer says my [product] at [price] is too expensive. Give me 3 polite replies that explain the value without cutting the price.",
      steps: [
        { say: "What about: it's too expensive?" },
        { say: "Ask AI for three polite replies that explain the value, without cutting your price." },
        { say: "Pick the one that sounds like you. Very often, the customer says yes." },
      ],
    },
    {
      heading: "Calm replies win customers back",
      Scene: UpsetCustomer,
      tryIt: "Here is a message from an upset customer: [paste]. Write a calm, apologetic reply that offers a solution.",
      steps: [
        { say: "When a customer is upset, paste their message into AI and ask for a calm, apologetic reply that offers a solution." },
        { say: "Say sorry, give a clear time, and offer something kind. That turns a problem into a loyal customer." },
      ],
    },
    {
      heading: "Going further: an AI sales agent",
      Scene: SalesAgent,
      steps: [
        { say: "You can go even further. An AI sales agent answers on WhatsApp automatically, even at two in the morning." },
        { say: "It takes the order and sends a payment link, so the customer pays straight away." },
        { say: "JTR builds these sales agents for businesses like yours." },
      ],
    },
    {
      heading: "Your practice",
      Scene: Practise,
      steps: [
        { say: "This week, build your reply bank, save your quick replies, and prepare one calm reply for upset customers." },
        { say: "In lesson five, we will follow up and close more sales. See you there!" },
      ],
    },
  ],
};
