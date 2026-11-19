"use client";

import { Amaka, BrandBadge, Phone } from "./cartoon";
import { Msg } from "./lessons/shared";
import { ChannelIcon, Robot } from "./lessons/agents-shared";

/** Course thumbnail (16:9) for "How to Build AI Agents Without Code", for YouTube, social posts and adverts. */
export function AgentsThumbnail() {
  return (
    <svg viewBox="0 0 960 540" className="block h-screen w-screen" role="img" aria-label="How to Build AI Agents Without Code">
      <defs>
        <radialGradient id="th-bg" cx="72%" cy="45%" r="80%">
          <stop offset="0" stopColor="#2a64c4" />
          <stop offset="0.55" stopColor="#123a7a" />
          <stop offset="1" stopColor="#0a1a33" />
        </radialGradient>
      </defs>
      <rect width="960" height="540" fill="url(#th-bg)" />
      <circle cx="720" cy="290" r="230" fill="#ffd45c" opacity="0.12" />
      <circle cx="720" cy="290" r="160" fill="#ffd45c" opacity="0.12" />
      {[
        [520, 70, 1.1],
        [930, 230, 0.8],
        [470, 470, 0.7],
      ].map(([x, y, s]) => (
        <path key={x} transform={`translate(${x} ${y}) scale(${s})`} d="M0 -22 l6 16 l16 6 l-16 6 l-6 16 l-6 -16 l-16 -6 l16 -6z" fill="#ffd45c" />
      ))}

      {/* headline */}
      <g transform="translate(40 40)">
        <rect width="230" height="44" rx="22" fill="#f2b134" />
        <text x="115" y="30" fontSize="19" fontWeight={900} fill="#0a1a33" textAnchor="middle" letterSpacing="1.5">
          NO CODING NEEDED
        </text>
      </g>
      <g fontFamily="var(--font-heading)" fontWeight={900}>
        <text x="40" y="160" fontSize="66" fill="#ffffff">
          BUILD YOUR
        </text>
        <text x="40" y="236" fontSize="80" fill="#ffd45c">
          AI AGENT
        </text>
        <text x="40" y="306" fontSize="56" fill="#ffffff">
          WITHOUT CODE
        </text>
      </g>
      <text x="42" y="352" fontSize="22" fontWeight={700} fill="#cfe0ff">
        It answers your customers 24/7
      </text>
      <g transform="translate(40 384)">
        <rect width="400" height="70" rx="35" fill="#ffffff" />
        <ChannelIcon x={42} y={35} kind="whatsapp" size={46} />
        <ChannelIcon x={98} y={35} kind="instagram" size={46} />
        <text x="136" y="43" fontSize="22" fontWeight={800} fill="#0a1a33">
          WhatsApp &amp; Instagram
        </text>
      </g>
      <text x="42" y="500" fontSize="17" fontWeight={700} fill="#b4bfcd" letterSpacing="2">
        JTR ACADEMY · VIDEO COURSE
      </text>

      {/* phone, robot and Amaka */}
      <g transform="rotate(-6 680 280)">
        <Phone x={560} y={86} scale={1.2} title="Amaka's Styles">
          <Msg y={8} text={["Hi! Is the red gown", "still available? 😍"]} />
          <Msg y={54} text={["Yes! Size 8 to 22,", "₦18,500 💃🏾"]} me width={130} />
          <Msg y={102} text={["I'll take size 14!"]} />
          <g transform="translate(30 140)">
            <rect width="114" height="38" rx="10" fill="#0ba4db" />
            <text x="57" y="24" fontSize="12" fontWeight={800} fill="#fff" textAnchor="middle">
              Pay ₦18,500
            </text>
          </g>
          <Msg y={188} text={["Paid ✅ Thank you!"]} />
        </Phone>
      </g>
      <Robot x={850} y={330} scale={0.85} wave />
      <Amaka x={560} y={545} scale={0.5} pose="cheer" mood="excited" />
      <BrandBadge />
    </svg>
  );
}

