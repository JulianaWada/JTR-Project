"use client";

import { Amaka, Appear, Boutique, Bubble, Character, Chidi, Chip, Emeka, Kemi, Laptop, Phone, SKIN, SceneTitle, Studio, Tick, Tolu, Typed } from "../cartoon";
import type { AnimatedLesson, SceneProps } from "../types";

/*
 * Boost Sales with AI, Lesson 2: Know your customer.
 * Amaka runs a ready-to-wear boutique in Yaba, Lagos. Her ideal customer is Tolu, a young banker in Lekki.
 * Each narration step changes the picture to show exactly what is being said.
 */

/* 1. Welcome */
function Welcome({ step, talking }: SceneProps) {
  return (
    <g>
      <Boutique />
      <SceneTitle text="Know your customer" />
      <Appear show from="left" delay={400}>
        <Chidi x={215} y={510} scale={0.92} pose={step === 0 ? "wave" : "idle"} />
      </Appear>
      <Appear show from="left">
        <Amaka x={430} y={505} pose={step === 0 ? "wave" : step === 2 ? "point" : "present"} talking={talking} />
      </Appear>
      <Appear show={step === 1} from="pop">
        <g transform="translate(580 300)">
          <rect x="4" y="8" width="356" height="130" rx="22" fill="#0a1a33" opacity="0.18" />
          <rect width="356" height="130" rx="22" fill="#fff" />
          <rect width="356" height="40" rx="20" fill="#1563d6" />
          <rect y="20" width="356" height="20" fill="#1563d6" />
          <text x="20" y="27" fontSize="17" fontWeight={700} fill="#fff">
            From lesson 1
          </text>
          <text x="20" y="80" fontSize="26" fontWeight={700} fill="#0a1a33">
            ✨ Give AI context
          </text>
          <text x="20" y="112" fontSize="16" fill="#44546a">
            Who you are · who you sell to · your goal
          </text>
        </g>
      </Appear>
      <Appear show={step >= 2} from="right">
        <g>
          <ellipse cx="760" cy="500" rx="90" ry="18" fill="#ffd45c" opacity="0.55" className="ac-pulse" />
          <Tolu x={760} y={505} scale={0.92} flip mood="happy" />
          <g className="ac-float">
            <text x="760" y="110" fontSize="44" textAnchor="middle">
              💛
            </text>
          </g>
        </g>
      </Appear>
      <Appear show={step >= 3} from="pop">
        <g transform="translate(548 96)">
          <rect x="4" y="6" width="160" height="150" rx="18" fill="#0a1a33" opacity="0.15" />
          <rect width="160" height="150" rx="18" fill="#fff" />
          <text x="16" y="30" fontSize="15" fontWeight={700} fill="#44546a">
            Sales
          </text>
          {[38, 58, 84, 112].map((h, i) => (
            <rect
              key={i}
              x={18 + i * 34}
              y={136 - h}
              width="26"
              height={h}
              rx="5"
              fill={i === 3 ? "#16a34a" : "#1563d6"}
              className="ac-grow"
              style={{ transform: step >= 3 ? "scaleY(1)" : "scaleY(0.05)", transitionDelay: `${i * 150}ms` }}
            />
          ))}
          <path d="M20 92 L140 30" stroke="#16a34a" strokeWidth="5" strokeLinecap="round" />
          <path d="M122 28 L142 28 L138 48" stroke="#16a34a" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </Appear>
    </g>
  );
}

/* 2. Everybody vs one real person */
const CROWD = [
  [520, 330],
  [590, 340],
  [660, 330],
  [730, 340],
  [800, 330],
  [870, 340],
  [555, 470],
  [625, 480],
  [695, 470],
  [765, 480],
  [835, 470],
];
const CROWD_COLOURS = ["#e4572e", "#1f9d6b", "#f2b134", "#8a3fd1", "#e2447a", "#2f6fde"];

