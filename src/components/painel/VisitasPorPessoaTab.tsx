"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  DatabaseSchema,
  FollowUpNeed,
  SituationLevel,
  VisitReport,
} from "@/types/visitas";
import {
  calculateAge,
  formatAddress,
  formatDateBR,
  getDaysSinceVisit,
  getWhatsAppUrl,
  SITUATION_META,
  SITUATION_RANK,
} from "@/lib/visitasUtils";
import { FOLLOW_UP_NEEDS, SITUATION_LEVELS } from "@/data/formOptions";
import { LightDismissDialog } from "@/components/LightDismissDialog";
import { PessoasPresetFilter } from "@/components/painel/DashboardTab";
import {
  Users,
  Search,
  MapPin,
  Phone,
  MessageCircle,
  PlusCircle,
  Clock,
  FileText,
  Flame,
  Eye,
  RotateCcw,
  ChevronRight,
  X,
} from "lucide-react";

interface VisitasPorPessoaTabProps {
  db: DatabaseSchema;
  selectedMemberId: string | null;
  presetFilter?: PessoasPresetFilter;
  onSelectMember: (memberId: string) => void;
  onStartVisitForMember: (memberId: string) => void;
  onOpenReportModal: (report: VisitReport) => void;
  onDbUpdated: (updatedDb: DatabaseSchema) => void;
}

