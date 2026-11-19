"use client";

import { Amaka, Appear, Chidi, Chip, Phone, SceneTitle, Studio, Tolu, Typed } from "../cartoon";
import type { AnimatedLesson, SceneProps } from "../types";
import { Card, Checklist, Msg } from "./shared";
import { AppWindow, Button, NextLesson, Robot, Sheet } from "./agents-shared";

/*
 * How to Build AI Agents Without Code, Lesson 4: Build the assistant.
 * Chidi gives the Botpress bot its instructions and Amaka's brain sheet, adds a greeting and a hand-over, and publishes it.
 */

/* 1. Instructions */
function Instructions({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#d4e3f7" />
      <SceneTitle text="Give it instructions" />
      <Chidi x={120} y={515} scale={0.72} pose="point" talking={talking} />
      <AppWindow x={250} y={100} w={640} h={360} title="Botpress · Instructions">
        <text x="30" y="46" fontSize="20" fontWeight={800} fill="#0a1a33" fontFamily="var(--font-heading)">
          Instructions
        </text>
        <rect x="30" y="62" width="580" height="236" rx="12" fill="#f3f6fa" stroke="#c7d2de" />
        {[
          "You are the friendly AI assistant of Amaka's Styles.",
          "Only answer from the knowledge base.",
          "If you are not sure, say a person will reply soon.",
          "Never invent prices or delivery times.",
          "Reply in English or Pidgin, like the customer.",
          "Keep replies to two or three short lines.",
        ].map((line, i) => (
          <Typed key={line} text={line} show={step >= (i < 4 ? 0 : 1)} delay={(i % 4) * 1100} speed={22} x="46" y={96 + i * 34} fontSize="16" fontWeight={600} fill="#0a1a33" />
        ))}
      </AppWindow>
    </g>
  );
}

/* 2. Knowledge base */
function Knowledge({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#e9dcff" />
      <SceneTitle text="Add your brain sheet" />
      <Amaka x={120} y={515} scale={0.72} pose="present" talking={talking} />
      <AppWindow x={420} y={100} w={480} h={340} title="Botpress · Knowledge base">
        <text x="30" y="46" fontSize="20" fontWeight={800} fill="#0a1a33" fontFamily="var(--font-heading)">
          Knowledge base
        </text>
        <rect x="30" y="66" width="420" height="200" rx="14" fill="#f7f9fc" stroke="#1563d6" strokeDasharray="10 8" strokeWidth="2.5" />
        {step === 0 && (
          <text x="240" y="174" fontSize="16" fontWeight={700} fill="#44546a" textAnchor="middle">
            Paste text or upload a document
          </text>
        )}
        <Appear show={step >= 1} from="pop">
          <g transform="translate(60 96)">
            <rect width="360" height="64" rx="12" fill="#fff" stroke="#e1e6ee" />
            <text x="16" y="40" fontSize="26">
              📄
            </text>
            <text x="56" y="30" fontSize="16" fontWeight={800} fill="#0a1a33">
              brain-sheet.docx
            </text>
            <text x="56" y="50" fontSize="13" fontWeight={700} fill="#16a34a">
              Ready ✓
            </text>
          </g>
        </Appear>
      </AppWindow>
      <Appear show={step === 0} from="left">
        <Sheet x={230} y={150} w={200} title="🧠 Brain sheet" lines={["Prices", "Delivery", "Policies"]} scale={0.9} />
      </Appear>
      <Appear show={step >= 1} from="pop" delay={500}>
        <Chip x={460} y={460} icon="📖" text="Now it knows your shop" width={260} tone="#16a34a" />
      </Appear>
    </g>
  );
}

/* 3. Welcome message */
function Welcome({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#d5ede2" />
      <SceneTitle text="A clear welcome message" />
      <Chidi x={140} y={515} scale={0.78} pose="present" talking={talking} />
      <Phone x={360} y={110} scale={1.15} title="Amaka's Styles">
        <Msg y={10} text={["Hi"]} />
        <Msg y={46} text={["Hi! 👋 I'm Amaka's Styles'", "AI assistant. Ask me about", "prices, sizes or delivery.", "Type HUMAN to talk to", "a person."]} me width={140} show={step >= 0} delay={800} />
      </Phone>
      <Appear show={step >= 1} from="pop">
        <Chip x={600} y={170} icon="🤖" text="Says it's an AI" width={200} tone="#16a34a" />
      </Appear>
      <Appear show={step >= 1} from="pop" delay={400}>
        <Chip x={600} y={240} icon="💡" text="Says what it can help with" width={300} tone="#16a34a" />
      </Appear>
      <Appear show={step >= 1} from="pop" delay={800}>
        <Chip x={600} y={310} icon="🙋🏾‍♀️" text="Shows how to reach you" width={270} tone="#16a34a" />
      </Appear>
    </g>
  );
}

