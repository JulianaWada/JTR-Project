"use client";

import { Amaka, Appear, Chidi, Chip, Emeka, Phone, SceneTitle, Studio, Tolu, Typed } from "../cartoon";
import type { AnimatedLesson, SceneProps } from "../types";
import { Card, Checklist, Msg } from "./shared";
import { AppWindow, NextLesson } from "./agents-shared";

/*
 * How to Build AI Agents Without Code, Lesson 5: Take orders and payments.
 * Amaka's assistant takes Tolu's order, sends a Paystack payment link, and Amaka checks the payment before Emeka delivers.
 */

/* 1. One question at a time */
function TakeOrder({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#d5ede2" />
      <SceneTitle text="One question at a time" />
      <Tolu x={150} y={515} scale={0.8} pose="hold" mood="happy" />
      <Phone x={310} y={100} scale={1.15} title="Amaka's Styles">
        <Msg y={6} text={["I want the red gown"]} />
        <Msg y={40} text={["Lovely choice! 💃🏾 What size?"]} me width={136} delay={700} />
        <Msg y={74} text={["Size 14"]} show={step >= 1} />
        <Msg y={106} text={["Delivery or pickup?"]} me width={110} show={step >= 1} delay={700} />
        <Msg y={140} text={["Delivery, Lekki Phase 1"]} show={step >= 2} />
        <Msg y={174} text={["And your name, please?"]} me width={124} show={step >= 2} delay={700} />
        <Msg y={208} text={["Tolu"]} show={step >= 2} delay={1400} />
      </Phone>
      <g transform="translate(600 140)">
        {(
          [
            ["👗", "Item", 0],
            ["📏", "Size or quantity", 1],
            ["🚚", "Delivery or pickup", 1],
            ["📍", "Area", 2],
            ["🙋🏾‍♀️", "Name", 2],
          ] as [string, string, number][]
        ).map(([icon, text, at], i) => (
          <Appear key={text} show={step >= at} from="right" delay={(i % 2) * 300}>
            <Chip x={0} y={i * 60} icon={icon} text={text} width={250} tone="#0b7a5b" />
          </Appear>
        ))}
      </g>
      <Appear show={step >= 0} from="up" delay={300}>
        <Chidi x={865} y={515} scale={0.5} pose="point" talking={talking} />
      </Appear>
    </g>
  );
}

/* 2. Repeat the order */
function Summary({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#d4e3f7" />
      <SceneTitle text="Repeat the order with the total" />
      <Amaka x={150} y={515} scale={0.8} pose="present" talking={talking} />
      <Phone x={330} y={110} scale={1.15} title="Amaka's Styles">
        <g transform="translate(6 10)">
          <rect width="138" height="150" rx="10" fill="#dcf8c6" />
          <text x="10" y="22" fontSize="11" fontWeight={800} fill="#0a1a33">
            Your order, Tolu 🧾
          </text>
          {["Red gown, size 14", "₦18,500", "Delivery to Lekki", "₦2,500"].map((t, i) => (
            <text key={t} x="10" y={44 + i * 18} fontSize="10.5" fill="#0a1a33" fontWeight={i % 2 ? 700 : 400}>
              {t}
            </text>
          ))}
          <rect x="10" y="114" width="118" height="1.5" fill="#0a1a33" opacity="0.3" />
          <text x="10" y="136" fontSize="12" fontWeight={800} fill="#0b7a5b">
            Total: ₦21,000
          </text>
        </g>
        <Msg y={170} text={["Correct! 👍🏾"]} show={step >= 1} />
      </Phone>
      <Appear show={step >= 1} from="pop">
        <Chip x={590} y={230} icon="✅" text="Customer confirms" width={240} tone="#16a34a" />
      </Appear>
    </g>
  );
}

/* 3. A Paystack payment page */
function PaymentPage({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#e9dcff" />
      <SceneTitle text="A payment link, no code" />
      <Chidi x={120} y={515} scale={0.72} pose="point" talking={talking} />
      <AppWindow x={250} y={100} w={640} h={350} title="dashboard.paystack.com · Payment Pages" tone="#0ba4db">
        <text x="30" y="50" fontSize="22" fontWeight={800} fill="#0a1a33" fontFamily="var(--font-heading)">
          New payment page
        </text>
        <text x="30" y="86" fontSize="14" fontWeight={700} fill="#44546a">
          Page name
        </text>
        <rect x="30" y="96" width="380" height="40" rx="10" fill="#f3f6fa" stroke="#c7d2de" />
        <Typed text="Amaka's Styles: pay for your order" show delay={500} x="44" y="122" fontSize="15" fontWeight={600} fill="#0a1a33" />
        <text x="30" y="166" fontSize="14" fontWeight={700} fill="#44546a">
          Amount
        </text>
        <rect x="30" y="176" width="220" height="40" rx="10" fill="#f3f6fa" stroke="#c7d2de" />
        <text x="44" y="202" fontSize="15" fontWeight={600} fill="#0a1a33">
          Customer enters amount
        </text>
        <Appear show={step >= 1} from="pop">
          <g transform="translate(30 236)">
            <rect width="560" height="54" rx="12" fill="#e6f7fd" />
            <text x="18" y="34" fontSize="17" fontWeight={800} fill="#0b7fae">
              🔗 paystack.com/pay/amakas-styles
            </text>
          </g>
        </Appear>
      </AppWindow>
      <Appear show={step >= 1} from="pop" delay={500}>
        <Chip x={560} y={466} icon="🧠" text="Add the link to your brain sheet" width={340} />
      </Appear>
    </g>
  );
}

