import type { CourseFormat, CourseWeek, LessonSlides, LessonUnit, QuizQuestion, Resource } from "@/lib/db/schema";

// Starter content for the first two courses. It is copied into the database once (lib/seed.ts);
// after that Jules edits everything from the teacher dashboard. Prices are placeholders.

export type LessonTemplate = { week: number; title: string; notes: string; resources: Resource[]; slides?: LessonSlides };

export type CourseTemplate = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  audience: string[];
  outcomes: string[];
  priceNaira: number;
  /** Optional dollar price for students paying from outside Nigeria. */
  priceUsd?: number;
  format: CourseFormat;
  /** Live courses only: "week" for one class a week, "day" for a short daily course. Defaults to week. */
  lessonUnit?: LessonUnit;
  accent: "blue" | "violet";
  outline: CourseWeek[];
  lessons: LessonTemplate[];
  assignments: { week: number; title: string; brief: string; isFinalProject?: boolean }[];
  quizzes: { week: number; title: string; questions: QuizQuestion[] }[];
};

/** A lesson's branded slides: the PowerPoint and one image per slide, in public/slides/<course>/<lesson>. */
function deck(course: string, lesson: string, count: number): LessonSlides {
  const dir = `/academy/slides/${course}/${lesson}`;
  return { file: `${dir}.pptx`, images: Array.from({ length: count }, (_, i) => `${dir}/${String(i + 1).padStart(2, "0")}.webp`) };
}
const salesSlides = (lesson: number, count: number) => deck("boost-sales-with-ai", `lesson-${lesson}`, count);
const animationSlides = (day: number, count: number) => deck("animation-videos-with-ai", `day-${day}`, count);

