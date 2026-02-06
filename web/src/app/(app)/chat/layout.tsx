import { Header } from "@/components/header";
import logo from "@/components/logo2(1).png";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header url={logo} />
      <div className="flex overflow-hidden relative flex-col min-h-dvh size-full shrink-0">
        {children}
      </div>
    </>
  );
}
