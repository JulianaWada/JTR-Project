import type { CourseFormat, CourseWeek, QuizQuestion, Resource } from "@/lib/db/schema";

// Starter content for the first two courses. It is copied into the database once (lib/seed.ts);
// after that Jules edits everything from the teacher dashboard. Prices are placeholders.

export type LessonTemplate = { week: number; title: string; notes: string; resources: Resource[] };

export type CourseTemplate = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  audience: string[];
  outcomes: string[];
  priceNaira: number;
  format: CourseFormat;
  accent: "blue" | "violet";
  outline: CourseWeek[];
  lessons: LessonTemplate[];
  assignments: { week: number; title: string; brief: string; isFinalProject?: boolean }[];
  quizzes: { week: number; title: string; questions: QuizQuestion[] }[];
};

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
  priceNaira: 50000,
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
    "A hands-on six-week live course. You'll learn how short animated videos are planned, then use AI tools to write the script, create characters and scenes, animate them, and add voice and music. By the end you'll have finished your own 30 to 60 second animated video. No drawing or editing experience needed.",
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
  format: "live",
  accent: "violet",
  outline: [
    { week: 1, title: "What makes a great short video", summary: "Hooks, length and formats, plus a tour of AI video and animation tools." },
    { week: 2, title: "Script and storyboard", summary: "Writing a script and turning it into a storyboard with AI." },
    { week: 3, title: "Characters and scenes", summary: "Creating consistent characters, backgrounds and props." },
    { week: 4, title: "Bring it to life", summary: "Animating scenes, camera moves and transitions." },
    { week: 5, title: "Sound and finishing", summary: "Voiceover, music, captions and editing." },
    { week: 6, title: "Showcase", summary: "Final project: your own 30 to 60 second animated video." },
  ],
  lessons: [
    {
      week: 1,
      title: "What makes a great short video",
      notes: `## The first 3 seconds
On TikTok, Instagram Reels and YouTube Shorts people decide in about 3 seconds whether to keep watching. Start with movement, a question or a surprising image, never with a logo.

## Length and format
- Adverts: 15 to 30 seconds
- Explainers: 45 to 90 seconds
- Vertical 9:16 for phones, square 1:1 for feeds, 16:9 for YouTube and presentations

## The AI toolkit
- Script: ChatGPT or Claude
- Images and characters: an AI image generator
- Animation: an AI video generator (image-to-video) or a simple animation app such as CapCut or Canva
- Voice: an AI voice generator, or record your own on your phone
- Editing: CapCut or Canva

## Exercise
Watch 5 animated adverts you like and note what happens in the first 3 seconds.`,
      resources: [
        { label: "CapCut", url: "https://www.capcut.com" },
        { label: "Canva", url: "https://www.canva.com" },
      ],
    },
    {
      week: 2,
      title: "Script and storyboard",
      notes: `## One video, one message
Decide the single thing the viewer should remember or do. Write it in one sentence before anything else.

## Writing the script with AI
Prompt: "Write a 30-second animated video script for [business]. Audience: [who]. Message: [one sentence]. Include a 3-second hook, 3 short scenes and a call to action. Show visuals and narration in two columns."

## Storyboard
A storyboard is a list of frames: what we see, what we hear, and how long it lasts. Ask AI to turn the script into a table with Scene, Visual, Narration and Seconds. A 30-second video usually has 5 to 8 scenes.

## Exercise
Write your script and storyboard for your final project idea.`,
      resources: [],
    },
    {
      week: 3,
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
      resources: [],
    },
    {
      week: 4,
      title: "Bring it to life",
      notes: `## Two ways to animate
- **Image-to-video AI:** upload a still image and describe the motion ("she waves and smiles, camera slowly pushes in"). Keep each clip short, 3 to 5 seconds.
- **Simple motion in an editor:** in CapCut or Canva, add zoom, pan, slide-in and bounce effects to still images. Fast, cheap and reliable.

## Camera moves that look professional
Slow push-in for emotion, pan across a scene to reveal, quick cut on the beat of the music.

## Transitions
Use simple cuts most of the time. Save flashy transitions for the start and the call to action.

## Exercise
Animate every scene in your storyboard, even roughly.`,
      resources: [],
    },
    {
      week: 5,
      title: "Sound and finishing",
      notes: `## Voiceover
Record in a quiet room with your phone close to your mouth, or use an AI voice. Speak a little slower than normal. Keep sentences short.

## Music
Use royalty-free music from your editing app's library so your video is not muted on social media. Lower the music under the voice.

## Captions
Most people watch with the sound off. Add auto-captions in CapCut and check every word.

## Final checks
- Is the hook in the first 3 seconds?
- Is the call to action on screen for at least 2 seconds?
- Is the logo at the end, not the start?
- Export in 1080p at the right shape (9:16 for Reels, TikTok and Shorts).`,
      resources: [],
    },
    {
      week: 6,
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
    },
  ],
  assignments: [
    { week: 2, title: "Script and storyboard", brief: "Submit your video script and a storyboard table (Scene, Visual, Narration, Seconds) for your final project idea." },
    { week: 3, title: "Character sheet", brief: "Submit your character sheet and 3 images of your character in different poses (a Google Drive link is fine)." },
    { week: 6, title: "Final project: your animated video", brief: "Submit a link to your finished 30 to 60 second animated video (Google Drive, YouTube unlisted or TikTok).", isFinalProject: true },
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
      week: 3,
      title: "Characters quiz",
      questions: [
        { question: "How do you keep a character looking the same across scenes?", options: ["Use a different style each time", "Paste the same character description into every prompt", "Only use one scene"], answer: 1 },
        { question: "Why make backgrounds without characters?", options: ["So you can reuse them across scenes", "Because AI can't draw people", "To make the video longer"], answer: 0 },
      ],
    },
  ],
};

export const courseTemplates = [salesCourse, animationCourse];