function Everybody({ step, talking }: SceneProps) {
  const crowdGone = step >= 2;
  return (
    <g>
      <Studio tone="#e9dcff" />
      <SceneTitle text="Everybody, or somebody?" />
      <Amaka
        x={170}
        y={505}
        scale={0.9}
        pose={step <= 1 ? "point" : "present"}
        mood={step === 1 ? "thinking" : "happy"}
        talking={talking}
        holding={
          step <= 1 ? (
            <g transform="rotate(-90)">
              <path d="M-8 -6 L30 -22 L30 22 L-8 6Z" fill="#f2b134" stroke="#9a5b00" strokeWidth="3" />
              <rect x="-18" y="-8" width="14" height="16" rx="4" fill="#9a5b00" />
            </g>
          ) : undefined
        }
      />
      <Appear show={step === 0} from="pop">
        <Bubble x={250} y={70} lines={["My product is for", "EVERYBODY!"]} width={230} size={22} />
      </Appear>
      <Appear show={!crowdGone}>
        <g>
          {CROWD.map(([cx, cy], i) => (
            <g key={i}>
              <Character
                x={cx}
                y={cy}
                scale={0.38}
                skin={[SKIN.brown, SKIN.deep, SKIN.warm][i % 3]}
                hair={(["short", "puff", "braids", "bun"] as const)[i % 4]}
                outfit={CROWD_COLOURS[i % CROWD_COLOURS.length]}
                body={i % 4 === 0 ? "shirt" : "dress"}
                faded={step >= 1}
                mood={step >= 1 ? "thinking" : "happy"}
                flip={i % 2 === 0}
              />
              <Appear show={step === 1} from="down" delay={i * 60}>
                <text x={cx} y={cy - 175} fontSize="30" fontWeight={800} fill="#6d4aff" textAnchor="middle">
                  ?
                </text>
              </Appear>
            </g>
          ))}
        </g>
      </Appear>
      <Appear show={crowdGone} from="pop">
        <g>
          <ellipse cx="660" cy="505" rx="110" ry="22" fill="#ffd45c" opacity="0.6" className="ac-pulse" />
          <Tolu x={660} y={505} scale={0.88} flip mood="happy" />
        </g>
      </Appear>
      <Appear show={step >= 3} from="right">
        <Chip x={420} y={120} icon="🎂" text="Age: 28" />
      </Appear>
      <Appear show={step >= 3} from="right" delay={250}>
        <Chip x={330} y={190} icon="📍" text="Lives in Lekki, Lagos" />
      </Appear>
      <Appear show={step >= 3} from="left" delay={500}>
        <Chip x={750} y={140} icon="💼" text="Banker" />
      </Appear>
      <Appear show={step >= 3} from="left" delay={750}>
        <Chip x={750} y={210} icon="💰" text="₦15k–₦40k" />
      </Appear>
      <Appear show={step >= 4} from="right">
        <Chip x={280} y={280} icon="⏰" text="Problem: no time to shop" tone="#9a5b00" />
      </Appear>
      <Appear show={step >= 4} from="left" delay={400}>
        <Chip x={735} y={280} icon="🤔" text="Will it fit me?" tone="#b42318" />
      </Appear>
    </g>
  );
}

/* 3. The customer profile card fills in */
const PROFILE: [string, string, string][] = [
  ["🎂", "Age", "25 to 35"],
  ["📍", "Lives", "Lekki and Ajah, Lagos"],
  ["💼", "Work", "Bankers, young professionals"],
  ["💰", "Budget", "₦15,000 to ₦40,000 an outfit"],
  ["🎯", "Problem", "Smart work outfits, no market stress"],
  ["🤔", "Hesitates", "Will it fit? Is delivery reliable?"],
];
const PROFILE_STEP = [1, 1, 2, 2, 3, 3];

