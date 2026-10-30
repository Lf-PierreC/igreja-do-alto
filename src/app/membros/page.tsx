"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BrandLogo, MountainIcon } from "@/components/BrandLogo";
import {
  Address,
  AttendanceTime,
  ChurchRelationship,
  FamilyDependent,
  MaritalStatus,
  Member,
  MemberSession,
  PastorLeader,
  RequestReason,
  Shift,
  VisitReport,
  VisitRequest,
  WeekDay,
} from "@/types/visitas";
import {
  ATTENDANCE_TIME,
  CHURCH_RELATIONSHIP,
  MARITAL_STATUS,
  REQUEST_REASONS,
  SHIFTS,
  WEEK_DAYS,
  YES_NO,
} from "@/data/formOptions";
import {
  cleanDigits,
  formatCPF,
  formatPhoneBR,
  validateCPF,
  calculateAge,
  formatCEP,
  fetchAddressByCEP,
} from "@/lib/cpfUtils";
import {
  formatAddress,
  formatDateBR,
  SITUATION_META,
  STATUS_META,
} from "@/lib/visitasUtils";
import { LightDismissDialog } from "@/components/LightDismissDialog";
import {
  Users,
  User,
  HeartHandshake,
  ClipboardCheck,
  MapPin,
  Phone,
  Mail,
  Lock,
  KeyRound,
  Calendar,
  Clock,
  Sparkles,
  Plus,
  Trash2,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Baby,
  Home,
  ShieldCheck,
  Heart,
  ChevronRight,
  Eye,
  Edit3,
  Search,
  UserX,
  Church,
  ExternalLink,
  Crown,
  Copy,
  UserPlus,
  Filter,
  Check,
  X,
} from "lucide-react";

const MEMBER_SESSION_KEY = "igreja_alto_member_session_v1";

type ActiveTab =
  | "todos-membros"
  | "gestao-pastores"
  | "visitas-cuidado"
  | "familia"
  | "solicitar-visita"
  | "minhas-solicitacoes"
  | "meu-cadastro";

