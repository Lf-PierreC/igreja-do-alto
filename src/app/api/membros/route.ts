import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import {
  DatabaseSchema,
  FamilyDependent,
  Member,
  VisitRequest,
} from "@/types/visitas";
import { INITIAL_DATA } from "@/data/initialData";
import {
  getSupabaseClient,
  fetchDatabaseFromSupabase,
  mapMemberToRow,
  mapRequestToRow,
} from "@/lib/supabase";
import { cleanDigits, validateCPF } from "@/lib/cpfUtils";
import { todayISO } from "@/lib/visitasUtils";

const DB_FILE_PATH = path.join(process.cwd(), "src", "data", "db.json");

function readLocalDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE_PATH)) {
      return INITIAL_DATA;
    }
    const raw = fs.readFileSync(DB_FILE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as DatabaseSchema;
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
      console.error("Erro ao carregar do Supabase em /api/membros:", err);
    }
  }
  return readLocalDb();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get("memberId");

  const db = await loadDatabase();

  if (memberId) {
    const member = db.members.find((m) => m.id === memberId);
    if (!member) {
      return NextResponse.json(
        { error: "Membro não encontrado." },
        { status: 404 }
      );
    }

    // Busca cônjuge se houver
    let spouse: Member | null = null;
    if (member.spouseMemberId) {
      spouse = db.members.find((m) => m.id === member.spouseMemberId) || null;
    } else if (member.familyId) {
      spouse =
        db.members.find(
          (m) => m.familyId === member.familyId && m.id !== member.id
        ) || null;
    }

    // Busca solicitações da família
    const familyRequests = db.requests.filter(
      (r) =>
        r.memberId === member.id || (spouse && r.memberId === spouse.id)
    );

    return NextResponse.json({
      ok: true,
      member,
      spouse: spouse
        ? {
            id: spouse.id,
            name: spouse.name,
            phone: spouse.phone,
            email: spouse.email,
            cpf: spouse.cpf,
          }
        : null,
      dependents: member.dependents || spouse?.dependents || [],
      requests: familyRequests,
    });
  }

  return NextResponse.json({ ok: true, membersCount: db.members.length });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, payload } = body;
    const db = await loadDatabase();
    const supabase = getSupabaseClient();

    // 1. CADASTRO DE NOVO MEMBRO
    if (action === "MEMBER_REGISTER") {
      const {
        name,
        cpf,
        email,
        phone,
        birthDate,
        maritalStatus,
        spouseName,
        address,
        password,
        relationship,
        attendanceTime,
        participatesInActivity,
        activityName,
      } = payload;

      const trimmedName = (name || "").trim();
      const cleanedCpf = cleanDigits(cpf);
      const cleanedPhone = cleanDigits(phone);
      const normalizedEmail = (email || "").trim().toLowerCase();

      if (!trimmedName) {
        return NextResponse.json(
          { error: "Nome completo é obrigatório." },
          { status: 400 }
        );
      }

      if (!cleanedCpf || !validateCPF(cleanedCpf)) {
        return NextResponse.json(
          { error: "CPF inválido. Por favor, confira os números digitados." },
          { status: 400 }
        );
      }

      if (!normalizedEmail || !normalizedEmail.includes("@")) {
        return NextResponse.json(
          { error: "E-mail válido é obrigatório para acesso ao portal." },
          { status: 400 }
        );
      }

      if (!cleanedPhone || cleanedPhone.length < 10) {
        return NextResponse.json(
          { error: "Telefone com DDD é obrigatório." },
          { status: 400 }
        );
      }

      if (!password || password.length < 4) {
        return NextResponse.json(
          { error: "A senha deve conter no mínimo 4 dígitos." },
          { status: 400 }
        );
      }

      // Verifica se CPF já está cadastrado
      const existingCpf = db.members.find(
        (m) => cleanDigits(m.cpf) === cleanedCpf
      );
      if (existingCpf) {
        return NextResponse.json(
          {
            error:
              "Este CPF já possui cadastro no Portal do Membro. Utilize a tela de login.",
          },
          { status: 409 }
        );
      }

      // Verifica se E-mail já está cadastrado
      const existingEmail = db.members.find(
        (m) => (m.email || "").trim().toLowerCase() === normalizedEmail
      );
      if (existingEmail) {
        return NextResponse.json(
          {
            error:
              "Este e-mail já está cadastrado. Utilize a recuperação de senha ou faça login.",
          },
          { status: 409 }
        );
      }

      // AUTO-MERGE: Se já existia um registro anterior avulso (visitante ou solicitação prévia) com o mesmo telefone ou nome
      let existingStubIndex = db.members.findIndex(
        (m) =>
          !m.isOfficialMember &&
          (cleanDigits(m.phone) === cleanedPhone ||
            m.name.trim().toLowerCase() === trimmedName.toLowerCase())
      );

      const familyId = `fam-${Date.now()}`;
      let memberToSave: Member;

      if (existingStubIndex >= 0) {
        // Atualiza e oficializa o membro anterior mantendo o histórico de visitas!
        const stub = db.members[existingStubIndex];
        memberToSave = {
          ...stub,
          name: trimmedName,
          cpf: cleanedCpf,
          email: normalizedEmail,
          password: password,
          phone: phone.trim(),
          birthDate: birthDate || stub.birthDate,
          maritalStatus: maritalStatus || stub.maritalStatus,
          spouseName: spouseName?.trim() || stub.spouseName,
          relationship: relationship || stub.relationship || "Membro",
          attendanceTime: attendanceTime || stub.attendanceTime,
          participatesInActivity:
            typeof participatesInActivity === "boolean"
              ? participatesInActivity
              : stub.participatesInActivity,
          activityName: activityName?.trim() || stub.activityName,
          address: address || stub.address,
          isOfficialMember: true,
          familyId: stub.familyId || familyId,
          familyRole: "titular",
          dependents: stub.dependents || [],
        };
        db.members[existingStubIndex] = memberToSave;
      } else {
        // Cria novo membro
        memberToSave = {
          id: `mem-${Date.now()}`,
          name: trimmedName,
          cpf: cleanedCpf,
          email: normalizedEmail,
          password: password,
          phone: phone.trim(),
          birthDate: birthDate || undefined,
          maritalStatus: maritalStatus || "Solteiro(a)",
          spouseName: spouseName?.trim() || undefined,
          relationship: relationship || "Membro",
          attendanceTime: attendanceTime || undefined,
          participatesInActivity:
            typeof participatesInActivity === "boolean"
              ? participatesInActivity
              : undefined,
          activityName: activityName?.trim() || undefined,
          address: address || {
            street: "",
            number: "",
            neighborhood: "",
            city: "Mogi das Cruzes",
          },
          registeredAt: todayISO(),
          lastVisitDate: null,
          situation: "bem",
          needs: [],
          nextVisitDue: null,
          isOfficialMember: true,
          familyId: familyId,
          familyRole: "titular",
          dependents: [],
        };
        db.members.unshift(memberToSave);
      }

      writeLocalDb(db);

      if (supabase) {
        try {
          await supabase
            .from("members")
            .upsert(mapMemberToRow(memberToSave), { onConflict: "id" });
        } catch (supaErr) {
          console.error("Erro ao persistir novo membro no Supabase:", supaErr);
        }
      }

      return NextResponse.json({
        ok: true,
        session: {
          id: memberToSave.id,
          name: memberToSave.name,
          email: memberToSave.email,
          cpf: memberToSave.cpf,
          phone: memberToSave.phone,
          familyId: memberToSave.familyId,
        },
        member: memberToSave,
      });
    }

    // 2. LOGIN DO MEMBRO (por CPF ou E-mail)
    if (action === "MEMBER_LOGIN") {
      const { login, password } = payload;
      const cleanLogin = cleanDigits(login);
      const normalizedLogin = (login || "").trim().toLowerCase();

      const member = db.members.find((m) => {
        const matchesCpf = cleanLogin && cleanDigits(m.cpf) === cleanLogin;
        const matchesEmail =
          m.email && m.email.trim().toLowerCase() === normalizedLogin;
        return matchesCpf || matchesEmail;
      });

      if (!member || !member.password || member.password !== password) {
        return NextResponse.json(
          {
            error:
              "Credenciais inválidas. Verifique o CPF/E-mail e a senha informada.",
          },
          { status: 401 }
        );
      }

      return NextResponse.json({
        ok: true,
        session: {
          id: member.id,
          name: member.name,
          email: member.email,
          cpf: member.cpf,
          phone: member.phone,
          familyId: member.familyId,
        },
        member,
      });
    }

    // 3. ATUALIZAR DADOS DO MEMBRO
    if (action === "MEMBER_UPDATE_PROFILE") {
      const { memberId, updates } = payload;
      const member = db.members.find((m) => m.id === memberId);
      if (!member) {
        return NextResponse.json(
          { error: "Membro não encontrado." },
          { status: 404 }
        );
      }

      if (updates.name && updates.name.trim()) {
        member.name = updates.name.trim();
      }

      if (updates.email && updates.email.trim()) {
        const normEmail = updates.email.trim().toLowerCase();
        const emailConflict = db.members.find(
          (m) => m.id !== memberId && (m.email || "").trim().toLowerCase() === normEmail
        );
        if (emailConflict) {
          return NextResponse.json(
            { error: "Este e-mail já está em uso por outro membro." },
            { status: 409 }
          );
        }
        member.email = normEmail;
      }

      if (updates.phone) member.phone = updates.phone.trim();
      if (updates.birthDate) member.birthDate = updates.birthDate;
      if (updates.maritalStatus) member.maritalStatus = updates.maritalStatus;
      if (updates.spouseName !== undefined)
        member.spouseName = updates.spouseName.trim();
      if (updates.relationship) member.relationship = updates.relationship;
      if (updates.attendanceTime !== undefined)
        member.attendanceTime = updates.attendanceTime || undefined;
      if (updates.participatesInActivity !== undefined)
        member.participatesInActivity = updates.participatesInActivity;
      if (updates.activityName !== undefined)
        member.activityName = updates.activityName?.trim() || undefined;
      if (updates.address) member.address = updates.address;
      if (updates.password && updates.password.trim())
        member.password = updates.password.trim();

      // Se houver cônjuge vinculado e o endereço mudou, atualiza o endereço do cônjuge também
      let spouse: Member | null = null;
      if (member.spouseMemberId && updates.address) {
        spouse = db.members.find((m) => m.id === member.spouseMemberId) || null;
        if (spouse) {
          spouse.address = updates.address;
        }
      }

      writeLocalDb(db);

      if (supabase) {
        try {
          const toUpsert = [mapMemberToRow(member)];
          if (spouse) toUpsert.push(mapMemberToRow(spouse));
          await supabase.from("members").upsert(toUpsert, { onConflict: "id" });
        } catch (supaErr) {
          console.error("Erro ao atualizar membro no Supabase:", supaErr);
        }
      }

      const updatedSession = {
        id: member.id,
        name: member.name,
        email: member.email || "",
        cpf: member.cpf || "",
        phone: member.phone,
        familyId: member.familyId,
      };

      return NextResponse.json({ ok: true, member, session: updatedSession });
    }

    // 4. VINCULAR CÔNJUGE (Por CPF ou E-mail do cônjuge)
    if (action === "FAMILY_LINK_SPOUSE") {
      const { memberId, spouseIdentifier } = payload;
      const cleanSpouseCpf = cleanDigits(spouseIdentifier);
      const normSpouseEmail = (spouseIdentifier || "").trim().toLowerCase();

      const member = db.members.find((m) => m.id === memberId);
      if (!member) {
        return NextResponse.json(
          { error: "Membro titular não encontrado." },
          { status: 404 }
        );
      }

      const spouse = db.members.find((m) => {
        if (m.id === member.id) return false;
        const matchCpf = cleanSpouseCpf && cleanDigits(m.cpf) === cleanSpouseCpf;
        const matchEmail =
          m.email && m.email.trim().toLowerCase() === normSpouseEmail;
        return matchCpf || matchEmail;
      });

      if (!spouse) {
        return NextResponse.json(
          {
            error:
              "Nenhum membro encontrado com este CPF ou e-mail. Peça para o seu cônjuge se cadastrar primeiro.",
          },
          { status: 404 }
        );
      }

      // Vincula ambos na mesma família e compartilha endereço e dependentes
      const unifiedFamilyId = member.familyId || spouse.familyId || `fam-${Date.now()}`;
      member.familyId = unifiedFamilyId;
      spouse.familyId = unifiedFamilyId;
      member.spouseMemberId = spouse.id;
      spouse.spouseMemberId = member.id;
      member.spouseName = spouse.name;
      spouse.spouseName = member.name;
      member.maritalStatus = "Casado(a)";
      spouse.maritalStatus = "Casado(a)";

      // Unifica a lista de dependentes
      const mergedDependents: FamilyDependent[] = [
        ...(member.dependents || []),
      ];
      for (const dep of spouse.dependents || []) {
        if (!mergedDependents.some((d) => d.id === dep.id || (d.fullName === dep.fullName && d.birthDate === dep.birthDate))) {
          mergedDependents.push(dep);
        }
      }
      member.dependents = mergedDependents;
      spouse.dependents = mergedDependents;

      writeLocalDb(db);

      if (supabase) {
        try {
          await supabase
            .from("members")
            .upsert(
              [mapMemberToRow(member), mapMemberToRow(spouse)],
              { onConflict: "id" }
            );
        } catch (supaErr) {
          console.error("Erro ao vincular cônjuge no Supabase:", supaErr);
        }
      }

      return NextResponse.json({
        ok: true,
        member,
        spouse: {
          id: spouse.id,
          name: spouse.name,
          phone: spouse.phone,
          email: spouse.email,
        },
        dependents: mergedDependents,
      });
    }

    // 4.1. DESVINCULAR CÔNJUGE
    if (action === "FAMILY_UNLINK_SPOUSE") {
      const { memberId } = payload;
      const member = db.members.find((m) => m.id === memberId);
      if (!member) {
        return NextResponse.json(
          { error: "Membro titular não encontrado." },
          { status: 404 }
        );
      }

      let spouse: Member | null = null;
      if (member.spouseMemberId) {
        spouse = db.members.find((m) => m.id === member.spouseMemberId) || null;
      }

      if (spouse) {
        spouse.spouseMemberId = undefined;
        spouse.spouseName = undefined;
        spouse.familyId = `fam-${Date.now()}`;
      }

      member.spouseMemberId = undefined;
      member.spouseName = undefined;
      member.familyId = `fam-${Date.now() + 1}`;

      writeLocalDb(db);

      if (supabase) {
        try {
          const toUpsert = [mapMemberToRow(member)];
          if (spouse) toUpsert.push(mapMemberToRow(spouse));
          await supabase.from("members").upsert(toUpsert, { onConflict: "id" });
        } catch (supaErr) {
          console.error("Erro ao desvincular cônjuge no Supabase:", supaErr);
        }
      }

      return NextResponse.json({
        ok: true,
        member,
        spouse: null,
      });
    }

    // 5. ADICIONAR FILHO / DEPENDENTE (< 16 anos)
    if (action === "FAMILY_ADD_DEPENDENT") {
      const {
        memberId,
        fullName,
        birthDate,
        gender,
        relationship,
        notes,
        cpf,
      } = payload;

      const member = db.members.find((m) => m.id === memberId);
      if (!member) {
        return NextResponse.json(
          { error: "Membro não encontrado." },
          { status: 404 }
        );
      }

      if (!fullName || !fullName.trim()) {
        return NextResponse.json(
          { error: "Nome completo do filho(a) é obrigatório." },
          { status: 400 }
        );
      }

      if (!birthDate) {
        return NextResponse.json(
          { error: "Data de nascimento é obrigatória." },
          { status: 400 }
        );
      }

      const newDependent: FamilyDependent = {
        id: `dep-${Date.now()}`,
        fullName: fullName.trim(),
        birthDate,
        gender: gender || undefined,
        relationship: relationship || "Filho(a)",
        notes: notes?.trim() || undefined,
        cpf: cpf ? cleanDigits(cpf) : undefined,
        registeredAt: todayISO(),
      };

      if (!member.dependents) member.dependents = [];
      member.dependents.push(newDependent);

      // Se houver cônjuge vinculado, atualiza também o perfil do cônjuge
      let spouse: Member | null = null;
      if (member.spouseMemberId) {
        spouse = db.members.find((m) => m.id === member.spouseMemberId) || null;
        if (spouse) {
          if (!spouse.dependents) spouse.dependents = [];
          spouse.dependents.push(newDependent);
        }
      }

      writeLocalDb(db);

      if (supabase) {
        try {
          const toUpdate = [mapMemberToRow(member)];
          if (spouse) toUpdate.push(mapMemberToRow(spouse));
          await supabase.from("members").upsert(toUpdate, { onConflict: "id" });
        } catch (supaErr) {
          console.error("Erro ao salvar dependente no Supabase:", supaErr);
        }
      }

      return NextResponse.json({
        ok: true,
        dependent: newDependent,
        dependents: member.dependents,
      });
    }

    // 6. REMOVER FILHO / DEPENDENTE
    if (action === "FAMILY_REMOVE_DEPENDENT") {
      const { memberId, dependentId } = payload;
      const member = db.members.find((m) => m.id === memberId);
      if (!member) {
        return NextResponse.json(
          { error: "Membro não encontrado." },
          { status: 404 }
        );
      }

      member.dependents = (member.dependents || []).filter(
        (d) => d.id !== dependentId
      );

      let spouse: Member | null = null;
      if (member.spouseMemberId) {
        spouse = db.members.find((m) => m.id === member.spouseMemberId) || null;
        if (spouse) {
          spouse.dependents = (spouse.dependents || []).filter(
            (d) => d.id !== dependentId
          );
        }
      }

      writeLocalDb(db);

      if (supabase) {
        try {
          const toUpdate = [mapMemberToRow(member)];
          if (spouse) toUpdate.push(mapMemberToRow(spouse));
          await supabase.from("members").upsert(toUpdate, { onConflict: "id" });
        } catch (supaErr) {
          console.error("Erro ao remover dependente no Supabase:", supaErr);
        }
      }

      return NextResponse.json({ ok: true, dependents: member.dependents });
    }

    // 7. SOLICITAR VISITA PASTORAL DIRETO DO PORTAL DO MEMBRO
    if (action === "MEMBER_CREATE_REQUEST") {
      const {
        memberId,
        targetType, // "Toda a Família" | "Apenas o Casal" | "Filho(a) específico"
        targetDependentName,
        reasons,
        preferredDays,
        preferredShifts,
        observations,
        customAddress,
      } = payload;

      const member = db.members.find((m) => m.id === memberId);
      if (!member) {
        return NextResponse.json(
          { error: "Membro não encontrado." },
          { status: 404 }
        );
      }

      const finalAddress = customAddress || member.address;
      const combinedObs = [
        targetType ? `Visita para: ${targetType}` : "",
        targetDependentName ? `Foco em: ${targetDependentName}` : "",
        observations?.trim() || "",
      ]
        .filter(Boolean)
        .join(" | ");

      const newRequest: VisitRequest = {
        id: `req-${Date.now()}`,
        memberId: member.id,
        memberName: member.name,
        phone: member.phone,
        relationship: member.relationship || "Membro",
        requesterType: "Eu mesmo(a)",
        reasons:
          reasons && reasons.length > 0 ? reasons : ["Visita pastoral / comunhão"],
        address: finalAddress,
        preferredDays:
          preferredDays && preferredDays.length > 0
            ? preferredDays
            : ["A combinar"],
        preferredShifts:
          preferredShifts && preferredShifts.length > 0
            ? preferredShifts
            : ["A combinar"],
        observations: combinedObs || undefined,
        status: "pendente",
        createdAt: todayISO(),
      };

      db.requests.unshift(newRequest);
      writeLocalDb(db);

      if (supabase) {
        try {
          await supabase
            .from("visit_requests")
            .upsert(mapRequestToRow(newRequest), { onConflict: "id" });
        } catch (supaErr) {
          console.error("Erro ao salvar solicitação do membro no Supabase:", supaErr);
        }
      }

      return NextResponse.json({
        ok: true,
        request: newRequest,
      });
    }

    return NextResponse.json(
      { error: `Ação "${action}" desconhecida.` },
      { status: 400 }
    );
  } catch (err) {
    console.error("Erro em /api/membros:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Erro interno no servidor de membros.",
      },
      { status: 500 }
    );
  }
}