function Profile({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#d4e3f7" />
      <SceneTitle text="Your customer profile" />
      <Amaka x={150} y={510} scale={0.88} pose={step === 4 ? "cheer" : "point"} talking={talking} />
      <g transform="translate(300 86)">
        <rect x="6" y="10" width="620" height="420" rx="26" fill="#0a1a33" opacity="0.16" />
        <rect width="620" height="420" rx="26" fill="#fff" />
        <circle cx="52" cy="50" r="30" fill="#2f6fde" opacity="0.15" />
        <text x="52" y="62" fontSize="34" textAnchor="middle">
          👩🏾‍💼
        </text>
        <text x="96" y="46" fontSize="14" fontWeight={700} fill="#1563d6" letterSpacing="2">
          CUSTOMER PROFILE
        </text>
        <text x="96" y="72" fontSize="24" fontWeight={700} fill="#0a1a33" fontFamily="var(--font-heading)">
          Tolu, my ideal customer
        </text>
        {PROFILE.map(([icon, label, value], i) => {
          const y = 116 + i * 50;
          const filled = step >= PROFILE_STEP[i];
          return (
            <g key={label}>
              <rect x="20" y={y - 26} width="580" height="42" rx="12" fill={filled ? "#eef5ff" : "#f3f5f8"} style={{ transition: "fill .5s" }} />
              <text x="36" y={y + 1} fontSize="20">
                {icon}
              </text>
              <text x="70" y={y} fontSize="16" fontWeight={700} fill="#44546a">
                {label}
              </text>
              {!filled && <rect x="190" y={y - 10} width="300" height="10" rx="5" fill="#dfe6ef" />}
              <Typed text={value} show={filled} delay={i % 2 === 1 ? 1300 : 0} x="190" y={y} fontSize="18" fontWeight={600} fill="#0a1a33" />
            </g>
          );
        })}
        <Appear show={step >= 4} from="pop">
          <g transform="translate(470 30) rotate(-8)">
            <rect width="130" height="56" rx="14" fill="none" stroke="#16a34a" strokeWidth="4" />
            <text x="65" y="25" fontSize="15" fontWeight={800} fill="#16a34a" textAnchor="middle">
              DONE IN
            </text>
            <text x="65" y="46" fontSize="18" fontWeight={800} fill="#16a34a" textAnchor="middle">
              ⏱ 5 MINUTES
            </text>
          </g>
        </Appear>
      </g>
    </g>
  );
}

/* 4. Paste your WhatsApp chats into AI */
const CHATS: [string, string][] = [
  ["Chioma · 0803 412 7781", "Do you have size 14? 😊"],
  ["Funmi · 0812 990 4410", "Can it reach Lekki by Friday?"],
  ["Ngozi · 0706 551 2093", "Need 2 office gowns for work"],
  ["Bisi · 0909 334 8820", "Price for the blue one pls"],
];