export const salesCourse: CourseTemplate = {
  slug: "boost-sales-with-ai",
  title: "Boost Sales with AI",
  tagline: "Use AI to find customers, write adverts that sell and reply to every enquiry fast.",
  description:
    "A practical video course for business owners and sales teams, in six short lessons you watch whenever it suits you. Each lesson shows one way AI can bring in more sales; try it on your own business straight away and leave with something you can use the next morning. No technical background needed: if you can use WhatsApp, you can do this course.",
  audience: [
    "Small business owners selling online or on WhatsApp and Instagram",
    "Sales and marketing staff who want to work faster",
    "Freelancers and consultants looking for more clients",
  ],
  outcomes: [
    "Use ChatGPT and Claude confidently for everyday sales work",
    "Describe your ideal customer and where to find them",
    "Write adverts, posts and product descriptions that convert",
    "Answer customer messages quickly with AI-drafted replies",
    "Follow up leads and close more sales",
    "Leave with a written AI sales plan for your own business",
  ],
  priceNaira: 15000,
  priceUsd: 39,
  format: "recorded",
  accent: "blue",
  outline: [
    { week: 1, title: "AI for your business: getting started", summary: "What AI can and can't do for sales, and setting up ChatGPT and Claude." },
    { week: 2, title: "Know your customer", summary: "Using AI to understand who buys from you, why, and where to find more of them." },
    { week: 3, title: "Words that sell", summary: "Writing adverts, posts and product descriptions with AI." },
    { week: 4, title: "Reply fast, sell more", summary: "Answering WhatsApp and Instagram enquiries with AI help." },
    { week: 5, title: "Follow up and close", summary: "Lead follow-up, pricing conversations and closing the sale." },
    { week: 6, title: "Your AI sales plan", summary: "Final project: a 30-day AI sales plan for your own business." },
  ],
  lessons: [
    {
      week: 1,
      title: "AI for your business: getting started",
      notes: `## What AI is good at in sales
AI tools like ChatGPT and Claude are writing and thinking assistants. They are very good at drafting text, summarising, brainstorming ideas and role-playing a customer. They do not know your prices, your stock or your customers unless you tell them.

## The golden rule: give context
A vague request gets a vague answer. A good prompt says **who you are**, **who the customer is**, **what you want** and **the format**.
- Weak: "Write an advert for my shoes."
- Strong: "I sell handmade leather sandals in Abuja for ₦25,000. Write a 3-line Instagram caption for working women aged 25 to 40. Friendly tone, one emoji, end with 'Send us a DM to order'."

## Setting up
- Create free accounts on ChatGPT (chatgpt.com) and Claude (claude.ai).
- Use the phone apps so you can work from WhatsApp-style chats.
- Keep a "business facts" note with your prices, delivery areas and policies to paste into prompts.

## Be careful with
- Facts and numbers: always check them.
- Customer data: don't paste private details such as card numbers or full addresses.`,
      resources: [
        { label: "ChatGPT", url: "https://chatgpt.com" },
        { label: "Claude", url: "https://claude.ai" },
      ],
      slides: salesSlides(1, 10),
    },
    {
      week: 2,
      title: "Know your customer",
      notes: `## Your ideal customer
Sales get easier when you know exactly who you are selling to. Write a short "customer profile": age range, location, job, budget, what problem your product solves for them, and what makes them hesitate.

## Using AI to build the profile
- Paste your last 20 customer messages (remove names and numbers) and ask AI: "What patterns do you see in who buys and why?"
- Ask AI to list the top 10 questions and objections this customer might have.
- Ask where this customer spends time online: which apps, groups, hashtags and events.

## Finding more customers
- Turn each objection into a piece of content that answers it.
- Ask AI for 10 partnership ideas with businesses that serve the same customer, for example a bridal boutique and a make-up artist.

## Exercise
Write your customer profile with AI's help and bring it to the next class.`,
      resources: [],
      slides: salesSlides(2, 10),
    },
    {
      week: 3,
      title: "Words that sell",
      notes: `## The simple selling formula
Most good adverts follow **Problem, Promise, Proof, Push**:
- Problem: name the pain ("Tired of wigs that tangle after one week?")
- Promise: what changes ("Our human-hair units stay soft for months.")
- Proof: why believe it (reviews, numbers, before-and-after)
- Push: a clear next step ("Send 'WIG' on WhatsApp to order.")

## Prompts to try
- "Write 5 Instagram captions for [product] using Problem, Promise, Proof, Push. Audience: [profile]."
- "Rewrite this product description so it is shorter, warmer and ends with a call to action."
- "Give me 10 headline ideas for a Black Friday sale on [product]."

## Make it sound like you
Paste 3 of your best past posts and say "Write in this same voice." Always edit the result: add a real customer quote, a local detail or a price.`,
      resources: [],
      slides: salesSlides(3, 9),
    },
    {
      week: 4,
      title: "Reply fast, sell more",
      notes: `## Speed wins sales
Customers who wait more than an hour for a reply often buy elsewhere. AI helps you reply quickly and consistently, even when you are busy.

## Build a reply bank
Ask AI to draft replies to your 15 most common questions: price, delivery time, sizes, payment methods, returns. Save them as WhatsApp Business quick replies.

## Handling tricky messages
- "Too expensive": ask AI for 3 polite replies that explain the value without cutting the price.
- Angry customer: paste the message and ask for a calm, apologetic reply that offers a solution.

## Going further
An AI sales agent can answer on WhatsApp automatically, take orders and collect payment with a Paystack link. JTR builds these for businesses.`,
      resources: [{ label: "WhatsApp Business quick replies", url: "https://faq.whatsapp.com/1791692871267237" }],
      slides: salesSlides(4, 10),
    },
    {
      week: 5,
      title: "Follow up and close",
      notes: `## Most sales happen after the follow-up
Many customers say "I'll get back to you" and never do. A friendly follow-up 1 day, 3 days and 7 days later recovers many of these sales.

## AI for follow-ups
- Ask AI to write a 3-message follow-up sequence that gets gentler each time.
- Keep a simple list (a spreadsheet works) of every lead, the date and what they asked about.

## Talking about price
- Lead with value before the price.
- Offer options: a basic, standard and premium package.
- Use AI to role-play a customer who haggles, and practise your replies.

## Closing
Make paying easy: one clear payment link, clear delivery times, and a thank-you message after purchase that asks for a review.`,
      resources: [],
      slides: salesSlides(5, 10),
    },
    {
      week: 6,
      title: "Your AI sales plan",
      notes: `## Final project
Put everything together into a 30-day AI sales plan for your own business. It should include:
- Your customer profile
- 12 pieces of content (adverts or posts) written with AI and edited by you
- Your reply bank for the top 10 questions
- Your follow-up sequence
- One number you will track, for example enquiries per week or sales per week

## Presenting
In this class each student shares their plan in 3 minutes and gets feedback from Jules and the group.

## After the course
Keep using the AI tutor in the academy for questions, and join the next intake's showcase to share your results.`,
      resources: [],
      slides: salesSlides(6, 9),
    },
  ],
  assignments: [
    { week: 2, title: "Your customer profile", brief: "Write a one-page profile of your ideal customer using AI, then edit it with what you know. Include their top 5 questions or objections." },
    { week: 3, title: "Five adverts", brief: "Write 5 adverts or posts for one product using Problem, Promise, Proof, Push. Share them as a Google Doc or paste them below." },
    { week: 6, title: "Final project: 30-day AI sales plan", brief: "Submit your 30-day AI sales plan (see the week 6 notes for what it must include) as a link to a Google Doc, PDF or slides.", isFinalProject: true },
  ],
  quizzes: [
    {
      week: 1,
      title: "Getting started quiz",
      questions: [
        { question: "What makes an AI prompt work well?", options: ["Keeping it as short as possible", "Giving context: who you are, the customer, the goal and the format", "Using technical words"], answer: 1 },
        { question: "Which of these should you not paste into an AI tool?", options: ["Your product prices", "A customer's card number", "Your delivery areas"], answer: 1 },
        { question: "What should you always do with numbers and facts AI gives you?", options: ["Check them", "Post them straight away", "Delete them"], answer: 0 },
      ],
    },
    {
      week: 3,
      title: "Words that sell quiz",
      questions: [
        { question: "What are the four parts of the selling formula?", options: ["Price, Place, Product, Promotion", "Problem, Promise, Proof, Push", "Hook, Story, Offer, Close"], answer: 1 },
        { question: "How do you make AI writing sound like you?", options: ["Paste some of your past posts and ask it to match the voice", "Ask for a formal tone", "Use more emojis"], answer: 0 },
        { question: "Which is the best call to action?", options: ["Thanks for reading", "Send 'WIG' on WhatsApp to order", "We are the best"], answer: 1 },
      ],
    },
  ],
};

