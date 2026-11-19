"use client";

import { Amaka, Appear, Chidi, Chip, Phone, SceneTitle, Studio, Tolu } from "../cartoon";
import type { AnimatedLesson, SceneProps } from "../types";
import { AiChat, Card, Checklist, Msg } from "./shared";
import { NextLesson, Robot, Sheet } from "./agents-shared";

/*
 * How to Build AI Agents Without Code, Lesson 2: Write your assistant's brain sheet.
 * Amaka puts everything her assistant needs to know on one page.
 */

const SECTIONS: [string, string, number][] = [
  ["🏪", "Business: name, location, hours", 0],
  ["🏷️", "Products and prices", 0],
  ["🚚", "Delivery: areas, fees, time", 1],
  ["💳", "Payment: how customers pay", 1],
  ["🔁", "Policies: swaps, deposits", 1],
  ["😊", "Tone: friendly, English or Pidgin", 2],
  ["🙋🏾‍♀️", "What goes to a person", 2],
];

/* 1. The brain sheet */
function BrainSheet({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#d4e3f7" />
      <SceneTitle text="Your assistant's brain sheet" />
      <Chidi x={120} y={515} scale={0.72} pose="present" talking={talking} />
      <g transform="translate(250 92)">
        <rect x="6" y="10" width="440" height="420" rx="18" fill="#0a1a33" opacity="0.15" />
        <rect width="440" height="420" rx="18" fill="#fff" />
        <rect width="440" height="12" rx="6" fill="#f2b134" />
        <text x="24" y="50" fontSize="22" fontWeight={800} fill="#1563d6" fontFamily="var(--font-heading)">
          🧠 Amaka&apos;s Styles: brain sheet
        </text>
        {SECTIONS.map(([icon, text, at], i) => (
          <Appear key={text} show={step >= at} from="left" delay={(i % 3) * 350}>
            <g transform={`translate(24 ${76 + i * 48})`}>
              <rect width="392" height="38" rx="10" fill="#eef4ff" />
              <text x="12" y="26" fontSize="18">
                {icon}
              </text>
              <text x="44" y="25" fontSize="16" fontWeight={700} fill="#0a1a33">
                {text}
              </text>
            </g>
          </Appear>
        ))}
      </g>
      <g className="ac-float">
        <Robot x={810} y={300} scale={0.85} />
      </g>
      <Appear show={step >= 0} from="pop" delay={800}>
        <Chip x={700} y={430} icon="📖" text="It answers from this" width={220} />
      </Appear>
    </g>
  );
}

/* 2. Let AI help you write it */
function AiWrites({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#e9dcff" />
      <SceneTitle text="Let AI help you write it" />
      <Amaka x={140} y={515} scale={0.78} pose="point" talking={talking} />
      <AiChat
        x={280}
        y={110}
        scale={1}
        prompt={["Turn my notes into a clear brain sheet", "for a customer service assistant. Short", "headings and bullets. Add nothing new."]}
        showPrompt
        showReply={step >= 1}
        replyTitle="Brain sheet"
        reply={["• Hours: Mon–Sat, 9am–7pm", "• Gowns: ₦15,000 to ₦40,000", "• Lagos delivery: ₦2,500, 24 hrs"]}
      />
      <Appear show={step >= 1} from="pop">
        <Chip x={700} y={430} icon="✏️" text="Check every fact" width={200} tone="#16a34a" />
      </Appear>
    </g>
  );
}

/* 3. Three rules at the top */
function Rules({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#f6ead2" />
      <SceneTitle text="Three rules at the top" />
      <Chidi x={160} y={515} scale={0.8} pose="point" talking={talking} />
      <Card x={330} y={100} w={580} h={320} title="📌 Rules for the assistant">
        <Checklist
          x={24}
          y={74}
          step={step}
          gap={74}
          size={17}
          items={[
            ["Only answer from this sheet. If unsure, a person replies.", 0],
            ["Never invent prices or delivery times.", 1],
            ["Say you are an AI assistant in your first reply.", 2],
          ]}
        />
      </Card>
    </g>
  );
}

