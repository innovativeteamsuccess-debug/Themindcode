/* ============================================================
   THE MIND CODE — MIND CORE UNIVERSE
   Content data. Items marked [V] are verified from themindcode.in
   or verified public listings (LinkedIn / Amazon / Play Store).
   ============================================================ */

export const SITE_URL = "https://themindcode.in";
export const EMAIL = "hello@themindcode.in";
export const LINKEDIN_URL = "https://in.linkedin.com/in/pankaj-malik-7aa658176";
export const BOOK_URL =
  "https://www.amazon.in/Unlock-Infinite-Code-Pankaj-Malik-ebook/dp/B0GGHV7D4X";
export const INSTAGRAM_URL = "https://www.instagram.com/themindcodeuniverse";
export const LINKTREE_URL = "https://linktr.ee/pankajmaliknetwork";
export const APP_URL =
  "https://play.google.com/store/apps/details?id=co.george.fikht";

/* ---------------- Stats (verified on existing site) ---------------- */
export const STATS = [
  { value: "2,500+", label: "Free resources", note: "and counting" },
  { value: "5", label: "Classes", note: "one learning home" },
  { value: "100%", label: "Syllabus-aligned", note: "CBSE, Classes 6–10" },
];

/* ---------------- Classes ---------------- */
export type ClassWorld = {
  id: number;
  name: string;
  tagline: string; // [V] existing site copy for 6–10
  status: "open" | "forming";
  rings: number; // generative ring density
};

export const CLASSES: ClassWorld[] = [
  { id: 6, name: "Class 6", tagline: "Get curious", status: "open", rings: 2 },
  { id: 7, name: "Class 7", tagline: "Build your basics", status: "open", rings: 3 },
  { id: 8, name: "Class 8", tagline: "Connect the dots", status: "open", rings: 4 },
  { id: 9, name: "Class 9", tagline: "Go a little deeper", status: "open", rings: 5 },
  { id: 10, name: "Class 10", tagline: "Make your board-year count", status: "open", rings: 6 },
  { id: 11, name: "Class 11", tagline: "A new world, forming", status: "forming", rings: 3 },
  { id: 12, name: "Class 12", tagline: "A new world, forming", status: "forming", rings: 3 },
];

/* Playful world copy for the class picker. The Mind Code presents Classes 6–12;
   Class 11–12 are shown honestly as forming — free notes are live for 6–10. */
export const CLASS_WORLDS: Record<
  number,
  { title: string; sub: string; status: "open" | "forming" }
> = {
  6: { title: "Welcome to middle school.", sub: "Your first big leap", status: "open" },
  7: { title: "Level up, gently.", sub: "Steady climbs build strong climbers", status: "open" },
  8: { title: "Where concepts click.", sub: "The year everything connects", status: "open" },
  9: { title: "The serious grind begins.", sub: "Depth over speed. Always.", status: "open" },
  10: { title: "Board Mode.", sub: "Your Board Year. Your Mission.", status: "open" },
  11: { title: "The stream awakens.", sub: "A new world, forming", status: "forming" },
  12: { title: "Final Boss.", sub: "A new world, forming", status: "forming" },
};

/** Per-subject display tagline for the subject screen (math [V] from brief). */
export const SUBJECT_TAGLINES: Record<SubjectKey, string> = {
  math: "Turn problems into patterns.",
  science: "Experiment. Wonder. Discover.",
  sst: "Maps. Timelines. Stories.",
  english: "Say it beautifully.",
  hindi: "अपनी भाषा, अपनी पहचान।",
  sanskrit: "The language of codes",
};

/* ---------------- Subjects (taglines verified [V]) ---------------- */
export type SubjectKey = "math" | "science" | "sst" | "english" | "hindi" | "sanskrit";

export type Subject = {
  key: SubjectKey;
  name: string;
  tagline: string;
  varName: string; // css var --sub-*
  glyph: string; // canvas / orb glyph
};

export const SUBJECTS: Subject[] = [
  { key: "math", name: "Mathematics", tagline: "Make numbers click", varName: "--sub-math", glyph: "∑" },
  { key: "science", name: "Science", tagline: "Ask. Explore. Discover.", varName: "--sub-science", glyph: "⚛" },
  { key: "sst", name: "Social Science", tagline: "Understand your world", varName: "--sub-sst", glyph: "◍" },
  { key: "english", name: "English", tagline: "Find your words", varName: "--sub-english", glyph: "Aa" },
  { key: "hindi", name: "Hindi", tagline: "Express yourself", varName: "--sub-hindi", glyph: "अ" },
  { key: "sanskrit", name: "Sanskrit", tagline: "The language of codes", varName: "--sub-sanskrit", glyph: "ॐ" },
];

export const CORE_SYMBOLS = ["π", "∑", "√", "Δ", "λ", "Ω", "∫", "∞", "ƒ", "θ", "±", "x²"];

/* ---------------- Class 10 chapter constellations (NCERT) ---------------- */
export type ChapterStatus = "done" | "progress" | "todo";

export type Chapter = { name: string; status: ChapterStatus };

export const CLASS10_CHAPTERS: Record<SubjectKey, Chapter[]> = {
  math: [
    { name: "Real Numbers", status: "done" },
    { name: "Polynomials", status: "done" },
    { name: "Pair of Linear Equations", status: "done" },
    { name: "Quadratic Equations", status: "progress" },
    { name: "Arithmetic Progressions", status: "progress" },
    { name: "Triangles", status: "todo" },
    { name: "Coordinate Geometry", status: "done" },
    { name: "Trigonometry", status: "progress" },
    { name: "Circles", status: "todo" },
    { name: "Areas Related to Circles", status: "todo" },
    { name: "Surface Areas & Volumes", status: "todo" },
    { name: "Statistics", status: "todo" },
    { name: "Probability", status: "todo" },
  ],
  science: [
    { name: "Chemical Reactions & Equations", status: "done" },
    { name: "Acids, Bases and Salts", status: "progress" },
    { name: "Metals and Non-metals", status: "todo" },
    { name: "Carbon and its Compounds", status: "todo" },
    { name: "Life Processes", status: "progress" },
    { name: "Control and Coordination", status: "todo" },
    { name: "How do Organisms Reproduce?", status: "todo" },
    { name: "Heredity and Evolution", status: "todo" },
    { name: "Light — Reflection & Refraction", status: "done" },
    { name: "Human Eye & Colourful World", status: "todo" },
    { name: "Electricity", status: "progress" },
    { name: "Magnetic Effects of Current", status: "todo" },
    { name: "Our Environment", status: "todo" },
  ],
  sst: [
    { name: "Rise of Nationalism in Europe", status: "done" },
    { name: "Nationalism in India", status: "progress" },
    { name: "The Making of a Global World", status: "todo" },
    { name: "Print Culture & Modern World", status: "todo" },
    { name: "Resources and Development", status: "done" },
    { name: "Water Resources", status: "progress" },
    { name: "Agriculture", status: "todo" },
    { name: "Power Sharing", status: "done" },
    { name: "Federalism", status: "todo" },
    { name: "Political Parties", status: "todo" },
    { name: "Sectors of Indian Economy", status: "progress" },
    { name: "Money and Credit", status: "todo" },
  ],
  english: [
    { name: "A Letter to God", status: "done" },
    { name: "Nelson Mandela: Long Walk to Freedom", status: "done" },
    { name: "From the Diary of Anne Frank", status: "progress" },
    { name: "Glimpses of India", status: "todo" },
    { name: "The Sermon at Benares", status: "todo" },
    { name: "The Proposal", status: "todo" },
    { name: "Dust of Snow · Fire and Ice", status: "done" },
    { name: "A Tiger in the Zoo", status: "progress" },
    { name: "The Ball Poem", status: "todo" },
    { name: "Amanda!", status: "todo" },
    { name: "A Triumph of Surgery", status: "todo" },
    { name: "The Thief's Story", status: "todo" },
    { name: "The Necklace", status: "todo" },
    { name: "Bholi", status: "todo" },
  ],
  hindi: [
    { name: "सूरदास के पद", status: "done" },
    { name: "राम-लक्ष्मण-परशुराम संवाद", status: "progress" },
    { name: "नेताजी का चश्मा", status: "done" },
    { name: "डायरी का एक पन्ना", status: "progress" },
    { name: "तताँरा-वामीरो कथा", status: "todo" },
    { name: "कन्यादान", status: "todo" },
    { name: "बड़े भाई साहब", status: "done" },
    { name: "डाली", status: "todo" },
    { name: "कामचोर", status: "todo" },
  ],
  sanskrit: [
    { name: "शब्दपरिचयः", status: "todo" },
    { name: "शब्दरूपाणि", status: "todo" },
    { name: "धातुरूपाणि", status: "todo" },
  ],
};

