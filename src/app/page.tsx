"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BrandLogo, MountainIcon } from "@/components/BrandLogo";
import {
  HeartHandshake,
  ShieldCheck,
  BarChart3,
  ClipboardCheck,
  Users,
  ArrowRight,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const copyShareLink = (path: string, key: string) => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${path}`
        : path;
    navigator.clipboard?.writeText(url);
    setCopiedLink(key);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#DCDACF] text-[#252525]">
      {/* Top Brand Header */}
      <header className="bg-[#252525] text-[#DCDACF] border-b-4 border-[#CB4B3B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-wrap items-center justify-between gap-4">
          <BrandLogo variant="on-dark2" size="md" showTagline />
          
        </div>
      </header>

      {/* Hero Banner inspired by Brand Igreja do Alto PDF */}
      <section className="relative overflow-hidden bg-[#CB4B3B] text-[#DCDACF] py-14 sm:py-20 border-b border-[#252525]/15">
        <div className="absolute -right-20 -bottom-24 opacity-10 pointer-events-none">
          <MountainIcon
            size={420}
            circleColor="#252525"
            mountainColor="#252525"
            skyColor="#CB4B3B"
          />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#252525] text-[#DCDACF] text-xs font-extrabold uppercase tracking-widest mb-6">
              <Sparkles className="w-3.5 h-3.5 text-[#DCDACF]" />
              Ministério de Cuidado & Visitação Pastoral
            </span>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl py-1 font-black uppercase tracking-tight leading-[1.05]">
              LUGAR DE{" "}
              <span className="text-[#252525] bg-[#DCDACF] px-2.5 py-3 rounded-lg inline-block">
                PROTEÇÃO
              </span>
              , PROVISÃO E DIREÇÃO.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-[#DCDACF]/95 font-medium max-w-2xl leading-relaxed">
              Plataforma integrada de cuidado pastoral da{" "}
              <strong className="font-black text-white">Igreja do Alto</strong>.
              Conectamos membros que desejam receber uma visita pastoral em seus
              lares aos pastores e líderes encarregados do pastoreio, relatórios
              e acompanhamento contínuo.
            </p>
          </div>
        </div>
      </section>

      {/* Two Main Links / Portals */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 -mt-8 pb-16 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LINK 1: MEMBRO */}
          <div className="rounded-3xl bg-[#F4F3EE] border-2 border-[#252525] shadow-xl flex flex-col justify-between overflow-hidden">
            <div className="p-7 sm:p-9">
              <div className="flex items-center justify-between gap-3 mb-6">
                <span className="px-3.5 py-1.5 rounded-full bg-[#CB4B3B]/15 text-[#CB4B3B] border border-[#CB4B3B]/30 text-xs font-black uppercase tracking-widest">
                  Link 01 • Membros
                </span>
                <button
                  type="button"
                  onClick={() =>
                    copyShareLink("/solicitar-visita", "membro")
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#DCDACF] hover:bg-[#252525] hover:text-[#DCDACF] text-[#252525] text-xs font-bold transition-colors"
                >
                  {copiedLink === "membro" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      Link copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copiar link p/ WhatsApp
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-[#CB4B3B] text-[#DCDACF] flex items-center justify-center shrink-0 shadow-md">
                  <HeartHandshake className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#252525]">
                    Solicitar Visita Pastoral
                  </h2>
                  
                </div>
              </div>

              

            </div>

            <div className="px-7 sm:px-9 py-5 bg-[#DCDACF]/60 border-t border-[#252525]/15 flex items-center justify-between gap-4">
              
              <Link
                href="/solicitar-visita"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#CB4B3B] hover:bg-[#A93829] text-[#DCDACF] font-black text-xs sm:text-sm uppercase tracking-wider shadow-md transition-all"
              >
                Abrir Formulário
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* LINK 2: LÍDERES E PASTORES */}
          <div className="rounded-3xl bg-[#252525] text-[#DCDACF] border-2 border-[#252525] shadow-xl flex flex-col justify-between overflow-hidden">
            <div className="p-7 sm:p-9">
              {/*<div className="flex items-center justify-between gap-3 mb-6">
                <span className="px-3.5 py-1.5 rounded-full bg-[#CB4B3B] text-[#DCDACF] text-xs font-black uppercase tracking-widest">
                  Link 02 • Portal de Pastores & Líderes
                </span>
                <button
                  type="button"
                  onClick={() => copyShareLink("/painel", "lideres")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#363636] hover:bg-[#CB4B3B] text-[#DCDACF] text-xs font-bold transition-colors"
                >
                  {copiedLink === "lideres" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Link copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copiar link dos líderes
                    </>
                  )}
                </button>
              </div>*/}

              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-[#DCDACF] text-[#252525] flex items-center justify-center shrink-0 shadow-md">
                  <ShieldCheck className="w-7 h-7 text-[#CB4B3B]" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#DCDACF]">
                    Painel Pastoral & Indicadores
                  </h2>
                  
                </div>
              </div>

              

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <div className="p-3.5 rounded-2xl bg-[#363636]/90 border border-[#DCDACF]/10">
                  <BarChart3 className="w-5 h-5 text-[#CB4B3B] mb-1.5" />
                  <div className="text-xs font-black uppercase tracking-wider">
                    Dashboard & Alertas
                  </div>
                  <p className="text-[11px] text-[#DCDACF]/75 mt-1">
                    Principais problemas, casos críticos e membros sem visita.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#363636]/90 border border-[#DCDACF]/10">
                  <ClipboardCheck className="w-5 h-5 text-[#CB4B3B] mb-1.5" />
                  <div className="text-xs font-black uppercase tracking-wider">
                    Registro & Relatórios
                  </div>
                  <p className="text-[11px] text-[#DCDACF]/75 mt-1">
                    Formulário pós-visita, observações e nível de cuidado.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#363636]/90 border border-[#DCDACF]/10">
                  <Users className="w-5 h-5 text-[#CB4B3B] mb-1.5" />
                  <div className="text-xs font-black uppercase tracking-wider">
                    Visitas por Pessoa
                  </div>
                  <p className="text-[11px] text-[#DCDACF]/75 mt-1">
                    Prontuário individual e linha do tempo de cada membro.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-7 sm:px-9 py-5 bg-[#1c1c1c] border-t border-[#DCDACF]/10 flex items-center justify-between gap-4">
              
              <Link
                href="/painel"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#CB4B3B] hover:bg-[#A93829] text-[#DCDACF] font-black text-xs sm:text-sm uppercase tracking-wider shadow-md transition-all"
              >
                Acessar Painel
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#252525] text-[#DCDACF]/80 py-6 border-t border-[#DCDACF]/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2.5 font-bold uppercase tracking-wider">
            <MountainIcon size={24} />
            <span>Igreja do Alto — Lugar de Proteção, Provisão e Direção</span>
          </div>
          
        </div>
      </footer>
    </div>
  );
}
