/**
 * Listas de opções dos formulários da Igreja do Alto.
 *
 * Para adicionar/remover uma opção em qualquer pergunta, basta editar a lista
 * correspondente aqui. Formulários, filtros e gráficos usam estas listas.
 */

// ---------------------------------------------------------------------------
// 1. Formulário — Solicitação de Visita Pastoral (membro)
// ---------------------------------------------------------------------------

export const MARITAL_STATUS = [
  "Solteiro(a)",
  "Casado(a)",
  "Viúvo(a)",
  "Divorciado(a)",
  "Outro",
] as const;

export const CHURCH_RELATIONSHIP = [
  "Membro",
  "Frequentador(a)",
  "Visitante frequente",
  "Comecei a frequentar recentemente",
  "Estou afastado(a)",
  "Outro",
] as const;

export const ATTENDANCE_TIME = [
  "Menos de 3 meses",
  "3 a 6 meses",
  "6 meses a 1 ano",
  "1 a 3 anos",
  "Mais de 3 anos",
] as const;

export const YES_NO = ["Sim", "Não"] as const;

export const REQUESTER_TYPES = [
  "Eu mesmo(a)",
  "Familiar",
  "Pastor/liderança",
  "A igreja está organizando a visita",
] as const;

export const REQUEST_REASONS = [
  "Visita pastoral / comunhão",
  "Oração",
  "Pessoa/família afastada",
  "Enfermidade",
  "Luto",
  "Dificuldade familiar",
  "Dificuldade financeira",
  "Aconselhamento",
  "Novo na igreja",
  "Conhecer melhor a família",
  "Outro",
  "Prefiro conversar pessoalmente",
] as const;

export const WEEK_DAYS = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
] as const;

export const SHIFTS = ["Manhã", "Tarde", "Noite", "A combinar"] as const;

// ---------------------------------------------------------------------------
// 2. Formulário — Relatório de Visita Pastoral (liderança)
// ---------------------------------------------------------------------------

/** Opção extra exibida junto com os visitadores cadastrados. */
export const OTHER_LEADER = "Outro líder autorizado";

export const VISIT_HAPPENED = [
  "Sim",
  "Não — pessoa não estava",
  "Não — precisou remarcar",
  "Não — outro motivo",
] as const;

export const VISIT_REASONS = [
  "Comunhão / acompanhamento",
  "Integração",
  "Novo membro/frequentador",
  "Afastamento/ausência",
  "Enfermidade",
  "Luto",
  "Questão familiar",
  "Questão financeira",
  "Aconselhamento",
  "Oração",
  "Outro",
] as const;

/** Situação atual da pessoa/família (🟢 🟡 🟠 🔴). Textos em SITUATION_META. */
export const SITUATION_LEVELS = [
  "bem",
  "acompanhamento",
  "atencao",
  "prioritario",
] as const;

export const SERVICE_ATTENDANCE = [
  "Frequentemente",
  "Às vezes",
  "Raramente",
  "Não está frequentando",
  "Não se aplica",
] as const;

export const INTEGRATION_LEVELS = [
  "Sim",
  "Parcialmente",
  "Não",
  "Não foi possível avaliar",
] as const;

export const YES_NO_UNKNOWN = ["Sim", "Não", "Não sei"] as const;

export const FOLLOW_UP_NEEDS = [
  "Espiritual",
  "Familiar",
  "Conjugal",
  "Saúde",
  "Financeira/social",
  "Luto",
  "Integração na igreja",
  "Aconselhamento pastoral",
  "Outro",
] as const;

export const LEADERSHIP_COMM = ["Não", "Sim", "Urgente"] as const;

export const NEXT_STEPS = [
  "Nenhum acompanhamento necessário neste momento",
  "Entrar em contato por WhatsApp/telefone",
  "Realizar nova visita",
  "Conversar após um culto",
  "Encaminhar para pastor responsável",
  "Integrar a uma Casa do Alto",
  "Integrar a um ministério",
  "Acompanhamento/discipulado",
  "Apoio social",
  "Outro",
] as const;

export const NEW_VISIT_NEEDED = ["Não", "Sim", "Talvez"] as const;

export const NEW_VISIT_TIMEFRAMES = [
  "Em até 7 dias",
  "Em até 15 dias",
  "Em até 30 dias",
  "Em até 60 dias",
  "A definir",
] as const;

/** Quantos dias somar à data da visita para calcular o retorno previsto. */
export const TIMEFRAME_DAYS: Record<(typeof NEW_VISIT_TIMEFRAMES)[number], number | null> = {
  "Em até 7 dias": 7,
  "Em até 15 dias": 15,
  "Em até 30 dias": 30,
  "Em até 60 dias": 60,
  "A definir": null,
};

/**
 * Sugestão automática do "motivo principal" no relatório a partir do motivo
 * que o membro marcou na solicitação.
 */
export const REQUEST_TO_VISIT_REASON: Partial<
  Record<(typeof REQUEST_REASONS)[number], (typeof VISIT_REASONS)[number]>
> = {
  "Visita pastoral / comunhão": "Comunhão / acompanhamento",
  Oração: "Oração",
  "Pessoa/família afastada": "Afastamento/ausência",
  Enfermidade: "Enfermidade",
  Luto: "Luto",
  "Dificuldade familiar": "Questão familiar",
  "Dificuldade financeira": "Questão financeira",
  Aconselhamento: "Aconselhamento",
  "Novo na igreja": "Novo membro/frequentador",
  "Conhecer melhor a família": "Integração",
};
