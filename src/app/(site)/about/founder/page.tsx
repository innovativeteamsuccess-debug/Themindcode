import type { Metadata } from "next";
import { FounderPage } from "@/components/mindcode/founder-page";
import {
  BOOK,
  BOOK_URL,
  FOUNDER,
  INSTAGRAM_URL,
  LINKEDIN_URL,
  LINKTREE_URL,
  YOUTUBE_CHANNEL_URL,
} from "@/components/mindcode/data";

export const metadata: Metadata = {
  metadataBase: new URL("https://themindcode.in"),
  title: "Pankaj Malik — The Founder | The Mind Code",
  description:
    "Founder, teacher, author and podcast host. Pankaj Malik built The Mind Code in August 2021 around one method — understand first, memorise never. He hosts The Mind Code Universe on YouTube. Mathematics & Science for CBSE Classes 6–10, 2,500+ free resources, and the book Unlock the Infinite Code.",
  keywords: [
    "Pankaj Malik",
    "The Mind Code founder",
    "The Mind Code Universe podcast",
    "founder teacher Ghaziabad",
    "CBSE maths tutor",
    "Unlock the Infinite Code",
  ],
  alternates: { canonical: "/about/founder" },
  openGraph: {
    title: "Pankaj Malik — Crack the concept. Own the exam.",
    description:
      "The person behind The Mind Code: founder-teacher, author, and the belief that every concept can crack.",
    url: "/about/founder",
    siteName: "The Mind Code",
    type: "profile",
  },
};

/* Structured data — facts only, all verified on this page. */
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: FOUNDER.name,
  jobTitle: "Founder & CEO",
  worksFor: { "@type": "Organization", name: "The Mind Code" },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Ghaziabad",
    addressCountry: "IN",
  },
  sameAs: [LINKEDIN_URL, INSTAGRAM_URL, LINKTREE_URL, YOUTUBE_CHANNEL_URL],
  knowsAbout: ["Mathematics", "Science", "CBSE", "Classes 6–10"],
  subjectOf: {
    "@type": "Book",
    name: BOOK.title,
    author: { "@type": "Person", name: BOOK.author },
    publisher: BOOK.publisher,
    numberOfPages: BOOK.pages,
    url: BOOK_URL,
  },
};

export default function FounderPageRoute() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <FounderPage />
    </>
  );
}
