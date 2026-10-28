import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  DatabaseSchema,
  Member,
  PastorLeader,
  VisitReport,
  VisitRequest,
} from "@/types/visitas";
import { INITIAL_DATA } from "@/data/initialData";

export function getSupabaseClient(): SupabaseClient | null {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();

  if (
    !rawUrl ||
    !key ||
    rawUrl.includes("SEU-PROJETO") ||
    key.includes("SUA-CHAVE")
  ) {
    return null;
  }

  // Se o usuário colar com "/rest/v1/" no final, removemos automaticamente
  const url = rawUrl.replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

// ============================================================================
// MAPPERS: SUPABASE (snake_case) <-> TYPESCRIPT (camelCase)
// ============================================================================

export function mapRowToPastor(row: Record<string, any>): PastorLeader {
  return {
    id: row.id,
    name: row.name,
    role: row.role || "Pastor(a) / Visitador(a)",
    phone: row.phone || "",
    regionFocus: row.region_focus || "Geral",
  };
}

export function mapPastorToRow(p: PastorLeader) {
  return {
    id: p.id,
    name: p.name,
    role: p.role,
    phone: p.phone,
    region_focus: p.regionFocus,
  };
}

export function mapRowToMember(row: Record<string, any>): Member {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    birthDate: row.birth_date ?? undefined,
    maritalStatus: row.marital_status ?? undefined,
    spouseName: row.spouse_name ?? undefined,
    householdSize: row.household_size ?? undefined,
    familyInChurch: row.family_in_church ?? undefined,
    relationship: row.relationship,
    attendanceTime: row.attendance_time ?? undefined,
    participatesInActivity: row.participates_in_activity ?? undefined,
    activityName: row.activity_name ?? undefined,
    address: row.address || {
      street: "",
      number: "",
      neighborhood: "",
      city: "São Paulo",
    },
    registeredAt: row.registered_at,
    lastVisitDate: row.last_visit_date ?? null,
    lastVisitedBy: row.last_visited_by ?? undefined,
    situation: row.situation || "bem",
    situationNote: row.situation_note ?? undefined,
    needs: Array.isArray(row.needs) ? row.needs : [],
    nextVisitDue: row.next_visit_due ?? null,
    nextStep: row.next_step ?? undefined,
    followUpResponsible: row.follow_up_responsible ?? undefined,
    leadershipAlert: row.leadership_alert ?? null,
    notes: row.notes ?? undefined,
  };
}

export function mapMemberToRow(m: Member) {
  return {
    id: m.id,
    name: m.name,
    phone: m.phone,
    birth_date: m.birthDate ?? null,
    marital_status: m.maritalStatus ?? null,
    spouse_name: m.spouseName ?? null,
    household_size: m.householdSize ?? null,
    family_in_church: m.familyInChurch ?? null,
    relationship: m.relationship,
    attendance_time: m.attendanceTime ?? null,
    participates_in_activity: m.participatesInActivity ?? null,
    activity_name: m.activityName ?? null,
    address: m.address,
    registered_at: m.registeredAt,
    last_visit_date: m.lastVisitDate ?? null,
    last_visited_by: m.lastVisitedBy ?? null,
    situation: m.situation,
    situation_note: m.situationNote ?? null,
    needs: m.needs || [],
    next_visit_due: m.nextVisitDue ?? null,
    next_step: m.nextStep ?? null,
    follow_up_responsible: m.followUpResponsible ?? null,
    leadership_alert: m.leadershipAlert ?? null,
    notes: m.notes ?? null,
    updated_at: new Date().toISOString(),
  };
}

export function mapRowToRequest(row: Record<string, any>): VisitRequest {
  return {
    id: row.id,
    memberId: row.member_id,
    memberName: row.member_name,
    phone: row.phone,
    relationship: row.relationship,
    requesterType: row.requester_type,
    reasons: Array.isArray(row.reasons) ? row.reasons : [],
    address: row.address || {
      street: "",
      number: "",
      neighborhood: "",
      city: "São Paulo",
    },
    preferredDays: Array.isArray(row.preferred_days) ? row.preferred_days : [],
    preferredShifts: Array.isArray(row.preferred_shifts)
      ? row.preferred_shifts
      : [],
    observations: row.observations ?? undefined,
    status: row.status || "pendente",
    assignedPastor: row.assigned_pastor ?? undefined,
    scheduledDate: row.scheduled_date ?? undefined,
    createdAt: row.created_at,
  };
}

export function mapRequestToRow(r: VisitRequest) {
  return {
    id: r.id,
    member_id: r.memberId,
    member_name: r.memberName,
    phone: r.phone,
    relationship: r.relationship,
    requester_type: r.requesterType,
    reasons: r.reasons || [],
    address: r.address,
    preferred_days: r.preferredDays || [],
    preferred_shifts: r.preferredShifts || [],
    observations: r.observations ?? null,
    status: r.status,
    assigned_pastor: r.assignedPastor ?? null,
    scheduled_date: r.scheduledDate ?? null,
    created_at: r.createdAt,
  };
}

const PHOTO_MARKER_REGEX = /\n?\[\[VISIT_PHOTO:(data:image\/[^\]]+|https?:\/\/[^\]]+)\]\]$/;