/* 4. Send the link */
function SendLink({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#d5ede2" />
      <SceneTitle text="Send the link, get paid" />
      <Tolu x={150} y={515} scale={0.8} pose="hold" mood={step >= 1 ? "excited" : "happy"} />
      <Phone x={320} y={110} scale={1.15} title="Amaka's Styles">
        <Msg y={10} text={["Great! Pay ₦21,000 here", "and we deliver tomorrow:"]} me width={136} />
        <Appear show from="pop" delay={700}>
          <g transform="translate(30 62)">
            <rect width="114" height="40" rx="10" fill="#0ba4db" />
            <text x="57" y="25" fontSize="12" fontWeight={800} fill="#fff" textAnchor="middle">
              Pay ₦21,000
            </text>
          </g>
        </Appear>
        <Msg y={114} text={["Paid ✅"]} show={step >= 1} />
        <Msg y={150} text={["Thank you, Tolu! 💙 Your", "gown is on its way."]} me width={136} show={step >= 1} delay={900} />
      </Phone>
      <Appear show={step >= 1} from="pop">
        <Chip x={590} y={200} icon="💳" text="Card, transfer or USSD" width={270} />
      </Appear>
      <Appear show={step >= 1} from="up" delay={400}>
        <Amaka x={830} y={515} scale={0.6} pose="cheer" talking={talking} />
      </Appear>
    </g>
  );
}

/* 5. Know about every order */
function EveryOrder({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#f6ead2" />
      <SceneTitle text="Know about every order" />
      <Amaka x={140} y={515} scale={0.78} pose="hold" talking={talking} />
      <Phone x={270} y={110} scale={1.1} title="Amaka (owner)" header="#0a1a33">
        <g transform="translate(6 10)">
          <rect width="138" height="96" rx="10" fill="#fff4d6" />
          <text x="10" y="22" fontSize="11" fontWeight={800} fill="#b45309">
            🛒 New order
          </text>
          {["Tolu · Red gown, 14", "Lekki Phase 1", "Total ₦21,000"].map((t, i) => (
            <text key={t} x="10" y={44 + i * 18} fontSize="10.5" fill="#0a1a33">
              {t}
            </text>
          ))}
        </g>
      </Phone>
      <Appear show={step >= 1} from="right">
        <AppWindow x={500} y={110} w={300} h={170} title="Paystack" tone="#0ba4db">
          <text x="24" y="44" fontSize="15" fontWeight={700} fill="#44546a">
            Tolu · ₦21,000
          </text>
          <g transform="translate(24 62)">
            <rect width="110" height="32" rx="16" fill="#e8f6ee" />
            <text x="55" y="21" fontSize="14" fontWeight={800} fill="#16a34a" textAnchor="middle">
              Successful
            </text>
          </g>
        </AppWindow>
      </Appear>
      <Appear show={step >= 1} from="pop" delay={600}>
        <Chip x={500} y={300} icon="🔍" text="Check Paystack, not a screenshot" width={350} tone="#e4572e" />
      </Appear>
      <Appear show={step >= 1} from="left" delay={1100}>
        <Emeka x={880} y={515} scale={0.55} pose="wave" />
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
            ["Teach your bot to collect an order", 0],
            ["Create a Paystack payment page", 0],
            ["Add the link to your brain sheet", 0],
            ["Do one full test order", 0],
          ]}
          size={17}
        />
      </Card>
      <NextLesson show={step >= 1} text="Next: Lesson 6 · Test, launch, improve" />
    </g>
  );
}

export const aiAgentsLesson5: AnimatedLesson = {
  id: "ai-agents-without-code/5",
  title: "Take orders and payments",
  scenes: [
    {
      heading: "One question at a time",
      Scene: TakeOrder,
      tryIt: "Add this to my assistant's instructions: when a customer wants to buy, ask one question at a time for the item, size or quantity, delivery or pickup, area, and name. Then repeat the order with the total.",
      steps: [
        { say: "Now your assistant can take orders. Teach it to ask one question at a time. First, the item." },
        { say: "Then the size or quantity, and delivery or pickup." },
        { say: "Then the delivery area, and the customer's name." },
      ],
    },
    {
      heading: "Repeat the order with the total",
      Scene: Summary,
      steps: [
        { say: "Next, the assistant repeats the whole order with the total, including delivery." },
        { say: "The customer checks it and confirms. No mistakes, no confusion." },
      ],
    },
    {
      heading: "A payment link, no code",
      Scene: PaymentPage,
      steps: [
        { say: "To get paid, create a Paystack payment page. In your Paystack dashboard, open payment pages, and create a new page for your shop." },
        { say: "Paystack gives you a link. Add it to your brain sheet, and tell the assistant to send it when the customer confirms." },
      ],
    },
    {
      heading: "Send the link, get paid",
      Scene: SendLink,
      steps: [
        { say: "The customer taps the link and pays." },
        { say: "By card, transfer or USSD, whichever they like. Then the assistant says thank you." },
      ],
    },
    {
      heading: "Know about every order",
      Scene: EveryOrder,
      steps: [
        { say: "Tell your assistant to send every confirmed order to you, for example on your own WhatsApp or by email." },
        { say: "Before you deliver, check the payment in Paystack. Never deliver on a screenshot alone. Then send it out!" },
      ],
    },
    {
      heading: "Your practice",
      Scene: Practise,
      steps: [
        { say: "This week, teach your bot to collect an order, create a Paystack payment page, add the link to your brain sheet, and do one full test order." },
        { say: "In lesson six, we will test, launch and improve your assistant. See you there!" },
      ],
    },
  ],
};