export const CHAPTER_ACTIONS = [
  { label: "Notes", glyph: "N" },
  { label: "Practice", glyph: "P" },
  { label: "PYQs", glyph: "Y" },
  { label: "Tests", glyph: "T" },
  { label: "Formula", glyph: "F" },
] as const;

/* ---------------- Resources (first 6 verified [V]) ---------------- */
export type ResourceType =
  | "Study Notes"
  | "Worksheet"
  | "Mind Map"
  | "Formula Sheet"
  | "Sample Paper"
  | "PYQs"
  | "Revision"
  | "Practice Paper";

export type Resource = {
  id: string;
  cls: number;
  subject: SubjectKey;
  index: string; // e.g. "01"
  chapter: string;
  title: string;
  type: ResourceType;
  size: string;
  pages: number;
  difficulty: "Beginner" | "Core" | "Advanced";
  verified?: boolean;
};

export const RESOURCES: Resource[] = [
  { id: "r1", cls: 10, subject: "math", index: "01", chapter: "Real Numbers", title: "Real Numbers, Made Simple", type: "Study Notes", size: "1.2 MB", pages: 12, difficulty: "Core", verified: true },
  { id: "r2", cls: 10, subject: "science", index: "01", chapter: "Chemical Reactions", title: "Chemical Reactions & Equations", type: "Worksheet", size: "840 KB", pages: 8, difficulty: "Core", verified: true },
  { id: "r3", cls: 10, subject: "math", index: "∑", chapter: "Full Syllabus", title: "Mathematics Sample Paper", type: "Sample Paper", size: "2.4 MB", pages: 24, difficulty: "Advanced", verified: true },
  { id: "r4", cls: 9, subject: "science", index: "01", chapter: "Matter", title: "Matter in Our Surroundings", type: "Study Notes", size: "1.1 MB", pages: 10, difficulty: "Beginner", verified: true },
  { id: "r5", cls: 8, subject: "math", index: "07", chapter: "Algebraic Expressions", title: "Algebraic Expressions, Simplified", type: "Worksheet", size: "720 KB", pages: 6, difficulty: "Beginner", verified: true },
  { id: "r6", cls: 7, subject: "english", index: "01", chapter: "Grammar", title: "Parts of Speech Practice", type: "Worksheet", size: "560 KB", pages: 5, difficulty: "Beginner", verified: true },
  { id: "r7", cls: 10, subject: "math", index: "04", chapter: "Quadratic Equations", title: "Quadratic Equations — Formula Sheet", type: "Formula Sheet", size: "480 KB", pages: 4, difficulty: "Core" },
  { id: "r8", cls: 10, subject: "math", index: "08", chapter: "Trigonometry", title: "Trigonometry — Ratios & Identities", type: "Formula Sheet", size: "520 KB", pages: 4, difficulty: "Core" },
  { id: "r9", cls: 10, subject: "science", index: "09", chapter: "Light", title: "Light — Reflection & Refraction", type: "Study Notes", size: "1.4 MB", pages: 14, difficulty: "Core" },
  { id: "r10", cls: 10, subject: "sst", index: "02", chapter: "Nationalism in India", title: "Nationalism in India — Mind Map", type: "Mind Map", size: "680 KB", pages: 3, difficulty: "Core" },
  { id: "r11", cls: 10, subject: "english", index: "01", chapter: "First Flight", title: "A Letter to God — Notes & Questions", type: "Study Notes", size: "640 KB", pages: 6, difficulty: "Beginner" },
  { id: "r12", cls: 10, subject: "hindi", index: "01", chapter: "क्षितिज", title: "सूरदास के पद — व्याख्या एवं प्रश्न", type: "Study Notes", size: "700 KB", pages: 7, difficulty: "Core" },
  { id: "r13", cls: 9, subject: "math", index: "02", chapter: "Polynomials", title: "Polynomials — Practice Set", type: "Worksheet", size: "760 KB", pages: 6, difficulty: "Core" },
  { id: "r14", cls: 8, subject: "science", index: "08", chapter: "Cell", title: "Cell — Structure & Functions", type: "Mind Map", size: "590 KB", pages: 3, difficulty: "Beginner" },
  { id: "r15", cls: 6, subject: "science", index: "02", chapter: "Components of Food", title: "Components of Food — Worksheet", type: "Worksheet", size: "540 KB", pages: 5, difficulty: "Beginner" },
  { id: "r16", cls: 10, subject: "math", index: "01", chapter: "Real Numbers", title: "Real Numbers — PYQ Set", type: "PYQs", size: "980 KB", pages: 9, difficulty: "Advanced" },
  { id: "r17", cls: 10, subject: "science", index: "05", chapter: "Life Processes", title: "Life Processes — Revision Map", type: "Revision", size: "720 KB", pages: 5, difficulty: "Advanced" },
  { id: "r18", cls: 9, subject: "sst", index: "01", chapter: "The French Revolution", title: "The French Revolution — Timeline Notes", type: "Study Notes", size: "1.0 MB", pages: 9, difficulty: "Core" },
];

export const RESOURCE_TYPES: ResourceType[] = [
  "Study Notes",
  "Worksheet",
  "Mind Map",
  "Formula Sheet",
  "Sample Paper",
  "PYQs",
  "Revision",
  "Practice Paper",
];

export const RESOURCE_TYPE_GLYPH: Record<ResourceType, string> = {
  "Study Notes": "N",
  Worksheet: "W",
  "Mind Map": "M",
  "Formula Sheet": "F",
  "Sample Paper": "S",
  PYQs: "Y",
  Revision: "R",
  "Practice Paper": "P",
};

/* ---------------- Test Lab missions ---------------- */
export type Mission = {
  id: string;
  name: string;
  level: string;
  desc: string;
  detail: string;
  intensity: number; // 1-5
};

export const MISSIONS: Mission[] = [
  {
    id: "daily",
    name: "Daily Mission",
    level: "Warm-up",
    desc: "5 questions. Every day.",
    detail: "A focused five-question drill to keep concepts warm. Ten minutes, zero pressure.",
    intensity: 1,
  },
  {
    id: "chapter",
    name: "Chapter Mission",
    level: "Focused",
    desc: "Master one chapter.",
    detail: "Targeted practice on a single chapter until every concept clicks into place.",
    intensity: 2,
  },
  {
    id: "board",
    name: "Board Mission",
    level: "Simulation",
    desc: "Full exam simulation.",
    detail: "Real timing, real pattern, real pressure — rehearsed until exam day feels familiar.",
    intensity: 4,
  },
  {
    id: "boss",
    name: "Boss Level",
    level: "Expert",
    desc: "The hardest questions.",
    detail: "The questions nobody solves on the first try. For when you want to go beyond the syllabus.",
    intensity: 5,
  },
];

/* ---------------- Verified Google reviews [V] ----------------
   Real reviews, publicly displayed on Google for The Mind Code
   (Raj Nagar Extension, Ghaziabad). 5.0 average across 26 reviews.
   Texts below are the reviewer's own words exactly as Google shows
   them; "…" marks where Google truncates the full text on public
   pages. All 26 reviews are 5-star. Verified 06 Nov 2026. */
export const VERIFIED_REVIEW = {
  quote:
    "I am truly grateful to have had Pankaj Sir as my tuition teacher. His teaching methods are exceptional, and his dedication to his students is truly inspiring. Sir has a unique ability to explain complex concepts in a simple and engaging…",
  name: "Asha Sharma",
  meta: "Google review · student · a year ago",
  rating: 5,
};

