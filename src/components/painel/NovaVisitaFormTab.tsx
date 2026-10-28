"use client";

import React, { useEffect, useState } from "react";
import {
  DatabaseSchema,
  FollowUpNeed,
  IntegrationLevel,
  LeadershipComm,
  NewVisitNeeded,
  NewVisitTimeframe,
  NextStep,
  ServiceAttendance,
  SituationLevel,
  VisitHappened,
  VisitReason,
  YesNoUnknown,
} from "@/types/visitas";
import {
  FOLLOW_UP_NEEDS,
  INTEGRATION_LEVELS,
  LEADERSHIP_COMM,
  NEW_VISIT_NEEDED,
  NEW_VISIT_TIMEFRAMES,
  NEXT_STEPS,
  OTHER_LEADER,
  REQUEST_TO_VISIT_REASON,
  SERVICE_ATTENDANCE,
  SITUATION_LEVELS,
  VISIT_HAPPENED,
  VISIT_REASONS,
  YES_NO_UNKNOWN,
} from "@/data/formOptions";
import { SITUATION_META, todayISO } from "@/lib/visitasUtils";
import {
  ClipboardCheck,
  AlertCircle,
  CheckCircle2,
  UserPlus,
  Users,
  Plus,
  Search,
  X,
  Camera,
  Trash2,
} from "lucide-react";

interface NovaVisitaFormTabProps {
  db: DatabaseSchema;
  preselectedMemberId?: string | null;
  preselectedRequestId?: string | null;
  onReportCreated: (updatedDb: DatabaseSchema) => void;
}

