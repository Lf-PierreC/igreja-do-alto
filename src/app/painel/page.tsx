"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { INITIAL_DATA } from "@/data/initialData";
import {
  DatabaseSchema,
  VisitReport,
  VisitRequest,
} from "@/types/visitas";
import { formatDateBR, SITUATION_META } from "@/lib/visitasUtils";
import { LightDismissDialog } from "@/components/LightDismissDialog";
import {
  DashboardTab,
  PessoasPresetFilter,
} from "@/components/painel/DashboardTab";
import { NovaVisitaFormTab } from "@/components/painel/NovaVisitaFormTab";
import { RelatoriosListTab } from "@/components/painel/RelatoriosListTab";
import { VisitasPorPessoaTab } from "@/components/painel/VisitasPorPessoaTab";
import { SolicitacoesQueueTab } from "@/components/painel/SolicitacoesQueueTab";
import {
  BarChart3,
  ClipboardCheck,
  FileText,
  Users,
  ClipboardList,
  HeartHandshake,
  Calendar,
  MapPin,
  Clock,
  ArrowUpRight,
  ArrowLeft,
  Lock,
  LogOut,
  AlertCircle,
} from "lucide-react";

type ActiveTab =
  | "dashboard"
  | "nova-visita"
  | "relatorios"
  | "pessoas"
  | "solicitacoes";

const ADMIN_STORAGE_KEY = "igreja_alto_admin_auth";
const EXPECTED_ADMIN_USER =
  process.env.NEXT_PUBLIC_ADMIN_USER?.trim() || "admin";
const EXPECTED_ADMIN_PASS =
  process.env.NEXT_PUBLIC_ADMIN_PASS?.trim() || "igrejadoalto";

export default function PainelLideresPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [loginUser, setLoginUser] = useState<string>("");
  const [loginPass, setLoginPass] = useState<string>("");
  const [loginError, setLoginError] = useState<string | null>(null);

  const [db, setDb] = useState<DatabaseSchema>(INITIAL_DATA);
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(
    INITIAL_DATA.members[0]?.id || null
  );
  const [pessoasPresetFilter, setPessoasPresetFilter] =
    useState<PessoasPresetFilter>("TODOS");
  const [preselectedRequestId, setPreselectedRequestId] = useState<
    string | null
  >(null);
  const [modalReport, setModalReport] = useState<VisitReport | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(ADMIN_STORAGE_KEY);
      if (saved === "authenticated") {
        setIsAuthenticated(true);
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

  const handleAdminLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError(null);

    if (
      loginUser.trim().toLowerCase() === EXPECTED_ADMIN_USER.toLowerCase() &&
      loginPass === EXPECTED_ADMIN_PASS
    ) {
      setIsAuthenticated(true);
      try {
        window.localStorage.setItem(ADMIN_STORAGE_KEY, "authenticated");
      } catch {
        // ignore
      }
    } else {
      setLoginError("Usuário ou senha inválidos. Verifique suas credenciais.");
    }
  };

  const handleAdminLogout = () => {
    setIsAuthenticated(false);
    setLoginPass("");
    try {
      window.localStorage.removeItem(ADMIN_STORAGE_KEY);
    } catch {
      // ignore
    }
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

  const openRequestsCount = db.requests.filter(
    (r) => r.status === "pendente" || r.status === "agendada"
  ).length;

  if (!authChecked) {
    return <div className="min-h-screen bg-[#DCDACF]" />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-[#DCDACF] text-[#252525]">
        <header className="bg-[#252525] text-[#DCDACF] border-b-4 border-[#CB4B3B]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
            <Link href="/" aria-label="Voltar para a página inicial">
              <BrandLogo variant="on-dark2" size="sm" showTagline />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#363636] hover:bg-[#CB4B3B] text-[#DCDACF] text-xs font-bold uppercase tracking-wider transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Início
            </Link>
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
                  Acesso Restrito
                </span>
                <h1 className="text-lg sm:text-xl font-black uppercase tracking-tight">
                  Administração Pastoral
                </h1>
              </div>
            </div>

            <form onSubmit={handleAdminLogin} className="p-6 sm:p-8 space-y-5">
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
                  htmlFor="admin-user"
                  className="block text-xs font-extrabold uppercase tracking-wider text-[#252525] mb-1.5"
                >
                  Usuário Administrador
                </label>
                <input
                  id="admin-user"
                  type="text"
                  required
                  autoComplete="username"
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  placeholder="Digite o usuário"
                  className="w-full rounded-xl border-2 border-[#252525]/25 bg-white px-4 py-3 text-sm font-semibold text-[#252525]"
                />
              </div>

              <div>
                <label
                  htmlFor="admin-pass"
                  className="block text-xs font-extrabold uppercase tracking-wider text-[#252525] mb-1.5"
                >
                  Senha de Acesso
                </label>
                <input
                  id="admin-pass"
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
                Entrar no Painel Completo
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#DCDACF] text-[#252525]">
      {/* Top Navigation Header */}
      <header className="bg-[#252525] text-[#DCDACF] border-b-4 border-[#CB4B3B] sticky top-0 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            aria-label="Ir para a página inicial da Igreja do Alto"
          >
            <BrandLogo variant="on-dark2" size="sm" showTagline />
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#363636] hover:bg-[#CB4B3B] text-[#DCDACF] text-xs font-bold uppercase tracking-wider transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Início
            </Link>
            <button
              type="button"
              onClick={handleAdminLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#363636] hover:bg-[#CB4B3B] text-[#DCDACF] text-xs font-bold uppercase tracking-wider transition-colors"
              title="Encerrar sessão administrativa"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="bg-[#1b1b1b] border-t border-[#DCDACF]/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden gap-1 sm:gap-2 py-2">
            {(
              [
                {
                  id: "dashboard",
                  label: "Dashboard & Indicadores",
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
              ] as const
            ).map((tab) => {
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
        {activeTab === "dashboard" && (
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
            onReportCreated={(updatedDb) => {
              setDb(updatedDb);
            }}
            onGoToReportsList={() => setActiveTab("relatorios")}
          />
        )}

        {activeTab === "relatorios" && (
          <RelatoriosListTab
            db={db}
            onOpenReportModal={(report) => setModalReport(report)}
            onSelectMemberForHistory={handleSelectMemberForHistory}
            onGoToNewVisit={() => setActiveTab("nova-visita")}
          />
        )}

        {activeTab === "pessoas" && (
          <VisitasPorPessoaTab
            db={db}
            selectedMemberId={selectedMemberId}
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
            onRegisterVisitFromRequest={handleRegisterVisitFromRequest}
            onDbUpdated={(updatedDb) => setDb(updatedDb)}
          />
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
