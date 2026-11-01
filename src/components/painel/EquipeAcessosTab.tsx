"use client";

import React, { useState, useMemo } from "react";
import { DatabaseSchema, PastorLeader } from "@/types/visitas";
import {
  ShieldCheck,
  Users,
  Search,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  UserX,
  ArrowUpRight,
  Sparkles,
  Crown,
  HeartHandshake,
} from "lucide-react";
import Link from "next/link";
import { formatPhoneBR } from "@/lib/cpfUtils";

interface EquipeAcessosTabProps {
  db: DatabaseSchema;
  onDbUpdated: (updatedDb: DatabaseSchema) => void;
}

interface EligibleVisitor {
  id: string;
  memberId?: string;
  pastorId?: string;
  name: string;
  phone?: string;
  email?: string;
  isPastor: boolean;
  isLeader: boolean;
  isAdmin: boolean;
  isVisitorActive: boolean;
}

export function EquipeAcessosTab({
  db,
  onDbUpdated,
}: EquipeAcessosTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"todos" | "ativos" | "inativos">("todos");
  const [filterRole, setFilterRole] = useState<"todos" | "pastores" | "lideres" | "admins">("todos");
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Constrói a lista unificada de membros elegíveis para serem visitadores (somente Pastores, Líderes e Admins)
  const eligibleVisitors = useMemo<EligibleVisitor[]>(() => {
    const list: EligibleVisitor[] = [];
    const seenNames = new Set<string>();
    const seenMemberIds = new Set<string>();

    // 1. Membros com papel de pastor, líder ou admin
    for (const m of db.members || []) {
      const isPastor = Boolean(m.isPastor || m.portalRole === "pastor");
      const isLeader = Boolean(m.isLeader);
      const isAdmin = Boolean(m.isAdmin || m.portalRole === "admin");

      if (isPastor || isLeader || isAdmin) {
        const pastor = db.pastors?.find(
          (p) =>
            p.memberId === m.id ||
            p.id === `pas-${m.id}` ||
            p.name.trim().toLowerCase() === m.name.trim().toLowerCase()
        );

        const isActive =
          m.isVisitorActive !== undefined
            ? m.isVisitorActive
            : pastor?.isVisitorActive !== undefined
            ? pastor.isVisitorActive
            : true;

        list.push({
          id: m.id,
          memberId: m.id,
          pastorId: pastor?.id,
          name: m.name,
          phone: m.phone || pastor?.phone,
          email: m.email,
          isPastor: isPastor || pastor?.role === "Pastores",
          isLeader: isLeader || pastor?.role === "Líderes" || pastor?.accessRole === "lider",
          isAdmin: isAdmin || pastor?.accessRole === "admin",
          isVisitorActive: isActive,
        });

        seenNames.add(m.name.trim().toLowerCase());
        seenMemberIds.add(m.id);
      }
    }

    // 2. Pastores da lista que não estejam amarrados a um membro já listado
    for (const p of db.pastors || []) {
      const pNameNorm = p.name.trim().toLowerCase();
      if (!seenNames.has(pNameNorm)) {
        const isLeader = p.role === "Líderes" || p.accessRole === "lider";
        const isAdmin = p.accessRole === "admin";
        const isPastor = !isLeader && !isAdmin ? true : p.role === "Pastores";
        const isActive = p.isVisitorActive !== false;

        list.push({
          id: p.id,
          pastorId: p.id,
          memberId: p.memberId,
          name: p.name,
          phone: p.phone,
          isPastor,
          isLeader,
          isAdmin,
          isVisitorActive: isActive,
        });
        seenNames.add(pNameNorm);
      }
    }

    return list.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [db.members, db.pastors]);

  // Contadores
  const totalEligible = eligibleVisitors.length;
  const totalActive = eligibleVisitors.filter((v) => v.isVisitorActive).length;
  const totalInactive = totalEligible - totalActive;

  // Filtragem
  const filteredVisitors = useMemo(() => {
    return eligibleVisitors.filter((v) => {
      // Filtro de busca
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = v.name.toLowerCase().includes(q);
        const matchPhone = v.phone ? v.phone.replace(/\D/g, "").includes(q) : false;
        const matchEmail = v.email ? v.email.toLowerCase().includes(q) : false;
        if (!matchName && !matchPhone && !matchEmail) return false;
      }

      // Filtro de status
      if (filterStatus === "ativos" && !v.isVisitorActive) return false;
      if (filterStatus === "inativos" && v.isVisitorActive) return false;

      // Filtro de papel
      if (filterRole === "pastores" && !v.isPastor) return false;
      if (filterRole === "lideres" && !v.isLeader) return false;
      if (filterRole === "admins" && !v.isAdmin) return false;

      return true;
    });
  }, [eligibleVisitors, searchQuery, filterStatus, filterRole]);

  // Alterna o status de visitador ativo / inativo
  const handleToggleVisitorActive = async (visitor: EligibleVisitor) => {
    const nextStatus = !visitor.isVisitorActive;
    setIsUpdatingId(visitor.id);
    setFeedback(null);

    try {
      const res = await fetch("/api/dados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TOGGLE_VISITOR_ACTIVE",
          payload: {
            id: visitor.id,
            isVisitorActive: nextStatus,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao alterar status de visitador.");
      }

      // Sincroniza também no portal de membros para garantir coerência de estado
      try {
        await fetch("/api/membros", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "ADMIN_TOGGLE_VISITOR_ACTIVE",
            payload: {
              memberId: visitor.memberId || visitor.id,
              pastorId: visitor.pastorId,
              isVisitorActive: nextStatus,
            },
          }),
        });
      } catch {
        // Fallback silencioso pois api/dados já sincronizou db e Supabase
      }

      if (data.db) {
        onDbUpdated(data.db);
      }

      setFeedback({
        type: "success",
        text: `"${visitor.name}" foi ${
          nextStatus
            ? "ATIVADO(A) como visitador oficial! Agora aparecerá na lista de quem realizou visitas."
            : "DESATIVADO(A) da escala de visitas. Não aparecerá na lista de visitadores ao registrar ou designar visitas."
        }`,
      });
    } catch (err) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Erro ao alterar status do visitador.",
      });
    } finally {
      setIsUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner de Cabeçalho da Gestão de Visitadores */}
      <div className="rounded-3xl bg-[#252525] text-[#DCDACF] p-6 sm:p-8 border-b-4 border-[#CB4B3B] shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#CB4B3B]/20 text-[#CB4B3B] text-xs font-black uppercase tracking-wider border border-[#CB4B3B]/30">
            <UserCheck className="w-4 h-4" />
            <span>Gestão de Visitadores da Igreja</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
            Escala & Habilitação de Visitadores
          </h2>
          <p className="text-xs sm:text-sm text-[#DCDACF]/80 leading-relaxed">
            Aqui aparecem <strong>somente os perfis de Pastor, Líder e Admin</strong> cadastrados na igreja.
            Ative ou desative quem está apto a realizar visitas e aparecer na lista de quem visitou.
          </p>
        </div>

        <Link
          href="/membros"
          className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-[#CB4B3B] hover:bg-[#A93829] text-white text-xs font-black uppercase tracking-wider transition-colors shrink-0 shadow-md group"
          title="Acessar nomeação de cargos no Portal do Membro"
        >
          <span>Gerenciar Cargos no Portal do Membro</span>
          <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#252525]/10 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[11px] font-black uppercase tracking-wider text-[#252525]/60">
              Total de Perfis Elegíveis
            </span>
            <span className="text-2xl sm:text-3xl font-black text-[#252525]">
              {totalEligible}
            </span>
            <span className="block text-[11px] font-bold text-[#252525]/60 mt-0.5">
              Pastores, Líderes e Admins
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#F4F3EE] flex items-center justify-center text-[#252525]">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[11px] font-black uppercase tracking-wider text-emerald-800">
              Visitadores Ativos
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-900">
              {totalActive}
            </span>
            <span className="block text-[11px] font-bold text-emerald-700 mt-0.5">
              Aparecem na lista para visitas
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[11px] font-black uppercase tracking-wider text-zinc-600">
              Visitadores Inativos
            </span>
            <span className="text-2xl sm:text-3xl font-black text-zinc-800">
              {totalInactive}
            </span>
            <span className="block text-[11px] font-bold text-zinc-500 mt-0.5">
              Temporariamente fora da escala
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-zinc-200 flex items-center justify-center text-zinc-700">
            <UserX className="w-6 h-6" />
          </div>
        </div>
      </div>

      {feedback && (
        <div
          role="status"
          className={`p-4 rounded-2xl border-2 flex items-center gap-3 text-xs sm:text-sm font-bold shadow-sm ${
            feedback.type === "success"
              ? "bg-emerald-950 text-white border-emerald-600"
              : "bg-[#F9EAE8] text-[#A93829] border-[#CB4B3B]"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-[#CB4B3B] shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Barra de Filtros e Busca */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#F4F3EE] border border-[#252525]/15 space-y-3 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#252525]/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, telefone ou e-mail..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-[#252525]/20 bg-white text-xs sm:text-sm font-semibold text-[#252525] focus:border-[#CB4B3B] focus:ring-1 focus:ring-[#CB4B3B]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#252525]/40 hover:text-[#252525] p-1"
                title="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtro de Status */}
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setFilterStatus("todos")}
              className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors ${
                filterStatus === "todos"
                  ? "bg-[#252525] text-white shadow"
                  : "bg-white text-[#252525]/75 hover:bg-[#DCDACF]"
              }`}
            >
              Todos ({totalEligible})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("ativos")}
              className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors ${
                filterStatus === "ativos"
                  ? "bg-emerald-700 text-white shadow"
                  : "bg-white text-emerald-800 hover:bg-emerald-100"
              }`}
            >
              Ativos ({totalActive})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("inativos")}
              className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors ${
                filterStatus === "inativos"
                  ? "bg-zinc-800 text-white shadow"
                  : "bg-white text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              Inativos ({totalInactive})
            </button>
          </div>
        </div>

        {/* Filtro por Papel */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#252525]/10 text-xs font-bold text-[#252525]/70">
          <span className="text-[11px] font-black uppercase tracking-wider">Filtrar por Papel:</span>
          {(["todos", "pastores", "lideres", "admins"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setFilterRole(r)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider transition-colors ${
                filterRole === r
                  ? "bg-[#CB4B3B] text-white"
                  : "bg-white/80 hover:bg-white text-[#252525]"
              }`}
            >
              {r === "todos"
                ? "Todos os Cargos"
                : r === "pastores"
                ? "Pastores"
                : r === "lideres"
                ? "Líderes"
                : "Admins"}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Visitadores */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#252525]/70">
            Perfis Habilitados para Gestão de Visitas ({filteredVisitors.length})
          </span>
          <span className="text-[11px] text-[#252525]/60 font-semibold">
            Clique no botão para ativar ou desativar o visitador
          </span>
        </div>

        {filteredVisitors.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border-2 border-[#252525]/10 space-y-3">
            <Users className="w-10 h-10 text-[#252525]/40 mx-auto" />
            <h4 className="text-base font-black text-[#252525]">
              Nenhum perfil encontrado com os filtros atuais.
            </h4>
            <p className="text-xs text-[#252525]/65 max-w-md mx-auto">
              Para cadastrar novos pastores, líderes ou administradores, utilize a aba de Gestão de Equipe no Portal do Membro.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredVisitors.map((v) => {
              const isUpdating = isUpdatingId === v.id;
              return (
                <div
                  key={v.id}
                  className={`p-5 rounded-3xl border-2 transition-all shadow-sm flex flex-col justify-between gap-4 ${
                    v.isVisitorActive
                      ? "bg-white border-emerald-300/80 hover:border-emerald-500"
                      : "bg-[#FAFAFA] border-zinc-200 opacity-80 hover:opacity-100"
                  }`}
                >
                  <div className="space-y-3">
                    {/* Linha superior: Nome e Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-base font-black text-[#252525] flex items-center gap-1.5">
                          <span>{v.name}</span>
                        </h4>
                        <span className="block text-xs font-semibold text-[#252525]/60 mt-0.5">
                          {v.phone ? formatPhoneBR(v.phone) : v.email || "Sem contato cadastrado"}
                        </span>
                      </div>

                      {/* Status de Visitador */}
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shrink-0 ${
                          v.isVisitorActive
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-zinc-200 text-zinc-700 border border-zinc-300"
                        }`}
                      >
                        {v.isVisitorActive ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                            Visitador Ativo
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 rounded-full bg-zinc-400" />
                            Inativo
                          </>
                        )}
                      </span>
                    </div>

                    {/* Badges de Papéis Eclesiásticos */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {v.isPastor && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#252525] text-[#DCDACF] text-[10px] font-black uppercase tracking-wider">
                          <HeartHandshake className="w-3 h-3 text-[#CB4B3B]" />
                          Pastor(a)
                        </span>
                      )}
                      {v.isLeader && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider">
                          <Sparkles className="w-3 h-3 text-white" />
                          Líder
                        </span>
                      )}
                      {v.isAdmin && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#CB4B3B] text-white text-[10px] font-black uppercase tracking-wider">
                          <Crown className="w-3 h-3 text-white" />
                          Admin Total
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ação de Ativar / Desativar */}
                  <div className="pt-3 border-t border-[#252525]/10 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-[#252525]/70 font-medium">
                      {v.isVisitorActive
                        ? "Habilitado na lista de visitadores"
                        : "Não aparecerá na seleção de visitadores"}
                    </span>

                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleToggleVisitorActive(v)}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50 shrink-0 ${
                        v.isVisitorActive
                          ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white"
                      }`}
                    >
                      {isUpdating ? (
                        <span>Atualizando...</span>
                      ) : v.isVisitorActive ? (
                        <>
                          <UserX className="w-3.5 h-3.5 text-zinc-600" />
                          <span>Desativar Visitador</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-3.5 h-3.5 text-white" />
                          <span>Ativar como Visitador</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
