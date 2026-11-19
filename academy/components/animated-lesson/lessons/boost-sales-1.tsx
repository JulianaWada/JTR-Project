"use client";

import { Amaka, Appear, Boutique, Bubble, Chidi, Chip, Phone, SceneTitle, Studio, Tick, Typed } from "../cartoon";
import type { AnimatedLesson, SceneProps } from "../types";
import { Card, Checklist } from "./shared";

/*
 * Boost Sales with AI, Lesson 1: AI for your business, getting started.
 * Amaka (boutique owner, Yaba) and Chidi (her orders assistant) meet their AI assistant.
 */

function AiOrb({ x, y, r = 70 }: { x: number; y: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <radialGradient id="ai-orb" cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#b9d6ff" />
          <stop offset="0.55" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#1e3a8a" />
        </radialGradient>
      </defs>
      <circle r={r + 14} fill="#3b82f6" opacity="0.15" className="ac-pulse" />
      <circle r={r} fill="url(#ai-orb)" />
      <ellipse cx={-r * 0.3} cy={-r * 0.4} rx={r * 0.3} ry={r * 0.16} fill="#fff" opacity="0.4" />
      <text y={r * 0.28} fontSize={r * 0.8} textAnchor="middle">
        ✨
      </text>
    </g>
  );
}

/* 1. Meet your AI assistant */
function MeetAi({ step, talking }: SceneProps) {
  return (
    <g>
      <Boutique />
      <SceneTitle text="Meet your AI assistant" />
      <Chidi x={200} y={510} scale={0.9} pose={step === 0 ? "wave" : "idle"} mood={step >= 2 ? "excited" : "happy"} />
      <Amaka x={410} y={505} pose={step === 0 ? "wave" : "point"} talking={talking} />
      <Appear show={step >= 1} from="pop">
        <g className="ac-float">
          <AiOrb x={730} y={300} />
        </g>
      </Appear>
      <Appear show={step >= 2} from="pop">
        <Chip x={560} y={150} icon="✍️" text="Drafting" />
      </Appear>
      <Appear show={step >= 2} from="pop" delay={400}>
        <Chip x={790} y={210} icon="📝" text="Summing up" width={150} />
      </Appear>
      <Appear show={step >= 2} from="pop" delay={800}>
        <Chip x={560} y={410} icon="💡" text="New ideas" />
      </Appear>
      <Appear show={step >= 2} from="pop" delay={1200}>
        <Chip x={770} y={400} icon="🎭" text="Plays a customer" width={180} />
      </Appear>
    </g>
  );
}

/* 2. What AI doesn't know */
const UNKNOWN: [string, string][] = [
  ["💰", "Your prices"],
  ["📦", "Your stock"],
  ["👥", "Your customers"],
];

function DoesntKnow({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#e9dcff" />
      <SceneTitle text="What AI doesn't know" />
      <Amaka x={170} y={510} scale={0.9} pose={step >= 1 ? "present" : "idle"} mood={step >= 1 ? "happy" : "thinking"} talking={talking} />
      <AiOrb x={520} y={260} r={60} />
      {UNKNOWN.map(([icon, label], i) => (
        <g key={label} transform={`translate(650 ${150 + i * 90})`}>
          <rect width="250" height="64" rx="18" fill="#fff" />
          <text x="22" y="42" fontSize="26">
            {icon}
          </text>
          <text x="64" y="40" fontSize="20" fontWeight={700} fill="#0a1a33">
            {label}
          </text>
          <Appear show={step === 0} from="pop" delay={i * 300}>
            <text x="222" y="44" fontSize="30" fontWeight={800} fill="#6d4aff" textAnchor="middle">
              ?
            </text>
          </Appear>
          <Appear show={step >= 1} from="pop" delay={1400 + i * 300}>
            <Tick x={222} y={32} r={16} />
          </Appear>
        </g>
      ))}
      {/* the business facts note slides into the AI */}
      <Appear show={step >= 1} from="left">
        <g transform="translate(300 360)">
          <rect width="170" height="120" rx="12" fill="#fff6c9" stroke="#e9cf6a" strokeWidth="2" />
          <text x="14" y="28" fontSize="15" fontWeight={800} fill="#7a5b00">
            📒 Business facts
          </text>
          {["Gowns from ₦15,000", "Delivery: Lagos 24h", "Free size swap"].map((t, i) => (
            <text key={t} x="14" y={54 + i * 22} fontSize="13" fontWeight={600} fill="#3d3000">
              {t}
            </text>
          ))}
        </g>
      </Appear>
      <Appear show={step >= 1} from="left" delay={700}>
        <path d="M475 400 Q520 360 520 330" stroke="#6d4aff" strokeWidth="5" fill="none" strokeLinecap="round" strokeDasharray="8 8" />
      </Appear>
    </g>
  );
}

