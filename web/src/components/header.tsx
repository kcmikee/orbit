"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";
import {
  // useEffect,
  useState,
} from "react";

import { Dialog } from "@/components/dialog";
import { DiscordIcon, XIcon } from "@/components/icons";
import { Logo } from "@/components/logo";
import { ConnectWallet } from "./connect-wallet";
import { StaticImageData } from "next/image";

export function Header({
  url,
  backButtonUrl,
  isTreasury = false,
}: {
  url?: StaticImageData | null;
  backButtonUrl?: string;
  isTreasury?: boolean;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // const [mounted, setMounted] = useState(false);

  // useEffect(() => setMounted(true), []);

  const NavLinks = ({ mobile = false }) => (
    <>
      <Link
        href="/explore"
        className={clsx(
          "text-sm font-medium",
          mobile
            ? "block px-3 py-2 -mx-3 font-semibold rounded-lg text-base/7 text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900"
            : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white",
        )}
        onClick={() => setMobileMenuOpen(false)}
      >
        Explore
      </Link>
      <a
        href="https://docs.eliza.how/"
        target="_blank"
        rel="noopener noreferrer"
        className={clsx(
          "flex items-center text-sm font-medium",
          mobile
            ? "block px-3 py-2 -mx-3 font-semibold rounded-lg text-base/7 text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900"
            : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-white",
        )}
        onClick={() => setMobileMenuOpen(false)}
      >
        Docs
      </a>
      <a
        href="https://twitter.com/elizaos"
        target="_blank"
        rel="noopener noreferrer"
        className={clsx(
          "flex items-center text-sm font-medium",
          mobile
            ? "block px-3 py-2 -mx-3 font-semibold rounded-lg text-base/7 text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900"
            : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-white",
        )}
        onClick={() => setMobileMenuOpen(false)}
      >
        <XIcon className="w-4 h-4" />
      </a>
      <a
        href="https://discord.gg/elizaos"
        target="_blank"
        rel="noopener noreferrer"
        className={clsx(
          "flex items-center text-sm font-medium",
          mobile
            ? "block px-3 py-2 -mx-3 font-semibold rounded-lg text-base/7 text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900"
            : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-white",
        )}
        onClick={() => setMobileMenuOpen(false)}
      >
        <DiscordIcon className="w-5 h-5" />
      </a>
    </>
  );

  return (
    <header className="fixed top-0 right-0 left-0 z-10 bg-white dark:bg-black">
      <nav className="px-4 w-full lg:px-6" aria-label="Global">
        <div className="flex justify-between items-center py-4">
          <div className="flex">
            <Link href={backButtonUrl || "/"} className="-m-1.5 p-1.5">
              <Logo url={url} />
            </Link>
          </div>

          <div className="flex gap-x-4 items-center ml-auto">
            <Link
              href={!isTreasury ? "/treasury" : "/chats"}
              className={clsx(
                "text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white",
              )}
            >
              {!isTreasury ? "Treasury" : "Chats"}
            </Link>
            {/* <NavLinks /> */}
            <ConnectWallet />
          </div>
        </div>
      </nav>

      <Dialog
        open={mobileMenuOpen}
        onClose={setMobileMenuOpen}
        className="lg:hidden"
        variant="slideout"
      >
        <div className="px-6 py-6 h-full">
          <div className="flex justify-between items-center">
            <Link
              href="/"
              className="-m-1.5 p-1.5"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Logo width={32} height={32} />
            </Link>
            <button
              type="button"
              className="-m-2.5 rounded-md p-2.5 text-zinc-700 dark:text-zinc-400"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sr-only">Close menu</span>
              <XMarkIcon className="w-6 h-6" aria-hidden="true" />
            </button>
          </div>
          <div className="flow-root mt-6">
            <div className="py-6 space-y-2">
              <NavLinks mobile />
            </div>
          </div>
        </div>
      </Dialog>
    </header>
  );
}
