import { LandingEffects } from "@/components/landing-effects";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <LandingEffects />
      <div className="flex min-h-dvh flex-col size-full shrink-0 relative overflow-hidden">
        {children}
      </div>
    </>
  );
}
