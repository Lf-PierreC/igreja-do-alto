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

const INITIAL_SAMPLE_VISITORS: FirstTimeVisitor[] = [];

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
  const visitors: FirstTimeVisitor[] = Array.isArray(rawDb.firstTimeVisitors)
    ? rawDb.firstTimeVisitors
    : [];
  const requests: BemVindosAccessRequest[] = Array.isArray(rawDb.bemVindosRequests)
    ? rawDb.bemVindosRequests
    : [];
  const team: BemVindosTeamMember[] = Array.isArray(rawDb.bemVindosTeam)
    ? rawDb.bemVindosTeam
    : [];

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
