import { Header } from "@/components/header";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      <div className="flex overflow-hidden relative flex-col mt-20 min-h-dvh size-full shrink-0">
        {children}
      </div>
    </>
  );
}