/* 4. Talk to a person */
function Handover({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#f6ead2" />
      <SceneTitle text="Talk to a person" />
      <Tolu x={110} y={515} scale={0.68} pose="hold" mood="thinking" />
      <Phone x={210} y={110} scale={1.1} title="Amaka's Styles">
        <Msg y={10} text={["Can I get a discount", "if I buy three?"]} />
        <Msg y={56} text={["Good question! 🙏🏾 Amaka", "will reply to you herself", "very soon."]} me width={136} show={step >= 0} delay={900} />
        <Msg y={116} text={["HUMAN"]} show={step >= 1} />
      </Phone>
      <Appear show={step >= 1} from="pop">
        <g transform="translate(445 240)">
          <path d="M0 0 L80 0" stroke="#1563d6" strokeWidth="5" strokeDasharray="10 8" strokeLinecap="round" />
          <path d="M72 -10 L90 0 L72 10z" fill="#1563d6" />
        </g>
      </Appear>
      <Appear show={step >= 1} from="up">
        <Phone x={560} y={110} scale={1.1} title="Amaka (owner)" header="#0a1a33">
          <g transform="translate(6 10)">
            <rect width="138" height="84" rx="10" fill="#fff4d6" />
            <text x="10" y="22" fontSize="11" fontWeight={800} fill="#b45309">
              🔔 A customer needs you
            </text>
            <text x="10" y="44" fontSize="10.5" fill="#0a1a33">
              Asked for a discount
            </text>
            <text x="10" y="64" fontSize="10.5" fill="#0a1a33">
              on 3 gowns
            </text>
          </g>
        </Phone>
      </Appear>
      <Appear show={step >= 2} from="up">
        <Amaka x={840} y={515} scale={0.62} pose="hold" talking={talking} />
      </Appear>
      <Appear show={step >= 2} from="pop">
        <Chip x={540} y={470} icon="✋🏾" text="Complaints · refunds · discounts" width={340} />
      </Appear>
    </g>
  );
}

/* 5. Test and publish */
function Publish({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#d4e3f7" />
      <SceneTitle text="Test, then publish" />
      <Chidi x={120} y={515} scale={0.72} pose={step >= 1 ? "cheer" : "point"} talking={talking} />
      <Phone x={250} y={110} scale={1.1} title="Test chat" header="#1563d6">
        <Msg y={8} text={["Una dey open Sunday?"]} />
        <Msg y={44} text={["We no dey open Sunday o 🙏🏾", "Monday to Saturday,", "9am to 7pm."]} me width={136} delay={800} />
      </Phone>
      <AppWindow x={500} y={150} w={400} h={220} title="Botpress">
        <text x="30" y="50" fontSize="18" fontWeight={800} fill="#0a1a33">
          Amaka&apos;s Styles Assistant
        </text>
        <Button x={30} y={80} w={180} text={step >= 1 ? "Published" : "Publish"} tone={step >= 1 ? "#16a34a" : "#1563d6"} pressed={step >= 1} />
      </AppWindow>
      <Appear show={step >= 1} from="pop">
        <g className="ac-float">
          <Robot x={820} y={130} scale={0.42} wave />
        </g>
      </Appear>
      <Appear show={step >= 1} from="pop" delay={500}>
        <Chip x={520} y={400} icon="🎉" text="Live on WhatsApp or Instagram" width={330} tone="#16a34a" />
      </Appear>
    </g>
  );
}

/* 6. Your practice */
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
            ["Add your instructions and brain sheet", 0],
            ["Write your welcome message", 0],
            ["Set up 'talk to a person'", 0],
            ["Ask your 10 questions and fix answers", 0],
          ]}
          size={17}
        />
      </Card>
      <NextLesson show={step >= 1} text="Next: Lesson 5 · Orders and payments" />
    </g>
  );
}

export const aiAgentsLesson4: AnimatedLesson = {
  id: "ai-agents-without-code/4",
  title: "Build the assistant",
  scenes: [
    {
      heading: "Give it instructions",
      Scene: Instructions,
      tryIt: "Write short instructions for my customer service AI assistant. My business: [name, what you sell]. It must only answer from my brain sheet, never invent prices, reply in English or Pidgin, and hand complaints, refunds and discounts to me.",
      steps: [
        { say: "Open your bot and find the instructions. Tell it who it is, and paste your rules: only answer from the knowledge base, and never invent prices." },
        { say: "Add your tone too: reply in English or Pidgin, like the customer, in two or three short lines." },
      ],
    },
    {
      heading: "Add your brain sheet",
      Scene: Knowledge,
      steps: [
        { say: "Next, open the knowledge base. This is where your brain sheet goes." },
        { say: "Paste the text, or upload the document. Now your bot knows your shop, your prices and your delivery fees." },
      ],
    },
    {
      heading: "A clear welcome message",
      Scene: Welcome,
      steps: [
        { say: "Write a welcome message for the first time a customer says hello." },
        { say: "It says it is an AI assistant, what it can help with, and how to reach a real person: just type HUMAN." },
      ],
    },
    {
      heading: "Talk to a person",
      Scene: Handover,
      steps: [
        { say: "Some messages must go to you. When a customer asks for a discount, the assistant says Amaka will reply herself." },
        { say: "When a customer types HUMAN, the assistant stops, and you get an alert on your own phone." },
        { say: "Do the same for complaints, refunds and discounts. You stay in control." },
      ],
    },
    {
      heading: "Test, then publish",
      Scene: Publish,
      steps: [
        { say: "Test everything in the test chat. Ask your ten questions, and try Pidgin too." },
        { say: "When the answers are right, click publish. Your assistant is now live!" },
      ],
    },
    {
      heading: "Your practice",
      Scene: Practise,
      steps: [
        { say: "This week, add your instructions and brain sheet, write your welcome message, set up talk to a person, and test your ten questions." },
        { say: "In lesson five, your assistant will take orders and payments. See you there!" },
      ],
    },
  ],
};