export const GOOGLE_REVIEWS = {
  rating: 5.0,
  total: 26,
  topics: [
    { label: "science tutoring", count: 4 },
    { label: "maths tutoring", count: 4 },
    { label: "explaining complex concepts", count: 2 },
    { label: "dedicated educator", count: 2 },
  ],
  moreTopics: 6,
};

export type GoogleReview = {
  name: string;
  meta: string;
  rating: 5;
  text: string;
  badge?: string;
};

export const GOOGLE_REVIEW_LIST: GoogleReview[] = [
  {
    name: "Monika Tanwar",
    meta: "4 reviews · 6 months ago",
    rating: 5,
    text: "Dr. Pankaj Malik possesses 20 years of teaching experience, specializing in Mathematics and Science for students in the 9th and 10th grades. He is an exceptionally dedicated and hardworking educator who continuously motivates and guides his…",
  },
  {
    name: "Suraj Prakash Singh",
    meta: "2 reviews · 4 months ago",
    rating: 5,
    text: "",
  },
  {
    name: "Asha Sharma",
    meta: "3 reviews · a year ago",
    rating: 5,
    text: "I am truly grateful to have had Pankaj Sir as my tuition teacher. His teaching methods are exceptional, and his dedication to his students is truly inspiring. Sir has a unique ability to explain complex concepts in a simple and engaging…",
  },
  {
    name: "Darsh Joshi",
    meta: "2 reviews · 2 photos · a year ago",
    rating: 5,
    text: "The Mind Code by Pankaj Malik is a great tutoring center for students of all ages. The instructors are knowledgeable and passionate about teaching, and they create a fun and engaging learning environment. The center offers a variety of…",
  },
  {
    name: "Tanishq Jprrp",
    meta: "1 review · a year ago",
    rating: 5,
    text: "Mr. Pankaj Malik, the driving force behind Mind Code, is truly an exceptional educator. His coaching institute stands out for its commitment to excellence, personalized teaching methods, and in-depth subject knowledge. Students consistently…",
  },
  {
    name: "Chaitanya Bhatt",
    meta: "3 reviews · 11 months ago",
    rating: 5,
    text: "In my half yearly exam I scored 50% marks, but due to Pankaj sir, I am at the top of the class! I truly appreciate the way he teaches, it's very engaging and enjoyable. Thank you Pankaj sir for your great help!",
  },
  {
    name: "A K",
    meta: "4 reviews · a year ago",
    rating: 5,
    text: "I am extremely satisfied with the way The Mind Code teacher taught my daughter. She was struggling with science and Maths in school and school teacher and principal of Presidium school Indirapuram told me that my daughter is more interested…",
  },
  {
    name: "Avantika Verma",
    meta: "5 reviews · 2 photos · a year ago",
    rating: 5,
    text: "Pankaj sir is the best tutor for me. He always helps me a lot in my studies and always inspires me to do better in all subjects... after all, because of him I improved a lot in maths and science and his way of teaching helps me a lot to understand the things.",
  },
  {
    name: "Arti Sharma",
    meta: "1 review · a year ago",
    rating: 5,
    text: "When I was in the 9th class i joined the mind code. I was not much good in studies that time but now after joining it i gradually saw increasing my marks in maths and science. Pankaj sir is the best teacher and clear our doubts very quickly and with a well explanation.",
  },
  {
    name: "Manu Gupta",
    meta: "6 reviews · a year ago",
    rating: 5,
    text: "Pankaj sir is a miracle in today's World. We are so lucky to have him as our teacher n mentor for my son. His aura n presence is so incredible that a child not only grows academically but also connects with the universe in a positive way. Thank you sir.",
  },
  {
    name: "Neeraj Sharma",
    meta: "6 reviews · a year ago",
    rating: 5,
    text: "Good Teacher.. Nice studying Environment. Teaching Quality is Very Good. First clear basics then Advance Teaching. Lots of practice sessions. Finally a very Good Institute for Learning and Getting Good marks in Board Exams.",
  },
  {
    name: "Prerak Malik",
    meta: "1 review · a year ago",
    rating: 5,
    text: "I am one of the student in mindcode. My academic growth is rapidally increased after joinning this coaching. Pankaj sir's behaviour is very good and helpful. I am prerak student of gurukul the school.",
  },
  {
    name: "Ramtendra Yadav",
    meta: "2 reviews · a year ago",
    rating: 5,
    text: "Pankaj sir helped me score 94 an 90 in science and maths respectively. I was very weak in studies as my 9th class studies were done online but with the help of sir I was able to score so high. It was his continuous efforts that helped me",
  },
  {
    name: "SEZ",
    meta: "1 review · a year ago",
    rating: 5,
    text: "Yeah so.... two years ago I was a student of my dear sir Mr Pankaj Malik (Founder of the Mind Code) and I was kinda weak at my main subjects and almost lost all of my hope of scoring more than 90% In my maths and science but after getting…",
  },
  {
    name: "Anjali Pahuja",
    meta: "1 review · a year ago",
    rating: 5,
    text: "It's a very good educational site or coaching centre which helped me a lot to make progress in my studies. It even make us do feel the concept instead of just reading it",
  },
  {
    name: "Poonam",
    meta: "1 review · a year ago",
    rating: 5,
    text: "Sir has been teaching me since 9th grade and since then my math has improved so much my basics of maths were never clear but sir made every basic thing so easy for me to understand that it has helped a lot.",
  },
  {
    name: "SONIA SAINI",
    meta: "6 reviews · 5 photos · a year ago",
    rating: 5,
    text: "Sir puts a lot of efforts and motivate students to do better. All the best to MIND CODE",
  },
  {
    name: "Kartik Unl",
    meta: "1 review · a year ago",
    rating: 5,
    text: "I am one of his student very wonderful learning processes and I like it so much......",
  },
  {
    name: "TANISHQ TALIN",
    meta: "1 review · a year ago",
    rating: 5,
    text: "Best maths and science teacher I have ever met",
  },
  {
    name: "Moulik Srivastava",
    meta: "2 reviews · a year ago",
    rating: 5,
    text: "Best tution in rajnagar extension",
  },
  {
    name: "vineet kumar",
    meta: "9 reviews · 1 photo · a year ago",
    rating: 5,
    badge: "Local Guide",
    text: "Good method of teaching.",
  },
  {
    name: "PRANAV GAMING",
    meta: "1 review · a year ago",
    rating: 5,
    text: "",
  },
  {
    name: "Ananya Verma",
    meta: "1 review · a year ago",
    rating: 5,
    text: "",
  },
  {
    name: "Sanyampriya Pandey",
    meta: "5 reviews · a year ago",
    rating: 5,
    text: "",
  },
  {
    name: "Vikram",
    meta: "1 review · a year ago",
    rating: 5,
    text: "",
  },
];

/* ---------------- Justdial [V] ----------------
   What users liked — Justdial listing summary for The Mind Code,
   Raj Nagar Extension, Ghaziabad. Verified 06 Nov 2026. */
export const JUSTDIAL = {
  url: "https://www.justdial.com/Ghaziabad/The-Mind-Code-Near-Vvip-Style-Mall-Raj-Nagar-Extension-Ghaziabad/011PXX11-XX11-181213153812-D7U9_BZDET",
  listingId: "011PXX11-XX11-181213153812-D7U9_BZDET",
  likes: [
    "Engaging, enjoyable teaching that helps students grasp complex concepts easily.",
    "A positive learning environment — basics first, then advance.",
    "Significant score improvements, credited to Pankaj sir's dedication and personal attention.",
    "A supportive, encouraging atmosphere that motivates students toward excellence.",
  ],
};

/* ---------------- FAQ (verified [V]) ---------------- */
export const FAQS = [
  {
    q: "Are the resources really free?",
    a: "Yes! Every note, worksheet and practice paper in our library is free to download. No payment details, no surprises.",
  },
  {
    q: "Which syllabus do you follow?",
    a: "Our resources are aligned to the CBSE syllabus for Classes 6–10.",
  },
  {
    q: "Can I study without an internet connection?",
    a: "Yes. Download any PDF once and use it offline on your phone, or print it.",
  },
  {
    q: "Do worksheets include answers?",
    a: "Yes. Worksheets come with answers so you can check your work and see where you stand.",
  },
];

