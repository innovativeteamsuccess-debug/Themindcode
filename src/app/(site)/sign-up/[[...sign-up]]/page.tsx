import { Suspense } from "react";
import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export const metadata = {
  title: "Sign up — The Mind Code",
  description: "Create your free account with Google and enter the Student Zone.",
};

export default function SignUpPage() {
  if (!(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY)) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-5 pb-32 pt-40 text-center">
        <h1 className="font-display text-3xl">Sign-up is warming up.</h1>
        <p className="text-[13.5px] text-dim">
          Google sign-up runs through the Student Zone meanwhile.
        </p>
        <Link
          href="/zone"
          className="btn-mono rounded-full bg-[var(--mc-cta-bg)] px-6 py-3 text-[10px] text-[var(--mc-cta-fg)]"
        >
          GO TO STUDENT ZONE
        </Link>
      </main>
    );
  }
  return (
    <main className="flex justify-center px-5 pb-28 pt-32 md:pt-40">
      <Suspense>
        <SignUp />
      </Suspense>
    </main>
  );
}
