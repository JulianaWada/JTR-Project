"use client";

import { Amaka, Appear, Boutique, Chidi, Chip, Phone, SceneTitle, Studio, Tolu } from "../cartoon";
import type { AnimatedLesson, SceneProps } from "../types";
import { Card, Checklist, Msg } from "./shared";
import { ChannelIcon, NextLesson, Robot } from "./agents-shared";

/*
 * How to Build AI Agents Without Code, Lesson 1: What an AI agent can do for your business.
 * Amaka's boutique gets more messages than she can answer; Chidi shows her what an AI agent does.
 */

/* 1. Too many messages */
function TooMany({ step, talking }: SceneProps) {
  return (
    <g>
      <Boutique dim={step >= 1} />
      {step >= 1 && <rect width="960" height="540" fill="#14254a" opacity="0.55" />}
      <SceneTitle text="Too many messages" />
      <Amaka x={210} y={505} pose="hold" mood={step >= 1 ? "thinking" : "happy"} talking={talking} />
      <Phone x={380} y={110} scale={1.1} title="Amaka's Styles">
        <Msg y={8} text={["How much is the red gown?"]} />
        <Msg y={44} text={["Do you deliver to Ikeja?"]} delay={400} />
        <Msg y={80} text={["Size 16 available?"]} delay={800} />
        <Msg y={116} text={["Abeg, how much?"]} delay={1200} />
        <Msg y={152} text={["Are you open Sunday?"]} delay={1600} />
        <Msg y={188} text={["Hello?? 👋"]} show={step >= 1} />
      </Phone>
      <Appear show from="pop" delay={600}>
        <g transform="translate(560 130)">
          <circle r="30" fill="#e4572e" />
          <text y="9" fontSize="24" fontWeight={800} fill="#fff" textAnchor="middle">
            47
          </text>
        </g>
      </Appear>
      <Appear show={step >= 1} from="pop">
        <Chip x={600} y={260} icon="🌙" text="11:48 PM" width={170} />
      </Appear>
      <Appear show={step >= 1} from="pop" delay={500}>
        <Chip x={600} y={330} icon="⏳" text="Customers are waiting" width={280} />
      </Appear>
    </g>
  );
}

/* 2. Auto-reply or AI agent? */
function AutoVsAgent({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#d4e3f7" />
      <SceneTitle text="Auto-reply or AI agent?" />
      <Chidi x={110} y={515} scale={0.7} pose="present" talking={talking} />
      <g>
        <text x="330" y="118" fontSize="18" fontWeight={800} fill="#44546a" textAnchor="middle">
          Auto-reply
        </text>
        <Phone x={245} y={130} scale={1} title="Shop">
          <Msg y={8} text={["Do you deliver to Ikeja?"]} />
          <Msg y={44} text={["Thanks for your message.", "We'll get back to you."]} me width={130} />
          <Msg y={96} text={["Size 16 available?"]} show={step >= 0} delay={900} />
          <Msg y={132} text={["Thanks for your message.", "We'll get back to you."]} me width={130} delay={1500} />
        </Phone>
      </g>
      <Appear show={step >= 1} from="right">
        <g>
          <text x="610" y="118" fontSize="18" fontWeight={800} fill="#1563d6" textAnchor="middle">
            AI agent
          </text>
          <Phone x={525} y={130} scale={1} title="Amaka's Styles">
            <Msg y={8} text={["Do you deliver to Ikeja?"]} />
            <Msg y={44} text={["Yes! Ikeja is ₦2,500,", "delivered tomorrow 🚚"]} me width={130} delay={600} />
            <Msg y={96} text={["Size 16 available?"]} delay={1300} />
            <Msg y={132} text={["Yes, the red gown comes", "in size 16, ₦18,500 💃"]} me width={130} delay={1900} />
          </Phone>
        </g>
      </Appear>
      <Appear show={step >= 2} from="pop">
        <g className="ac-float">
          <Robot x={830} y={300} scale={0.8} />
        </g>
      </Appear>
      <Appear show={step >= 2} from="pop" delay={500}>
        <Chip x={670} y={430} icon="📖" text="Answers from your details" width={270} />
      </Appear>
    </g>
  );
}

/* 3. What JTR's agent does */
const JOBS: [string, string][] = [
  ["💬", "Answers questions"],
  ["🛒", "Takes orders and bookings"],
  ["💳", "Sends a payment link"],
  ["⏰", "Reminds customers"],
  ["🙋🏾‍♀️", "Hands over to a person"],
];

function JtrAgent({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#d5ede2" />
      <SceneTitle text="What JTR's WhatsApp agent does" />
      <Chidi x={130} y={515} scale={0.75} pose="point" talking={talking} />
      <g className="ac-float">
        <Robot x={360} y={280} scale={1.1} tone="#0b7a5b" wave={step === 0} />
      </g>
      {JOBS.map(([icon, text], i) => (
        <Appear key={text} show={step >= (i < 3 ? 0 : 1)} from="right" delay={(i % 3) * 450}>
          <Chip x={540} y={110 + i * 70} icon={icon} text={text} width={330} tone="#0b7a5b" />
        </Appear>
      ))}
      <Appear show={step >= 2} from="up">
        <g transform="translate(470 470)">
          <rect width="440" height="48" rx="24" fill="#0a1a33" />
          <text x="220" y="31" fontSize="17" fontWeight={700} fill="#ffd45c" textAnchor="middle">
            You build a simpler one in this course
          </text>
        </g>
      </Appear>
    </g>
  );
}

