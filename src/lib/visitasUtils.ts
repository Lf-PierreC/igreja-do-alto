import {
  Address,
  NewVisitNeeded,
  NewVisitTimeframe,
  RequestStatus,
  SituationLevel,
  VisitReport,
} from "@/types/visitas";
import { TIMEFRAME_DAYS } from "@/data/formOptions";

const pad = (n: number) => String(n).padStart(2, "0");

/** Data de hoje no fuso local (YYYY-MM-DD). */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function diffDays(fromISO: string, toISO: string): number {
  const a = new Date(`${fromISO}T12:00:00`).getTime();
  const b = new Date(`${toISO}T12:00:00`).getTime();
  return Math.round((b - a) / 86_400_000);
}

export function formatDateBR(isoDate?: string | null): string {
  if (!isoDate) return "Nunca visitado";
  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/** Dias desde a última visita (null = nunca visitado). */
export function getDaysSinceVisit(lastVisitDate: string | null): number | null {
  if (!lastVisitDate) return null;
  return Math.max(0, diffDays(lastVisitDate, todayISO()));
}

/** Dias até uma data (negativo = atrasado). */
export function getDaysUntil(iso?: string | null): number | null {
  if (!iso) return null;
  return diffDays(todayISO(), iso);
}

export function calculateAge(birthDate?: string): number | null {
  if (!birthDate) return null;
  const [y, m, d] = birthDate.split("-").map(Number);
  const [ty, tm, td] = todayISO().split("-").map(Number);
  let age = ty - y;
  if (tm < m || (tm === m && td < d)) age -= 1;
  return age;
}

/** Retorno previsto = data da visita + prazo escolhido em "Quando aproximadamente?". */
export function computeNextVisitDue(
  visitDate: string,
  needsNewVisit?: NewVisitNeeded,
  timeframe?: NewVisitTimeframe
): string | null {
  if (!needsNewVisit || needsNewVisit === "Não" || !timeframe) return null;
  const days = TIMEFRAME_DAYS[timeframe];
  return days ? addDaysISO(visitDate, days) : null;
}

export function formatAddress(a?: Address): string {
  if (!a) return "";
  const streetLine = [a.street, a.number].filter(Boolean).join(", ");
  const withComplement = a.complement ? `${streetLine} – ${a.complement}` : streetLine;
  return [withComplement, a.neighborhood, a.city].filter(Boolean).join(" • ");
}

export function isHappened(report: VisitReport): boolean {
  return report.visitHappened === "Sim";
}

/** Último relatório de visita que aconteceu, por membro. */
export function getLatestHappenedReportByMember(
  reports: VisitReport[]
): Record<string, VisitReport> {
  const map: Record<string, VisitReport> = {};
  reports.filter(isHappened).forEach((r) => {
    const current = map[r.memberId];
    if (!current || r.visitDate > current.visitDate) map[r.memberId] = r;
  });
  return map;
}

export function getWhatsAppUrl(phone: string, memberName: string, pastorName?: string): string {
  const digits = phone.replace(/\D/g, "");
  const fullNumber = digits.startsWith("55") ? digits : `55${digits}`;
  const greeting = pastorName
    ? `Graça e paz, ${memberName}! Aqui é ${pastorName}, da Igreja do Alto. Estamos entrando em contato sobre a visita pastoral.`
    : `Graça e paz, ${memberName}! Aqui é da equipe pastoral da Igreja do Alto. Gostaríamos de combinar nossa visita pastoral.`;
  return `https://wa.me/${fullNumber}?text=${encodeURIComponent(greeting)}`;
}

/** Textos e cores da pergunta "Como você classificaria a situação atual da pessoa/família?" */
export const SITUATION_META: Record<
  SituationLevel,
  { emoji: string; label: string; shortLabel: string; badgeClass: string; color: string }
> = {
  bem: {
    emoji: "🟢",
    label: "Bem / sem necessidade específica",
    shortLabel: "Bem",
    badgeClass: "bg-emerald-700/15 text-emerald-900 border-emerald-700/30",
    color: "#047857",
  },
  acompanhamento: {
    emoji: "🟡",
    label: "Necessita acompanhamento",
    shortLabel: "Acompanhamento",
    badgeClass: "bg-amber-400/25 text-amber-900 border-amber-500/50",
    color: "#D4A017",
  },
  atencao: {
    emoji: "🟠",
    label: "Necessita atenção pastoral",
    shortLabel: "Atenção pastoral",
    badgeClass: "bg-orange-500/20 text-orange-900 border-orange-600/50",
    color: "#EA580C",
  },
  prioritario: {
    emoji: "🔴",
    label: "Necessita acompanhamento prioritário",
    shortLabel: "Prioritário",
    badgeClass: "bg-[#CB4B3B] text-[#F4F3EE] border-[#CB4B3B]",
    color: "#CB4B3B",
  },
};

export const SITUATION_RANK: Record<SituationLevel, number> = {
  bem: 0,
  acompanhamento: 1,
  atencao: 2,
  prioritario: 3,
};

export const STATUS_META: Record<RequestStatus, { label: string; badgeClass: string }> = {
  pendente: {
    label: "Aguardando agendamento",
    badgeClass: "bg-[#CB4B3B]/15 text-[#CB4B3B] border-[#CB4B3B]/40",
  },
  agendada: {
    label: "Visita agendada",
    badgeClass: "bg-amber-500/15 text-amber-900 border-amber-600/40",
  },
  realizada: {
    label: "Visita realizada",
    badgeClass: "bg-emerald-700/15 text-emerald-900 border-emerald-700/30",
  },
  cancelada: {
    label: "Cancelada",
    badgeClass: "bg-neutral-300 text-neutral-700 border-neutral-400",
  },
};
