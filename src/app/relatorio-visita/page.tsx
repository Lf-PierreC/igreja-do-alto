"use client";

import React, { useEffect, useState } from "react";
import { BrandLogo, MountainIcon } from "@/components/BrandLogo";
import { INITIAL_DATA } from "@/data/initialData";
import { DatabaseSchema } from "@/types/visitas";
import { NovaVisitaFormTab } from "@/components/painel/NovaVisitaFormTab";
import { ClipboardCheck } from "lucide-react";

export default function RelatorioVisitaLideresPage() {
  const [db, setDb] = useState<DatabaseSchema>(INITIAL_DATA);

  useEffect(() => {
    fetch("/api/dados")
      .then((res) => res.json())
      .then((data: DatabaseSchema) => {
        if (data && data.schemaVersion === 2 && data.members) {
          setDb(data);
        }
      })
      .catch(() => {
        // Fallback to INITIAL_DATA if offline
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#DCDACF] text-[#252525]">
      {/* Header exclusivo de Pastores & Líderes (sem navegação para o painel administrativo) */}
      <header className="bg-[#252525] text-[#DCDACF] border-b-4 border-[#CB4B3B]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <BrandLogo variant="on-dark2" size="sm" showTagline />
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#363636] text-[#DCDACF] text-[11px] font-extrabold uppercase tracking-wider">
            <ClipboardCheck className="w-3.5 h-3.5 text-[#CB4B3B]" />
            Pastores & Líderes
          </span>
        </div>
      </header>

      {/* Conteúdo Principal: Somente o Relatório de Visita Pastoral */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 py-6 sm:py-10">
        <NovaVisitaFormTab
          db={db}
          onReportCreated={(updatedDb) => {
            setDb(updatedDb);
          }}
        />
      </main>

      {/* Rodapé */}
      <footer className="bg-[#252525] text-[#DCDACF]/80 py-5 border-t border-[#DCDACF]/15 mt-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-center gap-2.5 text-xs font-bold uppercase tracking-wider text-center">
          <MountainIcon size={22} />
          <span>Igreja do Alto — Lugar de Proteção, Provisão e Direção</span>
        </div>
      </footer>
    </div>
  );
}