export function VisitasPorPessoaTab({
  db,
  selectedMemberId,
  presetFilter,
  onSelectMember,
  onStartVisitForMember,
  onOpenReportModal,
  onDbUpdated,
}: VisitasPorPessoaTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNeed, setSelectedNeed] = useState<string>("TODOS");
  const [selectedSituation, setSelectedSituation] = useState<string>("TODOS");
  const [selectedPastor, setSelectedPastor] = useState<string>("TODOS");
  const [quickFilter, setQuickFilter] = useState<PessoasPresetFilter>(
    presetFilter || "TODOS"
  );
  const [isUpdatingSituation, setIsUpdatingSituation] = useState(false);
  const [mobileModalOpen, setMobileModalOpen] = useState(false);
  const profileSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (presetFilter) {
      setQuickFilter(presetFilter);
    }
  }, [presetFilter]);

  const normalizeText = (text?: string) =>
    (text || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const filteredMembers = useMemo(() => {
    const normQuery = normalizeText(searchQuery.trim());

    return db.members
      .map((member) => {
        const memberReps = db.reports.filter((r) => r.memberId === member.id);
        const allNeeds = Array.from(
          new Set([
            ...(member.needs || []),
            ...memberReps.flatMap((r) => r.followUpNeeds || []),
          ])
        );
        const allVisitors = Array.from(
          new Set([
            ...(member.followUpResponsible ? [member.followUpResponsible] : []),
            ...(member.lastVisitedBy ? [member.lastVisitedBy] : []),
            ...memberReps.flatMap((r) => r.visitors || []),
          ])
        );

        return {
          member,
          daysSince: getDaysSinceVisit(member.lastVisitDate),
          visitCount: memberReps.length,
          allNeeds,
          allVisitors,
        };
      })
      .filter(({ member, daysSince, allNeeds, allVisitors }) => {
        if (normQuery) {
          const searchable = [
            member.name,
            member.spouseName,
            member.familyInChurch,
            member.address.neighborhood,
            member.activityName,
            member.phone,
            member.situationNote,
          ]
            .map(normalizeText)
            .join(" ");
          if (!searchable.includes(normQuery)) return false;
        }

        if (
          selectedNeed !== "TODOS" &&
          !allNeeds.includes(selectedNeed as FollowUpNeed)
        ) {
          return false;
        }

        if (
          selectedSituation !== "TODOS" &&
          member.situation !== (selectedSituation as SituationLevel)
        ) {
          return false;
        }

        if (
          selectedPastor !== "TODOS" &&
          !allVisitors.some((v) =>
            v.toLowerCase().includes(selectedPastor.toLowerCase())
          )
        ) {
          return false;
        }

        if (quickFilter === "PRIORITARIOS") {
          return (
            member.situation === "prioritario" || member.situation === "atencao"
          );
        }
        if (quickFilter === "NUNCA_VISITADOS") {
          return daysSince === null;
        }
        if (quickFilter === "MAIS_60_DIAS") {
          return daysSince === null || daysSince >= 60;
        }
        return true;
      })
      .sort((a, b) => {
        const rankDiff =
          (SITUATION_RANK[b.member.situation] || 0) -
          (SITUATION_RANK[a.member.situation] || 0);
        if (rankDiff !== 0) return rankDiff;
        if (a.daysSince === null && b.daysSince !== null) return -1;
        if (a.daysSince !== null && b.daysSince === null) return 1;
        return (b.daysSince || 0) - (a.daysSince || 0);
      });
  }, [
    db.members,
    db.reports,
    searchQuery,
    selectedNeed,
    selectedSituation,
    selectedPastor,
    quickFilter,
  ]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedNeed !== "TODOS" ||
    selectedSituation !== "TODOS" ||
    selectedPastor !== "TODOS" ||
    quickFilter !== "TODOS";

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedNeed("TODOS");
    setSelectedSituation("TODOS");
    setSelectedPastor("TODOS");
    setQuickFilter("TODOS");
  };

  const activeMember = useMemo(() => {
    const id = selectedMemberId || filteredMembers[0]?.member.id;
    return (
      filteredMembers.find((item) => item.member.id === id)?.member ||
      filteredMembers[0]?.member ||
      db.members.find((m) => m.id === id) ||
      db.members[0]
    );
  }, [selectedMemberId, filteredMembers, db.members]);

  const memberReports = useMemo(() => {
    if (!activeMember) return [];
    return db.reports
      .filter((r) => r.memberId === activeMember.id)
      .sort((a, b) => (a.visitDate < b.visitDate ? 1 : -1));
  }, [db.reports, activeMember]);

  const activeMemberDaysSince = activeMember
    ? getDaysSinceVisit(activeMember.lastVisitDate)
    : null;

  const handleMemberItemClick = (memberId: string) => {
    onSelectMember(memberId);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobileModalOpen(true);
    }
  };

  const handleUpdateSituation = async (newLevel: SituationLevel) => {
    if (!activeMember) return;
    setIsUpdatingSituation(true);
    try {
      const res = await fetch("/api/dados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_MEMBER_SITUATION",
          payload: {
            memberId: activeMember.id,
            situation: newLevel,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.db) {
        onDbUpdated(data.db);
      }
    } finally {
      setIsUpdatingSituation(false);
    }
  };

  const renderMemberProfileAndTimeline = (inModal = false) => {
    if (!activeMember) return null;

    return (
      <div className={inModal ? "" : "space-y-5"}>
        <div
          className={`bg-[#F4F3EE] overflow-hidden ${
            inModal ? "" : "rounded-3xl shadow-lg"
          }`}
        >
          <div className="bg-[#252525] text-[#DCDACF] p-4 sm:p-7 border-b-4 border-[#CB4B3B]">
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <span className="inline-block px-2.5 py-1 sm:px-3 sm:py-1 rounded-full bg-[#CB4B3B] text-[#DCDACF] text-[10px] sm:text-[11px] font-black uppercase tracking-widest">
                  {activeMember.relationship}
                  {activeMember.attendanceTime
                    ? ` • ${activeMember.attendanceTime}`
                    : ""}
                  {activeMember.activityName
                    ? ` • ${activeMember.activityName}`
                    : ""}
                </span>

                {inModal && (
                  <button
                    type="button"
                    onClick={() => setMobileModalOpen(false)}
                    aria-label="Fechar prontuário"
                    className="min-h-[40px] min-w-[40px] -mt-1 -mr-1 inline-flex items-center justify-center rounded-xl bg-[#363636] text-[#DCDACF] hover:bg-[#CB4B3B] hover:text-white transition-colors shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
                <div>
                  <h2 className="text-xl sm:text-3xl font-black uppercase tracking-tight">
                    {activeMember.name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-[#DCDACF]/85 font-semibold mt-2">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#CB4B3B] shrink-0" />
                      {formatAddress(activeMember.address)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-[#CB4B3B] shrink-0" />
                      {activeMember.phone}
                    </span>
                  </div>
                  {(activeMember.maritalStatus ||
                    activeMember.spouseName ||
                    activeMember.birthDate) && (
                    <div className="text-xs text-[#DCDACF]/70 mt-1.5">
                      {activeMember.maritalStatus}
                      {activeMember.spouseName
                        ? ` (Cônjuge: ${activeMember.spouseName})`
                        : ""}
                      {activeMember.birthDate
                        ? ` • ${calculateAge(activeMember.birthDate)} anos`
                        : ""}
                      {activeMember.householdSize
                        ? ` • ${activeMember.householdSize} pessoa(s) na casa`
                        : ""}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={getWhatsAppUrl(activeMember.phone, activeMember.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-[#363636] hover:bg-emerald-700 text-[#DCDACF] text-xs font-extrabold uppercase tracking-wider transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      if (inModal) setMobileModalOpen(false);
                      onStartVisitForMember(activeMember.id);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-[#CB4B3B] hover:bg-[#A93829] text-[#DCDACF] text-xs font-extrabold uppercase tracking-wider transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Registrar Visita
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="p-3.5 sm:p-4 rounded-2xl bg-[#DCDACF]/70 border border-[#252525]/15">
                <div className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#252525]/70">
                  Total de Visitas
                </div>
                <div className="text-xl sm:text-2xl font-black text-[#252525] mt-1">
                  {memberReports.length}{" "}
                  <span className="text-xs sm:text-sm font-bold">
                    {memberReports.length === 1 ? "visita" : "visitas"}
                  </span>
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-[#DCDACF]/70 border border-[#252525]/15">
                <div className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#252525]/70">
                  Última Visita
                </div>
                <div className="text-xl sm:text-2xl font-black text-[#CB4B3B] mt-1">
                  {activeMemberDaysSince === null
                    ? "Nunca"
                    : `${activeMemberDaysSince} dias`}
                </div>
                <div className="text-[10px] sm:text-[11px] font-bold text-[#252525]/70">
                  Data: {formatDateBR(activeMember.lastVisitDate)}
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1 p-3.5 sm:p-4 rounded-2xl bg-[#DCDACF]/70 border border-[#252525]/15">
                <div className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#252525]/70">
                  Responsável pelo Acompanhamento
                </div>
                <div className="text-sm sm:text-base font-black text-[#252525] mt-1">
                  {activeMember.followUpResponsible ||
                    activeMember.lastVisitedBy ||
                    "A definir"}
                </div>
                {activeMember.nextVisitDue && (
                  <div className="text-[11px] font-bold text-[#CB4B3B]">
                    Retorno previsto: {formatDateBR(activeMember.nextVisitDue)}
                  </div>
                )}
              </div>
            </div>

            {(activeMember.needs || []).length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#252525]/70 mr-1">
                  Áreas de necessidade:
                </span>
                {activeMember.needs.map((need) => (
                  <span
                    key={need}
                    className="px-2.5 py-0.5 rounded-lg bg-[#252525] text-[#DCDACF] text-[11px] font-bold"
                  >
                    {need}
                  </span>
                ))}
              </div>
            )}

            {activeMember.situationNote && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-[#F9EAE8] border-2 border-[#CB4B3B] text-[#252525]">
                <div className="text-xs font-black uppercase tracking-wider text-[#CB4B3B] flex items-center gap-1.5 mb-1">
                  <Flame className="w-4 h-4" />
                  Diagnóstico / Observação Pastoral Atual
                </div>
                <p className="text-xs sm:text-sm font-semibold">
                  {activeMember.situationNote}
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-[#252525]/15">
              <div className="text-xs font-black uppercase tracking-wider text-[#252525]">
                Classificação da Situação Atual:
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {SITUATION_LEVELS.map((lvl) => {
                  const meta = SITUATION_META[lvl];
                  const selected = activeMember.situation === lvl;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      disabled={isUpdatingSituation}
                      onClick={() => handleUpdateSituation(lvl)}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-extrabold uppercase tracking-wider border transition-colors ${
                        selected
                          ? lvl === "prioritario"
                            ? "bg-[#CB4B3B] text-[#DCDACF] border-[#CB4B3B]"
                            : "bg-[#252525] text-[#DCDACF] border-[#252525]"
                          : "bg-white text-[#252525] border-[#252525]/25 hover:bg-[#DCDACF]"
                      }`}
                    >
                      {meta.emoji} {meta.shortLabel}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Linha do Tempo de Visitas */}
        <div
          className={`bg-[#F4F3EE] p-4 sm:p-7 ${
            inModal
              ? "border-t-2 border-[#252525]/15"
              : "rounded-3xl shadow-lg"
          }`}
        >
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#CB4B3B]">
                Linha do Tempo Pastoral
              </span>
              <h3 className="text-base sm:text-xl font-black uppercase tracking-tight text-[#252525]">
                Histórico de Visitas de {activeMember.name}
              </h3>
            </div>
            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-[#CB4B3B] shrink-0" />
          </div>

          {memberReports.length === 0 ? (
            <div className="p-6 sm:p-8 rounded-2xl bg-[#DCDACF]/50 border-2 border-dashed border-[#252525]/25 text-center">
              <FileText className="w-8 h-8 text-[#CB4B3B] mx-auto mb-2" />
              <div className="text-sm sm:text-base font-black uppercase text-[#252525]">
                Nenhuma visita registrada ainda
              </div>
              <button
                type="button"
                onClick={() => {
                  if (inModal) setMobileModalOpen(false);
                  onStartVisitForMember(activeMember.id);
                }}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#CB4B3B] text-[#DCDACF] text-xs font-black uppercase tracking-wider"
              >
                <PlusCircle className="w-4 h-4" />
                Registrar Primeira Visita
              </button>
            </div>
          ) : (
            <div className="relative pl-5 sm:pl-6 border-l-4 border-[#CB4B3B] space-y-4 sm:space-y-6">
              {memberReports.map((rep, idx) => (
                <div
                  key={rep.id}
                  className="relative rounded-2xl bg-white border-2 border-[#252525]/15 p-4 sm:p-5 shadow-sm"
                >
                  <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#CB4B3B] border-2 border-[#F4F3EE] absolute -left-[29px] sm:-left-[34px] top-5" />
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-[#252525] text-[#DCDACF] text-xs font-black uppercase">
                        {formatDateBR(rep.visitDate)}
                      </span>
                      {idx === 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-[#CB4B3B]/15 text-[#CB4B3B] text-[10px] sm:text-[11px] font-black uppercase">
                          Mais Recente
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (inModal) setMobileModalOpen(false);
                        onOpenReportModal(rep);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-extrabold uppercase tracking-wider text-[#CB4B3B] hover:underline"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Ver Relatório Completo
                    </button>
                  </div>

                  <div className="text-xs font-bold text-[#252525]/75 mb-2.5">
                    Visitadores:{" "}
                    <strong className="text-[#252525]">
                      {(rep.visitors || []).join(", ")}
                    </strong>
                    {rep.mainReason ? ` • Motivo: ${rep.mainReason}` : ""}
                  </div>

                  {rep.summary && (
                    <p className="text-xs sm:text-sm text-[#252525] leading-relaxed mb-3 font-medium">
                      {rep.summary}
                    </p>
                  )}

                  {rep.nextStep && (
                    <div className="p-2.5 sm:p-3 rounded-xl bg-[#DCDACF]/60 border-l-4 border-[#252525] text-xs">
                      <strong>Próximo passo:</strong> {rep.nextStep}
                      {rep.followUpResponsible
                        ? ` (${rep.followUpResponsible})`
                        : ""}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Barra Completa de Filtros (igual à de Visitas Registradas + Área de Necessidade) */}
      <div className="rounded-3xl bg-[#F4F3EE] p-4 sm:p-6 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#CB4B3B]">
              Prontuário & Filtros Pastorais
            </span>
            <h2 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-[#252525]">
              Visitas por Pessoa ({filteredMembers.length})
            </h2>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#252525] hover:bg-[#CB4B3B] text-[#DCDACF] text-xs font-extrabold uppercase tracking-wider transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Limpar Filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label
              htmlFor="search-person"
              className="block text-xs font-extrabold uppercase tracking-wider text-[#252525]/80 mb-1"
            >
              Buscar Pessoa, Família ou Bairro
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-[#252525]/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                id="search-person"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nome, cônjuge, bairro..."
                className="w-full rounded-xl border-2 border-[#252525]/20 bg-white pl-10 pr-3 py-2 text-sm font-medium"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="filter-person-need"
              className="block text-xs font-extrabold uppercase tracking-wider text-[#252525]/80 mb-1"
            >
              Área de Acompanhamento
            </label>
            <select
              id="filter-person-need"
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
              htmlFor="filter-person-situation"
              className="block text-xs font-extrabold uppercase tracking-wider text-[#252525]/80 mb-1"
            >
              Situação Atual
            </label>
            <select
              id="filter-person-situation"
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
              htmlFor="filter-person-pastor"
              className="block text-xs font-extrabold uppercase tracking-wider text-[#252525]/80 mb-1"
            >
              Visitador / Pastor Responsável
            </label>
            <select
              id="filter-person-pastor"
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

        {/* Filtros rápidos em pílulas */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-3.5 pt-3.5 border-t border-[#252525]/10">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#252525]/65 mr-1">
            Filtro rápido:
          </span>
          {(
            [
              { id: "TODOS", label: "Todos" },
              { id: "PRIORITARIOS", label: "🔴/🟠 Prioritários & Atenção" },
              { id: "NUNCA_VISITADOS", label: "⏳ Nunca Visitados" },
              { id: "MAIS_60_DIAS", label: "+60 Dias sem Visita" },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setQuickFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-colors ${
                quickFilter === f.id
                  ? "bg-[#CB4B3B] text-[#DCDACF]"
                  : "bg-[#DCDACF] text-[#252525] hover:bg-[#252525] hover:text-[#DCDACF]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar: Lista de Pessoas/Famílias */}
        <div className="lg:col-span-5 rounded-3xl bg-[#F4F3EE] shadow-lg overflow-hidden">
          <div className="bg-[#252525] text-[#DCDACF] px-5 py-4 border-b-4 border-[#CB4B3B] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#CB4B3B]">
                Toque em um membro para abrir o prontuário
              </span>
              <h3 className="text-base sm:text-lg font-black uppercase tracking-tight">
                Lista de Membros / Famílias ({filteredMembers.length})
              </h3>
            </div>
            <Users className="w-5 h-5 text-[#CB4B3B] shrink-0" />
          </div>

          {filteredMembers.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <p className="text-sm font-bold text-[#252525]/80">
                Nenhuma pessoa/família encontrada com os filtros selecionados.
              </p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#CB4B3B] text-[#DCDACF] text-xs font-black uppercase tracking-wider"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Mostrar Todos
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#252525]/15 max-h-[680px] overflow-y-auto">
              {filteredMembers.map(
                ({ member, daysSince, visitCount, allNeeds }) => {
                  const isSelected = activeMember?.id === member.id;
                  const sitMeta = SITUATION_META[member.situation || "bem"];

                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => handleMemberItemClick(member.id)}
                      className={`w-full text-left p-4 transition-colors flex flex-col gap-1.5 ${
                        isSelected
                          ? "bg-[#CB4B3B]/15 border-l-8 border-[#CB4B3B]"
                          : "hover:bg-[#DCDACF]/60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-black text-sm sm:text-base text-[#252525] flex items-center gap-1">
                          {member.name}
                          <ChevronRight className="w-4 h-4 text-[#CB4B3B] lg:hidden shrink-0" />
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shrink-0 ${sitMeta.badgeClass}`}
                        >
                          {sitMeta.emoji} {sitMeta.shortLabel}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-[#252525]/75">
                        {member.address.neighborhood} •{" "}
                        {member.activityName || member.relationship}
                      </div>

                      {allNeeds.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {allNeeds.map((need) => (
                            <span
                              key={need}
                              className="px-2 py-0.5 rounded-md bg-[#252525]/10 text-[#252525] text-[10px] font-bold"
                            >
                              {need}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs mt-1">
                        <span className="font-bold text-[#252525]">
                          {visitCount}{" "}
                          {visitCount === 1
                            ? "visita registrada"
                            : "visitas registradas"}
                        </span>
                        <span
                          className={`font-extrabold ${
                            daysSince === null
                              ? "text-[#CB4B3B]"
                              : daysSince >= 60
                              ? "text-amber-800"
                              : "text-emerald-800"
                          }`}
                        >
                          {daysSince === null
                            ? "Nunca visitado"
                            : `Última há ${daysSince} dias`}
                        </span>
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          )}
        </div>

        {/* Right Column (Desktop side-by-side): Ficha Completa da Pessoa + Linha do Tempo */}
        <div ref={profileSectionRef} className="hidden lg:block lg:col-span-7">
          {renderMemberProfileAndTimeline(false)}
        </div>
      </div>

      {/* Modal Único de Prontuário Pastoral no Celular (< lg) ao tocar em um membro */}
      <LightDismissDialog
        open={mobileModalOpen && Boolean(activeMember)}
        onClose={() => setMobileModalOpen(false)}
        title={
          activeMember
            ? `Prontuário: ${activeMember.name}`
            : "Prontuário Pastoral"
        }
        maxWidthClass="max-w-2xl"
        rawContent
      >
        {renderMemberProfileAndTimeline(true)}
      </LightDismissDialog>
    </div>
  );
}
