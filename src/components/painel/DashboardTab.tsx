"use client";

import React, { useMemo } from "react";
import {
  DatabaseSchema,
  FollowUpNeed,
  VisitReport,
} from "@/types/visitas";
import {
  formatDateBR,
  getDaysSinceVisit,
  getWhatsAppUrl,
  SITUATION_META,
  SITUATION_RANK,
} from "@/lib/visitasUtils";
import { FOLLOW_UP_NEEDS } from "@/data/formOptions";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
  LabelList,
} from "recharts";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  ClipboardList,
  UserCheck,
  ArrowUpRight,
  PlusCircle,
  MessageCircle,
  Eye,
  Flame,
  CalendarClock,
  ArrowRight,
} from "lucide-react";

export type PessoasPresetFilter =
  | "TODOS"
  | "PRIORITARIOS"
  | "NUNCA_VISITADOS"
  | "MAIS_60_DIAS";

interface DashboardTabProps {
  db: DatabaseSchema;
  onSelectMemberForHistory: (memberId: string) => void;
  onStartVisitForMember: (memberId: string, requestId?: string) => void;
  onOpenReportModal: (report: VisitReport) => void;
  onViewAllMembers: (presetFilter?: PessoasPresetFilter) => void;
}

const CHART_COLORS = [
  "#CB4B3B",
  "#252525",
  "#A93829",
  "#4A4A4A",
  "#D96B5C",
  "#6E6C64",
  "#8F3428",
];