/* 3. The golden rule */
const PARTS: [string, string, string][] = [
  ["Who you are", "I sell ready-to-wear outfits in Yaba, from ₦15,000.", "#e4572e"],
  ["Who the customer is", "For working women aged 25 to 40.", "#1f9d6b"],
  ["What you want", "Write a 3-line Instagram caption.", "#1563d6"],
  ["The format", "Friendly, one emoji, end with 'DM to order'.", "#8a3fd1"],
];

function GoldenRule({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#d4e3f7" />
      <SceneTitle text="The golden rule: give context" />
      <Amaka x={120} y={515} scale={0.72} pose={step >= 1 ? "point" : "present"} talking={talking} />
      {/* weak prompt */}
      <Appear show={step === 0} from="up">
        <g>
          <Card x={250} y={90} w={300} h={170} title="Vague" tone="#9a5b00">
            <text x="24" y="80" fontSize="18" fontWeight={600} fill="#0a1a33">
              “Write an advert
            </text>
            <text x="24" y="106" fontSize="18" fontWeight={600} fill="#0a1a33">
              for my clothes.”
            </text>
          </Card>
          <Card x={580} y={90} w={330} h={170} title="Vague answer" tone="#44546a">
            <text x="24" y="86" fontSize="18" fill="#6b7a8f">
              “Buy our clothes!
            </text>
            <text x="24" y="112" fontSize="18" fill="#6b7a8f">
              They are very nice.”
            </text>
            <text x="290" y="140" fontSize="34" textAnchor="middle">
              🥱
            </text>
          </Card>
        </g>
      </Appear>
      {/* strong prompt, built part by part */}
      <Appear show={step >= 1} from="up">
        <Card x={250} y={80} w={660} h={step >= 5 ? 250 : 330} title="A prompt with context">
          {PARTS.map(([label, text, colour], i) => (
            <Appear key={label} show={step >= i + 1} from="left">
              <g transform={`translate(24 ${66 + i * 44})`}>
                <rect width="170" height="34" rx="17" fill={colour} />
                <text x="85" y="23" fontSize="14" fontWeight={700} fill="#fff" textAnchor="middle">
                  {label}
                </text>
                <Typed text={text} show={step >= i + 1} x="186" y="23" fontSize="16" fontWeight={600} fill="#0a1a33" />
              </g>
            </Appear>
          ))}
        </Card>
      </Appear>
      <Appear show={step >= 5} from="up">
        <Card x={250} y={350} w={660} h={150} title="✨ An answer that fits" tone="#16a34a">
          {["Busy week? Your work wardrobe is sorted 👗", "Ready-to-wear outfits from ₦15,000, delivered across Lagos.", "Send us a DM to order."].map((t, i) => (
            <Appear key={t} show={step >= 5} from="left" delay={300 + i * 500}>
              <text x="24" y={74 + i * 26} fontSize="16" fontWeight={600} fill="#0a1a33">
                {t}
              </text>
            </Appear>
          ))}
        </Card>
      </Appear>
    </g>
  );
}