function Chats({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#d5ede2" />
      <SceneTitle text="Your chats hold the answers" />
      <Phone x={70} y={110} scale={1.18} title="Customer chats">
        {CHATS.map(([who, msg], i) => (
          <g key={who} transform={`translate(6 ${8 + i * 60})`}>
            <rect width="138" height="50" rx="8" fill={step === 0 ? "#cfe3ff" : "#fff"} style={{ transition: "fill .4s", transitionDelay: `${i * 150}ms` }} />
            <text x="8" y="17" fontSize="9.5" fontWeight={700} fill="#0b7a5b">
              {who}
            </text>
            <text x="8" y="36" fontSize="10" fill="#1b1b1b">
              {msg}
            </text>
            {/* names and numbers blacked out */}
            <rect x="6" y="7" width="124" height="14" rx="4" fill="#0a1a33" className="ac-appear" style={{ transform: step >= 1 ? "scaleX(1)" : "scaleX(0)", transformOrigin: "left", transitionDelay: `${i * 200}ms` }} />
          </g>
        ))}
        <Appear show={step === 0} from="pop">
          <g transform="translate(40 250)">
            <rect width="70" height="24" rx="12" fill="#1563d6" />
            <text x="35" y="16" fontSize="11" fontWeight={700} fill="#fff" textAnchor="middle">
              📋 Copy
            </text>
          </g>
        </Appear>
        <Appear show={step >= 1} from="pop" delay={700}>
          <g transform="translate(30 250)">
            <rect width="92" height="24" rx="12" fill="#16a34a" />
            <text x="46" y="16" fontSize="11" fontWeight={700} fill="#fff" textAnchor="middle">
              🔒 Private
            </text>
          </g>
        </Appear>
      </Phone>

      <Chidi x={355} y={520} scale={0.58} pose={step >= 4 ? "cheer" : "present"} mood={step >= 4 ? "excited" : "happy"} talking={talking} />

      <Laptop x={470} y={120} scale={1.08}>
        <Appear show={step >= 2} from="pop" delay={900}>
          <g transform="translate(150 0)">
            <rect width="190" height="30" rx="10" fill="#dcf8c6" />
            <text x="12" y="20" fontSize="12" fontWeight={600} fill="#0b7a5b">
              📋 20 chats, names removed
            </text>
          </g>
        </Appear>
        <Appear show={step >= 3} from="up">
          <g transform="translate(40 38)">
            <rect width="300" height="48" rx="12" fill="#1563d6" />
            <Typed text="What patterns do you see in who" show={step >= 3} x="12" y="20" fontSize="12.5" fontWeight={600} fill="#fff" />
            <Typed text="buys from me, and why?" show={step >= 3} delay={1000} x="12" y="38" fontSize="12.5" fontWeight={600} fill="#fff" />
          </g>
        </Appear>
        <Appear show={step >= 4} from="up">
          <g transform="translate(0 94)">
            <rect width="310" height="88" rx="12" fill="#eef1f6" />
            {["👩🏾‍💼 Most buyers: working women, 25 to 35", "📅 Orders peak on Friday evenings", "📏 Their top worry: size and fit"].map((t, i) => (
              <Appear key={t} show={step >= 4} from="left" delay={300 + i * 700}>
                <text x="12" y={24 + i * 26} fontSize="12.5" fontWeight={600} fill="#0a1a33">
                  {t}
                </text>
              </Appear>
            ))}
          </g>
        </Appear>
      </Laptop>
      {/* the copied chats fly from the phone into the AI chat */}
      {step === 2 && (
        <g className="ac-fly">
          <g transform="translate(150 260)">
            {[0, 1, 2].map((k) => (
              <rect key={k} x={k * 6} y={k * 6} width="120" height="70" rx="10" fill="#dcf8c6" stroke="#0b7a5b" strokeOpacity="0.4" />
            ))}
            <text x="72" y="54" fontSize="13" fontWeight={700} fill="#0b7a5b" textAnchor="middle">
              20 messages
            </text>
          </g>
        </g>
      )}
    </g>
  );
}

/* 5. Objections, and answering them before the customer asks */
const OBJECTIONS: [string, string][] = [
  ["It's too expensive", "Pay in 2 parts"],
  ["Will it fit me?", "Free size swap"],
  ["Can I trust this seller?", "200+ happy reviews ★★★★★"],
];

function Objections({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#f6ead2" />
      <SceneTitle text="Answer worries before they ask" />
      <Laptop x={40} y={130} scale={0.88}>
        <rect width="300" height="40" rx="12" fill="#1563d6" />
        <Typed text="List the top 10 questions and" show x="12" y="17" fontSize="12.5" fontWeight={600} fill="#fff" />
        <Typed text="objections my customer might have." show delay={900} x="12" y="33" fontSize="12.5" fontWeight={600} fill="#fff" />
        {["1. Is it too expensive?", "2. Will it fit me?", "3. Can I trust this seller?", "4. How fast is delivery?", "5. Can I return it?"].map((t, i) => (
          <Appear key={t} show from="left" delay={2200 + i * 350}>
            <text x="6" y={66 + i * 24} fontSize="13" fontWeight={600} fill="#0a1a33">
              {t}
            </text>
          </Appear>
        ))}
      </Laptop>
      <Tolu x={800} y={510} scale={0.85} flip mood={step >= 2 ? "excited" : "thinking"} talking={false} holding={step >= 2 ? <ShoppingBag /> : undefined} />
      {OBJECTIONS.map(([worry, answer], i) => (
        <g key={worry}>
          <Appear show={step >= 1} from="pop" delay={i * 600}>
            <Bubble x={410} y={70 + i * 105} lines={[worry]} width={300} tone="red" tail="right" thought />
          </Appear>
          <Appear show={step >= 2} from="left" delay={i * 600}>
            <g>
              <Bubble x={410} y={70 + i * 105} lines={[answer]} width={300} tone="green" tail="none" />
              <Tick x={712} y={92 + i * 105} />
            </g>
          </Appear>
        </g>
      ))}
      {talking && step === 0 && (
        <g className="ac-float">
          <text x="540" y="430" fontSize="40" textAnchor="middle">
            ✨
          </text>
        </g>
      )}
    </g>
  );
}