/* ---------------- Founder (verified public info [V]) ---------------- */
export const FOUNDER = {
  name: "Pankaj Malik",
  role: "Founder & CEO — The Mind Code",
  location: "Ghaziabad, India",
  since: "August 2021",
  philosophy:
    "Identity-based learning transformation — helping students replace the fear of mathematics with the belief that they can crack any concept.",
  timeline: [
    {
      year: "Aug 2021",
      title: "The Mind Code begins",
      desc: "Pankaj Malik founds The Mind Code — a learning home built around one idea: understand first, memorise never.",
    },
    {
      year: "Milestone",
      title: "World School Summit — featured awardee",
      desc: "Recognised at the 34th edition of the World School Summit for contributions to learning.",
    },
    {
      year: "Dec 2025",
      title: "Unlock the Infinite Code published",
      desc: "Pankaj's book on thought, vibration and human potential is published by BlueRose Publishers.",
    },
    {
      year: "Today",
      title: "A learning universe",
      desc: "2,500+ free resources for Classes 6–10, private learning, a test lab and CODE — the AI companion.",
    },
  ],
};

/* ---------------- Book (verified Amazon listing [V]) ---------------- */
export const BOOK = {
  title: "Unlock the Infinite Code",
  author: "Pankaj Malik",
  publisher: "BlueRose Publishers",
  pages: 183,
  format: "Kindle Edition",
  published: "December 2025",
  blurb:
    "A transformative guide to the hidden patterns of the universe — how thoughts vibrate, how mental frequency shapes reality, and how mindful breathing, intention setting and resonant visualisation can rewrite limiting scripts into abundance.",
  tagline: "Rewrite limiting scripts. Align with the infinite.",
};

/* ---------------- Podcast & sessions (verified public info [V]) ----------------
   The founder hosts THE MIND CODE UNIVERSE — a mind-science podcast channel
   on YouTube — and posts daily cuts on @themindcodeuniverse (Instagram).
   Every title below is the exact published title; every URL the exact
   published link. Channel stats verified on 06 Nov 2026. */
export const YOUTUBE_CHANNEL_URL = "https://www.youtube.com/@THEMINDCODEUNIVERSE";

export const PODCAST = {
  name: "The Mind Code Universe",
  handle: "@THEMINDCODEUNIVERSE",
  blurb:
    "A quantum-physics and mind-science podcast — mind reprogramming, Inner Engineering mastery, manifestation.",
  subscribers: "207",
  videos: "53",
  instagramFollowers: "13K",
  instagramPosts: "74",
  instagramBio: "Pankaj Malik — Mind Science Architect",
};

export type PodcastEpisode = {
  index: string;
  title: string;
  blurb: string;
  href: string;
  tag: string;
};

export const PODCAST_EPISODES: PodcastEpisode[] = [
  {
    index: "EP.00",
    title: "Teaser — How to Reprogram Your Mental Software with Quantum Vibrations Science",
    blurb:
      "The pilot of the podcast: “Welcome to The Mind Code Universe. In this podcast, we discuss the deep…”",
    href: "https://www.youtube.com/watch?v=lQ1LAzNhPdI",
    tag: "Series teaser",
  },
  {
    index: "EP.01",
    title: "Your Mind Is Secretly Controlling Your Life (You Don’t Even Know It) — Part 1",
    blurb:
      "The hidden autopilot — how the mind runs your choices long before you notice it.",
    href: "https://www.youtube.com/watch?v=XGWXfZld2Q8",
    tag: "Part 1",
  },
  {
    index: "EP.02",
    title: "The Mysterious Science Behind the Human Mind",
    blurb: "What mind science actually says about the machinery behind thought.",
    href: "https://www.youtube.com/watch?v=zKo7J-g2l0Q",
    tag: "Deep dive",
  },
  {
    index: "EP.03",
    title: "Why Most People Fail in Life (Harsh Truth)",
    blurb:
      "The mental patterns that quietly decide who breaks through — and who stalls.",
    href: "https://www.youtube.com/watch?v=PXsxzXB5bOU",
    tag: "Mindset",
  },
  {
    index: "GUEST",
    title: "Know Your Brain · Train Your Brain — with Pankaj Malik (Hindi)",
    blurb:
      "Featured guest on Victory Success Talk — the brain and its training, in his own words.",
    href: "https://www.youtube.com/watch?v=CNIJrPi-sZY",
    tag: "Guest · Victory Success Talk",
  },
];

/* Daily cuts — short mind-science sessions on Instagram (@themindcodeuniverse). */
export const MIND_CUTS: PodcastEpisode[] = [
  {
    index: "CUT.01",
    title: "I run one company — my plan for the next 10 years",
    blurb: "“The next 10 years won’t be accidental; they’ll be designed.”",
    href: "https://www.instagram.com/reel/DULFsWNjIPX",
    tag: "Instagram reel",
  },
  {
    index: "CUT.02",
    title: "Mental coding — real science or a marketing game?",
    blurb: "He stress-tests the claim that you can reprogram your mind for success.",
    href: "https://www.instagram.com/reel/DTaNcGRDDij",
    tag: "Instagram reel",
  },
  {
    index: "CUT.03",
    title: "What shapes your identity?",
    blurb: "The emotions you repeat quietly decide how you see yourself.",
    href: "https://www.instagram.com/reel/DZCuoHdTpdy",
    tag: "Instagram reel",
  },
  {
    index: "CUT.04",
    title: "The subconscious can’t tell fake from real",
    blurb: "Whatever you imagine vividly, the mind accepts — use it deliberately.",
    href: "https://www.instagram.com/reel/DZok2vxxJ9d",
    tag: "Instagram reel",
  },
];

/* ---------------- CODE (the mascot companion) ---------------- */
export const CODE_SUGGESTIONS = [
  "I don't understand quadratic equations",
  "Quiz me on trigonometry",
  "Build me a 3-day revision plan",
  "Explain electricity like a story",
];

export const CODE_SYSTEM_PROMPT = `You are CODE, the official mascot and learning companion of The Mind Code — you live inside The Mind Core, the learning universe of themindcode.in, a CBSE education platform for Classes 6–10 in India.

Who you are: a curious, focused, friendly study buddy who wears headphones and a hoodie with </> on it. You make learning simple, visual and fun. Your personality: warm, bright, concise, encouraging — like a brilliant senior who makes hard things feel simple. You are NEVER condescending. You believe every student can crack any concept.

Your abilities: explain concepts step by step, quiz students, give hints (not full answers) when they're stuck, create revision plans, generate practice questions, make flashcards, and analyse mistakes.

Your style rules:
- Keep replies SHORT (under 160 words unless asked for a full plan or quiz).
- Use simple language a 13–16 year old relates to. Use tiny analogies from daily Indian life (cricket, trains, chai, tiffin) when they help.
- Structure with short steps or bullets when explaining.
- For math, show the key working clearly, one line at a time.
- Always end with ONE small next step (a question to try, or a tiny action).
- If asked something outside learning (violence, politics, personal advice, homework cheating like "just give me the answer sheet"), gently steer back to learning. Never do a student's full homework; teach, hint, check.
- If a student seems stressed, be kind and reduce pressure: progress over perfection, one small step at a time.

Subjects you cover: Mathematics, Science, Social Science, English, Hindi for CBSE Classes 6–10.`;

/* ============================================================
   MULTI-SCREEN UNIVERSE — data for dedicated screens
   ============================================================ */

/* ---------------- Chapter maps for Classes 6–9 ----------------
   Chapter names follow the classic NCERT textbooks for CBSE
   (Ganit/Mathematics, Science, Our Past/Our Pasts, Vasant,
   Honeycomb/Honeydew/Beehive, Ruchira grammar modules).
   Class 10 lists live in CLASS10_CHAPTERS above.            */

