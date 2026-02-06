"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { Dialog, DialogTitle } from "@/components/dialog";
import CreateWallet from "./create-wallet";

type ConnectWalletModalProps = {
  open: boolean;
  onClose: () => void;
  onConnect?: () => void;
};

export function ConnectWalletModal({
  open,
  onClose,
  onConnect,
}: ConnectWalletModalProps) {
  return (
    <Dialog open={open} onClose={onClose} size="md" className="!p-10">
      <div className="flex justify-between items-start">
        <DialogTitle>Connect Wallet</DialogTitle>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1.5 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Close"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
      <div className="mt-6">
        <CreateWallet onConnect={onConnect} />
      </div>
    </Dialog>
  );
}