function ShoppingBag() {
  return (
    <g transform="translate(-20 0)">
      <path d="M8 6 q12 -26 24 0" stroke="#9a5b00" strokeWidth="4" fill="none" />
      <rect x="0" y="4" width="40" height="44" rx="6" fill="#f2b134" />
      <text x="20" y="34" fontSize="14" fontWeight={800} fill="#0a1a33" textAnchor="middle">
        A
      </text>
    </g>
  );
}

/* 6. Where to find more customers like Tolu */
const PLACES: [number, number, string, string][] = [
  [590, 250, "⛪", "Church women's fellowship"],
  [760, 330, "🏫", "School PTA fair"],
  [650, 420, "🛍️", "Lekki weekend market"],
];

function FindMore({ step, talking }: SceneProps) {
  return (
    <g>
      <Studio tone="#d4e3f7" />
      <SceneTitle text="Find more customers like Tolu" />
      {/* a simple map of Lagos */}
      <g transform="translate(470 100)">
        <rect x="6" y="10" width="460" height="390" rx="26" fill="#0a1a33" opacity="0.14" />
        <rect width="460" height="390" rx="26" fill="#e7f2df" />
        <path d="M0 230 Q120 200 200 250 Q300 310 460 270 L460 320 Q300 360 190 300 Q110 255 0 280Z" fill="#7cc4ff" />
        <path d="M40 0 L120 390 M0 120 L460 150 M300 0 L330 390" stroke="#fff" strokeWidth="10" />
        <path d="M40 0 L120 390 M0 120 L460 150 M300 0 L330 390" stroke="#c9d5c0" strokeWidth="2" />
        {[
          [60, 70, "Ikeja"],
          [190, 110, "Yaba"],
          [90, 200, "Surulere"],
          [370, 360, "Lekki"],
        ].map(([lx, ly, name]) => (
          <text key={name as string} x={lx} y={ly} fontSize="15" fontWeight={700} fill="#4b5b45">
            {name}
          </text>
        ))}
      </g>
      <Amaka x={170} y={510} scale={0.85} pose={step >= 3 ? "cheer" : "point"} talking={talking} />
      <Appear show={step >= 1} from="pop">
        <Bubble x={40} y={90} lines={["✨ Where does my customer", "spend time online?"]} width={300} tone="blue" />
      </Appear>
      <Appear show={step >= 2} from="right">
        <Chip x={500} y={130} icon="👥" text="Lagos Working Women group" tone="#1563d6" />
      </Appear>
      <Appear show={step >= 2} from="right" delay={500}>
        <Chip x={560} y={190} icon="#️⃣" text="#LagosOfficeWear" tone="#e2447a" />
      </Appear>
      {PLACES.map(([px, py, icon, label], i) => (
        <Appear key={label} show={step >= 3} from="down" delay={i * 500}>
          <g transform={`translate(${px} ${py})`}>
            <path d="M0 0 C-22 -26 -22 -56 0 -56 C22 -56 22 -26 0 0Z" fill="#e4572e" transform="translate(0 0)" />
            <circle cx="0" cy="-36" r="13" fill="#fff" />
            <text x="0" y="-30" fontSize="16" textAnchor="middle">
              {icon}
            </text>
            <rect x="18" y="-50" width={label.length * 9 + 20} height="30" rx="15" fill="#fff" />
            <text x="28" y="-30" fontSize="15" fontWeight={700} fill="#0a1a33">
              {label}
            </text>
          </g>
        </Appear>
      ))}
    </g>
  );
}