export function DashboardTab({
  db,
  onSelectMemberForHistory,
  onStartVisitForMember,
  onOpenReportModal,
  onViewAllMembers,
}: DashboardTabProps) {
  // 1. Necessidades de acompanhamento identificadas nas visitas
  const needStats = useMemo(() => {
    const counts: Record<FollowUpNeed, number> = {
      Espiritual: 0,
      Familiar: 0,
      Conjugal: 0,
      Saúde: 0,
      "Financeira/social": 0,
      Luto: 0,
      "Integração na igreja": 0,
      "Aconselhamento pastoral": 0,
      Outro: 0,
    };

    db.reports.forEach((rep) => {
      (rep.followUpNeeds || []).forEach((need) => {
        if (counts[need] !== undefined) counts[need] += 1;
      });
    });

    db.members.forEach((m) => {
      (m.needs || []).forEach((need) => {
        if (counts[need] !== undefined) counts[need] += 1;
      });
    });

    return FOLLOW_UP_NEEDS.map((need) => ({
      name: need,
      total: counts[need] || 0,
    })).sort((a, b) => b.total - a.total);
  }, [db.reports, db.members]);

  const maxNeedCount = useMemo(
    () => Math.max(1, ...needStats.map((n) => n.total)),
    [needStats]
  );

  // 2. Distribuição pela escala de situação 🟢 🟡 🟠 🔴
  const situationDistribution = useMemo(() => {
    const counts = {
      prioritario: 0,
      atencao: 0,
      acompanhamento: 0,
      bem: 0,
    };
    db.members.forEach((m) => {
      const s = m.situation || "bem";
      if (counts[s] !== undefined) counts[s] += 1;
    });
    return counts;
  }, [db.members]);

  // 3. Casos prioritários (🔴) e em atenção pastoral (🟠 / 🟡)
  const priorityMembers = useMemo(() => {
    return db.members
      .filter((m) => m.situation !== "bem")
      .sort(
        (a, b) =>
          (SITUATION_RANK[b.situation] || 0) -
          (SITUATION_RANK[a.situation] || 0)
      );
  }, [db.members]);

  // 4. Membros sem visita ou há mais tempo desde a última visita
  const membersWithoutRecentVisits = useMemo(() => {
    return [...db.members]
      .map((member) => ({
        member,
        daysSince: getDaysSinceVisit(member.lastVisitDate),
      }))
      .sort((a, b) => {
        if (a.daysSince === null && b.daysSince !== null) return -1;
        if (a.daysSince !== null && b.daysSince === null) return 1;
        if (a.daysSince === null && b.daysSince === null) return 0;
        return (b.daysSince || 0) - (a.daysSince || 0);
      });
  }, [db.members]);

  // 5. Visitas por Pastor / Líder
  const pastorStats = useMemo(() => {
    const counts: Record<string, number> = {};
    db.pastors.forEach((p) => {
      counts[p.name] = 0;
    });
    db.reports.forEach((rep) => {
      (rep.visitors || []).forEach((pastorName) => {
        counts[pastorName] = (counts[pastorName] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [db.pastors, db.reports]);

  const totalPriorityAndAttention =
    situationDistribution.prioritario + situationDistribution.atencao;
  const totalNeverOrLongAgo = membersWithoutRecentVisits.filter(
    (item) => item.daysSince === null || item.daysSince >= 60
  ).length;
  const pendingRequestsCount = db.requests.filter(
    (r) => r.status === "pendente" || r.status === "agendada"
  ).length;

  return (
    <div className="space-y-5 sm:space-y-8">
      {/* KPI Summary Cards — Compact 2x2 on mobile, 4 cols on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {/* Card 1: 🔴 Prioritário & 🟠 Atenção Pastoral */}
        <div className="rounded-2xl bg-[#CB4B3B] text-[#DCDACF] p-3.5 sm:p-6 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider bg-[#252525] text-[#DCDACF] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg truncate">
              Classificação
            </span>
            <Flame className="w-4 h-4 sm:w-6 sm:h-6 text-[#DCDACF] shrink-0" />
          </div>
          <div className="my-2 sm:my-4">
            <div className="text-2xl sm:text-4xl font-black tracking-tight leading-none">
              {totalPriorityAndAttention}
            </div>
            <div className="text-xs sm:text-sm font-extrabold uppercase tracking-wide mt-1 leading-tight">
              Prioritários & Atenção
            </div>
          </div>
          <p className="text-[11px] sm:text-xs text-[#DCDACF]/90 font-medium leading-snug">
            {situationDistribution.prioritario} prioritários •{" "}
            {situationDistribution.atencao} atenção •{" "}
            {situationDistribution.acompanhamento} acomp.
          </p>
        </div>

        {/* Card 2: Membros sem visita ou há >60 dias */}
        <div className="rounded-2xl bg-[#252525] text-[#DCDACF] p-3.5 sm:p-6 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider bg-[#CB4B3B] text-[#DCDACF] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg truncate">
              Cobertura
            </span>
            <Clock className="w-4 h-4 sm:w-6 sm:h-6 text-[#CB4B3B] shrink-0" />
          </div>
          <div className="my-2 sm:my-4">
            <div className="text-2xl sm:text-4xl font-black tracking-tight leading-none">
              {totalNeverOrLongAgo}
            </div>
            <div className="text-xs sm:text-sm font-extrabold uppercase tracking-wide mt-1 leading-tight">
              Sem Visita / +60 Dias
            </div>
          </div>
          <p className="text-[11px] sm:text-xs text-[#DCDACF]/80 font-medium leading-snug">
            {
              membersWithoutRecentVisits.filter((m) => m.daysSince === null)
                .length
            }{" "}
            nunca visitados •{" "}
            {
              membersWithoutRecentVisits.filter(
                (m) => m.daysSince !== null && m.daysSince >= 60
              ).length
            }{" "}
            há +60 dias.
          </p>
        </div>

        {/* Card 3: Solicitações na Fila */}
        <div className="rounded-2xl bg-[#F4F3EE] text-[#252525] p-3.5 sm:p-6 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider bg-[#DCDACF] text-[#252525] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg truncate">
              Solicitações
            </span>
            <ClipboardList className="w-4 h-4 sm:w-6 sm:h-6 text-[#CB4B3B] shrink-0" />
          </div>
          <div className="my-2 sm:my-4">
            <div className="text-2xl sm:text-4xl font-black tracking-tight leading-none">
              {pendingRequestsCount}
            </div>
            <div className="text-xs sm:text-sm font-extrabold uppercase tracking-wide mt-1 leading-tight">
              Pedidos em Aberto
            </div>
          </div>
          <p className="text-[11px] sm:text-xs text-[#252525]/75 font-semibold leading-snug">
            Aguardando agendamento ou realização.
          </p>
        </div>

        {/* Card 4: Total de Relatórios */}
        <div className="rounded-2xl bg-[#F4F3EE] text-[#252525] p-3.5 sm:p-6 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider bg-[#252525] text-[#DCDACF] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg truncate">
              Relatórios
            </span>
            <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-700 shrink-0" />
          </div>
          <div className="my-2 sm:my-4">
            <div className="text-2xl sm:text-4xl font-black tracking-tight leading-none">
              {db.reports.length}
            </div>
            <div className="text-xs sm:text-sm font-extrabold uppercase tracking-wide mt-1 leading-tight">
              Visitas Realizadas
            </div>
          </div>
          <p className="text-[11px] sm:text-xs text-[#252525]/75 font-semibold leading-snug">
            Visitas documentadas pela liderança.
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Chart 1: Necessidades de Acompanhamento Identificadas */}
        <div className="lg:col-span-7 rounded-3xl bg-[#F4F3EE] p-4 sm:p-7 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 sm:mb-5">
            <div>
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-[#CB4B3B]">
                Diagnóstico Pastoral
              </span>
              <h3 className="text-base sm:text-xl font-black uppercase tracking-tight text-[#252525]">
                Principais Necessidades de Acompanhamento
              </h3>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#DCDACF] text-[#252525] text-[10px] sm:text-xs font-bold">
              Nº de incidências por área
            </span>
          </div>

          {/* Versão Mobile (< sm): Barras horizontais super legíveis com número de incidências */}
          <div className="sm:hidden space-y-2.5">
            {needStats.map((item, index) => {
              const widthPct = Math.max(
                6,
                Math.round((item.total / maxNeedCount) * 100)
              );
              const barColor = CHART_COLORS[index % CHART_COLORS.length];
              return (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#252525]">
                      {item.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-[#252525] text-[#DCDACF] text-[11px] font-black">
                      {item.total}{" "}
                      {item.total === 1 ? "incidência" : "incidências"}
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-[#DCDACF] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: item.total === 0 ? "0%" : `${widthPct}%`,
                        backgroundColor: barColor,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Versão Tablet/Desktop (sm+): Gráfico Recharts com LabelList exibindo o nº de incidências */}
          <div className="hidden sm:block h-[310px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={needStats}
                layout="vertical"
                margin={{ top: 4, right: 42, left: 10, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#C7C4B5"
                />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fill: "#252525", fontSize: 12, fontWeight: 700 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={165}
                  tick={{ fill: "#252525", fontSize: 12, fontWeight: 700 }}
                />
                <Tooltip
                  cursor={{ fill: "#DCDACF", opacity: 0.45 }}
                  contentStyle={{
                    backgroundColor: "#F4F3EE",
                    color: "#CB4B3B",
                    borderRadius: "12px",
                    border: "2px solid #252525",
                    fontWeight: 600,
                  }}
                  formatter={(value: number) => [
                    `${value} ${value === 1 ? "incidência" : "incidências"}`,
                    "Total",
                  ]}
                />
                <Bar dataKey="total" radius={[0, 8, 8, 0]} barSize={22}>
                  {needStats.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                  <LabelList
                    dataKey="total"
                    position="right"
                    fill="#252525"
                    fontSize={12}
                    fontWeight={800}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Termômetro de Situação (🟢🟡🟠🔴) + Equipe Pastoral */}
        <div className="lg:col-span-5 rounded-3xl bg-[#252525] text-[#DCDACF] p-4 sm:p-7 shadow-lg flex flex-col justify-between">
          <div>
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-[#CB4B3B]">
              Situação Atual das Famílias
            </span>
            <h3 className="text-base sm:text-xl font-black uppercase tracking-tight text-[#DCDACF] mb-3 sm:mb-4">
              Classificação Pastoral
            </h3>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-4 sm:mb-5">
              {(
                ["prioritario", "atencao", "acompanhamento", "bem"] as const
              ).map((lvl) => {
                const meta = SITUATION_META[lvl];
                const count = situationDistribution[lvl];
                return (
                  <div
                    key={lvl}
                    className="p-3 sm:p-3.5 rounded-2xl bg-[#363636]/90 border border-[#DCDACF]/10"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base sm:text-lg">{meta.emoji}</span>
                      <span className="text-xl sm:text-2xl font-black text-[#DCDACF]">
                        {count}
                      </span>
                    </div>
                    <div className="text-[11px] sm:text-xs font-bold text-[#DCDACF]/85 mt-1 leading-snug">
                      {meta.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-[#DCDACF]/15 pt-3.5 sm:pt-4">
            <div className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#CB4B3B] mb-2 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4" />
              Visitas Realizadas por Pastor / Líder
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              {pastorStats.map((p) => (
                <div
                  key={p.name}
                  className="flex items-center justify-between text-xs bg-[#363636]/80 px-3 py-2 rounded-xl"
                >
                  <span className="font-bold text-[#DCDACF] truncate pr-2">
                    {p.name}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#CB4B3B] text-[#DCDACF] font-black shrink-0 text-[11px]">
                    {p.count} {p.count === 1 ? "visita" : "visitas"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Priority Action Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* Panel A: Top 10 Casos com necessidade de acompanhamento marcados por líderes */}
        <div className="rounded-3xl bg-[#F4F3EE] shadow-lg overflow-hidden flex flex-col">
          <div className="bg-[#CB4B3B] text-[#DCDACF] px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-[#252525] bg-[#DCDACF] px-2 py-0.5 rounded-md">
                Sinalizados pelos Líderes
              </span>
              <h3 className="text-base sm:text-xl font-black uppercase tracking-tight mt-1">
                Acompanhamento Prioritário & Atenção Pastoral
              </h3>
            </div>
            <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 text-[#DCDACF]" />
          </div>

          <div className="p-4 sm:p-6 divide-y divide-[#252525]/15 flex-1">
            {priorityMembers.slice(0, 10).map((member) => {
              const latestReport = db.reports.find(
                (r) => r.memberId === member.id
              );
              const meta = SITUATION_META[member.situation || "bem"];

              return (
                <div
                  key={member.id}
                  className="py-3.5 sm:py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => onSelectMemberForHistory(member.id)}
                        className="text-sm sm:text-base font-black text-[#252525] hover:text-[#CB4B3B] text-left inline-flex items-center gap-1 transition-colors"
                      >
                        <span className="truncate">{member.name}</span>
                        <ArrowUpRight className="w-4 h-4 text-[#CB4B3B] shrink-0" />
                      </button>
                      <div className="text-[11px] sm:text-xs font-semibold text-[#252525]/70">
                        {member.address.neighborhood} • Última:{" "}
                        <strong>{formatDateBR(member.lastVisitDate)}</strong>
                        {member.followUpResponsible
                          ? ` • Resp.: ${member.followUpResponsible}`
                          : ""}
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider border shrink-0 ${meta.badgeClass}`}
                    >
                      {meta.emoji} {meta.shortLabel}
                    </span>
                  </div>

                  {member.situationNote && (
                    <p className="text-xs text-[#252525]/90 bg-[#DCDACF]/65 p-2.5 sm:p-3 rounded-xl border-l-4 border-[#CB4B3B] my-2 font-medium line-clamp-2">
                      {member.situationNote}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                    <div className="flex flex-wrap gap-1">
                      {(member.needs || []).map((need) => (
                        <span
                          key={need}
                          className="px-2 py-0.5 rounded-md bg-[#252525]/10 text-[#252525] text-[10px] sm:text-[11px] font-bold"
                        >
                          {need}
                        </span>
                      ))}
                      {member.nextStep && (
                        <span className="px-2 py-0.5 rounded-md bg-[#CB4B3B]/15 text-[#CB4B3B] text-[10px] sm:text-[11px] font-bold">
                          👉 {member.nextStep}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {latestReport && (
                        <button
                          type="button"
                          onClick={() => onOpenReportModal(latestReport)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#DCDACF] hover:bg-[#252525] hover:text-[#DCDACF] text-[#252525] text-[11px] sm:text-xs font-bold transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Relatório
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onStartVisitForMember(member.id)}
                        className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#CB4B3B] hover:bg-[#A93829] text-[#DCDACF] text-[11px] sm:text-xs font-extrabold uppercase tracking-wider transition-colors"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        Visitar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rodapé: Visualizar todos os casos */}
          <div className="px-4 sm:px-6 py-3.5 bg-[#DCDACF]/55 border-t border-[#252525]/15">
            <button
              type="button"
              onClick={() => onViewAllMembers("PRIORITARIOS")}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#252525] hover:bg-[#CB4B3B] text-[#DCDACF] text-xs font-black uppercase tracking-wider transition-colors"
            >
              <span>
                Visualizar todos os casos ({priorityMembers.length})
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Panel B: Top 10 Membros sem visita ou com mais tempo da última visita */}
        <div className="rounded-3xl bg-[#F4F3EE] shadow-lg overflow-hidden flex flex-col">
          <div className="bg-[#252525] text-[#DCDACF] px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-3 border-b-4 border-[#CB4B3B]">
            <div>
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-[#CB4B3B]">
                Tempo desde a Última Visita
              </span>
              <h3 className="text-base sm:text-xl font-black uppercase tracking-tight mt-1">
                Membros Sem Visita ou Há Mais Tempo
              </h3>
            </div>
            <CalendarClock className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 text-[#CB4B3B]" />
          </div>

          <div className="p-4 sm:p-6 divide-y divide-[#252525]/15 flex-1">
            {membersWithoutRecentVisits
              .slice(0, 10)
              .map(({ member, daysSince }) => {
                const isNeverVisited = daysSince === null;
                const isLongOverdue = daysSince !== null && daysSince >= 90;

                return (
                  <div
                    key={member.id}
                    className="py-3 sm:py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => onSelectMemberForHistory(member.id)}
                          className="text-sm sm:text-base font-black text-[#252525] hover:text-[#CB4B3B] text-left transition-colors"
                        >
                          {member.name}
                        </button>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isNeverVisited
                              ? "bg-[#CB4B3B] text-[#DCDACF]"
                              : isLongOverdue
                              ? "bg-[#252525] text-[#DCDACF]"
                              : "bg-[#DCDACF] text-[#252525]"
                          }`}
                        >
                          {isNeverVisited
                            ? "Nunca visitado"
                            : `Há ${daysSince} dias`}
                        </span>
                      </div>

                      <div className="text-[11px] sm:text-xs text-[#252525]/75 font-medium mt-0.5">
                        {member.address.neighborhood} • {member.relationship} •
                        Última:{" "}
                        <strong>{formatDateBR(member.lastVisitDate)}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                      <a
                        href={getWhatsAppUrl(member.phone, member.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#DCDACF] hover:bg-emerald-800 hover:text-white text-[#252525] text-[11px] sm:text-xs font-bold transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        WhatsApp
                      </a>
                      <button
                        type="button"
                        onClick={() => onStartVisitForMember(member.id)}
                        className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#252525] hover:bg-[#CB4B3B] text-[#DCDACF] text-[11px] sm:text-xs font-extrabold uppercase tracking-wider transition-colors"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        Visitar
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Rodapé: Visualizar todos os casos */}
          <div className="px-4 sm:px-6 py-3.5 bg-[#DCDACF]/55 border-t border-[#252525]/15">
            <button
              type="button"
              onClick={() => onViewAllMembers("TODOS")}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#252525] hover:bg-[#CB4B3B] text-[#DCDACF] text-xs font-black uppercase tracking-wider transition-colors"
            >
              <span>
                Visualizar todos os casos ({membersWithoutRecentVisits.length})
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
