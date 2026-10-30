"use client";

import React, { useState } from "react";
import {
  DatabaseSchema,
  PastorLeader,
  UserAccessRole,
} from "@/types/visitas";
import { deriveDefaultUsername } from "@/lib/supabase";
import {
  ShieldCheck,
  Users,
  KeyRound,
  Eye,
  EyeOff,
  Trash2,
  Pencil,
  Check,
  X,
  Copy,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface EquipeAcessosTabProps {
  db: DatabaseSchema;
  onDbUpdated: (updatedDb: DatabaseSchema) => void;
}

export function EquipeAcessosTab({
  db,
  onDbUpdated,
}: EquipeAcessosTabProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAccessRole, setEditAccessRole] = useState<UserAccessRole>("pastor");
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyText = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const startEditing = (p: PastorLeader) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditUsername(p.username || deriveDefaultUsername(p.name));
    setEditPassword(p.password || "igrejadoalto");
    setEditPhone(p.phone || "");
    setEditAccessRole(p.accessRole === "admin" ? "admin" : "pastor");
  };

  const handleSaveEdit = async (id: string) => {
    setIsSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/dados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_PASTOR",
          payload: {
            id,
            name: editName.trim(),
            username: editUsername.trim().toLowerCase(),
            password: editPassword.trim() || "igrejadoalto",
            phone: editPhone.trim(),
            accessRole: editAccessRole,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.db) {
        onDbUpdated(data.db);
        setEditingId(null);
        setFeedback({
          type: "success",
          text: `Acesso de "${editName.trim()}" atualizado com sucesso!`,
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAccessRole = async (p: PastorLeader) => {
    const nextRole: UserAccessRole =
      p.accessRole === "admin" ? "pastor" : "admin";
    setIsSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/dados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_PASTOR",
          payload: {
            id: p.id,
            accessRole: nextRole,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.db) {
        onDbUpdated(data.db);
        setFeedback({
          type: "success",
          text: `Permissão de "${p.name}" alterada para ${
            nextRole === "admin" ? "Administrador (Acesso Total)" : "Pastor (Acesso Restrito)"
          }.`,
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePastor = async (p: PastorLeader) => {
    if (
      typeof window !== "undefined" &&
      !window.confirm(`Deseja realmente remover o cadastro de "${p.name}"?`)
    ) {
      return;
    }
    setIsSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/dados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DELETE_PASTOR",
          payload: { id: p.id },
        }),
      });
      const data = await res.json();
      if (res.ok && data.db) {
        onDbUpdated(data.db);
        setFeedback({
          type: "success",
          text: `Cadastro de "${p.name}" removido.`,
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho e Atalho do Link de Membros */}
      <div className="rounded-3xl bg-[#252525] text-[#DCDACF] p-6 sm:p-8 border-b-4 border-[#CB4B3B] shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[#CB4B3B]">
            <ShieldCheck className="w-4 h-4" />
            Gestão de Equipe Pastoral & Permissões
          </span>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
            Cadastro de Pastores e Administradores
          </h2>
          <p className="text-xs sm:text-sm text-[#DCDACF]/80 leading-relaxed">
            Crie logins individuais para cada pastor ou casal pastoral e escolha
            quem terá acesso restrito de <strong>Pastor</strong> ou acesso
            completo de <strong>Administrador</strong>.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            const url =
              typeof window !== "undefined"
                ? `${window.location.origin}/solicitar-visita`
                : "/solicitar-visita";
            copyText(url, "member-link");
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#CB4B3B] hover:bg-[#A93829] text-[#DCDACF] text-xs font-black uppercase tracking-wider transition-colors shrink-0 shadow"
        >
          {copiedKey === "member-link" ? (
            <>
              <Check className="w-4 h-4" />
              Link de Membros Copiado!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copiar Link Público de Membros
            </>
          )}
        </button>
      </div>

      {feedback && (
        <div
          role="status"
          className={`p-4 rounded-2xl border-2 flex items-center gap-3 text-xs sm:text-sm font-bold ${
            feedback.type === "success"
              ? "bg-emerald-950 text-[#DCDACF] border-emerald-600"
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

      {/* Aviso informativo: Cadastro centralizado no Portal de Membros */}
      <div className="rounded-3xl bg-[#F4F3EE] p-6 sm:p-8 shadow-md border-2 border-[#252525]/15 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#252525] text-[#DCDACF] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-[#CB4B3B]" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-[#252525]">
              Gestão Integrada de Pastores
            </h3>
            <p className="text-xs font-semibold text-[#252525]/70">
              Novos pastores são nomeados diretamente na plataforma de Membros (membros.igrejadoalto.com).
            </p>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-[#252525]/85 leading-relaxed">
          Para definir um novo pastor ou cadastrar novos membros na igreja, acesse a aba <strong>Todos os Membros</strong> ou <strong>Gestão de Pastores</strong> no Portal do Membro. Na lista abaixo você pode promover pastores cadastrados a <strong>Admin Total</strong> ou alternar o nível de permissões no painel.
        </p>
      </div>

      {/* Lista de Pastores e Administradores */}
      <div className="rounded-3xl bg-[#F4F3EE] p-6 sm:p-8 shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b-2 border-[#DCDACF]">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-[#CB4B3B]" />
            <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-[#252525]">
              Acessos Cadastrados ({db.pastors.length})
            </h3>
          </div>
          <span className="text-xs font-bold text-[#252525]/70">
            Login Geral Admin também ativo: usuário <code>admin</code>
          </span>
        </div>

        <div className="space-y-3">
          {db.pastors.map((p) => {
            const isEditing = editingId === p.id;
            const userLogin = p.username || deriveDefaultUsername(p.name);
            const userPass = p.password || "igrejadoalto";
            const isAdmin = p.accessRole === "admin";
            const showPass = Boolean(visiblePasswords[p.id]);

            return (
              <div
                key={p.id}
                className="rounded-2xl bg-white border-2 border-[#252525]/15 p-4 sm:p-5 transition-all"
              >
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-black uppercase text-[#252525]/70 mb-1">
                          Nome
                        </label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full rounded-xl border-2 border-[#252525]/25 px-3 py-2 text-xs sm:text-sm font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-black uppercase text-[#252525]/70 mb-1">
                          Usuário (Login)
                        </label>
                        <input
                          type="text"
                          value={editUsername}
                          onChange={(e) =>
                            setEditUsername(
                              e.target.value.toLowerCase().replace(/\s+/g, "")
                            )
                          }
                          className="w-full rounded-xl border-2 border-[#252525]/25 px-3 py-2 text-xs sm:text-sm font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-black uppercase text-[#252525]/70 mb-1">
                          Senha
                        </label>
                        <input
                          type="text"
                          value={editPassword}
                          onChange={(e) => setEditPassword(e.target.value)}
                          className="w-full rounded-xl border-2 border-[#252525]/25 px-3 py-2 text-xs sm:text-sm font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-black uppercase text-[#252525]/70 mb-1">
                          Nível de Acesso
                        </label>
                        <select
                          value={editAccessRole}
                          onChange={(e) =>
                            setEditAccessRole(e.target.value as UserAccessRole)
                          }
                          className="w-full rounded-xl border-2 border-[#252525]/25 bg-white px-3 py-2 text-xs sm:text-sm font-bold"
                        >
                          <option value="pastor">🤝 Pastor (Acesso Restrito)</option>
                          <option value="admin">👑 Admin (Acesso Total)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-[#DCDACF] text-[#252525] text-xs font-extrabold uppercase"
                      >
                        <X className="w-3.5 h-3.5" />
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleSaveEdit(p.id)}
                        className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-[#CB4B3B] text-[#DCDACF] text-xs font-black uppercase"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Salvar Alterações
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base sm:text-lg font-black text-[#252525]">
                          {p.name}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                            isAdmin
                              ? "bg-[#CB4B3B] text-[#DCDACF]"
                              : "bg-[#252525] text-[#DCDACF]"
                          }`}
                        >
                          {isAdmin ? "👑 Admin (Acesso Total)" : "🤝 Pastor"}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-[#252525]/80">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F4F3EE] border border-[#252525]/15">
                          <KeyRound className="w-3.5 h-3.5 text-[#CB4B3B]" />
                          Usuário: <strong className="text-[#252525]">{userLogin}</strong>
                        </span>

                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F4F3EE] border border-[#252525]/15">
                          Senha:{" "}
                          <strong className="text-[#252525]">
                            {showPass ? userPass : "••••••••"}
                          </strong>
                          <button
                            type="button"
                            onClick={() =>
                              setVisiblePasswords((prev) => ({
                                ...prev,
                                [p.id]: !prev[p.id],
                              }))
                            }
                            className="text-[#252525]/60 hover:text-[#CB4B3B] ml-1"
                            title={showPass ? "Ocultar senha" : "Ver senha"}
                          >
                            {showPass ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleToggleAccessRole(p)}
                        className={`px-3 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider border transition-colors ${
                          isAdmin
                            ? "bg-white text-[#252525] border-[#252525]/25 hover:bg-[#DCDACF]"
                            : "bg-[#CB4B3B]/15 text-[#CB4B3B] border-[#CB4B3B]/30 hover:bg-[#CB4B3B] hover:text-[#DCDACF]"
                        }`}
                      >
                        {isAdmin ? "Mudar p/ Pastor" : "Tornar Admin Total"}
                      </button>

                      <button
                        type="button"
                        onClick={() => startEditing(p)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#DCDACF] hover:bg-[#252525] hover:text-[#DCDACF] text-[#252525] text-xs font-extrabold uppercase tracking-wider transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Editar Login/Senha
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeletePastor(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-[#F9EAE8] hover:bg-[#CB4B3B] text-[#CB4B3B] hover:text-white text-xs font-extrabold uppercase transition-colors"
                        title="Remover cadastro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
