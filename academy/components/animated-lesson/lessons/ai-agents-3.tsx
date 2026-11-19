"use client";

import { Amaka, Appear, Chidi, Chip, Phone, SceneTitle, Studio, Typed } from "../cartoon";
import type { AnimatedLesson, SceneProps } from "../types";
import { Card, Checklist, Msg, PriceTag } from "./shared";
import { AppWindow, Button, ChannelIcon, NextLesson, Robot } from "./agents-shared";

/*
 * How to Build AI Agents Without Code, Lesson 3: Set up your accounts.
 * Chidi sets up Meta, Botpress and the WhatsApp or Instagram connection for Amaka's shop.
 */

/* 1. What you need */
function WhatYouNeed({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#d4e3f7" />
      <SceneTitle text="What you need" />
      <Chidi x={160} y={515} scale={0.8} pose="present" talking={talking} />
      <Card x={330} y={100} w={580} h={330} title="✅ Before you start">
        <Checklist
          x={24}
          y={74}
          step={step}
          gap={62}
          size={17}
          items={[
            ["A Facebook account", 0],
            ["A free Meta Business portfolio", 0],
            ["Instagram: a professional account", 1],
            ["WhatsApp: a spare number (not on the app)", 2],
          ]}
        />
      </Card>
    </g>
  );
}

/* 2. Sign up for Botpress */
function SignUp({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#e9dcff" />
      <SceneTitle text="Sign up for Botpress (free)" />
      <Chidi x={120} y={515} scale={0.72} pose="point" talking={talking} />
      <AppWindow x={250} y={100} w={640} h={360} title="botpress.com">
        <text x="40" y="56" fontSize="26" fontWeight={800} fill="#0a1a33" fontFamily="var(--font-heading)">
          Create a new bot
        </text>
        <text x="40" y="92" fontSize="14" fontWeight={700} fill="#44546a">
          Bot name
        </text>
        <rect x="40" y="102" width="420" height="44" rx="10" fill="#f3f6fa" stroke="#c7d2de" />
        <Typed text="Amaka's Styles Assistant" show={step >= 0} delay={600} x="54" y="130" fontSize="17" fontWeight={600} fill="#0a1a33" />
        <Button x={40} y={170} w={160} text="Create" pressed={step >= 1} />
        <Appear show={step >= 1} from="pop">
          <g transform="translate(40 232)">
            <rect width="560" height="70" rx="14" fill="#e8f6ee" />
            <text x="20" y="30" fontSize="16" fontWeight={800} fill="#0b7a5b">
              Free plan
            </text>
            <text x="20" y="54" fontSize="15" fontWeight={600} fill="#0a1a33">
              Includes a small monthly AI allowance to start and test
            </text>
          </g>
        </Appear>
      </AppWindow>
      <Appear show={step >= 1} from="pop">
        <g className="ac-float">
          <Robot x={840} y={170} scale={0.55} wave />
        </g>
      </Appear>
    </g>
  );
}

/* 3. Connect WhatsApp or Instagram */
function Connect({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#d5ede2" />
      <SceneTitle text="Connect WhatsApp or Instagram" />
      <Amaka x={120} y={515} scale={0.72} pose="present" talking={talking} />
      <AppWindow x={250} y={100} w={640} h={380} title="Botpress · Hub">
        <text x="40" y="52" fontSize="22" fontWeight={800} fill="#0a1a33" fontFamily="var(--font-heading)">
          Integrations
        </text>
        {(["whatsapp", "instagram"] as const).map((kind, i) => (
          <g key={kind} transform={`translate(${40 + i * 290} 76)`}>
            <rect width="270" height="230" rx="16" fill="#f7f9fc" stroke="#e1e6ee" />
            <ChannelIcon x={135} y={64} kind={kind} size={70} />
            <text x="135" y="136" fontSize="20" fontWeight={800} fill="#0a1a33" textAnchor="middle">
              {kind === "whatsapp" ? "WhatsApp" : "Instagram"}
            </text>
            <Button x={55} y={160} w={160} text={(i === 0 ? step >= 1 : false) ? "Connected" : "Install"} tone={i === 0 && step >= 1 ? "#16a34a" : "#1563d6"} />
          </g>
        ))}
      </AppWindow>
      <Appear show={step === 1} from="pop">
        <Chip x={520} y={450} icon="🔗" text="Log in with your Meta account" width={320} />
      </Appear>
      <Appear show={step >= 2} from="pop">
        <Chip x={480} y={450} icon="✅" text="Your bot can now receive messages" width={360} tone="#16a34a" />
      </Appear>
    </g>
  );
}

