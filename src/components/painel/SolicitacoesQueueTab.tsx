"use client";

import React, { useState } from "react";
import {
  DatabaseSchema,
  RequestStatus,
  VisitRequest,
} from "@/types/visitas";
import {
  formatAddress,
  formatDateBR,
  getWhatsAppUrl,
  calculateAge,
  STATUS_META,
} from "@/lib/visitasUtils";
import {
  Calendar,
  Clock,
  MapPin,
  MessageCircle,
  ClipboardCheck,
  UserCheck,
  Filter,
  Eye,
  Phone,
  User,
  Heart,
  Home,
  Users,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { LightDismissDialog } from "@/components/LightDismissDialog";

interface SolicitacoesQueueTabProps {
  db: DatabaseSchema;
  onRegisterVisitFromRequest: (req: VisitRequest) => void;
  onDbUpdated: (updatedDb: DatabaseSchema) => void;
  loggedPastorName?: string;
  isAdmin?: boolean;
}

export function SolicitacoesQueueTab({
  db,
  onRegisterVisitFromRequest,
  onDbUpdated,
  loggedPastorName,
  isAdmin = true,
}: SolicitacoesQueueTabProps) {
  const [statusFilter, setStatusFilter] = useState<string>("ABERTAS");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedRequestDetails, setSelectedRequestDetails] =
    useState<VisitRequest | null>(null);

  const filteredRequests = db.requests.filter((r) => {
    if (!isAdmin && loggedPastorName) {
      if (r.assignedPastor !== loggedPastorName) return false;
    }
    if (statusFilter === "ABERTAS") {
      return r.status === "pendente" || r.status === "agendada";
    }
    if (statusFilter === "REALIZADAS") {
      return r.status === "realizada";
    }
    return true;
  });

  const handleUpdateRequest = async (
    requestId: string,
    updates: {
      status?: RequestStatus;
      assignedPastor?: string;
      scheduledDate?: string;
    }
  ) => {
    setUpdatingId(requestId);
    try {
      const res = await fetch("/api/dados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_REQUEST_STATUS",
          payload: {
            requestId,
            ...updates,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.db) {
        onDbUpdated(data.db);
        if (selectedRequestDetails && selectedRequestDetails.id === requestId) {
          const updated = (data.db as DatabaseSchema).requests.find(
            (r) => r.id === requestId
          );
          if (updated) setSelectedRequestDetails(updated);
        }
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const selectedMemberData = selectedRequestDetails
    ? db.members.find(
        (m) =>
          m.id === selectedRequestDetails.memberId ||
          m.phone.replace(/\D/g, "") ===
            selectedRequestDetails.phone.replace(/\D/g, "") ||
          m.name.toLowerCase().trim() ===
            selectedRequestDetails.memberName.toLowerCase().trim()
      )
    : null;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Banner & Filters */}
      <div className="rounded-3xl bg-[#F4F3EE] p-4 sm:p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 overflow-hidden">
        <div className="min-w-0">
          <span className="block text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-[#CB4B3B]">
            {isAdmin
              ? "Gestão & Designação de Visitas"
              : `Solicitações Designadas para ${loggedPastorName}`}
          </span>
          <h2 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-[#252525] mt-0.5">
            {isAdmin
              ? `Fila de Solicitações (${filteredRequests.length})`
              : `Minhas Solicitações de Visita (${filteredRequests.length})`}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[#CB4B3B] shrink-0 hidden sm:block" />
          {(
            [
              { id: "ABERTAS", label: "Pendentes & Agendadas" },
              { id: "REALIZADAS", label: "Realizadas" },
              { id: "TODAS", label: "Todas" },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 sm:px-3.5 py-2 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-colors whitespace-nowrap ${
                statusFilter === f.id
                  ? "bg-[#252525] text-[#DCDACF]"
                  : "bg-[#DCDACF] text-[#252525] hover:bg-[#C7C4B5]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filteredRequests.length === 0 && (
        <div className="rounded-3xl bg-[#F4F3EE] p-8 sm:p-12 text-center border-2 border-dashed border-[#252525]/20">
          <UserCheck className="w-10 h-10 text-[#CB4B3B] mx-auto mb-2.5" />
          <h3 className="text-base sm:text-lg font-black uppercase text-[#252525]">
            {isAdmin
              ? "Nenhuma solicitação neste filtro"
              : "Nenhuma solicitação designada para você neste momento"}
          </h3>
          <p className="text-xs sm:text-sm text-[#252525]/70 mt-1 font-medium">
            {isAdmin
              ? "Altere o filtro acima para visualizar outras solicitações."
              : "Quando a administração designar uma nova solicitação de visita para você, ela aparecerá aqui."}
          </p>
        </div>
      )}

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.map((req) => {
          const statMeta = STATUS_META[req.status];

          return (
            <div
              key={req.id}
              className="rounded-3xl bg-[#F4F3EE] p-4 sm:p-6 shadow-md overflow-hidden border border-[#252525]/10"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-4 border-b border-[#252525]/15">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-wider border ${statMeta.badgeClass}`}
                    >
                      {statMeta.label}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#252525] text-[#DCDACF] text-[11px] sm:text-xs font-bold">
                      Solicitado por: {req.requesterType}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#DCDACF] text-[#252525] text-[11px] sm:text-xs font-bold">
                      {req.relationship}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-[#252525] mt-2 break-words">
                    {req.memberName}
                  </h3>

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(req.reasons || []).map((reason) => (
                      <span
                        key={reason}
                        className="px-2.5 py-0.5 rounded-md bg-[#CB4B3B]/15 text-[#CB4B3B] text-xs font-bold"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-4 text-xs font-bold text-[#252525]/75 mt-3">
                    <span className="inline-flex items-start gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#CB4B3B] shrink-0 mt-0.5" />
                      <span>{req.phone}</span>
                    </span>
                    <span className="inline-flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#CB4B3B] shrink-0 mt-0.5" />
                      <span className="break-words">
                        {formatAddress(req.address)}
                      </span>
                    </span>
                    <span className="inline-flex items-start gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#CB4B3B] shrink-0 mt-0.5" />
                      <span>Dias: {(req.preferredDays || []).join(", ")}</span>
                    </span>
                    <span className="inline-flex items-start gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#CB4B3B] shrink-0 mt-0.5" />
                      <span>Período: {(req.preferredShifts || []).join(", ")}</span>
                    </span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedRequestDetails(req)}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#DCDACF] text-[#252525] border-2 border-[#252525]/20 text-xs font-extrabold uppercase tracking-wider transition-colors text-center shadow-sm"
                  >
                    <Eye className="w-4 h-4 text-[#CB4B3B] shrink-0" />
                    Ver Formulário Completo
                  </button>

                  <a
                    href={getWhatsAppUrl(
                      req.phone,
                      req.memberName,
                      req.assignedPastor
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#DCDACF] hover:bg-emerald-700 hover:text-white text-[#252525] text-xs font-extrabold uppercase tracking-wider transition-colors text-center"
                  >
                    <MessageCircle className="w-4 h-4 shrink-0" />
                    Confirmar no WhatsApp
                  </a>

                  {req.status !== "realizada" && (
                    <button
                      type="button"
                      onClick={() => onRegisterVisitFromRequest(req)}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#CB4B3B] hover:bg-[#A93829] text-[#DCDACF] text-xs font-black uppercase tracking-wider shadow transition-colors text-center"
                    >
                      <ClipboardCheck className="w-4 h-4 shrink-0" />
                      Preencher Relatório
                    </button>
                  )}
                </div>
              </div>

              {req.observations && (
                <div className="my-3.5 sm:my-4 p-3.5 sm:p-4 rounded-2xl bg-[#DCDACF]/65 border-l-4 border-[#CB4B3B] text-xs sm:text-sm text-[#252525] font-medium break-words">
                  <strong className="block text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#CB4B3B] mb-1">
                    Observação para a Equipe Pastoral:
                  </strong>
                  “{req.observations}”
                </div>
              )}

              <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0 w-full sm:w-auto">
                  <span className="font-black uppercase tracking-wider text-[#252525] inline-flex items-center gap-1.5 shrink-0">
                    <UserCheck className="w-4 h-4 text-[#CB4B3B] shrink-0" />
                    Pastor / Visitador Designado:
                  </span>
                  {isAdmin ? (
                    <select
                      id={`assign-${req.id}`}
                      aria-label="Pastor ou visitador designado"
                      disabled={updatingId === req.id}
                      value={req.assignedPastor || ""}
                      onChange={(e) =>
                        handleUpdateRequest(req.id, {
                          assignedPastor: e.target.value,
                          status:
                            req.status === "pendente" ? "agendada" : req.status,
                        })
                      }
                      className="w-full sm:w-auto max-w-full min-w-0 truncate rounded-xl border border-[#252525]/25 bg-white px-3 py-2 text-xs font-bold"
                    >
                      <option value="">— Selecionar Visitador —</option>
                      {db.pastors.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-[#252525] text-[#DCDACF] text-xs font-black">
                      {req.assignedPastor || loggedPastorName}
                    </span>
                  )}
                </div>

                <div className="text-[#252525]/65 font-semibold shrink-0">
                  Solicitado em {formatDateBR(req.createdAt)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: VER FORMULÁRIO COMPLETO COM TODAS AS RESPOSTAS DO MEMBRO */}
      {selectedRequestDetails && (
        <LightDismissDialog
          open={!!selectedRequestDetails}
          onClose={() => setSelectedRequestDetails(null)}
          title={`Solicitação: ${selectedRequestDetails.memberName}`}
          subtitle={`Protocolo: ${selectedRequestDetails.id} • Solicitado em ${formatDateBR(
            selectedRequestDetails.createdAt
          )}`}
          maxWidthClass="max-w-3xl"
        >
          <div className="space-y-6 text-[#252525]">
            {/* Badges de Status e Vínculo */}
            <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-[#252525]/15">
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                  STATUS_META[selectedRequestDetails.status].badgeClass
                }`}
              >
                {STATUS_META[selectedRequestDetails.status].label}
              </span>
              <span className="px-3 py-1 rounded-full bg-[#252525] text-[#DCDACF] text-xs font-bold">
                Solicitado por: {selectedRequestDetails.requesterType}
              </span>
              <span className="px-3 py-1 rounded-full bg-[#CB4B3B]/15 text-[#CB4B3B] text-xs font-bold">
                Vínculo: {selectedRequestDetails.relationship}
              </span>
            </div>

            {/* SEÇÃO: DISPONIBILIDADE E PREFERÊNCIAS DE HORÁRIO */}
            <div className="rounded-2xl bg-white p-4 sm:p-5 border-2 border-[#252525]/15 space-y-3">
              <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-[#CB4B3B]">
                <Clock className="w-4 h-4" />
                <span>Preferências de Agendamento (Dias & Horários)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-[#F4F3EE] border border-[#252525]/10">
                  <span className="block text-[11px] font-extrabold uppercase text-[#252525]/70 mb-1.5">
                    Melhores dias da semana informados:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedRequestDetails.preferredDays || []).length > 0 ? (
                      selectedRequestDetails.preferredDays.map((dia) => (
                        <span
                          key={dia}
                          className="px-2.5 py-1 rounded-lg bg-[#252525] text-[#DCDACF] text-xs font-black"
                        >
                          {dia}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs font-bold text-[#252525]/60">
                        A combinar
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F4F3EE] border border-[#252525]/10">
                  <span className="block text-[11px] font-extrabold uppercase text-[#252525]/70 mb-1.5">
                    Melhores períodos informados:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedRequestDetails.preferredShifts || []).length > 0 ? (
                      selectedRequestDetails.preferredShifts.map((turno) => (
                        <span
                          key={turno}
                          className="px-2.5 py-1 rounded-lg bg-[#CB4B3B] text-[#DCDACF] text-xs font-black"
                        >
                          {turno}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs font-bold text-[#252525]/60">
                        A combinar
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {selectedRequestDetails.observations && (
                <div className="p-3.5 rounded-xl bg-[#DCDACF]/60 border-l-4 border-[#CB4B3B] text-xs sm:text-sm text-[#252525] font-medium">
                  <strong className="block text-[11px] font-black uppercase tracking-wider text-[#CB4B3B] mb-1">
                    Mensagem / Observação enviada no formulário:
                  </strong>
                  “{selectedRequestDetails.observations}”
                </div>
              )}
            </div>

            {/* SEÇÃO: MOTIVOS DA VISITA */}
            <div className="rounded-2xl bg-white p-4 sm:p-5 border-2 border-[#252525]/15 space-y-3">
              <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-[#252525]">
                <Heart className="w-4 h-4 text-[#CB4B3B]" />
                <span>Motivo(s) da Visita Solicitada</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(selectedRequestDetails.reasons || []).map((reason) => (
                  <span
                    key={reason}
                    className="px-3 py-1.5 rounded-xl bg-[#CB4B3B]/15 text-[#CB4B3B] border border-[#CB4B3B]/30 text-xs font-black uppercase tracking-wide"
                  >
                    {reason}
                  </span>
                ))}
              </div>
            </div>

            {/* SEÇÃO: CONTATO & ENDEREÇO COMPLETO */}
            <div className="rounded-2xl bg-white p-4 sm:p-5 border-2 border-[#252525]/15 space-y-3">
              <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-[#252525]">
                <MapPin className="w-4 h-4 text-[#CB4B3B]" />
                <span>Endereço & Contato</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                <div>
                  <span className="block text-[11px] font-extrabold uppercase text-[#252525]/60 mb-0.5">
                    Telefone / WhatsApp:
                  </span>
                  <a
                    href={getWhatsAppUrl(
                      selectedRequestDetails.phone,
                      selectedRequestDetails.memberName,
                      selectedRequestDetails.assignedPastor
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-black text-emerald-800 hover:underline"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    {selectedRequestDetails.phone}
                  </a>
                </div>

                <div>
                  <span className="block text-[11px] font-extrabold uppercase text-[#252525]/60 mb-0.5">
                    Endereço Completo:
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-[#252525]">
                    {formatAddress(selectedRequestDetails.address)}
                  </p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      formatAddress(selectedRequestDetails.address)
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#CB4B3B] hover:underline mt-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Ver no Google Maps
                  </a>
                </div>
              </div>
            </div>

            {/* SEÇÃO: RESPOSTAS DO CADASTRO FAMILIAR & VIDA NA IGREJA */}
            {selectedMemberData && (
              <div className="rounded-2xl bg-white p-4 sm:p-5 border-2 border-[#252525]/15 space-y-3">
                <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-[#252525]">
                  <Users className="w-4 h-4 text-[#CB4B3B]" />
                  <span>Família & Vida na Igreja</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#F4F3EE]">
                    <span className="block text-[10px] font-extrabold uppercase text-[#252525]/60 mb-0.5">
                      Estado Civil / Cônjuge:
                    </span>
                    <strong className="block text-xs font-black">
                      {selectedMemberData.maritalStatus || "Não informado"}
                      {selectedMemberData.spouseName
                        ? ` • ${selectedMemberData.spouseName}`
                        : ""}
                    </strong>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F4F3EE]">
                    <span className="block text-[10px] font-extrabold uppercase text-[#252525]/60 mb-0.5">
                      Pessoas na Casa / Família:
                    </span>
                    <strong className="block text-xs font-black">
                      {selectedMemberData.householdSize
                        ? `${selectedMemberData.householdSize} pessoa(s) no lar`
                        : "Não informado"}
                    </strong>
                    {selectedMemberData.familyInChurch && (
                      <span className="block text-[11px] font-semibold text-[#252525]/80 mt-0.5">
                        {selectedMemberData.familyInChurch}
                      </span>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-[#F4F3EE]">
                    <span className="block text-[10px] font-extrabold uppercase text-[#252525]/60 mb-0.5">
                      Tempo de Igreja / Atividade:
                    </span>
                    <strong className="block text-xs font-black">
                      {selectedMemberData.attendanceTime || "Não informado"}
                    </strong>
                    {selectedMemberData.activityName && (
                      <span className="block text-[11px] font-semibold text-[#CB4B3B] mt-0.5">
                        {selectedMemberData.activityName}
                      </span>
                    )}
                  </div>
                </div>

                {selectedMemberData.birthDate && (
                  <div className="text-[11px] font-bold text-[#252525]/75 pt-1">
                    Nascimento: {formatDateBR(selectedMemberData.birthDate)}{" "}
                    {calculateAge(selectedMemberData.birthDate)
                      ? `(${calculateAge(selectedMemberData.birthDate)} anos)`
                      : ""}
                  </div>
                )}
              </div>
            )}

            {/* SEÇÃO: PASTOR DESIGNADO */}
            <div className="p-4 rounded-2xl bg-[#DCDACF]/50 border border-[#252525]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#CB4B3B]" />
                <span className="font-extrabold uppercase">
                  Pastor Responsável:
                </span>
                <span className="font-black text-sm">
                  {selectedRequestDetails.assignedPastor || "Ainda não designado"}
                </span>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#252525]/70">
                    Alterar:
                  </span>
                  <select
                    value={selectedRequestDetails.assignedPastor || ""}
                    onChange={(e) =>
                      handleUpdateRequest(selectedRequestDetails.id, {
                        assignedPastor: e.target.value,
                        status:
                          selectedRequestDetails.status === "pendente"
                            ? "agendada"
                            : selectedRequestDetails.status,
                      })
                    }
                    className="rounded-xl border border-[#252525]/25 bg-white px-3 py-1.5 text-xs font-bold"
                  >
                    <option value="">— Selecionar Visitador —</option>
                    {db.pastors.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* BOTÕES DE AÇÃO DO MODAL */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-[#252525]/15">
              <a
                href={getWhatsAppUrl(
                  selectedRequestDetails.phone,
                  selectedRequestDetails.memberName,
                  selectedRequestDetails.assignedPastor
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black uppercase tracking-wider transition-colors shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                Conversar no WhatsApp
              </a>

              {selectedRequestDetails.status !== "realizada" && (
                <button
                  type="button"
                  onClick={() => {
                    const req = selectedRequestDetails;
                    setSelectedRequestDetails(null);
                    onRegisterVisitFromRequest(req);
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#CB4B3B] hover:bg-[#A93829] text-[#DCDACF] text-xs font-black uppercase tracking-wider shadow-md transition-colors"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  Preencher Relatório da Visita
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedRequestDetails(null)}
                className="w-full sm:w-auto px-4 py-3 rounded-xl bg-[#DCDACF] hover:bg-[#C7C4B5] text-[#252525] text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </LightDismissDialog>
      )}
    </div>
  );
}