/* 4. Set up in five minutes */
function SetUp({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#d5ede2" />
      <SceneTitle text="Set up in five minutes" />
      <Chidi x={170} y={510} scale={0.9} pose={step === 1 ? "hold" : "point"} talking={talking} />
      <Phone x={330} y={110} scale={1.15} title="My apps" header="#0a1a33">
        {[
          ["ChatGPT", "#10a37f", 0],
          ["Claude", "#d97757", 0],
          ["WhatsApp", "#25d366", -1],
          ["Notes", "#f2b134", 2],
        ].map(([name, colour, at], i) => (
          <Appear key={name as string} show={step >= (at as number)} from="pop" delay={i * 250}>
            <g transform={`translate(${16 + (i % 2) * 66} ${16 + Math.floor(i / 2) * 84})`}>
              <rect width="52" height="52" rx="14" fill={colour as string} />
              <text x="26" y="35" fontSize="24" fontWeight={800} fill="#fff" textAnchor="middle">
                {(name as string)[0]}
              </text>
              <text x="26" y="70" fontSize="10" fontWeight={600} fill="#0a1a33" textAnchor="middle">
                {name}
              </text>
            </g>
          </Appear>
        ))}
      </Phone>
      <Appear show={step >= 0} from="right" delay={600}>
        <Chip x={560} y={130} icon="🆓" text="Free accounts" />
      </Appear>
      <Appear show={step >= 1} from="right">
        <Chip x={560} y={200} icon="📱" text="Phone apps, next to WhatsApp" width={330} />
      </Appear>
      <Appear show={step >= 2} from="up">
        <g transform="translate(560 280)">
          <rect width="340" height="190" rx="16" fill="#fff6c9" stroke="#e9cf6a" strokeWidth="2" />
          <text x="20" y="36" fontSize="19" fontWeight={800} fill="#7a5b00">
            📒 Business facts
          </text>
          {["Prices: gowns ₦15,000 to ₦40,000", "Delivery: Lagos 24h, other states 3 days", "Payment: transfer or card link", "Returns: free size swap in 7 days"].map((t, i) => (
            <Typed key={t} text={t} show={step >= 2} delay={i * 1100} x="20" y={72 + i * 30} fontSize="15" fontWeight={600} fill="#3d3000" />
          ))}
        </g>
      </Appear>
    </g>
  );
}

/* 5. Stay safe */
function StaySafe({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#f6ead2" />
      <SceneTitle text="Use AI safely" />
      <Amaka x={160} y={510} scale={0.88} pose="point" mood={step === 0 ? "thinking" : "happy"} talking={talking} />
      <Appear show={step === 0} from="up">
        <g>
          <Bubble x={330} y={110} lines={["✨ Delivery to Abuja:", "1 hour"]} width={260} tone="blue" tail="none" />
          <g transform="translate(450 270)">
            <circle r="46" fill="none" stroke="#0a1a33" strokeWidth="10" />
            <path d="M32 32 L80 80" stroke="#0a1a33" strokeWidth="14" strokeLinecap="round" />
          </g>
          <Appear show={step === 0} from="pop" delay={1600}>
            <g>
              <path d="M330 175 L590 175" stroke="#e4572e" strokeWidth="5" />
              <Bubble x={620} y={110} lines={["Real answer:", "3 days ✅"]} width={240} tone="green" tail="none" />
            </g>
          </Appear>
          <Chip x={560} y={360} icon="🔎" text="Check facts and numbers" width={290} />
        </g>
      </Appear>
      <Appear show={step >= 1} from="up">
        <g>
          <Card x={340} y={100} w={540} h={230} title="Keep private">
            {["Card number: ████ ████ ████ 4821", "Full address: ██ ██████ Street", "Name and order: Chioma, 2 gowns ✅"].map((t, i) => (
              <Appear key={t} show={step >= 1} from="left" delay={400 + i * 500}>
                <text x="24" y={86 + i * 44} fontSize="19" fontWeight={600} fill="#0a1a33">
                  {t}
                </text>
              </Appear>
            ))}
          </Card>
          <g transform="translate(600 370)" className="ac-float">
            <path d="M0 0 L60 22 L60 70 Q60 110 0 130 Q-60 110 -60 70 L-60 22Z" fill="#16a34a" />
            <text x="0" y="84" fontSize="44" textAnchor="middle">
              🔒
            </text>
          </g>
        </g>
      </Appear>
    </g>
  );
}