/** Course thumbnail (16:9) for "Boost Sales with AI", in the same style as the AI agents one. */
export function SalesThumbnail() {
  const bars = [46, 70, 62, 104, 134, 178];
  return (
    <svg viewBox="0 0 960 540" className="block h-screen w-screen" role="img" aria-label="Boost Sales with AI">
      <defs>
        <radialGradient id="ths-bg" cx="72%" cy="45%" r="80%">
          <stop offset="0" stopColor="#2a64c4" />
          <stop offset="0.55" stopColor="#123a7a" />
          <stop offset="1" stopColor="#0a1a33" />
        </radialGradient>
      </defs>
      <rect width="960" height="540" fill="url(#ths-bg)" />
      <circle cx="720" cy="280" r="230" fill="#ffd45c" opacity="0.12" />
      <circle cx="720" cy="280" r="160" fill="#ffd45c" opacity="0.12" />
      {[
        [520, 70, 1.1],
        [935, 300, 0.8],
        [470, 470, 0.7],
      ].map(([x, y, s]) => (
        <path key={x} transform={`translate(${x} ${y}) scale(${s})`} d="M0 -22 l6 16 l16 6 l-16 6 l-6 16 l-6 -16 l-16 -6 l16 -6z" fill="#ffd45c" />
      ))}

      {/* headline */}
      <g transform="translate(40 40)">
        <rect width="250" height="44" rx="22" fill="#f2b134" />
        <text x="125" y="30" fontSize="19" fontWeight={900} fill="#0a1a33" textAnchor="middle" letterSpacing="1.5">
          SELL MORE, FASTER
        </text>
      </g>
      <g fontFamily="var(--font-heading)" fontWeight={900}>
        <text x="40" y="160" fontSize="76" fill="#ffffff">
          BOOST
        </text>
        <text x="40" y="236" fontSize="76" fill="#ffd45c">
          YOUR SALES
        </text>
        <text x="40" y="306" fontSize="62" fill="#ffffff">
          WITH AI
        </text>
      </g>
      <text x="42" y="352" fontSize="22" fontWeight={700} fill="#cfe0ff">
        Adverts that sell, replies in seconds
      </text>
      <g transform="translate(40 384)">
        <rect width="400" height="70" rx="35" fill="#ffffff" />
        <circle cx="42" cy="35" r="23" fill="#10a37f" />
        <text x="42" y="43" fontSize="22" textAnchor="middle">
          ✨
        </text>
        <circle cx="98" cy="35" r="23" fill="#d97757" />
        <text x="98" y="43" fontSize="22" textAnchor="middle">
          💬
        </text>
        <text x="136" y="43" fontSize="22" fontWeight={800} fill="#0a1a33">
          ChatGPT &amp; Claude
        </text>
      </g>
      <text x="42" y="500" fontSize="17" fontWeight={700} fill="#b4bfcd" letterSpacing="2">
        JTR ACADEMY · VIDEO COURSE
      </text>

      {/* sales chart, phone with orders, Amaka */}
      <g transform="translate(560 70) rotate(-4)">
        <rect x="6" y="10" width="340" height="250" rx="22" fill="#0a1a33" opacity="0.3" />
        <rect width="340" height="250" rx="22" fill="#ffffff" />
        <text x="24" y="40" fontSize="17" fontWeight={800} fill="#0a1a33">
          Sales this month
        </text>
        <g transform="translate(222 18)">
          <rect width="96" height="32" rx="16" fill="#e8f6ee" />
          <text x="48" y="22" fontSize="16" fontWeight={900} fill="#16a34a" textAnchor="middle">
            ▲ 3×
          </text>
        </g>
        {bars.map((h, i) => (
          <rect key={i} x={30 + i * 50} y={226 - h} width="32" height={h} rx="7" fill="#1563d6" opacity={0.35 + i * 0.13} />
        ))}
        <polyline points="46,170 96,150 146,160 196,118 246,92 296,52" fill="none" stroke="#f2b134" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M296 52 l-20 2 l12 16z" fill="#f2b134" transform="rotate(-20 296 52)" />
      </g>
      <g transform="rotate(5 760 360)">
        <Phone x={690} y={250} scale={0.95} title="Amaka's Styles">
          <Msg y={8} text={["Is the red gown", "still available? 😍"]} />
          <Msg y={54} text={["Yes! ₦18,500 💃🏾"]} me width={110} />
          <Msg y={90} text={["I'll take two!"]} />
        </Phone>
      </g>
      <g transform="translate(760 222) rotate(5)">
        <rect width="170" height="40" rx="20" fill="#16a34a" />
        <text x="85" y="27" fontSize="17" fontWeight={800} fill="#fff" textAnchor="middle">
          🛒 +12 orders
        </text>
      </g>
      <Amaka x={590} y={545} scale={0.5} pose="cheer" mood="excited" />
      <BrandBadge />
    </svg>
  );
}
