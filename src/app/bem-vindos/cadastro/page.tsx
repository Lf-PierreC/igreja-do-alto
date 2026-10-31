"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { HOW_HEARD_OPTIONS, HowHeardChannel } from "@/types/bemVindos";
import {
  Heart,
  CheckCircle2,
  Sparkles,
  MapPin,
  Calendar,
  MessageSquare,
  Instagram,
  Users,
  Compass,
  ArrowRight,
  ShieldCheck,
  Phone,
  User,
  Home,
} from "lucide-react";

export default function CadastroVisitantePage() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [howHeard, setHowHeard] = useState<HowHeardChannel | "">("");
  const [howHeardDetail, setHowHeardDetail] = useState("");
  const [visitDate, setVisitDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [servicePeriod, setServicePeriod] = useState("Domingo Noite (18h)");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("Mogi das Cruzes");
  const [prayerRequest, setPrayerRequest] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Formatação amigável de telefone/WhatsApp
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, "");
    if (raw.length > 11) raw = raw.slice(0, 11);

    if (raw.length <= 2) {
      setPhone(raw ? `(${raw}` : "");
    } else if (raw.length <= 6) {
      setPhone(`(${raw.slice(0, 2)}) ${raw.slice(2)}`);
    } else if (raw.length <= 10) {
      setPhone(`(${raw.slice(0, 2)}) ${raw.slice(2, 6)}-${raw.slice(6)}`);
    } else {
      setPhone(`(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7, 11)}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage("Por favor, preencha o seu nome completo.");
      return;
    }

    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      setErrorMessage("Por favor, informe seu número de WhatsApp completo com DDD.");
      return;
    }

    if (!howHeard) {
      setErrorMessage("Por favor, conte-nos onde ou através de quem nos conheceu.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/bem-vindos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "PUBLIC_VISITOR_REGISTER",
          payload: {
            fullName: fullName.trim(),
            phone,
            howHeard,
            howHeardDetail: howHeardDetail.trim() || undefined,
            visitDate,
            servicePeriod,
            neighborhood: neighborhood.trim() || undefined,
            city: city.trim() || undefined,
            prayerRequest: prayerRequest.trim() || undefined,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Ocorreu um erro ao salvar o seu cadastro.");
      }

      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setErrorMessage(err.message || "Erro de conexão ao enviar o formulário.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-[#DCDACF] flex flex-col items-center justify-center p-4 sm:p-6 text-[#252525]">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-stone-200 overflow-hidden text-center p-6 sm:p-10 animate-fade-in">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5 shadow-inner">
            <CheckCircle2 className="w-11 h-11" />
          </div>

          <div className="inline-flex items-center gap-2 bg-[#CB4B3B]/10 text-[#CB4B3B] px-3.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Seja Muito Bem-Vindo(a)!
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#252525] tracking-tight mb-3">
            Que bênção ter você na Igreja do Alto, {fullName.split(" ")[0]}!
          </h1>

          <p className="text-stone-600 text-sm sm:text-base leading-relaxed mb-6">
            Nossa igreja é um lugar de <strong>Proteção, Provisão e Direção</strong>.
            Ficamos imensamente felizes com a sua presença hoje! Em breve, nossa equipe de acolhimento entrará em contato para te enviar uma palavra de carinho e te desejar uma semana abençoada.
          </p>

          <div className="bg-[#F7F6F2] rounded-2xl p-4 sm:p-5 border border-stone-200 text-left mb-6 space-y-2.5">
            <div className="flex items-start gap-3 text-xs sm:text-sm text-stone-700">
              <MapPin className="w-4 h-4 text-[#CB4B3B] shrink-0 mt-0.5" />
              <span><strong>Endereço:</strong> Rua da Igreja, Mogi das Cruzes - SP</span>
            </div>
            <div className="flex items-start gap-3 text-xs sm:text-sm text-stone-700">
              <Calendar className="w-4 h-4 text-[#CB4B3B] shrink-0 mt-0.5" />
              <span><strong>Nossos Cultos:</strong> Domingos às 10h e às 18h | Quintas às 20h</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="https://instagram.com/igrejadoalto"
              target="_blank"
              rel="noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm shadow hover:opacity-95 transition"
            >
              <Instagram className="w-4 h-4" />
              Siga nosso Instagram
            </a>
            <button
              onClick={() => {
                setFullName("");
                setPhone("");
                setHowHeard("");
                setHowHeardDetail("");
                setPrayerRequest("");
                setSubmitted(false);
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-sm transition"
            >
              Novo Cadastro
            </button>
          </div>

          <div className="mt-8 pt-5 border-t border-stone-100 flex items-center justify-center">
            <BrandLogo variant="on-sand" size="sm" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#DCDACF] text-[#252525] py-8 sm:py-12 px-4 sm:px-6 flex flex-col items-center">
      <div className="w-full max-w-xl">
        {/* Top Header & Branding */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-block mb-3">
            <BrandLogo variant="on-sand" size="md" showTagline={false} />
          </div>
          <div className="inline-flex items-center gap-2 bg-[#CB4B3B] text-white px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm mb-3">
            <Heart className="w-3.5 h-3.5 fill-white" />
            Ministério Bem-Vindos
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#252525] tracking-tight">
            Seja Muito Bem-Vindo(a)!
          </h1>
          <p className="text-stone-600 text-sm sm:text-base mt-2 max-w-md mx-auto leading-relaxed">
            É uma honra receber você na Igreja do Alto! Queremos abençoar a sua vida e te acolher com todo amor.
          </p>
        </div>

        {/* Card do Formulário */}
        <div className="bg-white rounded-3xl shadow-xl border border-stone-200/80 p-6 sm:p-8">
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3 animate-shake">
              <span className="font-bold">⚠️</span>
              <p>{errorMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Nome Completo */}
            <div>
              <label htmlFor="fullName" className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                Seu Nome Completo <span className="text-[#CB4B3B]">*</span>
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="fullName"
                  type="text"
                  required
                  placeholder="Ex: João da Silva Santos"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-[#F7F6F2] border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 focus:bg-white focus:border-[#CB4B3B] focus:ring-2 focus:ring-[#CB4B3B]/20 transition outline-none"
                />
              </div>
            </div>

            {/* 2. Celular com WhatsApp */}
            <div>
              <label htmlFor="phone" className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                WhatsApp / Celular com DDD <span className="text-[#CB4B3B]">*</span>
              </label>
              <div className="relative">
                <Phone className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="phone"
                  type="tel"
                  required
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={handlePhoneChange}
                  className="w-full pl-11 pr-4 py-3 bg-[#F7F6F2] border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 focus:bg-white focus:border-[#CB4B3B] focus:ring-2 focus:ring-[#CB4B3B]/20 transition outline-none font-medium"
                />
              </div>
              <p className="text-[11px] text-stone-500 mt-1.5 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Seu número é protegido e usado apenas para mensagem de acolhimento.
              </p>
            </div>

            {/* 3. Onde nos conheceu */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                Como conheceu a Igreja do Alto? <span className="text-[#CB4B3B]">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {HOW_HEARD_OPTIONS.map((opt) => {
                  const isSelected = howHeard === opt.id;
                  return (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => setHowHeard(opt.id)}
                      className={`text-left p-3.5 rounded-xl border text-xs sm:text-sm font-semibold transition flex items-center justify-between ${
                        isSelected
                          ? "bg-[#CB4B3B]/10 border-[#CB4B3B] text-[#CB4B3B] font-bold shadow-sm"
                          : "bg-[#F7F6F2] border-stone-200 text-stone-700 hover:bg-stone-100"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-[#CB4B3B] shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Detalhe extra se for Indicação ou Outro */}
              {howHeard === "Indicação de Amigo/Familiar" && (
                <div className="mt-3 animate-fade-in">
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
                    Quem te convidou? (Nome do amigo ou parente)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Pedro e Mariana"
                    value={howHeardDetail}
                    onChange={(e) => setHowHeardDetail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:bg-white focus:border-[#CB4B3B] outline-none"
                  />
                </div>
              )}

              {howHeard === "Outro" && (
                <div className="mt-3 animate-fade-in">
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
                    Conte-nos como nos encontrou:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Encontrei num panfleto / evento"
                    value={howHeardDetail}
                    onChange={(e) => setHowHeardDetail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:bg-white focus:border-[#CB4B3B] outline-none"
                  />
                </div>
              )}
            </div>

            {/* 4. Culto e Data da Visita */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                  Culto de Hoje
                </label>
                <select
                  value={servicePeriod}
                  onChange={(e) => setServicePeriod(e.target.value)}
                  className="w-full px-3.5 py-3 bg-[#F7F6F2] border border-stone-300 rounded-xl text-stone-900 text-sm font-medium focus:bg-white focus:border-[#CB4B3B] outline-none"
                >
                  <option value="Domingo Noite (18h)">Domingo Noite (18h)</option>
                  <option value="Domingo Manhã (10h)">Domingo Manhã (10h)</option>
                  <option value="Quinta-feira (20h)">Quinta-feira (20h)</option>
                  <option value="Culto Especial">Culto Especial / Conferência</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                  Data da Visita
                </label>
                <input
                  type="date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full px-3.5 py-3 bg-[#F7F6F2] border border-stone-300 rounded-xl text-stone-900 text-sm font-medium focus:bg-white focus:border-[#CB4B3B] outline-none"
                />
              </div>
            </div>

            {/* 5. Bairro e Cidade (Opcional para Célula) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                  Seu Bairro <span className="text-stone-400 font-normal lowercase">(opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Vila Oliveira"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F7F6F2] border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 text-sm focus:bg-white focus:border-[#CB4B3B] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                  Cidade
                </label>
                <input
                  type="text"
                  placeholder="Mogi das Cruzes"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F7F6F2] border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 text-sm focus:bg-white focus:border-[#CB4B3B] outline-none"
                />
              </div>
            </div>

            {/* 6. Pedido de Oração / Mensagem Opcional */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                Podemos orar por algo específico? <span className="text-stone-400 font-normal lowercase">(opcional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Ex: Pela minha família, saúde, nova oportunidade de emprego..."
                value={prayerRequest}
                onChange={(e) => setPrayerRequest(e.target.value)}
                className="w-full px-4 py-3 bg-[#F7F6F2] border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 text-sm focus:bg-white focus:border-[#CB4B3B] outline-none resize-none"
              />
            </div>

            {/* Botão de Envio */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-[#CB4B3B] hover:bg-[#a93829] text-white font-extrabold text-base shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Cadastrando...
                </>
              ) : (
                <>
                  <span>Enviar Boas-Vindas</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Rodapé e Link para o Portal Interno */}
        <div className="mt-8 text-center text-xs text-stone-600 space-y-2">
          <p>Igreja do Alto — Lugar de Proteção, Provisão e Direção</p>
          <div className="flex items-center justify-center gap-4 pt-2">
            <Link
              href="/bem-vindos/portal"
              className="text-[#CB4B3B] font-bold hover:underline inline-flex items-center gap-1"
            >
              <span>Acesso da Equipe Bem-Vindos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
