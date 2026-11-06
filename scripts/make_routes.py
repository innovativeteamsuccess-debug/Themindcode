"""Create all multi-screen route files."""
import pathlib, textwrap

R = pathlib.Path("src/app")

def page(path, body, meta_title, meta_desc):
    p = R / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(f'''import type {{ Metadata }} from "next";
{body[0]}

export const metadata: Metadata = {{
  title: "{meta_title}",
  description: {meta_desc},
}};

{body[1]}
''')
    print("page:", p)

# ---------- HOME ----------
page("page.tsx", (
'''import { HomeGateway } from "@/components/mindcode/home-gateway";''',
'''export default function Home() {
  return <HomeGateway />;
}'''),
"The Mind Code — Crack the concept. Own the exam.",
'"A playful multi-screen learning universe for Classes 6–10 — free notes, worksheets, PYQs, the Test Lab, Mindy AI and home tuition. Free, forever."')

# ---------- CLASSES ----------
page("classes/page.tsx", (
'''import { ClassPicker } from "@/components/mindcode/class-picker";''',
'''export default function ClassesPage() {
  return <ClassPicker />;
}'''),
"Choose Your Class — The Mind Code",
'"Class worlds from 1 to 12. Classes 6–10 are live today — CBSE aligned, playful, free."')

# ---------- CLASS DETAIL ----------
(R / "classes/[cls]").mkdir(parents=True, exist_ok=True)
(R / "classes/[cls]/page.tsx").write_text('''import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClassDetail } from "@/components/mindcode/class-detail";

export function generateStaticParams() {
  return [6, 7, 8, 9, 10, 11, 12].map((cls) => ({ cls: String(cls) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ cls: string }>;
}): Promise<Metadata> {
  const { cls } = await params;
  return {
    title: `Class ${cls} — The Mind Code`,
    description: `Class ${cls} subject worlds: Mathematics, Science, Social Science, English, Hindi and Sanskrit — chapters, resources and test missions.`,
  };
}

export default async function ClassPage({
  params,
}: {
  params: Promise<{ cls: string }>;
}) {
  const { cls } = await params;
  const n = Number(cls);
  if (!Number.isInteger(n) || n < 1 || n > 12) notFound();
  return <ClassDetail cls={n} />;
}
''')
print("page: classes/[cls]")

# ---------- SUBJECT ----------
(R / "classes/[cls]/[subject]").mkdir(parents=True, exist_ok=True)
(R / "classes/[cls]/[subject]/page.tsx").write_text('''import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SubjectDetail } from "@/components/mindcode/subject-detail";
import { SUBJECTS } from "@/components/mindcode/data";

function isSubjectKey(v: string): v is (typeof SUBJECTS)[number]["key"] {
  return SUBJECTS.some((s) => s.key === v);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ cls: string; subject: string }>;
}): Promise<Metadata> {
  const { cls, subject } = await params;
  const s = SUBJECTS.find((x) => x.key === subject);
  return {
    title: s ? `Class ${cls} ${s.name} — The Mind Code` : `Class ${cls} — The Mind Code`,
    description: s ? `Class ${cls} ${s.name}: chapter constellation, free resources and test missions.` : "Subject world",
  };
}

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ cls: string; subject: string }>;
}) {
  const { cls, subject } = await params;
  const n = Number(cls);
  if (!Number.isInteger(n) || n < 1 || n > 12 || !isSubjectKey(subject)) notFound();
  return <SubjectDetail cls={n} subjectKey={subject} />;
}
''')
print("page: classes/[cls]/[subject]")

