"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { BrandLogo, MountainIcon } from "@/components/BrandLogo";
import {
  FirstTimeVisitor,
  VisitorStatus,
  VISITOR_STATUSES,
  HOW_HEARD_OPTIONS,
  HowHeardChannel,
  BemVindosAccessRequest,
  BemVindosTeamMember,
  VisitorNote,
} from "@/types/bemVindos";
import {
  Heart,
  Users,
  Search,
  Filter,
  Calendar,
  MessageCircle,
  Phone,
  UserPlus,
  BarChart3,
  Shield,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  LogOut,
  Sparkles,
  QrCode,
  Copy,
  Check,
  X,
  FileText,
  AlertCircle,
  ChevronDown,
  UserCheck,
  UserX,
  Send,
  ExternalLink,
  MessageSquare,
  Lock,
} from "lucide-react";

interface BemVindosSession {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  isPastor?: boolean;
  isAdmin?: boolean;
  teamRole?: string;
  ministries?: string[];
}

export default function BemVindosPortalPage() {
  // Estado de Autenticação
  const [session, setSession] = useState<BemVindosSession | null>(null);
  const [isPastorOrAdmin, setIsPastorOrAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Formulário de Login
  const [loginInput, setLoginInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  // Estado de Solicitação de Acesso (quando membro elegível não aprovado ainda)
  const [accessPendingState, setAccessPendingState] = useState<{
    needed: boolean;
    canRequest: boolean;
    status: string;
    message: string;
    sessionCandidate: BemVindosSession | null;
  } | null>(null);
  const [requestAccessLoading, setRequestAccessLoading] = useState(false);
  const [requestAccessSuccess, setRequestAccessSuccess] = useState(false);

  // Aba ativa: 'visitantes' | 'cadastrar' | 'metricas' | 'acessos'
  const [activeTab, setActiveTab] = useState<"visitantes" | "cadastrar" | "metricas" | "acessos">(
    "visitantes"
  );

  // Dados da plataforma
  const [visitors, setVisitors] = useState<FirstTimeVisitor[]>([]);
  const [accessRequests, setAccessRequests] = useState<BemVindosAccessRequest[]>([]);
  const [team, setTeam] = useState<BemVindosTeamMember[]>([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [metrics, setMetrics] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(false);

  // Filtros de Visitantes
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [filterChannel, setFilterChannel] = useState<string>("todos");
  const [filterDatePreset, setFilterDatePreset] = useState<string>("todos");
  const [filterCustomFrom, setFilterCustomFrom] = useState("");
  const [filterCustomTo, setFilterCustomTo] = useState("");

  // Modal de Histórico e Anotações
  const [selectedVisitorForNotes, setSelectedVisitorForNotes] = useState<FirstTimeVisitor | null>(
    null
  );
  const [newNoteText, setNewNoteText] = useState("");
  const [addingNoteLoading, setAddingNoteLoading] = useState(false);

  // Modal / Confirmação de Envio de WhatsApp
  const [whatsappModalVisitor, setWhatsappModalVisitor] = useState<FirstTimeVisitor | null>(null);
  const [whatsappTemplate, setWhatsappTemplate] = useState<"boas_vindas" | "culto_proximo" | "celula">(
    "boas_vindas"
  );

  // Formulário Interno de Cadastro de Visitante
  const [newVisFullName, setNewVisFullName] = useState("");
  const [newVisPhone, setNewVisPhone] = useState("");
  const [newVisHowHeard, setNewVisHowHeard] = useState<HowHeardChannel>("Instagram");
  const [newVisHowHeardDetail, setNewVisHowHeardDetail] = useState("");
  const [newVisDate, setNewVisDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [newVisServicePeriod, setNewVisServicePeriod] = useState("Domingo Noite (18h)");
  const [newVisNeighborhood, setNewVisNeighborhood] = useState("");
  const [newVisCity, setNewVisCity] = useState("Mogi das Cruzes");
  const [newVisPrayerRequest, setNewVisPrayerRequest] = useState("");
  const [newVisInitialNote, setNewVisInitialNote] = useState("");
  const [newVisSubmitting, setNewVisSubmitting] = useState(false);
  const [newVisSuccess, setNewVisSuccess] = useState(false);

  // Link copiado feedback
  const [copiedLink, setCopiedLink] = useState(false);

  // Recupera sessão salva no localStorage ao iniciar
  useEffect(() => {
    try {
      const stored = localStorage.getItem("igreja_do_alto_bem_vindos_session");
      if (stored) {
        const parsed = JSON.parse(stored);
        setSession(parsed);
        setIsPastorOrAdmin(Boolean(parsed.isPastor || parsed.isAdmin));
      }
    } catch {
      // ignore
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // Busca dados sempre que houver sessão ativa
  const loadPlatformData = async () => {
    if (!session) return;
    setDataLoading(true);
    try {
      const res = await fetch(`/api/bem-vindos?requesterId=${encodeURIComponent(session.id)}`);
      const data = await res.json();
      if (data.ok) {
        setVisitors(data.visitors || []);
        setMetrics(data.metrics || null);
        setPendingRequestsCount(data.pendingRequestsCount || 0);
        if (data.accessRequests) setAccessRequests(data.accessRequests);
        if (data.team) setTeam(data.team);
        if (typeof data.isPastorOrAdmin === "boolean") {
          setIsPastorOrAdmin(data.isPastorOrAdmin);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      loadPlatformData();
    }
  }, [session]);

  // Ação de Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setAccessPendingState(null);
    setLoginSubmitting(true);

    try {
      const res = await fetch("/api/bem-vindos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "BEM_VINDOS_LOGIN",
          payload: { login: loginInput.trim(), password: passwordInput.trim() },
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        if (data.errorType === "NOT_ELIGIBLE_MINISTRY") {
          setLoginError(data.message);
          return;
        }
        throw new Error(data.error || "Falha no login. Verifique seus dados.");
      }

      // Caso 1: Usuário é pastor/admin ou membro já aprovado
      if (data.hasAccess) {
        setSession(data.session);
        setIsPastorOrAdmin(Boolean(data.isPastorOrAdmin));
        localStorage.setItem("igreja_do_alto_bem_vindos_session", JSON.stringify(data.session));
        return;
      }

      // Caso 2: Membro dos ministérios autorizados aguardando aprovação ou precisa solicitar
      if (data.needsApproval) {
        setAccessPendingState({
          needed: true,
          canRequest: Boolean(data.canRequest),
          status: data.status,
          message: data.message,
          sessionCandidate: data.session,
        });
      }
    } catch (err: any) {
      setLoginError(err.message || "Erro de conexão ao autenticar.");
    } finally {
      setLoginSubmitting(false);
    }
  };

  // Solicitar Liberação de Acesso
  const handleRequestAccess = async () => {
    if (!accessPendingState?.sessionCandidate) return;
    setRequestAccessLoading(true);
    try {
      const res = await fetch("/api/bem-vindos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REQUEST_ACCESS",
          payload: { memberId: accessPendingState.sessionCandidate.id },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Falha ao enviar solicitação.");
      }
      setRequestAccessSuccess(true);
      setAccessPendingState((prev) =>
        prev
          ? {
              ...prev,
              status: "pendente",
              canRequest: false,
              message: "Sua solicitação foi enviada! A liderança pastoral notificará você assim que liberar seu acesso.",
            }
          : null
      );
    } catch (err: any) {
      alert(err.message || "Erro ao solicitar acesso.");
    } finally {
      setRequestAccessLoading(false);
    }
  };

  // Logout
  const handleLogout = () => {
    setSession(null);
    setIsPastorOrAdmin(false);
    setAccessPendingState(null);
    localStorage.removeItem("igreja_do_alto_bem_vindos_session");
  };

  // Alterar Status de um Visitante
  const handleUpdateStatus = async (visitorId: string, newStatus: VisitorStatus) => {
    try {
      const res = await fetch("/api/bem-vindos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_VISITOR_STATUS",
          payload: {
            visitorId,
            newStatus,
            authorMemberId: session?.id,
            authorMemberName: session?.name,
          },
        }),
      });
      const data = await res.json();
      if (data.ok && data.visitor) {
        setVisitors((prev) =>
          prev.map((v) => (v.id === visitorId ? data.visitor : v))
        );
        if (selectedVisitorForNotes?.id === visitorId) {
          setSelectedVisitorForNotes(data.visitor);
        }
      }
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
    }
  };

  // Adicionar Anotação no Histórico
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisitorForNotes || !newNoteText.trim()) return;

    setAddingNoteLoading(true);
    try {
      const res = await fetch("/api/bem-vindos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_VISITOR_NOTE",
          payload: {
            visitorId: selectedVisitorForNotes.id,
            noteText: newNoteText.trim(),
            authorMemberId: session?.id,
            authorMemberName: session?.name || "Equipe Bem-Vindos",
            actionTag: "ANOTACAO",
          },
        }),
      });
      const data = await res.json();
      if (data.ok && data.visitor) {
        setVisitors((prev) =>
          prev.map((v) => (v.id === selectedVisitorForNotes.id ? data.visitor : v))
        );
        setSelectedVisitorForNotes(data.visitor);
        setNewNoteText("");
      }
    } catch (err) {
      alert("Erro ao adicionar anotação.");
    } finally {
      setAddingNoteLoading(false);
    }
  };

  // Enviar Mensagem de WhatsApp
  const handleOpenWhatsApp = (visitor: FirstTimeVisitor) => {
    const rawPhone = visitor.phone.replace(/\D/g, "");
    const formattedPhone = rawPhone.startsWith("55") ? rawPhone : `55${rawPhone}`;
    const firstName = visitor.fullName.split(" ")[0];
    const volunteerFirstName = session?.name ? session.name.split(" ")[0] : "da equipe";

    let msg = "";
    if (whatsappTemplate === "boas_vindas") {
      msg = `Olá ${firstName}, graça e paz! Aqui é ${volunteerFirstName}, da equipe de Bem-Vindos da Igreja do Alto! 🕊️\n\nFoi uma imensa alegria ter você conosco em nosso culto! Esperamos que seu coração tenha sido grandemente abençoado.\n\nComo foi a sua experiência? Caso precise de oração ou queira tirar qualquer dúvida sobre a nossa igreja, estamos aqui de coração aberto! Deus te abençoe grandemente!`;
    } else if (whatsappTemplate === "culto_proximo") {
      msg = `Olá ${firstName}, tudo bem? Aqui é ${volunteerFirstName}, da Igreja do Alto! Passando para te desejar uma semana de paz e já te convidar para estar conosco no próximo domingo! Nossos cultos acontecem às 10h e às 18h. Teremos um lugar especial reservado para você! Esperamos você! 🙌`;
    } else {
      msg = `Olá ${firstName}! Lembra que conversamos na Igreja do Alto? Gostaria muito de te convidar para conhecer a nossa Casa do Alto (pequeno grupo de comunhão e oração) que acontece perto de onde você mora! É um momento muito gostoso de amizade e aprendizado da Palavra. Posso te passar os detalhes? Abraços! 🏠`;
    }

    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`;
    window.open(whatsappUrl, "_blank");

    // Registra automaticamente que a mensagem foi enviada e sugere mudar status
    handleUpdateStatus(visitor.id, "mensagem_enviada");
    setWhatsappModalVisitor(null);
  };

  // Cadastro Interno por Voluntário
  const handleInternalRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVisFullName.trim() || !newVisPhone.trim()) return;

    setNewVisSubmitting(true);
    try {
      const res = await fetch("/api/bem-vindos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "INTERNAL_VISITOR_REGISTER",
          payload: {
            fullName: newVisFullName.trim(),
            phone: newVisPhone.trim(),
            howHeard: newVisHowHeard,
            howHeardDetail: newVisHowHeardDetail.trim() || undefined,
            visitDate: newVisDate,
            servicePeriod: newVisServicePeriod,
            neighborhood: newVisNeighborhood.trim() || undefined,
            city: newVisCity.trim() || undefined,
            prayerRequest: newVisPrayerRequest.trim() || undefined,
            initialNote: newVisInitialNote.trim() || undefined,
            registeredByMemberId: session?.id,
            registeredByMemberName: session?.name,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Erro ao cadastrar visitante.");
      }

      setNewVisSuccess(true);
      setVisitors((prev) => [data.visitor, ...prev]);

      // Limpa formulário
      setNewVisFullName("");
      setNewVisPhone("");
      setNewVisHowHeardDetail("");
      setNewVisNeighborhood("");
      setNewVisPrayerRequest("");
      setNewVisInitialNote("");

      setTimeout(() => setNewVisSuccess(false), 4000);
    } catch (err: any) {
      alert(err.message || "Erro ao cadastrar visitante.");
    } finally {
      setNewVisSubmitting(false);
    }
  };

  // Avaliação de Solicitação de Acesso (Pastores)
  const handleReviewRequest = async (
    requestId: string,
    decision: "aprovado" | "recusado",
    role: "voluntario" | "lider" = "voluntario"
  ) => {
    try {
      const res = await fetch("/api/bem-vindos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REVIEW_ACCESS_REQUEST",
          payload: {
            requestId,
            decision,
            role,
            reviewerName: session?.name || "Pastor",
            reviewerId: session?.id,
          },
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setAccessRequests((prev) =>
          prev.map((r) => (r.id === requestId ? data.request : r))
        );
        if (data.team) setTeam(data.team);
        setPendingRequestsCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      alert("Erro ao avaliar solicitação.");
    }
  };

  // Revogação de Acesso (Pastores)
  const handleRevokeAccess = async (memberId: string) => {
    if (!confirm("Tem certeza que deseja revogar o acesso deste membro à plataforma?")) return;
    try {
      const res = await fetch("/api/bem-vindos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REVOKE_ACCESS",
          payload: { memberId, reviewerName: session?.name || "Pastor" },
        }),
      });
      const data = await res.json();
      if (data.ok && data.team) {
        setTeam(data.team);
      }
    } catch (err) {
      alert("Erro ao revogar acesso.");
    }
  };

  // Formatação de telefone no formulário de cadastro interno
  const handleNewVisPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, "");
    if (raw.length > 11) raw = raw.slice(0, 11);
    if (raw.length <= 2) setNewVisPhone(raw ? `(${raw}` : "");
    else if (raw.length <= 6) setNewVisPhone(`(${raw.slice(0, 2)}) ${raw.slice(2)}`);
    else if (raw.length <= 10)
      setNewVisPhone(`(${raw.slice(0, 2)}) ${raw.slice(2, 6)}-${raw.slice(6)}`);
    else
      setNewVisPhone(`(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7, 11)}`);
  };

  // Copiar link público
  const copyPublicLink = () => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/bem-vindos/cadastro` : "";
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Lista filtrada de visitantes
  const filteredVisitors = useMemo(() => {
    return visitors.filter((v) => {
      // Filtro de busca textual
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchesName = v.fullName.toLowerCase().includes(query);
        const matchesPhone = v.phone.replace(/\D/g, "").includes(query.replace(/\D/g, ""));
        const matchesBairro = v.neighborhood?.toLowerCase().includes(query) || false;
        const matchesDetail = v.howHeardDetail?.toLowerCase().includes(query) || false;
        if (!matchesName && !matchesPhone && !matchesBairro && !matchesDetail) {
          return false;
        }
      }

      // Filtro de status
      if (filterStatus !== "todos" && v.status !== filterStatus) {
        return false;
      }

      // Filtro de canal
      if (filterChannel !== "todos" && v.howHeard !== filterChannel) {
        return false;
      }

      // Filtro de data
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];

      if (filterDatePreset === "hoje") {
        if (v.visitDate !== todayStr) return false;
      } else if (filterDatePreset === "ultimos_7") {
        const d7 = new Date();
        d7.setDate(now.getDate() - 7);
        if (v.visitDate < d7.toISOString().split("T")[0]) return false;
      } else if (filterDatePreset === "ultimos_30") {
        const d30 = new Date();
        d30.setDate(now.getDate() - 30);
        if (v.visitDate < d30.toISOString().split("T")[0]) return false;
      } else if (filterDatePreset === "personalizado") {
        if (filterCustomFrom && v.visitDate < filterCustomFrom) return false;
        if (filterCustomTo && v.visitDate > filterCustomTo) return false;
      }

      return true;
    });
  }, [
    visitors,
    searchTerm,
    filterStatus,
    filterChannel,
    filterDatePreset,
    filterCustomFrom,
    filterCustomTo,
  ]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#DCDACF] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#CB4B3B]/30 border-t-[#CB4B3B] rounded-full animate-spin" />
      </div>
    );
  }

  // ============================================================================
  // TELA DE LOGIN & SOLICITAÇÃO DE ACESSO
  // ============================================================================
  if (!session) {
    return (
      <main className="min-h-screen bg-[#DCDACF] text-[#252525] flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-stone-200 p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="inline-block mb-3">
              <BrandLogo variant="on-sand" size="sm" showTagline={false} />
            </div>
            <div className="inline-flex items-center gap-1.5 bg-[#CB4B3B] text-white px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-2">
              <Heart className="w-3 h-3 fill-white" />
              Ministério Bem-Vindos
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#252525]">
              Portal da Equipe
            </h1>
            <p className="text-stone-600 text-xs mt-1">
              Acesso exclusivo para voluntários e liderança pastoral
            </p>
          </div>

          {/* Estado especial: membro elegível mas aguardando liberação pastoral */}
          {accessPendingState && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 animate-fade-in">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-2">
                  <p className="font-bold text-sm text-amber-950">
                    Olá, {accessPendingState.sessionCandidate?.name}!
                  </p>
                  <p className="leading-relaxed">{accessPendingState.message}</p>

                  {accessPendingState.canRequest && !requestAccessSuccess && (
                    <button
                      type="button"
                      onClick={handleRequestAccess}
                      disabled={requestAccessLoading}
                      className="mt-2 w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow transition flex items-center justify-center gap-2"
                    >
                      {requestAccessLoading ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Enviando Solicitação...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Solicitar Acesso à Liderança Pastoral</span>
                        </>
                      )}
                    </button>
                  )}

                  {requestAccessSuccess && (
                    <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>Solicitação enviada com sucesso!</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {loginError && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{loginError}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                CPF, E-mail ou Usuário de Pastor
              </label>
              <input
                type="text"
                required
                placeholder="Digite seu CPF ou E-mail cadastrado"
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                className="w-full px-4 py-3 bg-[#F7F6F2] border border-stone-300 rounded-xl text-stone-900 text-sm focus:bg-white focus:border-[#CB4B3B] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                Senha
              </label>
              <input
                type="password"
                required
                placeholder="Sua senha do Portal do Membro"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-4 py-3 bg-[#F7F6F2] border border-stone-300 rounded-xl text-stone-900 text-sm focus:bg-white focus:border-[#CB4B3B] outline-none"
              />
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-[11px] text-stone-600 space-y-1">
              <div className="font-semibold text-stone-800 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#CB4B3B]" />
                Regras de Acesso:
              </div>
              <p>
                Permitido para membros vinculados aos ministérios: <strong>Bem-Vindos</strong>,{" "}
                <strong>A Mais</strong>, <strong>Evangelismo</strong> ou <strong>Pastores</strong>.
              </p>
            </div>

            <button
              type="submit"
              disabled={loginSubmitting}
              className="w-full py-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm shadow transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loginSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verificando permissões...
                </>
              ) : (
                <>
                  <span>Entrar no Painel</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-stone-100 text-center space-y-2">
            <Link
              href="/bem-vindos/cadastro"
              className="text-xs text-[#CB4B3B] font-bold hover:underline inline-flex items-center gap-1"
            >
              <span>Ir para o Formulário Público de Visitantes</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ============================================================================
  // DASHBOARD PRINCIPAL DA PLATAFORMA BEM-VINDOS
  // ============================================================================
  return (
    <main className="min-h-screen bg-[#DCDACF] text-[#252525] flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30 px-4 sm:px-8 py-3.5 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BrandLogo variant="on-sand" size="sm" showTagline={false} />
            <div className="h-6 w-px bg-stone-300 hidden sm:block" />
            <div className="inline-flex items-center gap-1.5 bg-[#CB4B3B]/10 text-[#CB4B3B] px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">
              <Heart className="w-3.5 h-3.5 fill-[#CB4B3B]" />
              Painel Bem-Vindos
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="text-right hidden sm:block">
              <p className="font-extrabold text-stone-900 leading-tight">{session.name}</p>
              <p className="text-stone-500 text-[11px]">
                {isPastorOrAdmin
                  ? "Liderança Pastoral / Admin"
                  : session.teamRole === "lider"
                  ? "Líder de Equipe"
                  : "Voluntário(a) Aprovado(a)"}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-red-50 hover:text-red-700 text-stone-700 font-bold transition"
              title="Sair do painel"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sub Header com Navegação em Abas */}
      <nav className="bg-[#EAE8DD] border-b border-stone-300 px-4 sm:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab("visitantes")}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                activeTab === "visitantes"
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-600 hover:bg-white/60"
              }`}
            >
              <Users className="w-4 h-4 text-[#CB4B3B]" />
              <span>Visitantes ({visitors.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("cadastrar")}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                activeTab === "cadastrar"
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-600 hover:bg-white/60"
              }`}
            >
              <UserPlus className="w-4 h-4 text-emerald-600" />
              <span>Cadastrar no Balcão</span>
            </button>

            <button
              onClick={() => setActiveTab("metricas")}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                activeTab === "metricas"
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-600 hover:bg-white/60"
              }`}
            >
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span>Métricas & Canais</span>
            </button>

            {/* ABA EXCLUSIVA DE PASTORES E ADMINS */}
            {isPastorOrAdmin && (
              <button
                onClick={() => setActiveTab("acessos")}
                className={`relative px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                  activeTab === "acessos"
                    ? "bg-stone-900 text-white shadow-sm"
                    : "text-stone-700 hover:bg-white/60"
                }`}
              >
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Gestão de Acessos</span>
                {pendingRequestsCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black animate-pulse">
                    {pendingRequestsCount}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Botão de Atalho para Copiar Link de Visitantes */}
          <button
            onClick={copyPublicLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-stone-300 text-stone-800 text-xs font-bold hover:bg-stone-50 transition shadow-sm"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Link Copiado!</span>
              </>
            ) : (
              <>
                <QrCode className="w-3.5 h-3.5 text-[#CB4B3B]" />
                <span>Link p/ QR Code</span>
              </>
            )}
          </button>
        </div>
      </nav>

      {/* Conteúdo Principal */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* =========================================================================
            ABA 1: LISTA & GESTÃO DE VISITANTES
           ========================================================================= */}
        {activeTab === "visitantes" && (
          <div className="space-y-6 animate-fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-sm">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                  Total de Visitantes
                </span>
                <span className="text-2xl sm:text-3xl font-black text-stone-900 mt-1 block">
                  {visitors.length}
                </span>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200 shadow-sm bg-gradient-to-br from-amber-50/40 to-white">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Aguardando Contato
                </span>
                <span className="text-2xl sm:text-3xl font-black text-amber-900 mt-1 block">
                  {visitors.filter((v) => v.status === "novo").length}
                </span>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-purple-200 shadow-sm bg-gradient-to-br from-purple-50/40 to-white">
                <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider block">
                  Em Conversa / Célula
                </span>
                <span className="text-2xl sm:text-3xl font-black text-purple-900 mt-1 block">
                  {visitors.filter((v) => ["em_conversa", "convidado_celula"].includes(v.status)).length}
                </span>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-200 shadow-sm bg-gradient-to-br from-emerald-50/40 to-white">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Integrados / Assíduos
                </span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-900 mt-1 block">
                  {visitors.filter((v) => v.status === "integrado").length}
                </span>
              </div>
            </div>

            {/* Barra de Filtros */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Campo de Busca */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, WhatsApp, bairro ou indicação..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#F7F6F2] border border-stone-200 rounded-xl text-stone-900 text-sm focus:bg-white focus:border-[#CB4B3B] outline-none"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Filtro de Status */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3.5 py-2.5 bg-[#F7F6F2] border border-stone-200 rounded-xl text-stone-900 text-xs sm:text-sm font-semibold focus:bg-white focus:border-[#CB4B3B] outline-none"
                >
                  <option value="todos">Todos os Status</option>
                  {VISITOR_STATUSES.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.label}
                    </option>
                  ))}
                </select>

                {/* Filtro de Canal de Origem */}
                <select
                  value={filterChannel}
                  onChange={(e) => setFilterChannel(e.target.value)}
                  className="px-3.5 py-2.5 bg-[#F7F6F2] border border-stone-200 rounded-xl text-stone-900 text-xs sm:text-sm font-semibold focus:bg-white focus:border-[#CB4B3B] outline-none"
                >
                  <option value="todos">Todos os Canais</option>
                  {HOW_HEARD_OPTIONS.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.label}
                    </option>
                  ))}
                </select>

                {/* Filtro de Período */}
                <select
                  value={filterDatePreset}
                  onChange={(e) => setFilterDatePreset(e.target.value)}
                  className="px-3.5 py-2.5 bg-[#F7F6F2] border border-stone-200 rounded-xl text-stone-900 text-xs sm:text-sm font-semibold focus:bg-white focus:border-[#CB4B3B] outline-none"
                >
                  <option value="todos">Todas as Datas</option>
                  <option value="hoje">Hoje</option>
                  <option value="ultimos_7">Últimos 7 dias</option>
                  <option value="ultimos_30">Últimos 30 dias</option>
                  <option value="personalizado">Data Personalizada</option>
                </select>
              </div>

              {/* Data personalizada se selecionada */}
              {filterDatePreset === "personalizado" && (
                <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center gap-3 text-xs">
                  <span className="font-bold text-stone-600">Intervalo:</span>
                  <div className="flex items-center gap-2">
                    <span>De:</span>
                    <input
                      type="date"
                      value={filterCustomFrom}
                      onChange={(e) => setFilterCustomFrom(e.target.value)}
                      className="px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Até:</span>
                    <input
                      type="date"
                      value={filterCustomTo}
                      onChange={(e) => setFilterCustomTo(e.target.value)}
                      className="px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Lista de Visitantes */}
            {filteredVisitors.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 shadow-sm">
                <Users className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-stone-800">
                  Nenhum visitante encontrado
                </h3>
                <p className="text-stone-500 text-xs mt-1">
                  Tente alterar os termos de busca ou filtros aplicados.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {filteredVisitors.map((v) => {
                  const statusMeta =
                    VISITOR_STATUSES.find((s) => s.id === v.status) || VISITOR_STATUSES[0];
                  return (
                    <div
                      key={v.id}
                      className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-sm hover:shadow-md transition flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                    >
                      {/* Dados Básicos */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h3 className="font-black text-base text-stone-900 tracking-tight">
                            {v.fullName}
                          </h3>

                          {/* Seletor Rápido de Status */}
                          <div className="relative inline-block">
                            <select
                              value={v.status}
                              onChange={(e) =>
                                handleUpdateStatus(v.id, e.target.value as VisitorStatus)
                              }
                              className={`text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full border cursor-pointer outline-none transition appearance-none pr-6 ${statusMeta.badgeBg} ${statusMeta.badgeText}`}
                            >
                              {VISITOR_STATUSES.map((st) => (
                                <option key={st.id} value={st.id}>
                                  {st.label}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                          </div>
                        </div>

                        {/* Metadados: Telefone, Origem, Data, Bairro */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600">
                          <span className="flex items-center gap-1 font-semibold text-stone-800">
                            <Phone className="w-3.5 h-3.5 text-[#CB4B3B]" />
                            {v.phone}
                          </span>

                          <span className="flex items-center gap-1 text-stone-600">
                            <Calendar className="w-3.5 h-3.5 text-stone-400" />
                            {v.visitDate.split("-").reverse().join("/")} ({v.servicePeriod || "Culto"})
                          </span>

                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-medium text-[11px]">
                            {v.howHeard}
                            {v.howHeardDetail && (
                              <span className="text-stone-500 font-normal">
                                ({v.howHeardDetail})
                              </span>
                            )}
                          </span>

                          {v.neighborhood && (
                            <span className="text-stone-500 text-[11px]">
                              📍 {v.neighborhood}
                            </span>
                          )}
                        </div>

                        {/* Pedido de Oração */}
                        {v.prayerRequest && (
                          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl px-3 py-1.5 text-xs text-amber-900 mt-2 flex items-start gap-2">
                            <span className="font-bold shrink-0">🙏 Oração:</span>
                            <span className="italic">"{v.prayerRequest}"</span>
                          </div>
                        )}
                      </div>

                      {/* Botões de Ação Rápida */}
                      <div className="flex items-center gap-2 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-stone-100">
                        {/* Botão Verde WhatsApp */}
                        <button
                          onClick={() => setWhatsappModalVisitor(v)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm hover:shadow transition inline-flex items-center gap-1.5"
                          title="Enviar mensagem personalizada pelo WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>WhatsApp</span>
                        </button>

                        {/* Botão Histórico / Anotações */}
                        <button
                          onClick={() => setSelectedVisitorForNotes(v)}
                          className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition inline-flex items-center gap-1.5 relative"
                        >
                          <FileText className="w-4 h-4 text-stone-600" />
                          <span>Histórico</span>
                          {v.notes && v.notes.length > 0 && (
                            <span className="w-4 h-4 rounded-full bg-stone-700 text-white text-[10px] font-black flex items-center justify-center">
                              {v.notes.length}
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            ABA 2: CADASTRO INTERNO NO BALCÃO DE RECEPÇÃO
           ========================================================================= */}
        {activeTab === "cadastrar" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Formulário de Cadastro da Equipe */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-stone-900">
                    Cadastrar Novo Visitante
                  </h2>
                  <p className="text-xs text-stone-500">
                    Preenchimento no balcão de recepção pela equipe Bem-Vindos
                  </p>
                </div>
              </div>

              {newVisSuccess && (
                <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm font-bold flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Visitante cadastrado com sucesso e adicionado ao acompanhamento!</span>
                </div>
              )}

              <form onSubmit={handleInternalRegister} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nome do visitante"
                      value={newVisFullName}
                      onChange={(e) => setNewVisFullName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#F7F6F2] border border-stone-300 rounded-xl text-stone-900 text-sm outline-none focus:bg-white focus:border-[#CB4B3B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                      WhatsApp com DDD *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="(11) 99999-9999"
                      value={newVisPhone}
                      onChange={handleNewVisPhoneChange}
                      className="w-full px-4 py-2.5 bg-[#F7F6F2] border border-stone-300 rounded-xl text-stone-900 text-sm outline-none focus:bg-white focus:border-[#CB4B3B]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                      Onde nos conheceu?
                    </label>
                    <select
                      value={newVisHowHeard}
                      onChange={(e) => setNewVisHowHeard(e.target.value as HowHeardChannel)}
                      className="w-full px-3.5 py-2.5 bg-[#F7F6F2] border border-stone-300 rounded-xl text-stone-900 text-sm outline-none focus:bg-white focus:border-[#CB4B3B]"
                    >
                      {HOW_HEARD_OPTIONS.map((ch) => (
                        <option key={ch.id} value={ch.id}>
                          {ch.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                      Detalhe / Quem indicou
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Amigo(a) João / Panfleto"
                      value={newVisHowHeardDetail}
                      onChange={(e) => setNewVisHowHeardDetail(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#F7F6F2] border border-stone-300 rounded-xl text-stone-900 text-sm outline-none focus:bg-white focus:border-[#CB4B3B]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                      Culto / Horário
                    </label>
                    <select
                      value={newVisServicePeriod}
                      onChange={(e) => setNewVisServicePeriod(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#F7F6F2] border border-stone-300 rounded-xl text-stone-900 text-sm outline-none focus:bg-white focus:border-[#CB4B3B]"
                    >
                      <option value="Domingo Noite (18h)">Domingo Noite (18h)</option>
                      <option value="Domingo Manhã (10h)">Domingo Manhã (10h)</option>
                      <option value="Quinta-feira (20h)">Quinta-feira (20h)</option>
                      <option value="Culto Especial">Culto Especial</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                      Data da Visita
                    </label>
                    <input
                      type="date"
                      value={newVisDate}
                      onChange={(e) => setNewVisDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#F7F6F2] border border-stone-300 rounded-xl text-stone-900 text-sm outline-none focus:bg-white focus:border-[#CB4B3B]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                      Bairro
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Centro"
                      value={newVisNeighborhood}
                      onChange={(e) => setNewVisNeighborhood(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#F7F6F2] border border-stone-300 rounded-xl text-stone-900 text-sm outline-none focus:bg-white focus:border-[#CB4B3B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                      Cidade
                    </label>
                    <input
                      type="text"
                      placeholder="Mogi das Cruzes"
                      value={newVisCity}
                      onChange={(e) => setNewVisCity(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#F7F6F2] border border-stone-300 rounded-xl text-stone-900 text-sm outline-none focus:bg-white focus:border-[#CB4B3B]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                    Pedido de Oração (se houver)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Pela saúde da mãe, direcionamento no trabalho"
                    value={newVisPrayerRequest}
                    onChange={(e) => setNewVisPrayerRequest(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#F7F6F2] border border-stone-300 rounded-xl text-stone-900 text-sm outline-none focus:bg-white focus:border-[#CB4B3B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                    Observação de Atendimento (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Esteve acompanhado do irmão, muito receptivo"
                    value={newVisInitialNote}
                    onChange={(e) => setNewVisInitialNote(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#F7F6F2] border border-stone-300 rounded-xl text-stone-900 text-sm outline-none focus:bg-white focus:border-[#CB4B3B]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={newVisSubmitting}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow transition flex items-center justify-center gap-2"
                >
                  {newVisSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Cadastrando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Concluir Cadastro do Visitante</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Painel Lateral: QR Code & Link para Apresentar */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 text-stone-900 font-extrabold text-base">
                  <QrCode className="w-5 h-5 text-[#CB4B3B]" />
                  <span>Autoatendimento por QR Code</span>
                </div>
                <p className="text-stone-600 text-xs leading-relaxed">
                  Mostre este QR Code no tablet ou no celular para o visitante escanear e preencher seus próprios dados com total autonomia:
                </p>

                {/* Exibição Visual do QR Code */}
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col items-center text-center">
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https%3A%2F%2Fbemvindos.igrejadoalto.com%2Fcadastro"
                    alt="QR Code Ministério Bem-Vindos"
                    className="w-44 h-44 rounded-xl shadow-sm border border-stone-200"
                  />
                  <span className="text-[11px] font-mono text-stone-600 mt-2">
                    bemvindos.igrejadoalto.com/cadastro
                  </span>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={copyPublicLink}
                    className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow transition flex items-center justify-center gap-2"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Link Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copiar Link de Boas-Vindas</span>
                      </>
                    )}
                  </button>

                  <Link
                    href="/bem-vindos/cadastro"
                    target="_blank"
                    className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4 text-stone-600" />
                    <span>Abrir Formulário Público</span>
                  </Link>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100 text-[11px] text-stone-500">
                💡 <strong>Dica da Equipe:</strong> Ao acolher o visitante, envie uma mensagem no WhatsApp logo no início da semana seguinte ao culto.
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            ABA 3: MÉTRICAS & CANAIS DE ORIGEM
           ========================================================================= */}
        {activeTab === "metricas" && metrics && (
          <div className="space-y-6 animate-fade-in">
            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                  Taxa de Contato
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-4xl font-black text-emerald-600">
                    {metrics.percentContactados}%
                  </span>
                  <span className="text-xs text-stone-600">
                    ({metrics.contactados} de {metrics.total} contatados)
                  </span>
                </div>
                <div className="w-full bg-stone-100 h-2.5 rounded-full mt-3 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${metrics.percentContactados}%` }}
                  />
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                  Em Relacionamento Ativo
                </span>
                <span className="text-4xl font-black text-purple-600 mt-2 block">
                  {metrics.emConversa}
                </span>
                <p className="text-xs text-stone-500 mt-1">
                  Visitantes interagindo ou convidados para Casa do Alto
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                  Integrados à Igreja
                </span>
                <span className="text-4xl font-black text-stone-900 mt-2 block">
                  {metrics.integrados}
                </span>
                <p className="text-xs text-stone-500 mt-1">
                  Pessoas que se tornaram frequentadoras ativas
                </p>
              </div>
            </div>

            {/* Distribuição por Canais ("Onde nos conheceu") */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
              <h3 className="text-lg font-black text-stone-900">
                Onde as pessoas estão conhecendo a Igreja do Alto?
              </h3>
              <p className="text-xs text-stone-500">
                Distribuição dos canais de atração informados pelos próprios visitantes
              </p>

              <div className="space-y-3 pt-2">
                {Object.entries(metrics.channelBreakdown || {}).map(([channel, count]: any) => {
                  const percentage =
                    metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0;
                  return (
                    <div key={channel} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-stone-700">
                        <span>{channel}</span>
                        <span>
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#CB4B3B] h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            ABA 4: GESTÃO DE ACESSOS (EXCLUSIVO PASTORES E ADMINS)
           ========================================================================= */}
        {activeTab === "acessos" && isPastorOrAdmin && (
          <div className="space-y-6 animate-fade-in">
            {/* Solicitações Pendentes */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-amber-500" />
                    <span>Solicitações de Acesso Pendentes</span>
                  </h2>
                  <p className="text-xs text-stone-500">
                    Membros dos ministérios autorizados aguardando liberação da liderança pastoral
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold">
                  {accessRequests.filter((r) => r.status === "pendente").length} pendente(s)
                </span>
              </div>

              {accessRequests.filter((r) => r.status === "pendente").length === 0 ? (
                <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-500 text-xs">
                  Nenhuma solicitação de acesso pendente no momento.
                </div>
              ) : (
                <div className="space-y-3">
                  {accessRequests
                    .filter((r) => r.status === "pendente")
                    .map((req) => (
                      <div
                        key={req.id}
                        className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <p className="font-extrabold text-sm text-stone-900">{req.memberName}</p>
                          <div className="text-xs text-stone-600 flex flex-wrap gap-2">
                            <span>📞 {req.memberPhone}</span>
                            <span>✉️ {req.memberEmail}</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {req.memberMinistries.map((min, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-white border border-stone-200 text-[10px] font-bold text-stone-700"
                              >
                                {min}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleReviewRequest(req.id, "aprovado", "voluntario")}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition inline-flex items-center gap-1"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Aprovar</span>
                          </button>

                          <button
                            onClick={() => handleReviewRequest(req.id, "recusado")}
                            className="px-3 py-1.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-xs transition inline-flex items-center gap-1"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>Recusar</span>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Membros Ativos da Equipe */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">
              <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-stone-700" />
                <span>Equipe Ativa com Acesso Liberado</span>
              </h2>

              {team.length === 0 ? (
                <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-500 text-xs">
                  Nenhum voluntário cadastrado na equipe ainda. Aprovados aparecerão aqui.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                        <th className="py-2.5">Nome</th>
                        <th className="py-2.5">Telefone</th>
                        <th className="py-2.5">Função</th>
                        <th className="py-2.5">Aprovado Por</th>
                        <th className="py-2.5 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {team.map((member) => (
                        <tr key={member.memberId} className="hover:bg-stone-50">
                          <td className="py-3 font-bold text-stone-900">{member.memberName}</td>
                          <td className="py-3 text-stone-600">{member.phone}</td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                              {member.role}
                            </span>
                          </td>
                          <td className="py-3 text-stone-500">{member.approvedBy}</td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => handleRevokeAccess(member.memberId)}
                              className="text-red-600 hover:text-red-800 font-bold text-xs"
                            >
                              Revogar Acesso
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL: HISTÓRICO & ANOTAÇÕES DO VISITANTE
         ========================================================================= */}
      {selectedVisitorForNotes && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-stone-200 animate-scale-up">
            {/* Header Modal */}
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div>
                <h3 className="font-black text-base text-stone-900">
                  {selectedVisitorForNotes.fullName}
                </h3>
                <p className="text-xs text-stone-500">
                  Linha do tempo de contatos e observações
                </p>
              </div>
              <button
                onClick={() => setSelectedVisitorForNotes(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo do Histórico */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
              {(!selectedVisitorForNotes.notes || selectedVisitorForNotes.notes.length === 0) ? (
                <p className="text-xs text-stone-400 text-center py-6">
                  Nenhuma anotação registrada ainda para este visitante.
                </p>
              ) : (
                selectedVisitorForNotes.notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px] text-stone-500 font-bold">
                      <span className="text-[#CB4B3B]">{note.authorName}</span>
                      <span>{new Date(note.createdAt).toLocaleDateString("pt-BR")}</span>
                    </div>
                    <p className="text-stone-800 leading-relaxed">{note.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Campo para Nova Anotação */}
            <form onSubmit={handleAddNote} className="p-4 border-t border-stone-200 bg-stone-50 flex gap-2">
              <input
                type="text"
                placeholder="Adicionar observação..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 outline-none focus:border-[#CB4B3B]"
              />
              <button
                type="submit"
                disabled={addingNoteLoading || !newNoteText.trim()}
                className="px-4 py-2.5 rounded-xl bg-[#CB4B3B] hover:bg-[#a93829] text-white font-bold text-xs transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {addingNoteLoading ? "..." : <Send className="w-3.5 h-3.5" />}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ENVIAR WHATSAPP PERSONALIZADO
         ========================================================================= */}
      {whatsappModalVisitor && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-base">
                <MessageCircle className="w-5 h-5" />
                <span>Enviar Mensagem de Acolhimento</span>
              </div>
              <button
                onClick={() => setWhatsappModalVisitor(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-600">
              Escolha o modelo de mensagem para enviar a{" "}
              <strong>{whatsappModalVisitor.fullName.split(" ")[0]}</strong> no número{" "}
              <strong>{whatsappModalVisitor.phone}</strong>:
            </p>

            <div className="space-y-2">
              <label
                onClick={() => setWhatsappTemplate("boas_vindas")}
                className={`block p-3 rounded-xl border text-xs cursor-pointer transition ${
                  whatsappTemplate === "boas_vindas"
                    ? "bg-emerald-50 border-emerald-500 font-bold text-emerald-950"
                    : "bg-stone-50 border-stone-200 text-stone-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>🕊️ 1. Primeiro Contato (Boas-Vindas)</span>
                  {whatsappTemplate === "boas_vindas" && <Check className="w-4 h-4 text-emerald-600" />}
                </div>
                <p className="font-normal text-[11px] text-stone-500 mt-1">
                  Agradecimento caloroso pela presença, pergunta sobre a experiência e oferta de oração.
                </p>
              </label>

              <label
                onClick={() => setWhatsappTemplate("culto_proximo")}
                className={`block p-3 rounded-xl border text-xs cursor-pointer transition ${
                  whatsappTemplate === "culto_proximo"
                    ? "bg-emerald-50 border-emerald-500 font-bold text-emerald-950"
                    : "bg-stone-50 border-stone-200 text-stone-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>⛪ 2. Convite para o Próximo Domingo</span>
                  {whatsappTemplate === "culto_proximo" && <Check className="w-4 h-4 text-emerald-600" />}
                </div>
                <p className="font-normal text-[11px] text-stone-500 mt-1">
                  Convite acolhedor lembrando os horários (10h e 18h).
                </p>
              </label>

              <label
                onClick={() => setWhatsappTemplate("celula")}
                className={`block p-3 rounded-xl border text-xs cursor-pointer transition ${
                  whatsappTemplate === "celula"
                    ? "bg-emerald-50 border-emerald-500 font-bold text-emerald-950"
                    : "bg-stone-50 border-stone-200 text-stone-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>🏠 3. Conexão Casa do Alto (Célula)</span>
                  {whatsappTemplate === "celula" && <Check className="w-4 h-4 text-emerald-600" />}
                </div>
                <p className="font-normal text-[11px] text-stone-500 mt-1">
                  Apresentação de pequenos grupos no bairro do visitante.
                </p>
              </label>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => handleOpenWhatsApp(whatsappModalVisitor)}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow transition flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Abrir WhatsApp Web / App</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