export const animationCourse: CourseTemplate = {
  slug: "animation-videos-with-ai",
  title: "Create Animation Videos with AI",
  tagline: "Turn an idea into a short animated video for ads, social media or teaching.",
  description:
    "A hands-on five-day live course, one two-hour class a day. You'll learn how short animated videos are planned, then use AI tools to write the script, create characters and scenes, animate them, and add voice and music. By the end you'll have finished your own 30 to 60 second animated video. No drawing or editing experience needed.",
  audience: [
    "Business owners who want eye-catching video adverts",
    "Content creators and social media managers",
    "Teachers and trainers who want animated explainers",
  ],
  outcomes: [
    "Plan a short video with a clear message and storyboard",
    "Write scripts with AI",
    "Create consistent characters and scenes with AI image tools",
    "Animate scenes and add motion",
    "Add voiceover, music and captions",
    "Finish and export your own 30 to 60 second animated video",
  ],
  priceNaira: 50000,
  priceUsd: 35,
  format: "live",
  lessonUnit: "day",
  accent: "violet",
  outline: [
    { week: 1, title: "Script and storyboard", summary: "What makes a great short video, then writing the script and storyboard with AI." },
    { week: 2, title: "Characters and scenes", summary: "Creating consistent characters, backgrounds and props." },
    { week: 3, title: "Bring it to life", summary: "Animating scenes, camera moves and transitions." },
    { week: 4, title: "Sound and finishing", summary: "Voiceover, music, captions and editing." },
    { week: 5, title: "Showcase", summary: "Final project: your own 30 to 60 second animated video." },
  ],
  lessons: [
    {
      week: 1,
      title: "Script and storyboard",
      notes: `## The first 3 seconds
On TikTok, Instagram Reels and YouTube Shorts people decide in about 3 seconds whether to keep watching. Start with movement, a question or a surprising image, never with a logo.

## Length and format
- Adverts: 15 to 30 seconds
- Explainers: 45 to 90 seconds
- Vertical 9:16 for phones, square 1:1 for feeds, 16:9 for YouTube and presentations

## The AI toolkit
- Script: ChatGPT or Claude
- Images and characters: Digen AI (text to image)
- Animation: Digen AI (image to video, and lip sync for talking characters) or a simple animation app such as CapCut or Canva
- Voice: Digen AI text to speech, or record your own on your phone
- Editing: CapCut or Canva

## One video, one message
Decide the single thing the viewer should remember or do. Write it in one sentence before anything else.

## Writing the script with AI
Prompt: "Write a 30-second animated video script for [business]. Audience: [who]. Message: [one sentence]. Include a 3-second hook, 3 short scenes and a call to action. Show visuals and narration in two columns."

## Storyboard
A storyboard is a list of frames: what we see, what we hear, and how long it lasts. Ask AI to turn the script into a table with Scene, Visual, Narration and Seconds. A 30-second video usually has 5 to 8 scenes.

## Exercise
Write your script and storyboard for your final project idea. Before the next class, watch 5 animated adverts you like and note what happens in the first 3 seconds.`,
      resources: [
        { label: "Digen AI: text to image", url: "https://digen.ai/image" },
        { label: "Digen AI: image to video", url: "https://digen.ai/en/space" },
        { label: "CapCut", url: "https://www.capcut.com" },
        { label: "Canva", url: "https://www.canva.com" },
      ],
      slides: animationSlides(1, 11),
    },
    {
      week: 2,
      title: "Characters and scenes",
      notes: `## Consistency is everything
The hardest part of AI animation is keeping a character looking the same in every scene. Write a **character sheet**: name, age, skin tone, hair, clothes and colours, and paste exactly the same description into every image prompt.

## Prompting images
Describe: subject, action, setting, style, lighting, framing.
- Example: "A cheerful Nigerian market woman in a yellow ankara dress, waving, in a busy Lagos market, 3D cartoon style, soft morning light, medium shot, vertical 9:16."

## Backgrounds and props
Create backgrounds separately with no characters in them so you can reuse them across scenes.

## Exercise
Create your main character in 3 different poses and 2 backgrounds.`,
      resources: [
        { label: "Digen AI: text to image", url: "https://digen.ai/image" },
      ],
      slides: animationSlides(2, 10),
    },
    {
      week: 3,
      title: "Bring it to life",
      notes: `## Two ways to animate
- **Image to video in Digen AI:** upload a still image and describe the motion ("she waves and smiles, camera slowly pushes in"). Keep each clip short, 3 to 5 seconds.
- **Simple motion in an editor:** in CapCut or Canva, add zoom, pan, slide-in and bounce effects to still images. Fast, cheap and reliable.

## Camera moves that look professional
Slow push-in for emotion, pan across a scene to reveal, quick cut on the beat of the music.

## Transitions
Use simple cuts most of the time. Save flashy transitions for the start and the call to action.

## Exercise
Animate every scene in your storyboard, even roughly.`,
      resources: [
        { label: "Digen AI: image to video", url: "https://digen.ai/en/space" },
      ],
      slides: animationSlides(3, 10),
    },
    {
      week: 4,
      title: "Sound and finishing",
      notes: `## Voiceover
Record in a quiet room with your phone close to your mouth, or use Digen AI text to speech. Speak a little slower than normal. Keep sentences short.

## Music
Use royalty-free music from your editing app's library so your video is not muted on social media. Lower the music under the voice.

## Captions
Most people watch with the sound off. Add auto-captions in CapCut and check every word.

## Final checks
- Is the hook in the first 3 seconds?
- Is the call to action on screen for at least 2 seconds?
- Is the logo at the end, not the start?
- Export in 1080p at the right shape (9:16 for Reels, TikTok and Shorts).`,
      resources: [
        { label: "Digen AI: lip sync and text to speech", url: "https://digen.ai/create" },
      ],
      slides: animationSlides(4, 10),
    },
    {
      week: 5,
      title: "Showcase",
      notes: `## Final project
Submit a finished 30 to 60 second animated video with:
- A clear hook in the first 3 seconds
- At least one consistent character
- Voiceover or captions, plus music
- A call to action

## Showcase class
Everyone plays their video and gets feedback. Jules picks a few to feature on JTR's social media, with your permission.

## After the course
Keep the AI tutor for questions, and share your next videos with the group.`,
      resources: [],
      slides: animationSlides(5, 9),
    },
  ],
  assignments: [
    { week: 1, title: "Script and storyboard", brief: "Submit your video script and a storyboard table (Scene, Visual, Narration, Seconds) for your final project idea." },
    { week: 2, title: "Character sheet", brief: "Submit your character sheet and 3 images of your character in different poses (a Google Drive link is fine)." },
    { week: 5, title: "Final project: your animated video", brief: "Submit a link to your finished 30 to 60 second animated video (Google Drive, YouTube unlisted or TikTok).", isFinalProject: true },
  ],
  quizzes: [
    {
      week: 1,
      title: "Short video basics quiz",
      questions: [
        { question: "When do viewers decide whether to keep watching?", options: ["In the first 3 seconds", "After 30 seconds", "At the end"], answer: 0 },
        { question: "Which shape is best for Reels, TikTok and Shorts?", options: ["16:9", "1:1", "9:16 vertical"], answer: 2 },
        { question: "Where should the logo usually go?", options: ["The very first frame", "At the end", "On every frame, large"], answer: 1 },
      ],
    },
    {
      week: 2,
      title: "Characters quiz",
      questions: [
        { question: "How do you keep a character looking the same across scenes?", options: ["Use a different style each time", "Paste the same character description into every prompt", "Only use one scene"], answer: 1 },
        { question: "Why make backgrounds without characters?", options: ["So you can reuse them across scenes", "Because AI can't draw people", "To make the video longer"], answer: 0 },
      ],
    },
  ],
};