# ---------- CHAPTER ----------
(R / "classes/[cls]/[subject]/[chapter]").mkdir(parents=True, exist_ok=True)
(R / "classes/[cls]/[subject]/[chapter]/page.tsx").write_text('''import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChapterDetail } from "@/components/mindcode/chapter-detail";
import { SUBJECTS, chaptersFor, slugify } from "@/components/mindcode/data";

type Params = Promise<{ cls: string; subject: string; chapter: string }>;

function isSubjectKey(v: string): v is (typeof SUBJECTS)[number]["key"] {
  return SUBJECTS.some((s) => s.key === v);
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { cls, subject, chapter } = await params;
  const s = SUBJECTS.find((x) => x.key === subject);
  const ch = s ? chaptersFor(Number(cls), s.key).find((c) => slugify(c.name) === chapter) : undefined;
  return {
    title: ch ? `${ch.name} — Class ${cls} ${s?.name} — The Mind Code` : `Chapter — The Mind Code`,
    description: ch ? `Learn, practise and test ${ch.name} — notes, practice, PYQs and quick revision in one screen.` : "Chapter screen",
  };
}

export default async function ChapterPage({ params }: { params: Params }) {
  const { cls, subject, chapter } = await params;
  const n = Number(cls);
  if (!Number.isInteger(n) || n < 1 || n > 12 || !isSubjectKey(subject)) notFound();
  const exists = chaptersFor(n, subject).some((c) => slugify(c.name) === chapter);
  if (!exists) notFound();
  return <ChapterDetail cls={n} subjectKey={subject} chapterSlug={chapter} />;
}
''')
print("page: classes/[cls]/[subject]/[chapter]")

# ---------- RESOURCES ----------
page("resources/page.tsx", (
'''import { Vault } from "@/components/mindcode/vault";''',
'''export default function ResourcesPage() {
  return (
    <main className="flex-1">
      <div className="h-16 md:h-24" aria-hidden />
      <Vault />
    </main>
  );
}'''),
"The Free Knowledge Vault — The Mind Code",
'"2,500+ free resources — notes, mind maps, formula sheets, worksheets, PYQs and sample papers for CBSE Classes 6–10."')

# ---------- RESOURCE READER ----------
(R / "resources/[id]").mkdir(parents=True, exist_ok=True)
(R / "resources/[id]/page.tsx").write_text('''import type { Metadata } from "next";
import { ResourceReader } from "@/components/mindcode/resource-reader";
import { RESOURCES } from "@/components/mindcode/data";

export function generateStaticParams() {
  return RESOURCES.map((r) => ({ id: r.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const r = RESOURCES.find((x) => x.id === id);
  return {
    title: r ? `${r.title} — The Mind Code` : "Resource — The Mind Code",
    description: r ? `${r.type} · Class ${r.cls} · ${r.pages} pages · free PDF preview and study tools.` : "Resource reader",
  };
}

export default async function ResourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ResourceReader id={id} />;
}
''')
print("page: resources/[id]")

# ---------- TESTS ----------
page("tests/page.tsx", (
'''import { TestLabPage } from "@/components/mindcode/test-lab-page";''',
'''export default function TestsPage() {
  return <TestLabPage />;
}'''),
"The Test Lab — Practice. Discover. Improve.",
'"Daily quizzes, chapter missions, full board simulations, PYQ mode and sample papers — playful practice with honest feedback."')

# ---------- TEST RUNNER ----------
(R / "tests/[id]").mkdir(parents=True, exist_ok=True)
(R / "tests/[id]/page.tsx").write_text('''import type { Metadata } from "next";
import { TestRunner } from "@/components/mindcode/test-runner";
import { TESTS } from "@/components/mindcode/data";

export function generateStaticParams() {
  return TESTS.map((t) => ({ id: t.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const t = TESTS.find((x) => x.id === id);
  return {
    title: t ? `${t.title} — The Test Lab` : "Test — The Mind Code",
    description: t ? `${t.questions.length} practice questions · ${t.minutes} minutes · instant explanations. No pressure, just signal.` : "Test mission",
  };
}

export default async function TestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TestRunner id={id} />;
}
''')
print("page: tests/[id]")

# ---------- TUITION ----------
page("tuition/page.tsx", (
'''import { PrivateLearning } from "@/components/mindcode/private-learning";''',
'''export default function TuitionPage() {
  return (
    <main className="flex-1">
      <div className="h-16 md:h-24" aria-hidden />
      <PrivateLearning />
    </main>
  );
}'''),
"Home Tuition — Find Your Learning Fit",
'"Personalised learning: home tuition, online 1:1, small group and hybrid modes for CBSE Classes 6–10. Request a demo with a verified founder-teacher."')

# ---------- TEACHERS ----------
page("tuition/teachers/page.tsx", (
'''import { TeacherDiscovery } from "@/components/mindcode/tutors";''',
'''export default function TeachersPage() {
  return <TeacherDiscovery />;
}'''),
"Meet Your Guides — The Mind Code Tuition",
'"Verified teachers only — no paid listings, no inflated profiles. Browse guides and request a demo."')

