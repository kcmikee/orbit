"use client";
import { Minus, Plus } from "lucide-react";
import React, { useState } from "react";

function Faq() {
  const [activeFaq, setActiveFaq] = useState(null);

  const faqs = [
    {
      q: "Is Orbit non-custodial?",
      a: "Yes. Orbit utilizes Circle's programmable wallets and smart contract logic on Arc L1. Your keys, your assets—our agent simply executes the logic you authorize.",
    },
    {
      q: "How does Norbit execute trades?",
      a: "Norbit interacts with OrbitHook smart contracts, executing swaps on Uniswap v4 based on the governance parameters and risk thresholds you define in the terminal.",
    },
    {
      q: "Is this compliant for institutional use?",
      a: "Orbit leverages regulated infrastructure including Circle and Stork Oracles to ensure every on-chain operation meets institutional-grade transparency and audit requirements.",
    },
    {
      q: "What are the latency metrics for rebalancing?",
      a: "By building natively on Arc L1 and utilizing Stork's ultra-low latency oracles, Orbit can trigger rebalancing hooks in sub-second intervals as market conditions shift.",
    },
  ];
  return (
    <div className="space-y-4">
      {faqs.map((faq, i) => (
        <div
          key={i}
          className="overflow-hidden border border-white/10 bg-black/40"
        >
          <button
            className="flex justify-between items-center px-6 py-5 w-full text-left transition-colors hover:bg-white/5"
            onClick={() => setActiveFaq(activeFaq === i ? null : i)}
          >
            <span className="text-xs font-bold tracking-widest uppercase md:text-sm text-slate-200">
              {faq.q}
            </span>
            {activeFaq === i ? (
              <Minus size={16} className="text-cyan-400" />
            ) : (
              <Plus size={16} className="text-cyan-400" />
            )}
          </button>
          {activeFaq === i && (
            <div className="px-6 pb-6 text-sm font-medium leading-relaxed text-slate-400">
              {faq.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default Faq;