/* 4. Test chat */
function TestChat({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#d4e3f7" />
      <SceneTitle text="Try it in the test chat" />
      <Chidi x={150} y={515} scale={0.78} pose="point" talking={talking} />
      <Phone x={380} y={110} scale={1.15} title="Test chat" header="#1563d6">
        <Msg y={10} text={["Hello"]} />
        <Msg y={46} text={["Hi! 👋 I'm a new bot.", "I don't know your shop yet."]} me width={136} show={step >= 0} delay={800} />
      </Phone>
      <Appear show={step >= 1} from="pop">
        <Chip x={620} y={220} icon="🧠" text="Next lesson: give it" width={260} />
      </Appear>
      <Appear show={step >= 1} from="pop" delay={400}>
        <Chip x={620} y={280} icon="📄" text="your brain sheet" width={220} />
      </Appear>
    </g>
  );
}

/* 5. ManyChat: easier, but paid */
function ManyChat({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#f6ead2" />
      <SceneTitle text="Prefer easier? ManyChat (paid)" />
      <Amaka x={150} y={515} scale={0.8} pose="present" talking={talking} />
      <Card x={320} y={100} w={590} h={320} title="ManyChat">
        <g transform="translate(24 76)">
          <Chip x={0} y={0} icon="👍🏾" text="Fewer steps to set up" width={290} tone="#16a34a" />
          <Chip x={0} y={64} icon="📸" text="Instagram on the free plan" width={300} />
          <Appear show={step >= 1} from="left">
            <Chip x={0} y={128} icon="🤖" text="AI and WhatsApp need Pro" width={300} tone="#e4572e" />
          </Appear>
        </g>
        <Appear show={step >= 1} from="pop" delay={400}>
          <PriceTag x={360} y={150} text="~$39/month" />
        </Appear>
      </Card>
      <Appear show={step >= 2} from="up">
        <g transform="translate(370 440)">
          <rect width="490" height="52" rx="26" fill="#0a1a33" />
          <text x="245" y="33" fontSize="18" fontWeight={700} fill="#ffd45c" textAnchor="middle">
            This course uses Botpress: free to start
          </text>
        </g>
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
      <Chidi x={190} y={510} pose={step >= 1 ? "wave" : "present"} talking={talking} />
      <Card x={370} y={100} w={540} h={300} title="📝 This week">
        <Checklist
          x={24}
          y={70}
          step={step}
          items={[
            ["Create your Meta Business portfolio", 0],
            ["Sign up for Botpress and create a bot", 0],
            ["Connect WhatsApp or Instagram", 0],
            ["Screenshot the connected channel", 0],
          ]}
          size={17}
        />
      </Card>
      <NextLesson show={step >= 1} text="Next: Lesson 4 · Build the assistant" />
    </g>
  );
}

export const aiAgentsLesson3: AnimatedLesson = {
  id: "ai-agents-without-code/3",
  title: "Set up your accounts",
  scenes: [
    {
      heading: "What you need",
      Scene: WhatYouNeed,
      steps: [
        { say: "Before you start, you need a Facebook account and a free Meta Business portfolio, at business dot facebook dot com." },
        { say: "For Instagram, switch your account to a professional account." },
        { say: "For WhatsApp, you need a spare phone number that is not already on the WhatsApp app. A spare SIM is best." },
      ],
    },
    {
      heading: "Sign up for Botpress (free)",
      Scene: SignUp,
      steps: [
        { say: "Now go to botpress dot com and sign up for free. Create a new bot, and give it your shop's name." },
        { say: "The free plan includes a small AI allowance every month, which is enough to build and test your assistant." },
      ],
    },
    {
      heading: "Connect WhatsApp or Instagram",
      Scene: Connect,
      steps: [
        { say: "Open the Hub, where you find the integrations. Choose WhatsApp or Instagram, and click install." },
        { say: "Botpress walks you through logging in with your Meta account and giving it access." },
        { say: "Once it says connected, your bot can receive your customers' messages." },
      ],
    },
    {
      heading: "Try it in the test chat",
      Scene: TestChat,
      steps: [
        { say: "Botpress has a test chat, so you can talk to your bot before customers do. Right now, it doesn't know anything about your shop." },
        { say: "In the next lesson, we give it your brain sheet." },
      ],
    },
    {
      heading: "Prefer easier? ManyChat (paid)",
      Scene: ManyChat,
      steps: [
        { say: "If you would rather pay for fewer steps, ManyChat is another option. Instagram works on its free plan." },
        { say: "But the AI features and WhatsApp need the Pro plan, which costs about thirty-nine dollars a month." },
        { say: "In this course we use Botpress, because it is free to start." },
      ],
    },
    {
      heading: "Your practice",
      Scene: Practise,
      steps: [
        { say: "This week, create your Meta Business portfolio, sign up for Botpress, connect WhatsApp or Instagram, and take a screenshot when it says connected." },
        { say: "In lesson four, we will build your assistant. See you there!" },
      ],
    },
  ],
};
