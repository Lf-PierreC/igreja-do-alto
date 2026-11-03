import { NextResponse } from "next/server";
import {
  fetchBemVindosData,
  writeBemVindosLocal,
  saveVisitorSupabase,
  saveAccessRequestSupabase,
  saveTeamMemberSupabase,
  removeTeamMemberSupabase,
} from "@/lib/bemVindosDb";
import { getSupabaseClient, fetchDatabaseFromSupabase } from "@/lib/supabase";
import { cleanDigits } from "@/lib/cpfUtils";
import {
  FirstTimeVisitor,
  VisitorStatus,
  BemVindosAccessRequest,
  BemVindosTeamMember,
  isMemberMinistryEligible,
  VisitorNote,
} from "@/types/bemVindos";
import { DatabaseSchema, Member } from "@/types/visitas";
import fs from "fs";
import path from "path";
import { INITIAL_DATA } from "@/data/initialData";

const DB_FILE_PATH = path.join(process.cwd(), "src", "data", "db.json");

async function loadMembersDb(): Promise<DatabaseSchema> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      return await fetchDatabaseFromSupabase(supabase);
    } catch (err) {
      console.error("Erro ao carregar membros do Supabase em /api/bem-vindos:", err);
    }
  }
  try {
    if (!fs.existsSync(DB_FILE_PATH)) return INITIAL_DATA;
    const raw = fs.readFileSync(DB_FILE_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return INITIAL_DATA;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requesterId = searchParams.get("requesterId");
    const statusFilter = searchParams.get("status");
    const channelFilter = searchParams.get("channel");
    const searchFilter = (searchParams.get("search") || "").trim().toLowerCase();
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const { visitors, requests, team } = await fetchBemVindosData();
    const membersDb = await loadMembersDb();

    // Identifica se o usuário requisitante é admin (apenas admin gerencia acessos)
    let isAdmin = false;
    let loggedMember: Member | null = null;

    if (requesterId === "admin-master") {
      isAdmin = true;
    } else if (requesterId) {
      loggedMember = membersDb.members.find((m) => m.id === requesterId) || null;
      const matchedPastor = membersDb.pastors.find(
        (p) =>
          p.memberId === requesterId ||
          p.id === requesterId ||
          (loggedMember && p.name.toLowerCase() === loggedMember.name.toLowerCase())
      );
      isAdmin = Boolean(
        loggedMember?.isAdmin ||
        loggedMember?.portalRole === "admin" ||
        matchedPastor?.accessRole === "admin" ||
        (loggedMember?.relationship && loggedMember.relationship.toLowerCase().includes("admin"))
      );
    }

    // Filtros sobre os visitantes
    let filteredVisitors = [...visitors];

    if (statusFilter && statusFilter !== "todos") {
      filteredVisitors = filteredVisitors.filter((v) => v.status === statusFilter);
    }

    if (channelFilter && channelFilter !== "todos") {
      filteredVisitors = filteredVisitors.filter((v) => v.howHeard === channelFilter);
    }

    if (dateFrom) {
      filteredVisitors = filteredVisitors.filter((v) => v.visitDate >= dateFrom);
    }

    if (dateTo) {
      filteredVisitors = filteredVisitors.filter((v) => v.visitDate <= dateTo);
    }

    if (searchFilter) {
      filteredVisitors = filteredVisitors.filter(
        (v) =>
          v.fullName.toLowerCase().includes(searchFilter) ||
          cleanDigits(v.phone).includes(cleanDigits(searchFilter)) ||
          (v.neighborhood && v.neighborhood.toLowerCase().includes(searchFilter)) ||
          (v.howHeardDetail && v.howHeardDetail.toLowerCase().includes(searchFilter)) ||
          (v.churchBackground && v.churchBackground.toLowerCase().includes(searchFilter)) ||
          (v.otherChurchName && v.otherChurchName.toLowerCase().includes(searchFilter))
      );
    }

    // Métricas para o Dashboard
    const totalCount = visitors.length;
    const novosCount = visitors.filter((v) => v.status === "novo").length;
    const contactadosCount = visitors.filter((v) =>
      ["mensagem_enviada", "em_conversa", "convidado_celula", "retornou_culto", "integrado"].includes(v.status)
    ).length;
    const integradosCount = visitors.filter((v) => v.status === "integrado").length;
    const emConversaCount = visitors.filter((v) =>
      ["em_conversa", "convidado_celula"].includes(v.status)
    ).length;

    const channelBreakdown: Record<string, number> = {};
    const statusBreakdown: Record<string, number> = {};

    visitors.forEach((v) => {
      channelBreakdown[v.howHeard] = (channelBreakdown[v.howHeard] || 0) + 1;
      statusBreakdown[v.status] = (statusBreakdown[v.status] || 0) + 1;
    });

    const pendingRequests = requests.filter((r) => r.status === "pendente");

    return NextResponse.json({
      ok: true,
      visitors: filteredVisitors,
      metrics: {
        total: totalCount,
        novos: novosCount,
        contactados: contactadosCount,
        percentContactados: totalCount > 0 ? Math.round((contactadosCount / totalCount) * 100) : 0,
        emConversa: emConversaCount,
        integrados: integradosCount,
        channelBreakdown,
        statusBreakdown,
      },
      pendingRequestsCount: pendingRequests.length,
      // Apenas Administradores têm acesso à lista de solicitações e à equipe
      accessRequests: isAdmin ? requests : undefined,
      team: isAdmin ? team : undefined,
      isAdmin,
      isPastorOrAdmin: isAdmin, // mantido para compatibilidade
    });
  } catch (error: any) {
    console.error("Erro no GET /api/bem-vindos:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, payload } = body;
    const supabase = getSupabaseClient();
    const data = await fetchBemVindosData();
    const membersDb = await loadMembersDb();

    // 1. CADASTRO PÚBLICO DE VISITANTE (PELO LINK AVULSO OU QR CODE)
    if (action === "PUBLIC_VISITOR_REGISTER") {
      const {
        fullName,
        phone,
        howHeard,
        howHeardDetail,
        churchBackground,
        otherChurchName,
        visitDate,
        servicePeriod,
        neighborhood,
        city,
        prayerRequest,
      } = payload;

      if (!fullName || !fullName.trim()) {
        return NextResponse.json({ error: "Nome completo é obrigatório." }, { status: 400 });
      }

      const cleanedPhone = cleanDigits(phone);
      if (!cleanedPhone || cleanedPhone.length < 10) {
        return NextResponse.json({ error: "Telefone com WhatsApp válido é obrigatório." }, { status: 400 });
      }

      if (!howHeard) {
        return NextResponse.json({ error: "Selecione onde nos conheceu." }, { status: 400 });
      }

      const newVisitor: FirstTimeVisitor = {
        id: `vis-${Date.now()}`,
        fullName: fullName.trim(),
        phone: phone.trim(),
        howHeard,
        howHeardDetail: howHeardDetail?.trim() || undefined,
        churchBackground: churchBackground?.trim() || undefined,
        otherChurchName: otherChurchName?.trim() || undefined,
        visitDate: visitDate || new Date().toISOString().split("T")[0],
        servicePeriod: servicePeriod || "Culto de Domingo",
        neighborhood: neighborhood?.trim() || undefined,
        city: city?.trim() || "Mogi das Cruzes",
        prayerRequest: prayerRequest?.trim() || undefined,
        status: "novo",
        notes: [
          {
            id: `note-${Date.now()}`,
            createdAt: new Date().toISOString(),
            authorName: "Autoatendimento",
            text: "Preenchido diretamente pelo visitante através do link de boas-vindas.",
          },
        ],
        registeredBy: { type: "self" },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      data.visitors.unshift(newVisitor);
      writeBemVindosLocal({ visitors: data.visitors });

      if (supabase) {
        await saveVisitorSupabase(supabase, newVisitor);
      }

      return NextResponse.json({ ok: true, visitor: newVisitor });
    }

    // 2. CADASTRO INTERNO DE VISITANTE (PREENCHIDO POR UM MEMBRO DA EQUIPE NO PORTAL)
    if (action === "INTERNAL_VISITOR_REGISTER") {
      const {
        fullName,
        phone,
        howHeard,
        howHeardDetail,
        churchBackground,
        otherChurchName,
        visitDate,
        servicePeriod,
        neighborhood,
        city,
        prayerRequest,
        initialNote,
        registeredByMemberId,
        registeredByMemberName,
      } = payload;

      if (!fullName || !fullName.trim()) {
        return NextResponse.json({ error: "Nome completo é obrigatório." }, { status: 400 });
      }

      const cleanedPhone = cleanDigits(phone);
      if (!cleanedPhone || cleanedPhone.length < 10) {
        return NextResponse.json({ error: "Telefone com WhatsApp é obrigatório." }, { status: 400 });
      }

      const notes: VisitorNote[] = [];
      if (initialNote && initialNote.trim()) {
        notes.push({
          id: `note-${Date.now()}`,
          createdAt: new Date().toISOString(),
          authorId: registeredByMemberId,
          authorName: registeredByMemberName || "Equipe Bem-Vindo",
          text: initialNote.trim(),
        });
      }

      const newVisitor: FirstTimeVisitor = {
        id: `vis-${Date.now()}`,
        fullName: fullName.trim(),
        phone: phone.trim(),
        howHeard: howHeard || "Outro",
        howHeardDetail: howHeardDetail?.trim() || undefined,
        churchBackground: churchBackground?.trim() || undefined,
        otherChurchName: otherChurchName?.trim() || undefined,
        visitDate: visitDate || new Date().toISOString().split("T")[0],
        servicePeriod: servicePeriod || "Culto de Domingo",
        neighborhood: neighborhood?.trim() || undefined,
        city: city?.trim() || "Mogi das Cruzes",
        prayerRequest: prayerRequest?.trim() || undefined,
        status: "novo",
        notes,
        registeredBy: {
          type: "member",
          memberId: registeredByMemberId,
          memberName: registeredByMemberName || "Voluntário",
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      data.visitors.unshift(newVisitor);
      writeBemVindosLocal({ visitors: data.visitors });

      if (supabase) {
        await saveVisitorSupabase(supabase, newVisitor);
      }

      return NextResponse.json({ ok: true, visitor: newVisitor });
    }

    // 3. ATUALIZAÇÃO DE STATUS DO VISITANTE + LOG DE HISTÓRICO
    if (action === "UPDATE_VISITOR_STATUS") {
      const { visitorId, newStatus, noteText, authorMemberId, authorMemberName } = payload;

      const visitorIndex = data.visitors.findIndex((v) => v.id === visitorId);
      if (visitorIndex < 0) {
        return NextResponse.json({ error: "Visitante não encontrado." }, { status: 404 });
      }

      const visitor = data.visitors[visitorIndex];
      const previousStatus = visitor.status;
      visitor.status = newStatus as VisitorStatus;
      visitor.updatedAt = new Date().toISOString();

      if (!visitor.notes) visitor.notes = [];

      const logText = noteText && noteText.trim()
        ? noteText.trim()
        : `Status alterado de "${previousStatus}" para "${newStatus}".`;

      visitor.notes.unshift({
        id: `note-${Date.now()}`,
        createdAt: new Date().toISOString(),
        authorId: authorMemberId,
        authorName: authorMemberName || "Equipe Bem-Vindos",
        text: logText,
        actionTag: "MUDANCA_STATUS",
      });

      data.visitors[visitorIndex] = visitor;
      writeBemVindosLocal({ visitors: data.visitors });

      if (supabase) {
        await saveVisitorSupabase(supabase, visitor);
      }

      return NextResponse.json({ ok: true, visitor });
    }

    // 4. ADICIONAR ANOTAÇÃO / CONTATO AO HISTÓRICO DO VISITANTE
    if (action === "ADD_VISITOR_NOTE") {
      const { visitorId, noteText, authorMemberId, authorMemberName, actionTag } = payload;

      const visitorIndex = data.visitors.findIndex((v) => v.id === visitorId);
      if (visitorIndex < 0) {
        return NextResponse.json({ error: "Visitante não encontrado." }, { status: 404 });
      }

      if (!noteText || !noteText.trim()) {
        return NextResponse.json({ error: "O texto da anotação não pode ser vazio." }, { status: 400 });
      }

      const visitor = data.visitors[visitorIndex];
      if (!visitor.notes) visitor.notes = [];

      const newNote: VisitorNote = {
        id: `note-${Date.now()}`,
        createdAt: new Date().toISOString(),
        authorId: authorMemberId,
        authorName: authorMemberName || "Equipe Bem-Vindos",
        text: noteText.trim(),
        actionTag: actionTag || "ANOTACAO",
      };

      visitor.notes.unshift(newNote);
      visitor.updatedAt = new Date().toISOString();

      data.visitors[visitorIndex] = visitor;
      writeBemVindosLocal({ visitors: data.visitors });

      if (supabase) {
        await saveVisitorSupabase(supabase, visitor);
      }

      return NextResponse.json({ ok: true, visitor, note: newNote });
    }

    // 5. SOLICITAR ACESSO AO PORTAL BEM-VINDO
    if (action === "REQUEST_ACCESS") {
      const { memberId } = payload;
      let member = membersDb.members.find((m) => m.id === memberId);
      let pastor = membersDb.pastors.find((p) => p.id === memberId || p.memberId === memberId);

      if (!member && !pastor) {
        return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
      }

      const isPastor = Boolean(member?.isPastor || pastor);
      const isEligible =
        isPastor ||
        isMemberMinistryEligible(member?.currentMinistries) ||
        member?.isAdmin;

      if (!isEligible) {
        return NextResponse.json(
          {
            error:
              "Acesso restrito: para solicitar permissão, o seu cadastro precisa estar vinculado aos ministérios 'Bem-vindo (Recepção)', 'A Mais (Diaconia)', 'Evangelismo' ou à Liderança Pastoral.",
          },
          { status: 403 }
        );
      }

      // Verifica se já existe solicitação
      const existingReq = data.requests.find((r) => r.memberId === memberId);
      if (existingReq) {
        if (existingReq.status === "pendente") {
          return NextResponse.json({
            ok: true,
            message: "Sua solicitação de acesso já está em análise pelo administrador.",
            request: existingReq,
          });
        }
        if (existingReq.status === "aprovado") {
          return NextResponse.json({
            ok: true,
            message: "Seu acesso já foi aprovado!",
            request: existingReq,
          });
        }
      }

      const reqName = member?.name || pastor?.name || "Solicitante";
      const reqEmail = member?.email || "";
      const reqPhone = member?.phone || pastor?.phone || "";
      const reqMinistries = member?.currentMinistries || (isPastor ? ["Liderança Pastoral"] : []);

      const newRequest: BemVindosAccessRequest = {
        id: `req-bv-${Date.now()}`,
        memberId: memberId,
        memberName: reqName,
        memberEmail: reqEmail,
        memberPhone: reqPhone,
        memberMinistries: reqMinistries,
        status: "pendente",
        requestedAt: new Date().toISOString(),
        role: isPastor ? "pastor" : "voluntario",
      };

      data.requests.unshift(newRequest);
      writeBemVindosLocal({ requests: data.requests });

      if (supabase) {
        await saveAccessRequestSupabase(supabase, newRequest);
      }

      return NextResponse.json({
        ok: true,
        message: "Solicitação enviada com sucesso ao administrador!",
        request: newRequest,
      });
    }

    // 6. AVALIAR SOLICITAÇÃO DE ACESSO (APENAS ADMIN)
    if (action === "REVIEW_ACCESS_REQUEST") {
      const { requestId, decision, role, reviewerName, reviewerId } = payload;

      const reqIndex = data.requests.findIndex((r) => r.id === requestId);
      if (reqIndex < 0) {
        return NextResponse.json({ error: "Solicitação não encontrada." }, { status: 404 });
      }

      const req = data.requests[reqIndex];
      req.status = decision; // 'aprovado' | 'recusado'
      req.reviewedBy = reviewerName || "Administrador";
      req.reviewedAt = new Date().toISOString();
      req.role = role || "voluntario";

      data.requests[reqIndex] = req;

      if (decision === "aprovado") {
        // Adiciona à equipe
        const existingTeamIndex = data.team.findIndex((t) => t.memberId === req.memberId);
        const teamEntry: BemVindosTeamMember = {
          memberId: req.memberId,
          memberName: req.memberName,
          memberEmail: req.memberEmail,
          phone: req.memberPhone,
          role: role || "voluntario",
          approvedAt: new Date().toISOString(),
          approvedBy: reviewerName || "Administrador",
        };

        if (existingTeamIndex >= 0) {
          data.team[existingTeamIndex] = teamEntry;
        } else {
          data.team.push(teamEntry);
        }

        if (supabase) {
          await saveTeamMemberSupabase(supabase, teamEntry);
        }
      } else {
        // Se recusado, remove da equipe se existisse
        data.team = data.team.filter((t) => t.memberId !== req.memberId);
        if (supabase) {
          await removeTeamMemberSupabase(supabase, req.memberId);
        }
      }

      writeBemVindosLocal({ requests: data.requests, team: data.team });

      if (supabase) {
        await saveAccessRequestSupabase(supabase, req);
      }

      return NextResponse.json({ ok: true, request: req, team: data.team });
    }

    // 7. REVOGAR ACESSO DE UM MEMBRO (APENAS ADMIN)
    if (action === "REVOKE_ACCESS") {
      const { memberId, reviewerName } = payload;

      data.team = data.team.filter((t) => t.memberId !== memberId);
      const req = data.requests.find((r) => r.memberId === memberId);
      if (req) {
        req.status = "recusado";
        req.reviewedBy = reviewerName || "Administrador";
        req.reviewedAt = new Date().toISOString();
      }

      writeBemVindosLocal({ requests: data.requests, team: data.team });

      if (supabase) {
        await removeTeamMemberSupabase(supabase, memberId);
        if (req) await saveAccessRequestSupabase(supabase, req);
      }

      return NextResponse.json({ ok: true, team: data.team });
    }

    // 8. LOGIN NO PORTAL BEM-VINDOS
    if (action === "BEM_VINDOS_LOGIN") {
      const { login, password } = payload;
      const cleanLogin = cleanDigits(login);
      const normalizedLogin = (login || "").trim().toLowerCase();

      // Caso especial: Master Admin
      if (
        normalizedLogin === "admin" &&
        (password === "igrejadoalto" ||
          password === process.env.ADMIN_PASSWORD ||
          password === "admin123")
      ) {
        return NextResponse.json({
          ok: true,
          hasAccess: true,
          isPastorOrAdmin: true,
          role: "admin",
          session: {
            id: "admin-master",
            name: "Administrador Geral",
            email: "admin@igrejadoalto.com",
            cpf: "00000000000",
            phone: "(11) 99999-9999",
            portalRole: "admin",
          },
        });
      }

      // Procura membro por CPF ou E-mail
      let member = membersDb.members.find((m) => {
        const mCpf = cleanDigits(m.cpf);
        const matchesCpf =
          cleanLogin &&
          (mCpf === cleanLogin ||
            (mCpf && cleanLogin && mCpf.padStart(11, "0") === cleanLogin.padStart(11, "0")));
        const matchesEmail = m.email && m.email.trim().toLowerCase() === normalizedLogin;
        return matchesCpf || matchesEmail;
      });

      // Procura também em pastores
      let pastor = membersDb.pastors.find(
        (p) => p.username && p.username.toLowerCase() === normalizedLogin
      );

      if (!member && pastor) {
        member = membersDb.members.find(
          (m) => m.id === pastor?.memberId || m.name.toLowerCase() === pastor?.name.toLowerCase()
        );
      }

      if (member && !pastor) {
        pastor = membersDb.pastors.find(
          (p) =>
            p.memberId === member!.id ||
            p.id === member!.id ||
            (p.name && member!.name && p.name.toLowerCase() === member!.name.toLowerCase())
        );
      }

      if (!member && !pastor) {
        return NextResponse.json(
          { error: "Credenciais inválidas. Verifique o CPF ou E-mail digitado." },
          { status: 401 }
        );
      }

      // Verifica senha
      const validMemberPass = member?.password && member.password === password;
      const validPastorPass = pastor?.password && pastor.password === password;
      const isMasterPass = password === "igrejadoalto";

      if (!validMemberPass && !validPastorPass && !isMasterPass) {
        return NextResponse.json({ error: "Senha incorreta. Tente novamente." }, { status: 401 } );
      }

      // Identifica se é Admin (apenas admin tem acesso direto e gerencia acessos)
      const isAdmin = Boolean(
        normalizedLogin === "admin" ||
        member?.isAdmin ||
        member?.portalRole === "admin" ||
        pastor?.accessRole === "admin" ||
        (member?.relationship && member.relationship.toLowerCase().includes("admin"))
      );

      const isPastor = Boolean(
        member?.isPastor ||
        member?.portalRole === "pastor" ||
        Boolean(pastor)
      );

      const memberId = member?.id || pastor?.id || (pastor ? `pas-${pastor.id}` : "mem-user");
      const memberName = member?.name || pastor?.name || "Membro";
      const memberPhone = member?.phone || pastor?.phone || "";
      const memberEmail = member?.email || "";
      const currentMinistries = member?.currentMinistries || (isPastor ? ["Liderança Pastoral"] : []);

      // 1. SE FOR ADMIN: Tem acesso imediato garantido e gerencia a equipe
      if (isAdmin) {
        return NextResponse.json({
          ok: true,
          hasAccess: true,
          isAdmin: true,
          isPastorOrAdmin: true,
          role: "admin",
          session: {
            id: memberId,
            name: memberName,
            email: memberEmail,
            phone: memberPhone,
            isAdmin: true,
            isPastor,
            teamRole: "admin",
          },
        });
      }

      // 2. SE NÃO FOR ADMIN (mesmo sendo Pastor, Líder ou Voluntário):
      // Verifica elegibilidade: deve ser Pastor OU pertencer aos ministérios autorizados
      const isEligible = isPastor || isMemberMinistryEligible(currentMinistries);

      if (!isEligible) {
        return NextResponse.json(
          {
            ok: false,
            errorType: "NOT_ELIGIBLE_MINISTRY",
            message:
              "Seu cadastro não possui vínculo com a liderança pastoral ou com os ministérios 'Bem-vindo (Recepção)', 'A Mais (Diaconia)' ou 'Evangelismo'. Para participar da equipe, procure a administração ou atualize seus dados no Portal do Membro.",
            memberMinistries: currentMinistries,
          },
          { status: 403 }
        );
      }

      // 3. Verifica se já foi aprovado pelo Admin na equipe
      const teamEntry = data.team.find((t) => t.memberId === memberId);
      if (teamEntry) {
        return NextResponse.json({
          ok: true,
          hasAccess: true,
          isAdmin: false,
          isPastorOrAdmin: false,
          role: teamEntry.role,
          session: {
            id: memberId,
            name: memberName,
            email: memberEmail,
            phone: memberPhone,
            isAdmin: false,
            isPastor,
            teamRole: teamEntry.role,
          },
        });
      }

      // 4. Não está na equipe aprovada: verifica se tem solicitação pendente
      const pendingReq = data.requests.find((r) => r.memberId === memberId && r.status === "pendente");
      if (pendingReq) {
        return NextResponse.json({
          ok: true,
          hasAccess: false,
          needsApproval: true,
          status: "pendente",
          message: "Sua solicitação de acesso está aguardando aprovação do administrador.",
          session: {
            id: memberId,
            name: memberName,
            email: memberEmail,
            phone: memberPhone,
            ministries: currentMinistries,
          },
        });
      }

      // 5. Elegível mas ainda não solicitou acesso (incluindo pastores e líderes)
      return NextResponse.json({
        ok: true,
        hasAccess: false,
        needsApproval: true,
        canRequest: true,
        status: "nao_solicitado",
        message: isPastor
          ? "Identificamos seu perfil pastoral. Por favor, clique abaixo para solicitar a liberação do seu acesso ao administrador."
          : "Identificamos que você faz parte dos ministérios de acolhimento! Clique abaixo para solicitar sua liberação de acesso ao administrador.",
        session: {
          id: memberId,
          name: memberName,
          email: memberEmail,
          phone: memberPhone,
          ministries: currentMinistries,
        },
      });
    }

    return NextResponse.json({ error: "Ação não reconhecida." }, { status: 400 });
  } catch (error: any) {
    console.error("Erro no POST /api/bem-vindos:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