/* 6. Your first steps */
function FirstSteps({ step, talking }: SceneProps) {
  return (
    <g>
      <Boutique dim />
      <SceneTitle text="Your first steps" />
      <Amaka x={190} y={510} pose={step >= 2 ? "wave" : "present"} talking={talking} />
      <Card x={370} y={100} w={540} h={330} title="📝 Before lesson 2">
        <Checklist
          x={24}
          y={70}
          step={step}
          items={[
            ["Create your ChatGPT and Claude accounts", 0],
            ["Install the phone apps", 0],
            ["Write your business facts note", 1],
            ["Try one prompt with full context", 1],
          ]}
        />
      </Card>
      <Appear show={step >= 2} from="up">
        <g transform="translate(560 460)">
          <rect width="340" height="52" rx="26" fill="#0a1a33" />
          <text x="170" y="33" fontSize="18" fontWeight={700} fill="#ffd45c" textAnchor="middle">
            Next: Lesson 2 · Know your customer
          </text>
        </g>
      </Appear>
    </g>
  );
}

export const boostSalesLesson1: AnimatedLesson = {
  id: "boost-sales-with-ai/1",
  title: "AI for your business: getting started",
  scenes: [
    {
      heading: "Meet your AI assistant",
      Scene: MeetAi,
      steps: [
        { say: "Welcome to Boost Sales with AI! Meet Amaka, who sells ready-to-wear outfits in Yaba, Lagos, and Chidi, who looks after her orders." },
        { say: "AI tools like ChatGPT and Claude are writing and thinking assistants, ready to help them sell." },
        { say: "AI is very good at drafting text, summing things up, brainstorming new ideas, and even playing the role of a customer." },
      ],
    },
    {
      heading: "What AI doesn't know",
      Scene: DoesntKnow,
      steps: [
        { say: "But AI does not know your prices, your stock, or your customers." },
        { say: "Unless you tell it. So keep a short note of your business facts, and paste it in when you ask for help." },
      ],
    },
    {
      heading: "The golden rule: give context",
      Scene: GoldenRule,
      tryIt:
        "I sell [your product] in [your city] for [price]. Write a 3-line Instagram caption for [your customers]. Friendly tone, one emoji, end with 'Send us a DM to order'.",
      steps: [
        { say: "Here is the golden rule. A vague request gets a vague answer." },
        { say: "A good prompt says who you are," },
        { say: "who the customer is," },
        { say: "what you want," },
        { say: "and the format you want it in." },
        { say: "Now the answer fits your business, and it's ready to post." },
      ],
    },
    {
      heading: "Set up in five minutes",
      Scene: SetUp,
      steps: [
        { say: "Let's get set up. Create free accounts on ChatGPT and Claude." },
        { say: "Install their phone apps, so AI sits right next to WhatsApp, wherever you are." },
        { say: "Then write your business facts note: prices, delivery areas, payment and returns, ready to paste into any prompt." },
      ],
    },
    {
      heading: "Use AI safely",
      Scene: StaySafe,
      steps: [
        { say: "Two safety rules. First, AI can get facts and numbers wrong, so always check them before you post." },
        { say: "Second, never paste private details, like card numbers or full addresses. Keep your customers safe." },
      ],
    },
    {
      heading: "Your first steps",
      Scene: FirstSteps,
      steps: [
        { say: "Before the next lesson, create your accounts and install the apps." },
        { say: "Write your business facts note, and try one prompt with full context." },
        { say: "In lesson two, we will use AI to get to know your customer. See you there!" },
      ],
    },
  ],
};
