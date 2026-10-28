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
  Lock,
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

      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-[#CB4B3B] text-[#DCDACF] py-12 sm:py-16 border-b border-[#252525]/15">
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
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#252525] text-[#DCDACF] text-xs font-extrabold uppercase tracking-widest mb-5">
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
              lares.
            </p>
          </div>
        </div>
      </section>

      {/* Three Portals: Membros, Pastores/Líderes, Administradores */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 -mt-8 pb-16 relative z-20 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PORTAL 1: MEMBROS (/solicitar-visita) */}
          <div className="rounded-3xl bg-[#F4F3EE] border-2 border-[#252525] shadow-xl flex flex-col justify-between overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
                <span className="px-3.5 py-1.5 rounded-full bg-[#CB4B3B]/15 text-[#CB4B3B] border border-[#CB4B3B]/30 text-xs font-black uppercase tracking-widest">
                  Link de Membros
                </span>
                <button
                  type="button"
                  onClick={() => copyShareLink("/solicitar-visita", "membro")}
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

              <div className="flex items-center gap-4 mb-3">
                <div className="w-14 h-14 rounded-2xl bg-[#CB4B3B] text-[#DCDACF] flex items-center justify-center shrink-0 shadow-md">
                  <HeartHandshake className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#252525]">
                    Solicitar Visita Pastoral
                  </h2>
                  <p className="text-xs font-semibold text-[#252525]/70 mt-0.5">
                    Formulário exclusivo para membros e famílias solicitarem
                    uma visita.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 sm:px-8 py-4 bg-[#DCDACF]/60 border-t border-[#252525]/15 flex items-center justify-end gap-4">
              <Link
                href="/solicitar-visita"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#CB4B3B] hover:bg-[#A93829] text-[#DCDACF] font-black text-xs sm:text-sm uppercase tracking-wider shadow-md transition-all"
              >
                Abrir Formulário de Membros
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* PORTAL 2: PASTORES & LÍDERES (/relatorio-visita) */}
          <div className="rounded-3xl bg-[#F4F3EE] border-2 border-[#252525] shadow-xl flex flex-col justify-between overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
                <span className="px-3.5 py-1.5 rounded-full bg-[#252525] text-[#DCDACF] text-xs font-black uppercase tracking-widest">
                  Link de Pastores & Líderes
                </span>
                <button
                  type="button"
                  onClick={() => copyShareLink("/relatorio-visita", "lideres")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#DCDACF] hover:bg-[#252525] hover:text-[#DCDACF] text-[#252525] text-xs font-bold transition-colors"
                >
                  {copiedLink === "lideres" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      Link copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copiar link dos líderes
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-4 mb-3">
                <div className="w-14 h-14 rounded-2xl bg-[#252525] text-[#DCDACF] flex items-center justify-center shrink-0 shadow-md">
                  <ClipboardCheck className="w-7 h-7 text-[#CB4B3B]" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#252525]">
                    Relatório de Visita Pastoral
                  </h2>
                  <p className="text-xs font-semibold text-[#252525]/70 mt-0.5">
                    Acesso direto para pastores e líderes registrarem os
                    relatórios pós-visita.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 sm:px-8 py-4 bg-[#DCDACF]/60 border-t border-[#252525]/15 flex items-center justify-end gap-4">
              <Link
                href="/relatorio-visita"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#252525] hover:bg-[#CB4B3B] text-[#DCDACF] font-black text-xs sm:text-sm uppercase tracking-wider shadow-md transition-all"
              >
                Preencher Relatório de Visita
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* PORTAL 3: ADMINISTRAÇÃO DA IGREJA (/painel) */}
        <div className="rounded-3xl bg-[#252525] text-[#DCDACF] border-2 border-[#252525] shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#CB4B3B] text-[#DCDACF] text-xs font-black uppercase tracking-widest">
                <Lock className="w-3.5 h-3.5" />
                Acesso Restrito • Administradores
              </div>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#DCDACF] text-[#252525] flex items-center justify-center shrink-0 shadow-md">
                  <ShieldCheck className="w-7 h-7 text-[#CB4B3B]" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#DCDACF]">
                    Painel Administrativo & Indicadores
                  </h2>
                  <p className="text-xs sm:text-sm text-[#DCDACF]/75 font-medium mt-0.5">
                    Gestão completa de visitas, indicadores pastorais,
                    prontuário por pessoa e fila de solicitações (requer login).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3 rounded-2xl bg-[#363636]/90 border border-[#DCDACF]/10 flex items-center gap-2.5">
                  <BarChart3 className="w-5 h-5 text-[#CB4B3B] shrink-0" />
                  <span className="text-xs font-black uppercase tracking-wider">
                    Dashboard & Alertas
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-[#363636]/90 border border-[#DCDACF]/10 flex items-center gap-2.5">
                  <ClipboardCheck className="w-5 h-5 text-[#CB4B3B] shrink-0" />
                  <span className="text-xs font-black uppercase tracking-wider">
                    Gestão de Relatórios
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-[#363636]/90 border border-[#DCDACF]/10 flex items-center gap-2.5">
                  <Users className="w-5 h-5 text-[#CB4B3B] shrink-0" />
                  <span className="text-xs font-black uppercase tracking-wider">
                    Prontuário por Pessoa
                  </span>
                </div>
              </div>
            </div>

            <div className="shrink-0">
              <Link
                href="/painel"
                className="w-full lg:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-[#CB4B3B] hover:bg-[#A93829] text-[#DCDACF] font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg transition-all"
              >
                <Lock className="w-4 h-4" />
                Entrar como Administrador
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
