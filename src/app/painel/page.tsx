"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { INITIAL_DATA } from "@/data/initialData";
import {
  DatabaseSchema,
  UserAccessRole,
  VisitReport,
  VisitRequest,
} from "@/types/visitas";
import { formatDateBR, SITUATION_META } from "@/lib/visitasUtils";
import { deriveDefaultUsername } from "@/lib/supabase";
import { LightDismissDialog } from "@/components/LightDismissDialog";
import {
  DashboardTab,
  PessoasPresetFilter,
} from "@/components/painel/DashboardTab";
import { NovaVisitaFormTab } from "@/components/painel/NovaVisitaFormTab";
import { RelatoriosListTab } from "@/components/painel/RelatoriosListTab";
import { VisitasPorPessoaTab } from "@/components/painel/VisitasPorPessoaTab";
import { SolicitacoesQueueTab } from "@/components/painel/SolicitacoesQueueTab";
import { EquipeAcessosTab } from "@/components/painel/EquipeAcessosTab";
import {
  BarChart3,
  ClipboardCheck,
  FileText,
  Users,
  ClipboardList,
  Calendar,
  MapPin,
  Clock,
  ArrowUpRight,
  Lock,
  LogOut,
  AlertCircle,
  ShieldCheck,
  Copy,
  Check,
} from "lucide-react";

type ActiveTab =
  | "dashboard"
  | "nova-visita"
  | "relatorios"
  | "pessoas"
  | "solicitacoes"
  | "equipe";

interface LoggedUser {
  id: string;
  name: string;
  username: string;
  accessRole: UserAccessRole;
}

const SESSION_STORAGE_KEY = "igreja_alto_user_session_v2";
const EXPECTED_ADMIN_USER =
  process.env.NEXT_PUBLIC_ADMIN_USER?.trim() || "admin";
const EXPECTED_ADMIN_PASS =
  process.env.NEXT_PUBLIC_ADMIN_PASS?.trim() || "igrejadoalto";

