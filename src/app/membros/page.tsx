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
  CHURCH_MINISTRIES,
  ALL_MINISTRY_IDS,
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
  Star,
  Music,
  Award,
  MessageCircle,
  AlertTriangle,
  Camera,
  Upload,
  Bell,
  Clock3,
} from "lucide-react";

const MEMBER_SESSION_KEY = "igreja_alto_member_session_v1";

type ActiveTab =
  | "todos-membros"
  | "gestao-pastores"
  | "ministerios"
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
  const [regAttendanceTime, setRegAttendanceTime] = useState<AttendanceTime | "">("");
  const [regParticipates, setRegParticipates] = useState<"Sim" | "Não" | "">("");
  const [regActivityName, setRegActivityName] = useState("");
  const [regCurrentMinistries, setRegCurrentMinistries] = useState<string[]>([]);
  const [regPhotoUrl, setRegPhotoUrl] = useState("");
  const [isCompressingPhotoReg, setIsCompressingPhotoReg] = useState(false);

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
  const [editCurrentMinistries, setEditCurrentMinistries] = useState<string[]>([]);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  const [editPhotoUrl, setEditPhotoUrl] = useState("");
  const [isCompressingPhotoEdit, setIsCompressingPhotoEdit] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Estados da Aba Ministérios (Voluntariado e Áreas de Interesse)
  const [myCurrentMinistries, setMyCurrentMinistries] = useState<string[]>([]);
  const [myInterestedMinistries, setMyInterestedMinistries] = useState<string[]>([]);
  const [isSavingMinistries, setIsSavingMinistries] = useState(false);
  const [ministryFeedback, setMinistryFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Relatório de Ministérios (Pastores e Admins)
  const [ministryViewMode, setMinistryViewMode] = useState<"relatorio" | "meu-formulario">("relatorio");
  const [filterMinistryId, setFilterMinistryId] = useState<string>("todos");
  const [filterMinistryStatus, setFilterMinistryStatus] = useState<"todos" | "interessados" | "atuantes">("todos");
  const [ministrySearchQuery, setMinistrySearchQuery] = useState("");

  // Modal de Detalhes do Perfil do Membro (Aba Todos os Membros)
  const [selectedMemberDetail, setSelectedMemberDetail] = useState<Member | null>(null);

  // Estados de Gestão de Membros, Pastores e Visitas (Admin & Pastor)
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [pastorsList, setPastorsList] = useState<PastorLeader[]>([]);
  const [allReports, setAllReports] = useState<VisitReport[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [memberFilterCategory, setMemberFilterCategory] = useState<
    "todos" | "membros" | "pastores" | "admins" | "visitantes"
  >("todos");

  const [adminFeedback, setAdminFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Modais customizados estilizados (substituem window.confirm e alert)
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    subtitle?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    onConfirm: () => void | Promise<void>;
  }>({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const [alertModal, setAlertModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    type?: "info" | "warning" | "success" | "error";
  }>({
    open: false,
    title: "",
    message: "",
  });

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
  const [addMemAttendanceTime, setAddMemAttendanceTime] = useState<AttendanceTime | "">("");
  const [addMemParticipates, setAddMemParticipates] = useState<"Sim" | "Não" | "">("");
  const [addMemActivityName, setAddMemActivityName] = useState("");
  const [addMemCurrentMinistries, setAddMemCurrentMinistries] = useState<string[]>([]);
  const [addMemPassword, setAddMemPassword] = useState("igrejadoalto");
  const [addMemPhotoUrl, setAddMemPhotoUrl] = useState("");
  const [isCompressingPhotoAddMem, setIsCompressingPhotoAddMem] = useState(false);
  const [addMemIsPastor, setAddMemIsPastor] = useState(false);
  const [addMemIsLeader, setAddMemIsLeader] = useState(false);
  const [addMemIsAdmin, setAddMemIsAdmin] = useState(false);
  const [isSavingAddMember, setIsSavingAddMember] = useState(false);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);

  // Nomeação Rápida de Equipe (Aba Gestão de Equipe)
  const [selectedMemberToAppoint, setSelectedMemberToAppoint] = useState("");
  const [appointSearchQuery, setAppointSearchQuery] = useState("");
  const [appointAsPastor, setAppointAsPastor] = useState(false);
  const [appointAsLeader, setAppointAsLeader] = useState(false);
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
          if (parsed.isAdmin) {
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
        setMyCurrentMinistries(data.member.currentMinistries || []);
        setMyInterestedMinistries(data.member.interestedMinistries || []);
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

  const handlePhotoUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    onComplete: (base64: string) => void,
    onLoading: (loading: boolean) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
        onComplete(dataUrl);
        onLoading(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
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
      if (data.member) {
        setMyCurrentMinistries(data.member.currentMinistries || []);
        setMyInterestedMinistries(data.member.interestedMinistries || []);
      }
      if (data.allMembers) setAllMembers(data.allMembers);
      if (data.pastors) setPastorsList(data.pastors);
      if (data.reports) setAllReports(data.reports);

      if (data.session.isAdmin) {
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

  const handleSaveMinistries = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!session) return;
    setIsSavingMinistries(true);
    setMinistryFeedback(null);
    try {
      const res = await fetch("/api/membros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "MEMBER_UPDATE_MINISTRIES",
          payload: {
            memberId: session.id,
            currentMinistries: memberData?.currentMinistries || myCurrentMinistries || [],
            interestedMinistries: myInterestedMinistries,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao atualizar preferências ministeriais.");
      }
      if (data.member) {
        setMemberData(data.member);
      }
      if (data.allMembers) {
        setAllMembers(data.allMembers);
      }
      const successText =
        myInterestedMinistries.length > 0
          ? `Que bênção! Seu interesse em servir em ${myInterestedMinistries.length} área(s) foi registrado com sucesso. Nossa liderança entrará em contato com você com muito carinho!`
          : "Suas preferências ministeriais foram atualizadas com sucesso.";

      setMinistryFeedback({
        type: "success",
        text: successText,
      });

      setAlertModal({
        open: true,
        title: "Interesse Registrado!",
        message: successText,
        type: "success",
      });
    } catch (err) {
      const errorText =
        err instanceof Error ? err.message : "Erro ao salvar preferências ministeriais.";
      setMinistryFeedback({
        type: "error",
        text: errorText,
      });
      setAlertModal({
        open: true,
        title: "Atenção",
        message: errorText,
        type: "error",
      });
    } finally {
      setIsSavingMinistries(false);
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
            currentMinistries: regCurrentMinistries,
            password: regPassword,
            photoUrl: regPhotoUrl || undefined,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Não foi possível concluir o cadastro.");
      }

      setSession(data.session);
      setMemberData(data.member);
      if (data.member) {
        setMyCurrentMinistries(data.member.currentMinistries || []);
        setMyInterestedMinistries(data.member.interestedMinistries || []);
      }
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

      if (data.pending) {
        if (memberData) {
          setMemberData({
            ...memberData,
            sentSpouseLinkRequest: data.sentRequest,
          });
        }
        setSpouseLinkMessage({
          type: "success",
          text: data.message,
        });
      } else {
        setSpouseData(data.spouse);
        setDependents(data.dependents || []);
        if (memberData && data.member) {
          setMemberData(data.member);
        }
        setSpouseLinkMessage({
          type: "success",
          text:
            data.message ||
            `Vínculo com ${data.spouse.name} realizado com sucesso!`,
        });
      }
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

  const handleAcceptSpouseLink = async () => {
    if (!session || !memberData?.pendingSpouseLink) return;
    setIsLinkingSpouse(true);
    setSpouseLinkMessage(null);
    try {
      const res = await fetch("/api/membros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "FAMILY_ACCEPT_SPOUSE_LINK",
          payload: {
            memberId: session.id,
            requesterId: memberData.pendingSpouseLink.requesterId,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data.error || "Erro ao aceitar solicitação de vínculo."
        );

      setSpouseData(data.spouse);
      setDependents(data.dependents || []);
      if (data.member) {
        setMemberData(data.member);
      }
      setSpouseLinkMessage({
        type: "success",
        text: `Vínculo com ${data.spouse.name} aceito e confirmado com sucesso! Vocês agora compartilham o mesmo núcleo familiar e filhos.`,
      });
    } catch (err) {
      setSpouseLinkMessage({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Erro ao aceitar solicitação de vínculo.",
      });
    } finally {
      setIsLinkingSpouse(false);
    }
  };

  const handleRejectSpouseLink = async () => {
    if (!session) return;
    setIsLinkingSpouse(true);
    setSpouseLinkMessage(null);
    try {
      const res = await fetch("/api/membros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "FAMILY_REJECT_SPOUSE_LINK",
          payload: { memberId: session.id },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao recusar vínculo.");
      if (memberData) {
        setMemberData({ ...memberData, pendingSpouseLink: null });
      }
      setSpouseLinkMessage({
        type: "success",
        text: "Solicitação de vínculo recusada.",
      });
    } catch (err) {
      setSpouseLinkMessage({
        type: "error",
        text:
          err instanceof Error ? err.message : "Erro ao recusar solicitação.",
      });
    } finally {
      setIsLinkingSpouse(false);
    }
  };

  const handleCancelSpouseLink = async () => {
    if (!session) return;
    setIsLinkingSpouse(true);
    setSpouseLinkMessage(null);
    try {
      const res = await fetch("/api/membros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "FAMILY_CANCEL_SPOUSE_LINK_REQUEST",
          payload: { memberId: session.id },
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Erro ao cancelar solicitação.");
      if (memberData) {
        setMemberData({ ...memberData, sentSpouseLinkRequest: null });
      }
      setSpouseLinkMessage({
        type: "success",
        text: "Solicitação de vínculo cancelada com sucesso.",
      });
    } catch (err) {
      setSpouseLinkMessage({
        type: "error",
        text:
          err instanceof Error ? err.message : "Erro ao cancelar solicitação.",
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
      if (memberData) {
        setMemberData({ ...memberData, dependents: data.dependents });
      }
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

  const handleRemoveDependent = (depId: string, depName: string) => {
    if (!session) return;
    setConfirmModal({
      open: true,
      title: "Remover Dependente",
      subtitle: "Núcleo Familiar",
      message: `Deseja realmente remover "${depName}" da sua lista de filhos/dependentes?`,
      confirmText: "Sim, Remover",
      cancelText: "Cancelar",
      isDestructive: true,
      onConfirm: async () => {
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
          if (!res.ok) {
            throw new Error(data.error || "Erro ao remover dependente.");
          }

          const updatedDeps = data.dependents || [];
          setDependents(updatedDeps);
          if (memberData) {
            setMemberData({ ...memberData, dependents: updatedDeps });
          }
          setSpouseLinkMessage({
            type: "success",
            text: `"${depName}" foi removido(a) com sucesso da lista de dependentes.`,
          });
        } catch (err) {
          console.error("Erro ao remover dependente:", err);
          setAlertModal({
            open: true,
            title: "Erro ao Remover Dependente",
            message:
              err instanceof Error
                ? err.message
                : "Não foi possível remover o dependente.",
            type: "error",
          });
        }
      },
    });
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

  const handleUnlinkSpouse = () => {
    if (!session) return;
    setConfirmModal({
      open: true,
      title: "Desvincular Cônjuge",
      subtitle: "Núcleo Familiar",
      message:
        "Deseja realmente desvincular o cônjuge do seu núcleo familiar? Ambos continuarão tendo seus acessos individuais normalmente.",
      confirmText: "Sim, Desvincular",
      cancelText: "Cancelar",
      isDestructive: true,
      onConfirm: async () => {
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
      },
    });
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
    setEditCurrentMinistries(memberData.currentMinistries || []);
    setEditPhotoUrl(memberData.photoUrl || "");
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
              currentMinistries: editCurrentMinistries,
              password: editPassword.trim() || undefined,
              photoUrl: editPhotoUrl || undefined,
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
            currentMinistries: addMemCurrentMinistries,
            password: addMemPassword.trim() || "igrejadoalto",
            photoUrl: addMemPhotoUrl || undefined,
            isPastor: Boolean(addMemIsPastor),
            isLeader: Boolean(addMemIsLeader),
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
      setAddMemPhotoUrl("");
      setAddMemPassword("igrejadoalto");
      setAddMemCurrentMinistries([]);
      setAddMemIsPastor(false);
      setAddMemIsLeader(false);
      setAddMemIsAdmin(false);
    } catch (err) {
      setAddMemberError(
        err instanceof Error ? err.message : "Erro ao cadastrar membro."
      );
    } finally {
      setIsSavingAddMember(false);
    }
  };

  const handleSetMemberRoles = async (
    targetMember: {
      id?: string;
      memberId?: string;
      name: string;
      isPastor?: boolean;
      isLeader?: boolean;
      isAdmin?: boolean;
      isVisitorActive?: boolean;
    },
    roles: {
      isPastor?: boolean;
      isLeader?: boolean;
      isAdmin?: boolean;
      isVisitorActive?: boolean;
    }
  ) => {
    if (!session) return;
    try {
      const res = await fetch("/api/membros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADMIN_SET_MEMBER_ROLES",
          payload: {
            memberId: targetMember.id || targetMember.memberId,
            pastorName: targetMember.name,
            ...roles,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao atualizar permissões de equipe.");
      }
      if (data.allMembers) setAllMembers(data.allMembers);
      if (data.pastors) setPastorsList(data.pastors);
      setAdminFeedback({
        type: "success",
        text: `Permissões de "${targetMember.name}" atualizadas com sucesso!`,
      });
    } catch (err) {
      setAdminFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Erro ao alterar permissão.",
      });
    }
  };

  const handleSetMemberPastor = (
    targetMember: Member,
    willBePastor: boolean,
    willBeAdmin?: boolean
  ) => {
    if (!session) return;
    const confirmMsg = willBePastor
      ? `Deseja nomear "${targetMember.name}" como Pastor(a) da Igreja?`
      : `Deseja remover a função pastoral de "${targetMember.name}"?`;

    setConfirmModal({
      open: true,
      title: willBePastor ? "Definir Pastor(a) da Igreja" : "Remover Função Pastoral",
      subtitle: "Gestão de Equipe",
      message: confirmMsg,
      confirmText: willBePastor ? "Sim, Definir Pastor" : "Sim, Remover Função",
      cancelText: "Cancelar",
      isDestructive: !willBePastor,
      onConfirm: async () => {
        await handleSetMemberRoles(targetMember, {
          isPastor: willBePastor,
          ...(willBeAdmin !== undefined ? { isAdmin: willBeAdmin } : {}),
        });
      },
    });
  };

  const handleTogglePastorAccess = async (pastor: PastorLeader) => {
    const nextIsAdmin = pastor.accessRole !== "admin";
    await handleSetMemberRoles(pastor, { isAdmin: nextIsAdmin });
  };

  const handleRemoveFromTeam = (target: {
    id?: string;
    memberId?: string;
    name: string;
  }) => {
    if (
      session &&
      (session.id === target.memberId ||
        session.id === target.id ||
        session.name.toLowerCase() === target.name.toLowerCase())
    ) {
      setAlertModal({
        open: true,
        title: "Ação Não Permitida",
        message:
          "Você não pode remover seu próprio acesso administrativo por motivos de segurança.",
        type: "warning",
      });
      return;
    }

    setConfirmModal({
      open: true,
      title: "Remover da Equipe",
      subtitle: "Gestão de Equipe",
      message: `Deseja realmente remover "${target.name}" da equipe? A pessoa voltará a ter apenas perfil comum de membro.`,
      confirmText: "Sim, Remover da Equipe",
      cancelText: "Cancelar",
      isDestructive: true,
      onConfirm: async () => {
        await handleSetMemberRoles(target, {
          isPastor: false,
          isLeader: false,
          isAdmin: false,
        });
      },
    });
  };

  const handleDemotePastor = (pastor: PastorLeader) => {
    handleRemoveFromTeam(pastor);
  };

  const handleQuickAppointPastor = async (e: React.FormEvent) => {
    e.preventDefault();
    let target = allMembers.find((m) => m.id === selectedMemberToAppoint);
    if (!target && appointSearchQuery.trim()) {
      const q = appointSearchQuery.toLowerCase().trim();
      target =
        allMembers.find(
          (m) =>
            m.id !== "admin-master" &&
            m.name.toLowerCase() === q
        ) ||
        allMembers.find(
          (m) =>
            m.id !== "admin-master" &&
            m.name.toLowerCase().includes(q)
        );
    }

    if (!target) {
      setAlertModal({
        open: true,
        title: "Membro Não Selecionado",
        message:
          "Por favor, selecione ou digite o nome de um membro cadastrado na plataforma para definir as funções.",
        type: "warning",
      });
      return;
    }

    if (!appointAsPastor && !appointAsLeader && !appointAsAdmin) {
      setAlertModal({
        open: true,
        title: "Nenhuma Função Selecionada",
        message:
          "Selecione ao menos uma função (Pastor, Líder ou Administrador) para salvar.",
        type: "warning",
      });
      return;
    }

    setIsAppointing(true);
    try {
      await handleSetMemberRoles(target, {
        isPastor: appointAsPastor,
        isLeader: appointAsLeader,
        isAdmin: appointAsAdmin,
      });
      setSelectedMemberToAppoint("");
      setAppointSearchQuery("");
      setAppointAsPastor(false);
      setAppointAsLeader(false);
      setAppointAsAdmin(false);
    } finally {
      setIsAppointing(false);
    }
  };

  const handleOpenVisitsPortal = (
    targetTab?: "pessoas" | "nova-visita" | "dashboard" | "agenda" | React.MouseEvent
  ) => {
    if (!session) return;
    const tab = typeof targetTab === "string" ? targetTab : "pessoas";
    try {
      const userSession = {
        id: session.isAdmin ? "master-admin" : session.id,
        name: session.name,
        username: session.cpf || session.name.toLowerCase().replace(/\s+/g, "."),
        role: session.isAdmin ? "admin" : session.isLeader ? "lider" : "pastor",
        accessRole: session.isAdmin ? "admin" : session.isLeader ? "lider" : "pastor",
        isMasterAdmin: Boolean(session.isAdmin),
      };
      window.localStorage.setItem(
        "igreja_alto_user_session_v2",
        JSON.stringify(userSession)
      );
    } catch {}
    window.open(`/painel?tab=${tab}`, "_blank");
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
      <div className="min-h-screen bg-[#DCDACF] flex flex-col justify-between text-[#252525] overflow-x-hidden">
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

                  {/* Foto de Perfil do Membro */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-white border-2 border-[#252525]/15">
                    <div className="relative w-20 h-20 rounded-2xl bg-[#F4F3EE] border-2 border-dashed border-[#252525]/30 overflow-hidden flex items-center justify-center shrink-0">
                      {regPhotoUrl ? (
                        <img
                          src={regPhotoUrl}
                          alt="Foto do Membro"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera className="w-8 h-8 text-[#252525]/40" />
                      )}
                      {isCompressingPhotoReg && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-1 text-center sm:text-left">
                      <label className="block text-xs font-black uppercase tracking-wider text-[#252525]">
                        Foto de Perfil (Opcional)
                      </label>
                      <p className="text-[11px] text-[#252525]/70">
                        Adicione sua foto para identificação no cadastro pastoral da igreja.
                      </p>
                      <div className="flex items-center gap-2 pt-1 justify-center sm:justify-start">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#252525] hover:bg-[#3D3D3D] text-[#DCDACF] text-xs font-bold cursor-pointer transition-colors shadow-sm">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{regPhotoUrl ? "Trocar Foto" : "Enviar Foto"}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handlePhotoUpload(
                                e,
                                (base64) => setRegPhotoUrl(base64),
                                setIsCompressingPhotoReg
                              )
                            }
                          />
                        </label>
                        {regPhotoUrl && (
                          <button
                            type="button"
                            onClick={() => setRegPhotoUrl("")}
                            className="px-2.5 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors"
                          >
                            Remover
                          </button>
                        )}
                      </div>
                    </div>
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

                    {/* Pergunta 1: Tempo de frequência */}
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
                        Participa de alguma Casa do Alto?
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
                          Qual Casa do Alto?
                        </label>
                        <input
                          type="text"
                          value={regActivityName}
                          onChange={(e) => setRegActivityName(e.target.value)}
                          placeholder="Informe o nome ou líder da sua Casa do Alto"
                          className="w-full rounded-2xl border-2 border-[#252525]/25 bg-white p-3 text-xs sm:text-sm font-semibold text-[#252525]"
                        />
                      </div>
                    )}

                    {/* Ministérios que já pertence atualmente */}
                    <div className="space-y-2 pt-2 border-t border-[#252525]/15">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-black uppercase tracking-wider text-[#252525]">
                          Ministérios em que você já atua atualmente (Opcional)
                        </label>
                        <span className="text-[11px] font-bold text-[#CB4B3B]">
                          {regCurrentMinistries.length} selecionado(s)
                        </span>
                      </div>
                      <p className="text-[11px] text-[#252525]/70">
                        Selecione as áreas em que você já serve na Igreja do Alto (pode selecionar mais de uma):
                      </p>
                      <div className="space-y-3 pt-1">
                        {CHURCH_MINISTRIES.map((group) => (
                          <div key={group.category} className="space-y-1.5">
                            <span className="block text-[10px] font-black uppercase tracking-wider text-[#CB4B3B]">
                              {group.category}
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {group.items.map((item) => {
                                const isChecked = regCurrentMinistries.includes(item.id);
                                return (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => {
                                      setRegCurrentMinistries((prev) =>
                                        isChecked
                                          ? prev.filter((m) => m !== item.id)
                                          : [...prev, item.id]
                                      );
                                    }}
                                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                                      isChecked
                                        ? "border-[#CB4B3B] bg-[#CB4B3B]/10 text-[#252525] font-bold"
                                        : "border-[#252525]/20 bg-white/70 hover:bg-white text-[#252525]/80 text-xs"
                                    }`}
                                  >
                                    <div
                                      className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 border ${
                                        isChecked
                                          ? "bg-[#CB4B3B] border-[#CB4B3B] text-white"
                                          : "border-[#252525]/40 bg-white"
                                      }`}
                                    >
                                      {isChecked && <Check className="w-2.5 h-2.5" />}
                                    </div>
                                    <span className="text-[11px] leading-tight flex-1">
                                      {item.label}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
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

  const normalizeSearchText = (value?: string | null) =>
    (value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  const filteredMembers = allMembers.filter((m) => {
    const q = normalizeSearchText(memberSearchQuery);
    const cleanQ = cleanDigits(memberSearchQuery);
    const matchesQuery =
      !q ||
      normalizeSearchText(m.name).includes(q) ||
      (cleanQ.length > 0 && Boolean(m.cpf && cleanDigits(m.cpf).includes(cleanQ))) ||
      Boolean(
        m.phone &&
          (normalizeSearchText(m.phone).includes(q) ||
            (cleanQ.length > 0 && cleanDigits(m.phone).includes(cleanQ)))
      ) ||
      Boolean(m.email && normalizeSearchText(m.email).includes(q)) ||
      Boolean(m.address?.neighborhood && normalizeSearchText(m.address.neighborhood).includes(q));

    if (!matchesQuery) return false;

    if (memberFilterCategory === "membros") {
      return m.relationship === "Membro" || m.isOfficialMember;
    }
    if (memberFilterCategory === "pastores") {
      return Boolean(
        m.isPastor || m.isLeader || m.portalRole === "pastor" || m.portalRole === "admin"
      );
    }
    if (memberFilterCategory === "admins") {
      return Boolean(m.isAdmin || m.portalRole === "admin");
    }
    if (memberFilterCategory === "visitantes") {
      return m.relationship !== "Membro" && !m.isOfficialMember;
    }
    return true;
  });


  const totalVolunteersActive = allMembers.filter(
    (m) => (m.currentMinistries || []).length > 0
  ).length;

  const totalVolunteersInterested = allMembers.filter(
    (m) => (m.interestedMinistries || []).length > 0
  ).length;

  const filteredVolunteers = allMembers.filter((m) => {
    const current = m.currentMinistries || [];
    const interested = m.interestedMinistries || [];
    const hasAny = current.length > 0 || interested.length > 0;

    // Filter by Ministry ID
    if (filterMinistryId !== "todos") {
      const inCurrent = current.includes(filterMinistryId);
      const inInterested = interested.includes(filterMinistryId);
      if (!inCurrent && !inInterested) return false;
      if (filterMinistryStatus === "atuantes" && !inCurrent) return false;
      if (filterMinistryStatus === "interessados" && !inInterested) return false;
    } else {
      if (filterMinistryStatus === "atuantes" && current.length === 0) return false;
      if (filterMinistryStatus === "interessados" && interested.length === 0) return false;
      if (filterMinistryStatus === "todos" && !hasAny) return false;
    }

    // Search query
    const q = normalizeSearchText(ministrySearchQuery);
    const cleanQ = cleanDigits(ministrySearchQuery);
    if (!q) return true;
    return (
      normalizeSearchText(m.name).includes(q) ||
      Boolean(
        m.phone &&
          (normalizeSearchText(m.phone).includes(q) ||
            (cleanQ.length > 0 && cleanDigits(m.phone).includes(cleanQ)))
      ) ||
      Boolean(m.email && normalizeSearchText(m.email).includes(q)) ||
      current.some((min) => normalizeSearchText(min).includes(q)) ||
      interested.some((min) => normalizeSearchText(min).includes(q))
    );
  });

  // Membros da equipe (Pastor, Líder ou Admin)
  const teamMembersList = allMembers.filter(
    (m) => Boolean(m.isPastor || m.isLeader || m.isAdmin)
  );

  // Membros para seleção de permissões
  const eligibleMembersToAppoint = allMembers.filter(
    (m) => m.id !== "admin-master"
  );
  const matchingMembersToAppoint = eligibleMembersToAppoint.filter((m) => {
    const q = normalizeSearchText(appointSearchQuery);
    const cleanQ = cleanDigits(appointSearchQuery);
    if (!q) return false;
    return (
      normalizeSearchText(m.name).includes(q) ||
      (cleanQ.length > 0 && Boolean(m.cpf && cleanDigits(m.cpf).includes(cleanQ))) ||
      Boolean(
        m.phone &&
          (normalizeSearchText(m.phone).includes(q) ||
            (cleanQ.length > 0 && cleanDigits(m.phone).includes(cleanQ)))
      ) ||
      Boolean(m.email && normalizeSearchText(m.email).includes(q))
    );
  });
  const selectedMemberObj = allMembers.find(
    (m) => m.id === selectedMemberToAppoint
  );

  // =========================================================================
  // TELA LOGADO: PORTAL DO MEMBRO & NÚCLEO FAMILIAR
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#DCDACF] flex flex-col justify-between text-[#252525] overflow-x-hidden">
      {/* Top Header do Portal */}
      <header className="bg-[#252525] text-[#DCDACF] border-b-4 border-[#CB4B3B] sticky top-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <BrandLogo variant="on-dark2" size="sm" />
            <span className="hidden sm:inline-block w-px h-6 bg-[#DCDACF]/20" />
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#CB4B3B] truncate">
              Portal do Membro
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 ml-auto max-w-full min-w-0">
            <div className="text-right min-w-0 flex-1">
              <div className="flex items-center justify-end gap-1.5 sm:gap-2 min-w-0">
                <span className="block text-[11px] sm:text-xs font-black uppercase text-white truncate max-w-[140px] sm:max-w-none">
                  {session.name}
                </span>
                {session.isAdmin ? (
                  <span className="shrink-0 whitespace-nowrap inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#CB4B3B] text-white text-[10px] font-black uppercase tracking-wider">
                    👑 Admin
                  </span>
                ) : session.isPastor ? (
                  <span className="shrink-0 whitespace-nowrap inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider">
                    🤝 Pastor
                  </span>
                ) : session.isLeader ? (
                  <span className="shrink-0 whitespace-nowrap inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-600 text-white text-[10px] font-black uppercase tracking-wider">
                    ⭐ Líder
                  </span>
                ) : null}
              </div>
            </div>

            {(session.isAdmin || session.isPastor || session.isLeader) && (
              <button
                type="button"
                onClick={() => handleOpenVisitsPortal("agenda")}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#3D3D3D] hover:bg-[#CB4B3B] text-[#DCDACF] text-xs font-black uppercase tracking-wider transition-colors shadow-sm shrink-0 whitespace-nowrap"
                title="Abrir o Portal de Visitas"
              >
                <ClipboardCheck className="w-3.5 h-3.5 text-[#EBD57B]" />
                <span>Portal de Visitas</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#363636] hover:bg-[#CB4B3B] text-[#DCDACF] text-xs font-bold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>

        {/* Barra de Navegação das Abas do Membro */}
        <div
          onWheel={(e) => {
            if (e.deltaY !== 0) {
              e.currentTarget.scrollLeft += e.deltaY;
            }
          }}
          className="max-w-6xl mx-auto px-3 sm:px-6 flex items-center gap-2 overflow-x-auto pb-2.5 pt-1 custom-scrollbar-dark scroll-smooth"
        >
          {(() => {
            const tabs: {
              id: ActiveTab;
              label: string;
              icon: any;
              badge?: number;
            }[] = [];

            if (session.isAdmin) {
              tabs.push({
                id: "todos-membros",
                label: `Membros (${allMembers.length})`,
                icon: Users,
              });
              tabs.push({
                id: "ministerios",
                label: "Voluntariado",
                icon: Sparkles,
              });
              tabs.push({
                id: "gestao-pastores",
                label: `Gestão de Equipe (${teamMembersList.length})`,
                icon: Crown,
              });
            }

            tabs.push({
              id: "familia",
              label: `Família (${dependents.length + (spouseData ? 2 : 1)})`,
              icon: Home,
              badge: memberData?.pendingSpouseLink ? 1 : 0,
            });

            if (!session.isAdmin) {
              tabs.push({
                id: "ministerios",
                label: "Quero Servir",
                icon: HeartHandshake,
              });
            }

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

            return tabs.map((tab: any) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-[#CB4B3B] text-[#DCDACF] shadow"
                      : "text-[#DCDACF]/80 hover:bg-[#363636] hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge ? (
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                    </span>
                  ) : null}
                </button>
              );
            });
          })()}
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-6xl w-full min-w-0 mx-auto px-3 sm:px-6 py-5 sm:py-8 space-y-6">
        {/* Notificação Global: Solicitação de Vínculo de Cônjuge Pendente */}
        {memberData?.pendingSpouseLink && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FFFBEB] border-2 border-amber-400 text-[#252525] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow">
                <Bell className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <strong className="block text-sm font-black uppercase text-amber-950">
                  💍 Solicitação de Vínculo de Cônjuge
                </strong>
                <p className="text-xs sm:text-sm text-amber-900 font-medium break-words">
                  <strong>{memberData.pendingSpouseLink.requesterName}</strong> solicitou vincular o cadastro com você como esposo(a) para unir o núcleo familiar e filhos.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleAcceptSpouseLink}
                disabled={isLinkingSpouse}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider shadow transition-colors flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{isLinkingSpouse ? "Confirmando..." : "Aceitar Vínculo"}</span>
              </button>
              <button
                type="button"
                onClick={handleRejectSpouseLink}
                disabled={isLinkingSpouse}
                className="px-3 py-2.5 rounded-xl border border-red-200 bg-white hover:bg-red-50 text-red-700 text-xs font-bold transition-colors"
              >
                ✕ Recusar
              </button>
            </div>
          </div>
        )}

        {adminFeedback && (
          <div
            className={`p-4 rounded-2xl border-2 flex items-center justify-between gap-3 text-xs sm:text-sm font-bold ${
              adminFeedback.type === "success"
                ? "bg-emerald-950 text-[#DCDACF] border-emerald-600"
                : "bg-[#F9EAE8] text-[#A93829] border-[#CB4B3B]"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {adminFeedback.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-[#CB4B3B] shrink-0" />
              )}
              <span className="break-words">{adminFeedback.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setAdminFeedback(null)}
              className="text-current opacity-70 hover:opacity-100 p-1 shrink-0"
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
            <div className="rounded-3xl bg-[#F4F3EE] p-5 sm:p-8 shadow-md border border-[#252525]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="min-w-0">
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#CB4B3B]">
                  Núcleo Familiar Registrado
                </span>
                <h2 className="text-xl sm:text-3xl font-black uppercase tracking-tight text-[#252525] mt-1 break-words">
                  Família {memberData?.spouseName ? `${memberData.name.split(" ")[0]} & ${memberData.spouseName.split(" ")[0]}` : memberData?.name}
                </h2>
                <p className="text-xs sm:text-sm text-[#252525]/75 font-medium mt-1 break-words">
                  {formatAddress(memberData?.address)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab("solicitar-visita")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-3 rounded-xl bg-[#CB4B3B] hover:bg-[#A93829] text-[#DCDACF] text-xs font-black uppercase tracking-wider shadow transition-colors shrink-0"
              >
                <HeartHandshake className="w-4 h-4 shrink-0" />
                <span>Solicitar Visita para Nossa Casa</span>
              </button>
            </div>

            {/* SEÇÃO: CÔNJUGE (Marido & Esposa) */}
            <div className="rounded-3xl bg-[#F4F3EE] p-5 sm:p-6 shadow-md border border-[#252525]/10 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#252525]/15">
                <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-[#252525]">
                  <Heart className="w-5 h-5 text-[#CB4B3B] shrink-0" />
                  <span>Vínculo de Cônjuge (Marido / Esposa)</span>
                </div>
                {spouseData && (
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-black uppercase tracking-wider shrink-0 whitespace-nowrap">
                    ✓ Vínculo Ativo
                  </span>
                )}
              </div>

              {spouseData ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-white border-2 border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-lg shrink-0">
                        {spouseData.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <strong className="block text-sm sm:text-base font-black text-[#252525] break-words">
                          {spouseData.name}
                        </strong>
                        <span className="block text-xs font-semibold text-[#252525]/70 break-all">
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
              ) : memberData?.pendingSpouseLink ? (
                <div className="space-y-4">
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#FFFBEB] border-2 border-amber-400 space-y-4 shadow-sm overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 sm:gap-3">
                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-lg shadow shrink-0">
                          <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-black uppercase tracking-wider text-amber-800">
                            Solicitação de Vínculo Recebida
                          </span>
                          <strong className="block text-sm sm:text-base font-black text-[#252525] break-words leading-snug">
                            {memberData.pendingSpouseLink.requesterName}
                          </strong>
                          <span className="block text-xs font-semibold text-[#252525]/70 break-all mt-0.5">
                            {memberData.pendingSpouseLink.requesterPhone || ""}{" "}
                            {memberData.pendingSpouseLink.requesterEmail
                              ? `• ${memberData.pendingSpouseLink.requesterEmail}`
                              : ""}
                          </span>
                        </div>
                      </div>
                      <span className="self-start px-2.5 py-1 rounded-full bg-amber-200 text-amber-900 text-[10px] sm:text-xs font-black uppercase tracking-wider shrink-0 whitespace-nowrap">
                        Aguardando Você
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-[#252525]/85 leading-relaxed font-medium break-words">
                      <strong>{memberData.pendingSpouseLink.requesterName}</strong> solicitou vincular o cadastro com você como esposo(a). Ao aceitar, vocês compartilharão o mesmo núcleo familiar, endereço residencial e a lista de filhos no cuidado pastoral.
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-300/50">
                      <button
                        type="button"
                        onClick={handleAcceptSpouseLink}
                        disabled={isLinkingSpouse}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider shadow transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        <span>{isLinkingSpouse ? "Confirmando..." : "Aceitar Vínculo de Cônjuge"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRejectSpouseLink}
                        disabled={isLinkingSpouse}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-300 bg-white hover:bg-red-50 text-red-700 text-xs font-bold transition-colors"
                      >
                        <X className="w-4 h-4" />
                        <span>Recusar</span>
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
              ) : memberData?.sentSpouseLinkRequest ? (
                <div className="space-y-4">
                  <div className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-amber-300/60 space-y-3 shadow-sm overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 sm:gap-3">
                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-lg shrink-0">
                          <Clock3 className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-black uppercase tracking-wider text-amber-800">
                            Solicitação Enviada
                          </span>
                          <strong className="block text-sm sm:text-base font-black text-[#252525] break-words leading-snug">
                            {memberData.sentSpouseLinkRequest.targetName}
                          </strong>
                          <span className="block text-xs font-semibold text-[#252525]/70 break-all mt-0.5">
                            {memberData.sentSpouseLinkRequest.targetEmail
                              ? memberData.sentSpouseLinkRequest.targetEmail
                              : "Aguardando confirmação"}
                          </span>
                        </div>
                      </div>
                      <span className="self-start px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-[10px] sm:text-xs font-black uppercase tracking-wider shrink-0 whitespace-nowrap">
                        ⏳ Pendente
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-[#252525]/80 font-medium leading-relaxed break-words">
                      Uma notificação foi enviada para o portal de <strong>{memberData.sentSpouseLinkRequest.targetName}</strong>. Assim que ele(a) acessar e aceitar o vínculo, seus perfis e os filhos serão conectados automaticamente.
                    </p>

                    <div className="pt-2 border-t border-[#252525]/10">
                      <button
                        type="button"
                        onClick={handleCancelSpouseLink}
                        disabled={isLinkingSpouse}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Cancelar Solicitação</span>
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
              ) : memberData?.maritalStatus === "Casado(a)" ? (
                <div className="space-y-3">
                  <p className="text-xs sm:text-sm text-[#252525]/80 font-medium leading-relaxed">
                    Vincule o cadastro do seu esposo(a) digitando o <strong>CPF</strong> ou <strong>E-mail</strong> dele(a). Ao solicitar, o cônjuge receberá uma notificação no portal para confirmar a união da família e dos filhos.
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
                      {isLinkingSpouse ? "Enviando..." : "Solicitar Vínculo"}
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
              ) : (
                <div className="p-4 rounded-2xl bg-white/70 border border-[#252525]/15 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#252525]/80">
                    <Heart className="w-4 h-4 text-[#CB4B3B]" />
                    <span>
                      Estado civil registrado: <strong>{memberData?.maritalStatus || "Solteiro(a)"}</strong>
                    </span>
                  </div>
                  <p className="text-xs text-[#252525]/70 leading-relaxed">
                    A vinculação de cônjuge está disponível exclusivamente para membros com estado civil <strong>Casado(a)</strong>. Caso tenha se casado ou precise atualizar o seu cadastro, você pode alterar seu estado civil na aba <strong>Meu Cadastro</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("meu-cadastro");
                      startEditingProfile();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#252525] hover:bg-[#CB4B3B] text-[#DCDACF] text-xs font-bold transition-colors mt-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Atualizar Meu Estado Civil</span>
                  </button>
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
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-[#252525]">
                        Local da Visita
                      </span>
                      <label className="inline-flex items-center gap-1.5 text-xs font-bold text-[#CB4B3B] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useCustomAddress}
                          onChange={(e) => setUseCustomAddress(e.target.checked)}
                          className="w-4 h-4 rounded shrink-0"
                        />
                        <span>Será em outro endereço (ex: hospital, empresa, trabalho)</span>
                      </label>
                    </div>

                    {!useCustomAddress ? (
                      <p className="text-xs font-semibold text-[#252525]/80">
                        {formatAddress(memberData?.address)}
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            required
                            value={customStreet}
                            onChange={(e) => setCustomStreet(e.target.value)}
                            placeholder="Rua / Local (ex: hospital, trabalho)"
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
                        <div className="sm:col-span-2">
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
            <div className="rounded-3xl bg-[#F4F3EE] p-5 sm:p-6 shadow-md border border-[#252525]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#CB4B3B]">
                  Histórico Pastoral
                </span>
                <h2 className="text-xl sm:text-2xl font-black uppercase text-[#252525]">
                  Solicitações da Família ({myRequests.length})
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab("solicitar-visita")}
                className="w-full sm:w-auto text-center px-4 py-2.5 rounded-xl bg-[#CB4B3B] hover:bg-[#A93829] text-[#DCDACF] text-xs font-black uppercase tracking-wider shadow transition-colors shrink-0 whitespace-nowrap"
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
          <div className="max-w-2xl mx-auto rounded-3xl bg-[#F4F3EE] p-5 sm:p-8 shadow-xl border border-[#252525]/15 space-y-6">
            <div className="pb-3 border-b border-[#252525]/15 flex items-center justify-between flex-wrap gap-3">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#CB4B3B]">
                  Dados Cadastrais
                </span>
                <h2 className="text-xl sm:text-2xl font-black uppercase text-[#252525]">
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
                {/* Banner de Perfil com Foto */}
                <div className="p-4 rounded-2xl bg-white border border-[#252525]/10 flex items-center gap-4 shadow-sm">
                  {memberData.photoUrl ? (
                    <img
                      src={memberData.photoUrl}
                      alt={memberData.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-[#CB4B3B] shadow-md shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-[#CB4B3B]/10 text-[#CB4B3B] border-2 border-dashed border-[#CB4B3B]/30 flex flex-col items-center justify-center shrink-0">
                      <Camera className="w-6 h-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-black text-[#252525] break-words">
                        {memberData.name}
                      </h3>
                      {memberData.isAdmin && (
                        <span className="px-2 py-0.5 rounded-full bg-[#CB4B3B] text-white text-[10px] font-black uppercase shrink-0 whitespace-nowrap">
                          👑 Admin
                        </span>
                      )}
                      {memberData.isPastor && !memberData.isAdmin && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-700 text-white text-[10px] font-black uppercase shrink-0 whitespace-nowrap">
                          🤝 Pastor
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[#252525]/60 font-semibold block mt-0.5">
                      {memberData.photoUrl ? "Foto de perfil vinculada" : "Sem foto cadastrada (clique em Editar para adicionar)"} • {memberData.relationship || "Membro"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-[#252525]">
                  <div className="p-3.5 rounded-xl bg-white border border-[#252525]/10 min-w-0">
                    <span className="block text-[10px] font-black uppercase text-[#252525]/60 mb-0.5">
                      Nome Completo
                    </span>
                    <strong className="text-sm font-black break-words">{memberData.name}</strong>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-[#252525]/10 min-w-0">
                    <span className="block text-[10px] font-black uppercase text-[#252525]/60 mb-0.5">
                      CPF (Chave Única)
                    </span>
                    <strong className="text-sm font-black">{formatCPF(memberData.cpf)}</strong>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-[#252525]/10 min-w-0">
                    <span className="block text-[10px] font-black uppercase text-[#252525]/60 mb-0.5">
                      E-mail de Acesso
                    </span>
                    <strong className="text-sm font-black break-all">{memberData.email || "Não informado"}</strong>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-[#252525]/10 min-w-0">
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
                        Participação em Casa do Alto
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

                {/* Bloco de Ministérios em Visualização */}
                <div className="p-4 rounded-2xl bg-white border border-[#252525]/15 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#252525]/10">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#CB4B3B] shrink-0" />
                      <h3 className="text-xs font-black uppercase tracking-wide text-[#252525]">
                        Envolvimento em Ministérios
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("ministerios")}
                      className="text-[11px] font-bold text-[#CB4B3B] hover:underline"
                    >
                      Aba Quero Servir (Novos Ministérios) →
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="block text-[10px] font-black uppercase text-[#252525]/60 mb-1.5">
                        Ministérios em que já atua atualmente:
                      </span>
                      {memberData.currentMinistries && memberData.currentMinistries.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {memberData.currentMinistries.map((m) => (
                            <span
                              key={m}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1"
                            >
                              <Check className="w-3 h-3 text-emerald-600" />
                              {m}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[#252525]/60 italic">
                          Nenhum ministério informado até o momento.
                        </p>
                      )}
                    </div>

                    <div>
                      <span className="block text-[10px] font-black uppercase text-[#252525]/60 mb-1.5">
                        Áreas com interesse em servir:
                      </span>
                      {memberData.interestedMinistries && memberData.interestedMinistries.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {memberData.interestedMinistries.map((m) => (
                            <span
                              key={m}
                              className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold flex items-center gap-1"
                            >
                              <Star className="w-3 h-3 text-amber-600" />
                              {m}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[#252525]/60 italic">
                          Ainda não selecionou áreas de interesse.
                        </p>
                      )}
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

                {/* Foto de Perfil */}
                <div className="p-4 rounded-2xl bg-white border-2 border-[#252525]/15 space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-[#252525]">
                    Foto de Perfil
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-[#F4F3EE] border-2 border-dashed border-[#252525]/30 flex items-center justify-center overflow-hidden shrink-0 relative">
                      {editPhotoUrl ? (
                        <img
                          src={editPhotoUrl}
                          alt="Foto"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera className="w-6 h-6 text-[#252525]/40" />
                      )}
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#252525] hover:bg-[#CB4B3B] text-[#DCDACF] text-xs font-bold cursor-pointer transition-colors shadow">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isCompressingPhotoEdit ? "Otimizando..." : editPhotoUrl ? "Trocar Foto" : "Escolher Foto"}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handlePhotoUpload(
                                e,
                                (b64) => setEditPhotoUrl(b64),
                                setIsCompressingPhotoEdit
                              )
                            }
                          />
                        </label>
                        {editPhotoUrl && (
                          <button
                            type="button"
                            onClick={() => setEditPhotoUrl("")}
                            className="px-2.5 py-1 text-xs text-red-600 font-bold hover:underline"
                          >
                            Remover foto
                          </button>
                        )}
                      </div>
                      <span className="block text-[10px] text-[#252525]/60">
                        A foto será otimizada automaticamente para seu perfil na igreja.
                      </span>
                    </div>
                  </div>
                </div>

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

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
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

                  {/* Pergunta 3: Participa de Casa do Alto */}
                  <div className="space-y-2 pt-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-[#252525]">
                      Participa de alguma Casa do Alto?
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
                        Qual Casa do Alto?
                      </label>
                      <input
                        type="text"
                        value={editActivityName}
                        onChange={(e) => setEditActivityName(e.target.value)}
                        placeholder="Informe qual Casa do Alto participa"
                        className="w-full rounded-2xl border-2 border-[#252525]/25 bg-white p-3 text-xs sm:text-sm font-semibold text-[#252525]"
                      />
                    </div>
                  )}

                  {/* Ministérios que já serve */}
                  <div className="space-y-2 pt-2 border-t border-[#252525]/15">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-black uppercase tracking-wider text-[#252525]">
                        Ministérios em que você já atua atualmente
                      </label>
                      <span className="text-[11px] font-bold text-[#CB4B3B]">
                        {editCurrentMinistries.length} selecionado(s)
                      </span>
                    </div>
                    <p className="text-[11px] text-[#252525]/70">
                      Atualize as áreas em que você já serve na Igreja do Alto:
                    </p>
                    <div className="space-y-2.5 pt-1">
                      {CHURCH_MINISTRIES.map((group) => (
                        <div key={group.category} className="space-y-1">
                          <span className="block text-[10px] font-black uppercase tracking-wider text-[#CB4B3B]">
                            {group.category}
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {group.items.map((item) => {
                              const isChecked = editCurrentMinistries.includes(item.id);
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => {
                                    setEditCurrentMinistries((prev) =>
                                      isChecked
                                        ? prev.filter((m) => m !== item.id)
                                        : [...prev, item.id]
                                    );
                                  }}
                                  className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                                    isChecked
                                      ? "border-[#CB4B3B] bg-[#CB4B3B]/10 text-[#252525] font-bold"
                                      : "border-[#252525]/20 bg-white/70 hover:bg-white text-[#252525]/80 text-xs"
                                  }`}
                                >
                                  <div
                                    className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 border ${
                                      isChecked
                                        ? "bg-[#CB4B3B] border-[#CB4B3B] text-white"
                                        : "border-[#252525]/40 bg-white"
                                    }`}
                                  >
                                    {isChecked && <Check className="w-2.5 h-2.5" />}
                                  </div>
                                  <span className="text-[11px] leading-tight flex-1">
                                    {item.label}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
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
            ABA 5: TODOS OS MEMBROS (Apenas Admin)
           =================================================================== */}
        {activeTab === "todos-membros" && session?.isAdmin && (
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

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleOpenVisitsPortal("pessoas")}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-[#252525] hover:bg-[#3D3D3D] text-[#DCDACF] text-xs font-black uppercase tracking-wider shadow transition-colors"
                  title="Abrir o Portal de Visitas com histórico completo e acompanhamento pastoral por pessoas"
                >
                  <ClipboardCheck className="w-4 h-4 text-[#EBD57B]" />
                  <span>Visitas por Pessoas</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#DCDACF]/60" />
                </button>

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
                  {allMembers.filter((m) => m.isPastor || m.isLeader).length}
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
                <Search className="w-4 h-4 text-[#252525]/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  placeholder="Pesquisar por nome, CPF, telefone ou e-mail..."
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border-2 border-[#252525]/20 bg-white text-xs sm:text-sm font-semibold text-[#252525] placeholder-[#252525]/40"
                />
                {memberSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setMemberSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#252525]/40 hover:text-[#252525] p-1"
                    title="Limpar pesquisa"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
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

            {/* Lista dos Membros em Formato de Lista / Tabela */}
            {filteredMembers.length === 0 ? (
              <div className="p-8 text-center rounded-3xl bg-[#F4F3EE] border-2 border-dashed border-[#252525]/20 space-y-2">
                <Users className="w-8 h-8 text-[#CB4B3B] mx-auto" />
                <p className="text-sm font-bold text-[#252525]">
                  Nenhum membro encontrado com os filtros selecionados.
                </p>
                <p className="text-xs text-[#252525]/60">
                  Verifique a digitação ou selecione outra categoria de filtro.
                </p>
              </div>
            ) : (
              <div className="rounded-3xl bg-white border border-[#252525]/15 shadow-sm overflow-hidden">
                {/* Cabeçalho da Tabela (Desktop) */}
                <div className="hidden lg:grid grid-cols-12 gap-3 px-6 py-3 bg-[#252525] text-[#DCDACF] text-[11px] font-black uppercase tracking-wider">
                  <div className="col-span-4">Membro / Identificação</div>
                  <div className="col-span-3">Contato & Acesso</div>
                  <div className="col-span-3">Localização & Ministérios</div>
                  <div className="col-span-2 text-right">Ações</div>
                </div>

                <div className="divide-y divide-[#252525]/10">
                  {filteredMembers.map((m) => {
                    const isPastor = Boolean(
                      m.isPastor ||
                        m.portalRole === "pastor" ||
                        m.portalRole === "admin"
                    );
                    const isAdmin = Boolean(m.isAdmin || m.portalRole === "admin");
                    const currentMinistries = m.currentMinistries || [];
                    const interestedMinistries = m.interestedMinistries || [];
                    const cleanPhone = cleanDigits(m.phone || "");
                    const whatsappUrl = cleanPhone
                      ? `https://wa.me/55${cleanPhone}`
                      : null;

                    return (
                      <div
                        key={m.id}
                        className="px-5 py-3.5 hover:bg-[#F9F8F5] transition-colors flex flex-col lg:grid lg:grid-cols-12 gap-3 items-start lg:items-center cursor-pointer group"
                        onClick={() => setSelectedMemberDetail(m)}
                      >
                        {/* Coluna 1: Membro / Identificação */}
                        <div className="lg:col-span-4 flex items-center gap-3 w-full">
                          {m.photoUrl ? (
                            <img
                              src={m.photoUrl}
                              alt={m.name}
                              className="w-10 h-10 rounded-2xl object-cover border border-[#252525]/15 shrink-0 shadow-sm"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-2xl bg-[#DCDACF] text-[#252525] group-hover:bg-[#CB4B3B] group-hover:text-white transition-colors flex items-center justify-center font-black text-sm shrink-0">
                              {m.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-sm font-black text-[#252525] truncate">
                                {m.name}
                              </span>
                              {isAdmin && (
                                <span className="px-1.5 py-0.5 rounded-full bg-[#CB4B3B] text-white text-[9px] font-black uppercase tracking-wider">
                                  👑 Admin
                                </span>
                              )}
                              {isPastor && !isAdmin && (
                                <span className="px-1.5 py-0.5 rounded-full bg-[#252525] text-white text-[9px] font-black uppercase tracking-wider">
                                  🤝 Pastor
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-semibold text-[#252525]/60 mt-0.5">
                              <span>{m.relationship || "Membro"}</span>
                              {m.cpf && <span>• CPF: {formatCPF(m.cpf)}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Coluna 2: Contato & Acesso */}
                        <div className="lg:col-span-3 text-xs font-semibold text-[#252525]/80 space-y-0.5 w-full">
                          {m.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-[#CB4B3B] shrink-0" />
                              <span className="font-bold">{formatPhoneBR(m.phone)}</span>
                              {whatsappUrl && (
                                <a
                                  href={whatsappUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-[10px] text-emerald-700 hover:text-emerald-800 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200"
                                  title="Abrir conversa no WhatsApp"
                                >
                                  WhatsApp ↗
                                </a>
                              )}
                            </div>
                          )}
                          {m.email && (
                            <div className="flex items-center gap-1.5 truncate text-[#252525]/65">
                              <Mail className="w-3 h-3 text-[#252525]/40 shrink-0" />
                              <span className="truncate">{m.email}</span>
                            </div>
                          )}
                        </div>

                        {/* Coluna 3: Localização & Ministérios */}
                        <div className="lg:col-span-3 text-xs space-y-1 w-full">
                          <div className="flex items-center gap-1 text-[#252525]/70 font-semibold truncate">
                            <MapPin className="w-3 h-3 text-[#252525]/40 shrink-0" />
                            <span className="truncate">
                              {m.address?.neighborhood ? `${m.address.neighborhood}, ` : ""}
                              {m.address?.city || "Mogi das Cruzes"}
                            </span>
                          </div>

                          {/* Tags de Ministérios */}
                          <div className="flex flex-wrap items-center gap-1">
                            {currentMinistries.length > 0 ? (
                              <>
                                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black truncate max-w-[130px]">
                                  ✓ {currentMinistries[0]}
                                </span>
                                {currentMinistries.length > 1 && (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black">
                                    +{currentMinistries.length - 1}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-[10px] text-[#252525]/40 italic">
                                Sem ministério atual
                              </span>
                            )}

                            {interestedMinistries.length > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-bold flex items-center gap-0.5">
                                <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                                {interestedMinistries.length} interesse(s)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Coluna 4: Ações */}
                        <div className="lg:col-span-2 flex items-center justify-end gap-2 w-full pt-2 lg:pt-0 border-t lg:border-t-0 border-[#252525]/10">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMemberDetail(m);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#252525] group-hover:bg-[#CB4B3B] text-[#DCDACF] text-xs font-black uppercase tracking-wider transition-colors shadow-sm"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver Perfil</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
            ABA: MINISTÉRIOS (Atuação Atual & Interesse em Servir)
           =================================================================== */}
        {activeTab === "ministerios" && (
          <div className="space-y-6">
            {/* Cabeçalho da Aba */}
            <div className="rounded-3xl bg-[#F4F3EE] p-6 sm:p-8 shadow-md border border-[#252525]/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#CB4B3B] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Corpo de Cristo em Ação
                </span>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#252525] mt-1">
                  Ministérios & Quero Servir
                </h2>
                <p className="text-xs sm:text-sm text-[#252525]/75 font-medium mt-1 max-w-2xl">
                  {session.isAdmin
                    ? "Gerencie as equipes ministeriais, veja voluntários atuantes e responda com carinho aos membros interessados em servir."
                    : "Você sente o desejo de servir a Deus na igreja mas não sabia como começar ou tinha vergonha de falar com alguém? Este espaço foi feito para você dar esse passo com toda tranquilidade!"}
                </p>
              </div>

              {/* Se for Admin: seletor de visualização (Relatório vs Formulário de Interesse) */}
              {session.isAdmin && (
                <div className="flex flex-col sm:flex-row bg-[#252525] p-1.5 rounded-2xl gap-1 w-full md:w-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setMinistryViewMode("relatorio")}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors ${
                      ministryViewMode === "relatorio"
                        ? "bg-[#CB4B3B] text-white shadow"
                        : "text-[#DCDACF]/70 hover:text-white"
                    }`}
                  >
                    Relatório Geral de Voluntários
                  </button>
                  <button
                    type="button"
                    onClick={() => setMinistryViewMode("meu-formulario")}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors ${
                      ministryViewMode === "meu-formulario"
                        ? "bg-[#CB4B3B] text-white shadow"
                        : "text-[#DCDACF]/70 hover:text-white"
                    }`}
                  >
                    Formulário Quero Servir
                  </button>
                </div>
              )}
            </div>

            {/* FEEDBACK DE ATUALIZAÇÃO */}
            {ministryFeedback && (
              <div
                className={`p-4 rounded-2xl border-2 flex items-center justify-between gap-3 text-xs sm:text-sm font-bold ${
                  ministryFeedback.type === "success"
                    ? "bg-emerald-950 text-[#DCDACF] border-emerald-600"
                    : "bg-[#F9EAE8] text-[#A93829] border-[#CB4B3B]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {ministryFeedback.type === "success" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-[#CB4B3B] shrink-0" />
                  )}
                  <span>{ministryFeedback.text}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMinistryFeedback(null)}
                  className="opacity-70 hover:opacity-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* MODO 1: RELATÓRIO DE VOLUNTÁRIOS (APENAS ADMINISTRADORES) */}
            {session.isAdmin && ministryViewMode === "relatorio" ? (
              <div className="space-y-6">
                {/* Indicadores do Relatório */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-white border border-[#252525]/10 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                      <Check className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-[#252525]/60">
                        Voluntários Atuantes
                      </span>
                      <strong className="text-2xl font-black text-emerald-700">
                        {totalVolunteersActive} pessoas
                      </strong>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-[#252525]/10 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                      <Star className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-[#252525]/60">
                        Interessados em Servir
                      </span>
                      <strong className="text-2xl font-black text-amber-700">
                        {totalVolunteersInterested} pessoas
                      </strong>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-[#252525]/10 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#252525] text-white flex items-center justify-center shrink-0">
                      <Award className="w-5 h-5 text-[#EBD57B]" />
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-[#252525]/60">
                        Total de Ministérios
                      </span>
                      <strong className="text-2xl font-black text-[#252525]">
                        {ALL_MINISTRY_IDS.length} áreas
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Filtros do Relatório */}
                <div className="p-4 rounded-2xl bg-[#F4F3EE] border border-[#252525]/10 space-y-3">
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-[#252525]/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={ministrySearchQuery}
                        onChange={(e) => setMinistrySearchQuery(e.target.value)}
                        placeholder="Buscar por voluntário, telefone ou ministério..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-[#252525]/20 bg-white text-xs sm:text-sm font-semibold"
                      />
                    </div>

                    <div className="w-full md:w-80">
                      <select
                        value={filterMinistryId}
                        onChange={(e) => setFilterMinistryId(e.target.value)}
                        className="w-full py-2.5 px-3 rounded-xl border-2 border-[#252525]/20 bg-white text-xs sm:text-sm font-bold text-[#252525]"
                      >
                        <option value="todos">Todos os Ministérios</option>
                        {CHURCH_MINISTRIES.map((group) => (
                          <optgroup key={group.category} label={group.category}>
                            {group.items.map((item) => {
                              const activeCount = allMembers.filter((m) =>
                                (m.currentMinistries || []).includes(item.id)
                              ).length;
                              const interestedCount = allMembers.filter((m) =>
                                (m.interestedMinistries || []).includes(item.id)
                              ).length;
                              return (
                                <option key={item.id} value={item.id}>
                                  {item.label} ({activeCount} atuam • {interestedCount} interessados)
                                </option>
                              );
                            })}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#252525]/10">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[
                        { id: "todos", label: "Todos os Registros" },
                        { id: "interessados", label: "⭐ Apenas Interessados em Servir" },
                        { id: "atuantes", label: "✓ Apenas Atuantes Atuais" },
                      ].map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setFilterMinistryStatus(st.id as any)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                            filterMinistryStatus === st.id
                              ? "bg-[#252525] text-white"
                              : "bg-white text-[#252525]/80 hover:bg-[#DCDACF]"
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>

                    <span className="text-xs font-bold text-[#252525]/60">
                      {filteredVolunteers.length} pessoa(s) encontrada(s)
                    </span>
                  </div>
                </div>

                {/* Lista de Voluntários do Relatório */}
                {filteredVolunteers.length === 0 ? (
                  <div className="p-8 text-center rounded-3xl bg-[#F4F3EE] border-2 border-dashed border-[#252525]/20 space-y-2">
                    <Sparkles className="w-8 h-8 text-[#CB4B3B] mx-auto" />
                    <p className="text-sm font-bold text-[#252525]">
                      Nenhum voluntário encontrado com os filtros selecionados.
                    </p>
                    <p className="text-xs text-[#252525]/60">
                      Tente alterar o ministério selecionado ou o modo de busca.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredVolunteers.map((m) => {
                      const current = m.currentMinistries || [];
                      const interested = m.interestedMinistries || [];
                      const isPastor = Boolean(m.isPastor || m.portalRole === "pastor" || m.portalRole === "admin");
                      const isAdmin = Boolean(m.isAdmin || m.portalRole === "admin");
                      const cleanPhone = cleanDigits(m.phone || "");
                      const whatsappUrl = cleanPhone
                        ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
                            `Olá ${m.name}! Aqui é da liderança da Igreja do Alto sobre os ministérios da igreja.`
                          )}`
                        : null;

                      return (
                        <div
                          key={m.id}
                          className="p-5 rounded-2xl bg-white border border-[#252525]/15 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden"
                        >
                          <div className="space-y-2 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedMemberDetail(m)}
                                className="text-base font-black text-[#252525] hover:text-[#CB4B3B] text-left transition-colors flex items-center gap-1.5 break-words"
                              >
                                <span>{m.name}</span>
                              </button>
                              {isAdmin && (
                                <span className="px-2 py-0.5 rounded-full bg-[#CB4B3B] text-white text-[10px] font-black uppercase tracking-wider shrink-0 whitespace-nowrap">
                                  👑 Admin Total
                                </span>
                              )}
                              {isPastor && !isAdmin && (
                                <span className="px-2 py-0.5 rounded-full bg-[#252525] text-white text-[10px] font-black uppercase tracking-wider shrink-0 whitespace-nowrap">
                                  🤝 Pastor
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded-md bg-[#F4F3EE] text-[#252525]/70 text-[10px] font-bold">
                                {m.attendanceTime || "Membro"}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-[#252525]/75 font-semibold">
                              {m.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="w-3.5 h-3.5 text-[#CB4B3B] shrink-0" />
                                  <span>{formatPhoneBR(m.phone)}</span>
                                </div>
                              )}
                              {m.email && (
                                <div className="flex items-center gap-1 min-w-0">
                                  <Mail className="w-3.5 h-3.5 text-[#252525]/50 shrink-0" />
                                  <span className="break-all">{m.email}</span>
                                </div>
                              )}
                              {m.address?.neighborhood && (
                                <div className="flex items-center gap-1 text-[#252525]/60">
                                  <MapPin className="w-3.5 h-3.5 text-[#252525]/40 shrink-0" />
                                  <span>{m.address.neighborhood}, {m.address.city || "Mogi das Cruzes"}</span>
                                </div>
                              )}
                            </div>

                            {/* Ministérios Atuantes */}
                            {current.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                                  Já atua ({current.length}):
                                </span>
                                {current.map((min) => (
                                  <span
                                    key={min}
                                    className={`px-2 py-0.5 rounded-md text-xs font-bold border ${
                                      filterMinistryId === min
                                        ? "bg-emerald-600 text-white border-emerald-600"
                                        : "bg-emerald-50 text-emerald-800 border-emerald-200"
                                    }`}
                                  >
                                    ✓ {min}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Ministérios com Interesse em Servir */}
                            {interested.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                <span className="text-[10px] font-black uppercase text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                                  Interesse em Servir ({interested.length}):
                                </span>
                                {interested.map((min) => (
                                  <span
                                    key={min}
                                    className={`px-2 py-0.5 rounded-md text-xs font-bold border ${
                                      filterMinistryId === min
                                        ? "bg-amber-600 text-white border-amber-600"
                                        : "bg-amber-50 text-amber-900 border-amber-300"
                                    }`}
                                  >
                                    ⭐ {min}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Ações Rápidas de Contato */}
                          <div className="flex md:flex-col items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#252525]/10">
                            {whatsappUrl && (
                              <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider transition-colors shadow-sm"
                                title="Enviar mensagem no WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>WhatsApp</span>
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => setSelectedMemberDetail(m)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#252525] hover:bg-[#3D3D3D] text-[#DCDACF] text-xs font-bold transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Ver Perfil</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* MODO 2: FORMULÁRIO PARA ATRAIR NOVOS VOLUNTÁRIOS */
              <form onSubmit={handleSaveMinistries} className="space-y-6">
                {/* Banner de Acolhimento e Encorajamento */}
                <div className="rounded-3xl bg-gradient-to-br from-[#252525] to-[#383838] text-[#DCDACF] p-6 sm:p-8 shadow-md border border-[#252525] relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-6 translate-y-6">
                    <HeartHandshake className="w-48 h-48 text-white" />
                  </div>
                  <div className="relative z-10 space-y-3 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#EBD57B] text-xs font-bold uppercase tracking-wider border border-white/15">
                      <HeartHandshake className="w-3.5 h-3.5" />
                      <span>Voluntariado com Propósito</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                      Seu dom faz a diferença na Casa do Alto!
                    </h3>
                    <p className="text-xs sm:text-sm text-[#DCDACF]/85 leading-relaxed">
                      Servir é uma das formas mais lindas de viver a comunhão e exercer o amor de Cristo. Mesmo que você nunca tenha servido em uma igreja ou ache que precisa de experiência prévia, nós oferecemos todo treinamento, cuidado e acompanhamento com carinho.
                    </p>
                    <p className="text-xs text-[#EBD57B] font-bold">
                      💡 Marque abaixo as áreas onde você tem vontade ou curiosidade de servir (pode marcar mais de uma). A liderança entrará em contato com você com todo acolhimento para conversar!
                    </p>
                  </div>
                </div>

                {/* Card de Seleção dos Ministérios de Interesse */}
                <div className="rounded-3xl bg-[#F4F3EE] p-6 sm:p-8 shadow-md border border-[#252525]/15 space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-[#252525]/15 flex-wrap gap-2">
                    <div>
                      <span className="text-xs font-extrabold uppercase tracking-widest text-[#CB4B3B]">
                        Onde você gostaria de servir?
                      </span>
                      <h3 className="text-lg sm:text-xl font-black uppercase text-[#252525] mt-0.5">
                        Escolha uma ou mais áreas de interesse
                      </h3>
                      <p className="text-xs text-[#252525]/70 mt-0.5">
                        Você pode selecionar quantas áreas quiser. Sem pressão — apenas para nos conhecermos!
                      </p>
                    </div>
                    <span className="px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider border border-amber-300">
                      {myInterestedMinistries.length} área(s) selecionada(s)
                    </span>
                  </div>

                  <div className="space-y-6">
                    {CHURCH_MINISTRIES.map((group) => {
                      const isLouvorGroup = group.category === "Ministério de Louvor";
                      return (
                        <div key={`int-${group.category}`} className="space-y-3">
                          <span className="block text-xs font-black uppercase tracking-wider text-[#CB4B3B] border-b border-[#252525]/10 pb-1">
                            {group.category}
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {group.items.map((item) => {
                              const isChecked = myInterestedMinistries.includes(item.id);
                              return (
                                <button
                                  key={`int-${item.id}`}
                                  type="button"
                                  onClick={() => {
                                    setMyInterestedMinistries((prev) =>
                                      isChecked
                                        ? prev.filter((m) => m !== item.id)
                                        : [...prev, item.id]
                                    );
                                  }}
                                  className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 text-left transition-all ${
                                    isChecked
                                      ? "border-amber-600 bg-white shadow-sm ring-2 ring-amber-600/30"
                                      : "border-[#252525]/15 bg-white/70 hover:bg-white text-[#252525]/85"
                                  }`}
                                >
                                  <div
                                    className={`w-5 h-5 mt-0.5 rounded-lg border flex items-center justify-center shrink-0 ${
                                      isChecked
                                        ? "bg-amber-600 border-amber-600 text-white"
                                        : "border-[#252525]/30 bg-white"
                                    }`}
                                  >
                                    {isChecked && <Star className="w-3.5 h-3.5 fill-white" />}
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="block text-xs sm:text-sm font-bold leading-snug text-[#252525]">
                                      {item.label}
                                    </span>
                                    {item.description && (
                                      <span className="block text-[11px] text-[#252525]/65 leading-tight">
                                        {item.description}
                                      </span>
                                    )}
                                    {item.requiresAudition && (
                                      <span className="inline-block mt-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                        Entrada mediante audição
                                      </span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          {/* Observação Exclusiva do Louvor no Fim */}
                          {isLouvorGroup && (
                            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300 text-amber-950 flex items-start gap-3 mt-2">
                              <Music className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                              <div className="text-xs leading-relaxed space-y-1">
                                <strong className="font-bold block text-amber-900">
                                  Observação para o Ministério de Louvor:
                                </strong>
                                <p>
                                  A entrada no ministério de Louvor é realizada mediante uma <strong>agenda prévia estabelecida de audições da Igreja do Alto</strong>.
                                </p>
                                <p className="text-amber-900/90 text-[11px]">
                                  A igreja realiza períodos específicos de audições ao longo do ano (não temos datas fixas contínuas). Ao manifestar seu interesse aqui, seu nome e contato ficam registrados em nosso banco de talentos e a liderança do Louvor entrará em contato quando o próximo ciclo oficial de audições for aberto!
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Feedback de Confirmação Visível logo acima do Botão */}
                  {ministryFeedback && (
                    <div
                      className={`p-4 rounded-2xl border-2 flex items-center justify-between gap-3 text-xs sm:text-sm font-bold ${
                        ministryFeedback.type === "success"
                          ? "bg-emerald-950 text-[#DCDACF] border-emerald-600"
                          : "bg-[#F9EAE8] text-[#A93829] border-[#CB4B3B]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {ministryFeedback.type === "success" ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-[#CB4B3B] shrink-0" />
                        )}
                        <span>{ministryFeedback.text}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMinistryFeedback(null)}
                        className="opacity-70 hover:opacity-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div className="pt-5 border-t border-[#252525]/15 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="text-xs font-semibold text-[#252525]/75 text-center sm:text-left">
                      Ao salvar, seus dados e interesses são registrados com segurança para os pastores e líderes ministeriais da igreja.
                    </span>

                    <button
                      type="submit"
                      disabled={isSavingMinistries}
                      className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#CB4B3B] hover:bg-[#A93829] text-[#DCDACF] text-xs sm:text-sm font-black uppercase tracking-wider shadow-md transition-colors flex items-center justify-center gap-2 shrink-0"
                    >
                      {isSavingMinistries ? (
                        <span>Enviando seu interesse...</span>
                      ) : (
                        <>
                          <HeartHandshake className="w-4 h-4" />
                          <span>Quero Servir nestes Ministérios</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ===================================================================
            ABA 6: GESTÃO DE EQUIPE (Exclusivo para Admin)
           =================================================================== */}
        {activeTab === "gestao-pastores" && session?.isAdmin && (
          <div className="space-y-6">
            {/* Cabeçalho */}
            <div className="rounded-3xl bg-[#252525] text-[#DCDACF] p-6 sm:p-8 border-b-4 border-[#CB4B3B] shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[#CB4B3B]">
                  <Crown className="w-4 h-4" />
                  Corpo Pastoral, Liderança & Administração
                </span>
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
                  Gestão de Equipe & Acessos ({teamMembersList.length})
                </h2>
                <p className="text-xs sm:text-sm text-[#DCDACF]/80 leading-relaxed">
                  Defina e gerencie quem atua como <strong>Pastor(a)</strong>, <strong>Líder</strong> ou{" "}
                  <strong>Administrador(a)</strong> de forma totalmente independente.
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

            {/* Card: Nomear ou Alterar Funções na Equipe */}
            <div className="rounded-3xl bg-[#F4F3EE] p-6 shadow-md border border-[#252525]/15 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#252525]/15">
                <ShieldCheck className="w-5 h-5 text-[#CB4B3B]" />
                <h3 className="text-base font-black uppercase text-[#252525]">
                  Nomear ou Alterar Funções de Membro
                </h3>
              </div>

              <form onSubmit={handleQuickAppointPastor} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-[#252525]">
                      Localize ou Selecione o Membro *
                    </label>

                    {/* SE JÁ HÁ UM MEMBRO SELECIONADO: Mostra card do membro com botão de trocar */}
                    {selectedMemberToAppoint && selectedMemberObj ? (
                      <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-600 flex items-center justify-between gap-3 shadow-sm">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-black text-[#252525] truncate">
                                {selectedMemberObj.name}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-950 text-[10px] font-black uppercase tracking-wider">
                                {selectedMemberObj.relationship || "Membro"}
                              </span>
                              {selectedMemberObj.isPastor && (
                                <span className="px-2 py-0.5 rounded-md bg-[#252525] text-white text-[10px] font-bold">
                                  Pastor
                                </span>
                              )}
                              {selectedMemberObj.isLeader && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-600 text-white text-[10px] font-bold">
                                  Líder
                                </span>
                              )}
                              {selectedMemberObj.isAdmin && (
                                <span className="px-2 py-0.5 rounded-md bg-[#CB4B3B] text-white text-[10px] font-bold">
                                  Admin
                                </span>
                              )}
                            </div>
                            <span className="block text-xs text-[#252525]/70 truncate mt-0.5">
                              {selectedMemberObj.phone
                                ? formatPhoneBR(selectedMemberObj.phone)
                                : selectedMemberObj.email || "Sem contato cadastrado"}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMemberToAppoint("");
                            setAppointSearchQuery("");
                          }}
                          className="px-3 py-1.5 rounded-xl border-2 border-[#252525]/20 bg-white hover:bg-[#DCDACF] text-[#252525] text-xs font-black uppercase tracking-wider transition-colors shrink-0"
                        >
                          Trocar
                        </button>
                      </div>
                    ) : (
                      /* CAMPO DE DIGITAÇÃO / PESQUISA E LISTA DE SUGESTÕES */
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="w-4 h-4 text-[#252525]/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            value={appointSearchQuery}
                            onChange={(e) => setAppointSearchQuery(e.target.value)}
                            placeholder="Digite o nome, telefone ou e-mail do membro..."
                            className="w-full pl-10 pr-10 py-2.5 rounded-xl border-2 border-[#252525]/25 bg-white text-xs sm:text-sm font-semibold text-[#252525] focus:border-[#CB4B3B] focus:ring-1 focus:ring-[#CB4B3B]"
                          />
                          {appointSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setAppointSearchQuery("")}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#252525]/40 hover:text-[#252525] p-1"
                              title="Limpar busca"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Dropdown de Resultados da Busca por Nome Digitado */}
                        {appointSearchQuery.trim() ? (
                          <div className="rounded-2xl border-2 border-[#252525]/15 bg-white shadow-md max-h-56 overflow-y-auto divide-y divide-[#252525]/10 custom-scrollbar-light">
                            {matchingMembersToAppoint.length === 0 ? (
                              <div className="p-4 text-center space-y-2">
                                <p className="text-xs text-[#252525]/75 font-semibold">
                                  Nenhum membro encontrado com &ldquo;{appointSearchQuery}&rdquo;.
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAddMemName(appointSearchQuery.trim());
                                    setAddMemIsPastor(true);
                                    setIsAddMemberModalOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#CB4B3B] hover:bg-[#A93829] text-white text-xs font-black uppercase tracking-wider transition-colors shadow"
                                >
                                  <UserPlus className="w-3.5 h-3.5" />
                                  <span>Cadastrar &ldquo;{appointSearchQuery.trim()}&rdquo; como Novo Membro</span>
                                </button>
                              </div>
                            ) : (
                              matchingMembersToAppoint.map((m) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedMemberToAppoint(m.id);
                                    setAppointSearchQuery("");
                                    setAppointAsPastor(Boolean(m.isPastor));
                                    setAppointAsLeader(Boolean(m.isLeader));
                                    setAppointAsAdmin(Boolean(m.isAdmin));
                                  }}
                                  className="w-full p-3 text-left hover:bg-[#F4F3EE] flex items-center justify-between gap-3 transition-colors group"
                                >
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs sm:text-sm font-bold text-[#252525] group-hover:text-[#CB4B3B] truncate">
                                        {m.name}
                                      </span>
                                      <span className="px-2 py-0.5 rounded bg-[#252525]/10 text-[#252525] text-[10px] font-extrabold uppercase">
                                        {m.relationship || "Membro"}
                                      </span>
                                    </div>
                                    <span className="block text-[11px] text-[#252525]/60 truncate mt-0.5">
                                      {m.phone ? formatPhoneBR(m.phone) : m.email || "Sem telefone"}
                                    </span>
                                  </div>
                                  <span className="px-2.5 py-1 rounded-lg bg-[#252525] text-white text-[10px] font-black uppercase tracking-wider group-hover:bg-[#CB4B3B] transition-colors shrink-0">
                                    Selecionar
                                  </span>
                                </button>
                              ))
                            )}
                          </div>
                        ) : (
                          /* Ou Seleção Rápida por Dropdown */
                          <div className="pt-1">
                            <span className="block text-[11px] font-bold text-[#252525]/60 mb-1">
                              Ou selecione diretamente na lista de membros:
                            </span>
                            <select
                              value={selectedMemberToAppoint}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSelectedMemberToAppoint(val);
                                setAppointSearchQuery("");
                                const m = allMembers.find((mem) => mem.id === val);
                                if (m) {
                                  setAppointAsPastor(Boolean(m.isPastor));
                                  setAppointAsLeader(Boolean(m.isLeader));
                                  setAppointAsAdmin(Boolean(m.isAdmin));
                                }
                              }}
                              className="w-full rounded-xl border-2 border-[#252525]/20 bg-white px-3 py-2 text-xs font-bold text-[#252525]"
                            >
                              <option value="">
                                -- Selecionar da lista completa ({eligibleMembersToAppoint.length} membros disponíveis) --
                              </option>
                              {eligibleMembersToAppoint.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.name} ({formatPhoneBR(m.phone) || m.email || "Sem contato"})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col justify-end space-y-2">
                    <span className="text-[11px] font-black uppercase text-[#252525]/70">
                      Funções Atribuídas:
                    </span>
                    <label className="flex items-center gap-2 p-2 rounded-xl border border-[#252525]/20 bg-white cursor-pointer hover:border-[#CB4B3B] transition-colors">
                      <input
                        type="checkbox"
                        checked={appointAsPastor}
                        onChange={(e) => setAppointAsPastor(e.target.checked)}
                        className="w-4 h-4 rounded text-[#CB4B3B] focus:ring-[#CB4B3B]"
                      />
                      <span className="text-xs font-bold text-[#252525]">
                        🤝 Pastor(a) da Igreja
                      </span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-xl border border-[#252525]/20 bg-white cursor-pointer hover:border-amber-500 transition-colors">
                      <input
                        type="checkbox"
                        checked={appointAsLeader}
                        onChange={(e) => setAppointAsLeader(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-xs font-bold text-amber-900">
                        ⭐ Líder de Ministério
                      </span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-xl border border-[#252525]/20 bg-white cursor-pointer hover:border-[#CB4B3B] transition-colors">
                      <input
                        type="checkbox"
                        checked={appointAsAdmin}
                        onChange={(e) => setAppointAsAdmin(e.target.checked)}
                        className="w-4 h-4 rounded text-[#CB4B3B] focus:ring-[#CB4B3B]"
                      />
                      <span className="text-xs font-bold text-[#CB4B3B]">
                        👑 Administrador(a) Total
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={(!selectedMemberToAppoint && !appointSearchQuery.trim()) || isAppointing}
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#CB4B3B] hover:bg-[#A93829] disabled:opacity-40 text-white text-xs font-black uppercase tracking-wider shadow transition-colors mt-1"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>
                        {isAppointing ? "Salvando..." : "Salvar Permissões de Equipe"}
                      </span>
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Lista da Equipe Atual */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#252525]/70">
                Equipe Pastoral, Liderança e Administração em Atividade ({teamMembersList.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teamMembersList.map((m) => {
                  return (
                    <div
                      key={m.id}
                      className="p-5 rounded-3xl bg-white border-2 border-[#252525]/10 shadow-sm space-y-3 overflow-hidden"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-base font-black text-[#252525] break-words">{m.name}</h4>
                            {m.isPastor && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#252525] text-[#DCDACF] shrink-0 whitespace-nowrap">
                                🤝 Pastor(a)
                              </span>
                            )}
                            {m.isLeader && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-600 text-white shrink-0 whitespace-nowrap">
                                ⭐ Líder
                              </span>
                            )}
                            {m.isAdmin && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#CB4B3B] text-white shrink-0 whitespace-nowrap">
                                👑 Admin
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-bold text-[#252525]/60 block mt-1 break-all">
                            {m.phone ? formatPhoneBR(m.phone) : m.email || "Sem telefone"}
                          </span>
                        </div>

                        <div className="sm:text-right shrink-0">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
                              m.isVisitorActive !== false
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-stone-200 text-stone-600"
                            }`}
                          >
                            {m.isVisitorActive !== false ? "🟢 Visitador Ativo" : "⚪ Visitador Inativo"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#252525]/80 bg-[#F4F3EE] p-2.5 rounded-xl">
                        <span className="inline-flex items-center gap-1 break-all">
                          <KeyRound className="w-3.5 h-3.5 text-[#CB4B3B] shrink-0" />
                          <span>Login de acesso: <strong>{m.cpf ? formatCPF(m.cpf) : m.email || m.name}</strong></span>
                        </span>
                      </div>

                      {/* Botões de Ação Rápida para Alternar Funções de Forma Independente */}
                      <div className="pt-2 border-t border-[#252525]/10 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSetMemberRoles(m, { isPastor: !m.isPastor })}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase transition-colors ${
                              m.isPastor
                                ? "bg-stone-200 text-[#252525] hover:bg-stone-300"
                                : "bg-[#252525] text-white hover:bg-black"
                            }`}
                            title="Alternar função de Pastor"
                          >
                            {m.isPastor ? "✕ Tirar Pastor" : "+ Pastor"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSetMemberRoles(m, { isLeader: !m.isLeader })}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase transition-colors ${
                              m.isLeader
                                ? "bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200"
                                : "bg-amber-600 text-white hover:bg-amber-700"
                            }`}
                            title="Alternar função de Líder"
                          >
                            {m.isLeader ? "✕ Tirar Líder" : "+ Líder"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSetMemberRoles(m, { isAdmin: !m.isAdmin })}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase transition-colors ${
                              m.isAdmin
                                ? "bg-red-100 text-red-900 border border-red-300 hover:bg-red-200"
                                : "bg-[#CB4B3B] text-white hover:bg-[#A93829]"
                            }`}
                            title="Alternar privilégio de Administrador"
                          >
                            {m.isAdmin ? "✕ Tirar Admin" : "👑 + Admin"}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveFromTeam(m)}
                          className="px-2.5 py-1 rounded-lg bg-[#F9EAE8] hover:bg-[#CB4B3B] text-[#CB4B3B] hover:text-white text-[11px] font-bold uppercase transition-colors"
                          title="Remover todas as permissões especiais deste membro"
                        >
                          Remover da Equipe
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
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

          {/* Foto de Perfil do Novo Membro */}
          <div className="p-3 rounded-2xl bg-[#F4F3EE] border border-[#252525]/15 space-y-2">
            <label className="block text-[11px] font-black uppercase text-[#252525]">
              Foto do Membro (Opcional)
            </label>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white border-2 border-dashed border-[#252525]/30 flex items-center justify-center overflow-hidden shrink-0 relative">
                {addMemPhotoUrl ? (
                  <img
                    src={addMemPhotoUrl}
                    alt="Foto do Membro"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="w-5 h-5 text-[#252525]/40" />
                )}
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#252525] hover:bg-[#CB4B3B] text-[#DCDACF] text-xs font-bold cursor-pointer transition-colors shadow">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isCompressingPhotoAddMem ? "Otimizando..." : addMemPhotoUrl ? "Trocar Foto" : "Enviar Foto"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handlePhotoUpload(
                          e,
                          (b64) => setAddMemPhotoUrl(b64),
                          setIsCompressingPhotoAddMem
                        )
                      }
                    />
                  </label>
                  {addMemPhotoUrl && (
                    <button
                      type="button"
                      onClick={() => setAddMemPhotoUrl("")}
                      className="px-2 py-1 text-xs text-red-600 font-bold hover:underline"
                    >
                      Remover foto
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

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
                  Complemento
                </label>
                <input
                  type="text"
                  value={addMemComplement}
                  onChange={(e) => setAddMemComplement(e.target.value)}
                  placeholder="Apto, Bloco, Casa..."
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

          {/* Ministérios que já atua */}
          <div className="space-y-2 pt-2 border-t border-[#252525]/15">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-black uppercase text-[#252525]">
                Ministérios em que Já Atua Atualmente
              </label>
              <span className="text-[11px] font-bold text-[#CB4B3B]">
                {addMemCurrentMinistries.length} selecionado(s)
              </span>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2 p-2 rounded-xl bg-white border border-[#252525]/20">
              {CHURCH_MINISTRIES.map((group) => (
                <div key={group.category} className="space-y-1">
                  <span className="block text-[10px] font-black uppercase text-[#CB4B3B]">
                    {group.category}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {group.items.map((item) => {
                      const isChecked = addMemCurrentMinistries.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setAddMemCurrentMinistries((prev) =>
                              isChecked
                                ? prev.filter((m) => m !== item.id)
                                : [...prev, item.id]
                            );
                          }}
                          className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-left transition-all ${
                            isChecked
                              ? "border-[#CB4B3B] bg-[#CB4B3B]/10 font-bold text-[#252525]"
                              : "border-[#252525]/15 bg-white text-[#252525]/80 text-[11px]"
                          }`}
                        >
                          <div
                            className={`w-3 h-3 rounded flex items-center justify-center shrink-0 border ${
                              isChecked
                                ? "bg-[#CB4B3B] border-[#CB4B3B] text-white"
                                : "border-[#252525]/40 bg-white"
                            }`}
                          >
                            {isChecked && <Check className="w-2 h-2" />}
                          </div>
                          <span className="text-[11px] truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Senha de Acesso para o Novo Membro */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#252525]/15 space-y-2">
            <div className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-[#CB4B3B]" />
              <label className="block text-[11px] font-black uppercase text-[#252525]">
                Senha de Acesso do Novo Usuário *
              </label>
            </div>
            <input
              type="text"
              required
              value={addMemPassword}
              onChange={(e) => setAddMemPassword(e.target.value)}
              placeholder="Senha inicial (padrão: igrejadoalto)"
              className="w-full rounded-xl border-2 border-[#252525]/25 bg-white px-3 py-2 text-xs font-bold text-[#252525]"
            />
            <span className="block text-[10px] text-[#252525]/60">
              O novo membro usará esta senha cadastrada (ou a sugestão inicial &quot;igrejadoalto&quot;) para entrar na plataforma.
            </span>
          </div>

          {/* Se Admin: opção de definir funções especiais de forma independente */}
          {session?.isAdmin && (
            <div className="p-3.5 rounded-2xl bg-[#252525] text-[#DCDACF] space-y-2">
              <span className="block text-[11px] font-black uppercase text-[#CB4B3B]">
                Funções de Equipe & Privilégios (Independentes)
              </span>
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addMemIsPastor}
                    onChange={(e) => setAddMemIsPastor(e.target.checked)}
                    className="w-4 h-4 rounded text-[#CB4B3B] focus:ring-[#CB4B3B]"
                  />
                  <span className="text-xs font-bold">
                    🤝 Definir como Pastor(a)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addMemIsLeader}
                    onChange={(e) => setAddMemIsLeader(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-xs font-bold text-amber-400">
                    ⭐ Definir como Líder
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addMemIsAdmin}
                    onChange={(e) => setAddMemIsAdmin(e.target.checked)}
                    className="w-4 h-4 rounded text-[#CB4B3B] focus:ring-[#CB4B3B]"
                  />
                  <span className="text-xs font-bold text-red-400">
                    👑 Acesso Administrador(a) Total
                  </span>
                </label>
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

      {/* MODAL: DETALHES COMPLETOS DO MEMBRO (AO CLICAR NA LISTA) */}
      <LightDismissDialog
        open={Boolean(selectedMemberDetail)}
        onClose={() => setSelectedMemberDetail(null)}
        title={selectedMemberDetail?.name || "Perfil do Membro"}
        subtitle="Visualização detalhada do cadastro e relacionamento com a igreja"
        maxWidthClass="max-w-2xl"
      >
        {selectedMemberDetail && (
          <div className="space-y-5 text-xs text-[#252525]">
            {/* Header com Avatar, Badges e Contato Rápido */}
            <div className="p-4 rounded-2xl bg-[#F4F3EE] border border-[#252525]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {selectedMemberDetail.photoUrl ? (
                  <img
                    src={selectedMemberDetail.photoUrl}
                    alt={selectedMemberDetail.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-[#CB4B3B] shadow-md shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-[#CB4B3B] text-[#DCDACF] flex items-center justify-center font-black text-xl shadow-md shrink-0">
                    {selectedMemberDetail.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black text-[#252525]">
                      {selectedMemberDetail.name}
                    </h3>
                    {selectedMemberDetail.isAdmin && (
                      <span className="px-2 py-0.5 rounded-full bg-[#CB4B3B] text-white text-[10px] font-black uppercase tracking-wider">
                        👑 Admin Total
                      </span>
                    )}
                    {selectedMemberDetail.isPastor && !selectedMemberDetail.isAdmin && (
                      <span className="px-2 py-0.5 rounded-full bg-[#252525] text-white text-[10px] font-black uppercase tracking-wider">
                        🤝 Pastor
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-[#252525]/70 block mt-0.5">
                    {selectedMemberDetail.relationship || "Membro"} • {selectedMemberDetail.maritalStatus || "Solteiro(a)"}
                  </span>
                  <span className="text-[10px] text-[#252525]/50 block">
                    Cadastrado em {formatDateBR(selectedMemberDetail.registeredAt)} • ID: {selectedMemberDetail.id}
                  </span>
                </div>
              </div>

              {selectedMemberDetail.phone && (
                <a
                  href={`https://wa.me/55${cleanDigits(selectedMemberDetail.phone)}?text=${encodeURIComponent(
                    `Olá ${selectedMemberDetail.name}! Paz do Senhor!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider transition-colors shadow shrink-0"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chamar no WhatsApp</span>
                </a>
              )}
            </div>

            {/* Grid de Informações de Contato e Documentos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-white border border-[#252525]/15 space-y-1">
                <span className="block text-[10px] font-black uppercase text-[#252525]/60">
                  Telefone / WhatsApp
                </span>
                <strong className="text-sm font-black text-[#252525] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#CB4B3B]" />
                  {formatPhoneBR(selectedMemberDetail.phone)}
                </strong>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-[#252525]/15 space-y-1">
                <span className="block text-[10px] font-black uppercase text-[#252525]/60">
                  E-mail
                </span>
                <strong className="text-sm font-black text-[#252525] truncate block">
                  {selectedMemberDetail.email || "Não informado"}
                </strong>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-[#252525]/15 space-y-1">
                <span className="block text-[10px] font-black uppercase text-[#252525]/60">
                  CPF (Chave Única)
                </span>
                <strong className="text-sm font-black text-[#252525]">
                  {formatCPF(selectedMemberDetail.cpf)}
                </strong>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-[#252525]/15 space-y-1">
                <span className="block text-[10px] font-black uppercase text-[#252525]/60">
                  Data de Nascimento
                </span>
                <strong className="text-sm font-black text-[#252525]">
                  {selectedMemberDetail.birthDate
                    ? `${formatDateBR(selectedMemberDetail.birthDate)} ${
                        calculateAge(selectedMemberDetail.birthDate)
                          ? `(${calculateAge(selectedMemberDetail.birthDate)} anos)`
                          : ""
                      }`
                    : "Não informada"}
                </strong>
              </div>
            </div>

            {/* Endereço Residencial */}
            <div className="p-4 rounded-xl bg-white border border-[#252525]/15 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="block text-[10px] font-black uppercase text-[#252525]/60">
                  Endereço Residencial
                </span>
                {selectedMemberDetail.address?.cep && (
                  <span className="text-[11px] font-bold text-[#CB4B3B]">
                    CEP: {formatCEP(selectedMemberDetail.address.cep)}
                  </span>
                )}
              </div>
              <strong className="text-sm font-black text-[#252525] block">
                {formatAddress(selectedMemberDetail.address)}
              </strong>
            </div>

            {/* Relacionamento com a Igreja */}
            <div className="p-4 rounded-xl bg-white border border-[#252525]/15 space-y-3">
              <span className="block text-[10px] font-black uppercase text-[#CB4B3B]">
                Vida na Igreja & Atividades
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="block text-[10px] text-[#252525]/60 font-bold uppercase">
                    Relação com a Igreja
                  </span>
                  <strong className="text-xs font-black text-[#252525]">
                    {selectedMemberDetail.relationship || "Membro"}
                  </strong>
                </div>
                <div>
                  <span className="block text-[10px] text-[#252525]/60 font-bold uppercase">
                    Tempo de Frequência
                  </span>
                  <strong className="text-xs font-black text-[#252525]">
                    {selectedMemberDetail.attendanceTime || "Não informado"}
                  </strong>
                </div>
                <div className="sm:col-span-2">
                  <span className="block text-[10px] text-[#252525]/60 font-bold uppercase">
                    Participação em Casa do Alto
                  </span>
                  <strong className="text-xs font-black text-[#252525]">
                    {selectedMemberDetail.participatesInActivity
                      ? selectedMemberDetail.activityName
                        ? `Sim (${selectedMemberDetail.activityName})`
                        : "Sim"
                      : "Não participa"}
                  </strong>
                </div>
              </div>
            </div>

            {/* Ministérios Atuantes & Interesses */}
            <div className="p-4 rounded-xl bg-white border border-[#252525]/15 space-y-3">
              <span className="block text-[10px] font-black uppercase text-[#CB4B3B]">
                Ministérios & Voluntariado
              </span>
              <div className="space-y-3">
                <div>
                  <span className="block text-[11px] font-bold text-[#252525]/70 mb-1.5">
                    Ministérios em que já atua atualmente:
                  </span>
                  {(selectedMemberDetail.currentMinistries || []).length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedMemberDetail.currentMinistries!.map((m) => (
                        <span
                          key={m}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1"
                        >
                          <Check className="w-3 h-3 text-emerald-600" />
                          {m}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#252525]/50 italic">
                      Nenhum ministério informado até o momento.
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-[#252525]/10">
                  <span className="block text-[11px] font-bold text-[#252525]/70 mb-1.5">
                    Ministérios com interesse em servir:
                  </span>
                  {(selectedMemberDetail.interestedMinistries || []).length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedMemberDetail.interestedMinistries!.map((m) => (
                        <span
                          key={m}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1"
                        >
                          <Star className="w-3 h-3 text-amber-600 fill-amber-500" />
                          {m}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#252525]/50 italic">
                      Não indicou interesse em novos ministérios.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Núcleo Familiar */}
            <div className="p-4 rounded-xl bg-white border border-[#252525]/15 space-y-2">
              <span className="block text-[10px] font-black uppercase text-[#CB4B3B]">
                Núcleo Familiar
              </span>
              {selectedMemberDetail.spouseName && (
                <div className="flex items-center gap-2 text-xs font-semibold text-[#252525]">
                  <Heart className="w-3.5 h-3.5 text-[#CB4B3B]" />
                  <span>
                    Cônjuge: <strong>{selectedMemberDetail.spouseName}</strong>
                  </span>
                </div>
              )}
              {selectedMemberDetail.dependents && selectedMemberDetail.dependents.length > 0 ? (
                <div className="space-y-1.5 pt-1">
                  <span className="block text-[11px] font-bold text-[#252525]/70">
                    Filhos / Dependentes ({selectedMemberDetail.dependents.length}):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedMemberDetail.dependents.map((dep, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-[#F4F3EE] border border-[#252525]/10 flex items-center gap-2"
                      >
                        <Baby className="w-4 h-4 text-[#CB4B3B] shrink-0" />
                        <div className="min-w-0 flex-1">
                          <strong className="block text-xs truncate">
                            {dep.fullName || (dep as any).name}
                          </strong>
                          <span className="text-[10px] text-[#252525]/60 block">
                            {dep.relationship || "Filho(a)"}{" "}
                            {dep.birthDate ? `• ${calculateAge(dep.birthDate)} anos` : ""}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                !selectedMemberDetail.spouseName && (
                  <p className="text-xs text-[#252525]/50 italic">
                    Nenhum familiar vinculado até o momento.
                  </p>
                )
              )}
            </div>

            {/* Ações Administrativas (Exclusivo para Admin Master) */}
            {/* Ações Administrativas (Exclusivo para Admin Master) */}
            {session.isAdmin && (
              <div className="p-4 rounded-2xl bg-[#252525] text-[#DCDACF] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="block text-[10px] font-black uppercase text-[#CB4B3B]">
                    Governança & Acessos de Equipe
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold">
                    {selectedMemberDetail.isPastor && (
                      <span className="px-2 py-0.5 rounded bg-emerald-800 text-white">Pastor</span>
                    )}
                    {selectedMemberDetail.isLeader && (
                      <span className="px-2 py-0.5 rounded bg-amber-600 text-white">Líder</span>
                    )}
                    {selectedMemberDetail.isAdmin && (
                      <span className="px-2 py-0.5 rounded bg-[#CB4B3B] text-white">Admin</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const next = !selectedMemberDetail.isPastor;
                      await handleSetMemberRoles(selectedMemberDetail, { isPastor: next });
                      setSelectedMemberDetail({ ...selectedMemberDetail, isPastor: next });
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow ${
                      selectedMemberDetail.isPastor
                        ? "bg-stone-700 text-stone-200 hover:bg-stone-600"
                        : "bg-emerald-700 hover:bg-emerald-600 text-white"
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>
                      {selectedMemberDetail.isPastor ? "Remover Pastor" : "Tornar Pastor"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      const next = !selectedMemberDetail.isLeader;
                      await handleSetMemberRoles(selectedMemberDetail, { isLeader: next });
                      setSelectedMemberDetail({ ...selectedMemberDetail, isLeader: next });
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow ${
                      selectedMemberDetail.isLeader
                        ? "bg-stone-700 text-stone-200 hover:bg-stone-600"
                        : "bg-amber-600 hover:bg-amber-500 text-white"
                    }`}
                  >
                    <Star className="w-3.5 h-3.5" />
                    <span>
                      {selectedMemberDetail.isLeader ? "Remover Líder" : "Tornar Líder"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      const next = !selectedMemberDetail.isAdmin;
                      await handleSetMemberRoles(selectedMemberDetail, { isAdmin: next });
                      setSelectedMemberDetail({ ...selectedMemberDetail, isAdmin: next });
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow ${
                      selectedMemberDetail.isAdmin
                        ? "bg-stone-700 text-stone-200 hover:bg-stone-600"
                        : "bg-[#CB4B3B] hover:bg-[#A93829] text-white"
                    }`}
                  >
                    <Crown className="w-3.5 h-3.5" />
                    <span>
                      {selectedMemberDetail.isAdmin ? "Remover Admin" : "Tornar Admin"}
                    </span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#252525]/15">
              <button
                type="button"
                onClick={() => {
                  handleOpenVisitsPortal("pessoas");
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#252525] hover:bg-[#3D3D3D] text-[#DCDACF] text-xs font-black uppercase tracking-wider transition-colors shadow-sm"
                title="Acessar o Portal de Visitas com histórico de cuidados desta pessoa"
              >
                <ClipboardCheck className="w-4 h-4 text-[#EBD57B]" />
                <span>Ver Visitas no Portal</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#DCDACF]/60" />
              </button>

              <button
                type="button"
                onClick={() => setSelectedMemberDetail(null)}
                className="px-5 py-2.5 rounded-xl bg-[#CB4B3B] hover:bg-[#A93829] text-[#DCDACF] text-xs font-black uppercase tracking-wider transition-colors"
              >
                Fechar Perfil
              </button>
            </div>
          </div>
        )}
      </LightDismissDialog>

      {/* MODAL DE CONFIRMAÇÃO ESTILIZADO (Substitui window.confirm) */}
      <LightDismissDialog
        open={confirmModal.open}
        onClose={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
        title={confirmModal.title}
        subtitle={confirmModal.subtitle}
        maxWidthClass="max-w-md"
      >
        <div className="space-y-5 text-sm p-1">
          <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white border border-[#252525]/10 shadow-sm">
            {confirmModal.isDestructive ? (
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-[#252525] text-[#DCDACF] flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5 text-[#CB4B3B]" />
              </div>
            )}
            <p className="text-xs sm:text-sm text-[#252525] font-semibold leading-relaxed">
              {confirmModal.message}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#252525]/10">
            <button
              type="button"
              onClick={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
              className="px-4 py-2.5 rounded-xl border-2 border-[#252525]/20 bg-white hover:bg-gray-100 text-[#252525] text-xs font-bold transition-colors"
            >
              {confirmModal.cancelText || "Cancelar"}
            </button>
            <button
              type="button"
              onClick={async () => {
                const action = confirmModal.onConfirm;
                setConfirmModal((prev) => ({ ...prev, open: false }));
                await action();
              }}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow ${
                confirmModal.isDestructive
                  ? "bg-[#CB4B3B] hover:bg-[#A93829] text-white"
                  : "bg-[#252525] hover:bg-[#3D3D3D] text-[#DCDACF]"
              }`}
            >
              {confirmModal.confirmText || "Confirmar"}
            </button>
          </div>
        </div>
      </LightDismissDialog>

      {/* MODAL DE ALERTA / AVISO ESTILIZADO (Substitui window.alert) */}
      <LightDismissDialog
        open={alertModal.open}
        onClose={() => setAlertModal((prev) => ({ ...prev, open: false }))}
        title={alertModal.title}
        maxWidthClass="max-w-md"
      >
        <div className="space-y-5 text-sm p-1">
          <div
            className={`flex items-start gap-3.5 p-4 rounded-2xl border-2 ${
              alertModal.type === "success"
                ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                : alertModal.type === "error"
                ? "bg-red-50 border-red-300 text-red-950"
                : "bg-amber-50 border-amber-300 text-amber-950"
            }`}
          >
            {alertModal.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : alertModal.type === "error" ? (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <p className="text-xs sm:text-sm font-semibold leading-relaxed">
              {alertModal.message}
            </p>
          </div>

          <div className="flex justify-end pt-2 border-t border-[#252525]/10">
            <button
              type="button"
              onClick={() => setAlertModal((prev) => ({ ...prev, open: false }))}
              className="px-6 py-2.5 rounded-xl bg-[#252525] hover:bg-[#3D3D3D] text-[#DCDACF] text-xs font-black uppercase tracking-wider shadow transition-colors"
            >
              Entendi
            </button>
          </div>
        </div>
      </LightDismissDialog>

      {/* Rodapé */}
      <footer className="bg-[#252525] text-[#DCDACF]/75 py-4 border-t border-[#CB4B3B]/40 text-center text-xs font-bold uppercase tracking-wider mt-8">
        <span>Igreja do Alto — Lugar de Proteção, Provisão e Direção</span>
      </footer>
    </div>
  );
}