export const agentsCourse: CourseTemplate = {
  slug: "ai-agents-without-code",
  title: "How to Build AI Agents Without Code",
  tagline: "Set up a WhatsApp or Instagram assistant that answers your customers, day and night.",
  description:
    "A practical video course for business owners, in six short lessons you watch whenever it suits you. You build your own AI assistant for WhatsApp or Instagram that answers customer questions, takes orders and sends a payment link, the same way JTR's own WhatsApp sales agent works. No coding: you use Botpress, which is free to start (ManyChat is shown as an easier paid option). If you can use WhatsApp, you can do this course.",
  audience: [
    "Small business owners who get many questions on WhatsApp or Instagram",
    "Shop, salon and food business owners who miss sales at night",
    "Social media managers and freelancers who want to set up assistants for clients",
  ],
  outcomes: [
    "Understand what an AI agent can and can't do for your business",
    "Write a clear 'brain sheet' your assistant answers from",
    "Connect your WhatsApp or Instagram account to Botpress, a free no-code tool",
    "Build an assistant that answers questions in English and Pidgin",
    "Take orders and send a Paystack payment link, without code",
    "Test, launch and improve your assistant safely",
  ],
  priceNaira: 15000,
  priceUsd: 39,
  format: "recorded",
  accent: "blue",
  outline: [
    { week: 1, title: "What an AI agent can do for your business", summary: "Auto-replies versus AI agents, a tour of JTR's WhatsApp agent, and choosing WhatsApp or Instagram." },
    { week: 2, title: "Write your assistant's brain sheet", summary: "Your prices, hours, delivery, policies, tone and what must go to a person." },
    { week: 3, title: "Set up your accounts", summary: "Meta Business, your Instagram or WhatsApp number, and Botpress (free), or ManyChat if you prefer to pay." },
    { week: 4, title: "Build the assistant", summary: "Give the AI your brain sheet, a greeting, quick answers and a 'talk to a person' option." },
    { week: 5, title: "Take orders and payments", summary: "Collect order details, send a Paystack payment link and get alerted for each order." },
    { week: 6, title: "Test, launch and improve", summary: "Test with friends, fix wrong answers, read chats weekly and keep customer data safe." },
  ],
  lessons: [
    {
      week: 1,
      title: "What an AI agent can do for your business",
      notes: `## Auto-reply or AI agent?
- An **auto-reply** sends the same message to everyone ("Thanks, we'll get back to you").
- An **AI agent** reads the customer's question and answers it from your own business details, like a trained sales assistant. It can also take an order, send a payment link and pass the chat to you.

## What JTR's WhatsApp agent does
JTR built a WhatsApp sales agent for small businesses. It answers questions from the business's details only, takes bookings and food orders, sends a Paystack payment link, reminds customers, and hands the chat to a person when a customer complains or asks for a discount. In this course you build a simpler version yourself, without code.

## What an agent should not do
- Make up prices, stock or promises.
- Handle refunds, complaints or discounts: those go to you.
- Pretend to be a person. Customers must be told they are talking to an AI.

## WhatsApp or Instagram?
Start where most of your customers already message you. Both work with Botpress. WhatsApp needs a phone number that is not already on the WhatsApp or WhatsApp Business app; Instagram needs a professional account.

## Exercise
List the 10 questions customers ask you most, with your answer to each.`,
      resources: [
        { label: "Botpress", url: "https://botpress.com" },
        { label: "ManyChat (easier, paid)", url: "https://manychat.com" },
      ],
    },
    {
      week: 2,
      title: "Write your assistant's brain sheet",
      notes: `## The brain sheet
Your assistant is only as good as what you tell it. A "brain sheet" is one page with everything it needs:
- **Business**: name, what you sell, location, opening hours.
- **Products and prices**: your menu or price list, sizes, what's in stock.
- **Delivery**: areas, fees, how long it takes, pickup option.
- **Payment**: how customers pay (for example a Paystack link or transfer).
- **Policies**: returns, swaps, deposits, cancellations.
- **Tone**: friendly, short replies, English or Pidgin (reply in the language the customer uses).
- **Hand to a person**: complaints, refunds, discounts, custom orders, anything not on the sheet.

## Let AI help you write it
Paste your notes into ChatGPT or Claude and ask: "Turn this into a clear brain sheet for a customer service assistant. Use short headings and bullet points. Don't add anything I didn't say."

## Rules for the assistant
Add these lines at the top:
- "Only answer from this sheet. If you don't know, say a person will reply soon."
- "Never invent prices or promise delivery times not on this sheet."
- "Tell the customer in your first reply that you are an AI assistant."

## Exercise
Finish your brain sheet and test it: paste it into ChatGPT or Claude, ask it to act as your assistant, and ask your 10 questions.`,
      resources: [
        { label: "ChatGPT", url: "https://chatgpt.com" },
        { label: "Claude", url: "https://claude.ai" },
      ],
    },
    {
      week: 3,
      title: "Set up your accounts",
      notes: `## What you need
- A **Facebook account** and a free **Meta Business portfolio** (business.facebook.com).
- For Instagram: an Instagram **professional account** (Business or Creator), linked to a Facebook Page.
- For WhatsApp: a phone number that is **not** on the WhatsApp or WhatsApp Business app. A spare SIM is best.

## Botpress (the tool we use)
1. Sign up free at botpress.com. The free plan includes a small monthly AI allowance, enough to start and test.
2. Create a new bot (agent) and give it your business name.
3. Open the **Hub**, add the **WhatsApp** or **Instagram** integration, and follow its connection steps. It walks you through giving access from your Meta account.
4. Use the built-in **test chat** (emulator) to talk to your bot before it goes live.

## ManyChat (easier, but paid)
ManyChat has fewer steps. Instagram works on its free plan, but the AI features and WhatsApp need the **Pro** plan (about $39 a month for new accounts in late 2026; check manychat.com/pricing). Pick it if you would rather pay than set things up.

## WhatsApp message fees
Meta charges small fees for some WhatsApp messages (mostly messages you start, such as reminders). Replies to customers who message you first are mostly free, within limits.

## Exercise
Create your accounts and connect one channel. Take a screenshot of the connected channel.`,
      resources: [
        { label: "Meta Business", url: "https://business.facebook.com" },
        { label: "Botpress", url: "https://botpress.com" },
        { label: "ManyChat pricing", url: "https://manychat.com/pricing" },
      ],
    },
    {
      week: 4,
      title: "Build the assistant",
      notes: `## In Botpress
1. Paste the 3 rules and your tone into the bot's **instructions**.
2. Add your brain sheet to the **knowledge base** (paste the text or upload the document). The bot answers from it.
3. Write a **welcome message** that says the customer is chatting with an AI assistant: "Hi! I'm Amaka's Styles' AI assistant. Ask me about prices, sizes or delivery. Type HUMAN to talk to a person."
4. Add a **"talk to a person"** step: when a customer types HUMAN, complains or asks for a refund or discount, the bot says a person will reply and alerts you (Botpress's human hand-off, or a message to your own WhatsApp).
5. Test in the test chat, then **publish**.

## In ManyChat (paid option)
Set the same welcome message, add the AI to your default reply with your brain sheet as its instructions, add keywords such as MENU and PRICE, and a HUMAN keyword that pauses the automation and alerts you.

## Good habits
- Keep replies short: two or three lines.
- Reply in the customer's language: English or Pidgin.
- When unsure, the assistant says a person will reply, and you get the chat.

## Exercise
Ask your assistant your 10 questions from lesson 1 and note any wrong answers. Fix them in your brain sheet.`,
      resources: [],
    },
    {
      week: 5,
      title: "Take orders and payments",
      notes: `## Taking an order
Teach the assistant to collect, one question at a time: the item, size or quantity, delivery or pickup, address area, and the customer's name. Then it repeats the order with the total.

## A payment link without code
Create a **Paystack Payment Page** (dashboard.paystack.com, Payment Pages) for each product or for a "pay any amount" page. Add the link to your brain sheet: "When the customer confirms the order, send this payment link: ...".

## Know about every order
- Tell the bot to send the full order to you (for example to your own WhatsApp or email) when the customer confirms. In ManyChat, use a notification to yourself or a "New order" tag.
- Check Paystack for the payment before you deliver. Never deliver on a screenshot alone.

## Exercise
Create one Paystack Payment Page and complete a test order from start to finish.`,
      resources: [{ label: "Paystack Payment Pages", url: "https://paystack.com/payment-pages" }],
    },
    {
      week: 6,
      title: "Test, launch and improve",
      notes: `## Test before you launch
Ask 3 friends to chat with your assistant as customers. Ask them to try a normal order, a tricky question, a complaint and Pidgin.

## Launch
Put "Chat with us on WhatsApp" or "DM us" on your posts, bio and flyers.

## Improve every week
Read your chats once a week. Every wrong or weak answer means something is missing from your brain sheet: add it.

## Keep customer data safe (NDPA)
- Tell customers they are chatting with an AI.
- Don't ask for card numbers or passwords in the chat.
- Only keep the details you need for the order.

## Final project
Submit your live assistant (a link or handle), screenshots of 5 test chats, and your brain sheet.

## Want more?
JTR builds full WhatsApp sales agents for businesses, with bookings, orders, payments and reminders.`,
      resources: [],
    },
  ],
  assignments: [
    { week: 2, title: "Your brain sheet", brief: "Submit your assistant's brain sheet (a Google Doc link or paste it below), with the 3 rules at the top." },
    { week: 5, title: "A test order", brief: "Share screenshots of one full test order with your assistant: questions, order summary and payment link." },
    {
      week: 6,
      title: "Final project: your live AI assistant",
      brief: "Submit your live assistant (WhatsApp number or Instagram handle), screenshots of 5 test chats (a normal order, a tricky question, a complaint, Pidgin and a 'talk to a person' request) and your brain sheet.",
      isFinalProject: true,
    },
  ],
  quizzes: [
    {
      week: 1,
      title: "AI agents quiz",
      questions: [
        { question: "What is the difference between an auto-reply and an AI agent?", options: ["There is none", "An AI agent reads the question and answers it from your business details", "An auto-reply is smarter"], answer: 1 },
        { question: "Which should your assistant hand to a person?", options: ["A question about opening hours", "A complaint or a refund request", "A question about delivery fees"], answer: 1 },
        { question: "What must customers be told?", options: ["That they are chatting with an AI assistant", "Nothing", "Your personal phone number"], answer: 0 },
      ],
    },
    {
      week: 4,
      title: "Building quiz",
      questions: [
        { question: "Where does the assistant get its answers?", options: ["From the internet", "From your brain sheet", "It makes them up"], answer: 1 },
        { question: "What should happen when a customer types HUMAN?", options: ["The assistant pauses and you are alerted", "The chat closes", "Nothing"], answer: 0 },
        { question: "When should you deliver an order?", options: ["When the customer sends a screenshot", "After you see the payment in Paystack", "Before payment"], answer: 1 },
      ],
    },
  ],
};

export const courseTemplates = [salesCourse, animationCourse, agentsCourse];
