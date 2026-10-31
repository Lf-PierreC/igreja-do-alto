export type HowHeardChannel =
  | "Instagram"
  | "Indicação de Amigo/Familiar"
  | "Passou na Frente da Igreja"
  | "YouTube"
  | "Google / Pesquisa"
  | "Evento Especial / Conferência"
  | "Outro";

export const HOW_HEARD_OPTIONS: { id: HowHeardChannel; label: string }[] = [
  { id: "Instagram", label: "Instagram da Igreja" },
  { id: "Indicação de Amigo/Familiar", label: "Indicação de Amigo ou Familiar" },
  { id: "Passou na Frente da Igreja", label: "Passou na frente da Igreja" },
  { id: "YouTube", label: "YouTube / Culto Online" },
  { id: "Google / Pesquisa", label: "Google / Pesquisa na Internet" },
  { id: "Evento Especial / Conferência", label: "Evento Especial ou Conferência" },
  { id: "Outro", label: "Outro motivo" },
];

export const CHURCH_BACKGROUND_OPTIONS = [
  { id: "Não frequento nenhuma igreja", label: "Não frequento nenhuma igreja" },
  { id: "Estou procurando uma igreja para congregar", label: "Estou procurando uma igreja para congregar" },
  { id: "Estou afastado(a) no momento", label: "Estou afastado(a) no momento" },
  { id: "Sim, sou de outra igreja", label: "Sim, frequento / sou de outra igreja" },
] as const;

export type ChurchBackgroundOption = (typeof CHURCH_BACKGROUND_OPTIONS)[number]["id"];


export type VisitorStatus =
  | "novo"
  | "mensagem_enviada"
  | "em_conversa"
  | "convidado_celula"
  | "retornou_culto"
  | "integrado"
  | "sem_resposta"
  | "outra_cidade";

export interface VisitorStatusMeta {
  id: VisitorStatus;
  label: string;
  badgeBg: string;
  badgeText: string;
  dotColor: string;
  description: string;
}

export const VISITOR_STATUSES: VisitorStatusMeta[] = [
  {
    id: "novo",
    label: "Novo / Aguardando Contato",
    badgeBg: "bg-amber-100 border-amber-300",
    badgeText: "text-amber-800",
    dotColor: "bg-amber-500",
    description: "Recém-cadastrado no culto, aguardando mensagem inicial de boas-vindas.",
  },
  {
    id: "mensagem_enviada",
    label: "Mensagem Enviada",
    badgeBg: "bg-blue-100 border-blue-300",
    badgeText: "text-blue-800",
    dotColor: "bg-blue-500",
    description: "Equipe enviou mensagem no WhatsApp e aguarda retorno.",
  },
  {
    id: "em_conversa",
    label: "Em Contato / Conversando",
    badgeBg: "bg-purple-100 border-purple-300",
    badgeText: "text-purple-800",
    dotColor: "bg-purple-500",
    description: "Visitante respondeu, dialogando e acolhendo.",
  },
  {
    id: "convidado_celula",
    label: "Convidado p/ Casa do Alto",
    badgeBg: "bg-indigo-100 border-indigo-300",
    badgeText: "text-indigo-800",
    dotColor: "bg-indigo-500",
    description: "Convidado para participar de uma Casa do Alto ou grupo de conexão.",
  },
  {
    id: "retornou_culto",
    label: "Retornou ao Culto",
    badgeBg: "bg-teal-100 border-teal-300",
    badgeText: "text-teal-800",
    dotColor: "bg-teal-500",
    description: "Compareceu a mais de um culto após o primeiro contato.",
  },
  {
    id: "integrado",
    label: "Integrado / Frequentador",
    badgeBg: "bg-emerald-100 border-emerald-300",
    badgeText: "text-emerald-800",
    dotColor: "bg-emerald-500",
    description: "Já frequenta ativamente os cultos e atividades da igreja.",
  },
  {
    id: "sem_resposta",
    label: "Sem Resposta / Pausado",
    badgeBg: "bg-gray-100 border-gray-300",
    badgeText: "text-gray-700",
    dotColor: "bg-gray-400",
    description: "Tentativas de contato sem retorno no momento.",
  },
  {
    id: "outra_cidade",
    label: "De Passagem / Turista",
    badgeBg: "bg-slate-100 border-slate-300",
    badgeText: "text-slate-700",
    dotColor: "bg-slate-400",
    description: "Mora em outra cidade ou veio apenas a passeio/visita.",
  },
];

export interface VisitorNote {
  id: string;
  createdAt: string;
  authorId?: string;
  authorName: string;
  text: string;
  actionTag?: string; // ex: "MENSAGEM_WHATSAPP", "MUDANCA_STATUS", "ANOTACAO"
}

export interface FirstTimeVisitor {
  id: string;
  fullName: string;
  phone: string;
  howHeard: HowHeardChannel;
  howHeardDetail?: string; // Nome de quem indicou ou detalhe extra
  churchBackground?: string; // Já frequenta alguma igreja?
  otherChurchName?: string; // Se frequenta outra igreja, qual?
  visitDate: string; // YYYY-MM-DD
  servicePeriod?: string; // ex: "Domingo Manhã (10h)", "Domingo Noite (18h)", "Quinta-feira (20h)"
  neighborhood?: string;
  city?: string;
  prayerRequest?: string;
  status: VisitorStatus;
  notes: VisitorNote[];
  registeredBy: {
    type: "self" | "member";
    memberId?: string;
    memberName?: string;
  };
  assignedTo?: {
    memberId: string;
    memberName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BemVindosAccessRequest {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  memberPhone: string;
  memberMinistries: string[];
  status: "pendente" | "aprovado" | "recusado";
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  role?: "voluntario" | "lider";
}

export interface BemVindosTeamMember {
  memberId: string;
  memberName: string;
  memberEmail?: string;
  phone: string;
  role: "voluntario" | "lider" | "pastor";
  approvedAt: string;
  approvedBy: string;
}

/** Ministérios que dão direito a participar ou solicitar acesso à plataforma Bem-Vindos */
export const ALLOWED_MINISTRY_PATTERNS = [
  "bem-vindo",
  "bem vindo",
  "a mais",
  "evangelismo",
];

export function isMemberMinistryEligible(currentMinistries?: string[]): boolean {
  if (!currentMinistries || !Array.isArray(currentMinistries)) return false;
  return currentMinistries.some((m) => {
    const lower = m.toLowerCase();
    return ALLOWED_MINISTRY_PATTERNS.some((pattern) => lower.includes(pattern));
  });
}