/* 7. Turn objections into posts, and find partners */
function GrowIdeas({ step, talking }: SceneProps) {
  const partners = step >= 3;
  return (
    <g>
      <Studio tone="#e9dcff" />
      <SceneTitle text="Two ideas to grow" />
      <Appear show={!partners}>
        <g>
          <Bubble x={40} y={110} lines={["When will my", "order arrive?"]} width={210} tone="red" />
          <Appear show={step >= 0} from="left" delay={600}>
            <path d="M260 160 L320 160" stroke="#6d4aff" strokeWidth="6" strokeLinecap="round" markerEnd="" />
            <path d="M310 148 L326 160 L310 172" stroke="#6d4aff" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </Appear>
          {/* the post that answers it */}
          <Appear show from="pop" delay={900}>
            <g transform="translate(340 80)">
              <rect x="6" y="10" width="280" height="380" rx="22" fill="#0a1a33" opacity="0.16" />
              <rect width="280" height="380" rx="22" fill="#fff" />
              <circle cx="30" cy="30" r="14" fill="#e4572e" />
              <text x="52" y="35" fontSize="14" fontWeight={700} fill="#0a1a33">
                Amaka&apos;s Styles
              </text>
              <rect x="14" y="56" width="252" height="200" rx="12" fill="#cfe8ff" />
              <rect x="14" y="206" width="252" height="50" fill="#9fc79a" />
              {/* customer's house */}
              <g transform="translate(200 140)">
                <rect width="56" height="66" fill="#f6ead2" />
                <path d="M-8 4 L28 -26 L64 4Z" fill="#b42318" />
                <rect x="20" y="30" width="18" height="36" fill="#8a5330" />
              </g>
              {/* Emeka the rider brings the parcel */}
              <g className={step >= 1 ? "ac-ride" : undefined}>
                <g transform="translate(20 250)">
                  <circle cx="20" cy="-6" r="13" fill="#222" />
                  <circle cx="80" cy="-6" r="13" fill="#222" />
                  <path d="M20 -6 L50 -30 L80 -6" stroke="#b42318" strokeWidth="6" fill="none" />
                  <rect x="56" y="-56" width="22" height="20" rx="3" fill="#f2b134" />
                  <Emeka x={46} y={-14} scale={0.17} pose="hold" />
                </g>
              </g>
              <Appear show={step >= 1} from="pop">
                <g>
                  <circle cx="140" cy="150" r="26" fill="#0a1a33" opacity="0.55" />
                  <path d="M132 136 L154 150 L132 164Z" fill="#fff" />
                </g>
              </Appear>
              <text x="16" y="290" fontSize="16" fontWeight={700} fill="#0a1a33">
                Delivered to Lekki in 24 hours 🚚
              </text>
              <text x="16" y="316" fontSize="13" fill="#44546a">
                Order by 4pm, wear it tomorrow.
              </text>
              <Appear show={step >= 1} from="up" delay={800}>
                <text x="16" y="356" fontSize="16" fontWeight={700} fill="#e2447a">
                  ❤️ 1,248 · 💬 96 · ↗ 210
                </text>
              </Appear>
            </g>
          </Appear>
          <Appear show={step >= 2} from="right">
            <g transform="translate(650 90)">
              <rect x="6" y="10" width="280" height="300" rx="22" fill="#0a1a33" opacity="0.16" />
              <rect width="280" height="300" rx="22" fill="#fff" />
              <text x="20" y="40" fontSize="17" fontWeight={700} fill="#1563d6">
                ✨ 10 partner ideas
              </text>
              {["💄 Make-up artist", "📸 Photographer", "🪡 Tailor", "🎉 Event planner", "💇🏾‍♀️ Hair salon"].map((t, i) => (
                <Appear key={t} show={step >= 2} from="left" delay={300 + i * 300}>
                  <text x="22" y={84 + i * 42} fontSize="17" fontWeight={600} fill="#0a1a33">
                    {t}
                  </text>
                </Appear>
              ))}
            </g>
          </Appear>
        </g>
      </Appear>
      <Appear show={partners} from="pop">
        <g>
          <Chip x={30} y={200} icon="👗" text="Bridal boutique" tone="#e4572e" />
          <Chip x={735} y={200} icon="💄" text="Make-up artist" tone="#8a3fd1" />
          <Amaka x={330} y={505} pose="point" talking={talking} />
          <Kemi x={630} y={505} flip pose="point" />
          <text x="480" y="300" fontSize="54" textAnchor="middle" className="ac-pulse">
            🤝
          </text>
          {/* customers passed both ways */}
          <g transform="translate(400 140)">
            <g className="ac-swap">
              <text fontSize="38">👰🏾</text>
            </g>
          </g>
          <g transform="translate(400 400)">
            <g className="ac-swap-back">
              <text fontSize="38">💄</text>
            </g>
          </g>
        </g>
      </Appear>
    </g>
  );
}