export function mapRowToReport(row: Record<string, any>): VisitReport {
  const rawInternalNotes: string = row.internal_notes || "";
  const match = rawInternalNotes.match(PHOTO_MARKER_REGEX);
  const extractedPhoto = row.photo_url || (match ? match[1] : undefined);
  const cleanInternalNotes = rawInternalNotes
    .replace(PHOTO_MARKER_REGEX, "")
    .trim();

  return {
    id: row.id,
    requestId: row.request_id ?? undefined,
    memberId: row.member_id,
    memberName: row.member_name,
    neighborhood: row.neighborhood,
    visitDate: row.visit_date,
    approxTime: row.approx_time ?? undefined,
    visitors: Array.isArray(row.visitors) ? row.visitors : [],
    othersPresent: row.others_present ?? undefined,
    visitHappened: row.visit_happened,
    mainReason: row.main_reason ?? undefined,
    situation: row.situation ?? undefined,
    serviceAttendance: row.service_attendance ?? undefined,
    integration: row.integration ?? undefined,
    inCasaDoAlto: row.in_casa_do_alto ?? undefined,
    inMinistry: row.in_ministry ?? undefined,
    summary: row.summary ?? undefined,
    photoUrl: extractedPhoto ?? undefined,
    hasPrayerRequest: row.has_prayer_request ?? undefined,
    prayerRequest: row.prayer_request ?? undefined,
    needsFollowUp: row.needs_follow_up ?? undefined,
    followUpNeeds: Array.isArray(row.follow_up_needs)
      ? row.follow_up_needs
      : [],
    leadershipCommunication: row.leadership_communication ?? undefined,
    leadershipNote: row.leadership_note ?? undefined,
    nextStep: row.next_step ?? undefined,
    needsNewVisit: row.needs_new_visit ?? undefined,
    newVisitTimeframe: row.new_visit_timeframe ?? undefined,
    nextVisitDue: row.next_visit_due ?? null,
    followUpResponsible: row.follow_up_responsible ?? undefined,
    internalNotes: cleanInternalNotes || undefined,
    createdAt: row.created_at,
  };
}

export function mapReportToRow(rep: VisitReport) {
  const baseNotes = (rep.internalNotes || "").replace(PHOTO_MARKER_REGEX, "").trim();
  const combinedNotes = rep.photoUrl
    ? `${baseNotes}${baseNotes ? "\n" : ""}[[VISIT_PHOTO:${rep.photoUrl}]]`
    : baseNotes || null;

  return {
    id: rep.id,
    request_id: rep.requestId ?? null,
    member_id: rep.memberId,
    member_name: rep.memberName,
    neighborhood: rep.neighborhood,
    visit_date: rep.visitDate,
    approx_time: rep.approxTime ?? null,
    visitors: rep.visitors || [],
    others_present: rep.othersPresent ?? null,
    visit_happened: rep.visitHappened,
    main_reason: rep.mainReason ?? null,
    situation: rep.situation ?? null,
    service_attendance: rep.serviceAttendance ?? null,
    integration: rep.integration ?? null,
    in_casa_do_alto: rep.inCasaDoAlto ?? null,
    in_ministry: rep.inMinistry ?? null,
    summary: rep.summary ?? null,
    has_prayer_request: rep.hasPrayerRequest ?? null,
    prayer_request: rep.prayerRequest ?? null,
    needs_follow_up: rep.needsFollowUp ?? null,
    follow_up_needs: rep.followUpNeeds || [],
    leadership_communication: rep.leadershipCommunication ?? null,
    leadership_note: rep.leadershipNote ?? null,
    next_step: rep.nextStep ?? null,
    needs_new_visit: rep.needsNewVisit ?? null,
    new_visit_timeframe: rep.newVisitTimeframe ?? null,
    next_visit_due: rep.nextVisitDue ?? null,
    follow_up_responsible: rep.followUpResponsible ?? null,
    internal_notes: combinedNotes,
    created_at: rep.createdAt,
  };
}

/**
 * Busca todos os dados do Supabase.
 * Caso o banco esteja recém-criado e totalmente vazio (0 membros e 0 pastores),
 * popula automaticamente os dados iniciais de demonstração para que o painel já funcione de imediato.
 */
export async function fetchDatabaseFromSupabase(
  supabase: SupabaseClient
): Promise<DatabaseSchema> {
  const [pastorsRes, membersRes, requestsRes, reportsRes] = await Promise.all([
    supabase.from("pastors").select("*").order("created_at", { ascending: true }),
    supabase.from("members").select("*").order("created_at", { ascending: false }),
    supabase
      .from("visit_requests")
      .select("*")
      .order("inserted_at", { ascending: false }),
    supabase
      .from("visit_reports")
      .select("*")
      .order("visit_date", { ascending: false }),
  ]);

  if (pastorsRes.error) throw pastorsRes.error;
  if (membersRes.error) throw membersRes.error;
  if (requestsRes.error) throw requestsRes.error;
  if (reportsRes.error) throw reportsRes.error;

  const isEmpty =
    (membersRes.data?.length || 0) === 0 &&
    (requestsRes.data?.length || 0) === 0 &&
    (reportsRes.data?.length || 0) === 0;

  if (isEmpty) {
    await seedSupabaseInitialData(supabase);
    return INITIAL_DATA;
  }

  return {
    schemaVersion: 2,
    pastors: (pastorsRes.data || []).map(mapRowToPastor),
    members: (membersRes.data || []).map(mapRowToMember),
    requests: (requestsRes.data || []).map(mapRowToRequest),
    reports: (reportsRes.data || []).map(mapRowToReport),
  };
}

export async function seedSupabaseInitialData(supabase: SupabaseClient) {
  await supabase
    .from("pastors")
    .upsert(INITIAL_DATA.pastors.map(mapPastorToRow), { onConflict: "id" });
  await supabase
    .from("members")
    .upsert(INITIAL_DATA.members.map(mapMemberToRow), { onConflict: "id" });
  await supabase
    .from("visit_requests")
    .upsert(INITIAL_DATA.requests.map(mapRequestToRow), { onConflict: "id" });
  await supabase
    .from("visit_reports")
    .upsert(INITIAL_DATA.reports.map(mapReportToRow), { onConflict: "id" });
}