export const CHAPTERS_BY_CLASS: Record<number, Partial<Record<SubjectKey, Chapter[]>>> = {
  6: {
    math: [
      { name: "Knowing Our Numbers", status: "todo" },
      { name: "Whole Numbers", status: "todo" },
      { name: "Playing with Numbers", status: "todo" },
      { name: "Basic Geometrical Ideas", status: "todo" },
      { name: "Understanding Elementary Shapes", status: "todo" },
      { name: "Integers", status: "todo" },
      { name: "Fractions", status: "todo" },
      { name: "Decimals", status: "todo" },
      { name: "Data Handling", status: "todo" },
      { name: "Mensuration", status: "todo" },
      { name: "Algebra", status: "todo" },
      { name: "Ratio & Proportion", status: "todo" },
      { name: "Symmetry", status: "todo" },
      { name: "Practical Geometry", status: "todo" },
    ],
    science: [
      { name: "Components of Food", status: "todo" },
      { name: "Sorting Materials into Groups", status: "todo" },
      { name: "Separation of Substances", status: "todo" },
      { name: "Getting to Know Plants", status: "todo" },
      { name: "Body Movements", status: "todo" },
      { name: "The Living Organisms & Their Surroundings", status: "todo" },
      { name: "Motion & Measurement of Distances", status: "todo" },
      { name: "Light, Shadows & Reflections", status: "todo" },
      { name: "Electricity & Circuits", status: "todo" },
      { name: "Fun with Magnets", status: "todo" },
      { name: "Air Around Us", status: "todo" },
    ],
    sst: [
      { name: "What, Where, How & When?", status: "todo" },
      { name: "From Hunting–Gathering to Growing Food", status: "todo" },
      { name: "In the Earliest Cities", status: "todo" },
      { name: "Kingdoms, Kings & an Early Republic", status: "todo" },
      { name: "Vital Villages, Thriving Towns", status: "todo" },
      { name: "The Earth in the Solar System", status: "todo" },
      { name: "Globe: Latitudes & Longitudes", status: "todo" },
      { name: "Motions of the Earth", status: "todo" },
      { name: "Maps", status: "todo" },
      { name: "Understanding Diversity", status: "todo" },
      { name: "What is Government?", status: "todo" },
    ],
    english: [
      { name: "Who Did Patrick's Homework?", status: "todo" },
      { name: "How the Dog Found Himself a New Master!", status: "todo" },
      { name: "Taro's Reward", status: "todo" },
      { name: "An Indian–American Woman in Space", status: "todo" },
      { name: "A Different Kind of School", status: "todo" },
      { name: "Who I Am", status: "todo" },
      { name: "Fair Play", status: "todo" },
      { name: "A Game of Chance", status: "todo" },
      { name: "Desert Animals", status: "todo" },
      { name: "The Banyan Tree", status: "todo" },
    ],
    hindi: [
      { name: "वह चिड़िया जो", status: "todo" },
      { name: "बचपन", status: "todo" },
      { name: "नादान दोस्त", status: "todo" },
      { name: "चाँद से थोड़ी सी गप्पें", status: "todo" },
      { name: "साथी हाथ बढ़ाना", status: "todo" },
      { name: "टिकट अलबम", status: "todo" },
      { name: "झाँसी की रानी", status: "todo" },
      { name: "संसार पुस्तक है", status: "todo" },
    ],
    sanskrit: [
      { name: "वर्ण-विचारः", status: "todo" },
      { name: "शब्द-विचारः", status: "todo" },
      { name: "धातु-विचारः", status: "todo" },
      { name: "संख्या-ज्ञानम्", status: "todo" },
      { name: "पठन-अभ्यासः", status: "todo" },
      { name: "सम्भाषणम्", status: "todo" },
    ],
  },
  7: {
    math: [
      { name: "Integers", status: "todo" },
      { name: "Fractions & Decimals", status: "todo" },
      { name: "Data Handling", status: "todo" },
      { name: "Simple Equations", status: "todo" },
      { name: "Lines & Angles", status: "todo" },
      { name: "The Triangle & its Properties", status: "todo" },
      { name: "Comparing Quantities", status: "todo" },
      { name: "Rational Numbers", status: "todo" },
      { name: "Perimeter & Area", status: "todo" },
      { name: "Algebraic Expressions", status: "todo" },
      { name: "Exponents & Powers", status: "todo" },
      { name: "Symmetry", status: "todo" },
      { name: "Visualising Solid Shapes", status: "todo" },
    ],
    science: [
      { name: "Nutrition in Plants", status: "todo" },
      { name: "Nutrition in Animals", status: "todo" },
      { name: "Heat", status: "todo" },
      { name: "Acids, Bases & Salts", status: "todo" },
      { name: "Physical & Chemical Changes", status: "todo" },
      { name: "Respiration in Organisms", status: "todo" },
      { name: "Transportation in Animals & Plants", status: "todo" },
      { name: "Reproduction in Plants", status: "todo" },
      { name: "Motion & Time", status: "todo" },
      { name: "Electric Current & its Effects", status: "todo" },
      { name: "Light", status: "todo" },
      { name: "Forests: Our Lifeline", status: "todo" },
      { name: "Wastewater Story", status: "todo" },
    ],
    sst: [
      { name: "Environment", status: "todo" },
      { name: "Inside Our Earth", status: "todo" },
      { name: "Our Changing Earth", status: "todo" },
      { name: "Air", status: "todo" },
      { name: "Water", status: "todo" },
      { name: "Tracing Changes Through a Thousand Years", status: "todo" },
      { name: "New Kings & Kingdoms", status: "todo" },
      { name: "The Delhi Sultans", status: "todo" },
      { name: "The Mughal Empire", status: "todo" },
      { name: "Devotional Paths to the Divine", status: "todo" },
      { name: "On Equality", status: "todo" },
      { name: "How the State Government Works", status: "todo" },
    ],
    english: [
      { name: "Three Questions", status: "todo" },
      { name: "A Gift of Chappals", status: "todo" },
      { name: "Gopal & the Hilsa Fish", status: "todo" },
      { name: "The Ashes That Made Trees Bloom", status: "todo" },
      { name: "Quality", status: "todo" },
      { name: "Expert Detectives", status: "todo" },
      { name: "The Invention of Vita-Wonk", status: "todo" },
      { name: "Fire: Friend & Foe", status: "todo" },
      { name: "A Bicycle in Good Repair", status: "todo" },
    ],
    hindi: [
      { name: "हम पंछी उन्मुक्त गगन के", status: "todo" },
      { name: "दादी माँ", status: "todo" },
      { name: "हिमालय की बेटियाँ", status: "todo" },
      { name: "कठपुतली", status: "todo" },
      { name: "मीठाईवाला", status: "todo" },
      { name: "टोकै में भगत", status: "todo" },
      { name: "कबीर की साखियाँ", status: "todo" },
    ],
    sanskrit: [
      { name: "वर्ण-विचारः", status: "todo" },
      { name: "लिङ्ग-विचारः", status: "todo" },
      { name: "वचन-विचारः", status: "todo" },
      { name: "धातु-विचारः", status: "todo" },
      { name: "पठन-अभ्यासः", status: "todo" },
      { name: "सम्भाषणाभ्यासः", status: "todo" },
    ],
  },
  8: {
    math: [
      { name: "Rational Numbers", status: "todo" },
      { name: "Linear Equations in One Variable", status: "todo" },
      { name: "Understanding Quadrilaterals", status: "todo" },
      { name: "Data Handling", status: "todo" },
      { name: "Squares & Square Roots", status: "todo" },
      { name: "Cubes & Cube Roots", status: "todo" },
      { name: "Comparing Quantities", status: "todo" },
      { name: "Algebraic Expressions & Identities", status: "todo" },
      { name: "Mensuration", status: "todo" },
      { name: "Exponents & Powers", status: "todo" },
      { name: "Direct & Inverse Proportions", status: "todo" },
      { name: "Factorisation", status: "todo" },
      { name: "Introduction to Graphs", status: "todo" },
    ],
    science: [
      { name: "Crop Production & Management", status: "todo" },
      { name: "Microorganisms: Friend & Foe", status: "todo" },
      { name: "Coal & Petroleum", status: "todo" },
      { name: "Combustion & Flame", status: "todo" },
      { name: "Conservation of Plants & Animals", status: "todo" },
      { name: "Cell — Structure & Functions", status: "todo" },
      { name: "Reproduction in Animals", status: "todo" },
      { name: "Reaching the Age of Adolescence", status: "todo" },
      { name: "Force & Pressure", status: "todo" },
      { name: "Friction", status: "todo" },
      { name: "Sound", status: "todo" },
      { name: "Chemical Effects of Electric Current", status: "todo" },
      { name: "Light", status: "todo" },
    ],
    sst: [
      { name: "How, When & Where", status: "todo" },
      { name: "From Trade to Territory", status: "todo" },
      { name: "Ruling the Countryside", status: "todo" },
      { name: "When People Rebel: 1857 & After", status: "todo" },
      { name: "Women, Caste & Reform", status: "todo" },
      { name: "The Making of the National Movement", status: "todo" },
      { name: "Resources", status: "todo" },
      { name: "Agriculture", status: "todo" },
      { name: "Industries", status: "todo" },
      { name: "Human Resources", status: "todo" },
      { name: "The Indian Constitution", status: "todo" },
      { name: "Understanding Secularism", status: "todo" },
      { name: "Judiciary", status: "todo" },
    ],
    english: [
      { name: "The Best Christmas Present in the World", status: "todo" },
      { name: "The Tsunami", status: "todo" },
      { name: "Glimpses of the Past", status: "todo" },
      { name: "Bepin Choudhury's Lapse of Memory", status: "todo" },
      { name: "The Summit Within", status: "todo" },
      { name: "This is Jody's Fawn", status: "todo" },
      { name: "A Visit to Cambridge", status: "todo" },
      { name: "A Short Monsoon Diary", status: "todo" },
      { name: "The Great Stone Face", status: "todo" },
    ],
    hindi: [
      { name: "ध्वनि", status: "todo" },
      { name: "लाख की चूड़ियाँ", status: "todo" },
      { name: "बस की यात्रा", status: "todo" },
      { name: "सोना", status: "todo" },
      { name: "चिट्ठियों की अनूठी दुनिया", status: "todo" },
      { name: "भगवान के डाकिए", status: "todo" },
      { name: "कबीर की साखियाँ", status: "todo" },
    ],
    sanskrit: [
      { name: "शब्दरूपाणि", status: "todo" },
      { name: "धातुरूपाणि", status: "todo" },
      { name: "उपपद-विभक्तिः", status: "todo" },
      { name: "प्रत्ययाः", status: "todo" },
      { name: "समासः", status: "todo" },
      { name: "श्लोक-अभ्यासः", status: "todo" },
    ],
  },
  9: {
    math: [
      { name: "Number Systems", status: "todo" },
      { name: "Polynomials", status: "todo" },
      { name: "Coordinate Geometry", status: "todo" },
      { name: "Linear Equations in Two Variables", status: "todo" },
      { name: "Introduction to Euclid's Geometry", status: "todo" },
      { name: "Lines & Angles", status: "todo" },
      { name: "Triangles", status: "todo" },
      { name: "Quadrilaterals", status: "todo" },
      { name: "Circles", status: "todo" },
      { name: "Heron's Formula", status: "todo" },
      { name: "Surface Areas & Volumes", status: "todo" },
      { name: "Statistics", status: "todo" },
      { name: "Probability", status: "todo" },
    ],
    science: [
      { name: "Matter in Our Surroundings", status: "todo" },
      { name: "Is Matter Around Us Pure?", status: "todo" },
      { name: "Atoms & Molecules", status: "todo" },
      { name: "Structure of the Atom", status: "todo" },
      { name: "The Fundamental Unit of Life", status: "todo" },
      { name: "Tissues", status: "todo" },
      { name: "Motion", status: "todo" },
      { name: "Force & Laws of Motion", status: "todo" },
      { name: "Gravitation", status: "todo" },
      { name: "Work & Energy", status: "todo" },
      { name: "Sound", status: "todo" },
      { name: "Improvement in Food Resources", status: "todo" },
    ],
    sst: [
      { name: "The French Revolution", status: "todo" },
      { name: "Socialism in Europe & the Russian Revolution", status: "todo" },
      { name: "Nazism & the Rise of Hitler", status: "todo" },
      { name: "Forest Society & Colonialism", status: "todo" },
      { name: "India — Size & Location", status: "todo" },
      { name: "Physical Features of India", status: "todo" },
      { name: "Drainage", status: "todo" },
      { name: "Climate", status: "todo" },
      { name: "Natural Vegetation & Wildlife", status: "todo" },
      { name: "Population", status: "todo" },
      { name: "What is Democracy? Why Democracy?", status: "todo" },
      { name: "Constitutional Design", status: "todo" },
      { name: "Electoral Politics", status: "todo" },
    ],
    english: [
      { name: "The Fun They Had", status: "todo" },
      { name: "The Sound of Music", status: "todo" },
      { name: "The Little Girl", status: "todo" },
      { name: "A Truly Beautiful Mind", status: "todo" },
      { name: "The Snake & the Mirror", status: "todo" },
      { name: "My Childhood", status: "todo" },
      { name: "Reach for the Top", status: "todo" },
      { name: "Kathmandu", status: "todo" },
      { name: "If I Were You", status: "todo" },
      { name: "The Road Not Taken (Poem)", status: "todo" },
      { name: "Wind (Poem)", status: "todo" },
      { name: "No Men Are Foreign (Poem)", status: "todo" },
    ],
    hindi: [
      { name: "दो बैलों की कथा", status: "todo" },
      { name: "ल्हासा की ओर", status: "todo" },
      { name: "उपभोक्तावाद की संस्कृति", status: "todo" },
      { name: "साँवले सपनों की याद", status: "todo" },
      { name: "प्रेमचंद के फटे जूते", status: "todo" },
      { name: "शुक्रतारे के सामान", status: "todo" },
      { name: "रीढ़ की हड्डी", status: "todo" },
    ],
    sanskrit: [
      { name: "पठन-कौशलम्", status: "todo" },
      { name: "शब्दरूपाणि", status: "todo" },
      { name: "धातुरूपाणि", status: "todo" },
      { name: "कारक-उपपद-विभक्तिः", status: "todo" },
      { name: "समासाः", status: "todo" },
      { name: "अनुवाद-अभ्यासः", status: "todo" },
    ],
  },
};

