import fs from "fs";
import path from "path";
import { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase";
import {
  FirstTimeVisitor,
  BemVindosAccessRequest,
  BemVindosTeamMember,
  VisitorStatus,
  HowHeardChannel,
} from "@/types/bemVindos";

const DB_FILE_PATH = path.join(process.cwd(), "src", "data", "db.json");

export interface BemVindosDatabaseData {
  visitors: FirstTimeVisitor[];
  requests: BemVindosAccessRequest[];
  team: BemVindosTeamMember[];
}

const INITIAL_SAMPLE_VISITORS: FirstTimeVisitor[] = [
  {
    id: "vis-1",
    fullName: "Lucas Oliveira de Albuquerque",
    phone: "(11) 98765-4321",
    howHeard: "Instagram",
    howHeardDetail: "Viu um Reels sobre o culto de jovens",
    churchBackground: "Não frequento nenhuma igreja",
    visitDate: "2026-10-25",
    servicePeriod: "Domingo Noite (18h)",
    neighborhood: "Vila Oliveira",
    city: "Mogi das Cruzes",
    prayerRequest: "Pela minha família e direção profissional.",
    status: "novo",
    notes: [
      {
        id: "note-1",
        createdAt: "2026-10-25T19:30:00Z",
        authorName: "Recepção Bem-Vindos",
        text: "Visitou a igreja pela primeira vez com a noiva. Muito comunicativo.",
      },
    ],
    registeredBy: { type: "self" },
    createdAt: "2026-10-25T19:30:00Z",
    updatedAt: "2026-10-25T19:30:00Z",
  },
  {
    id: "vis-2",
    fullName: "Mariana Santos Ferreira",
    phone: "(11) 97654-3210",
    howHeard: "Indicação de Amigo/Familiar",
    howHeardDetail: "Convidada pela Carol e pelo Pedro",
    churchBackground: "Estou procurando uma igreja para congregar",
    visitDate: "2026-10-25",
    servicePeriod: "Domingo Manhã (10h)",
    neighborhood: "Alto Ipiranga",
    city: "Mogi das Cruzes",
    prayerRequest: "Agradecimento por cura e paz para o coração.",
    status: "mensagem_enviada",
    notes: [
      {
        id: "note-2a",
        createdAt: "2026-10-25T11:45:00Z",
        authorName: "Recepção",
        text: "Sentou na terceira fileira da nave.",
      },
      {
        id: "note-2b",
        createdAt: "2026-10-26T14:20:00Z",
        authorName: "Equipe Bem-Vindo",
        text: "Mensagem de acolhimento enviada no WhatsApp com devocional.",
        actionTag: "MENSAGEM_WHATSAPP",
      },
    ],
    registeredBy: { type: "member", memberName: "Camila (Voluntária Bem-Vindo)" },
    createdAt: "2026-10-25T11:45:00Z",
    updatedAt: "2026-10-26T14:20:00Z",
  },
  {
    id: "vis-3",
    fullName: "Guilherme Henrique Prado",
    phone: "(11) 96543-2109",
    howHeard: "Passou na Frente da Igreja",
    howHeardDetail: "Mora a 3 quadras da igreja e ouviu a música",
    churchBackground: "Estou afastado(a) no momento",
    visitDate: "2026-10-18",
    servicePeriod: "Domingo Noite (18h)",
    neighborhood: "Centro",
    city: "Mogi das Cruzes",
    prayerRequest: "Restaurar a comunhão com Deus.",
    status: "em_conversa",
    notes: [
      {
        id: "note-3a",
        createdAt: "2026-10-18T19:00:00Z",
        authorName: "Recepção",
        text: "Chegou no início da pregação.",
      },
      {
        id: "note-3b",
        createdAt: "2026-10-19T10:00:00Z",
        authorName: "Equipe Bem-Vindo",
        text: "Mensagem enviada no WhatsApp.",
      },
      {
        id: "note-3c",
        createdAt: "2026-10-20T16:30:00Z",
        authorName: "Equipe Bem-Vindo",
        text: "Guilherme respondeu agradecendo o carinho e pediu indicação de um pequeno grupo perto de casa.",
      },
    ],
    registeredBy: { type: "self" },
    createdAt: "2026-10-18T19:00:00Z",
    updatedAt: "2026-10-20T16:30:00Z",
  },
  {
    id: "vis-4",
    fullName: "Juliana Mendes e Família",
    phone: "(11) 95432-1098",
    howHeard: "Google / Pesquisa",
    howHeardDetail: "Pesquisou igreja acolhedora em Mogi",
    churchBackground: "Sim, sou de outra igreja",
    otherChurchName: "Igreja Batista de Suzano",
    visitDate: "2026-10-11",
    servicePeriod: "Domingo Manhã (10h)",
    neighborhood: "Mogilar",
    city: "Mogi das Cruzes",
    prayerRequest: "Pelos 2 filhos pequenos (Ministério Infantil).",
    status: "convidado_celula",
    notes: [
      {
        id: "note-4a",
        createdAt: "2026-10-11T12:00:00Z",
        authorName: "Equipe Bem-Vindos",
        text: "Amou a estrutura do Ministério Infantil.",
      },
      {
        id: "note-4b",
        createdAt: "2026-10-14T11:00:00Z",
        authorName: "Equipe Bem-Vindos",
        text: "Conectada com a Casa do Alto do bairro Mogilar (Líder Marcos).",
      },
    ],
    registeredBy: { type: "member", memberName: "Recepção Bem-Vindos" },
    createdAt: "2026-10-11T12:00:00Z",
    updatedAt: "2026-10-14T11:00:00Z",
  },
];

function readRawLocalDb(): any {
  try {
    if (!fs.existsSync(DB_FILE_PATH)) {
      return {};
    }
    const raw = fs.readFileSync(DB_FILE_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeRawLocalDb(data: any) {
  try {
    fs.mkdirSync(path.dirname(DB_FILE_PATH), { recursive: true });
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro ao gravar dados locais em db.json:", err);
  }
}

export function readBemVindosLocal(): BemVindosDatabaseData {
  const rawDb = readRawLocalDb();
  let visitors = rawDb.firstTimeVisitors || [];
  let requests = rawDb.bemVindosRequests || [];
  let team = rawDb.bemVindosTeam || [];

  if (!Array.isArray(visitors) || visitors.length === 0) {
    visitors = INITIAL_SAMPLE_VISITORS;
    rawDb.firstTimeVisitors = visitors;
    writeRawLocalDb(rawDb);
  }

  return { visitors, requests, team };
}

export function writeBemVindosLocal(data: Partial<BemVindosDatabaseData>) {
  const rawDb = readRawLocalDb();
  if (data.visitors) rawDb.firstTimeVisitors = data.visitors;
  if (data.requests) rawDb.bemVindosRequests = data.requests;
  if (data.team) rawDb.bemVindosTeam = data.team;
  writeRawLocalDb(rawDb);
}

// ============================================================================
// SUPABASE SYNC (COM FALLBACK SE AS TABELAS NÃO EXISTIREM AINDA NO SUPABASE)
// ============================================================================

export async function fetchBemVindosData(): Promise<BemVindosDatabaseData> {
  const supabase = getSupabaseClient();
  const localData = readBemVindosLocal();

  if (!supabase) {
    return localData;
  }

  try {
    const [visRes, reqRes, teamRes] = await Promise.all([
      supabase.from("first_time_visitors").select("*").order("created_at", { ascending: false }),
      supabase.from("bem_vindos_access_requests").select("*").order("requested_at", { ascending: false }),
      supabase.from("bem_vindos_team").select("*"),
    ]);

    // Se tabelas não existirem (erro do Postgres), faz fallback transparente para os dados locais
    if (visRes.error) {
      console.warn("Supabase first_time_visitors não disponível ou não criada, usando local:", visRes.error.message);
      return localData;
    }

    const visitors: FirstTimeVisitor[] = (visRes.data || []).map((row: any) => ({
      id: row.id,
      fullName: row.full_name,
      phone: row.phone,
      howHeard: row.how_heard as HowHeardChannel,
      howHeardDetail: row.how_heard_detail || undefined,
      churchBackground: row.church_background || undefined,
      otherChurchName: row.other_church_name || undefined,
      visitDate: row.visit_date,
      servicePeriod: row.service_period || undefined,
      neighborhood: row.neighborhood || undefined,
      city: row.city || undefined,
      prayerRequest: row.prayer_request || undefined,
      status: row.status as VisitorStatus,
      notes: Array.isArray(row.notes) ? row.notes : [],
      registeredBy: row.registered_by || { type: "self" },
      assignedTo: row.assigned_to || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    const requests: BemVindosAccessRequest[] = ((reqRes.data as any[]) || []).map((row: any) => ({
      id: row.id,
      memberId: row.member_id,
      memberName: row.member_name,
      memberEmail: row.member_email,
      memberPhone: row.member_phone,
      memberMinistries: Array.isArray(row.member_ministries) ? row.member_ministries : [],
      status: row.status,
      requestedAt: row.requested_at,
      reviewedBy: row.reviewed_by || undefined,
      reviewedAt: row.reviewed_at || undefined,
      role: row.role || "voluntario",
    }));

    const team: BemVindosTeamMember[] = ((teamRes.data as any[]) || []).map((row: any) => ({
      memberId: row.member_id,
      memberName: row.member_name,
      memberEmail: row.member_email || undefined,
      phone: row.phone,
      role: row.role,
      approvedAt: row.approved_at,
      approvedBy: row.approved_by,
    }));

    // Se a tabela do Supabase estiver totalmente vazia, popula com os visitantes de exemplo
    if (visitors.length === 0 && localData.visitors.length > 0) {
      for (const v of localData.visitors) {
        await saveVisitorSupabase(supabase, v);
      }
      return localData;
    }

    // Mantém cópia local sincronizada para contingência
    writeBemVindosLocal({ visitors, requests, team });

    return { visitors, requests, team };
  } catch (err) {
    console.warn("Erro ao carregar do Supabase em Bem-Vindos, usando local:", err);
    return localData;
  }
}

export async function saveVisitorSupabase(supabase: SupabaseClient, visitor: FirstTimeVisitor) {
  try {
    await supabase.from("first_time_visitors").upsert(
      {
        id: visitor.id,
        full_name: visitor.fullName,
        phone: visitor.phone,
        how_heard: visitor.howHeard,
        how_heard_detail: visitor.howHeardDetail || null,
        church_background: visitor.churchBackground || null,
        other_church_name: visitor.otherChurchName || null,
        visit_date: visitor.visitDate,
        service_period: visitor.servicePeriod || null,
        neighborhood: visitor.neighborhood || null,
        city: visitor.city || null,
        prayer_request: visitor.prayerRequest || null,
        status: visitor.status,
        notes: visitor.notes || [],
        registered_by: visitor.registeredBy || { type: "self" },
        assigned_to: visitor.assignedTo || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
  } catch (err) {
    console.error("Falha ao salvar visitante no Supabase:", err);
  }
}

export async function saveAccessRequestSupabase(
  supabase: SupabaseClient,
  request: BemVindosAccessRequest
) {
  try {
    await supabase.from("bem_vindos_access_requests").upsert(
      {
        id: request.id,
        member_id: request.memberId,
        member_name: request.memberName,
        member_email: request.memberEmail,
        member_phone: request.memberPhone,
        member_ministries: request.memberMinistries,
        status: request.status,
        requested_at: request.requestedAt,
        reviewed_by: request.reviewedBy || null,
        reviewed_at: request.reviewedAt || null,
        role: request.role || "voluntario",
      },
      { onConflict: "id" }
    );
  } catch (err) {
    console.error("Falha ao salvar solicitação no Supabase:", err);
  }
}

export async function saveTeamMemberSupabase(
  supabase: SupabaseClient,
  teamMember: BemVindosTeamMember
) {
  try {
    await supabase.from("bem_vindos_team").upsert(
      {
        member_id: teamMember.memberId,
        member_name: teamMember.memberName,
        member_email: teamMember.memberEmail || null,
        phone: teamMember.phone,
        role: teamMember.role,
        approved_at: teamMember.approvedAt,
        approved_by: teamMember.approvedBy,
      },
      { onConflict: "member_id" }
    );
  } catch (err) {
    console.error("Falha ao salvar membro da equipe no Supabase:", err);
  }
}

export async function removeTeamMemberSupabase(
  supabase: SupabaseClient,
  memberId: string
) {
  try {
    await supabase.from("bem_vindos_team").delete().eq("member_id", memberId);
  } catch (err) {
    console.error("Falha ao remover membro da equipe no Supabase:", err);
  }
}
