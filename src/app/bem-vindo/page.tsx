"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import {
  Heart,
  QrCode,
  Users,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Instagram,
  MapPin,
  Calendar,
  Copy,
  Check,
} from "lucide-react";

export default function BemVindoHubPage() {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/bem-vindo/cadastro` : "";
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <main className="min-h-screen bg-[#DCDACF] text-[#252525] flex flex-col items-center justify-between p-4 sm:p-8">
      {/* Top Header */}
      <header className="w-full max-w-4xl flex items-center justify-between py-4 border-b border-stone-300/80">
        <BrandLogo variant="on-sand" size="sm" showTagline={false} />
        <Link
          href="/bem-vindo/portal"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-stone-800 transition shadow-sm"
        >
          <Users className="w-3.5 h-3.5" />
          <span>Acesso da Equipe</span>
        </Link>
      </header>

      {/* Hero / Main Card */}
      <div className="w-full max-w-2xl my-auto py-8 text-center">
        <div className="inline-flex items-center gap-2 bg-[#CB4B3B] text-white px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-4 shadow-sm">
          <Heart className="w-3.5 h-3.5 fill-white" />
          Ministério Bem-Vindo
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-[#252525] tracking-tight mb-4">
          Igreja do Alto
          <span className="block text-xl sm:text-2xl font-semibold text-stone-700 mt-1">
            Lugar de Proteção, Provisão e Direção
          </span>
        </h1>

        <p className="text-stone-600 text-base sm:text-lg max-w-lg mx-auto mb-8 leading-relaxed">
          Seja muito bem-vindo à nossa casa! É uma imensa alegria ter você conosco em nosso culto.
        </p>

        {/* 2 Main Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          {/* Card 1: Visitante */}
          <Link
            href="/bem-vindo/cadastro"
            className="group p-6 rounded-3xl bg-white border-2 border-transparent hover:border-[#CB4B3B] shadow-lg hover:shadow-xl transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#CB4B3B]/10 text-[#CB4B3B] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-extrabold text-[#252525] group-hover:text-[#CB4B3B] transition-colors">
                Sou Visitante
              </h2>
              <p className="text-stone-600 text-xs sm:text-sm mt-2 leading-relaxed">
                Estou visitando a Igreja do Alto pela primeira vez e quero me conectar, receber uma mensagem e compartilhar pedidos de oração.
              </p>
            </div>

            <div className="mt-6 inline-flex items-center gap-2 text-xs font-extrabold text-[#CB4B3B] uppercase tracking-wider">
              <span>Preencher Boas-Vindas</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 2: Equipe Bem-Vindo */}
          <Link
            href="/bem-vindo/portal"
            className="group p-6 rounded-3xl bg-stone-900 border-2 border-stone-800 hover:border-stone-700 shadow-lg hover:shadow-xl transition-all duration-200 flex flex-col justify-between text-white"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-extrabold text-white group-hover:text-[#DCDACF] transition-colors">
                Portal da Equipe
              </h2>
              <p className="text-stone-300 text-xs sm:text-sm mt-2 leading-relaxed">
                Acesso exclusivo para voluntários dos ministérios Bem-Vindo, A Mais, Evangelismo e Liderança Pastoral para gerenciar contatos e acolhimento.
              </p>
            </div>

            <div className="mt-6 inline-flex items-center gap-2 text-xs font-extrabold text-[#DCDACF] uppercase tracking-wider">
              <span>Entrar no Painel</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>

        {/* QR Code & Share Box */}
        <div className="mt-8 bg-white/70 backdrop-blur-sm rounded-2xl p-5 border border-stone-300/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-stone-200 flex items-center justify-center text-stone-700 shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-800">
                Link de Boas-Vindas para QR Code
              </h3>
              <p className="text-xs text-stone-500 font-mono">
                bemvindo.igrejadoalto.com/cadastro
              </p>
            </div>
          </div>

          <button
            onClick={handleCopyLink}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white border border-stone-300 text-stone-800 font-bold text-xs hover:bg-stone-100 transition inline-flex items-center justify-center gap-2 shrink-0 shadow-sm"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Link Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar Link</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-4xl py-4 border-t border-stone-300/80 text-center text-xs text-stone-600 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>© Igreja do Alto — Ministério Bem-Vindo</span>
        <div className="flex items-center gap-4">
          <a
            href="https://instagram.com/igrejadoalto"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-[#CB4B3B] transition"
          >
            <Instagram className="w-3.5 h-3.5" />
            <span>@igrejadoalto</span>
          </a>
          <Link href="/membros" className="hover:text-[#CB4B3B] transition">
            Portal do Membro
          </Link>
        </div>
      </footer>
    </main>
  );
}
