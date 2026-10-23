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
} from "lucide-react";

interface SolicitacoesQueueTabProps {
  db: DatabaseSchema;
  onRegisterVisitFromRequest: (req: VisitRequest) => void;
  onDbUpdated: (updatedDb: DatabaseSchema) => void;
}

export function SolicitacoesQueueTab({
  db,
  onRegisterVisitFromRequest,
  onDbUpdated,
}: SolicitacoesQueueTabProps) {
  const [statusFilter, setStatusFilter] = useState<string>("ABERTAS");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filteredRequests = db.requests.filter((r) => {
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
      }
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-3xl bg-[#F4F3EE] p-4 sm:p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 overflow-hidden">
        <div className="min-w-0">
          <span className="block text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-[#CB4B3B]">
            Formulário 01 — Solicitação de Visita Pastoral
          </span>
          <h2 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-[#252525] mt-0.5">
            Fila de Solicitações ({filteredRequests.length})
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

      <div className="space-y-4">
        {filteredRequests.map((req) => {
          const statMeta = STATUS_META[req.status];

          return (
            <div
              key={req.id}
              className="rounded-3xl bg-[#F4F3EE] p-4 sm:p-6 shadow-md overflow-hidden"
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
                      <MapPin className="w-3.5 h-3.5 text-[#CB4B3B] shrink-0 mt-0.5" />
                      <span className="break-words">{formatAddress(req.address)}</span>
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

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto shrink-0">
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
                      Preencher Relatório da Visita
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
                  <label
                    htmlFor={`assign-${req.id}`}
                    className="font-black uppercase tracking-wider text-[#252525] inline-flex items-center gap-1.5 shrink-0"
                  >
                    <UserCheck className="w-4 h-4 text-[#CB4B3B] shrink-0" />
                    Pastor / Visitador Designado:
                  </label>
                  <select
                    id={`assign-${req.id}`}
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
                        {p.name} ({p.regionFocus})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-[#252525]/65 font-semibold shrink-0">
                  Solicitado em {formatDateBR(req.createdAt)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