export function NovaVisitaFormTab({
  db,
  preselectedMemberId,
  preselectedRequestId,
  onReportCreated,
}: NovaVisitaFormTabProps) {
  // 1. Dados da visita
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [selectedRequestId, setSelectedRequestId] = useState<string>(
    preselectedRequestId || ""
  );
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    preselectedMemberId || db.members[0]?.id || ""
  );
  const [memberSearch, setMemberSearch] = useState<string>("");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberPhone, setNewMemberPhone] = useState("");
  const [newMemberNeighborhood, setNewMemberNeighborhood] = useState("");
  const [newMemberAddress, setNewMemberAddress] = useState("");

  const [visitDate, setVisitDate] = useState<string>(todayISO());
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [visitors, setVisitors] = useState<string[]>([
    db.pastors[0]?.name || "Prs. Marcos e Mara",
  ]);
  const [otherLeaderName, setOtherLeaderName] = useState<string>("");
  const [showAddVisitorBox, setShowAddVisitorBox] = useState(false);
  const [newVisitorInput, setNewVisitorInput] = useState("");
  const [isAddingVisitor, setIsAddingVisitor] = useState(false);

  const [othersPresent, setOthersPresent] = useState<string>("");
  const [visitHappened, setVisitHappened] = useState<VisitHappened>();

  // 2. Características da visita
  const [mainReason, setMainReason] = useState<VisitReason>(
  );
  const [situation, setSituation] = useState<SituationLevel>();

  // 3. Vida na igreja
  const [serviceAttendance, setServiceAttendance] =
    useState<ServiceAttendance>();
  const [integration, setIntegration] = useState<IntegrationLevel>();
  const [inCasaDoAlto, setInCasaDoAlto] = useState<YesNoUnknown>();
  const [inMinistry, setInMinistry] = useState<YesNoUnknown>();

  // 4. Registro pastoral
  const [summary, setSummary] = useState<string>("");
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [hasPrayerRequest, setHasPrayerRequest] = useState<"Não" | "Sim">(
  );
  const [prayerRequest, setPrayerRequest] = useState<string>("");
  const [needsFollowUp, setNeedsFollowUp] = useState<"Não" | "Sim">();
  const [followUpNeeds, setFollowUpNeeds] = useState<FollowUpNeed[]>([]);
  const [leadershipCommunication, setLeadershipCommunication] =
    useState<LeadershipComm>("Não");
  const [leadershipNote, setLeadershipNote] = useState<string>("");

  // 5. Próximos passos
  const [nextStep, setNextStep] = useState<NextStep>(
    
  );
  const [needsNewVisit, setNeedsNewVisit] = useState<NewVisitNeeded>();
  const [newVisitTimeframe, setNewVisitTimeframe] =
    useState<NewVisitTimeframe>();
  const [followUpResponsible, setFollowUpResponsible] = useState<string>(
    db.pastors[0]?.name || ""
  );
  const [internalNotes, setInternalNotes] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedMemberId) {
      setMode("existing");
      setSelectedMemberId(preselectedMemberId);
      const mem = db.members.find((m) => m.id === preselectedMemberId);
      if (mem) {
        setSituation(mem.situation);
        if (mem.needs.length > 0) {
          setNeedsFollowUp("Sim");
          setFollowUpNeeds(mem.needs);
        }
      }
    }
    if (preselectedRequestId) {
      setSelectedRequestId(preselectedRequestId);
      const req = db.requests.find((r) => r.id === preselectedRequestId);
      if (req) {
        setMode("existing");
        setSelectedMemberId(req.memberId);
        const mapped = req.reasons
          .map((r) => REQUEST_TO_VISIT_REASON[r])
          .find(Boolean);
        if (mapped) setMainReason(mapped);
        if (req.assignedPastor) {
          setVisitors([req.assignedPastor]);
          setFollowUpResponsible(req.assignedPastor);
        }
      }
    }
  }, [preselectedMemberId, preselectedRequestId, db.members, db.requests]);

  const toggleVisitor = (name: string) => {
    setVisitors((prev) =>
      prev.includes(name) ? prev.filter((v) => v !== name) : [...prev, name]
    );
  };

  const handleAddNewVisitor = async () => {
    const trimmed = newVisitorInput.trim();
    if (!trimmed) return;
    setIsAddingVisitor(true);
    try {
      const res = await fetch("/api/dados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_PASTOR",
          payload: { name: trimmed },
        }),
      });
      const data = await res.json();
      if (res.ok && data.db) {
        onReportCreated(data.db);
        setVisitors((prev) =>
          prev.includes(trimmed) ? prev : [...prev, trimmed]
        );
        setNewVisitorInput("");
        setShowAddVisitorBox(false);
      }
    } finally {
      setIsAddingVisitor(false);
    }
  };

  const toggleFollowUpNeed = (need: FollowUpNeed) => {
    setFollowUpNeeds((prev) => {
      const next = prev.includes(need)
        ? prev.filter((n) => n !== need)
        : [...prev, need];
      if (next.length > 0) {
        setNeedsFollowUp("Sim");
      }
      return next;
    });
  };

  const handleMemberSelect = (memberId: string) => {
    setSelectedMemberId(memberId);
    const mem = db.members.find((m) => m.id === memberId);
    if (mem) {
      setSituation(mem.situation);
    }

    const openReq = db.requests.find(
      (r) =>
        r.memberId === memberId &&
        (r.status === "pendente" || r.status === "agendada")
    );

    if (openReq) {
      setSelectedRequestId(openReq.id);
      const mapped = openReq.reasons
        .map((r) => REQUEST_TO_VISIT_REASON[r])
        .find(Boolean);
      if (mapped) setMainReason(mapped);
      if (openReq.assignedPastor) {
        setVisitors([openReq.assignedPastor]);
        setFollowUpResponsible(openReq.assignedPastor);
      }
    } else {
      setSelectedRequestId("");
    }
  };

  const handleRequestSelect = (reqId: string) => {
    setSelectedRequestId(reqId);
    if (!reqId) return;
    const req = db.requests.find((r) => r.id === reqId);
    if (req) {
      setMode("existing");
      setSelectedMemberId(req.memberId);
      const mem = db.members.find((m) => m.id === req.memberId);
      if (mem) {
        setSituation(mem.situation);
      }
      const mapped = req.reasons
        .map((r) => REQUEST_TO_VISIT_REASON[r])
        .find(Boolean);
      if (mapped) setMainReason(mapped);
      if (req.assignedPastor) {
        setVisitors([req.assignedPastor]);
        setFollowUpResponsible(req.assignedPastor);
      }
    }
  };

  const happened = visitHappened === "Sim";

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressingPhoto(true);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const MAX_DIM = 900;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.78);
          setPhotoUrl(compressedDataUrl);
        } else {
          setPhotoUrl(reader.result as string);
        }
        setIsCompressingPhoto(false);
      };
      img.onerror = () => {
        setPhotoUrl(reader.result as string);
        setIsCompressingPhoto(false);
      };
      img.src = reader.result as string;
    };
    reader.onerror = () => {
      setIsCompressingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const finalVisitors = visitors
      .map((v) =>
        v === OTHER_LEADER && otherLeaderName.trim()
          ? otherLeaderName.trim()
          : v
      )
      .filter(Boolean);

    if (finalVisitors.length === 0) {
      setErrorMessage("Selecione quem realizou a visita.");
      return;
    }

    const formattedApproxTime =
      startTime && endTime
        ? `${startTime} às ${endTime}`
        : startTime
        ? `Início: ${startTime}`
        : endTime
        ? `Término: ${endTime}`
        : undefined;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/dados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_VISIT_REPORT",
          payload: {
            requestId: selectedRequestId || undefined,
            memberId: mode === "existing" ? selectedMemberId : undefined,
            newMemberName: mode === "new" ? newMemberName : undefined,
            newMemberPhone: mode === "new" ? newMemberPhone : undefined,
            newMemberNeighborhood:
              mode === "new" ? newMemberNeighborhood : undefined,
            newMemberAddress: mode === "new" ? newMemberAddress : undefined,
            visitDate,
            approxTime: formattedApproxTime,
            visitors: finalVisitors,
            othersPresent: othersPresent || undefined,
            visitHappened,
            mainReason: happened ? mainReason : undefined,
            situation: happened ? situation : undefined,
            serviceAttendance: happened ? serviceAttendance : undefined,
            integration: happened ? integration : undefined,
            inCasaDoAlto: happened ? inCasaDoAlto : undefined,
            inMinistry: happened ? inMinistry : undefined,
            summary: summary || undefined,
            photoUrl: happened && photoUrl ? photoUrl : undefined,
            hasPrayerRequest: happened ? hasPrayerRequest === "Sim" : false,
            prayerRequest:
              happened && hasPrayerRequest === "Sim"
                ? prayerRequest
                : undefined,
            needsFollowUp: happened ? needsFollowUp === "Sim" : false,
            followUpNeeds:
              happened && needsFollowUp === "Sim" ? followUpNeeds : [],
            leadershipCommunication: happened
              ? leadershipCommunication
              : undefined,
            leadershipNote:
              happened && leadershipCommunication !== "Não"
                ? leadershipNote
                : undefined,
            nextStep,
            needsNewVisit,
            newVisitTimeframe:
              needsNewVisit !== "Não" ? newVisitTimeframe : undefined,
            followUpResponsible: followUpResponsible || undefined,
            internalNotes: internalNotes || undefined,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Falha ao salvar o relatório.");
      }

      setSuccessMessage(
        "Relatório de visita pastoral registrado com sucesso! O prontuário da pessoa/família e o painel de indicadores foram atualizados."
      );
      setStartTime("");
      setEndTime("");
      setSummary("");
      setPhotoUrl("");
      setPrayerRequest("");
      setLeadershipNote("");
      setInternalNotes("");
      setSelectedRequestId("");
      onReportCreated(data.db);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Erro inesperado ao registrar visita."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingOrScheduledRequests = db.requests.filter(
    (r) => r.status === "pendente" || r.status === "agendada"
  );

  const normalizeText = (text?: string) =>
    (text || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const normalizedQuery = normalizeText(memberSearch.trim());
  const filteredMembers = db.members
    .filter((m) => {
      if (!normalizedQuery) return true;
      const searchable = [
        m.name,
        m.spouseName,
        m.familyInChurch,
        m.address.neighborhood,
        m.address.street,
        m.phone,
      ]
        .map(normalizeText)
        .join(" ");
      return searchable.includes(normalizedQuery);
    })
    .sort((a, b) => {
      if (!normalizedQuery) {
        if (a.id === selectedMemberId) return -1;
        if (b.id === selectedMemberId) return 1;
      }
      return 0;
    });

  const selectedMemberObj = db.members.find((m) => m.id === selectedMemberId);

  const visitorChoices = [...db.pastors.map((p) => p.name), OTHER_LEADER];

  return (
    <div className="max-w-4xl mx-auto">
      <form
        action="/api/dados"
        method="POST"
        onSubmit={handleSubmit}
        className="rounded-3xl bg-[#F4F3EE]  shadow-xl overflow-hidden"
      >
        {/* Cabeçalho com Título e Descrição Oficiais */}
        <div className="bg-[#252525] text-[#DCDACF] px-6 sm:px-8 py-6 border-b-4 border-[#CB4B3B] flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#CB4B3B]">
              Relatório de Visita Pastoral
            </span>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight mt-1">
              Relatório de Visita Pastoral | Igreja do Alto
            </h2>
            <p className="text-xs sm:text-sm text-[#DCDACF]/85 mt-1.5 leading-relaxed">
              Formulário de uso interno destinado ao registro e acompanhamento
              das visitas realizadas pela equipe pastoral da Igreja do Alto.
            </p>
          </div>
          <ClipboardCheck className="w-8 h-8 text-[#CB4B3B] shrink-0" />
        </div>

        <div className="p-6 sm:p-8 space-y-10">
          {errorMessage && (
            <div
              role="alert"
              aria-live="assertive"
              className="p-4 rounded-2xl bg-[#F9EAE8] border-2 border-[#CB4B3B] text-[#A93829] flex items-start gap-3 text-sm font-bold"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div
              role="status"
              aria-live="polite"
              className="p-5 rounded-2xl bg-emerald-950 text-[#DCDACF] border-2 border-emerald-600 flex items-start gap-3 text-sm font-bold"
            >
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-base font-black uppercase tracking-wide text-emerald-300">
                  Relatório Registrado!
                </div>
                <p className="mt-1 font-medium">{successMessage}</p>
              </div>
            </div>
          )}

          {/* =========================================================
              SEÇÃO 1: DADOS DA VISITA
             ========================================================= */}
          <fieldset className="space-y-6">
            <legend className="text-base sm:text-lg font-black uppercase tracking-tight text-[#252525] flex items-center gap-2.5 pb-2.5 border-b-2 border-[#DCDACF] w-full">
              <span className="w-7 h-7 rounded-lg bg-[#CB4B3B] text-[#DCDACF] text-xs font-black inline-flex items-center justify-center">
                1
              </span>
              Dados da visita
            </legend>

            {pendingOrScheduledRequests.length > 0 && (
              <div className="p-4 rounded-2xl bg-[#DCDACF]/60 border border-[#252525]/20">
                <label
                  htmlFor="linked-request"
                  className="block text-xs font-black uppercase tracking-wider text-[#CB4B3B] mb-1"
                >
                  Atender Solicitação da Fila (Opcional — preenche os dados
                  automaticamente)
                </label>
                <select
                  id="linked-request"
                  name="requestId"
                  value={selectedRequestId}
                  onChange={(e) => handleRequestSelect(e.target.value)}
                  className="w-full rounded-xl border-2 border-[#252525]/25 bg-white px-4 py-2.5 text-sm font-bold text-[#252525]"
                >
                  <option value="">
                    — Visita avulsa / sem solicitação prévia —
                  </option>
                  {pendingOrScheduledRequests.map((req) => (
                    <option key={req.id} value={req.id}>
                      {req.memberName} ({req.address.neighborhood}) —{" "}
                      {req.reasons.join(", ")}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Pessoa/família visitada * */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor={
                    mode === "existing" ? "member-search" : "new-member-name"
                  }
                  className="block text-sm font-extrabold uppercase tracking-wide text-[#252525]"
                >
                  Pessoa/família visitada *
                </label>
                <div className="inline-flex rounded-xl border-2 border-[#252525]/20 bg-white p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => setMode("existing")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-colors ${
                      mode === "existing"
                        ? "bg-[#252525] text-[#DCDACF]"
                        : "text-[#252525] hover:bg-[#DCDACF]/40"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 text-[#CB4B3B]" />
                    Buscar / Selecionar Cadastrada
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("new");
                      setSelectedRequestId("");
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-colors ${
                      mode === "new"
                        ? "bg-[#252525] text-[#DCDACF]"
                        : "text-[#252525] hover:bg-[#DCDACF]/40"
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5 text-[#CB4B3B]" />
                    Digitar Nova Pessoa/Família
                  </button>
                </div>
              </div>

              {mode === "existing" ? (
                <div className="space-y-3 p-4 rounded-2xl bg-white border-2 border-[#252525]/20">
                  {/* Barra de Busca pelo nome da pessoa, sobrenome da família, cônjuge ou bairro */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-[#CB4B3B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="search"
                      id="member-search"
                      value={memberSearch}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMemberSearch(val);
                        const norm = normalizeText(val.trim());
                        if (norm) {
                          const firstMatch = db.members.find((m) =>
                            [
                              m.name,
                              m.spouseName,
                              m.familyInChurch,
                              m.address.neighborhood,
                            ]
                              .map(normalizeText)
                              .join(" ")
                              .includes(norm)
                          );
                          if (firstMatch) {
                            handleMemberSelect(firstMatch.id);
                          }
                        }
                      }}
                      placeholder="Buscar pelo nome da pessoa, sobrenome da família, cônjuge ou bairro..."
                      className="w-full rounded-xl border-2 border-[#252525]/25 bg-[#F4F3EE]/60 pl-10 pr-10 py-2.5 text-sm font-semibold text-[#252525] placeholder:text-[#252525]/50"
                    />
                    {memberSearch && (
                      <button
                        type="button"
                        onClick={() => setMemberSearch("")}
                        aria-label="Limpar busca"
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-[#DCDACF] text-[#252525]/70"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Resultados filtrados / Lista suspensa sincronizada */}
                  {filteredMembers.length > 0 ? (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#252525]/65 px-1">
                        <span>
                          {memberSearch.trim()
                            ? `${filteredMembers.length} pessoa(s)/família(s) encontrada(s)`
                            : `Todas as pessoas/famílias cadastradas (${db.members.length})`}
                        </span>
                        {selectedMemberObj && (
                          <span className="text-[#CB4B3B] font-extrabold">
                            Selecionado: {selectedMemberObj.name}
                          </span>
                        )}
                      </div>

                      <div className="max-h-52 overflow-y-auto rounded-xl border border-[#252525]/15 divide-y divide-[#252525]/10 bg-[#F4F3EE]/40">
                        {filteredMembers.map((m) => {
                          const isSelected = m.id === selectedMemberId;
                          const sitMeta = SITUATION_META[m.situation];
                          const hasOpenReq = pendingOrScheduledRequests.some(
                            (r) => r.memberId === m.id
                          );
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => handleMemberSelect(m.id)}
                              className={`w-full text-left px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 transition-colors ${
                                isSelected
                                  ? "bg-[#252525] text-[#DCDACF]"
                                  : "hover:bg-[#DCDACF]/50 text-[#252525]"
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="text-xs sm:text-sm font-extrabold flex items-center gap-2 flex-wrap">
                                  <span>{m.name}</span>
                                  {hasOpenReq && (
                                    <span
                                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                                        isSelected
                                          ? "bg-[#CB4B3B] text-[#DCDACF]"
                                          : "bg-[#CB4B3B]/15 text-[#CB4B3B]"
                                      }`}
                                    >
                                      Solicitação aberta
                                    </span>
                                  )}
                                  {m.spouseName && (
                                    <span
                                      className={`text-[11px] font-semibold ${
                                        isSelected
                                          ? "text-[#DCDACF]/80"
                                          : "text-[#252525]/70"
                                      }`}
                                    >
                                    </span>
                                  )}
                                </div>
                                <div
                                  className={`text-[11px] mt-0.5 ${
                                    isSelected
                                      ? "text-[#DCDACF]/75"
                                      : "text-[#252525]/65"
                                  }`}
                                >
                                  {m.familyInChurch
                                    ? ` • Família: ${m.familyInChurch}`
                                    : ""}
                                  {" • "}
                                  {m.lastVisitDate
                                    ? `Última visita: ${m.lastVisitDate}`
                                    : "Sem visita anterior"}
                                </div>
                              </div>
                              <span
                                className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full shrink-0 ${
                                  isSelected
                                    ? "bg-[#CB4B3B] text-[#DCDACF]"
                                    : "bg-white border border-[#252525]/15 text-[#252525]"
                                }`}
                              >
                                {sitMeta.emoji} {isSelected ? "Selecionado" : m.relationship}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-[#DCDACF]/40 border border-dashed border-[#252525]/30 text-center space-y-2">
                      <p className="text-xs font-bold text-[#252525]/80">
                        Nenhuma pessoa ou família encontrada com &ldquo;
                        {memberSearch}&rdquo;.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setMode("new");
                          setNewMemberName(memberSearch.trim());
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#CB4B3B] text-[#DCDACF] text-xs font-black uppercase tracking-wider"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Cadastrar &ldquo;{memberSearch.trim()}&rdquo; como nova
                        pessoa/família
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-white border-2 border-[#252525]/15">
                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      id="new-member-name"
                      name="newMemberName"
                      required={mode === "new"}
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      placeholder="Digite o nome da pessoa ou família visitada *"
                      className="w-full rounded-xl border-2 border-[#252525]/25 px-4 py-3 font-medium"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="new-member-phone"
                      className="block text-xs font-bold uppercase text-[#252525]/75 mb-1"
                    >
                      Telefone / WhatsApp (opcional)
                    </label>
                    <input
                      type="tel"
                      id="new-member-phone"
                      name="newMemberPhone"
                      value={newMemberPhone}
                      onChange={(e) => setNewMemberPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="w-full rounded-xl border-2 border-[#252525]/20 px-3.5 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="new-member-neighborhood"
                      className="block text-xs font-bold uppercase text-[#252525]/75 mb-1"
                    >
                      Bairro (opcional)
                    </label>
                    <input
                      type="text"
                      id="new-member-neighborhood"
                      name="newMemberNeighborhood"
                      value={newMemberNeighborhood}
                      onChange={(e) => setNewMemberNeighborhood(e.target.value)}
                      placeholder="Ex: Santo Amaro"
                      className="w-full rounded-xl border-2 border-[#252525]/20 px-3.5 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="new-member-address"
                      className="block text-xs font-bold uppercase text-[#252525]/75 mb-1"
                    >
                      Endereço (opcional)
                    </label>
                    <input
                      type="text"
                      id="new-member-address"
                      name="newMemberAddress"
                      value={newMemberAddress}
                      onChange={(e) => setNewMemberAddress(e.target.value)}
                      placeholder="Rua e número"
                      className="w-full rounded-xl border-2 border-[#252525]/20 px-3.5 py-2 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Data da visita * & Horário aproximado de início e de término */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label
                  htmlFor="visit-date"
                  className="block text-sm font-extrabold uppercase tracking-wide text-[#252525] mb-1.5"
                >
                  Data da visita *
                </label>
                <input
                  type="date"
                  id="visit-date"
                  name="visitDate"
                  required
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full rounded-xl border-2 border-[#252525]/25 bg-white px-4 py-3 font-semibold"
                />
              </div>

              <div>
                <label
                  htmlFor="start-time"
                  className="block text-sm font-extrabold uppercase tracking-wide text-[#252525] mb-1.5"
                >
                  Horário aprox. de início
                </label>
                <input
                  type="time"
                  id="start-time"
                  name="startTime"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-xl border-2 border-[#252525]/25 bg-white px-4 py-3 font-semibold"
                />
              </div>

              <div>
                <label
                  htmlFor="end-time"
                  className="block text-sm font-extrabold uppercase tracking-wide text-[#252525] mb-1.5"
                >
                  Horário aprox. de término
                </label>
                <input
                  type="time"
                  id="end-time"
                  name="endTime"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-xl border-2 border-[#252525]/25 bg-white px-4 py-3 font-semibold"
                />
              </div>
            </div>

            {/* Quem realizou a visita? * */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="block text-sm font-extrabold uppercase tracking-wide text-[#252525]">
                  Quem realizou a visita? *
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddVisitorBox((v) => !v)}
                  className="inline-flex items-center gap-1 text-xs font-extrabold uppercase tracking-wider text-[#CB4B3B] hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Acrescentar novo visitador (Pr. / Pra.)
                </button>
              </div>

              {showAddVisitorBox && (
                <div className="mb-3 p-3.5 rounded-2xl bg-white border-2 border-[#CB4B3B] flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                  <input
                    type="text"
                    value={newVisitorInput}
                    onChange={(e) => setNewVisitorInput(e.target.value)}
                    placeholder="Ex: Pr. Lucas Andrade ou Pra. Camila"
                    className="flex-1 rounded-xl border-2 border-[#252525]/20 px-3.5 py-2 text-sm font-medium"
                  />
                  <button
                    type="button"
                    disabled={isAddingVisitor}
                    onClick={handleAddNewVisitor}
                    className="px-4 py-2.5 rounded-xl bg-[#CB4B3B] text-[#DCDACF] text-xs font-black uppercase tracking-wider"
                  >
                    {isAddingVisitor ? "Adicionando..." : "Salvar Visitador"}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {visitorChoices.map((choice) => {
                  const checked = visitors.includes(choice);
                  return (
                    <label
                      key={choice}
                      htmlFor={`visitor-${choice}`}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-all min-h-[48px] ${
                        checked
                          ? "border-[#CB4B3B] bg-[#CB4B3B]/10 font-bold"
                          : "border-[#252525]/20 bg-white hover:border-[#252525]/40"
                      }`}
                    >
                      <input
                        type="checkbox"
                        id={`visitor-${choice}`}
                        name="visitors"
                        value={choice}
                        checked={checked}
                        onChange={() => toggleVisitor(choice)}
                        className="w-4 h-4"
                      />
                      <span className="text-xs sm:text-sm">{choice}</span>
                    </label>
                  );
                })}
              </div>

              {visitors.includes(OTHER_LEADER) && (
                <div className="mt-3">
                  <label
                    htmlFor="other-leader-name"
                    className="block text-xs font-extrabold uppercase tracking-wider text-[#CB4B3B] mb-1"
                  >
                    Nome do outro líder autorizado:
                  </label>
                  <input
                    type="text"
                    id="other-leader-name"
                    value={otherLeaderName}
                    onChange={(e) => setOtherLeaderName(e.target.value)}
                    placeholder="Ex: Diác. Rafael Mendes"
                    className="w-full rounded-xl border-2 border-[#CB4B3B] bg-white px-4 py-2.5 text-sm font-medium"
                  />
                </div>
              )}
            </div>

            {/* Quem estava presente durante a visita? */}
            <div>
              <label
                htmlFor="others-present"
                className="block text-sm font-extrabold uppercase tracking-wide text-[#252525] mb-1.5"
              >
                Quem estava presente durante a visita?
              </label>
              <input
                type="text"
                id="others-present"
                name="othersPresent"
                value={othersPresent}
                onChange={(e) => setOthersPresent(e.target.value)}
                placeholder="Resposta curta (ex: O casal e os dois filhos)"
                className="w-full rounded-xl border-2 border-[#252525]/25 bg-white px-4 py-3 font-medium"
              />
            </div>

            {/* A visita aconteceu? * */}
            <div>
              <span className="block text-sm font-extrabold uppercase tracking-wide text-[#252525] mb-2">
                A visita aconteceu? *
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {VISIT_HAPPENED.map((opt) => (
                  <label
                    key={opt}
                    htmlFor={`happened-${opt}`}
                    className={`flex items-center gap-2.5 p-3.5 rounded-xl border-2 cursor-pointer text-xs sm:text-sm min-h-[48px] transition-colors ${
                      visitHappened === opt
                        ? opt === "Sim"
                          ? "border-[#252525] bg-[#252525] text-[#DCDACF] font-bold"
                          : "border-[#CB4B3B] bg-[#CB4B3B] text-[#DCDACF] font-bold"
                        : "border-[#252525]/20 bg-white hover:border-[#252525]/40"
                    }`}
                  >
                    <input
                      type="radio"
                      id={`happened-${opt}`}
                      name="visitHappened"
                      value={opt}
                      checked={visitHappened === opt}
                      onChange={() => setVisitHappened(opt)}
                      className="w-4 h-4"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
              {!happened && (
                <p className="mt-2.5 p-3 rounded-xl bg-[#CB4B3B]/10 border border-[#CB4B3B]/30 text-xs font-bold text-[#CB4B3B]">
                  Como a visita não aconteceu, o formulário vai diretamente para
                  o final (Próximos passos) para registrar o reagendamento ou
                  encaminhamento.
                </p>
              )}
            </div>
          </fieldset>

          {/* =========================================================
              SEÇÕES 2, 3 e 4 (Exibidas quando a visita aconteceu)
             ========================================================= */}
          {happened && (
            <>
              {/* SEÇÃO 2: CARACTERÍSTICAS DA VISITA */}
              <fieldset className="space-y-6">
                <legend className="text-base sm:text-lg font-black uppercase tracking-tight text-[#252525] flex items-center gap-2.5 pb-2.5 border-b-2 border-[#DCDACF] w-full">
                  <span className="w-7 h-7 rounded-lg bg-[#CB4B3B] text-[#DCDACF] text-xs font-black inline-flex items-center justify-center">
                    2
                  </span>
                  Características da visita
                </legend>

                {/* Motivo principal da visita (todas as opções visíveis) */}
                <div>
                  <span className="block text-sm font-extrabold uppercase tracking-wide text-[#252525] mb-2">
                    Motivo principal da visita
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {VISIT_REASONS.map((r) => (
                      <label
                        key={r}
                        htmlFor={`main-reason-${r}`}
                        className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border-2 cursor-pointer text-xs sm:text-sm min-h-[48px] transition-colors ${
                          mainReason === r
                            ? "border-[#CB4B3B] bg-[#CB4B3B]/10 font-bold text-[#252525]"
                            : "border-[#252525]/20 bg-white hover:border-[#252525]/40"
                        }`}
                      >
                        <input
                          type="radio"
                          id={`main-reason-${r}`}
                          name="mainReason"
                          value={r}
                          checked={mainReason === r}
                          onChange={() => setMainReason(r)}
                          className="w-4 h-4"
                        />
                        <span>{r}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Como você classificaria a situação atual da pessoa/família? */}
                <div>
                  <span className="block text-sm font-extrabold uppercase tracking-wide text-[#252525] mb-2">
                    Como você classificaria a situação atual da pessoa/família?
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SITUATION_LEVELS.map((lvl) => {
                      const meta = SITUATION_META[lvl];
                      const selected = situation === lvl;
                      return (
                        <label
                          key={lvl}
                          htmlFor={`sit-${lvl}`}
                          className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all min-h-[56px] ${
                            selected
                              ? lvl === "prioritario"
                                ? "border-[#CB4B3B] bg-[#CB4B3B] text-[#DCDACF] font-black"
                                : "border-[#252525] bg-[#252525] text-[#DCDACF] font-black"
                              : "border-[#252525]/20 bg-white text-[#252525] hover:border-[#252525]/40"
                          }`}
                        >
                          <input
                            type="radio"
                            id={`sit-${lvl}`}
                            name="situation"
                            value={lvl}
                            checked={selected}
                            onChange={() => setSituation(lvl)}
                            className="w-4 h-4"
                          />
                          <span className="text-xs sm:text-sm">
                            {meta.emoji} {meta.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </fieldset>

              {/* SEÇÃO 3: VIDA NA IGREJA */}
              <fieldset className="space-y-6">
                <legend className="text-base sm:text-lg font-black uppercase tracking-tight text-[#252525] flex items-center gap-2.5 pb-2.5 border-b-2 border-[#DCDACF] w-full">
                  <span className="w-7 h-7 rounded-lg bg-[#CB4B3B] text-[#DCDACF] text-xs font-black inline-flex items-center justify-center">
                    3
                  </span>
                  Vida na igreja
                </legend>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Atualmente está frequentando os cultos? */}
                  <div>
                    <span className="block text-sm font-extrabold uppercase tracking-wide text-[#252525] mb-2">
                      Atualmente está frequentando os cultos?
                    </span>
                    <div className="space-y-2">
                      {SERVICE_ATTENDANCE.map((att) => (
                        <label
                          key={att}
                          htmlFor={`att-service-${att}`}
                          className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border-2 cursor-pointer text-xs sm:text-sm min-h-[48px] transition-colors ${
                            serviceAttendance === att
                              ? "border-[#CB4B3B] bg-[#CB4B3B]/10 font-bold"
                              : "border-[#252525]/20 bg-white hover:border-[#252525]/40"
                          }`}
                        >
                          <input
                            type="radio"
                            id={`att-service-${att}`}
                            name="serviceAttendance"
                            value={att}
                            checked={serviceAttendance === att}
                            onChange={() => setServiceAttendance(att)}
                            className="w-4 h-4"
                          />
                          <span>{att}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Está integrado(a) à igreja? */}
                  <div>
                    <span className="block text-sm font-extrabold uppercase tracking-wide text-[#252525] mb-2">
                      Está integrado(a) à igreja?
                    </span>
                    <div className="space-y-2">
                      {INTEGRATION_LEVELS.map((integ) => (
                        <label
                          key={integ}
                          htmlFor={`integ-${integ}`}
                          className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border-2 cursor-pointer text-xs sm:text-sm min-h-[48px] transition-colors ${
                            integration === integ
                              ? "border-[#CB4B3B] bg-[#CB4B3B]/10 font-bold"
                              : "border-[#252525]/20 bg-white hover:border-[#252525]/40"
                          }`}
                        >
                          <input
                            type="radio"
                            id={`integ-${integ}`}
                            name="integration"
                            value={integ}
                            checked={integration === integ}
                            onChange={() => setIntegration(integ)}
                            className="w-4 h-4"
                          />
                          <span>{integ}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Participa de uma Casa do Alto? */}
                  <div>
                    <span className="block text-sm font-extrabold uppercase tracking-wide text-[#252525] mb-2">
                      Participa de uma Casa do Alto?
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {YES_NO_UNKNOWN.map((opt) => (
                        <label
                          key={opt}
                          htmlFor={`casa-${opt}`}
                          className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border-2 cursor-pointer text-xs sm:text-sm min-h-[48px] transition-colors ${
                            inCasaDoAlto === opt
                              ? "border-[#252525] bg-[#252525] text-[#DCDACF] font-bold"
                              : "border-[#252525]/20 bg-white hover:border-[#252525]/40"
                          }`}
                        >
                          <input
                            type="radio"
                            id={`casa-${opt}`}
                            name="inCasaDoAlto"
                            value={opt}
                            checked={inCasaDoAlto === opt}
                            onChange={() => setInCasaDoAlto(opt)}
                            className="w-4 h-4"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Participa de algum ministério? */}
                  <div>
                    <span className="block text-sm font-extrabold uppercase tracking-wide text-[#252525] mb-2">
                      Participa de algum ministério?
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {YES_NO_UNKNOWN.map((opt) => (
                        <label
                          key={opt}
                          htmlFor={`min-${opt}`}
                          className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border-2 cursor-pointer text-xs sm:text-sm min-h-[48px] transition-colors ${
                            inMinistry === opt
                              ? "border-[#252525] bg-[#252525] text-[#DCDACF] font-bold"
                              : "border-[#252525]/20 bg-white hover:border-[#252525]/40"
                          }`}
                        >
                          <input
                            type="radio"
                            id={`min-${opt}`}
                            name="inMinistry"
                            value={opt}
                            checked={inMinistry === opt}
                            onChange={() => setInMinistry(opt)}
                            className="w-4 h-4"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </fieldset>

              {/* SEÇÃO 4: REGISTRO PASTORAL */}
              <fieldset className="space-y-6">
                <legend className="text-base sm:text-lg font-black uppercase tracking-tight text-[#252525] flex items-center gap-2.5 pb-2.5 border-b-2 border-[#DCDACF] w-full">
                  <span className="w-7 h-7 rounded-lg bg-[#CB4B3B] text-[#DCDACF] text-xs font-black inline-flex items-center justify-center">
                    4
                  </span>
                  Registro pastoral
                </legend>

                {/* Como foi a visita? */}
                <div>
                  <label
                    htmlFor="visit-summary"
                    className="block text-sm font-extrabold uppercase tracking-wide text-[#252525] mb-1"
                  >
                    Como foi a visita? *
                  </label>
                  <span
                    id="visit-summary-hint"
                    className="block text-xs text-[#252525]/75 mb-2 leading-relaxed"
                  >
                    Exemplo de registro:{" "}
                    <em>
                      &ldquo;Família recebeu muito bem a visita. Conversamos
                      sobre a igreja, família e vida espiritual. Demonstraram
                      desejo de se aproximar mais e participar de uma Casa do
                      Alto.&rdquo;
                    </em>
                  </span>
                  <textarea
                    id="visit-summary"
                    name="summary"
                    required={happened}
                    rows={3}
                    aria-describedby="visit-summary-hint"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Resposta curta ou média sobre como foi a visita..."
                    className="w-full rounded-xl border-2 border-[#252525]/25 bg-white p-4 text-[#252525] font-medium"
                  />
                </div>

                {/* Foto da Visita (Opcional — registrar o momento da visita) */}
                <div className="space-y-3 rounded-2xl bg-[#DCDACF]/35 p-4 sm:p-5 border border-[#252525]/15">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="block text-sm font-extrabold uppercase tracking-wide text-[#252525]">
                        Foto da visita (Opcional)
                      </span>
                      <span className="block text-xs text-[#252525]/70 mt-0.5">
                        Anexe uma foto ou tire uma foto na hora para registrar o momento da visita pastoral.
                      </span>
                    </div>

                    <label
                      htmlFor="visit-photo-input"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#252525] hover:bg-[#CB4B3B] text-[#DCDACF] text-xs font-extrabold uppercase tracking-wider cursor-pointer transition-colors shadow-sm"
                    >
                      <Camera className="w-4 h-4 text-[#CB4B3B] group-hover:text-[#DCDACF]" />
                      <span>
                        {isCompressingPhoto
                          ? "Processando foto..."
                          : photoUrl
                          ? "Trocar Foto"
                          : "Tirar / Escolher Foto"}
                      </span>
                      <input
                        id="visit-photo-input"
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="sr-only"
                      />
                    </label>
                  </div>

                  {photoUrl && (
                    <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="relative rounded-2xl overflow-hidden border-2 border-[#CB4B3B] bg-white shadow-md">
                        <img
                          src={photoUrl}
                          alt="Prévia da foto da visita"
                          className="h-44 sm:h-52 w-auto max-w-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setPhotoUrl("")}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#F9EAE8] text-[#CB4B3B] border border-[#CB4B3B]/40 text-xs font-extrabold uppercase tracking-wider transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remover foto
                      </button>
                    </div>
                  )}
                </div>

                {/* Foi identificado algum pedido de oração? + Se sim: Qual? */}
                <div className="space-y-3 rounded-2xl bg-[#DCDACF]/35 p-4 sm:p-5 border border-[#252525]/15">
                  <span className="block text-sm font-extrabold uppercase tracking-wide text-[#252525]">
                    Foi identificado algum pedido de oração?
                  </span>
                  <div className="grid grid-cols-2 gap-3 max-w-xs">
                    {(["Não", "Sim"] as const).map((opt) => (
                      <label
                        key={opt}
                        htmlFor={`pray-${opt}`}
                        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer text-sm min-h-[48px] transition-colors ${
                          hasPrayerRequest === opt
                            ? "border-[#252525] bg-[#252525] text-[#DCDACF] font-bold"
                            : "border-[#252525]/20 bg-white hover:border-[#252525]/40"
                        }`}
                      >
                        <input
                          type="radio"
                          id={`pray-${opt}`}
                          name="hasPrayerRequest"
                          value={opt}
                          checked={hasPrayerRequest === opt}
                          onChange={() => setHasPrayerRequest(opt)}
                          className="w-4 h-4"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>

                  <div>
                    <label
                      htmlFor="prayer-request-text"
                      className={`block text-xs font-extrabold uppercase tracking-wider mb-1.5 ${
                        hasPrayerRequest === "Sim"
                          ? "text-[#CB4B3B]"
                          : "text-[#252525]/75"
                      }`}
                    >
                      Se sim: Qual?
                    </label>
                    <input
                      type="text"
                      id="prayer-request-text"
                      value={prayerRequest}
                      onChange={(e) => {
                        setPrayerRequest(e.target.value);
                        if (
                          e.target.value.trim() &&
                          hasPrayerRequest !== "Sim"
                        ) {
                          setHasPrayerRequest("Sim");
                        }
                      }}
                      placeholder="Descreva o pedido de oração identificado..."
                      className={`w-full rounded-xl border-2 bg-white px-4 py-3 text-sm font-medium transition-colors ${
                        hasPrayerRequest === "Sim"
                          ? "border-[#CB4B3B]"
                          : "border-[#252525]/25"
                      }`}
                    />
                  </div>
                </div>

                {/* Foi identificada alguma necessidade de acompanhamento? + Se sim: (9 opções) */}
                <div className="space-y-3 rounded-2xl bg-[#DCDACF]/35 p-4 sm:p-5 border border-[#252525]/15">
                  <span className="block text-sm font-extrabold uppercase tracking-wide text-[#252525]">
                    Foi identificada alguma necessidade de acompanhamento?
                  </span>
                  <div className="grid grid-cols-2 gap-3 max-w-xs">
                    {(["Não", "Sim"] as const).map((opt) => (
                      <label
                        key={opt}
                        htmlFor={`fup-${opt}`}
                        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer text-sm min-h-[48px] transition-colors ${
                          needsFollowUp === opt
                            ? "border-[#252525] bg-[#252525] text-[#DCDACF] font-bold"
                            : "border-[#252525]/20 bg-white hover:border-[#252525]/40"
                        }`}
                      >
                        <input
                          type="radio"
                          id={`fup-${opt}`}
                          name="needsFollowUp"
                          value={opt}
                          checked={needsFollowUp === opt}
                          onChange={() => {
                            setNeedsFollowUp(opt);
                            if (opt === "Não") setFollowUpNeeds([]);
                          }}
                          className="w-4 h-4"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>

                  <div className="pt-1">
                    <span
                      className={`block text-xs font-extrabold uppercase tracking-wider mb-2 ${
                        needsFollowUp === "Sim"
                          ? "text-[#CB4B3B]"
                          : "text-[#252525]/75"
                      }`}
                    >
                      Se sim:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {FOLLOW_UP_NEEDS.map((need) => {
                        const checked = followUpNeeds.includes(need);
                        return (
                          <label
                            key={need}
                            htmlFor={`need-${need}`}
                            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border-2 cursor-pointer text-xs sm:text-sm min-h-[48px] transition-colors ${
                              checked
                                ? "border-[#CB4B3B] bg-[#CB4B3B]/10 font-bold text-[#252525]"
                                : "border-[#252525]/20 bg-white hover:border-[#252525]/40"
                            }`}
                          >
                            <input
                              type="checkbox"
                              id={`need-${need}`}
                              value={need}
                              checked={checked}
                              onChange={() => toggleFollowUpNeed(need)}
                              className="w-4 h-4"
                            />
                            <span>{need}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Existe alguma situação que precisa ser comunicada à liderança pastoral? */}
                <div className="space-y-3 rounded-2xl bg-[#DCDACF]/35 p-4 sm:p-5 border border-[#252525]/15">
                  <span className="block text-sm font-extrabold uppercase tracking-wide text-[#252525]">
                    Existe alguma situação que precisa ser comunicada à
                    liderança pastoral?
                  </span>
                  <div className="grid grid-cols-3 gap-3 max-w-md">
                    {LEADERSHIP_COMM.map((comm) => (
                      <label
                        key={comm}
                        htmlFor={`comm-${comm}`}
                        className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 cursor-pointer text-xs sm:text-sm min-h-[48px] transition-colors ${
                          leadershipCommunication === comm
                            ? comm === "Urgente"
                              ? "border-[#CB4B3B] bg-[#CB4B3B] text-[#DCDACF] font-black"
                              : "border-[#252525] bg-[#252525] text-[#DCDACF] font-bold"
                            : "border-[#252525]/20 bg-white hover:border-[#252525]/40"
                        }`}
                      >
                        <input
                          type="radio"
                          id={`comm-${comm}`}
                          name="leadershipCommunication"
                          value={comm}
                          checked={leadershipCommunication === comm}
                          onChange={() => setLeadershipCommunication(comm)}
                          className="w-4 h-4"
                        />
                        <span>{comm}</span>
                      </label>
                    ))}
                  </div>

                  <div>
                    <label
                      htmlFor="leadership-note"
                      className={`block text-xs font-extrabold uppercase tracking-wider mb-1.5 ${
                        leadershipCommunication !== "Não"
                          ? "text-[#CB4B3B]"
                          : "text-[#252525]/75"
                      }`}
                    >
                      Se sim: Observação para a liderança pastoral
                    </label>
                    <textarea
                      id="leadership-note"
                      rows={2}
                      value={leadershipNote}
                      onChange={(e) => {
                        setLeadershipNote(e.target.value);
                        if (
                          e.target.value.trim() &&
                          leadershipCommunication === "Não"
                        ) {
                          setLeadershipCommunication("Sim");
                        }
                      }}
                      placeholder="Descreva a situação que precisa ser comunicada à liderança pastoral..."
                      className={`w-full rounded-xl border-2 bg-white p-3.5 text-sm font-medium transition-colors ${
                        leadershipCommunication !== "Não"
                          ? "border-[#CB4B3B]"
                          : "border-[#252525]/25"
                      }`}
                    />
                  </div>
                </div>
              </fieldset>
            </>
          )}

          {/* =========================================================
              SEÇÃO 5: PRÓXIMOS PASSOS (Sempre exibida, inclusive se a visita não aconteceu)
             ========================================================= */}
          <fieldset className="space-y-6">
            <legend className="text-base sm:text-lg font-black uppercase tracking-tight text-[#252525] flex items-center gap-2.5 pb-2.5 border-b-2 border-[#DCDACF] w-full">
              <span className="w-7 h-7 rounded-lg bg-[#CB4B3B] text-[#DCDACF] text-xs font-black inline-flex items-center justify-center">
                {happened ? "5" : "2"}
              </span>
              Próximos passos
            </legend>

            {/* Qual deve ser o próximo passo? (todas as 10 opções visíveis) */}
            <div>
              <span className="block text-sm font-extrabold uppercase tracking-wide text-[#252525] mb-2">
                Qual deve ser o próximo passo?
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {NEXT_STEPS.map((step) => (
                  <label
                    key={step}
                    htmlFor={`next-step-${step}`}
                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border-2 cursor-pointer text-xs sm:text-sm min-h-[48px] transition-colors ${
                      nextStep === step
                        ? "border-[#CB4B3B] bg-[#CB4B3B]/10 font-bold text-[#252525]"
                        : "border-[#252525]/20 bg-white hover:border-[#252525]/40"
                    }`}
                  >
                    <input
                      type="radio"
                      id={`next-step-${step}`}
                      name="nextStep"
                      value={step}
                      checked={nextStep === step}
                      onChange={() => setNextStep(step)}
                      className="w-4 h-4"
                    />
                    <span>{step}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Precisa de nova visita? + Se sim: Quando aproximadamente? */}
            <div className="space-y-4 rounded-2xl bg-[#DCDACF]/35 p-4 sm:p-5 border border-[#252525]/15">
              <div>
                <span className="block text-sm font-extrabold uppercase tracking-wide text-[#252525] mb-2">
                  Precisa de nova visita?
                </span>
                <div className="grid grid-cols-3 gap-2.5 max-w-md">
                  {NEW_VISIT_NEEDED.map((opt) => (
                    <label
                      key={opt}
                      htmlFor={`newvisit-${opt}`}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border-2 cursor-pointer text-xs sm:text-sm min-h-[48px] transition-colors ${
                        needsNewVisit === opt
                          ? "border-[#252525] bg-[#252525] text-[#DCDACF] font-bold"
                          : "border-[#252525]/20 bg-white hover:border-[#252525]/40"
                      }`}
                    >
                      <input
                        type="radio"
                        id={`newvisit-${opt}`}
                        name="needsNewVisit"
                        value={opt}
                        checked={needsNewVisit === opt}
                        onChange={() => setNeedsNewVisit(opt)}
                        className="w-4 h-4"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <span
                  className={`block text-xs font-extrabold uppercase tracking-wider mb-2 ${
                    needsNewVisit !== "Não"
                      ? "text-[#CB4B3B]"
                      : "text-[#252525]/75"
                  }`}
                >
                  Se sim: Quando aproximadamente?
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {NEW_VISIT_TIMEFRAMES.map((tf) => {
                    const selected =
                      needsNewVisit !== "Não" && newVisitTimeframe === tf;
                    return (
                      <label
                        key={tf}
                        htmlFor={`tf-${tf}`}
                        className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 cursor-pointer text-xs sm:text-sm min-h-[48px] transition-colors ${
                          selected
                            ? "border-[#CB4B3B] bg-[#CB4B3B]/15 font-bold text-[#252525]"
                            : "border-[#252525]/20 bg-white hover:border-[#252525]/40"
                        }`}
                      >
                        <input
                          type="radio"
                          id={`tf-${tf}`}
                          name="newVisitTimeframe"
                          value={tf}
                          checked={selected}
                          onChange={() => {
                            setNewVisitTimeframe(tf);
                            if (needsNewVisit === "Não") {
                              setNeedsNewVisit("Sim");
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span>{tf}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quem ficará responsável pelo acompanhamento? */}
            <div>
              <label
                htmlFor="followup-responsible"
                className="block text-sm font-extrabold uppercase tracking-wide text-[#252525] mb-1.5"
              >
                Quem ficará responsável pelo acompanhamento?
              </label>
              <input
                type="text"
                id="followup-responsible"
                name="followUpResponsible"
                list="pastors-datalist"
                value={followUpResponsible}
                onChange={(e) => setFollowUpResponsible(e.target.value)}
                placeholder="Selecione ou digite o nome do pastor/líder responsável"
                className="w-full rounded-xl border-2 border-[#252525]/25 bg-white px-4 py-3 font-medium"
              />
              <datalist id="pastors-datalist">
                {db.pastors.map((p) => (
                  <option key={p.id} value={p.name} />
                ))}
              </datalist>
            </div>

            {/* Observações internas adicionais */}
            <div>
              <label
                htmlFor="internal-notes"
                className="block text-sm font-extrabold uppercase tracking-wide text-[#252525] mb-1"
              >
                Observações internas adicionais
              </label>
              <span
                id="internal-notes-hint"
                className="block text-xs text-[#252525]/70 mb-1.5"
              >
                Resposta longa.
              </span>
              <textarea
                id="internal-notes"
                name="internalNotes"
                rows={3}
                aria-describedby="internal-notes-hint"
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Anotações internas adicionais para o histórico pastoral..."
                className="w-full rounded-xl border-2 border-[#252525]/25 bg-white p-4 text-[#252525] font-medium"
              />
            </div>
          </fieldset>

          <div className="pt-4 border-t-2 border-[#DCDACF] flex items-center justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto min-h-[52px] px-8 py-4 rounded-xl bg-[#CB4B3B] hover:bg-[#A93829] disabled:opacity-60 text-[#DCDACF] font-black text-sm uppercase tracking-wider shadow-lg transition-all"
            >
              {isSubmitting
                ? "Salvando Relatório..."
                : "Salvar Relatório de Visita Pastoral"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