export default function PainelLideresPage() {
  const [currentUser, setCurrentUser] = useState<LoggedUser | null>(null);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [loginUser, setLoginUser] = useState<string>("");
  const [loginPass, setLoginPass] = useState<string>("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [copiedMemberLink, setCopiedMemberLink] = useState(false);

  const [db, setDb] = useState<DatabaseSchema>(INITIAL_DATA);
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(
    null
  );
  const [pessoasPresetFilter, setPessoasPresetFilter] =
    useState<PessoasPresetFilter>("TODOS");
  const [preselectedRequestId, setPreselectedRequestId] = useState<
    string | null
  >(null);
  const [modalReport, setModalReport] = useState<VisitReport | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as any;
        const role = parsed.accessRole || parsed.role || "pastor";
        if (parsed && (parsed.username || parsed.name)) {
          const userObj: LoggedUser = {
            id: parsed.id || (role === "admin" ? "master-admin" : "pastor-session"),
            name: parsed.name || "Pastor",
            username: parsed.username || (parsed.name ? parsed.name.toLowerCase().replace(/\s+/g, ".") : "admin"),
            accessRole: role,
          };
          setCurrentUser(userObj);

          try {
            const urlParams = new URLSearchParams(window.location.search);
            const tabParam = urlParams.get("tab");
            if (tabParam === "pessoas") {
              setActiveTab("pessoas");
            } else if (tabParam === "nova-visita") {
              setActiveTab("nova-visita");
            } else if (tabParam === "solicitacoes") {
              setActiveTab("solicitacoes");
            } else if (tabParam === "relatorios" && role === "admin") {
              setActiveTab("relatorios");
            } else {
              setActiveTab(role === "admin" ? "dashboard" : "nova-visita");
            }
          } catch {
            setActiveTab(role === "admin" ? "dashboard" : "nova-visita");
          }
        }
      }
    } catch {
      // ignore storage errors
    } finally {
      setAuthChecked(true);
    }

    fetch("/api/dados")
      .then((res) => res.json())
      .then((data: DatabaseSchema) => {
        if (data && data.schemaVersion === 2 && data.members) {
          setDb(data);
        }
      })
      .catch(() => {
        // Fallback to INITIAL_DATA if offline
      });
  }, []);

  const isAdmin = currentUser?.accessRole === "admin";

  // Quando a lista de pastores atualiza do banco, sincroniza eventual mudança de permissão do usuário logado
  useEffect(() => {
    if (!currentUser || currentUser.id === "master-admin") return;
    const found = db.pastors.find((p) => p.id === currentUser.id);
    if (found) {
      const updatedRole: UserAccessRole =
        found.accessRole === "admin" ? "admin" : "pastor";
      if (
        updatedRole !== currentUser.accessRole ||
        found.name !== currentUser.name
      ) {
        const nextUser: LoggedUser = {
          ...currentUser,
          name: found.name,
          accessRole: updatedRole,
        };
        setCurrentUser(nextUser);
        try {
          window.localStorage.setItem(
            SESSION_STORAGE_KEY,
            JSON.stringify(nextUser)
          );
        } catch {
          // ignore
        }
      }
    }
  }, [db.pastors, currentUser]);

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError(null);

    const inputUser = loginUser.trim().toLowerCase();
    const inputPass = loginPass;

    // 1. Verifica Login Mestre de Administrador
    if (
      inputUser === EXPECTED_ADMIN_USER.toLowerCase() &&
      inputPass === EXPECTED_ADMIN_PASS
    ) {
      const masterSession: LoggedUser = {
        id: "master-admin",
        name: "Administração Geral",
        username: EXPECTED_ADMIN_USER,
        accessRole: "admin",
      };
      setCurrentUser(masterSession);
      setActiveTab("dashboard");
      try {
        window.localStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify(masterSession)
        );
      } catch {
        // ignore
      }
      return;
    }

    // 2. Verifica Login Individual de Pastor / Administrador cadastrado
    const matchedPastor = db.pastors.find((p) => {
      const pUser = (p.username || deriveDefaultUsername(p.name))
        .trim()
        .toLowerCase();
      const pName = p.name.trim().toLowerCase();
      return pUser === inputUser || pName === inputUser;
    });

    if (matchedPastor) {
      const expectedPass = matchedPastor.password || "igrejadoalto";
      if (inputPass === expectedPass) {
        const role: UserAccessRole =
          matchedPastor.accessRole === "admin" ? "admin" : "pastor";
        const pastorSession: LoggedUser = {
          id: matchedPastor.id,
          name: matchedPastor.name,
          username:
            matchedPastor.username || deriveDefaultUsername(matchedPastor.name),
          accessRole: role,
        };
        setCurrentUser(pastorSession);
        setActiveTab(role === "admin" ? "dashboard" : "nova-visita");
        try {
          window.localStorage.setItem(
            SESSION_STORAGE_KEY,
            JSON.stringify(pastorSession)
          );
        } catch {
          // ignore
        }
        return;
      }
    }

    setLoginError("Usuário ou senha inválidos. Verifique suas credenciais.");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginPass("");
    try {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const handleCopyMemberLink = () => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/solicitar-visita`
        : "/solicitar-visita";
    navigator.clipboard?.writeText(url);
    setCopiedMemberLink(true);
    setTimeout(() => setCopiedMemberLink(false), 2200);
  };

  const handleSelectMemberForHistory = (memberId: string) => {
    setSelectedMemberId(memberId);
    setPessoasPresetFilter("TODOS");
    setActiveTab("pessoas");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleViewAllMembers = (preset: PessoasPresetFilter = "TODOS") => {
    setPessoasPresetFilter(preset);
    setActiveTab("pessoas");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStartVisitForMember = (memberId: string, requestId?: string) => {
    setSelectedMemberId(memberId);
    setPreselectedRequestId(requestId || null);
    setActiveTab("nova-visita");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRegisterVisitFromRequest = (req: VisitRequest) => {
    setSelectedMemberId(req.memberId);
    setPreselectedRequestId(req.id);
    setActiveTab("nova-visita");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Filtra dados para a visão restrita de Pastor (pessoas que ele já visitou e solicitações designadas para ele)
  const pastorScopedDb = useMemo<DatabaseSchema>(() => {
    if (!currentUser || isAdmin) return db;
    const pastorName = currentUser.name;
    const visitedMemberIds = new Set(
      db.reports
        .filter((rep) => (rep.visitors || []).includes(pastorName))
        .map((rep) => rep.memberId)
    );
    const filteredMembers = db.members.filter(
      (m) =>
        visitedMemberIds.has(m.id) ||
        (m.lastVisitedBy && m.lastVisitedBy.includes(pastorName))
    );
    const filteredReports = db.reports.filter(
      (rep) =>
        visitedMemberIds.has(rep.memberId) ||
        (rep.visitors || []).includes(pastorName)
    );
    return {
      ...db,
      members: filteredMembers,
      reports: filteredReports,
    };
  }, [db, currentUser, isAdmin]);

  const openRequestsCount = useMemo(() => {
    return db.requests.filter((r) => {
      const isOpen = r.status === "pendente" || r.status === "agendada";
      if (!isOpen) return false;
      if (!isAdmin && currentUser) {
        return r.assignedPastor === currentUser.name;
      }
      return true;
    }).length;
  }, [db.requests, isAdmin, currentUser]);

  if (!authChecked) {
    return <div className="min-h-screen bg-[#DCDACF]" />;
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col bg-[#DCDACF] text-[#252525]">
        <header className="bg-[#252525] text-[#DCDACF] border-b-4 border-[#CB4B3B]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
            <BrandLogo variant="on-dark2" size="sm" showTagline />
            <button
              type="button"
              onClick={handleCopyMemberLink}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#363636] hover:bg-[#CB4B3B] text-[#DCDACF] text-xs font-bold uppercase tracking-wider transition-colors"
            >
              {copiedMemberLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  Link de Membros Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-[#CB4B3B]" />
                  Copiar Link de Membros
                </>
              )}
            </button>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-md rounded-3xl bg-[#F4F3EE] border-2 border-[#252525] shadow-2xl overflow-hidden">
            <div className="bg-[#252525] text-[#DCDACF] px-6 py-6 border-b-4 border-[#CB4B3B] flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#CB4B3B] text-[#DCDACF] flex items-center justify-center shrink-0 shadow">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#CB4B3B]">
                  Ministério de Visitação • Igreja do Alto
                </span>
                <h1 className="text-lg sm:text-xl font-black uppercase tracking-tight">
                  Acesso de Pastores & Admin
                </h1>
              </div>
            </div>

            <form onSubmit={handleLogin} className="p-6 sm:p-8 space-y-5">
              {loginError && (
                <div
                  role="alert"
                  className="p-3.5 rounded-2xl bg-[#F9EAE8] border-2 border-[#CB4B3B] text-[#A93829] flex items-start gap-2.5 text-xs font-bold"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="login-user"
                  className="block text-xs font-extrabold uppercase tracking-wider text-[#252525] mb-1.5"
                >
                  Seu Usuário
                </label>
                <input
                  id="login-user"
                  type="text"
                  required
                  autoComplete="username"
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  placeholder="Ex: marcos, rafael, admin..."
                  className="w-full rounded-xl border-2 border-[#252525]/25 bg-white px-4 py-3 text-sm font-semibold text-[#252525]"
                />
              </div>

              <div>
                <label
                  htmlFor="login-pass"
                  className="block text-xs font-extrabold uppercase tracking-wider text-[#252525] mb-1.5"
                >
                  Senha de Acesso
                </label>
                <input
                  id="login-pass"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border-2 border-[#252525]/25 bg-white px-4 py-3 text-sm font-semibold text-[#252525]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-xl bg-[#CB4B3B] hover:bg-[#A93829] text-[#DCDACF] font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg transition-colors"
              >
                Entrar no Sistema
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  const navigationTabs = isAdmin
    ? ([
        {
          id: "dashboard",
          label: "Dashboard",
          icon: BarChart3,
        },
        {
          id: "nova-visita",
          label: "Relatório de Visita",
          icon: ClipboardCheck,
        },
        {
          id: "relatorios",
          label: `Visitas Registradas (${db.reports.length})`,
          icon: FileText,
        },
        {
          id: "pessoas",
          label: `Visitas por Pessoa (${db.members.length})`,
          icon: Users,
        },
        {
          id: "solicitacoes",
          label: `Solicitações (${openRequestsCount})`,
          icon: ClipboardList,
        },
      ] as const)
    : ([
        {
          id: "nova-visita",
          label: "Registrar Relatório de Visita",
          icon: ClipboardCheck,
        },
        {
          id: "solicitacoes",
          label: `Minhas Solicitações (${openRequestsCount})`,
          icon: ClipboardList,
        },
        {
          id: "pessoas",
          label: `Pessoas que Visitei (${pastorScopedDb.members.length})`,
          icon: Users,
        },
      ] as const);

  return (
    <div className="min-h-screen flex flex-col bg-[#DCDACF] text-[#252525]">
      {/* Top Navigation Header */}
      <header className="bg-[#252525] text-[#DCDACF] border-b-4 border-[#CB4B3B] sticky top-0 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <BrandLogo variant="on-dark2" size="sm" showTagline />

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#363636] text-[#DCDACF] text-xs font-extrabold">
              <span className="w-2 h-2 rounded-full bg-[#CB4B3B]" />
              <span>{currentUser.name}</span>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#252525] text-[#CB4B3B] font-black">
                {isAdmin ? "Admin" : "Pastor"}
              </span>
            </span>

            <Link
              href="/membros"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#363636] hover:bg-[#CB4B3B] text-[#DCDACF] text-xs font-bold uppercase tracking-wider transition-colors"
              title="Acessar Portal do Membro (membros.igrejadoalto.com)"
            >
              <Users className="w-4 h-4 text-[#CB4B3B]" />
              <span className="hidden sm:inline">Portal do Membro</span>
            </Link>


            

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#363636] hover:bg-[#CB4B3B] text-[#DCDACF] text-xs font-bold uppercase tracking-wider transition-colors"
              title="Encerrar sessão"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="bg-[#1b1b1b] border-t border-[#DCDACF]/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden gap-1 sm:gap-2 py-2">
            {navigationTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-[#CB4B3B] text-[#DCDACF] shadow-md"
                      : "text-[#DCDACF]/75 hover:bg-[#252525] hover:text-[#DCDACF]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {isAdmin && activeTab === "dashboard" && (
          <DashboardTab
            db={db}
            onSelectMemberForHistory={handleSelectMemberForHistory}
            onStartVisitForMember={handleStartVisitForMember}
            onOpenReportModal={(report) => setModalReport(report)}
            onViewAllMembers={handleViewAllMembers}
          />
        )}

        {activeTab === "nova-visita" && (
          <NovaVisitaFormTab
            db={db}
            preselectedMemberId={selectedMemberId}
            preselectedRequestId={preselectedRequestId}
            loggedPastorName={!isAdmin ? currentUser.name : undefined}
            isAdmin={isAdmin}
            onReportCreated={(updatedDb) => {
              setDb(updatedDb);
            }}
            onGoToReportsList={
              isAdmin
                ? () => setActiveTab("relatorios")
                : () => setActiveTab("pessoas")
            }
          />
        )}

        {isAdmin && activeTab === "relatorios" && (
          <RelatoriosListTab
            db={db}
            onOpenReportModal={(report) => setModalReport(report)}
            onSelectMemberForHistory={handleSelectMemberForHistory}
            onGoToNewVisit={() => setActiveTab("nova-visita")}
          />
        )}

        {activeTab === "pessoas" && (
          <VisitasPorPessoaTab
            db={isAdmin ? db : pastorScopedDb}
            selectedMemberId={
              isAdmin
                ? selectedMemberId || db.members[0]?.id || null
                : pastorScopedDb.members.some((m) => m.id === selectedMemberId)
                ? selectedMemberId
                : pastorScopedDb.members[0]?.id || null
            }
            presetFilter={pessoasPresetFilter}
            onSelectMember={(memberId) => setSelectedMemberId(memberId)}
            onStartVisitForMember={handleStartVisitForMember}
            onOpenReportModal={(report) => setModalReport(report)}
            onDbUpdated={(updatedDb) => setDb(updatedDb)}
          />
        )}

        {activeTab === "solicitacoes" && (
          <SolicitacoesQueueTab
            db={db}
            isAdmin={isAdmin}
            loggedPastorName={!isAdmin ? currentUser.name : undefined}
            onRegisterVisitFromRequest={handleRegisterVisitFromRequest}
            onDbUpdated={(updatedDb) => setDb(updatedDb)}
          />
        )}

        {isAdmin && activeTab === "equipe" && (
          <div className="p-8 rounded-3xl bg-white border border-[#252525]/15 text-center space-y-4 max-w-xl mx-auto shadow-sm my-6">
            <ShieldCheck className="w-12 h-12 text-[#CB4B3B] mx-auto" />
            <h3 className="text-xl font-black text-[#252525]">
              Gestão de Pastores & Equipe
            </h3>
            <p className="text-xs sm:text-sm text-[#252525]/75 leading-relaxed">
              A nomeação de pastores e a gestão de permissões administrativas agora é realizada de forma integrada e centralizada no <strong>Portal de Membros</strong>.
            </p>
            <div className="pt-2">
              <Link
                href="/membros"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#CB4B3B] hover:bg-[#A93829] text-white font-black text-xs uppercase tracking-wider shadow transition-colors"
              >
                <span>Acessar Gestão no Portal de Membros</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Native <dialog closedby="any"> Modal for Full Pastoral Visit Report */}
      <LightDismissDialog
        open={Boolean(modalReport)}
        onClose={() => setModalReport(null)}
        title={
          modalReport
            ? `Relatório de Visita: ${modalReport.memberName}`
            : "Relatório de Visita Pastoral"
        }
        subtitle={
          modalReport
            ? `Data: ${formatDateBR(modalReport.visitDate)} • Bairro: ${
                modalReport.neighborhood
              }`
            : undefined
        }
      >
        {modalReport && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#252525]/15">
              <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-[#252525]/80">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-[#CB4B3B]" />
                  {formatDateBR(modalReport.visitDate)}
                </span>
                {modalReport.approxTime && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-4 h-4 text-[#CB4B3B]" />
                    {modalReport.approxTime}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-[#CB4B3B]" />
                  {modalReport.neighborhood}
                </span>
              </div>

              {modalReport.situation && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                    SITUATION_META[modalReport.situation].badgeClass
                  }`}
                >
                  {SITUATION_META[modalReport.situation].emoji}{" "}
                  {SITUATION_META[modalReport.situation].label}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-white border border-[#252525]/15">
                <div className="font-black uppercase text-[#252525]/60 mb-1">
                  Quem realizou a visita
                </div>
                <div className="font-bold text-sm">
                  {(modalReport.visitors || []).join(", ")}
                </div>
                {modalReport.othersPresent && (
                  <div className="mt-1 text-[#252525]/75">
                    Presentes: {modalReport.othersPresent}
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-[#252525]/15">
                <div className="font-black uppercase text-[#252525]/60 mb-1">
                  Vida na Igreja
                </div>
                <div>
                  <strong>Cultos:</strong>{" "}
                  {modalReport.serviceAttendance || "—"}
                </div>
                <div>
                  <strong>Integrado(a):</strong>{" "}
                  {modalReport.integration || "—"}
                </div>
                <div>
                  <strong>Casa do Alto:</strong>{" "}
                  {modalReport.inCasaDoAlto || "—"} •{" "}
                  <strong>Ministério:</strong> {modalReport.inMinistry || "—"}
                </div>
              </div>
            </div>

            {modalReport.summary && (
              <div className="p-4 rounded-2xl bg-white border-2 border-[#252525]/15">
                <div className="text-xs font-black uppercase tracking-wider text-[#252525] mb-1.5">
                  Como Foi a Visita ({modalReport.mainReason || "Relato"})
                </div>
                <p className="text-sm text-[#252525] leading-relaxed font-medium">
                  {modalReport.summary}
                </p>
              </div>
            )}

            {modalReport.photoUrl && (
              <div className="p-4 rounded-2xl bg-white border-2 border-[#252525]/15 space-y-2">
                <div className="text-xs font-black uppercase tracking-wider text-[#CB4B3B]">
                  Registro Fotográfico da Visita
                </div>
                <div className="rounded-xl overflow-hidden border border-[#252525]/15 bg-[#252525]/5 flex justify-center">
                  <img
                    src={modalReport.photoUrl}
                    alt={`Foto da visita a ${modalReport.memberName}`}
                    className="max-h-96 w-auto max-w-full object-contain"
                  />
                </div>
              </div>
            )}

            {modalReport.prayerRequest && (
              <div className="p-4 rounded-2xl bg-[#DCDACF] border-l-4 border-[#CB4B3B]">
                <div className="text-xs font-black uppercase tracking-wider text-[#CB4B3B] mb-1">
                  Pedido de Oração Identificado
                </div>
                <p className="text-sm text-[#252525] font-semibold">
                  {modalReport.prayerRequest}
                </p>
              </div>
            )}

            {(modalReport.followUpNeeds || []).length > 0 && (
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-[#252525]/60 mb-1.5">
                  Necessidades de Acompanhamento Identificadas
                </div>
                <div className="flex flex-wrap gap-2">
                  {modalReport.followUpNeeds.map((need) => (
                    <span
                      key={need}
                      className="px-3 py-1 rounded-lg bg-[#CB4B3B]/15 text-[#CB4B3B] border border-[#CB4B3B]/30 text-xs font-black"
                    >
                      {need}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {modalReport.leadershipNote && (
              <div className="p-4 rounded-2xl bg-[#F9EAE8] border-2 border-[#CB4B3B]">
                <div className="text-xs font-black uppercase tracking-wider text-[#CB4B3B] mb-1">
                  Comunicação à Liderança Pastoral (
                  {modalReport.leadershipCommunication})
                </div>
                <p className="text-sm font-bold text-[#252525]">
                  {modalReport.leadershipNote}
                </p>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-[#252525] text-[#DCDACF] space-y-1.5 text-xs">
              <div className="text-[11px] font-black uppercase tracking-widest text-[#CB4B3B]">
                Próximos Passos Definidos
              </div>
              <div className="text-sm font-bold">
                {modalReport.nextStep || "—"}
              </div>
              <div>
                <strong>Precisa de nova visita?</strong>{" "}
                {modalReport.needsNewVisit || "Não"}
                {modalReport.newVisitTimeframe
                  ? ` (${modalReport.newVisitTimeframe})`
                  : ""}
              </div>
              {modalReport.followUpResponsible && (
                <div>
                  <strong>Responsável pelo acompanhamento:</strong>{" "}
                  {modalReport.followUpResponsible}
                </div>
              )}
              {modalReport.internalNotes && (
                <div className="pt-2 border-t border-[#DCDACF]/15 text-[#DCDACF]/85">
                  <strong>Observações internas:</strong>{" "}
                  {modalReport.internalNotes}
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  const mId = modalReport.memberId;
                  setModalReport(null);
                  handleSelectMemberForHistory(mId);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#CB4B3B] hover:underline"
              >
                Abrir Prontuário de {modalReport.memberName}
                <ArrowUpRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setModalReport(null)}
                className="px-5 py-2.5 rounded-xl bg-[#252525] text-[#DCDACF] text-xs font-extrabold uppercase tracking-wider"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </LightDismissDialog>
    </div>
  );
}
