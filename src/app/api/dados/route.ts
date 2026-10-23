import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { INITIAL_DATA } from "@/data/initialData";
import {
  Address,
  AttendanceTime,
  ChurchRelationship,
  DatabaseSchema,
  FollowUpNeed,
  IntegrationLevel,
  LeadershipComm,
  MaritalStatus,
  Member,
  NewVisitNeeded,
  NewVisitTimeframe,
  NextStep,
  PastorLeader,
  RequesterType,
  RequestReason,
  ServiceAttendance,
  Shift,
  SituationLevel,
  VisitHappened,
  VisitReason,
  VisitReport,
  VisitRequest,
  WeekDay,
  YesNoUnknown,
} from "@/types/visitas";
import { computeNextVisitDue, todayISO } from "@/lib/visitasUtils";
import {
  fetchDatabaseFromSupabase,
  getSupabaseClient,
  mapMemberToRow,
  mapPastorToRow,
  mapReportToRow,
  mapRequestToRow,
} from "@/lib/supabase";

export const dynamic = "force-dynamic";

const DB_FILE_PATH = path.join(process.cwd(), "src", "data", "db.json");

function readLocalDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE_PATH)) {
      fs.mkdirSync(path.dirname(DB_FILE_PATH), { recursive: true });
      fs.writeFileSync(
        DB_FILE_PATH,
        JSON.stringify(INITIAL_DATA, null, 2),
        "utf-8"
      );
      return INITIAL_DATA;
    }
    const raw = fs.readFileSync(DB_FILE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as DatabaseSchema;
    if (!parsed || parsed.schemaVersion !== 2) {
      fs.writeFileSync(
        DB_FILE_PATH,
        JSON.stringify(INITIAL_DATA, null, 2),
        "utf-8"
      );
      return INITIAL_DATA;
    }
    return parsed;
  } catch {
    return INITIAL_DATA;
  }
}

function writeLocalDb(data: DatabaseSchema) {
  try {
    fs.mkdirSync(path.dirname(DB_FILE_PATH), { recursive: true });
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write db.json:", err);
  }
}

async function loadDatabase(): Promise<DatabaseSchema> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      return await fetchDatabaseFromSupabase(supabase);
    } catch (err) {
      console.error(
        "Erro ao consultar Supabase (usando banco local como fallback):",
        err
      );
    }
  }
  return readLocalDb();
}