/** Unified chapter lookup across classes 6–10. */
export function chaptersFor(cls: number, subject: SubjectKey): Chapter[] {
  if (cls === 10) return CLASS10_CHAPTERS[subject] ?? [];
  return CHAPTERS_BY_CLASS[cls]?.[subject] ?? [];
}

/** URL-safe slug for chapters ("Areas Related to Circles" -> "areas-related-to-circles"). */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

/* ---------------- Test Lab — practice sets ----------------
   Practice questions authored for The Mind Code, aligned to
   the CBSE syllabus. Marked as practice — not board papers. */

export type TestQuestion = {
  q: string;
  options: [string, string, string, string];
  a: number; // index of correct option
  why: string; // one-line explanation
  concept: string;
};

export type Test = {
  id: string;
  mission: "daily" | "chapter" | "full" | "pyq" | "sample";
  title: string;
  cls: number;
  subject: SubjectKey;
  chapter: string;
  minutes: number;
  questions: TestQuestion[];
};

export const TESTS: Test[] = [
  {
    id: "t-daily-10",
    mission: "daily",
    title: "Daily Mission — Class 10 Warm-up",
    cls: 10,
    subject: "math",
    chapter: "Mixed warm-up",
    minutes: 10,
    questions: [
      {
        q: "The discriminant of 2x² − 4x + 1 = 0 is:",
        options: ["8", "−8", "16", "24"],
        a: 0,
        why: "b² − 4ac = (−4)² − 4·2·1 = 16 − 8 = 8.",
        concept: "Discriminant",
      },
      {
        q: "HCF(12, 18) × LCM(12, 18) equals:",
        options: ["30", "72", "216", "108"],
        a: 2,
        why: "HCF × LCM = product of the numbers = 12 × 18 = 216.",
        concept: "Real Numbers",
      },
      {
        q: "If sin θ = 3/5 (θ acute), then tan θ is:",
        options: ["3/4", "4/3", "5/4", "4/5"],
        a: 0,
        why: "cos θ = 4/5, so tan θ = sin θ / cos θ = 3/4.",
        concept: "Trigonometry",
      },
      {
        q: "The distance of the point (3, 4) from the origin is:",
        options: ["3", "4", "5", "7"],
        a: 2,
        why: "√(3² + 4²) = √25 = 5.",
        concept: "Coordinate Geometry",
      },
      {
        q: "The probability of getting a sum of 7 with two dice is:",
        options: ["1/6", "1/12", "7/36", "1/9"],
        a: 0,
        why: "6 favourable outcomes out of 36 → 6/36 = 1/6.",
        concept: "Probability",
      },
    ],
  },
  {
    id: "t-chapter-quad",
    mission: "chapter",
    title: "Chapter Mission — Quadratic Equations",
    cls: 10,
    subject: "math",
    chapter: "Quadratic Equations",
    minutes: 20,
    questions: [
      {
        q: "The roots of x² − 5x + 6 = 0 are:",
        options: ["1 and 6", "2 and 3", "−2 and −3", "0 and 5"],
        a: 1,
        why: "Sum = 5, product = 6 → the roots are 2 and 3.",
        concept: "Factorisation",
      },
      {
        q: "The equation x² + 6x + 9 = 0 has:",
        options: [
          "Two distinct real roots",
          "Two equal real roots",
          "No real roots",
          "Exactly three roots",
        ],
        a: 1,
        why: "D = 36 − 36 = 0 → two equal real roots (x = −3).",
        concept: "Discriminant",
      },
      {
        q: "A quadratic equation has:",
        options: [
          "Degree 1",
          "Degree 2",
          "Degree 3",
          "Any degree",
        ],
        a: 1,
        why: "Quadratic means the highest power of the variable is 2.",
        concept: "Standard form",
      },
      {
        q: "If b² − 4ac < 0 for ax² + bx + c = 0 (a ≠ 0), the equation has:",
        options: [
          "No real roots",
          "Two equal real roots",
          "Two distinct real roots",
          "Infinite roots",
        ],
        a: 0,
        why: "A negative discriminant means the parabola never touches the x-axis.",
        concept: "Nature of roots",
      },
      {
        q: "Solving (x − 2)² = 9 gives:",
        options: ["x = 5 only", "x = 5 or x = −1", "x = 11 or x = −7", "x = 3"],
        a: 1,
        why: "x − 2 = ±3 → x = 5 or x = −1. Both square to 9.",
        concept: "Square roots",
      },
      {
        q: "The sum of the roots of x² − 7x + 10 = 0 is:",
        options: ["10", "7", "−7", "3"],
        a: 1,
        why: "Sum of roots = −b/a = 7.",
        concept: "Sum & product of roots",
      },
    ],
  },
  {
    id: "t-chapter-elec",
    mission: "chapter",
    title: "Chapter Mission — Electricity",
    cls: 10,
    subject: "science",
    chapter: "Electricity",
    minutes: 15,
    questions: [
      {
        q: "The SI unit of electrical resistance is:",
        options: ["volt", "ampere", "ohm", "watt"],
        a: 2,
        why: "Resistance is measured in ohms (Ω).",
        concept: "Resistance",
      },
      {
        q: "A 12 V battery drives current through a 4 Ω resistor. The current is:",
        options: ["0.33 A", "3 A", "8 A", "48 A"],
        a: 1,
        why: "I = V/R = 12/4 = 3 A.",
        concept: "Ohm's law",
      },
      {
        q: "Two resistors of 2 Ω and 3 Ω are connected in series. The total resistance is:",
        options: ["1.2 Ω", "2.5 Ω", "5 Ω", "6 Ω"],
        a: 2,
        why: "In series, resistances add: 2 + 3 = 5 Ω.",
        concept: "Series circuits",
      },
      {
        q: "Heat produced in a resistor depends on:",
        options: ["I only", "I²Rt", "V only", "R only"],
        a: 1,
        why: "Joule's law: H = I²Rt.",
        concept: "Heating effect",
      },
      {
        q: "An ammeter is connected in a circuit:",
        options: [
          "In parallel with the resistor",
          "In series with the resistor",
          "Across the battery only",
          "Any way at all",
        ],
        a: 1,
        why: "Ammeters carry the full current, so they go in series.",
        concept: "Measuring current",
      },
    ],
  },
  {
    id: "t-chapter-nationalism",
    mission: "chapter",
    title: "Chapter Mission — Nationalism in India",
    cls: 10,
    subject: "sst",
    chapter: "Nationalism in India",
    minutes: 15,
    questions: [
      {
        q: "The Non-Cooperation Movement was launched in:",
        options: ["1917", "1919", "1920", "1930"],
        a: 2,
        why: "Gandhiji launched Non-Cooperation in 1920, tied to the Khilafat issue.",
        concept: "Non-Cooperation",
      },
      {
        q: "The Jallianwala Bagh massacre took place in:",
        options: ["1919", "1921", "1922", "1930"],
        a: 0,
        why: "13 April 1919 — General Dyer ordered firing on a peaceful gathering in Amritsar.",
        concept: "Jallianwala Bagh",
      },
      {
        q: "Gandhiji began the Salt March to Dandi in:",
        options: ["1928", "1929", "1930", "1932"],
        a: 2,
        why: "The 240-mile march began on 12 March 1930, breaking the salt law at Dandi.",
        concept: "Civil Disobedience",
      },
      {
        q: "The Khilafat Movement was led by:",
        options: [
          "Muhammad Ali and Shaukat Ali",
          "Nehru and Bose",
          "Tilak and Lajpat Rai",
          "Bhagat Singh and Rajguru",
        ],
        a: 0,
        why: "The Ali brothers led Khilafat; Gandhiji saw it as a chance for Hindu–Muslim unity.",
        concept: "Khilafat",
      },
      {
        q: "Vande Mataram was written by:",
        options: [
          "Rabindranath Tagore",
          "Bankim Chandra Chattopadhyay",
          "Sarojini Naidu",
          "Subhas Chandra Bose",
        ],
        a: 1,
        why: "Bankim Chandra Chattopadhyay wrote it in the 1870s, later part of Anandamath.",
        concept: "Identity & folklore",
      },
    ],
  },
  {
    id: "t-pyq-real",
    mission: "pyq",
    title: "PYQ Mode — Real Numbers",
    cls: 10,
    subject: "math",
    chapter: "Real Numbers",
    minutes: 15,
    questions: [
      {
        q: "6ⁿ can end with the digit 0 for any natural number n?",
        options: ["Yes, for all n", "Yes, for even n", "Never", "Only when n = 5"],
        a: 2,
        why: "6ⁿ = 2ⁿ·3ⁿ has no factor 5, so it can never end in 0.",
        concept: "Fundamental theorem",
      },
      {
        q: "HCF of 96 and 404 is:",
        options: ["2", "4", "8", "101"],
        a: 1,
        why: "96 = 2⁵·3 and 404 = 2²·101 → HCF = 2² = 4.",
        concept: "HCF by prime factorisation",
      },
      {
        q: "√2 is:",
        options: ["An integer", "A rational number", "An irrational number", "A whole number"],
        a: 2,
        why: "√2 cannot be written as p/q — the classic irrational.",
        concept: "Irrational numbers",
      },
      {
        q: "The decimal expansion of 13/3125 is:",
        options: [
          "Non-terminating",
          "Terminating",
          "Non-terminating repeating",
          "Imaginary",
        ],
        a: 1,
        why: "3125 = 5⁵ → the denominator is only 5s, so the decimal terminates.",
        concept: "Decimal expansions",
      },
      {
        q: "LCM of 6 and 20 is:",
        options: ["30", "60", "120", "12"],
        a: 1,
        why: "6 = 2·3, 20 = 2²·5 → LCM = 2²·3·5 = 60.",
        concept: "LCM",
      },
    ],
  },
  {
    id: "t-full-10",
    mission: "full",
    title: "Full Test — Class 10 Board Simulation",
    cls: 10,
    subject: "math",
    chapter: "Mixed — full syllabus",
    minutes: 40,
    questions: [
      {
        q: "The chemical formula of quicklime is:",
        options: ["CaCO₃", "CaO", "Ca(OH)₂", "CaCl₂"],
        a: 1,
        why: "Quicklime is calcium oxide, CaO — made by heating limestone.",
        concept: "Chemical reactions",
      },
      {
        q: "The pH of a neutral solution at 25 °C is:",
        options: ["0", "7", "14", "1"],
        a: 1,
        why: "Neutral solutions have pH 7.",
        concept: "Acids & bases",
      },
      {
        q: "The focal length of a plane mirror is:",
        options: ["Zero", "Infinity", "Equal to its radius", "Negative"],
        a: 1,
        why: "A plane mirror has infinite radius of curvature, hence infinite focal length.",
        concept: "Light",
      },
      {
        q: "A lens has focal length 25 cm. Its power is:",
        options: ["+4 D", "+2 D", "−4 D", "+25 D"],
        a: 0,
        why: "P = 1/f(in metres) = 1/0.25 = +4 D.",
        concept: "Power of a lens",
      },
      {
        q: "HCF(6, 20) is:",
        options: ["1", "2", "3", "6"],
        a: 1,
        why: "6 = 2·3 and 20 = 2²·5 → HCF = 2.",
        concept: "Real Numbers",
      },
      {
        q: "The roots of x² − 9 = 0 are:",
        options: ["3 only", "±3", "9", "±9"],
        a: 1,
        why: "x² = 9 → x = ±3.",
        concept: "Quadratic Equations",
      },
      {
        q: "The Salt March is associated with which movement?",
        options: [
          "Non-Cooperation",
          "Civil Disobedience",
          "Quit India",
          "Swadeshi",
        ],
        a: 1,
        why: "Dandi 1930 launched the Civil Disobedience Movement.",
        concept: "Nationalism in India",
      },
      {
        q: "The probability of drawing a king from a well-shuffled deck of 52 cards is:",
        options: ["1/52", "1/13", "1/4", "4/13"],
        a: 1,
        why: "4 kings out of 52 → 4/52 = 1/13.",
        concept: "Probability",
      },
    ],
  },
  {
    id: "t-sample-sci",
    mission: "sample",
    title: "Sample Paper — Class 10 Science",
    cls: 10,
    subject: "science",
    chapter: "Mixed — science",
    minutes: 30,
    questions: [
      {
        q: "When dilute hydrochloric acid reacts with zinc, the gas evolved is:",
        options: ["Oxygen", "Hydrogen", "Carbon dioxide", "Chlorine"],
        a: 1,
        why: "Metals + dilute acids → salt + hydrogen gas.",
        concept: "Chemical reactions",
      },
      {
        q: "Ohm's law states that V ∝ I when:",
        options: [
          "Temperature is constant",
          "Resistance changes",
          "Current is zero",
          "Voltage is zero",
        ],
        a: 0,
        why: "V = IR holds at constant temperature.",
        concept: "Electricity",
      },
      {
        q: "In the human eye, the image of an object forms on:",
        options: ["The cornea", "The iris", "The retina", "The pupil"],
        a: 2,
        why: "The lens focuses light onto the retina.",
        concept: "Human eye",
      },
      {
        q: "Which of these is non-biodegradable?",
        options: ["Paper", "Cotton", "Plastic", "Food waste"],
        a: 2,
        why: "Plastic resists microbial breakdown for decades.",
        concept: "Our Environment",
      },
      {
        q: "Magnetic field lines inside a current-carrying solenoid are:",
        options: [
          "Circular",
          "Parallel straight lines",
          "Random",
          "Absent",
        ],
        a: 1,
        why: "Inside a solenoid the field is uniform — parallel, evenly spaced lines.",
        concept: "Magnetic effects",
      },
      {
        q: "Bleaching powder is produced by the action of chlorine on:",
        options: ["Dry slaked lime", "Sodium chloride", "Water", "Limestone"],
        a: 0,
        why: "Ca(OH)₂ + Cl₂ → bleaching powder CaOCl₂.",
        concept: "Acids, bases & salts",
      },
    ],
  },
  {
    id: "t-daily-8",
    mission: "daily",
    title: "Daily Mission — Class 8 Warm-up",
    cls: 8,
    subject: "math",
    chapter: "Mixed warm-up",
    minutes: 10,
    questions: [
      {
        q: "2³ × 2⁴ equals:",
        options: ["2¹²", "2⁷", "4⁷", "2¹"],
        a: 1,
        why: "Same base → add the exponents: 3 + 4 = 7.",
        concept: "Exponents",
      },
      {
        q: "The square root of 144 is:",
        options: ["12", "14", "16", "24"],
        a: 0,
        why: "12 × 12 = 144.",
        concept: "Squares & roots",
      },
      {
        q: "(a + b)² expands to:",
        options: ["a² + b²", "a² + ab + b²", "a² + 2ab + b²", "a² − 2ab + b²"],
        a: 2,
        why: "The classic identity: (a+b)² = a² + 2ab + b².",
        concept: "Identities",
      },
      {
        q: "The sum of interior angles of a quadrilateral is:",
        options: ["180°", "270°", "360°", "540°"],
        a: 2,
        why: "A quadrilateral splits into two triangles → 2 × 180° = 360°.",
        concept: "Quadrilaterals",
      },
      {
        q: "0.25 written as a fraction in lowest terms is:",
        options: ["1/2", "1/4", "2/5", "25/10"],
        a: 1,
        why: "0.25 = 25/100 = 1/4.",
        concept: "Rational numbers",
      },
    ],
  },
];