/* 8. The assignment */
const TASKS: [string, number][] = [
  ["Write a one-page customer profile with AI", 0],
  ["Edit it with what you know from real life", 1],
  ["Add their top 5 questions or objections", 1],
  ["Submit it under Assignments", 2],
];

function Assignment({ step, talking }: SceneProps) {
  return (
    <g>
      <Boutique dim />
      <SceneTitle text="Your assignment" />
      <Amaka
        x={190}
        y={510}
        pose={step >= 3 ? "wave" : "hold"}
        talking={talking}
        holding={
          step < 3 ? (
            <g transform="translate(-6 -30) rotate(-8)">
              <rect width="44" height="58" rx="4" fill="#fff" stroke="#c7d2de" />
              <rect x="7" y="10" width="30" height="4" fill="#9aa8ba" />
              <rect x="7" y="20" width="24" height="4" fill="#9aa8ba" />
              <rect x="7" y="30" width="28" height="4" fill="#9aa8ba" />
            </g>
          ) : undefined
        }
      />
      <g transform="translate(370 90)">
        <rect x="6" y="10" width="540" height="370" rx="26" fill="#0a1a33" opacity="0.16" />
        <rect width="540" height="370" rx="26" fill="#fff" />
        <text x="32" y="56" fontSize="26" fontWeight={700} fill="#0a1a33" fontFamily="var(--font-heading)">
          📝 Customer profile
        </text>
        {TASKS.map(([task, at], i) => (
          <g key={task} transform={`translate(32 ${100 + i * 58})`}>
            <rect width="30" height="30" rx="8" fill="none" stroke="#c7d2de" strokeWidth="3" />
            <Appear show={step >= at} from="pop" delay={i === 2 ? 1500 : 300}>
              <Tick x={15} y={15} r={17} />
            </Appear>
            <text x="46" y="22" fontSize="19" fontWeight={600} fill="#0a1a33">
              {task}
            </text>
          </g>
        ))}
        <Appear show={step >= 2} from="up">
          <g transform="translate(32 316)">
            <rect width="190" height="42" rx="21" fill="#1563d6" />
            <text x="95" y="27" fontSize="16" fontWeight={700} fill="#fff" textAnchor="middle">
              Assignments →
            </text>
            <g transform="translate(160 26)" className="ac-tap">
              <path d="M0 0 L0 26 L7 20 L12 31 L17 29 L12 18 L21 18Z" fill="#fff" stroke="#0a1a33" strokeWidth="2" />
            </g>
          </g>
        </Appear>
      </g>
      <Appear show={step >= 3} from="up">
        <g transform="translate(560 474)">
          <rect width="340" height="52" rx="26" fill="#0a1a33" />
          <text x="170" y="33" fontSize="18" fontWeight={700} fill="#ffd45c" textAnchor="middle">
            Next: Lesson 3 · Words that sell
          </text>
        </g>
      </Appear>
    </g>
  );
}

