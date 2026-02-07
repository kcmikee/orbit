import { Header } from "@/components/header";
import logo from "@/components/logo2(1).png";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header url={logo} backButtonUrl="/chats" />
      <div className="flex overflow-hidden relative flex-col flex-1 min-w-0 min-h-0 h-dvh">
        {children}
      </div>
    </>
  );
}