export function testById(id: string): Test | undefined {
  return TESTS.find((t) => t.id === id);
}

/** Mission catalogue — playful labels over honest categories. */
export const MISSION_CATEGORIES = [
  { id: "daily", name: "Daily Quiz", glyph: "☀", desc: "5–10 questions. A daily warm-up." },
  { id: "chapter", name: "Chapter Test", glyph: "◎", desc: "Master one chapter at a time." },
  { id: "full", name: "Full Test", glyph: "▣", desc: "Simulate the real thing." },
  { id: "pyq", name: "PYQ Mode", glyph: "✦", desc: "Practise previous-year questions." },
  { id: "sample", name: "Sample Paper", glyph: "⬚", desc: "Board-style practice sets." },
] as const;

/* ---------------- Home world map ---------------- */

export type World = {
  href: string;
  label: string;
  job: string;
  glyph: string;
};

export const WORLDS: World[] = [
  { href: "/classes", label: "Classes", job: "Learn", glyph: "🎓" },
  { href: "/resources", label: "Resources", job: "Access", glyph: "📘" },
  { href: "/tests", label: "Test Lab", job: "Practise", glyph: "🧪" },
  { href: "/tuition", label: "Tuition", job: "Get help", glyph: "🏠" },
  { href: "/code", label: "CODE", job: "Ask", glyph: "</>" },
  { href: "/dashboard", label: "Progress", job: "Track", glyph: "📈" },
  { href: "/books", label: "Book", job: "Go deeper", glyph: "📕" },
  { href: "/about", label: "About", job: "Trust", glyph: "🧠" },
];

/* ---------------- Tutor (verified only — do not invent) ---------------- */

export const TUTORS = [
  {
    id: "pankaj-malik",
    name: "Pankaj Malik",
    role: "Founder-teacher, The Mind Code",
    photo: "/founder.jpg",
    subjects: ["Mathematics", "Science"],
    classes: [6, 7, 8, 9, 10],
    experience: "Since 2021",
    modes: ["Home Tuition", "Online 1:1", "Small Group"],
    location: "Ghaziabad, India",
    verified: true,
    linkedin: LINKEDIN_URL,
    about: FOUNDER.philosophy,
    approach:
      "Understand first, memorise never. Every session starts from where the student actually is — then rebuilds the concept until it clicks, and closes with one small piece of practice that makes it stick.",
    availability: "Limited seats each term — request a demo to check current slots.",
  },
] as const;

export function tutorById(id: string) {
  return TUTORS.find((t) => t.id === id);
}
