import React from "react";
import { Cpu, Terminal, ShieldCheck, Zap, BarChart3 } from "lucide-react";
import { ConnectWallet } from "@/components/connect-wallet";
import { Logo } from "@/components/logo";
import Faq from "@/components/faq";

const OrbitLandingPage = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-sans selection:bg-cyan-500/30">
      <div
        className="fixed inset-0 z-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      ></div>
      <div className="fixed inset-0 z-0 bg-linear-to-b from-transparent via-[#050505] to-purple-900/10 pointer-events-none"></div>

      <nav className="flex relative justify-between items-center px-8 py-6 mx-auto max-w-7xl border-b backdrop-blur-md z-100 border-white/5">
        <div className="flex gap-2 items-center">
          <Logo />
        </div>
        <div className="hidden gap-8 text-sm font-medium tracking-widest uppercase opacity-70 md:flex">
          <a href="#features" className="transition-colors hover:text-cyan-400">
            Infrastructure
          </a>
          <a href="#agent" className="transition-colors hover:text-cyan-400">
            Norbit AI
          </a>
          <a
            href="#compliance"
            className="transition-colors hover:text-cyan-400"
          >
            Security
          </a>
        </div>
        <ConnectWallet />
      </nav>

      <section className="relative z-10 px-6 pt-32 pb-20 mx-auto max-w-7xl text-center">
        <div className="inline-block px-4 py-1.5 mb-6 border border-purple-500/30 bg-purple-500/5 rounded-full">
          <span className="text-xs uppercase tracking-[0.3em] text-purple-400 font-bold">
            The Agentic Infrastructure for RWA
          </span>
        </div>
        <h1 className="mb-6 text-5xl font-extrabold tracking-tighter leading-none text-white md:text-8xl">
          AUTONOMOUS YIELD. <br />
          <span className="text-transparent bg-clip-text from-cyan-400 via-white to-purple-500 bg-linear-to-r">
            REAL WORLD ASSETS.
          </span>
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed md:text-xl text-slate-400">
          Move treasury at internet speed. An AI-driven stack that manages
          on-chain RWAs with Circle custody, Stork oracles, and Uniswap v4
          yield.
        </p>

        <div className="flex flex-col gap-4 justify-center items-center md:flex-row">
          <a href="/chats">
            <button
              className="overflow-hidden relative px-8 py-4 text-sm font-bold tracking-widest text-black uppercase bg-white transition-all group hover:scale-105"
              // onMouseEnter={() => setIsHovered(true)}
              // onMouseLeave={() => setIsHovered(false)}
            >
              <span className="flex relative z-10 gap-2 items-center">
                OPEN APPLICATION <Terminal size={18} />
              </span>
              <div className="absolute inset-0 bg-cyan-400 transition-transform transform translate-y-full group-hover:translate-y-0"></div>
            </button>
          </a>
          {/* <div className="text-xs tracking-widest uppercase opacity-50">
            98% Approval Rate • Non-Custodial Logic
          </div> */}
        </div>

        <div className="grid grid-cols-1 gap-6 mt-24 md:grid-cols-3">
          {[
            { label: "Circle Wallets", value: "Regulated", icon: ShieldCheck },
            { label: "Stork Oracles", value: "Real-Time", icon: Zap },
            { label: "Uniswap v4", value: "Yield Hooks", icon: BarChart3 },
          ].map((item, i) => (
            <div
              key={i}
              className="flex flex-col items-center p-8 text-center rounded-2xl border backdrop-blur-xl transition-all border-white/10 bg-white/5 group hover:border-cyan-500/50"
            >
              <item.icon
                className="mb-4 text-cyan-400 transition-transform group-hover:scale-110"
                size={32}
              />
              <h3 className="mb-1 text-sm font-bold tracking-widest text-white uppercase">
                {item.label}
              </h3>
              <p className="text-xs tracking-tighter uppercase text-slate-500">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="agent"
        className="relative z-10 px-6 py-24 mx-auto max-w-7xl border-t border-white/5"
      >
        <div className="grid gap-16 items-center md:grid-cols-2">
          <div className="relative">
            <div className="absolute -inset-20 bg-cyan-500/20 rounded-full blur-[120px] animate-pulse"></div>
            <div className="relative p-12 bg-black border border-white/10 rounded-[40px] shadow-2xl">
              <div className="flex gap-4 items-center mb-8">
                <div className="flex justify-center items-center w-12 h-12 bg-cyan-500 rounded-full">
                  <Cpu className="text-black" />
                </div>
                <div>
                  <h4 className="font-bold text-white">Norbit v1.0</h4>
                  <p className="text-xs tracking-widest text-cyan-400 uppercase">
                    Active • Ready to deploy
                  </p>
                </div>
              </div>
              <div className="space-y-4 font-mono text-sm">
                <div className="text-slate-500">{">"} norbit --query-yield</div>
                <div className="text-cyan-400">
                  Current APY: 12.4% (RWA-Back Liquidity)
                </div>
                <div className="text-slate-500">
                  {">"} norbit --rebalance-strategy --aggressive
                </div>
                <div className="p-3 italic border-l-2 border-purple-500 bg-white/5 text-slate-300">
                  Adjusting OrbitHooks on Uniswap v4 to optimize for current
                  oracle volatility...
                </div>
              </div>
            </div>
          </div>
          <div>
            <h2 className="mb-6 text-4xl font-bold leading-tight text-white">
              One Interface. Zero Plumbing. <br />
              <span className="text-cyan-400">Meet Norbit.</span>
            </h2>
            <p className="mb-8 text-lg leading-relaxed text-slate-400">
              Tired of stitching together fragmented oracles and custody
              providers? Norbit is your agentic layer—an intelligent stack that
              reacts to market data instantly, managing your RWA treasury while
              you focus on scaling.
            </p>
            <ul className="space-y-4">
              {[
                "Conversational Strategy Querying",
                "Instant Rebalancing via Stork Oracles",
                "Verifiable On-Chain Execution",
              ].map((text, i) => (
                <li
                  key={i}
                  className="flex gap-3 items-center text-sm font-semibold tracking-wide text-slate-200"
                >
                  <div className="w-1.5 h-1.5 bg-cyan-400 rotate-45"></div>{" "}
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section
        id="faq"
        className="relative z-10 px-6 py-24 mx-auto max-w-3xl border-t border-white/5"
      >
        <h2 className="mb-12 text-3xl italic font-bold tracking-tight text-center text-white">
          Technical Intelligence <span className="text-cyan-400">_</span>
        </h2>
        <Faq />
      </section>

      <footer className="relative z-10 pt-20 pb-10 border-t border-white/5 bg-black/50">
        <div className="px-6 mx-auto mb-20 max-w-4xl text-center">
          <h2 className="mb-8 text-4xl font-bold text-white">
            Ready to move at internet speed?
          </h2>
          <a href="/chats">
            <button className="px-12 py-5 bg-linear-to-r from-cyan-500 to-purple-600 text-white font-black uppercase tracking-[0.2em] rounded-sm hover:shadow-[0_0_40px_rgba(34,211,238,0.4)] transition-all">
              Open Orbit Agent
            </button>
          </a>
          <p className="mt-6 text-xs tracking-widest uppercase text-slate-500">
            By initializing, you agree to our Terms of Protocol.
          </p>
        </div>
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-8 opacity-40 text-[10px] uppercase tracking-[0.4em]">
          <div className="flex gap-8">
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
            <a href="#">Security</a>
          </div>
          <div>© 2026 Orbit Agentic Labs. Built for Arc L1.</div>
        </div>
      </footer>
    </div>
  );
};

export default OrbitLandingPage;