/* 4. Test it before you build */
function TestIt({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#d5ede2" />
      <SceneTitle text="Test your brain sheet" />
      <Tolu x={130} y={515} scale={0.75} pose="hold" mood={step >= 1 ? "excited" : "thinking"} />
      <Sheet x={250} y={120} w={230} title="🧠 Brain sheet" lines={["Gowns ₦15k–₦40k", "Ikeja delivery ₦2,500", "Sizes 8 to 22", "Open Mon–Sat"]} scale={0.95} />
      <Appear show={step >= 0} from="right" delay={500}>
        <path d="M480 250 C 530 250, 520 220, 560 220" stroke="#1563d6" strokeWidth="5" fill="none" strokeDasharray="10 8" strokeLinecap="round" />
      </Appear>
      <Phone x={580} y={110} scale={1.1} title="Test chat" header="#1563d6">
        <Msg y={8} text={["Wetin be delivery price", "to Ikeja?"]} />
        <Msg y={54} text={["Hi! I'm Amaka's Styles' AI", "assistant 🤖 Delivery to", "Ikeja na ₦2,500, e go", "reach tomorrow 🚚"]} me width={136} show={step >= 1} />
      </Phone>
      <Appear show={step >= 1} from="up">
        <Amaka x={880} y={515} scale={0.55} pose="cheer" talking={talking} />
      </Appear>
    </g>
  );
}

/* 5. Your practice */
function Practise({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#d4e3f7" />
      <SceneTitle text="Your practice" />
      <Amaka x={190} y={510} pose={step >= 1 ? "wave" : "present"} talking={talking} />
      <Card x={370} y={100} w={540} h={300} title="📝 This week">
        <Checklist
          x={24}
          y={70}
          step={step}
          items={[
            ["Write your brain sheet with AI's help", 0],
            ["Add the three rules at the top", 0],
            ["Test it with your 10 questions", 0],
            ["Hand in your brain sheet", 0],
          ]}
          size={17}
        />
      </Card>
      <NextLesson show={step >= 1} text="Next: Lesson 3 · Set up your accounts" />
    </g>
  );
}

export const aiAgentsLesson2: AnimatedLesson = {
  id: "ai-agents-without-code/2",
  title: "Write your assistant's brain sheet",
  scenes: [
    {
      heading: "Your assistant's brain sheet",
      Scene: BrainSheet,
      steps: [
        { say: "Your assistant is only as good as what you tell it. So we write a brain sheet: one page with everything it needs to know. Your business, and your products and prices." },
        { say: "Your delivery areas, fees and times. How customers pay. And your policies, like swaps and deposits." },
        { say: "Your tone: friendly, in English or Pidgin. And what must always go to a person." },
      ],
    },
    {
      heading: "Let AI help you write it",
      Scene: AiWrites,
      tryIt: "Turn these notes into a clear brain sheet for a customer service assistant. Use short headings and bullet points. Don't add anything I didn't say. My notes: [paste]",
      steps: [
        { say: "You don't have to write it all by hand. Paste your notes into ChatGPT or Claude, and ask it to turn them into a clear brain sheet, without adding anything new." },
        { say: "In seconds you have neat headings and bullet points. Then check every price and every fact yourself." },
      ],
    },
    {
      heading: "Three rules at the top",
      Scene: Rules,
      steps: [
        { say: "At the very top of your brain sheet, add three rules. One: only answer from this sheet. If you are not sure, say a person will reply soon." },
        { say: "Two: never invent prices or delivery times." },
        { say: "Three: tell the customer in your first reply that you are an AI assistant." },
      ],
    },
    {
      heading: "Test your brain sheet",
      Scene: TestIt,
      tryIt: "Act as the customer service assistant for my business. Only answer from this brain sheet: [paste]. I will be the customer. Start by greeting me.",
      steps: [
        { say: "Before you build anything, test it. Paste your brain sheet into ChatGPT or Claude, ask it to act as your assistant, and ask your ten questions." },
        { say: "Try one in Pidgin too. If an answer is wrong or missing, fix the brain sheet and try again." },
      ],
    },
    {
      heading: "Your practice",
      Scene: Practise,
      steps: [
        { say: "This week, write your brain sheet, add the three rules, test it with your ten questions, and hand it in." },
        { say: "In lesson three, we will set up your accounts. See you there!" },
      ],
    },
  ],
};
