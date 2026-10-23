"use client";

import React, { useMemo, useState } from "react";
import {
  DatabaseSchema,
  FollowUpNeed,
  SituationLevel,
  VisitReport,
} from "@/types/visitas";
import { formatDateBR, SITUATION_META } from "@/lib/visitasUtils";
import { FOLLOW_UP_NEEDS, SITUATION_LEVELS } from "@/data/formOptions";
import {
  Search,
  FileText,
  Calendar,
  MapPin,
  Users,
  Eye,
  Clock,
  ArrowUpRight,
  PlusCircle,
} from "lucide-react";

interface RelatoriosListTabProps {
  db: DatabaseSchema;
  onOpenReportModal: (report: VisitReport) => void;
  onSelectMemberForHistory: (memberId: string) => void;
  onGoToNewVisit: () => void;
}

export function RelatoriosListTab({
  db,
  onOpenReportModal,
  onSelectMemberForHistory,
  onGoToNewVisit,
}: RelatoriosListTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNeed, setSelectedNeed] = useState<string>("TODOS");
  const [selectedSituation, setSelectedSituation] = useState<string>("TODOS");
  const [selectedPastor, setSelectedPastor] = useState<string>("TODOS");

  const filteredReports = useMemo(() => {
    return db.reports.filter((rep) => {
      const matchesSearch =
        rep.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rep.neighborhood.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (rep.summary || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (rep.internalNotes || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesNeed =
        selectedNeed === "TODOS" ||
        (rep.followUpNeeds || []).includes(selectedNeed as FollowUpNeed);

      const matchesSituation =
        selectedSituation === "TODOS" ||
        rep.situation === (selectedSituation as SituationLevel);

      const matchesPastor =
        selectedPastor === "TODOS" ||
        (rep.visitors || []).includes(selectedPastor);

      return (
        matchesSearch && matchesNeed && matchesSituation && matchesPastor
      );
    });
  }, [
    db.reports,
    searchTerm,
    selectedNeed,
    selectedSituation,
    selectedPastor,
  ]);

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="rounded-3xl bg-[#F4F3EE]  p-6 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#CB4B3B]">
              Histórico Documentado
            </span>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#252525]">
              Relatórios de Visita Pastoral ({filteredReports.length})
            </h2>
          </div>

          <button
            type="button"
            onClick={onGoToNewVisit}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#CB4B3B] hover:bg-[#A93829] text-[#DCDACF] text-xs font-black uppercase tracking-wider shadow transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Novo Relatório de Visita
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div>
            <label
              htmlFor="search-reports"
              className="block text-xs font-extrabold uppercase tracking-wider text-[#252525]/80 mb-1"
            >
              Buscar Pessoa ou Palavra-chave
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-[#252525]/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                id="search-reports"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nome, bairro, relato..."
                className="w-full rounded-xl border-2 border-[#252525]/20 bg-white pl-10 pr-3 py-2 text-sm font-medium"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="filter-need"
              className="block text-xs font-extrabold uppercase tracking-wider text-[#252525]/80 mb-1"
            >
              Necessidade de Acompanhamento
            </label>
            <select
              id="filter-need"
              value={selectedNeed}
              onChange={(e) => setSelectedNeed(e.target.value)}
              className="w-full rounded-xl border-2 border-[#252525]/20 bg-white px-3 py-2 text-sm font-semibold"
            >
              <option value="TODOS">Todas as áreas</option>
              {FOLLOW_UP_NEEDS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-situation"
              className="block text-xs font-extrabold uppercase tracking-wider text-[#252525]/80 mb-1"
            >
              Situação Atual
            </label>
            <select
              id="filter-situation"
              value={selectedSituation}
              onChange={(e) => setSelectedSituation(e.target.value)}
              className="w-full rounded-xl border-2 border-[#252525]/20 bg-white px-3 py-2 text-sm font-semibold"
            >
              <option value="TODOS">Todas as classificações</option>
              {SITUATION_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {SITUATION_META[lvl].emoji} {SITUATION_META[lvl].label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-pastor"
              className="block text-xs font-extrabold uppercase tracking-wider text-[#252525]/80 mb-1"
            >
              Quem Realizou a Visita
            </label>
            <select
              id="filter-pastor"
              value={selectedPastor}
              onChange={(e) => setSelectedPastor(e.target.value)}
              className="w-full rounded-xl border-2 border-[#252525]/20 bg-white px-3 py-2 text-sm font-semibold"
            >
              <option value="TODOS">Todos os visitadores</option>
              {db.pastors.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Reports Cards List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="rounded-3xl bg-[#F4F3EE] border-2 border-[#252525]/20 p-12 text-center">
            <FileText className="w-10 h-10 text-[#CB4B3B] mx-auto mb-3" />
            <h3 className="text-lg font-black uppercase">
              Nenhum relatório encontrado para este filtro
            </h3>
          </div>
        ) : (
          filteredReports.map((report) => {
            const sitMeta = SITUATION_META[report.situation || "bem"];
            return (
              <article
                key={report.id}
                className="rounded-3xl bg-[#F4F3EE]  p-6 shadow-md hover:shadow-xl transition-all"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#252525]/15">
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() =>
                          onSelectMemberForHistory(report.memberId)
                        }
                        className="text-lg sm:text-xl font-black uppercase tracking-tight text-[#252525] hover:text-[#CB4B3B] inline-flex items-center gap-1 transition-colors"
                      >
                        {report.memberName}
                        <ArrowUpRight className="w-4 h-4 text-[#CB4B3B]" />
                      </button>
                      {report.situation && (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${sitMeta.badgeClass}`}
                        >
                          {sitMeta.emoji} {sitMeta.label}
                        </span>
                      )}
                      {report.visitHappened !== "Sim" && (
                        <span className="px-3 py-1 rounded-full bg-neutral-800 text-white text-xs font-black uppercase">
                          {report.visitHappened}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-[#252525]/75 mt-2">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#CB4B3B]" />
                        Data: {formatDateBR(report.visitDate)}
                      </span>
                      {report.approxTime && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#CB4B3B]" />
                          {report.approxTime}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#CB4B3B]" />
                        {report.neighborhood}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-[#CB4B3B]" />
                        {(report.visitors || []).join(", ")}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenReportModal(report)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#252525] hover:bg-[#CB4B3B] text-[#DCDACF] text-xs font-extrabold uppercase tracking-wider transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Relatório Completo
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-4">
                  <div className="lg:col-span-7">
                    <div className="text-[11px] font-black uppercase tracking-wider text-[#252525]/60 mb-1">
                      Como foi a visita ({report.mainReason || "Registro"})
                    </div>
                    <p className="text-sm text-[#252525]/90 leading-relaxed font-medium">
                      {report.summary || report.visitHappened}
                    </p>
                  </div>

                  <div className="lg:col-span-5 bg-[#DCDACF]/65 rounded-2xl p-4 border-l-4 border-[#CB4B3B] space-y-1.5 text-xs">
                    <div className="text-[11px] font-black uppercase tracking-wider text-[#CB4B3B]">
                      Próximos Passos & Acompanhamento
                    </div>
                    {report.nextStep && (
                      <div>
                        <strong>Próximo passo:</strong> {report.nextStep}
                      </div>
                    )}
                    {report.followUpResponsible && (
                      <div>
                        <strong>Responsável:</strong>{" "}
                        {report.followUpResponsible}
                      </div>
                    )}
                    {report.newVisitTimeframe && (
                      <div>
                        <strong>Nova visita:</strong> {report.newVisitTimeframe}
                      </div>
                    )}
                    {report.leadershipNote && (
                      <div className="pt-1 text-[#CB4B3B] font-bold">
                        ⚠️ Liderança: {report.leadershipNote}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#252525]/10 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {(report.followUpNeeds || []).map((need) => (
                      <span
                        key={need}
                        className="px-2.5 py-1 rounded-lg bg-[#252525] text-[#DCDACF] text-xs font-bold"
                      >
                        {need}
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectMemberForHistory(report.memberId)}
                    className="text-xs font-extrabold uppercase tracking-wider text-[#CB4B3B] hover:underline"
                  >
                    Ver prontuário de {report.memberName} →
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
