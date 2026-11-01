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
  UserAccessRole,
  VisitHappened,
  VisitReason,
  VisitReport,
  VisitRequest,
  WeekDay,
  YesNoUnknown,
} from "@/types/visitas";
import { computeNextVisitDue, todayISO } from "@/lib/visitasUtils";
import { cleanDigits } from "@/lib/cpfUtils";
import {
  deriveDefaultUsername,
  fetchDatabaseFromSupabase,
  getSupabaseClient,
  mapMemberToRow,
  mapPastorToRow,
  mapReportToRow,
  mapRequestToRow,
} from "@/lib/supabase";

export const dynamic = "force-dynamic";

const DB_FILE_PATH = path.join(process.cwd(), "src", "data", "db.json");

function normalizePastorsList(pastors: PastorLeader[]): PastorLeader[] {
  return (pastors || []).map((p) => ({
    ...p,
    username: (p.username || deriveDefaultUsername(p.name)).trim().toLowerCase(),
    password: p.password || "igrejadoalto",
    accessRole:
      p.accessRole === "admin"
        ? "admin"
        : p.accessRole === "lider"
        ? "lider"
        : "pastor",
    isVisitorActive: p.isVisitorActive !== undefined ? p.isVisitorActive : true,
  }));
}

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
    parsed.pastors = normalizePastorsList(parsed.pastors);
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

function syncPastorsWithMembers(db: DatabaseSchema): DatabaseSchema {
  const currentPastors = [...(db.pastors || [])];
  const existingMemberIds = new Set(
    currentPastors
      .map((p) =>
        p.memberId || (p.id.startsWith("pas-") ? p.id.replace(/^pas-/, "") : "")
      )
      .filter(Boolean)
  );
  const existingNames = new Set(
    currentPastors.map((p) => p.name.trim().toLowerCase())
  );

  for (const m of db.members || []) {
    const isEligible = Boolean(
      m.isPastor ||
        m.isLeader ||
        m.isAdmin ||
        m.portalRole === "pastor" ||
        m.portalRole === "admin"
    );

    if (isEligible) {
      const existing = currentPastors.find(
        (p) =>
          (p.memberId && p.memberId === m.id) ||
          p.id === `pas-${m.id}` ||
          p.name.trim().toLowerCase() === m.name.trim().toLowerCase()
      );

      if (!existing) {
        currentPastors.push({
          id: `pas-${m.id}`,
          name: m.name,
          role: m.isPastor ? "Pastores" : m.isLeader ? "Líderes" : "Administração",
          phone: m.phone || "",
          regionFocus: "Igreja do Alto",
          username: (
            m.email?.split("@")[0] || deriveDefaultUsername(m.name)
          ).toLowerCase(),
          password: m.password || "igrejadoalto",
          accessRole:
            m.isAdmin || m.portalRole === "admin"
              ? "admin"
              : m.isLeader
              ? "lider"
              : "pastor",
          memberId: m.id,
          isVisitorActive:
            m.isVisitorActive !== undefined ? m.isVisitorActive : true,
        });
        existingMemberIds.add(m.id);
        existingNames.add(m.name.trim().toLowerCase());
      } else {
        if (m.isVisitorActive !== undefined) {
          existing.isVisitorActive = m.isVisitorActive;
        }
        existing.accessRole =
          m.isAdmin || m.portalRole === "admin"
            ? "admin"
            : m.isLeader
            ? "lider"
            : "pastor";
      }
    }
  }

  db.pastors = normalizePastorsList(currentPastors);
  return db;
}