/* 4. What an agent should not do */
function ShouldNot({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#f6ead2" />
      <SceneTitle text="What your agent should not do" />
      <Amaka x={170} y={510} scale={0.85} pose="present" talking={talking} />
      <Card x={340} y={100} w={570} h={330} title="🚦 Rules for your agent">
        <g transform="translate(24 80)">
          {(
            [
              ["🚫", "Make up prices, stock or promises", 0],
              ["🙋🏾‍♀️", "Complaints, refunds, discounts go to you", 1],
              ["🤖", "Always says it is an AI assistant", 2],
            ] as [string, string, number][]
          ).map(([icon, text, at], i) => (
            <Appear key={text} show={step >= at} from="left">
              <g transform={`translate(0 ${i * 74})`}>
                <rect width="520" height="58" rx="16" fill={at === 0 ? "#fff1ec" : "#eef4ff"} />
                <text x="18" y="38" fontSize="24">
                  {icon}
                </text>
                <text x="62" y="37" fontSize="19" fontWeight={700} fill="#0a1a33">
                  {text}
                </text>
              </g>
            </Appear>
          ))}
        </g>
      </Card>
    </g>
  );
}

/* 5. WhatsApp or Instagram? */
function WhichChannel({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#e9dcff" />
      <SceneTitle text="WhatsApp or Instagram?" />
      <Tolu x={150} y={515} scale={0.8} pose="hold" mood={step >= 1 ? "excited" : "happy"} talking={talking} />
      <Card x={300} y={110} w={290} h={300}>
        <ChannelIcon x={145} y={90} kind="whatsapp" />
        <text x="145" y="175" fontSize="24" fontWeight={800} fill="#0a1a33" textAnchor="middle">
          WhatsApp
        </text>
        <text x="145" y="210" fontSize="15" fill="#44546a" textAnchor="middle">
          Needs a number that is not
        </text>
        <text x="145" y="232" fontSize="15" fill="#44546a" textAnchor="middle">
          already on the WhatsApp app
        </text>
      </Card>
      <Card x={620} y={110} w={290} h={300}>
        <ChannelIcon x={145} y={90} kind="instagram" />
        <text x="145" y="175" fontSize="24" fontWeight={800} fill="#0a1a33" textAnchor="middle">
          Instagram
        </text>
        <text x="145" y="210" fontSize="15" fill="#44546a" textAnchor="middle">
          Needs a professional
        </text>
        <text x="145" y="232" fontSize="15" fill="#44546a" textAnchor="middle">
          (business) account
        </text>
      </Card>
      <Appear show={step >= 1} from="up">
        <g transform="translate(360 440)">
          <rect width="500" height="52" rx="26" fill="#0a1a33" />
          <text x="250" y="33" fontSize="18" fontWeight={700} fill="#ffd45c" textAnchor="middle">
            Start where your customers already message you
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
            ["List the 10 questions customers ask most", 0],
            ["Write your answer to each one", 0],
            ["Choose WhatsApp or Instagram", 0],
          ]}
          size={17}
        />
      </Card>
      <NextLesson show={step >= 1} text="Next: Lesson 2 · Your brain sheet" />
    </g>
  );
}

export const aiAgentsLesson1: AnimatedLesson = {
  id: "ai-agents-without-code/1",
  title: "What an AI agent can do for your business",
  scenes: [
    {
      heading: "Too many messages",
      Scene: TooMany,
      steps: [
        { say: "Meet Amaka. Her boutique is doing well, and her phone never stops. How much? Do you deliver? Is size sixteen available?" },
        { say: "At night, while Amaka sleeps, customers are still asking. When nobody answers, many of them buy somewhere else." },
      ],
    },
    {
      heading: "Auto-reply or AI agent?",
      Scene: AutoVsAgent,
      steps: [
        { say: "An auto-reply sends the same message to everyone. Thanks, we'll get back to you. It doesn't answer anything." },
        { say: "An AI agent reads the question and answers it, like a trained sales assistant." },
        { say: "It answers only from your own business details: your prices, your sizes, your delivery fees." },
      ],
    },
    {
      heading: "What JTR's WhatsApp agent does",
      Scene: JtrAgent,
      steps: [
        { say: "At JTR, we built a WhatsApp sales agent for small businesses. It answers questions, takes orders and bookings, and sends a payment link." },
        { say: "It reminds customers about their bookings, and when a customer needs a real person, it hands the chat over." },
        { say: "In this course, you will build a simpler version yourself, without writing any code." },
      ],
    },
    {
      heading: "What your agent should not do",
      Scene: ShouldNot,
      steps: [
        { say: "A good agent never makes up prices, stock or promises." },
        { say: "Complaints, refunds and discounts always go to you, the owner." },
        { say: "And it always tells customers they are chatting with an AI assistant." },
      ],
    },
    {
      heading: "WhatsApp or Instagram?",
      Scene: WhichChannel,
      steps: [
        { say: "You can build your assistant for WhatsApp or for Instagram. For WhatsApp, you need a phone number that is not already on the WhatsApp app. For Instagram, you need a professional account." },
        { say: "Start where most of your customers already message you." },
      ],
    },
    {
      heading: "Your practice",
      Scene: Practise,
      tryIt: "I run a [type of business] in [city]. List the 10 questions my customers are most likely to ask on WhatsApp or Instagram.",
      steps: [
        { say: "This week, list the ten questions your customers ask most, write your answer to each one, and choose WhatsApp or Instagram." },
        { say: "In lesson two, we will turn your answers into your assistant's brain sheet. See you there!" },
      ],
    },
  ],
};