# ---------- TUTOR PROFILE ----------
(R / "tuition/teachers/[id]").mkdir(parents=True, exist_ok=True)
(R / "tuition/teachers/[id]/page.tsx").write_text('''import type { Metadata } from "next";
import { TutorProfile } from "@/components/mindcode/tutors";
import { TUTORS } from "@/components/mindcode/data";

export function generateStaticParams() {
  return TUTORS.map((t) => ({ id: t.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const t = TUTORS.find((x) => x.id === id);
  return {
    title: t ? `${t.name} — ${t.role}` : "Teacher — The Mind Code",
    description: t ? `${t.name}: ${t.subjects.join(", ")} for Classes ${t.classes[0]}–${t.classes[t.classes.length - 1]}. Verified profile, request a demo.` : "Tutor profile",
  };
}

export default async function TutorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TutorProfile id={id} />;
}
''')
print("page: tuition/teachers/[id]")

# ---------- MINDY ----------
page("mindy/page.tsx", (
'''import { MindyWorkspace } from "@/components/mindcode/mindy-workspace";''',
'''export default function MindyPage() {
  return <MindyWorkspace />;
}'''),
"Meet Mindy — Your AI Learning Companion",
'"Explain, quiz, hint, plan. Mindy lives inside the Mind Core and makes hard things feel simple — CBSE Classes 6–10."')

# ---------- DASHBOARD ----------
page("dashboard/page.tsx", (
'''import { CommandCentre } from "@/components/mindcode/command-centre";''',
'''export default function DashboardPage() {
  return (
    <main className="flex-1">
      <div className="h-16 md:h-24" aria-hidden />
      <CommandCentre view="student" />
    </main>
  );
}''',
), "Your Mind Core — Student Dashboard",
'"Today\'s missions, knowledge map, progress and AI recommendations — a personal command centre for CBSE students."')

# ---------- PARENTS ----------
page("parents/page.tsx", (
'''import { CommandCentre } from "@/components/mindcode/command-centre";''',
'''export default function ParentsPage() {
  return (
    <main className="flex-1">
      <div className="h-16 md:h-24" aria-hidden />
      <CommandCentre view="parent" />
    </main>
  );
}'''),
"Parent Zone — See the Progress. Understand the Journey.",
'"A calm, readable view of attendance, performance, teacher feedback and upcoming classes. Meaningful progress, never vanity statistics."')

# ---------- BOOKS ----------
page("books/page.tsx", (
'''import { BookSection } from "@/components/mindcode/book";''',
'''export default function BooksPage() {
  return (
    <main className="flex-1">
      <div className="h-16 md:h-24" aria-hidden />
      <BookSection />
    </main>
  );
}'''),
"The Mind Code Library — Unlock the Infinite Code",
'"Unlock the Infinite Code by Pankaj Malik — Rewire Your Brain, Master Your Emotions, Redesign Your Destiny. Kindle edition, verified Amazon listing."')

# ---------- ABOUT ----------
page("about/page.tsx", (
'''import { AboutPage } from "@/components/mindcode/about-page";''',
'''export default function About() {
  return <AboutPage />;
}''',
), "About The Mind Code — Not Another Tuition Website",
'"The story, philosophy and people behind The Mind Code — a learning universe for CBSE Classes 6–10, founded by Pankaj Malik."')

# ---------- FOUNDER ----------
page("about/founder/page.tsx", (
'''import { Founder } from "@/components/mindcode/founder";''',
'''export default function FounderPage() {
  return (
    <main className="flex-1">
      <div className="h-16 md:h-24" aria-hidden />
      <Founder />
    </main>
  );
}'''),
"The Person Behind The Code — Pankaj Malik",
'"Founder, teacher, author. Verified public profile, story and philosophy — The Mind Code, since 2021."')

# ---------- REVIEWS ----------
page("reviews/page.tsx", (
'''import { Reviews } from "@/components/mindcode/reviews";''',
'''export default function ReviewsPage() {
  return (
    <main className="flex-1">
      <div className="h-16 md:h-24" aria-hidden />
      <Reviews />
    </main>
  );
}''',
), "The Wall of Trust — Verified Google Reviews",
'"Real people, real experiences. Every review on this wall is verified — nothing invented, nothing bought."')

print("ALL ROUTES DONE")