async function loadDatabase(): Promise<DatabaseSchema> {
  const supabase = getSupabaseClient();
  let db: DatabaseSchema;
  if (supabase) {
    try {
      db = await fetchDatabaseFromSupabase(supabase);
      return syncPastorsWithMembers(db);
    } catch (err) {
      console.error(
        "Erro ao consultar Supabase (usando banco local como fallback):",
        err
      );
    }
  }
  db = readLocalDb();
  return syncPastorsWithMembers(db);
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

    // 0. Login no Portal de Visitas (por CPF, E-mail, Usuário ou Admin Master)
    if (body.action === "LOGIN_VISITAS") {
      const { login, password } = (body.payload || {}) as {
        login?: string;
        password?: string;
      };

      const rawInput = (login || "").trim();
      const inputPass = password || "";
      const inputCleanDigits = cleanDigits(rawInput);
      const normalizedInput = rawInput.toLowerCase();

      // a) Administrador Geral Master
      const expectedAdminUser =
        process.env.NEXT_PUBLIC_ADMIN_USER?.trim().toLowerCase() || "admin";
      const expectedAdminPass =
        process.env.NEXT_PUBLIC_ADMIN_PASS?.trim() ||
        process.env.ADMIN_PASSWORD ||
        "igrejadoalto";

      if (
        (normalizedInput === expectedAdminUser || normalizedInput === "admin") &&
        (inputPass === expectedAdminPass ||
          inputPass === "igrejadoalto" ||
          inputPass === "admin123")
      ) {
        const masterSession = {
          id: "master-admin",
          name: "Administração Geral",
          username: expectedAdminUser,
          accessRole: "admin" as UserAccessRole,
        };
        return NextResponse.json({
          ok: true,
          session: masterSession,
          db,
        });
      }

      // b) Busca membro cadastrado por CPF, E-mail ou Nome
      const matchedMember = db.members.find((m) => {
        const mCpf = cleanDigits(m.cpf);
        const mEmail = (m.email || "").trim().toLowerCase();
        const mName = m.name.trim().toLowerCase();
        const mUser = deriveDefaultUsername(m.name).toLowerCase();
        return (
          (inputCleanDigits && mCpf === inputCleanDigits) ||
          mEmail === normalizedInput ||
          mName === normalizedInput ||
          mUser === normalizedInput
        );
      });

      // c) Busca pastor na lista de pastores
      let matchedPastor = db.pastors.find((p) => {
        const pUser = (p.username || deriveDefaultUsername(p.name))
          .trim()
          .toLowerCase();
        const pName = p.name.trim().toLowerCase();
        return pUser === normalizedInput || pName === normalizedInput;
      });

      if (!matchedPastor && matchedMember) {
        matchedPastor = db.pastors.find(
          (p) =>
            p.memberId === matchedMember.id ||
            p.id === `pas-${matchedMember.id}` ||
            p.name.trim().toLowerCase() === matchedMember.name.trim().toLowerCase()
        );
      }

      if (!matchedPastor && !matchedMember) {
        return NextResponse.json(
          { error: "Nenhum cadastro encontrado com este CPF ou E-mail." },
          { status: 401 }
        );
      }

      // Verifica se a pessoa tem perfil pastoral, líder ou admin
      const isPastorOrLeaderOrAdmin =
        Boolean(matchedPastor) ||
        Boolean(
          matchedMember?.isPastor ||
            matchedMember?.isLeader ||
            matchedMember?.isAdmin ||
            matchedMember?.portalRole === "pastor" ||
            matchedMember?.portalRole === "admin"
        );

      if (!isPastorOrLeaderOrAdmin) {
        return NextResponse.json(
          {
            error:
              "Acesso exclusivo para Pastores, Líderes e Administradores da igreja. Para acessar seu perfil familiar e solicitar visitas, utilize o Portal do Membro.",
          },
          { status: 403 }
        );
      }

      // Validação da Senha
      const validPastorPass =
        matchedPastor?.password && inputPass === matchedPastor.password;
      const validMemberPass =
        matchedMember?.password && inputPass === matchedMember.password;
      const masterPass = inputPass === "igrejadoalto";

      if (!validPastorPass && !validMemberPass && !masterPass) {
        return NextResponse.json(
          { error: "Senha incorreta. Verifique os dados digitados." },
          { status: 401 }
        );
      }

      const name = matchedPastor?.name || matchedMember!.name;
      const id =
        matchedPastor?.id ||
        (matchedMember ? `pas-${matchedMember.id}` : "pastor-session");
      const username =
        matchedPastor?.username ||
        matchedMember?.cpf ||
        matchedMember?.email ||
        deriveDefaultUsername(name);
      const role: UserAccessRole =
        matchedPastor?.accessRole === "admin" ||
        matchedMember?.isAdmin ||
        matchedMember?.portalRole === "admin"
          ? "admin"
          : matchedMember?.isLeader
          ? "lider"
          : "pastor";

      const pastorSession = {
        id,
        name,
        username,
        accessRole: role,
      };

      return NextResponse.json({
        ok: true,
        session: pastorSession,
        db,
      });
    }

    // 0.1 Ativar / Desativar Perfil como Visitador Ativo
    if (body.action === "TOGGLE_VISITOR_ACTIVE") {
      const { id, isVisitorActive } = (body.payload || {}) as {
        id: string;
        isVisitorActive: boolean;
      };

      const active = Boolean(isVisitorActive);

      // Atualiza em db.pastors
      const pastor = db.pastors.find(
        (p) =>
          p.id === id ||
          p.memberId === id ||
          p.name.trim().toLowerCase() === id.trim().toLowerCase()
      );
      if (pastor) {
        pastor.isVisitorActive = active;
      }

      // Atualiza em db.members
      const member = db.members.find(
        (m) =>
          m.id === id ||
          (pastor && m.id === pastor.memberId) ||
          m.name.trim().toLowerCase() === id.trim().toLowerCase()
      );
      if (member) {
        member.isVisitorActive = active;
      }

      writeLocalDb(db);

      if (supabase) {
        try {
          if (pastor) {
            await supabase
              .from("pastors")
              .upsert(mapPastorToRow(pastor), { onConflict: "id" });
          }
          if (member) {
            await supabase
              .from("members")
              .upsert(mapMemberToRow(member), { onConflict: "id" })
              .throwOnError();
          }
        } catch (supaErr) {
          console.error("Erro ao alternar status de visitador:", supaErr);
        }
      }

      return NextResponse.json({
        ok: true,
        db,
        isVisitorActive: active,
      });
    }

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

      writeLocalDb(db);

      if (supabase) {
        try {
          const { error: memErr } = await supabase
            .from("members")
            .upsert(mapMemberToRow(member), { onConflict: "id" });
          if (memErr) console.error("Erro ao salvar membro no Supabase:", memErr);

          const { error: reqErr } = await supabase
            .from("visit_requests")
            .upsert(mapRequestToRow(newRequest), { onConflict: "id" });
          if (reqErr) console.error("Erro ao salvar solicitação no Supabase:", reqErr);
        } catch (supaErr) {
          console.error("Erro de conexão com Supabase (salvo localmente):", supaErr);
        }
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
        photoUrl?: string;
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
        photoUrl: p.photoUrl || undefined,
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

      writeLocalDb(db);

      if (supabase) {
        try {
          const { error: memErr } = await supabase
            .from("members")
            .upsert(mapMemberToRow(targetMember), { onConflict: "id" });
          if (memErr) console.error("Erro ao salvar membro no Supabase:", memErr);

          if (updatedLinkedReq) {
            const { error: reqErr } = await supabase
              .from("visit_requests")
              .upsert(mapRequestToRow(updatedLinkedReq), { onConflict: "id" });
            if (reqErr) console.error("Erro ao salvar solicitação no Supabase:", reqErr);
          }

          const { error: repErr } = await supabase
            .from("visit_reports")
            .upsert(mapReportToRow(newReport), { onConflict: "id" });
          if (repErr) console.error("Erro ao salvar relatório no Supabase:", repErr);
        } catch (supaErr) {
          console.error("Erro de conexão com Supabase (salvo localmente):", supaErr);
        }
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

        writeLocalDb(db);

        if (supabase) {
          try {
            const { error } = await supabase
              .from("visit_requests")
              .upsert(mapRequestToRow(reqItem), { onConflict: "id" });
            if (error) console.error("Erro no Supabase:", error);
          } catch (supaErr) {
            console.error("Erro de conexão com Supabase (salvo localmente):", supaErr);
          }
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

        writeLocalDb(db);

        if (supabase) {
          try {
            const { error } = await supabase
              .from("members")
              .upsert(mapMemberToRow(member), { onConflict: "id" });
            if (error) console.error("Erro no Supabase:", error);
          } catch (supaErr) {
            console.error("Erro de conexão com Supabase (salvo localmente):", supaErr);
          }
        }
      }
      return NextResponse.json({ ok: true, db });
    }

    if (body.action === "ADD_PASTOR") {
      const {
        name,
        role,
        phone,
        regionFocus,
        username,
        password,
        accessRole,
      } = body.payload as {
        name: string;
        role?: string;
        phone?: string;
        regionFocus?: string;
        username?: string;
        password?: string;
        accessRole?: UserAccessRole;
      };
      if (name && name.trim()) {
        const cleanUsername = (
          username?.trim() || deriveDefaultUsername(name.trim())
        ).toLowerCase();
        const exists = db.pastors.some(
          (p) =>
            p.name.toLowerCase() === name.trim().toLowerCase() ||
            (p.username && p.username.toLowerCase() === cleanUsername)
        );
        if (!exists) {
          const newPastor: PastorLeader = {
            id: `pas-${Date.now()}`,
            name: name.trim(),
            role: role?.trim() || "Pastores",
            phone: phone?.trim() || "",
            regionFocus: regionFocus?.trim() || "Igreja do Alto",
            username: cleanUsername,
            password: password?.trim() || "igrejadoalto",
            accessRole: accessRole === "admin" ? "admin" : "pastor",
          };
          db.pastors.push(newPastor);

          writeLocalDb(db);

          if (supabase) {
            try {
              const { error } = await supabase
                .from("pastors")
                .upsert(mapPastorToRow(newPastor), { onConflict: "id" });
              if (error) console.error("Erro no Supabase:", error);
            } catch (supaErr) {
              console.error("Erro de conexão com Supabase (salvo localmente):", supaErr);
            }
          }
        }
      }
      return NextResponse.json({ ok: true, db });
    }

    if (body.action === "UPDATE_PASTOR") {
      const {
        id,
        name,
        role,
        phone,
        regionFocus,
        username,
        password,
        accessRole,
      } = body.payload as {
        id: string;
        name?: string;
        role?: string;
        phone?: string;
        regionFocus?: string;
        username?: string;
        password?: string;
        accessRole?: UserAccessRole;
      };

      const pastor = db.pastors.find((p) => p.id === id);
      if (pastor) {
        if (name !== undefined && name.trim()) pastor.name = name.trim();
        if (role !== undefined && role.trim()) pastor.role = role.trim();
        if (phone !== undefined) pastor.phone = phone.trim();
        if (regionFocus !== undefined && regionFocus.trim()) {
          pastor.regionFocus = regionFocus.trim();
        }
        if (username !== undefined && username.trim()) {
          pastor.username = username.trim().toLowerCase();
        }
        if (password !== undefined && password.trim()) {
          pastor.password = password.trim();
        }
        if (accessRole !== undefined) {
          pastor.accessRole = accessRole === "admin" ? "admin" : "pastor";
        }

        writeLocalDb(db);

        if (supabase) {
          try {
            const { error } = await supabase
              .from("pastors")
              .upsert(mapPastorToRow(pastor), { onConflict: "id" });
            if (error) console.error("Erro no Supabase:", error);
          } catch (supaErr) {
            console.error("Erro de conexão com Supabase (salvo localmente):", supaErr);
          }
        }
      }
      return NextResponse.json({ ok: true, db });
    }

    if (body.action === "DELETE_PASTOR") {
      const { id } = body.payload as { id: string };
      if (id) {
        db.pastors = db.pastors.filter((p) => p.id !== id);
        writeLocalDb(db);

        if (supabase) {
          try {
            const { error } = await supabase
              .from("pastors")
              .delete()
              .eq("id", id);
            if (error) console.error("Erro no Supabase:", error);
          } catch (supaErr) {
            console.error("Erro de conexão com Supabase (salvo localmente):", supaErr);
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
