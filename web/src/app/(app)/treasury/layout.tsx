import { Header } from "@/components/header";
import logo from "@/components/logo2(1).png";

export default function TreasuryLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header url={logo} isTreasury />
      <div className="flex overflow-hidden relative flex-col flex-1 pt-16 min-w-0 min-h-0">
        {children}
      </div>
    </>
  );
}
