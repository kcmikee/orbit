import { Suspense } from "react";

import { Footer } from "@/components/footer";
import { LandingTextarea } from "@/components/landing-textarea";
import { LandingChatSessions } from "@/components/landing-chat-sessions";

export default function Page() {
  return (
    <main className="flex overflow-hidden flex-col flex-1 size-full">
      <div className="flex overflow-hidden flex-col flex-1 gap-8 justify-center items-center px-4 size-full md:px-0">
        <h1 className="text-3xl font-semibold tracking-tighter text-center xl:text-4xl text-pretty">
          Ask anything about Norbit
        </h1>
        <div className="mx-auto w-full max-w-xl">
          <Suspense fallback={null}>
            <LandingTextarea />
          </Suspense>
        </div>

        {/* Previous Chat Sessions */}
        <div className="mx-auto w-full max-w-2xl">
          <Suspense fallback={null}>
            <LandingChatSessions />
          </Suspense>
        </div>
      </div>
      <Footer />
    </main>
  );
}