export async function GET() {
  const db = await loadDatabase();
  return NextResponse.json(db);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = getSupabaseClient();
    const db = await loadDatabase();
    const today = todayISO();

    // 1. Formulário — Solicitação de Visita Pastoral
    if (body.action === "CREATE_VISIT_REQUEST") {
      const p = body.payload as {
        name: string;
        phone: string;
        birthDate?: string;
        maritalStatus?: MaritalStatus;
        spouseName?: string;
        householdSize?: number;
        familyInChurch?: string;
        relationship: ChurchRelationship;
        attendanceTime?: AttendanceTime;
        participatesInActivity?: boolean;
        activityName?: string;
        requesterType: RequesterType;
        reasons: RequestReason[];
        address: Address;
        preferredDays: WeekDay[];
        preferredShifts: Shift[];
        observations?: string;
      };

      let member = db.members.find(
        (m) =>
          m.name.toLowerCase().trim() === p.name.toLowerCase().trim() ||
          m.phone.replace(/\D/g, "") === p.phone.replace(/\D/g, "")
      );

      const initialSituation: SituationLevel =
        p.reasons.includes("Enfermidade") || p.reasons.includes("Luto")
          ? "atencao"
          : "acompanhamento";

      if (!member) {
        member = {
          id: `mem-${Date.now()}`,
          name: p.name.trim(),
          phone: p.phone.trim(),
          birthDate: p.birthDate || undefined,
          maritalStatus: p.maritalStatus,
          spouseName: p.spouseName?.trim() || undefined,
          householdSize: p.householdSize,
          familyInChurch: p.familyInChurch?.trim() || undefined,
          relationship: p.relationship,
          attendanceTime: p.attendanceTime,
          participatesInActivity: p.participatesInActivity,
          activityName: p.activityName?.trim() || undefined,
          address: p.address,
          registeredAt: today,
          lastVisitDate: null,
          situation: initialSituation,
          situationNote: `Solicitação de visita (${p.reasons.join(", ")}).`,
          needs: [],
          nextVisitDue: null,
          notes: p.observations?.trim() || undefined,
        };
        db.members.unshift(member);
      } else {
        member.phone = p.phone.trim() || member.phone;
        member.birthDate = p.birthDate || member.birthDate;
        member.maritalStatus = p.maritalStatus || member.maritalStatus;
        member.spouseName = p.spouseName?.trim() || member.spouseName;
        member.householdSize = p.householdSize ?? member.householdSize;
        member.familyInChurch =
          p.familyInChurch?.trim() || member.familyInChurch;
        member.relationship = p.relationship || member.relationship;
        member.attendanceTime = p.attendanceTime || member.attendanceTime;
        member.participatesInActivity =
          p.participatesInActivity ?? member.participatesInActivity;
        member.activityName = p.activityName?.trim() || member.activityName;
        member.address = p.address;
      }

      const newRequest: VisitRequest = {
        id: `req-${Date.now()}`,
        memberId: member.id,
        memberName: member.name,
        phone: p.phone.trim(),
        relationship: p.relationship,
        requesterType: p.requesterType,
        reasons: p.reasons,
        address: p.address,
        preferredDays: p.preferredDays,
        preferredShifts: p.preferredShifts,
        observations: p.observations?.trim() || undefined,
        status: "pendente",
        createdAt: today,
      };

      db.requests.unshift(newRequest);

      if (supabase) {
        const { error: memErr } = await supabase
          .from("members")
          .upsert(mapMemberToRow(member), { onConflict: "id" });
        if (memErr) throw memErr;

        const { error: reqErr } = await supabase
          .from("visit_requests")
          .upsert(mapRequestToRow(newRequest), { onConflict: "id" });
        if (reqErr) throw reqErr;
      } else {
        writeLocalDb(db);
      }

      return NextResponse.json({ ok: true, request: newRequest, db });
    }

    // 2. Formulário — Relatório de Visita Pastoral
    if (body.action === "CREATE_VISIT_REPORT") {
      const p = body.payload as {
        requestId?: string;
        memberId?: string;
        newMemberName?: string;
        newMemberPhone?: string;
        newMemberNeighborhood?: string;
        newMemberAddress?: string;
        visitDate: string;
        approxTime?: string;
        visitors: string[];
        othersPresent?: string;
        visitHappened: VisitHappened;
        mainReason?: VisitReason;
        situation?: SituationLevel;
        serviceAttendance?: ServiceAttendance;
        integration?: IntegrationLevel;
        inCasaDoAlto?: YesNoUnknown;
        inMinistry?: YesNoUnknown;
        summary?: string;
        hasPrayerRequest?: boolean;
        prayerRequest?: string;
        needsFollowUp?: boolean;
        followUpNeeds?: FollowUpNeed[];
        leadershipCommunication?: LeadershipComm;
        leadershipNote?: string;
        nextStep?: NextStep;
        needsNewVisit?: NewVisitNeeded;
        newVisitTimeframe?: NewVisitTimeframe;
        followUpResponsible?: string;
        internalNotes?: string;
      };

      let targetMember = db.members.find((m) => m.id === p.memberId);
      const happened = p.visitHappened === "Sim";
      const nextVisitDue = happened
        ? computeNextVisitDue(p.visitDate, p.needsNewVisit, p.newVisitTimeframe)
        : null;

      if (!targetMember && p.newMemberName) {
        targetMember = {
          id: `mem-${Date.now()}`,
          name: p.newMemberName.trim(),
          phone: p.newMemberPhone?.trim() || "Não informado",
          relationship: "Membro",
          address: {
            street: p.newMemberAddress?.trim() || "Não informado",
            number: "S/N",
            neighborhood: p.newMemberNeighborhood?.trim() || "Não informado",
            city: "São Paulo",
          },
          registeredAt: today,
          lastVisitDate: happened ? p.visitDate : null,
          lastVisitedBy: happened ? p.visitors.join(", ") : undefined,
          situation: p.situation || "bem",
          situationNote: p.leadershipNote || p.summary,
          needs: p.followUpNeeds || [],
          nextVisitDue,
          nextStep: p.nextStep,
          followUpResponsible: p.followUpResponsible,
          leadershipAlert:
            p.leadershipCommunication && p.leadershipCommunication !== "Não"
              ? p.leadershipCommunication
              : null,
          notes: p.internalNotes,
        };
        db.members.unshift(targetMember);
      } else if (targetMember && happened) {
        if (
          !targetMember.lastVisitDate ||
          p.visitDate >= targetMember.lastVisitDate
        ) {
          targetMember.lastVisitDate = p.visitDate;
          targetMember.lastVisitedBy = p.visitors.join(", ");
        }
        if (p.situation) {
          targetMember.situation = p.situation;
        }
        if (p.leadershipNote || p.summary) {
          targetMember.situationNote = p.leadershipNote || p.summary;
        }
        if (p.followUpNeeds && p.followUpNeeds.length > 0) {
          targetMember.needs = Array.from(
            new Set([...targetMember.needs, ...p.followUpNeeds])
          );
        }
        targetMember.nextVisitDue = nextVisitDue;
        targetMember.nextStep = p.nextStep || targetMember.nextStep;
        targetMember.followUpResponsible =
          p.followUpResponsible || targetMember.followUpResponsible;
        targetMember.leadershipAlert =
          p.leadershipCommunication && p.leadershipCommunication !== "Não"
            ? p.leadershipCommunication
            : null;
        if (p.internalNotes) {
          targetMember.notes = p.internalNotes;
        }
      }

      if (!targetMember) {
        return NextResponse.json(
          { error: "Selecione ou cadastre a pessoa/família visitada." },
          { status: 400 }
        );
      }

      const newReport: VisitReport = {
        id: `rep-${Date.now()}`,
        requestId: p.requestId || undefined,
        memberId: targetMember.id,
        memberName: targetMember.name,
        neighborhood: targetMember.address.neighborhood,
        visitDate: p.visitDate || today,
        approxTime: p.approxTime,
        visitors: p.visitors,
        othersPresent: p.othersPresent?.trim() || undefined,
        visitHappened: p.visitHappened,
        mainReason: happened ? p.mainReason : undefined,
        situation: happened ? p.situation : undefined,
        serviceAttendance: happened ? p.serviceAttendance : undefined,
        integration: happened ? p.integration : undefined,
        inCasaDoAlto: happened ? p.inCasaDoAlto : undefined,
        inMinistry: happened ? p.inMinistry : undefined,
        summary: p.summary?.trim() || undefined,
        hasPrayerRequest: happened ? p.hasPrayerRequest : undefined,
        prayerRequest:
          happened && p.hasPrayerRequest ? p.prayerRequest?.trim() : undefined,
        needsFollowUp: happened ? p.needsFollowUp : undefined,
        followUpNeeds:
          happened && p.needsFollowUp ? p.followUpNeeds || [] : [],
        leadershipCommunication: happened
          ? p.leadershipCommunication
          : undefined,
        leadershipNote:
          happened &&
          p.leadershipCommunication &&
          p.leadershipCommunication !== "Não"
            ? p.leadershipNote?.trim()
            : undefined,
        nextStep: p.nextStep,
        needsNewVisit: p.needsNewVisit,
        newVisitTimeframe:
          p.needsNewVisit && p.needsNewVisit !== "Não"
            ? p.newVisitTimeframe
            : undefined,
        nextVisitDue,
        followUpResponsible: p.followUpResponsible?.trim() || undefined,
        internalNotes: p.internalNotes?.trim() || undefined,
        createdAt: today,
      };

      db.reports.unshift(newReport);

      let updatedLinkedReq: VisitRequest | undefined;
      if (p.requestId) {
        const linkedReq = db.requests.find((r) => r.id === p.requestId);
        if (linkedReq) {
          linkedReq.status = happened ? "realizada" : "agendada";
          linkedReq.assignedPastor =
            p.visitors[0] || linkedReq.assignedPastor;
          updatedLinkedReq = linkedReq;
        }
      }

      if (supabase) {
        const { error: memErr } = await supabase
          .from("members")
          .upsert(mapMemberToRow(targetMember), { onConflict: "id" });
        if (memErr) throw memErr;

        if (updatedLinkedReq) {
          const { error: reqErr } = await supabase
            .from("visit_requests")
            .upsert(mapRequestToRow(updatedLinkedReq), { onConflict: "id" });
          if (reqErr) throw reqErr;
        }

        const { error: repErr } = await supabase
          .from("visit_reports")
          .upsert(mapReportToRow(newReport), { onConflict: "id" });
        if (repErr) throw repErr;
      } else {
        writeLocalDb(db);
      }

      return NextResponse.json({ ok: true, report: newReport, db });
    }

    if (body.action === "UPDATE_REQUEST_STATUS") {
      const { requestId, status, assignedPastor, scheduledDate } = body.payload;
      const reqItem = db.requests.find((r) => r.id === requestId);
      if (reqItem) {
        if (status) reqItem.status = status;
        if (assignedPastor !== undefined)
          reqItem.assignedPastor = assignedPastor;
        if (scheduledDate !== undefined) reqItem.scheduledDate = scheduledDate;

        if (supabase) {
          const { error } = await supabase
            .from("visit_requests")
            .upsert(mapRequestToRow(reqItem), { onConflict: "id" });
          if (error) throw error;
        } else {
          writeLocalDb(db);
        }
      }
      return NextResponse.json({ ok: true, db });
    }

    if (body.action === "UPDATE_MEMBER_SITUATION") {
      const { memberId, situation, situationNote } = body.payload;
      const member = db.members.find((m) => m.id === memberId);
      if (member) {
        member.situation = situation;
        if (situationNote !== undefined) {
          member.situationNote = situationNote;
        }

        if (supabase) {
          const { error } = await supabase
            .from("members")
            .upsert(mapMemberToRow(member), { onConflict: "id" });
          if (error) throw error;
        } else {
          writeLocalDb(db);
        }
      }
      return NextResponse.json({ ok: true, db });
    }

    if (body.action === "ADD_PASTOR") {
      const { name, role } = body.payload as { name: string; role?: string };
      if (name && name.trim()) {
        const exists = db.pastors.some(
          (p) => p.name.toLowerCase() === name.trim().toLowerCase()
        );
        if (!exists) {
          const newPastor: PastorLeader = {
            id: `pas-${Date.now()}`,
            name: name.trim(),
            role: role?.trim() || "Pastor(a) / Visitador(a)",
            phone: "",
            regionFocus: "Geral",
          };
          db.pastors.push(newPastor);

          if (supabase) {
            const { error } = await supabase
              .from("pastors")
              .upsert(mapPastorToRow(newPastor), { onConflict: "id" });
            if (error) throw error;
          } else {
            writeLocalDb(db);
          }
        }
      }
      return NextResponse.json({ ok: true, db });
    }

    return NextResponse.json({ error: "Ação desconhecida" }, { status: 400 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Erro interno ao processar requisição" },
      { status: 500 }
    );
  }
}