export default function PortalDoMembroPage() {
  const [session, setSession] = useState<MemberSession | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Estados de Autenticação (Deslogado)
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Estados do Formulário de Cadastro
  const [regName, setRegName] = useState("");
  const [regCpf, setRegCpf] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regBirthDate, setRegBirthDate] = useState("");
  const [regMaritalStatus, setRegMaritalStatus] = useState<MaritalStatus>("Casado(a)");
  const [regSpouseName, setRegSpouseName] = useState("");
  const [regCep, setRegCep] = useState("");
  const [regStreet, setRegStreet] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [regComplement, setRegComplement] = useState("");
  const [regNeighborhood, setRegNeighborhood] = useState("");
  const [regCity, setRegCity] = useState("Mogi das Cruzes");
  const [isSearchingCepReg, setIsSearchingCepReg] = useState(false);
  const [cepErrorReg, setCepErrorReg] = useState<string | null>(null);
  const [regPassword, setRegPassword] = useState("");
  const [regPasswordConfirm, setRegPasswordConfirm] = useState("");

  // Relacionamento com a Igreja (Cadastro)
  const [regRelationship, setRegRelationship] = useState<ChurchRelationship>("Membro");
  const [regAttendanceTime, setRegAttendanceTime] = useState<AttendanceTime | "">("Mais de 5 anos");
  const [regParticipates, setRegParticipates] = useState<"Sim" | "Não">("Não");
  const [regActivityName, setRegActivityName] = useState("");

  // Dados do Membro Logado
  const [memberData, setMemberData] = useState<Member | null>(null);
  const [spouseData, setSpouseData] = useState<{
    id: string;
    name: string;
    phone: string;
    email?: string;
    cpf?: string;
  } | null>(null);
  const [dependents, setDependents] = useState<FamilyDependent[]>([]);
  const [myRequests, setMyRequests] = useState<VisitRequest[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>("familia");

  // Vínculo de Cônjuge
  const [spouseIdentifier, setSpouseIdentifier] = useState("");
  const [isLinkingSpouse, setIsLinkingSpouse] = useState(false);
  const [isUnlinkingSpouse, setIsUnlinkingSpouse] = useState(false);
  const [spouseLinkMessage, setSpouseLinkMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Modal Novo Filho / Dependente (< 16 anos)
  const [isAddDepOpen, setIsAddDepOpen] = useState(false);
  const [depName, setDepName] = useState("");
  const [depBirthDate, setDepBirthDate] = useState("");
  const [depGender, setDepGender] = useState<"M" | "F">("M");
  const [depRel, setDepRel] = useState<"Filho(a)" | "Enteado(a)" | "Neto(a)" | "Outro">("Filho(a)");
  const [depNotes, setDepNotes] = useState("");
  const [depCpf, setDepCpf] = useState("");
  const [depError, setDepError] = useState<string | null>(null);
  const [isSavingDep, setIsSavingDep] = useState(false);

  // Solicitar Visita Pastoral (Expressa)
  const [visitTargetType, setVisitTargetType] = useState<string>("Toda a Família");
  const [visitTargetDependent, setVisitTargetDependent] = useState("");
  const [visitReasons, setVisitReasons] = useState<RequestReason[]>([
    "Visita pastoral / comunhão",
  ]);
  const [visitDays, setVisitDays] = useState<WeekDay[]>(["Sábado"]);
  const [visitShifts, setVisitShifts] = useState<Shift[]>(["A combinar"]);
  const [visitObservations, setVisitObservations] = useState("");
  const [useCustomAddress, setUseCustomAddress] = useState(false);
  const [customStreet, setCustomStreet] = useState("");
  const [customNumber, setCustomNumber] = useState("");
  const [customNeighborhood, setCustomNeighborhood] = useState("");
  const [customCity, setCustomCity] = useState("Mogi das Cruzes");
  const [isSubmittingVisit, setIsSubmittingVisit] = useState(false);
  const [visitSuccessProtocol, setVisitSuccessProtocol] = useState<string | null>(null);
  const [visitError, setVisitError] = useState<string | null>(null);

  // Edição de Perfil / Cadastro do Membro
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editBirthDate, setEditBirthDate] = useState("");
  const [editMaritalStatus, setEditMaritalStatus] = useState<MaritalStatus>("Casado(a)");
  const [editSpouseName, setEditSpouseName] = useState("");
  const [editCep, setEditCep] = useState("");
  const [editStreet, setEditStreet] = useState("");
  const [editNumber, setEditNumber] = useState("");
  const [editComplement, setEditComplement] = useState("");
  const [editNeighborhood, setEditNeighborhood] = useState("");
  const [editCity, setEditCity] = useState("Mogi das Cruzes");
  const [isSearchingCepEdit, setIsSearchingCepEdit] = useState(false);
  const [cepErrorEdit, setCepErrorEdit] = useState<string | null>(null);
  const [editPassword, setEditPassword] = useState("");
  const [editPasswordConfirm, setEditPasswordConfirm] = useState("");
  const [editRelationship, setEditRelationship] = useState<ChurchRelationship>("Membro");
  const [editAttendanceTime, setEditAttendanceTime] = useState<AttendanceTime | "">("");
  const [editParticipates, setEditParticipates] = useState<"Sim" | "Não">("Não");
  const [editActivityName, setEditActivityName] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Estados de Gestão de Membros, Pastores e Visitas (Admin & Pastor)
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [pastorsList, setPastorsList] = useState<PastorLeader[]>([]);
  const [allReports, setAllReports] = useState<VisitReport[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [memberFilterCategory, setMemberFilterCategory] = useState<
    "todos" | "membros" | "pastores" | "admins" | "visitantes"
  >("todos");
  const [visitedSearchQuery, setVisitedSearchQuery] = useState("");
  const [visitedPastorFilter, setVisitedPastorFilter] = useState("todos");
  const [adminFeedback, setAdminFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Modal: Cadastrar Novo Membro (Admin ou Pastor)
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [addMemName, setAddMemName] = useState("");
  const [addMemCpf, setAddMemCpf] = useState("");
  const [addMemEmail, setAddMemEmail] = useState("");
  const [addMemPhone, setAddMemPhone] = useState("");
  const [addMemBirthDate, setAddMemBirthDate] = useState("");
  const [addMemMaritalStatus, setAddMemMaritalStatus] = useState<MaritalStatus>("Casado(a)");
  const [addMemSpouseName, setAddMemSpouseName] = useState("");
  const [addMemCep, setAddMemCep] = useState("");
  const [addMemStreet, setAddMemStreet] = useState("");
  const [addMemNumber, setAddMemNumber] = useState("");
  const [addMemComplement, setAddMemComplement] = useState("");
  const [addMemNeighborhood, setAddMemNeighborhood] = useState("");
  const [addMemCity, setAddMemCity] = useState("Mogi das Cruzes");
  const [isSearchingCepAddMem, setIsSearchingCepAddMem] = useState(false);
  const [cepErrorAddMem, setCepErrorAddMem] = useState<string | null>(null);
  const [addMemRelationship, setAddMemRelationship] = useState<ChurchRelationship>("Membro");
  const [addMemAttendanceTime, setAddMemAttendanceTime] = useState<AttendanceTime | "">("Mais de 5 anos");
  const [addMemParticipates, setAddMemParticipates] = useState<"Sim" | "Não">("Não");
  const [addMemActivityName, setAddMemActivityName] = useState("");
  const [addMemPassword, setAddMemPassword] = useState("igrejadoalto");
  const [addMemIsPastor, setAddMemIsPastor] = useState(false);
  const [addMemIsAdmin, setAddMemIsAdmin] = useState(false);
  const [isSavingAddMember, setIsSavingAddMember] = useState(false);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);

  // Nomeação Rápida de Pastor (Aba Gestão de Pastores)
  const [selectedMemberToAppoint, setSelectedMemberToAppoint] = useState("");
  const [appointAsAdmin, setAppointAsAdmin] = useState(false);
  const [isAppointing, setIsAppointing] = useState(false);

  // Carrega sessão salva no localStorage
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(MEMBER_SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as MemberSession;
        if (parsed && parsed.id) {
          setSession(parsed);
          loadMemberDashboard(parsed.id);
          if (parsed.isAdmin || parsed.isPastor) {
            setActiveTab("todos-membros");
          }
        }
      }
    } catch {
      // ignore
    } finally {
      setAuthChecked(true);
    }
  }, []);

  const loadMemberDashboard = async (memberId: string) => {
    try {
      const res = await fetch(`/api/membros?memberId=${encodeURIComponent(memberId)}`);
      const data = await res.json();
      if (res.ok && data.member) {
        setMemberData(data.member);
        setSpouseData(data.spouse || null);
        setDependents(data.dependents || []);
        setMyRequests(data.requests || []);
        if (data.allMembers) setAllMembers(data.allMembers);
        if (data.pastors) setPastorsList(data.pastors);
        if (data.reports) setAllReports(data.reports);
      }
    } catch (err) {
      console.error("Erro ao carregar dados do membro:", err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthLoading(true);

    try {
      const res = await fetch("/api/membros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "MEMBER_LOGIN",
          payload: {
            login: loginIdentifier,
            password: loginPassword,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Falha no login. Verifique seus dados.");
      }

      setSession(data.session);
      setMemberData(data.member);
      if (data.allMembers) setAllMembers(data.allMembers);
      if (data.pastors) setPastorsList(data.pastors);
      if (data.reports) setAllReports(data.reports);

      if (data.session.isAdmin || data.session.isPastor) {
        setActiveTab("todos-membros");
      }

      try {
        window.localStorage.setItem(MEMBER_SESSION_KEY, JSON.stringify(data.session));
      } catch {
        // ignore
      }
      loadMemberDashboard(data.session.id);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Erro ao efetuar login.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const cleanCpf = cleanDigits(regCpf);
    if (!validateCPF(cleanCpf)) {
      setAuthError("CPF inválido. Por favor, confira os números digitados.");
      return;
    }

    if (regPassword.length < 4) {
      setAuthError("A senha precisa ter pelo menos 4 caracteres.");
      return;
    }

    if (regPassword !== regPasswordConfirm) {
      setAuthError("A confirmação da senha não confere com a senha digitada.");
      return;
    }

    setIsAuthLoading(true);

    try {
      const res = await fetch("/api/membros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "MEMBER_REGISTER",
          payload: {
            name: regName,
            cpf: cleanCpf,
            email: regEmail,
            phone: regPhone,
            birthDate: regBirthDate,
            maritalStatus: regMaritalStatus,
            spouseName: regMaritalStatus === "Casado(a)" ? regSpouseName.trim() : undefined,
            relationship: regRelationship,
            attendanceTime: regAttendanceTime || undefined,
            participatesInActivity: regParticipates === "Sim",
            activityName: regParticipates === "Sim" ? regActivityName.trim() : undefined,
            address: {
              cep: regCep ? cleanDigits(regCep) : undefined,
              street: regStreet,
              number: regNumber,
              complement: regComplement || undefined,
              neighborhood: regNeighborhood,
              city: regCity,
            },
            password: regPassword,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Não foi possível concluir o cadastro.");
      }

      setSession(data.session);
      setMemberData(data.member);
      try {
        window.localStorage.setItem(MEMBER_SESSION_KEY, JSON.stringify(data.session));
      } catch {
        // ignore
      }
      loadMemberDashboard(data.session.id);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Erro ao cadastrar.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setSession(null);
    setMemberData(null);
    setSpouseData(null);
    setDependents([]);
    setMyRequests([]);
    try {
      window.localStorage.removeItem(MEMBER_SESSION_KEY);
    } catch {
      // ignore
    }
  };

  const handleLinkSpouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !spouseIdentifier.trim()) return;

    setIsLinkingSpouse(true);
    setSpouseLinkMessage(null);

    try {
      const res = await fetch("/api/membros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "FAMILY_LINK_SPOUSE",
          payload: {
            memberId: session.id,
            spouseIdentifier: spouseIdentifier.trim(),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Não foi possível vincular o cônjuge.");
      }

      setSpouseData(data.spouse);
      setDependents(data.dependents || []);
      setSpouseLinkMessage({
        type: "success",
        text: `Vínculo com ${data.spouse.name} realizado com sucesso!`,
      });
      setSpouseIdentifier("");
    } catch (err) {
      setSpouseLinkMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Erro ao vincular cônjuge.",
      });
    } finally {
      setIsLinkingSpouse(false);
    }
  };

  const handleAddDependent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setDepError(null);

    if (!depName.trim()) {
      setDepError("Informe o nome do filho(a).");
      return;
    }
    if (!depBirthDate) {
      setDepError("Informe a data de nascimento.");
      return;
    }

    setIsSavingDep(true);
    try {
      const res = await fetch("/api/membros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "FAMILY_ADD_DEPENDENT",
          payload: {
            memberId: session.id,
            fullName: depName.trim(),
            birthDate: depBirthDate,
            gender: depGender,
            relationship: depRel,
            notes: depNotes.trim(),
            cpf: depCpf ? cleanDigits(depCpf) : undefined,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao adicionar filho/dependente.");
      }

      setDependents(data.dependents);
      setIsAddDepOpen(false);
      setDepName("");
      setDepBirthDate("");
      setDepNotes("");
      setDepCpf("");
    } catch (err) {
      setDepError(err instanceof Error ? err.message : "Erro ao salvar dependente.");
    } finally {
      setIsSavingDep(false);
    }
  };

  const handleRemoveDependent = async (depId: string, depName: string) => {
    if (!session) return;
    if (!window.confirm(`Deseja realmente remover ${depName} da sua lista de filhos/dependentes?`)) {
      return;
    }

    try {
      const res = await fetch("/api/membros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "FAMILY_REMOVE_DEPENDENT",
          payload: {
            memberId: session.id,
            dependentId: depId,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.dependents) {
        setDependents(data.dependents);
      }
    } catch (err) {
      console.error("Erro ao remover dependente:", err);
    }
  };

  const handleCreateVisitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setVisitError(null);
    setIsSubmittingVisit(true);

    try {
      let customAddr: Address | undefined = undefined;
      if (useCustomAddress) {
        if (!customStreet.trim() || !customNumber.trim() || !customNeighborhood.trim()) {
          throw new Error("Preencha rua, número e bairro para o endereço alternativo.");
        }
        customAddr = {
          street: customStreet.trim(),
          number: customNumber.trim(),
          neighborhood: customNeighborhood.trim(),
          city: customCity.trim() || "Mogi das Cruzes",
        };
      }

      const res = await fetch("/api/membros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "MEMBER_CREATE_REQUEST",
          payload: {
            memberId: session.id,
            targetType: visitTargetType,
            targetDependentName:
              visitTargetType === "Filho(a) específico" ? visitTargetDependent : undefined,
            reasons: visitReasons,
            preferredDays: visitDays,
            preferredShifts: visitShifts,
            observations: visitObservations,
            customAddress: customAddr,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Não foi possível enviar sua solicitação de visita.");
      }

      setVisitSuccessProtocol(data.request?.id || `ALTO-${Date.now().toString().slice(-4)}`);
      setMyRequests((prev) => [data.request, ...prev]);
    } catch (err) {
      setVisitError(err instanceof Error ? err.message : "Erro ao solicitar visita.");
    } finally {
      setIsSubmittingVisit(false);
    }
  };

  const handleLookupCepReg = async (cepToSearch?: string) => {
    const raw = cepToSearch || regCep;
    const clean = cleanDigits(raw);
    if (clean.length !== 8) {
      setCepErrorReg("Digite os 8 números do CEP.");
      return;
    }
    setCepErrorReg(null);
    setIsSearchingCepReg(true);
    try {
      const result = await fetchAddressByCEP(clean);
      if (!result) {
        setCepErrorReg("CEP não encontrado. Preencha o endereço manualmente.");
        return;
      }
      if (result.street) setRegStreet(result.street);
      if (result.neighborhood) setRegNeighborhood(result.neighborhood);
      if (result.city) setRegCity(result.city);
      setTimeout(() => {
        document.getElementById("reg-number")?.focus();
      }, 100);
    } catch {
      setCepErrorReg("Erro ao consultar CEP.");
    } finally {
      setIsSearchingCepReg(false);
    }
  };

  const handleLookupCepEdit = async (cepToSearch?: string) => {
    const raw = cepToSearch || editCep;
    const clean = cleanDigits(raw);
    if (clean.length !== 8) {
      setCepErrorEdit("Digite os 8 números do CEP.");
      return;
    }
    setCepErrorEdit(null);
    setIsSearchingCepEdit(true);
    try {
      const result = await fetchAddressByCEP(clean);
      if (!result) {
        setCepErrorEdit("CEP não encontrado. Preencha o endereço manualmente.");
        return;
      }
      if (result.street) setEditStreet(result.street);
      if (result.neighborhood) setEditNeighborhood(result.neighborhood);
      if (result.city) setEditCity(result.city);
      setTimeout(() => {
        document.getElementById("edit-number")?.focus();
      }, 100);
    } catch {
      setCepErrorEdit("Erro ao consultar CEP.");
    } finally {
      setIsSearchingCepEdit(false);
    }
  };

  const handleUnlinkSpouse = async () => {
    if (!session) return;
    if (
      !window.confirm(
        "Deseja realmente desvincular o cônjuge do seu núcleo familiar? Ambos continuarão tendo seus acessos individuais normalmente."
      )
    ) {
      return;
    }
    setIsUnlinkingSpouse(true);
    setSpouseLinkMessage(null);
    try {
      const res = await fetch("/api/membros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "FAMILY_UNLINK_SPOUSE",
          payload: { memberId: session.id },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao desvincular cônjuge.");
      }
      setSpouseData(null);
      if (data.member) {
        setMemberData(data.member);
      }
      setSpouseLinkMessage({
        type: "success",
        text: "Cônjuge desvinculado com sucesso.",
      });
    } catch (err) {
      setSpouseLinkMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Erro ao desvincular cônjuge.",
      });
    } finally {
      setIsUnlinkingSpouse(false);
    }
  };

  const startEditingProfile = () => {
    if (!memberData) return;
    setEditName(memberData.name || "");
    setEditEmail(memberData.email || "");
    setEditPhone(memberData.phone ? formatPhoneBR(memberData.phone) : "");
    setEditBirthDate(memberData.birthDate || "");
    setEditMaritalStatus((memberData.maritalStatus as MaritalStatus) || "Casado(a)");
    setEditSpouseName(memberData.spouseName || "");
    setEditCep(memberData.address?.cep ? formatCEP(memberData.address.cep) : "");
    setEditStreet(memberData.address?.street || "");
    setEditNumber(memberData.address?.number || "");
    setEditComplement(memberData.address?.complement || "");
    setEditNeighborhood(memberData.address?.neighborhood || "");
    setEditCity(memberData.address?.city || "Mogi das Cruzes");
    setEditPassword("");
    setEditPasswordConfirm("");
    setEditRelationship(memberData.relationship || "Membro");
    setEditAttendanceTime(memberData.attendanceTime || "");
    setEditParticipates(memberData.participatesInActivity ? "Sim" : "Não");
    setEditActivityName(memberData.activityName || "");
    setEditError(null);
    setEditSuccess(null);
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !memberData) return;
    setEditError(null);
    setEditSuccess(null);

    if (!editName.trim()) {
      setEditError("O nome completo é obrigatório.");
      return;
    }
    if (!editPhone.trim()) {
      setEditError("O telefone/WhatsApp é obrigatório.");
      return;
    }

    if (editPassword) {
      if (editPassword.length < 4) {
        setEditError("A nova senha deve ter no mínimo 4 dígitos.");
        return;
      }
      if (editPassword !== editPasswordConfirm) {
        setEditError("A confirmação da nova senha não confere.");
        return;
      }
    }

    setIsSavingEdit(true);

    try {
      const res = await fetch("/api/membros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "MEMBER_UPDATE_PROFILE",
          payload: {
            memberId: session.id,
            updates: {
              name: editName.trim(),
              email: editEmail.trim(),
              phone: editPhone.trim(),
              birthDate: editBirthDate || undefined,
              maritalStatus: editMaritalStatus,
              spouseName: editMaritalStatus === "Casado(a)" ? editSpouseName.trim() : "",
              relationship: editRelationship,
              attendanceTime: editAttendanceTime || undefined,
              participatesInActivity: editParticipates === "Sim",
              activityName: editParticipates === "Sim" ? editActivityName.trim() : undefined,
              address: {
                cep: editCep ? cleanDigits(editCep) : undefined,
                street: editStreet.trim(),
                number: editNumber.trim(),
                complement: editComplement.trim(),
                neighborhood: editNeighborhood.trim(),
                city: editCity.trim() || "Mogi das Cruzes",
              },
              password: editPassword.trim() || undefined,
            },
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao atualizar dados cadastrais.");
      }

      setMemberData(data.member);
      if (data.session) {
        setSession(data.session);
        try {
          window.localStorage.setItem(MEMBER_SESSION_KEY, JSON.stringify(data.session));
        } catch {
          // ignore
        }
      }

      setIsEditingProfile(false);
      setEditSuccess("Cadastro atualizado com sucesso!");
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Erro ao atualizar cadastro.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleLookupCepAddMem = async () => {
    const clean = cleanDigits(addMemCep);
    if (clean.length !== 8) {
      setCepErrorAddMem("Digite os 8 números do CEP.");
      return;
    }
    setCepErrorAddMem(null);
    setIsSearchingCepAddMem(true);
    try {
      const result = await fetchAddressByCEP(clean);
      if (!result) {
        setCepErrorAddMem("CEP não encontrado.");
        return;
      }
      if (result.street) setAddMemStreet(result.street);
      if (result.neighborhood) setAddMemNeighborhood(result.neighborhood);
      if (result.city) setAddMemCity(result.city);
    } catch {
      setCepErrorAddMem("Erro ao consultar CEP.");
    } finally {
      setIsSearchingCepAddMem(false);
    }
  };

  const handleAdminCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddMemberError(null);
    if (!addMemName.trim()) {
      setAddMemberError("Informe o nome completo do membro.");
      return;
    }
    if (addMemCpf && !validateCPF(cleanDigits(addMemCpf))) {
      setAddMemberError("CPF inválido. Confira os números digitados.");
      return;
    }
    setIsSavingAddMember(true);
    try {
      const res = await fetch("/api/membros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADMIN_CREATE_MEMBER",
          payload: {
            name: addMemName.trim(),
            cpf: addMemCpf ? cleanDigits(addMemCpf) : undefined,
            email: addMemEmail.trim() || undefined,
            phone: addMemPhone.trim(),
            birthDate: addMemBirthDate || undefined,
            maritalStatus: addMemMaritalStatus,
            spouseName:
              addMemMaritalStatus === "Casado(a)"
                ? addMemSpouseName.trim()
                : undefined,
            relationship: addMemRelationship,
            attendanceTime: addMemAttendanceTime || undefined,
            participatesInActivity: addMemParticipates === "Sim",
            activityName:
              addMemParticipates === "Sim"
                ? addMemActivityName.trim()
                : undefined,
            address: {
              cep: addMemCep ? cleanDigits(addMemCep) : undefined,
              street: addMemStreet.trim(),
              number: addMemNumber.trim(),
              complement: addMemComplement.trim(),
              neighborhood: addMemNeighborhood.trim(),
              city: addMemCity.trim() || "Mogi das Cruzes",
            },
            password: addMemPassword.trim() || "igrejadoalto",
            isPastor: Boolean(addMemIsPastor),
            isAdmin: Boolean(addMemIsAdmin),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao cadastrar membro.");
      }
      if (data.allMembers) setAllMembers(data.allMembers);
      if (data.pastors) setPastorsList(data.pastors);
      setIsAddMemberModalOpen(false);
      setAdminFeedback({
        type: "success",
        text: `Membro "${addMemName.trim()}" cadastrado com sucesso!`,
      });
      // Reset form
      setAddMemName("");
      setAddMemCpf("");
      setAddMemEmail("");
      setAddMemPhone("");
      setAddMemBirthDate("");
      setAddMemSpouseName("");
      setAddMemCep("");
      setAddMemStreet("");
      setAddMemNumber("");
      setAddMemComplement("");
      setAddMemNeighborhood("");
      setAddMemIsPastor(false);
      setAddMemIsAdmin(false);
    } catch (err) {
      setAddMemberError(
        err instanceof Error ? err.message : "Erro ao cadastrar membro."
      );
    } finally {
      setIsSavingAddMember(false);
    }
  };

  const handleSetMemberPastor = async (
    targetMember: Member,
    willBePastor: boolean,
    willBeAdmin?: boolean
  ) => {
    if (!session) return;
    const confirmMsg = willBePastor
      ? `Deseja nomear "${targetMember.name}" como Pastor da Igreja?`
      : `Deseja remover a função pastoral de "${targetMember.name}"?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch("/api/membros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADMIN_SET_MEMBER_PASTOR",
          payload: {
            memberId: targetMember.id,
            isPastor: willBePastor,
            isAdmin: Boolean(willBeAdmin),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao atualizar permissão pastoral.");
      }
      if (data.allMembers) setAllMembers(data.allMembers);
      if (data.pastors) setPastorsList(data.pastors);
      setAdminFeedback({
        type: "success",
        text: willBePastor
          ? `"${targetMember.name}" agora é Pastor da Igreja!`
          : `Função pastoral removida de "${targetMember.name}".`,
      });
    } catch (err) {
      setAdminFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Erro ao alterar permissão.",
      });
    }
  };

  const handleTogglePastorAccess = async (pastor: PastorLeader) => {
    const nextRole = pastor.accessRole === "admin" ? "pastor" : "admin";
    try {
      const res = await fetch("/api/membros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADMIN_TOGGLE_PASTOR_ACCESS",
          payload: {
            pastorId: pastor.id,
            accessRole: nextRole,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao alternar nível de acesso.");
      }
      if (data.pastors) setPastorsList(data.pastors);
      if (data.allMembers) setAllMembers(data.allMembers);
      setAdminFeedback({
        type: "success",
        text: `Acesso de "${pastor.name}" alterado para ${
          nextRole === "admin" ? "Admin Total" : "Pastor"
        }.`,
      });
    } catch (err) {
      setAdminFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Erro ao alterar acesso.",
      });
    }
  };

  const handleDemotePastor = async (pastor: PastorLeader) => {
    if (!window.confirm(`Deseja remover a função pastoral de "${pastor.name}"?`))
      return;
    const targetMember = allMembers.find(
      (m) =>
        m.id === pastor.memberId ||
        m.name.toLowerCase() === pastor.name.toLowerCase()
    );
    if (!targetMember) {
      alert("Membro correspondente não localizado.");
      return;
    }
    await handleSetMemberPastor(targetMember, false, false);
  };

  const handleQuickAppointPastor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberToAppoint) return;
    const target = allMembers.find((m) => m.id === selectedMemberToAppoint);
    if (!target) return;
    setIsAppointing(true);
    try {
      await handleSetMemberPastor(target, true, appointAsAdmin);
      setSelectedMemberToAppoint("");
      setAppointAsAdmin(false);
    } finally {
      setIsAppointing(false);
    }
  };

  const handleOpenVisitsPortal = () => {
    if (!session) return;
    try {
      const userSession = {
        name: session.name,
        role: session.isAdmin ? "admin" : "pastor",
        accessRole: session.isAdmin ? "admin" : "pastor",
        isMasterAdmin: Boolean(session.isAdmin),
      };
      window.localStorage.setItem(
        "igreja_alto_user_session_v2",
        JSON.stringify(userSession)
      );
    } catch {}
    window.open("/painel?tab=pessoas", "_blank");
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#DCDACF] flex items-center justify-center p-4">
        <div className="animate-spin w-8 h-8 border-4 border-[#CB4B3B] border-t-transparent rounded-full" />
      </div>
    );
  }

  // =========================================================================
  // TELA DESLOGADO: LOGIN OU CADASTRO DE MEMBRO
  // =========================================================================
  if (!session) {
    return (
      <div className="min-h-screen bg-[#DCDACF] flex flex-col justify-between text-[#252525]">
        {/* Top Header */}
        <header className="bg-[#252525] text-[#DCDACF] border-b-4 border-[#CB4B3B]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
            <BrandLogo variant="on-dark2" size="sm" showTagline />
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#363636] text-[#DCDACF] text-xs font-black uppercase tracking-wider">
                <Users className="w-3.5 h-3.5 text-[#CB4B3B]" />
                Portal do Membro
              </span>
              
            </div>
          </div>
        </header>

        {/* Formulário Central (Login ou Cadastro) */}
        <main className="flex-1 max-w-xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col justify-center">
          <div className="rounded-3xl bg-[#F4F3EE] border-2 border-[#252525]/15 shadow-2xl overflow-hidden">
            {/* Abas Alternadoras no Topo do Card */}
            <div className="grid grid-cols-2 bg-[#252525] p-1.5 gap-1.5 text-xs font-black uppercase tracking-wider">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  setAuthError(null);
                }}
                className={`py-3 rounded-xl transition-all ${
                  authMode === "login"
                    ? "bg-[#CB4B3B] text-[#DCDACF] shadow"
                    : "text-[#DCDACF]/70 hover:text-white"
                }`}
              >
                Já sou cadastrado (Entrar)
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("register");
                  setAuthError(null);
                }}
                className={`py-3 rounded-xl transition-all ${
                  authMode === "register"
                    ? "bg-[#CB4B3B] text-[#DCDACF] shadow"
                    : "text-[#DCDACF]/70 hover:text-white"
                }`}
              >
                Criar Novo Cadastro
              </button>
            </div>

            <div className="p-6 sm:p-8">
              {authError && (
                <div
                  role="alert"
                  className="mb-5 p-4 rounded-2xl bg-[#F9EAE8] border-2 border-[#CB4B3B] text-[#A93829] flex items-start gap-2.5 text-xs font-bold"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              {/* TELA DE LOGIN */}
              {authMode === "login" ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="text-center pb-2">
                    <h1 className="text-2xl font-black uppercase tracking-tight text-[#252525]">
                      Bem-vindo ao Portal do Membro
                    </h1>
                    <p className="text-xs text-[#252525]/75 font-semibold mt-1">
                      Acesse seu prontuário, sua família e solicite visitas pastorais.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="login-id"
                      className="block text-xs font-black uppercase tracking-wider text-[#252525] mb-1.5"
                    >
                      Seu CPF ou E-mail
                    </label>
                    <input
                      id="login-id"
                      type="text"
                      required
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="000.000.000-00 ou seu@email.com"
                      className="w-full rounded-xl border-2 border-[#252525]/25 bg-white px-4 py-3 text-sm font-semibold text-[#252525]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="login-pw"
                      className="block text-xs font-black uppercase tracking-wider text-[#252525] mb-1.5"
                    >
                      Sua Senha
                    </label>
                    <input
                      id="login-pw"
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border-2 border-[#252525]/25 bg-white px-4 py-3 text-sm font-semibold text-[#252525]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isAuthLoading}
                    className="w-full py-4 rounded-xl bg-[#CB4B3B] hover:bg-[#A93829] text-[#DCDACF] font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg transition-colors flex items-center justify-center gap-2 mt-4"
                  >
                    {isAuthLoading ? (
                      <span>Entrando...</span>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Entrar no Portal</span>
                      </>
                    )}
                  </button>

                  
                </form>
              ) : (
                /* TELA DE CADASTRO OFICIAL DO MEMBRO */
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="text-center pb-2">
                    <h1 className="text-2xl font-black uppercase tracking-tight text-[#252525]">
                      Cadastro Oficial de Membro
                    </h1>
                    <p className="text-xs text-[#252525]/75 font-semibold mt-1">
                      Cadastro único nacional vinculado ao CPF para cuidado pastoral da sua família.
                    </p>
                  </div>

                  {/* Nome Completo */}
                  <div>
                    <label
                      htmlFor="reg-name"
                      className="block text-xs font-black uppercase tracking-wider text-[#252525] mb-1"
                    >
                      Nome Completo Oficial *
                    </label>
                    <input
                      id="reg-name"
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Ex: Luiz Pierre"
                      className="w-full rounded-xl border-2 border-[#252525]/25 bg-white px-3.5 py-2.5 text-sm font-semibold text-[#252525]"
                    />
                  </div>

                  {/* CPF e Data de Nascimento */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="reg-cpf"
                        className="block text-xs font-black uppercase tracking-wider text-[#252525] mb-1"
                      >
                        CPF (Chave Única) *
                      </label>
                      <input
                        id="reg-cpf"
                        type="text"
                        required
                        value={regCpf}
                        onChange={(e) => setRegCpf(formatCPF(e.target.value))}
                        placeholder="000.000.000-00"
                        maxLength={14}
                        className="w-full rounded-xl border-2 border-[#252525]/25 bg-white px-3.5 py-2.5 text-sm font-semibold text-[#252525]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="reg-bdate"
                        className="block text-xs font-black uppercase tracking-wider text-[#252525] mb-1"
                      >
                        Data de Nascimento *
                      </label>
                      <input
                        id="reg-bdate"
                        type="date"
                        required
                        value={regBirthDate}
                        onChange={(e) => setRegBirthDate(e.target.value)}
                        className="w-full rounded-xl border-2 border-[#252525]/25 bg-white px-3.5 py-2.5 text-sm font-semibold text-[#252525]"
                      />
                    </div>
                  </div>

                  {/* WhatsApp e E-mail */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="reg-phone"
                        className="block text-xs font-black uppercase tracking-wider text-[#252525] mb-1"
                      >
                        WhatsApp / Celular *
                      </label>
                      <input
                        id="reg-phone"
                        type="tel"
                        required
                        value={regPhone}
                        onChange={(e) => setRegPhone(formatPhoneBR(e.target.value))}
                        placeholder="(11) 99999-9999"
                        maxLength={15}
                        className="w-full rounded-xl border-2 border-[#252525]/25 bg-white px-3.5 py-2.5 text-sm font-semibold text-[#252525]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="reg-email"
                        className="block text-xs font-black uppercase tracking-wider text-[#252525] mb-1"
                      >
                        Seu E-mail *
                      </label>
                      <input
                        id="reg-email"
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="w-full rounded-xl border-2 border-[#252525]/25 bg-white px-3.5 py-2.5 text-sm font-semibold text-[#252525]"
                      />
                    </div>
                  </div>

                  {/* Estado Civil e Nome do Cônjuge */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="reg-marital"
                        className="block text-xs font-black uppercase tracking-wider text-[#252525] mb-1"
                      >
                        Estado Civil
                      </label>
                      <select
                        id="reg-marital"
                        value={regMaritalStatus}
                        onChange={(e) => setRegMaritalStatus(e.target.value as MaritalStatus)}
                        className="w-full rounded-xl border-2 border-[#252525]/25 bg-white px-3.5 py-2.5 text-sm font-semibold text-[#252525]"
                      >
                        {MARITAL_STATUS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    {regMaritalStatus === "Casado(a)" && (
                      <div>
                        <label
                          htmlFor="reg-spouse"
                          className="block text-xs font-black uppercase tracking-wider text-[#252525] mb-1"
                        >
                          Nome do Cônjuge
                        </label>
                        <input
                          id="reg-spouse"
                          type="text"
                          value={regSpouseName}
                          onChange={(e) => setRegSpouseName(e.target.value)}
                          placeholder="Nome do esposo(a)"
                          className="w-full rounded-xl border-2 border-[#252525]/25 bg-white px-3.5 py-2.5 text-sm font-semibold text-[#252525]"
                        />
                      </div>
                    )}
                  </div>

                  {/* Endereço Residencial */}
                  {/* Endereço Residencial com busca por CEP */}
                  <div className="pt-2 border-t border-[#252525]/15 space-y-2">
                    <span className="block text-xs font-black uppercase tracking-wider text-[#CB4B3B]">
                      Endereço da Família
                    </span>

                    {/* Campo de CEP com busca */}
                    <div>
                      <label
                        htmlFor="reg-cep"
                        className="block text-[11px] font-bold text-[#252525]/80 mb-1"
                      >
                        Buscar Endereço por CEP
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="reg-cep"
                          type="text"
                          value={regCep}
                          onChange={(e) => {
                            const formatted = formatCEP(e.target.value);
                            setRegCep(formatted);
                            if (cleanDigits(formatted).length === 8) {
                              handleLookupCepReg(formatted);
                            }
                          }}
                          placeholder="00000-000"
                          maxLength={9}
                          className="w-40 rounded-xl border-2 border-[#252525]/25 bg-white px-3 py-2 text-xs font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() => handleLookupCepReg(regCep)}
                          disabled={isSearchingCepReg}
                          className="px-4 py-2 rounded-xl bg-[#252525] hover:bg-[#3D3D3D] text-[#DCDACF] text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-1.5 shrink-0"
                        >
                          <Search className="w-3.5 h-3.5" />
                          <span>{isSearchingCepReg ? "Buscando..." : "Buscar CEP"}</span>
                        </button>
                      </div>
                      {cepErrorReg && (
                        <p className="text-[11px] text-[#CB4B3B] font-bold mt-1">
                          {cepErrorReg}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <input
                          type="text"
                          required
                          value={regStreet}
                          onChange={(e) => setRegStreet(e.target.value)}
                          placeholder="Rua / Avenida *"
                          className="w-full rounded-xl border-2 border-[#252525]/25 bg-white px-3 py-2 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <input
                          id="reg-number"
                          type="text"
                          required
                          value={regNumber}
                          onChange={(e) => setRegNumber(e.target.value)}
                          placeholder="Nº *"
                          className="w-full rounded-xl border-2 border-[#252525]/25 bg-white px-3 py-2 text-xs font-semibold"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <input
                          type="text"
                          value={regComplement}
                          onChange={(e) => setRegComplement(e.target.value)}
                          placeholder="Apto/Casa (opt)"
                          className="w-full rounded-xl border-2 border-[#252525]/25 bg-white px-3 py-2 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          required
                          value={regNeighborhood}
                          onChange={(e) => setRegNeighborhood(e.target.value)}
                          placeholder="Bairro *"
                          className="w-full rounded-xl border-2 border-[#252525]/25 bg-white px-3 py-2 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          required
                          value={regCity}
                          onChange={(e) => setRegCity(e.target.value)}
                          placeholder="Cidade *"
                          className="w-full rounded-xl border-2 border-[#252525]/25 bg-white px-3 py-2 text-xs font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SEÇÃO 2: RELACIONAMENTO COM A IGREJA */}
                  <div className="pt-4 border-t-2 border-[#252525]/15 space-y-4">
                    <div className="flex items-center gap-2.5 pb-2 border-b border-[#252525]/15">
                      <span className="w-6 h-6 rounded-md bg-[#CB4B3B] text-white flex items-center justify-center font-black text-xs shrink-0">
                        2
                      </span>
                      <h3 className="text-sm font-black uppercase tracking-wide text-[#252525]">
                        Relacionamento com a Igreja
                      </h3>
                    </div>

                    {/* Pergunta 1: Relação atual */}
                    <div className="space-y-2">
                      <label className="block text-xs font-black uppercase tracking-wider text-[#252525]">
                        Qual é sua relação atual com a Igreja do Alto? *
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {CHURCH_RELATIONSHIP.map((rel) => {
                          const isSelected = regRelationship === rel;
                          return (
                            <button
                              key={rel}
                              type="button"
                              onClick={() => setRegRelationship(rel)}
                              className={`flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all ${
                                isSelected
                                  ? "border-[#CB4B3B] bg-white shadow-sm ring-1 ring-[#CB4B3B]"
                                  : "border-[#252525]/20 bg-white/70 hover:bg-white hover:border-[#252525]/40"
                              }`}
                            >
                              <div
                                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? "border-[#CB4B3B] bg-[#CB4B3B]"
                                    : "border-[#252525]/40 bg-white"
                                }`}
                              >
                                {isSelected && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                )}
                              </div>
                              <span
                                className={`text-xs font-bold leading-tight ${
                                  isSelected ? "text-[#252525]" : "text-[#252525]/85"
                                }`}
                              >
                                {rel}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Pergunta 2: Tempo de frequência */}
                    <div className="space-y-2 pt-2">
                      <label className="block text-xs font-black uppercase tracking-wider text-[#252525]">
                        Há quanto tempo frequenta a Igreja do Alto?
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {ATTENDANCE_TIME.map((time) => {
                          const isSelected = regAttendanceTime === time;
                          return (
                            <button
                              key={time}
                              type="button"
                              onClick={() => setRegAttendanceTime(time)}
                              className={`flex items-center gap-2.5 p-2.5 rounded-2xl border-2 text-left transition-all ${
                                isSelected
                                  ? "border-[#CB4B3B] bg-white shadow-sm ring-1 ring-[#CB4B3B]"
                                  : "border-[#252525]/20 bg-white/70 hover:bg-white hover:border-[#252525]/40"
                              }`}
                            >
                              <div
                                className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? "border-[#CB4B3B] bg-[#CB4B3B]"
                                    : "border-[#252525]/40 bg-white"
                                }`}
                              >
                                {isSelected && (
                                  <div className="w-1 h-1 rounded-full bg-white" />
                                )}
                              </div>
                              <span
                                className={`text-[11px] font-bold leading-tight ${
                                  isSelected ? "text-[#252525]" : "text-[#252525]/80"
                                }`}
                              >
                                {time}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Pergunta 3: Participa de atividade */}
                    <div className="space-y-2 pt-2">
                      <label className="block text-xs font-black uppercase tracking-wider text-[#252525]">
                        Participa de alguma Casa do Alto, ministério ou atividade da igreja?
                      </label>
                      <div className="grid grid-cols-2 gap-2 max-w-xs">
                        {(["Sim", "Não"] as const).map((opt) => {
                          const isSelected = regParticipates === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setRegParticipates(opt)}
                              className={`flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all ${
                                isSelected
                                  ? "border-[#CB4B3B] bg-white shadow-sm ring-1 ring-[#CB4B3B]"
                                  : "border-[#252525]/20 bg-white/70 hover:bg-white hover:border-[#252525]/40"
                              }`}
                            >
                              <div
                                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? "border-[#CB4B3B] bg-[#CB4B3B]"
                                    : "border-[#252525]/40 bg-white"
                                }`}
                              >
                                {isSelected && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                )}
                              </div>
                              <span
                                className={`text-xs font-bold ${
                                  isSelected ? "text-[#252525]" : "text-[#252525]/85"
                                }`}
                              >
                                {opt}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Pergunta 4 (condicional se Sim): Qual? */}
                    {regParticipates === "Sim" && (
                      <div className="space-y-1.5 pt-1">
                        <label className="block text-xs font-black uppercase tracking-wider text-[#252525]">
                          Se sim: qual?
                        </label>
                        <input
                          type="text"
                          value={regActivityName}
                          onChange={(e) => setRegActivityName(e.target.value)}
                          placeholder="Informe qual Casa do Alto, ministério ou atividade participa"
                          className="w-full rounded-2xl border-2 border-[#252525]/25 bg-white p-3 text-xs sm:text-sm font-semibold text-[#252525]"
                        />
                      </div>
                    )}
                  </div>

                  {/* Senha e Confirmação */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#252525]/15">
                    <div>
                      <label
                        htmlFor="reg-pass"
                        className="block text-xs font-black uppercase tracking-wider text-[#252525] mb-1"
                      >
                        Criar Senha de Acesso *
                      </label>
                      <input
                        id="reg-pass"
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Mínimo 4 dígitos"
                        className="w-full rounded-xl border-2 border-[#252525]/25 bg-white px-3.5 py-2.5 text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="reg-pass-conf"
                        className="block text-xs font-black uppercase tracking-wider text-[#252525] mb-1"
                      >
                        Confirmar Senha *
                      </label>
                      <input
                        id="reg-pass-conf"
                        type="password"
                        required
                        value={regPasswordConfirm}
                        onChange={(e) => setRegPasswordConfirm(e.target.value)}
                        placeholder="Repita a senha"
                        className="w-full rounded-xl border-2 border-[#252525]/25 bg-white px-3.5 py-2.5 text-sm font-semibold"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isAuthLoading}
                    className="w-full py-4 rounded-xl bg-[#CB4B3B] hover:bg-[#A93829] text-[#DCDACF] font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg transition-colors flex items-center justify-center gap-2 mt-4"
                  >
                    {isAuthLoading ? (
                      <span>Salvando cadastro...</span>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Concluir Cadastro & Entrar</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </main>

        {/* Rodapé */}
        <footer className="bg-[#252525] text-[#DCDACF]/75 py-4 border-t border-[#CB4B3B]/40 text-center text-xs font-bold uppercase tracking-wider">
          <span>Igreja do Alto — Lugar de Proteção, Provisão e Direção</span>
        </footer>
      </div>
    );
  }

  const filteredMembers = allMembers.filter((m) => {
    const q = memberSearchQuery.toLowerCase().trim();
    const cleanQ = cleanDigits(q);
    const matchesQuery =
      !q ||
      m.name.toLowerCase().includes(q) ||
      (m.cpf && cleanDigits(m.cpf).includes(cleanQ)) ||
      (m.phone && m.phone.includes(q)) ||
      (m.email && m.email.toLowerCase().includes(q));

    if (!matchesQuery) return false;

    if (memberFilterCategory === "membros") {
      return m.relationship === "Membro" || m.isOfficialMember;
    }
    if (memberFilterCategory === "pastores") {
      return Boolean(
        m.isPastor || m.portalRole === "pastor" || m.portalRole === "admin"
      );
    }
    if (memberFilterCategory === "admins") {
      return Boolean(m.isAdmin || m.portalRole === "admin");
    }
    if (memberFilterCategory === "visitantes") {
      return m.relationship !== "Membro";
    }
    return true;
  });

  const filteredReports = allReports.filter((r) => {
    if (!session?.isAdmin && session?.name) {
      const pName = session.name.toLowerCase();
      const hasPastor = (r.visitors || []).some(
        (v) => v.toLowerCase().includes(pName) || pName.includes(v.toLowerCase())
      );
      if (!hasPastor) {
        return false;
      }
    }

    if (session?.isAdmin && visitedPastorFilter !== "todos") {
      const matchesPastor = (r.visitors || []).some(
        (v) => v === visitedPastorFilter
      );
      if (!matchesPastor) return false;
    }

    const q = visitedSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (r.memberName && r.memberName.toLowerCase().includes(q)) ||
      (r.summary && r.summary.toLowerCase().includes(q)) ||
      (r.visitors && r.visitors.some((v) => v.toLowerCase().includes(q)))
    );
  });

  // =========================================================================
  // TELA LOGADO: PORTAL DO MEMBRO & NÚCLEO FAMILIAR
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#DCDACF] flex flex-col justify-between text-[#252525]">
      {/* Top Header do Portal */}
      <header className="bg-[#252525] text-[#DCDACF] border-b-4 border-[#CB4B3B] sticky top-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BrandLogo variant="on-dark2" size="sm" />
            <span className="hidden sm:inline-block w-px h-6 bg-[#DCDACF]/20" />
            <span className="text-xs font-black uppercase tracking-wider text-[#CB4B3B]">
              Portal do Membro
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="flex items-center justify-end gap-2">
                <span className="block text-xs font-black uppercase text-white">
                  {session.name}
                </span>
                {session.isAdmin ? (
                  <span className="px-2 py-0.5 rounded-full bg-[#CB4B3B] text-white text-[10px] font-black uppercase tracking-wider">
                    👑 Admin
                  </span>
                ) : session.isPastor ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider">
                    🤝 Pastor
                  </span>
                ) : null}
              </div>
              <span className="block text-[11px] font-bold text-[#DCDACF]/70">
                {session.cpf ? `CPF: ${formatCPF(session.cpf)}` : session.email || ""}
              </span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#363636] hover:bg-[#CB4B3B] text-[#DCDACF] text-xs font-bold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>

        {/* Barra de Navegação das Abas do Membro */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {(() => {
            const tabs: {
              id: ActiveTab;
              label: string;
              icon: any;
            }[] = [];

            if (session.isAdmin || session.isPastor) {
              tabs.push({
                id: "todos-membros",
                label: `Todos os Membros (${allMembers.length})`,
                icon: Users,
              });
              tabs.push({
                id: "visitas-cuidado",
                label: "Visitas por Pessoas",
                icon: ClipboardCheck,
              });
            }

            if (session.isAdmin) {
              tabs.push({
                id: "gestao-pastores",
                label: `Gestão de Pastores (${pastorsList.length})`,
                icon: Crown,
              });
            }

            tabs.push({
              id: "familia",
              label: `Minha Família (${dependents.length + (spouseData ? 2 : 1)})`,
              icon: Home,
            });
            tabs.push({
              id: "solicitar-visita",
              label: "Solicitar Visita",
              icon: HeartHandshake,
            });
            tabs.push({
              id: "minhas-solicitacoes",
              label: `Minhas Solicitações (${myRequests.length})`,
              icon: Heart,
            });
            tabs.push({
              id: "meu-cadastro",
              label: "Meu Cadastro",
              icon: User,
            });

            return tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-[#CB4B3B] text-[#DCDACF] shadow"
                      : "text-[#DCDACF]/80 hover:bg-[#363636] hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            });
          })()}
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {adminFeedback && (
          <div
            className={`p-4 rounded-2xl border-2 flex items-center justify-between gap-3 text-xs sm:text-sm font-bold ${
              adminFeedback.type === "success"
                ? "bg-emerald-950 text-[#DCDACF] border-emerald-600"
                : "bg-[#F9EAE8] text-[#A93829] border-[#CB4B3B]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {adminFeedback.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-[#CB4B3B] shrink-0" />
              )}
              <span>{adminFeedback.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setAdminFeedback(null)}
              className="text-current opacity-70 hover:opacity-100 p-1"
              title="Fechar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ===================================================================
            ABA 1: MINHA FAMÍLIA (Cônjuge + Filhos < 16 anos)
           =================================================================== */}
        {activeTab === "familia" && (
          <div className="space-y-6">
            {/* Banner do Núcleo Familiar */}
            <div className="rounded-3xl bg-[#F4F3EE] p-6 sm:p-8 shadow-md border border-[#252525]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#CB4B3B]">
                  Núcleo Familiar Registrado
                </span>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#252525] mt-1">
                  Família {memberData?.spouseName ? `${memberData.name.split(" ")[0]} & ${memberData.spouseName.split(" ")[0]}` : memberData?.name}
                </h2>
                <p className="text-xs sm:text-sm text-[#252525]/75 font-medium mt-1">
                  {formatAddress(memberData?.address)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab("solicitar-visita")}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#CB4B3B] hover:bg-[#A93829] text-[#DCDACF] text-xs font-black uppercase tracking-wider shadow transition-colors"
              >
                <HeartHandshake className="w-4 h-4" />
                <span>Solicitar Visita para Nossa Casa</span>
              </button>
            </div>

            {/* SEÇÃO: CÔNJUGE (Marido & Esposa) */}
            <div className="rounded-3xl bg-[#F4F3EE] p-6 shadow-md border border-[#252525]/10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#252525]/15">
                <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-[#252525]">
                  <Heart className="w-5 h-5 text-[#CB4B3B]" />
                  <span>Vínculo de Cônjuge (Marido / Esposa)</span>
                </div>
                {spouseData && (
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-black uppercase tracking-wider">
                    ✓ Vínculo Ativo
                  </span>
                )}
              </div>

              {spouseData ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-white border-2 border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-lg">
                        {spouseData.name.charAt(0)}
                      </div>
                      <div>
                        <strong className="block text-base font-black text-[#252525]">
                          {spouseData.name}
                        </strong>
                        <span className="block text-xs font-semibold text-[#252525]/70">
                          {spouseData.phone} {spouseData.email ? `• ${spouseData.email}` : ""}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[#252525]/60 bg-[#F4F3EE] px-3 py-1.5 rounded-xl border border-[#252525]/10">
                        Compartilha o mesmo lar e filhos
                      </span>
                      <button
                        type="button"
                        onClick={handleUnlinkSpouse}
                        disabled={isUnlinkingSpouse}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-black uppercase tracking-wider transition-colors shadow-sm"
                        title="Desvincular cônjuge deste núcleo familiar"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>{isUnlinkingSpouse ? "Desvinculando..." : "Desvincular Cônjuge"}</span>
                      </button>
                    </div>
                  </div>

                  {spouseLinkMessage && (
                    <div
                      className={`p-3 rounded-xl text-xs font-bold border ${
                        spouseLinkMessage.type === "success"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                          : "bg-[#F9EAE8] text-[#A93829] border-[#CB4B3B]"
                      }`}
                    >
                      {spouseLinkMessage.text}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs sm:text-sm text-[#252525]/80 font-medium leading-relaxed">
                    Vincule o cadastro do seu esposo(a) digitando o <strong>CPF</strong> ou <strong>E-mail</strong> dele(a). Ao vincular, vocês compartilharão o mesmo núcleo familiar e a lista de filhos no cuidado pastoral.
                  </p>

                  <form onSubmit={handleLinkSpouse} className="flex flex-col sm:flex-row gap-2 max-w-xl">
                    <input
                      type="text"
                      required
                      value={spouseIdentifier}
                      onChange={(e) => setSpouseIdentifier(e.target.value)}
                      placeholder="CPF ou E-mail do cônjuge cadastrado"
                      className="flex-1 rounded-xl border-2 border-[#252525]/25 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold"
                    />
                    <button
                      type="submit"
                      disabled={isLinkingSpouse}
                      className="px-5 py-2.5 rounded-xl bg-[#252525] hover:bg-[#CB4B3B] text-[#DCDACF] text-xs font-black uppercase tracking-wider transition-colors shadow shrink-0"
                    >
                      {isLinkingSpouse ? "Vinculando..." : "Vincular Cônjuge"}
                    </button>
                  </form>

                  {spouseLinkMessage && (
                    <div
                      className={`p-3 rounded-xl text-xs font-bold border ${
                        spouseLinkMessage.type === "success"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                          : "bg-[#F9EAE8] text-[#A93829] border-[#CB4B3B]"
                      }`}
                    >
                      {spouseLinkMessage.text}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SEÇÃO: FILHOS E DEPENDENTES (< 16 ANOS) */}
            <div className="rounded-3xl bg-[#F4F3EE] p-6 shadow-md border border-[#252525]/10 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#252525]/15">
                <div>
                  <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-[#252525]">
                    <Baby className="w-5 h-5 text-[#CB4B3B]" />
                    <span>Filhos e Dependentes ({dependents.length})</span>
                  </div>
                  <p className="text-xs text-[#252525]/70 font-semibold mt-0.5">
                    Menores de 16 anos cadastrados no perfil dos pais (sem obrigatoriedade de CPF).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddDepOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#252525] hover:bg-[#CB4B3B] text-[#DCDACF] text-xs font-black uppercase tracking-wider transition-colors shadow"
                >
                  <Plus className="w-4 h-4 text-[#CB4B3B]" />
                  <span>Adicionar Filho(a)</span>
                </button>
              </div>

              {dependents.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-white border-2 border-dashed border-[#252525]/20 space-y-2">
                  <Baby className="w-8 h-8 text-[#CB4B3B] mx-auto" />
                  <p className="text-sm font-bold text-[#252525]">
                    Nenhum filho ou dependente cadastrado ainda.
                  </p>
                  <p className="text-xs text-[#252525]/70 max-w-md mx-auto font-medium">
                    Cadastre seus filhos para que a liderança pastoral e o Ministério Infantil conheçam e orem pela sua família.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dependents.map((dep) => {
                    const age = calculateAge(dep.birthDate);
                    const is16OrOlder = age !== null && age >= 16;

                    return (
                      <div
                        key={dep.id}
                        className={`p-4 rounded-2xl bg-white border-2 transition-all space-y-3 ${
                          is16OrOlder
                            ? "border-amber-500/50 bg-amber-50/20"
                            : "border-[#252525]/15"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#CB4B3B]/15 text-[#CB4B3B]">
                              {dep.relationship}
                            </span>
                            <h3 className="text-base font-black text-[#252525] mt-1">
                              {dep.fullName}
                            </h3>
                            <span className="text-xs font-bold text-[#252525]/70">
                              {age !== null ? `${age} anos` : "Idade não informada"} • Nasc: {formatDateBR(dep.birthDate)}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveDependent(dep.id, dep.fullName)}
                            title="Remover dependente"
                            className="p-1.5 rounded-lg text-[#252525]/40 hover:text-[#CB4B3B] hover:bg-[#F9EAE8] transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {dep.notes && (
                          <div className="p-2.5 rounded-xl bg-[#F4F3EE] text-xs font-semibold text-[#252525]/80">
                            <strong>Obs / Cuidados:</strong> {dep.notes}
                          </div>
                        )}

                        {is16OrOlder ? (
                          <div className="p-2.5 rounded-xl bg-amber-100 border border-amber-300 text-[11px] font-bold text-amber-900 leading-tight">
                            ✨ <strong>Completou 16 anos!</strong> Este jovem já pode criar seu acesso oficial próprio no portal com seu CPF.
                          </div>
                        ) : (
                          <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#252525]/50">
                            Dependente Familiar Oficial
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================
            ABA 2: SOLICITAR VISITA PASTORAL (EXPRESSA)
           =================================================================== */}
        {activeTab === "solicitar-visita" && (
          <div className="max-w-3xl mx-auto rounded-3xl bg-[#F4F3EE] shadow-xl border border-[#252525]/15 overflow-hidden">
            <div className="bg-[#252525] text-[#DCDACF] p-6 border-b-4 border-[#CB4B3B]">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#CB4B3B]">
                Cuidado Pastoral em Sua Casa
              </span>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight mt-0.5">
                Solicitar Visita Pastoral para Minha Família
              </h2>
              <p className="text-xs text-[#DCDACF]/80 font-medium mt-1">
                Seus dados cadastrais já estão vinculados. Escolha os motivos e a melhor data para sua família.
              </p>
            </div>

            <div className="p-6 sm:p-8">
              {visitSuccessProtocol ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black uppercase text-[#252525]">
                    Solicitação Enviada com Sucesso!
                  </h3>
                  <p className="text-sm text-[#252525]/85 max-w-md mx-auto font-medium">
                    Sua solicitação foi gravada sob o protocolo <strong>{visitSuccessProtocol}</strong>. A liderança pastoral entrará em contato para confirmar a data.
                  </p>
                  <div className="pt-2 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setVisitSuccessProtocol(null);
                        setActiveTab("minhas-solicitacoes");
                      }}
                      className="px-6 py-3 rounded-xl bg-[#CB4B3B] text-[#DCDACF] font-black text-xs uppercase tracking-wider"
                    >
                      Ver em Minhas Solicitações
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreateVisitRequest} className="space-y-6">
                  {visitError && (
                    <div className="p-3.5 rounded-xl bg-[#F9EAE8] text-[#A93829] border border-[#CB4B3B] text-xs font-bold">
                      {visitError}
                    </div>
                  )}

                  {/* Para quem é a visita? */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#252525] mb-2">
                      Para quem é a visita?
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {["Toda a Família", "Apenas o Casal", "Filho(a) específico"].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setVisitTargetType(opt)}
                          className={`p-3 rounded-xl border-2 text-xs font-black uppercase tracking-wider transition-colors text-center ${
                            visitTargetType === opt
                              ? "bg-[#252525] text-[#DCDACF] border-[#252525]"
                              : "bg-white text-[#252525] border-[#252525]/20 hover:border-[#252525]/40"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>

                    {visitTargetType === "Filho(a) específico" && (
                      <div className="mt-3">
                        <label className="block text-[11px] font-black uppercase text-[#252525]/70 mb-1">
                          Selecione o filho(a):
                        </label>
                        <select
                          value={visitTargetDependent}
                          onChange={(e) => setVisitTargetDependent(e.target.value)}
                          className="w-full rounded-xl border-2 border-[#252525]/25 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold"
                        >
                          <option value="">— Selecione um filho cadastrado —</option>
                          {dependents.map((dep) => (
                            <option key={dep.id} value={dep.fullName}>
                              {dep.fullName} ({dep.relationship})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Motivos da Visita */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#252525] mb-2">
                      Qual o motivo principal da visita? (Pode marcar mais de um)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {REQUEST_REASONS.map((reason) => {
                        const checked = visitReasons.includes(reason);
                        return (
                          <button
                            key={reason}
                            type="button"
                            onClick={() =>
                              setVisitReasons((prev) =>
                                checked
                                  ? prev.filter((r) => r !== reason)
                                  : [...prev, reason]
                              )
                            }
                            className={`p-3 rounded-xl border-2 text-xs font-bold transition-all text-left flex items-center justify-between ${
                              checked
                                ? "border-[#CB4B3B] bg-[#CB4B3B]/10 text-[#252525] font-black"
                                : "border-[#252525]/20 bg-white hover:border-[#252525]/40"
                            }`}
                          >
                            <span>{reason}</span>
                            {checked && <CheckCircle2 className="w-4 h-4 text-[#CB4B3B]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dias e Turnos Preferidos */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-[#252525] mb-1.5">
                        Melhores Dias da Semana
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {WEEK_DAYS.slice(0, 6).map((day) => {
                          const checked = visitDays.includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() =>
                                setVisitDays((prev) =>
                                  checked
                                    ? prev.filter((d) => d !== day)
                                    : [...prev, day]
                                )
                              }
                              className={`p-2 rounded-lg border text-[11px] font-bold transition-colors ${
                                checked
                                  ? "bg-[#252525] text-[#DCDACF] border-[#252525]"
                                  : "bg-white border-[#252525]/20 hover:border-[#252525]/40"
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-[#252525] mb-1.5">
                        Melhor Período
                      </label>
                      <div className="space-y-1.5">
                        {SHIFTS.map((shift) => {
                          const checked = visitShifts.includes(shift);
                          return (
                            <button
                              key={shift}
                              type="button"
                              onClick={() =>
                                setVisitShifts((prev) =>
                                  checked
                                    ? prev.filter((s) => s !== shift)
                                    : [...prev, shift]
                                )
                              }
                              className={`w-full p-2.5 rounded-lg border text-xs font-bold transition-colors text-left flex items-center justify-between ${
                                checked
                                  ? "bg-[#CB4B3B] text-[#DCDACF] border-[#CB4B3B]"
                                  : "bg-white border-[#252525]/20 hover:border-[#252525]/40"
                              }`}
                            >
                              <span>{shift}</span>
                              {checked && <CheckCircle2 className="w-3.5 h-3.5" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Endereço da Visita */}
                  <div className="p-4 rounded-2xl bg-white border-2 border-[#252525]/15 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-[#252525]">
                        Local da Visita
                      </span>
                      <label className="inline-flex items-center gap-1.5 text-xs font-bold text-[#CB4B3B] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useCustomAddress}
                          onChange={(e) => setUseCustomAddress(e.target.checked)}
                          className="w-4 h-4 rounded"
                        />
                        <span>Será em outro endereço (ex: hospital)</span>
                      </label>
                    </div>

                    {!useCustomAddress ? (
                      <p className="text-xs font-semibold text-[#252525]/80">
                        {formatAddress(memberData?.address)}
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 pt-2">
                        <div className="col-span-2">
                          <input
                            type="text"
                            required
                            value={customStreet}
                            onChange={(e) => setCustomStreet(e.target.value)}
                            placeholder="Rua / Hospital"
                            className="w-full rounded-xl border border-[#252525]/30 p-2 text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            required
                            value={customNumber}
                            onChange={(e) => setCustomNumber(e.target.value)}
                            placeholder="Número"
                            className="w-full rounded-xl border border-[#252525]/30 p-2 text-xs font-semibold"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="text"
                            required
                            value={customNeighborhood}
                            onChange={(e) => setCustomNeighborhood(e.target.value)}
                            placeholder="Bairro"
                            className="w-full rounded-xl border border-[#252525]/30 p-2 text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={customCity}
                            onChange={(e) => setCustomCity(e.target.value)}
                            placeholder="Cidade"
                            className="w-full rounded-xl border border-[#252525]/30 p-2 text-xs font-semibold"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mensagem / Observações */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#252525] mb-1">
                      Mensagem ou Pedido de Oração Específico (Opcional)
                    </label>
                    <textarea
                      rows={3}
                      value={visitObservations}
                      onChange={(e) => setVisitObservations(e.target.value)}
                      placeholder="Conte um pouco para os pastores sobre o momento da família ou o motivo da visita..."
                      className="w-full rounded-xl border-2 border-[#252525]/25 bg-white p-3.5 text-xs sm:text-sm font-medium"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingVisit}
                    className="w-full py-4 rounded-xl bg-[#CB4B3B] hover:bg-[#A93829] text-[#DCDACF] font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmittingVisit ? (
                      <span>Enviando solicitação...</span>
                    ) : (
                      <>
                        <HeartHandshake className="w-4 h-4" />
                        <span>Enviar Solicitação de Visita</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================
            ABA 3: MINHAS SOLICITAÇÕES
           =================================================================== */}
        {activeTab === "minhas-solicitacoes" && (
          <div className="space-y-4">
            <div className="rounded-3xl bg-[#F4F3EE] p-6 shadow-md border border-[#252525]/10 flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#CB4B3B]">
                  Histórico Pastoral
                </span>
                <h2 className="text-2xl font-black uppercase text-[#252525]">
                  Solicitações da Família ({myRequests.length})
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab("solicitar-visita")}
                className="px-4 py-2.5 rounded-xl bg-[#CB4B3B] text-[#DCDACF] text-xs font-black uppercase tracking-wider shadow"
              >
                + Nova Solicitação
              </button>
            </div>

            {myRequests.length === 0 ? (
              <div className="p-8 text-center rounded-3xl bg-[#F4F3EE] border-2 border-dashed border-[#252525]/20 space-y-2">
                <ClipboardCheck className="w-8 h-8 text-[#CB4B3B] mx-auto" />
                <p className="text-sm font-bold text-[#252525]">
                  Nenhuma solicitação de visita encontrada para sua família.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("solicitar-visita")}
                  className="text-xs font-extrabold text-[#CB4B3B] hover:underline"
                >
                  Clique aqui para solicitar uma visita pastoral
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myRequests.map((req) => {
                  const statMeta = STATUS_META[req.status] || STATUS_META.pendente;
                  return (
                    <div
                      key={req.id}
                      className="p-5 rounded-3xl bg-[#F4F3EE] shadow-md border border-[#252525]/10 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${statMeta.badgeClass}`}
                        >
                          {statMeta.label}
                        </span>
                        <span className="text-xs font-semibold text-[#252525]/60">
                          Solicitado em {formatDateBR(req.createdAt)} • Protocolo: {req.id}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {(req.reasons || []).map((r) => (
                          <span
                            key={r}
                            className="px-2.5 py-0.5 rounded-md bg-[#CB4B3B]/15 text-[#CB4B3B] text-xs font-bold"
                          >
                            {r}
                          </span>
                        ))}
                      </div>

                      {req.observations && (
                        <p className="text-xs text-[#252525]/85 italic bg-white p-3 rounded-xl border border-[#252525]/10">
                          “{req.observations}”
                        </p>
                      )}

                      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-[#252525]/75 border-t border-[#252525]/10">
                        <span>Local: {formatAddress(req.address)}</span>
                        {req.assignedPastor && (
                          <span className="text-[#CB4B3B] font-black">
                            Pastor Designado: {req.assignedPastor}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
            ABA 4: MEU CADASTRO
           =================================================================== */}
        {activeTab === "meu-cadastro" && memberData && (
          <div className="max-w-2xl mx-auto rounded-3xl bg-[#F4F3EE] p-6 sm:p-8 shadow-xl border border-[#252525]/15 space-y-6">
            <div className="pb-3 border-b border-[#252525]/15 flex items-center justify-between flex-wrap gap-3">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#CB4B3B]">
                  Dados Cadastrais
                </span>
                <h2 className="text-2xl font-black uppercase text-[#252525]">
                  Meu Perfil de Membro
                </h2>
              </div>

              {!isEditingProfile && (
                <button
                  type="button"
                  onClick={startEditingProfile}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#252525] hover:bg-[#3D3D3D] text-[#DCDACF] text-xs font-black uppercase tracking-wider transition-colors shadow"
                >
                  <Edit3 className="w-4 h-4 text-[#EBD57B]" />
                  <span>Editar Cadastro</span>
                </button>
              )}
            </div>

            {editSuccess && (
              <div className="p-3.5 rounded-xl bg-[#E8F3EB] border border-[#2D7A46]/30 text-[#2D7A46] text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{editSuccess}</span>
              </div>
            )}

            {!isEditingProfile ? (
              /* MODO VISUALIZAÇÃO */
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-[#252525]">
                  <div className="p-3.5 rounded-xl bg-white border border-[#252525]/10">
                    <span className="block text-[10px] font-black uppercase text-[#252525]/60 mb-0.5">
                      Nome Completo
                    </span>
                    <strong className="text-sm font-black">{memberData.name}</strong>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-[#252525]/10">
                    <span className="block text-[10px] font-black uppercase text-[#252525]/60 mb-0.5">
                      CPF (Chave Única)
                    </span>
                    <strong className="text-sm font-black">{formatCPF(memberData.cpf)}</strong>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-[#252525]/10">
                    <span className="block text-[10px] font-black uppercase text-[#252525]/60 mb-0.5">
                      E-mail de Acesso
                    </span>
                    <strong className="text-sm font-black">{memberData.email || "Não informado"}</strong>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-[#252525]/10">
                    <span className="block text-[10px] font-black uppercase text-[#252525]/60 mb-0.5">
                      Telefone / WhatsApp
                    </span>
                    <strong className="text-sm font-black">{memberData.phone}</strong>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-[#252525]/10">
                    <span className="block text-[10px] font-black uppercase text-[#252525]/60 mb-0.5">
                      Data de Nascimento
                    </span>
                    <strong className="text-sm font-black">
                      {formatDateBR(memberData.birthDate)}{" "}
                      {calculateAge(memberData.birthDate)
                        ? `(${calculateAge(memberData.birthDate)} anos)`
                        : ""}
                    </strong>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-[#252525]/10">
                    <span className="block text-[10px] font-black uppercase text-[#252525]/60 mb-0.5">
                      Estado Civil
                    </span>
                    <strong className="text-sm font-black">
                      {memberData.maritalStatus || "Não informado"}
                      {memberData.spouseName ? ` • ${memberData.spouseName}` : ""}
                    </strong>
                  </div>

                  <div className="sm:col-span-2 p-3.5 rounded-xl bg-white border border-[#252525]/10">
                    <span className="block text-[10px] font-black uppercase text-[#252525]/60 mb-0.5">
                      Endereço Residencial
                    </span>
                    <strong className="text-sm font-black">{formatAddress(memberData.address)}</strong>
                  </div>
                </div>

                {/* Bloco de Relacionamento com a Igreja em Visualização */}
                <div className="p-4 rounded-2xl bg-white border border-[#252525]/15 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#252525]/10">
                    <span className="w-5 h-5 rounded-md bg-[#CB4B3B] text-white flex items-center justify-center font-black text-[11px] shrink-0">
                      2
                    </span>
                    <h3 className="text-xs font-black uppercase tracking-wide text-[#252525]">
                      Relacionamento com a Igreja
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold text-[#252525]">
                    <div>
                      <span className="block text-[10px] font-black uppercase text-[#252525]/60 mb-0.5">
                        Relação com a Igreja
                      </span>
                      <strong className="text-sm font-black text-[#CB4B3B]">
                        {memberData.relationship || "Membro"}
                      </strong>
                    </div>

                    <div>
                      <span className="block text-[10px] font-black uppercase text-[#252525]/60 mb-0.5">
                        Tempo de Frequência
                      </span>
                      <strong className="text-sm font-black">
                        {memberData.attendanceTime || "Não informado"}
                      </strong>
                    </div>

                    <div className="sm:col-span-2">
                      <span className="block text-[10px] font-black uppercase text-[#252525]/60 mb-0.5">
                        Casa do Alto, Ministério ou Atividade
                      </span>
                      <strong className="text-sm font-black">
                        {memberData.participatesInActivity
                          ? memberData.activityName
                            ? `Sim • ${memberData.activityName}`
                            : "Sim"
                          : "Não participa"}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* MODO EDIÇÃO */
              <form onSubmit={handleSaveProfile} className="space-y-5 text-xs font-semibold text-[#252525]">
                {editError && (
                  <div className="p-3.5 rounded-xl bg-[#F9EAE8] border border-[#CB4B3B] text-[#A93829] font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{editError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full rounded-xl border-2 border-[#252525]/25 bg-white p-3 text-sm font-semibold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider mb-1">
                      CPF (Chave Única)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={formatCPF(memberData.cpf)}
                      className="w-full rounded-xl border border-[#252525]/15 bg-[#252525]/5 p-3 text-sm font-bold text-[#252525]/60 cursor-not-allowed"
                      title="O CPF não pode ser alterado por ser sua chave única oficial."
                    />
                    <span className="block text-[10px] text-[#252525]/50 mt-1">
                      Chave única inalterável.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider mb-1">
                      E-mail de Acesso *
                    </label>
                    <input
                      type="email"
                      required
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="seu.email@exemplo.com"
                      className="w-full rounded-xl border-2 border-[#252525]/25 bg-white p-3 text-sm font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider mb-1">
                      Telefone / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={editPhone}
                      onChange={(e) => setEditPhone(formatPhoneBR(e.target.value))}
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                      className="w-full rounded-xl border-2 border-[#252525]/25 bg-white p-3 text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider mb-1">
                      Data de Nascimento
                    </label>
                    <input
                      type="date"
                      value={editBirthDate}
                      onChange={(e) => setEditBirthDate(e.target.value)}
                      className="w-full rounded-xl border-2 border-[#252525]/25 bg-white p-3 text-sm font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider mb-1">
                      Estado Civil
                    </label>
                    <select
                      value={editMaritalStatus}
                      onChange={(e) => setEditMaritalStatus(e.target.value as MaritalStatus)}
                      className="w-full rounded-xl border-2 border-[#252525]/25 bg-white p-3 text-sm font-semibold"
                    >
                      {MARITAL_STATUS.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  {editMaritalStatus === "Casado(a)" && (
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider mb-1">
                        Nome do Cônjuge
                      </label>
                      <input
                        type="text"
                        value={editSpouseName}
                        onChange={(e) => setEditSpouseName(e.target.value)}
                        placeholder="Nome do esposo(a)"
                        className="w-full rounded-xl border-2 border-[#252525]/25 bg-white p-3 text-sm font-semibold"
                      />
                    </div>
                  )}
                </div>

                {/* ENDEREÇO RESIDENCIAL */}
                <div className="pt-3 border-t border-[#252525]/15 space-y-3">
                  <span className="block text-xs font-black uppercase tracking-wider text-[#CB4B3B]">
                    Endereço Residencial
                  </span>

                  {/* Campo de CEP com busca */}
                  <div>
                    <label
                      htmlFor="edit-cep"
                      className="block text-[11px] font-bold text-[#252525]/80 mb-1"
                    >
                      Buscar Endereço por CEP
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="edit-cep"
                        type="text"
                        value={editCep}
                        onChange={(e) => {
                          const formatted = formatCEP(e.target.value);
                          setEditCep(formatted);
                          if (cleanDigits(formatted).length === 8) {
                            handleLookupCepEdit(formatted);
                          }
                        }}
                        placeholder="00000-000"
                        maxLength={9}
                        className="w-40 rounded-xl border-2 border-[#252525]/25 bg-white p-2.5 text-xs font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() => handleLookupCepEdit(editCep)}
                        disabled={isSearchingCepEdit}
                        className="px-4 py-2 rounded-xl bg-[#252525] hover:bg-[#3D3D3D] text-[#DCDACF] text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-1.5 shrink-0"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>{isSearchingCepEdit ? "Buscando..." : "Buscar CEP"}</span>
                      </button>
                    </div>
                    {cepErrorEdit && (
                      <p className="text-[11px] text-[#CB4B3B] font-bold mt-1">
                        {cepErrorEdit}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-[#252525]/80 mb-1">
                        Logradouro (Rua / Av.)
                      </label>
                      <input
                        type="text"
                        value={editStreet}
                        onChange={(e) => setEditStreet(e.target.value)}
                        placeholder="Ex: Rua das Flores"
                        className="w-full rounded-xl border-2 border-[#252525]/25 bg-white p-2.5 text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#252525]/80 mb-1">
                        Número
                      </label>
                      <input
                        id="edit-number"
                        type="text"
                        value={editNumber}
                        onChange={(e) => setEditNumber(e.target.value)}
                        placeholder="123"
                        className="w-full rounded-xl border-2 border-[#252525]/25 bg-white p-2.5 text-sm font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#252525]/80 mb-1">
                        Complemento
                      </label>
                      <input
                        type="text"
                        value={editComplement}
                        onChange={(e) => setEditComplement(e.target.value)}
                        placeholder="Apto 42, Bloco B"
                        className="w-full rounded-xl border-2 border-[#252525]/25 bg-white p-2.5 text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#252525]/80 mb-1">
                        Bairro
                      </label>
                      <input
                        type="text"
                        value={editNeighborhood}
                        onChange={(e) => setEditNeighborhood(e.target.value)}
                        placeholder="Centro"
                        className="w-full rounded-xl border-2 border-[#252525]/25 bg-white p-2.5 text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#252525]/80 mb-1">
                        Cidade
                      </label>
                      <input
                        type="text"
                        value={editCity}
                        onChange={(e) => setEditCity(e.target.value)}
                        placeholder="Mogi das Cruzes"
                        className="w-full rounded-xl border-2 border-[#252525]/25 bg-white p-2.5 text-sm font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* SEÇÃO 2: RELACIONAMENTO COM A IGREJA */}
                <div className="pt-4 border-t-2 border-[#252525]/15 space-y-4">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-[#252525]/15">
                    <span className="w-6 h-6 rounded-md bg-[#CB4B3B] text-white flex items-center justify-center font-black text-xs shrink-0">
                      2
                    </span>
                    <h3 className="text-sm font-black uppercase tracking-wide text-[#252525]">
                      Relacionamento com a Igreja
                    </h3>
                  </div>

                  {/* Pergunta 1: Relação atual */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-[#252525]">
                      Qual é sua relação atual com a Igreja do Alto? *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {CHURCH_RELATIONSHIP.map((rel) => {
                        const isSelected = editRelationship === rel;
                        return (
                          <button
                            key={rel}
                            type="button"
                            onClick={() => setEditRelationship(rel)}
                            className={`flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all ${
                              isSelected
                                ? "border-[#CB4B3B] bg-white shadow-sm ring-1 ring-[#CB4B3B]"
                                : "border-[#252525]/20 bg-white/70 hover:bg-white hover:border-[#252525]/40"
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? "border-[#CB4B3B] bg-[#CB4B3B]"
                                  : "border-[#252525]/40 bg-white"
                              }`}
                            >
                              {isSelected && (
                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                              )}
                            </div>
                            <span
                              className={`text-xs font-bold leading-tight ${
                                isSelected ? "text-[#252525]" : "text-[#252525]/85"
                              }`}
                            >
                              {rel}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pergunta 2: Tempo de frequência */}
                  <div className="space-y-2 pt-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-[#252525]">
                      Há quanto tempo frequenta a Igreja do Alto?
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {ATTENDANCE_TIME.map((time) => {
                        const isSelected = editAttendanceTime === time;
                        return (
                          <button
                            key={time}
                            type="button"
                            onClick={() => setEditAttendanceTime(time)}
                            className={`flex items-center gap-2.5 p-2.5 rounded-2xl border-2 text-left transition-all ${
                              isSelected
                                ? "border-[#CB4B3B] bg-white shadow-sm ring-1 ring-[#CB4B3B]"
                                : "border-[#252525]/20 bg-white/70 hover:bg-white hover:border-[#252525]/40"
                            }`}
                          >
                            <div
                              className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? "border-[#CB4B3B] bg-[#CB4B3B]"
                                  : "border-[#252525]/40 bg-white"
                              }`}
                            >
                              {isSelected && (
                                <div className="w-1 h-1 rounded-full bg-white" />
                              )}
                            </div>
                            <span
                              className={`text-[11px] font-bold leading-tight ${
                                isSelected ? "text-[#252525]" : "text-[#252525]/80"
                              }`}
                            >
                              {time}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pergunta 3: Participa de atividade */}
                  <div className="space-y-2 pt-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-[#252525]">
                      Participa de alguma Casa do Alto, ministério ou atividade da igreja?
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-w-xs">
                      {(["Sim", "Não"] as const).map((opt) => {
                        const isSelected = editParticipates === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setEditParticipates(opt)}
                            className={`flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all ${
                              isSelected
                                ? "border-[#CB4B3B] bg-white shadow-sm ring-1 ring-[#CB4B3B]"
                                : "border-[#252525]/20 bg-white/70 hover:bg-white hover:border-[#252525]/40"
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? "border-[#CB4B3B] bg-[#CB4B3B]"
                                  : "border-[#252525]/40 bg-white"
                              }`}
                            >
                              {isSelected && (
                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                              )}
                            </div>
                            <span
                              className={`text-xs font-bold ${
                                isSelected ? "text-[#252525]" : "text-[#252525]/85"
                              }`}
                            >
                              {opt}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pergunta 4 (condicional se Sim): Qual? */}
                  {editParticipates === "Sim" && (
                    <div className="space-y-1.5 pt-1">
                      <label className="block text-xs font-black uppercase tracking-wider text-[#252525]">
                        Se sim: qual?
                      </label>
                      <input
                        type="text"
                        value={editActivityName}
                        onChange={(e) => setEditActivityName(e.target.value)}
                        placeholder="Informe qual Casa do Alto, ministério ou atividade participa"
                        className="w-full rounded-2xl border-2 border-[#252525]/25 bg-white p-3 text-xs sm:text-sm font-semibold text-[#252525]"
                      />
                    </div>
                  )}
                </div>

                {/* SEGURANÇA / ALTERAR SENHA */}
                <div className="pt-3 border-t border-[#252525]/15 space-y-3">
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-[#CB4B3B]" />
                    <span className="block text-xs font-black uppercase tracking-wider text-[#CB4B3B]">
                      Alterar Senha de Acesso (Opcional)
                    </span>
                  </div>
                  <p className="text-[11px] text-[#252525]/70">
                    Preencha apenas se desejar trocar a senha cadastrada. Caso contrário, deixe os campos em branco.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-[#252525]/80 mb-1">
                        Nova Senha
                      </label>
                      <input
                        type="password"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        placeholder="Mínimo 4 dígitos"
                        className="w-full rounded-xl border-2 border-[#252525]/25 bg-white p-2.5 text-sm font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#252525]/80 mb-1">
                        Confirmar Nova Senha
                      </label>
                      <input
                        type="password"
                        value={editPasswordConfirm}
                        onChange={(e) => setEditPasswordConfirm(e.target.value)}
                        placeholder="Repita a nova senha"
                        className="w-full rounded-xl border-2 border-[#252525]/25 bg-white p-2.5 text-sm font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* BOTÕES DE AÇÃO */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#252525]/15">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingProfile(false);
                      setEditError(null);
                    }}
                    disabled={isSavingEdit}
                    className="px-5 py-2.5 rounded-xl bg-[#DCDACF] hover:bg-[#C7C4B5] text-[#252525] text-xs font-black uppercase tracking-wider transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    className="px-6 py-2.5 rounded-xl bg-[#CB4B3B] hover:bg-[#A93829] text-[#DCDACF] text-xs font-black uppercase tracking-wider shadow transition-colors flex items-center gap-1.5"
                  >
                    {isSavingEdit ? (
                      <>Salvando...</>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Salvar Alterações
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ===================================================================
            ABA 5: TODOS OS MEMBROS (Admin & Pastor)
           =================================================================== */}
        {activeTab === "todos-membros" && (session?.isPastor || session?.isAdmin) && (
          <div className="space-y-6">
            {/* Cabeçalho da Aba */}
            <div className="rounded-3xl bg-[#F4F3EE] p-6 sm:p-8 shadow-md border border-[#252525]/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#CB4B3B] flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  Diretório Geral da Igreja
                </span>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#252525] mt-1">
                  Todos os Membros ({allMembers.length})
                </h2>
                <p className="text-xs sm:text-sm text-[#252525]/75 font-medium mt-1">
                  Consulte os cadastros, localize famílias e gerencie a nomeação de pastores na plataforma.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddMemberModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#CB4B3B] hover:bg-[#A93829] text-[#DCDACF] text-xs font-black uppercase tracking-wider shadow transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Cadastrar Novo Membro</span>
                </button>
              </div>
            </div>

            {/* Linha de Indicadores Rápidos */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-white border border-[#252525]/10 shadow-sm">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[#252525]/60">
                  Total de Cadastros
                </span>
                <span className="text-2xl font-black text-[#252525]">{allMembers.length}</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-[#252525]/10 shadow-sm">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[#252525]/60">
                  Membros Oficiais
                </span>
                <span className="text-2xl font-black text-emerald-700">
                  {
                    allMembers.filter(
                      (m) => m.relationship === "Membro" || m.isOfficialMember
                    ).length
                  }
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-[#252525]/10 shadow-sm">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[#252525]/60">
                  Pastores & Líderes
                </span>
                <span className="text-2xl font-black text-[#CB4B3B]">
                  {allMembers.filter((m) => m.isPastor).length}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-[#252525]/10 shadow-sm">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[#252525]/60">
                  Administradores
                </span>
                <span className="text-2xl font-black text-[#252525]">
                  {allMembers.filter((m) => m.isAdmin).length}
                </span>
              </div>
            </div>

            {/* Barra de Filtros e Busca */}
            <div className="p-4 rounded-2xl bg-[#F4F3EE] border border-[#252525]/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#252525]/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  placeholder="Pesquisar por nome, CPF, telefone ou e-mail..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-[#252525]/20 bg-white text-xs sm:text-sm font-semibold text-[#252525] placeholder-[#252525]/40"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: "todos", label: "Todos" },
                  { id: "membros", label: "Membros" },
                  { id: "pastores", label: "Pastores" },
                  { id: "admins", label: "Admins" },
                  { id: "visitantes", label: "Visitantes" },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setMemberFilterCategory(f.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      memberFilterCategory === f.id
                        ? "bg-[#252525] text-white"
                        : "bg-white text-[#252525]/75 hover:bg-[#DCDACF]"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista dos Membros (Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMembers.map((m) => {
                const isPastor = Boolean(
                  m.isPastor ||
                    m.portalRole === "pastor" ||
                    m.portalRole === "admin"
                );
                const isAdmin = Boolean(m.isAdmin || m.portalRole === "admin");

                return (
                  <div
                    key={m.id}
                    className="p-5 rounded-3xl bg-white border-2 border-[#252525]/10 shadow-sm hover:shadow-md transition-shadow space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#DCDACF] text-[#252525] flex items-center justify-center font-black text-lg shrink-0">
                          {m.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-black text-[#252525] leading-tight">
                              {m.name}
                            </h3>
                            {isAdmin && (
                              <span className="px-2 py-0.5 rounded-full bg-[#CB4B3B] text-white text-[10px] font-black uppercase tracking-wider">
                                👑 Admin Total
                              </span>
                            )}
                            {isPastor && !isAdmin && (
                              <span className="px-2 py-0.5 rounded-full bg-[#252525] text-white text-[10px] font-black uppercase tracking-wider">
                                🤝 Pastor
                              </span>
                            )}
                          </div>
                          <span className="inline-block mt-0.5 text-xs font-bold text-[#252525]/60">
                            {m.relationship || "Membro"} • {m.maritalStatus || "Solteiro(a)"}
                          </span>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-xl bg-[#F4F3EE] text-[11px] font-extrabold text-[#252525]/80">
                        {m.attendanceTime || "Membro"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-[#252525]/80 pt-2 border-t border-[#252525]/10">
                      {m.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-[#CB4B3B] shrink-0" />
                          <span>{formatPhoneBR(m.phone)}</span>
                        </div>
                      )}
                      {m.cpf && (
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#252525]/60 shrink-0" />
                          <span>CPF: {formatCPF(m.cpf)}</span>
                        </div>
                      )}
                      {m.email && (
                        <div className="flex items-center gap-1.5 sm:col-span-2 truncate">
                          <Mail className="w-3.5 h-3.5 text-[#252525]/60 shrink-0" />
                          <span className="truncate">{m.email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 sm:col-span-2 text-[#252525]/70">
                        <MapPin className="w-3.5 h-3.5 text-[#252525]/60 shrink-0" />
                        <span className="truncate">{formatAddress(m.address)}</span>
                      </div>
                    </div>

                    {/* Informações da Família */}
                    {(m.spouseName || (m.dependents && m.dependents.length > 0)) && (
                      <div className="p-2.5 rounded-xl bg-[#F4F3EE] text-xs font-semibold text-[#252525]/80 space-y-1">
                        {m.spouseName && (
                          <div className="flex items-center gap-1.5">
                            <Heart className="w-3.5 h-3.5 text-[#CB4B3B]" />
                            <span>
                              Cônjuge: <strong>{m.spouseName}</strong>
                            </span>
                          </div>
                        )}
                        {m.dependents && m.dependents.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Baby className="w-3.5 h-3.5 text-[#252525]/60" />
                            <span>
                              Filhos / Dependentes:{" "}
                              <strong>
                                {m.dependents
                                  .map((d) => d.fullName || (d as any).name)
                                  .join(", ")}
                              </strong>
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Ações Administrativas (Exclusivo para Administrador) */}
                    {session?.isAdmin && (
                      <div className="pt-2 border-t border-[#252525]/10 flex flex-wrap items-center justify-between gap-2">
                        {!isPastor ? (
                          <button
                            type="button"
                            onClick={() => handleSetMemberPastor(m, true, false)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#252525] hover:bg-[#CB4B3B] text-white text-xs font-black uppercase tracking-wider transition-colors"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Definir como Pastor</span>
                          </button>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleSetMemberPastor(m, true, !isAdmin)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors ${
                                isAdmin
                                  ? "bg-white text-[#252525] border border-[#252525]/30 hover:bg-[#DCDACF]"
                                  : "bg-[#CB4B3B] text-white hover:bg-[#A93829]"
                              }`}
                            >
                              {isAdmin ? "Rebaixar p/ Pastor" : "👑 Tornar Admin Total"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetMemberPastor(m, false, false)}
                              className="px-2.5 py-1.5 rounded-xl bg-[#F9EAE8] hover:bg-[#CB4B3B] text-[#CB4B3B] hover:text-white text-xs font-bold transition-colors"
                              title="Remover função pastoral"
                            >
                              Remover Pastor
                            </button>
                          </div>
                        )}

                        <span className="text-[11px] font-bold text-[#252525]/50 ml-auto">
                          ID: {m.id}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================================================================
            ABA 6: GESTÃO DE PASTORES (Exclusivo para Admin)
           =================================================================== */}
        {activeTab === "gestao-pastores" && session?.isAdmin && (
          <div className="space-y-6">
            {/* Cabeçalho */}
            <div className="rounded-3xl bg-[#252525] text-[#DCDACF] p-6 sm:p-8 border-b-4 border-[#CB4B3B] shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[#CB4B3B]">
                  <Crown className="w-4 h-4" />
                  Corpo Pastoral & Acessos Administrativos
                </span>
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
                  Gestão de Equipe Pastoral ({pastorsList.length})
                </h2>
                <p className="text-xs sm:text-sm text-[#DCDACF]/80 leading-relaxed">
                  Defina quais membros atuam como pastores e conceda privilégios de{" "}
                  <strong>Admin Total</strong> para os líderes responsáveis pela igreja.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenVisitsPortal}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#CB4B3B] hover:bg-[#A93829] text-[#DCDACF] text-xs font-black uppercase tracking-wider transition-colors shadow shrink-0"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Abrir Portal de Visitas</span>
              </button>
            </div>

            {/* Card: Nomear Novo Pastor a partir de Membro Existente */}
            <div className="rounded-3xl bg-[#F4F3EE] p-6 shadow-md border border-[#252525]/15 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#252525]/15">
                <ShieldCheck className="w-5 h-5 text-[#CB4B3B]" />
                <h3 className="text-base font-black uppercase text-[#252525]">
                  Nomear Membro como Pastor
                </h3>
              </div>

              <form onSubmit={handleQuickAppointPastor} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-[#252525] mb-1">
                      Selecione o Membro Cadastrado *
                    </label>
                    <select
                      value={selectedMemberToAppoint}
                      onChange={(e) => setSelectedMemberToAppoint(e.target.value)}
                      className="w-full rounded-xl border-2 border-[#252525]/25 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-bold text-[#252525]"
                    >
                      <option value="">-- Escolha um membro para nomear --</option>
                      {allMembers
                        .filter((m) => !m.isPastor && m.id !== "admin-master")
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({formatPhoneBR(m.phone) || m.email || "Sem contato"})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-2 p-2.5 rounded-xl border-2 border-[#252525]/20 bg-white cursor-pointer hover:border-[#CB4B3B]">
                      <input
                        type="checkbox"
                        checked={appointAsAdmin}
                        onChange={(e) => setAppointAsAdmin(e.target.checked)}
                        className="w-4 h-4 rounded text-[#CB4B3B] focus:ring-[#CB4B3B]"
                      />
                      <span className="text-xs font-black uppercase text-[#252525]">
                        👑 Acesso Admin Total
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={!selectedMemberToAppoint || isAppointing}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#CB4B3B] hover:bg-[#A93829] disabled:opacity-40 text-white text-xs font-black uppercase tracking-wider shadow"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>
                      {isAppointing ? "Nomeando..." : "Confirmar Nomeação como Pastor"}
                    </span>
                  </button>
                </div>
              </form>
            </div>

            {/* Lista dos Pastores Atuais */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#252525]/70">
                Pastores e Administradores em Atividade ({pastorsList.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pastorsList.map((p) => {
                  const isAdmin = p.accessRole === "admin";
                  return (
                    <div
                      key={p.id}
                      className="p-5 rounded-3xl bg-white border-2 border-[#252525]/10 shadow-sm space-y-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-black text-[#252525]">{p.name}</h4>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                isAdmin
                                  ? "bg-[#CB4B3B] text-white"
                                  : "bg-[#252525] text-[#DCDACF]"
                              }`}
                            >
                              {isAdmin ? "👑 Admin Total" : "🤝 Pastor"}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-[#252525]/60">
                            {p.role || "Pastores"} • {p.phone || "Sem telefone"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#252525]/80 bg-[#F4F3EE] p-2.5 rounded-xl">
                        <span className="inline-flex items-center gap-1">
                          <KeyRound className="w-3.5 h-3.5 text-[#CB4B3B]" />
                          Login de acesso: <strong>{p.username || "pastor"}</strong>
                        </span>
                      </div>

                      <div className="pt-2 border-t border-[#252525]/10 flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleTogglePastorAccess(p)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors ${
                            isAdmin
                              ? "bg-white text-[#252525] border border-[#252525]/25 hover:bg-[#DCDACF]"
                              : "bg-[#CB4B3B] text-white hover:bg-[#A93829]"
                          }`}
                        >
                          {isAdmin ? "Mudar p/ Pastor" : "👑 Tornar Admin Total"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDemotePastor(p)}
                          className="px-3 py-1.5 rounded-xl bg-[#F9EAE8] hover:bg-[#CB4B3B] text-[#CB4B3B] hover:text-white text-xs font-bold uppercase transition-colors"
                        >
                          Remover Pastor
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            ABA 7: VISITAS & CUIDADO (Pastor & Admin)
           =================================================================== */}
        {activeTab === "visitas-cuidado" && (session?.isPastor || session?.isAdmin) && (
          <div className="space-y-6">
            {/* Banner Superior com Link para o Portal de Visitas */}
            <div className="rounded-3xl bg-[#252525] text-[#DCDACF] p-6 sm:p-8 border-b-4 border-[#CB4B3B] shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[#CB4B3B]">
                  <HeartHandshake className="w-4 h-4" />
                  Acompanhamento Pastoral Integrado
                </span>
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
                  Visitas por Pessoas & Cuidado Familiar
                </h2>
                <p className="text-xs sm:text-sm text-[#DCDACF]/80 leading-relaxed">
                  Acompanhe os diagnósticos, motivos de oração e histórico das pessoas visitadas.
                  Para relatórios detalhados e designação de visitas, acesse o painel completo.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenVisitsPortal}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#CB4B3B] hover:bg-[#A93829] text-[#DCDACF] text-xs font-black uppercase tracking-wider transition-colors shadow shrink-0"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Abrir Portal de Visitas Completo</span>
              </button>
            </div>

            {/* Barra de Filtros */}
            <div className="p-4 rounded-2xl bg-[#F4F3EE] border border-[#252525]/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#252525]/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={visitedSearchQuery}
                  onChange={(e) => setVisitedSearchQuery(e.target.value)}
                  placeholder="Pesquisar por nome da pessoa visitada ou observações..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-[#252525]/20 bg-white text-xs sm:text-sm font-semibold text-[#252525]"
                />
              </div>

              {session?.isAdmin && pastorsList.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#252525]/70 whitespace-nowrap">
                    Pastor:
                  </span>
                  <select
                    value={visitedPastorFilter}
                    onChange={(e) => setVisitedPastorFilter(e.target.value)}
                    className="rounded-xl border-2 border-[#252525]/20 bg-white px-3 py-2 text-xs font-bold text-[#252525]"
                  >
                    <option value="todos">Todos os Pastores</option>
                    {pastorsList.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Lista dos Relatórios de Visita por Pessoa */}
            <div className="space-y-4">
              {filteredReports.length === 0 ? (
                <div className="p-8 rounded-3xl bg-white border border-[#252525]/10 text-center space-y-3">
                  <HeartHandshake className="w-10 h-10 text-[#CB4B3B] mx-auto opacity-40" />
                  <h4 className="text-base font-black text-[#252525]">
                    Nenhum registro de visita localizado
                  </h4>
                  <p className="text-xs text-[#252525]/60 max-w-md mx-auto">
                    Não foram encontrados relatórios para o filtro informado. Acesse o portal de
                    visitas para registrar novos relatórios pastorais.
                  </p>
                </div>
              ) : (
                filteredReports.map((r) => {
                  const meta = r.situation
                    ? SITUATION_META[r.situation]
                    : SITUATION_META.bem;

                  return (
                    <div
                      key={r.id}
                      className="p-5 rounded-3xl bg-white border-2 border-[#252525]/10 shadow-sm space-y-3 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#252525]/10">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-base font-black text-[#252525]">
                            {r.memberName}
                          </h4>
                          <span
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white"
                            style={{ backgroundColor: meta.color }}
                          >
                            {meta.emoji} {meta.shortLabel}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-bold text-[#252525]/70">
                          <Calendar className="w-3.5 h-3.5 text-[#CB4B3B]" />
                          <span>
                            Visita em: <strong>{formatDateBR(r.visitDate)}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-[#252525]/80">
                        <div>
                          <span className="text-[#252525]/60 block text-[11px] font-bold uppercase">
                            Pastor(es) Responsável(is):
                          </span>
                          <strong>
                            {(r.visitors || []).join(", ") || "Equipe Pastoral"}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[#252525]/60 block text-[11px] font-bold uppercase">
                            Motivo Principal:
                          </span>
                          <span>{r.mainReason || "Comunhão pastoral"}</span>
                        </div>
                      </div>

                      {r.summary && (
                        <div className="p-3 rounded-2xl bg-[#F4F3EE] text-xs font-medium text-[#252525]/85">
                          <span className="block text-[11px] font-black uppercase text-[#CB4B3B] mb-0.5">
                            Diagnóstico Pastoral & Observações:
                          </span>
                          <p className="whitespace-pre-line leading-relaxed">
                            {r.summary}
                          </p>
                        </div>
                      )}

                      {r.followUpNeeds && r.followUpNeeds.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[11px] font-black uppercase text-[#252525]/60 mr-1">
                            Acompanhamento:
                          </span>
                          {r.followUpNeeds.map((need, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-lg bg-[#DCDACF] text-[#252525] text-[10px] font-bold"
                            >
                              {need}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

      </main>

      {/* MODAL: CADASTRAR NOVO MEMBRO (ADMIN OU PASTOR) */}
      <LightDismissDialog
        open={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        title="Cadastrar Novo Membro na Plataforma"
        subtitle="Registro oficial de membro com relacionamento eclesiástico e dados cadastrais"
        maxWidthClass="max-w-2xl"
      >
        <form
          onSubmit={handleAdminCreateMember}
          className="space-y-4 text-xs font-semibold text-[#252525]"
        >
          {addMemberError && (
            <div className="p-3 rounded-xl bg-[#F9EAE8] text-[#A93829] border border-[#CB4B3B] font-bold">
              {addMemberError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-black uppercase text-[#252525] mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                required
                value={addMemName}
                onChange={(e) => setAddMemName(e.target.value)}
                placeholder="Ex: João Silva de Almeida"
                className="w-full rounded-xl border-2 border-[#252525]/25 bg-white p-2.5 text-xs sm:text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-[#252525] mb-1">
                CPF (Opcional / Recomendado)
              </label>
              <input
                type="text"
                value={addMemCpf}
                onChange={(e) => setAddMemCpf(formatCPF(e.target.value))}
                placeholder="000.000.000-00"
                maxLength={14}
                className="w-full rounded-xl border-2 border-[#252525]/25 bg-white p-2.5 text-xs sm:text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-[#252525] mb-1">
                Data de Nascimento
              </label>
              <input
                type="date"
                value={addMemBirthDate}
                onChange={(e) => setAddMemBirthDate(e.target.value)}
                className="w-full rounded-xl border-2 border-[#252525]/25 bg-white p-2.5 text-xs sm:text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-[#252525] mb-1">
                Telefone / WhatsApp *
              </label>
              <input
                type="tel"
                required
                value={addMemPhone}
                onChange={(e) => setAddMemPhone(formatPhoneBR(e.target.value))}
                placeholder="(11) 99999-9999"
                className="w-full rounded-xl border-2 border-[#252525]/25 bg-white p-2.5 text-xs sm:text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-[#252525] mb-1">
                E-mail (para login)
              </label>
              <input
                type="email"
                value={addMemEmail}
                onChange={(e) => setAddMemEmail(e.target.value)}
                placeholder="membro@exemplo.com"
                className="w-full rounded-xl border-2 border-[#252525]/25 bg-white p-2.5 text-xs sm:text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-[#252525] mb-1">
                Estado Civil
              </label>
              <select
                value={addMemMaritalStatus}
                onChange={(e) => setAddMemMaritalStatus(e.target.value as MaritalStatus)}
                className="w-full rounded-xl border-2 border-[#252525]/25 bg-white p-2.5 text-xs sm:text-sm font-bold"
              >
                {MARITAL_STATUS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {addMemMaritalStatus === "Casado(a)" && (
              <div>
                <label className="block text-[11px] font-black uppercase text-[#252525] mb-1">
                  Nome do Cônjuge
                </label>
                <input
                  type="text"
                  value={addMemSpouseName}
                  onChange={(e) => setAddMemSpouseName(e.target.value)}
                  placeholder="Nome do esposo(a)"
                  className="w-full rounded-xl border-2 border-[#252525]/25 bg-white p-2.5 text-xs sm:text-sm font-semibold"
                />
              </div>
            )}
          </div>

          {/* Endereço com Busca de CEP */}
          <div className="p-3 rounded-2xl bg-[#F4F3EE] border border-[#252525]/15 space-y-3">
            <span className="block text-[11px] font-black uppercase text-[#CB4B3B]">
              Endereço Residencial
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-[#252525]/80 mb-1">
                  CEP (Opcional)
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={addMemCep}
                    onChange={(e) => setAddMemCep(formatCEP(e.target.value))}
                    placeholder="00000-000"
                    maxLength={9}
                    className="w-full rounded-xl border-2 border-[#252525]/25 bg-white px-2.5 py-1.5 text-xs font-semibold"
                  />
                  <button
                    type="button"
                    onClick={handleLookupCepAddMem}
                    disabled={isSearchingCepAddMem}
                    className="px-2.5 py-1.5 rounded-xl bg-[#252525] text-white text-xs font-bold shrink-0"
                    title="Buscar CEP"
                  >
                    {isSearchingCepAddMem ? "..." : <Search className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {cepErrorAddMem && (
                  <span className="text-[10px] text-[#CB4B3B] block mt-0.5">
                    {cepErrorAddMem}
                  </span>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-[#252525]/80 mb-1">
                  Rua / Avenida
                </label>
                <input
                  type="text"
                  value={addMemStreet}
                  onChange={(e) => setAddMemStreet(e.target.value)}
                  placeholder="Nome da rua"
                  className="w-full rounded-xl border-2 border-[#252525]/25 bg-white px-2.5 py-1.5 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#252525]/80 mb-1">
                  Número
                </label>
                <input
                  type="text"
                  value={addMemNumber}
                  onChange={(e) => setAddMemNumber(e.target.value)}
                  placeholder="Nº"
                  className="w-full rounded-xl border-2 border-[#252525]/25 bg-white px-2.5 py-1.5 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#252525]/80 mb-1">
                  Bairro
                </label>
                <input
                  type="text"
                  value={addMemNeighborhood}
                  onChange={(e) => setAddMemNeighborhood(e.target.value)}
                  placeholder="Bairro"
                  className="w-full rounded-xl border-2 border-[#252525]/25 bg-white px-2.5 py-1.5 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#252525]/80 mb-1">
                  Cidade
                </label>
                <input
                  type="text"
                  value={addMemCity}
                  onChange={(e) => setAddMemCity(e.target.value)}
                  placeholder="Cidade"
                  className="w-full rounded-xl border-2 border-[#252525]/25 bg-white px-2.5 py-1.5 text-xs font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Relacionamento com a Igreja */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-black uppercase text-[#252525] mb-1">
                Relacionamento Eclesiástico
              </label>
              <select
                value={addMemRelationship}
                onChange={(e) =>
                  setAddMemRelationship(e.target.value as ChurchRelationship)
                }
                className="w-full rounded-xl border-2 border-[#252525]/25 bg-white p-2.5 text-xs sm:text-sm font-bold"
              >
                {CHURCH_RELATIONSHIP.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-[#252525] mb-1">
                Tempo de Frequência
              </label>
              <select
                value={addMemAttendanceTime}
                onChange={(e) =>
                  setAddMemAttendanceTime(e.target.value as AttendanceTime)
                }
                className="w-full rounded-xl border-2 border-[#252525]/25 bg-white p-2.5 text-xs sm:text-sm font-bold"
              >
                {ATTENDANCE_TIME.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Se Admin: opção de promover diretamente a Pastor ou Admin */}
          {session?.isAdmin && (
            <div className="p-3.5 rounded-2xl bg-[#252525] text-[#DCDACF] space-y-2">
              <span className="block text-[11px] font-black uppercase text-[#CB4B3B]">
                Privilégios Especiais (Administrador)
              </span>
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addMemIsPastor}
                    onChange={(e) => {
                      setAddMemIsPastor(e.target.checked);
                      if (!e.target.checked) setAddMemIsAdmin(false);
                    }}
                    className="w-4 h-4 rounded text-[#CB4B3B] focus:ring-[#CB4B3B]"
                  />
                  <span className="text-xs font-bold">
                    🤝 Definir como Pastor da Igreja
                  </span>
                </label>

                {addMemIsPastor && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addMemIsAdmin}
                      onChange={(e) => setAddMemIsAdmin(e.target.checked)}
                      className="w-4 h-4 rounded text-[#CB4B3B] focus:ring-[#CB4B3B]"
                    />
                    <span className="text-xs font-bold text-amber-300">
                      👑 Conceder Acesso Admin Total
                    </span>
                  </label>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddMemberModalOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-[#DCDACF] hover:bg-[#C7C4B5] text-[#252525] text-xs font-bold uppercase tracking-wider"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSavingAddMember}
              className="px-6 py-2.5 rounded-xl bg-[#CB4B3B] hover:bg-[#A93829] text-[#DCDACF] text-xs font-black uppercase tracking-wider shadow"
            >
              {isSavingAddMember ? "Cadastrando..." : "Concluir Cadastro de Membro"}
            </button>
          </div>
        </form>
      </LightDismissDialog>

      {/* MODAL: ADICIONAR FILHO / DEPENDENTE (< 16 ANOS) */}
      <LightDismissDialog
        open={isAddDepOpen}
        onClose={() => setIsAddDepOpen(false)}
        title="Adicionar Filho(a) ou Dependente"
        subtitle="Cadastro familiar para filhos menores de 16 anos (sem obrigatoriedade de CPF)"
        maxWidthClass="max-w-md"
      >
        <form onSubmit={handleAddDependent} className="space-y-4 text-xs font-semibold text-[#252525]">
          {depError && (
            <div className="p-3 rounded-xl bg-[#F9EAE8] text-[#A93829] border border-[#CB4B3B] font-bold">
              {depError}
            </div>
          )}

          <div>
            <label className="block text-xs font-black uppercase tracking-wider mb-1">
              Nome Completo do Filho(a) *
            </label>
            <input
              type="text"
              required
              value={depName}
              onChange={(e) => setDepName(e.target.value)}
              placeholder="Ex: Pedro Henrique Pierre"
              className="w-full rounded-xl border-2 border-[#252525]/25 bg-white p-2.5 text-sm font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider mb-1">
                Data de Nascimento *
              </label>
              <input
                type="date"
                required
                value={depBirthDate}
                onChange={(e) => setDepBirthDate(e.target.value)}
                className="w-full rounded-xl border-2 border-[#252525]/25 bg-white p-2.5 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider mb-1">
                Parentesco
              </label>
              <select
                value={depRel}
                onChange={(e) => setDepRel(e.target.value as any)}
                className="w-full rounded-xl border-2 border-[#252525]/25 bg-white p-2.5 text-sm font-semibold"
              >
                <option value="Filho(a)">Filho(a)</option>
                <option value="Enteado(a)">Enteado(a)</option>
                <option value="Neto(a)">Neto(a)</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider mb-1">
              CPF do Filho(a) (Opcional)
            </label>
            <input
              type="text"
              value={depCpf}
              onChange={(e) => setDepCpf(formatCPF(e.target.value))}
              placeholder="000.000.000-00 (se tiver)"
              maxLength={14}
              className="w-full rounded-xl border-2 border-[#252525]/25 bg-white p-2.5 text-sm font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider mb-1">
              Observações Médicas / Ministério Infantil (Opcional)
            </label>
            <textarea
              rows={2}
              value={depNotes}
              onChange={(e) => setDepNotes(e.target.value)}
              placeholder="Alergias, restrições alimentares ou cuidados especiais..."
              className="w-full rounded-xl border-2 border-[#252525]/25 bg-white p-2.5 text-xs font-medium"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddDepOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-[#DCDACF] hover:bg-[#C7C4B5] text-[#252525] text-xs font-bold uppercase tracking-wider"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSavingDep}
              className="px-5 py-2.5 rounded-xl bg-[#CB4B3B] hover:bg-[#A93829] text-[#DCDACF] text-xs font-black uppercase tracking-wider shadow"
            >
              {isSavingDep ? "Salvando..." : "Salvar Filho(a)"}
            </button>
          </div>
        </form>
      </LightDismissDialog>

      {/* Rodapé */}
      <footer className="bg-[#252525] text-[#DCDACF]/75 py-4 border-t border-[#CB4B3B]/40 text-center text-xs font-bold uppercase tracking-wider mt-8">
        <span>Igreja do Alto — Lugar de Proteção, Provisão e Direção</span>
      </footer>
    </div>
  );
}