export const boostSalesLesson2: AnimatedLesson = {
  id: "boost-sales-with-ai/2",
  title: "Know your customer",
  scenes: [
    {
      heading: "Know your customer",
      Scene: Welcome,
      steps: [
        { say: "Welcome back! Meet Amaka. She sells ready-to-wear outfits from her boutique in Yaba, Lagos. And this is Chidi, who answers her WhatsApp and Instagram orders." },
        { say: "In lesson one, you learned the golden rule: give AI context." },
        { say: "Today, Amaka will use AI to understand the most important person in her business: her customer." },
        { say: "When you know exactly who you are selling to, selling becomes much easier." },
      ],
    },
    {
      heading: "Everybody, or somebody?",
      Scene: Everybody,
      steps: [
        { say: "Many business owners say, my product is for everybody." },
        { say: "But when you talk to everybody, nobody feels you are talking to them." },
        { say: "Your best customer is one real person. Let's call her Tolu." },
        { say: "Tolu has an age, a location, a job, and a budget." },
        { say: "She has a problem you solve, and a reason she hesitates before buying." },
      ],
    },
    {
      heading: "Your customer profile",
      Scene: Profile,
      tryIt:
        "Help me write a customer profile for my business. I sell [your product] in [your city]. Ask me one question at a time about my customers' age, where they live, their work, their budget, the problem I solve for them and what makes them hesitate.",
      steps: [
        { say: "Let's write a customer profile. It answers six questions." },
        { say: "How old are they? Where do they live?" },
        { say: "What work do they do? What can they spend?" },
        { say: "What problem does your product solve for them? And what makes them hesitate?" },
        { say: "With AI's help, you can write this in five minutes." },
      ],
    },
    {
      heading: "Your chats hold the answers",
      Scene: Chats,
      tryIt:
        "Here are my last 20 customer messages, with names and phone numbers removed. What patterns do you see in who buys from me and why? [paste the messages here]",
      steps: [
        { say: "Here is a powerful trick. Copy your last twenty customer messages from WhatsApp or Instagram." },
        { say: "Remove names and phone numbers first. Keep your customers' details private." },
        { say: "Paste the messages into ChatGPT or Claude." },
        { say: "Then ask: what patterns do you see in who buys from me, and why?" },
        { say: "AI will spot things you have been too busy to notice." },
      ],
    },
    {
      heading: "Answer worries before they ask",
      Scene: Objections,
      tryIt: "My ideal customer is [paste your profile]. List the top 10 questions and objections they might have before buying [your product].",
      steps: [
        { say: "Next, ask AI to list the top ten questions and objections this customer might have." },
        { say: "Objections are the reasons people don't buy. It's too expensive. Will it fit me? Can I trust this seller?" },
        { say: "When you know them, you can answer them before the customer even asks." },
      ],
    },
    {
      heading: "Find more customers like Tolu",
      Scene: FindMore,
      tryIt: "Where does this customer spend time online and offline in [your city]? List the apps, groups, hashtags, events and places I should try.",
      steps: [
        { say: "Now, where do you find more people like Tolu?" },
        { say: "Ask AI: where does this customer spend time online? Which apps, groups, hashtags and events?" },
        { say: "You might discover Facebook groups and Instagram hashtags full of your customers," },
        { say: "or church and school events, and markets you never thought of." },
      ],
    },
    {
      heading: "Two ideas to grow",
      Scene: GrowIdeas,
      tryIt: "Give me 10 partnership ideas with businesses that serve the same customers as my [your business] in [your city], and how each partnership could work.",
      steps: [
        { say: "Two more ideas. First, turn every objection into a post that answers it." },
        { say: "If people ask about delivery, post a short video of an order being delivered." },
        { say: "Second, ask AI for ten partnership ideas with businesses that serve the same customer." },
        { say: "For example, a bridal boutique and a make-up artist can share customers and recommend each other." },
      ],
    },
    {
      heading: "Your assignment",
      Scene: Assignment,
      steps: [
        { say: "Your assignment: write a one-page profile of your ideal customer, using AI." },
        { say: "Then edit it with what you know from real life, and include their top five questions or objections." },
        { say: "Submit it here in the academy, under Assignments." },
        { say: "In lesson three, we will use this profile to write adverts that sell. See you there!" },
      ],
    },
  ],
};
