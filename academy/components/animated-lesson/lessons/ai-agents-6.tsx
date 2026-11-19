"use client";

import { Amaka, Appear, Chidi, Chip, Emeka, Kemi, Phone, SceneTitle, Studio, Tolu } from "../cartoon";
import type { AnimatedLesson, SceneProps } from "../types";
import { Card, Checklist, Msg, Post } from "./shared";
import { Robot, Sheet } from "./agents-shared";

/*
 * How to Build AI Agents Without Code, Lesson 6: Test, launch and improve.
 * Amaka's friends test the assistant, she launches it, improves it every week and keeps customer data safe.
 */

/* 1. Test with friends */
function Friends({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#d5ede2" />
      <SceneTitle text="Test with three friends" />
      <Amaka x={130} y={515} scale={0.72} pose="present" talking={talking} />
      <Tolu x={330} y={515} scale={0.62} pose="hold" />
      <Kemi x={480} y={515} scale={0.62} pose="hold" />
      <Emeka x={630} y={515} scale={0.62} pose="hold" />
      {(
        [
          ["🛒", "A normal order", 0],
          ["🤔", "A tricky question", 1],
          ["📣", "A complaint", 1],
          ["🗣️", "Pidgin", 1],
        ] as [string, string, number][]
      ).map(([icon, text, at], i) => (
        <Appear key={text} show={step >= at} from="right" delay={(i % 3) * 350}>
          <Chip x={720} y={110 + i * 64} icon={icon} text={text} width={210} />
        </Appear>
      ))}
    </g>
  );
}

/* 2. Launch */
function Launch({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#e9dcff" />
      <SceneTitle text="Launch: tell your customers" />
      <Chidi x={120} y={515} scale={0.72} pose="point" talking={talking} />
      <Post
        x={260}
        y={90}
        scale={0.95}
        lines={
          <g>
            <text x="16" y="256" fontSize="15" fontWeight={700} fill="#0a1a33">
              New! Ask us anything, any time 🤖
            </text>
            <text x="16" y="282" fontSize="14" fill="#44546a">
              Prices, sizes and delivery,
            </text>
            <text x="16" y="302" fontSize="14" fill="#44546a">
              answered day and night.
            </text>
            <rect x="16" y="324" width="268" height="44" rx="12" fill="#25b763" />
            <text x="150" y="352" fontSize="16" fontWeight={800} fill="#fff" textAnchor="middle">
              Chat with us on WhatsApp
            </text>
          </g>
        }
      >
        <g className="ac-float">
          <Robot x={150} y={160} scale={0.6} wave />
        </g>
      </Post>
      <Appear show={step >= 0} from="pop" delay={700}>
        <Chip x={600} y={150} icon="📱" text="In your bio" width={190} />
      </Appear>
      <Appear show={step >= 0} from="pop" delay={1100}>
        <Chip x={600} y={220} icon="📝" text="On your posts" width={200} />
      </Appear>
      <Appear show={step >= 0} from="pop" delay={1500}>
        <Chip x={600} y={290} icon="🧾" text="On flyers and receipts" width={260} />
      </Appear>
    </g>
  );
}

/* 3. Improve every week */
function Improve({ step, talking }: SceneProps) {
  const bars = [9, 6, 3, 1];
  return (
    <g>
      <Studio tone="#d4e3f7" />
      <SceneTitle text="Improve it every week" />
      <Amaka x={130} y={515} scale={0.72} pose="point" talking={talking} />
      <Phone x={250} y={110} scale={1.05} title="Chats this week">
        <Msg y={8} text={["Do you sew to measure?"]} />
        <Msg y={44} text={["A person will reply", "to you soon 🙏🏾"]} me width={120} />
        <Appear show={step >= 0} from="pop" delay={900}>
          <g transform="translate(136 20)">
            <circle r="13" fill="#f2b134" />
            <text y="5" fontSize="15" fontWeight={800} textAnchor="middle" fill="#0a1a33">
              !
            </text>
          </g>
        </Appear>
      </Phone>
      <Appear show={step >= 0} from="right" delay={1200}>
        <Sheet x={470} y={110} w={220} title="🧠 Brain sheet" lines={["Prices", "Delivery", "+ Sewing to measure:", "  yes, 7 days"]} scale={0.9} />
      </Appear>
      <Appear show={step >= 1} from="up">
        <g transform="translate(720 140)">
          <rect width="200" height="260" rx="18" fill="#fff" />
          <text x="16" y="32" fontSize="14" fontWeight={800} fill="#0a1a33">
            Unanswered questions
          </text>
          {bars.map((h, i) => (
            <g key={i}>
              <rect x={24 + i * 42} y={226 - h * 18} width="28" height={h * 18} rx="6" fill="#1563d6" opacity={1 - i * 0.18} />
              <text x={38 + i * 42} y="248" fontSize="12" fontWeight={700} fill="#44546a" textAnchor="middle">
                W{i + 1}
              </text>
            </g>
          ))}
        </g>
      </Appear>
    </g>
  );
}

/* 4. Keep customer data safe */
function Safe({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#f6ead2" />
      <SceneTitle text="Keep customer data safe (NDPA)" />
      <Chidi x={150} y={515} scale={0.78} pose="present" talking={talking} />
      <g transform="translate(400 280)">
        <path d="M0 -150 L110 -110 L110 0 Q110 100 0 150 Q-110 100 -110 0 L-110 -110Z" fill="#1563d6" />
        <path d="M0 -122 L86 -90 L86 0 Q86 80 0 120 Q-86 80 -86 0 L-86 -90Z" fill="#fff" opacity="0.18" />
        <text y="22" fontSize="70" textAnchor="middle">
          🔒
        </text>
      </g>
      {(
        [
          ["🤖", "Say it's an AI assistant", 0],
          ["💳", "Never ask for card numbers", 1],
          ["🔑", "Never ask for passwords", 1],
          ["📦", "Keep only what the order needs", 1],
        ] as [string, string, number][]
      ).map(([icon, text, at], i) => (
        <Appear key={text} show={step >= at} from="right" delay={(i % 3) * 350}>
          <Chip x={560} y={120 + i * 70} icon={icon} text={text} width={350} tone="#16a34a" />
        </Appear>
      ))}
    </g>
  );
}

/* 5. Final project */
function FinalProject({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#d4e3f7" />
      <SceneTitle text="Your final project" />
      <Amaka x={180} y={510} pose="present" talking={talking} />
      <Card x={360} y={100} w={550} h={300} title="🏁 Hand in">
        <Checklist
          x={24}
          y={74}
          step={step}
          gap={64}
          items={[
            ["Your live assistant: number or handle", 0],
            ["Screenshots of 5 test chats", 0],
            ["Your brain sheet", 0],
          ]}
          size={18}
        />
      </Card>
    </g>
  );
}

/* 6. Well done */
function WellDone({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#d5ede2" />
      <SceneTitle text="Well done!" />
      <Amaka x={200} y={510} pose="cheer" mood="excited" talking={talking} />
      <Chidi x={380} y={515} scale={0.85} pose="cheer" mood="excited" />
      <g className="ac-float">
        <Robot x={560} y={330} scale={0.75} wave />
      </g>
      <Appear show from="pop" delay={500}>
        <g transform="translate(660 120) rotate(4)">
          <rect x="4" y="8" width="250" height="180" rx="14" fill="#0a1a33" opacity="0.15" />
          <rect width="250" height="180" rx="14" fill="#fff" stroke="#f2b134" strokeWidth="6" />
          <text x="125" y="54" fontSize="15" fontWeight={800} fill="#1563d6" textAnchor="middle" letterSpacing="2">
            CERTIFICATE
          </text>
          <text x="125" y="88" fontSize="14" fill="#44546a" textAnchor="middle">
            AI Agents Without Code
          </text>
          <circle cx="125" cy="134" r="24" fill="#f2b134" />
          <text x="125" y="142" fontSize="22" textAnchor="middle">
            ⭐
          </text>
        </g>
      </Appear>
      <Appear show={step >= 1} from="pop">
        <g transform="translate(600 360)">
          <rect width="320" height="74" rx="18" fill="#fff" />
          <image href="/academy/brand/jtr-emblem.png" x="12" y="13" width="48" height="48" />
          <text x="72" y="33" fontSize="15" fontWeight={800} fill="#0a1a33">
            Want a full sales agent?
          </text>
          <text x="72" y="55" fontSize="13" fill="#44546a">
            JTR builds them for businesses
          </text>
        </g>
      </Appear>
    </g>
  );
}

export const aiAgentsLesson6: AnimatedLesson = {
  id: "ai-agents-without-code/6",
  title: "Test, launch and improve",
  scenes: [
    {
      heading: "Test with three friends",
      Scene: Friends,
      steps: [
        { say: "Before you tell your customers, ask three friends to chat with your assistant, as if they were customers. First, a normal order." },
        { say: "Then a tricky question, a complaint, and a message in Pidgin. Watch how the assistant answers each one." },
      ],
    },
    {
      heading: "Launch: tell your customers",
      Scene: Launch,
      steps: [{ say: "Now launch it! Tell your customers they can chat with you any time. Put it in your bio, on your posts, and on your flyers and receipts." }],
    },
    {
      heading: "Improve it every week",
      Scene: Improve,
      tryIt: "Here are some questions my AI assistant could not answer this week: [paste]. Write short, clear answers I can add to my brain sheet.",
      steps: [
        { say: "Once a week, read your chats. When the assistant could not answer a question, add the answer to your brain sheet." },
        { say: "Week by week, fewer questions go unanswered, and your assistant gets better and better." },
      ],
    },
    {
      heading: "Keep customer data safe (NDPA)",
      Scene: Safe,
      steps: [
        { say: "Keep your customers' data safe, as Nigeria's data protection law expects. Always say it is an AI assistant." },
        { say: "Never ask for card numbers or passwords in the chat, and keep only the details you need for the order." },
      ],
    },
    {
      heading: "Your final project",
      Scene: FinalProject,
      steps: [{ say: "For your final project, hand in your live assistant's number or handle, screenshots of five test chats, and your brain sheet." }],
    },
    {
      heading: "Well done!",
      Scene: WellDone,
      steps: [
        { say: "Well done! You have built your own AI assistant without writing any code. Finish your project to get your certificate." },
        { say: "And if you ever want a full sales agent with bookings, orders, payments and reminders, JTR builds them for businesses like yours." },
      ],
    },
  ],
};
