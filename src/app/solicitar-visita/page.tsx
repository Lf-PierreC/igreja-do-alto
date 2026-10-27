"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BrandLogo, MountainIcon } from "@/components/BrandLogo";
import {
  ATTENDANCE_TIME,
  CHURCH_RELATIONSHIP,
  MARITAL_STATUS,
  REQUESTER_TYPES,
  REQUEST_REASONS,
  SHIFTS,
  WEEK_DAYS,
  YES_NO,
} from "@/data/formOptions";
import {
  AttendanceTime,
  ChurchRelationship,
  MaritalStatus,
  RequesterType,
  RequestReason,
  Shift,
  WeekDay,
  YesNo,
} from "@/types/visitas";
import {
  HeartHandshake,
  CheckCircle2,
  ArrowLeft,
  Calendar,
  Clock,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  MapPin,
  Lock,
} from "lucide-react";

export default function SolicitarVisitaPage() {
  // 1. Identificação
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [maritalStatus, setMaritalStatus] =
    useState<MaritalStatus>();
  const [spouseName, setSpouseName] = useState("");
  const [householdSize, setHouseholdSize] = useState("");
  const [familyInChurch, setFamilyInChurch] = useState("");

  // 2. Relacionamento com a igreja
  const [relationship, setRelationship] =
    useState<ChurchRelationship>();
  const [attendanceTime, setAttendanceTime] =
    useState<AttendanceTime>();
  const [participates, setParticipates] = useState<YesNo>();
  const [activityName, setActivityName] = useState("");

  // 3. Sobre a visita
  const [requesterType, setRequesterType] =
    useState<RequesterType>();
  const [reasons, setReasons] = useState<RequestReason[]>([
  ]);
  const [otherReasonText, setOtherReasonText] = useState("");

  // 4. Local e disponibilidade
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [preferredDays, setPreferredDays] = useState<WeekDay[]>([  ]);
  const [preferredShifts, setPreferredShifts] = useState<Shift[]>([
  ]);
  const [observations, setObservations] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedProtocol, setSubmittedProtocol] = useState<string | null>(
    null
  );
  const [formError, setFormError] = useState<string | null>(null);

  const toggleReason = (item: RequestReason) => {
    setReasons((prev) =>
      prev.includes(item) ? prev.filter((r) => r !== item) : [...prev, item]
    );
  };

  const toggleDay = (day: WeekDay) => {
    setPreferredDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const toggleShift = (shift: Shift) => {
    setPreferredShifts((prev) =>
      prev.includes(shift) ? prev.filter((s) => s !== shift) : [...prev, shift]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    if (preferredDays.length === 0 || preferredShifts.length === 0) {
      setFormError(
        "Selecione pelo menos um dia da semana e um período em 'Local e disponibilidade'."
      );
      return;
    }

    const combinedObservations = [
      reasons.includes("Outro") && otherReasonText.trim()
        ? `Motivo (Outro): ${otherReasonText.trim()}`
        : "",
      observations.trim(),
    ]
      .filter(Boolean)
      .join(" | ");

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/dados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_VISIT_REQUEST",
          payload: {
            name,
            phone,
            birthDate: birthDate || undefined,
            maritalStatus,
            spouseName: spouseName || undefined,
            householdSize: householdSize ? Number(householdSize) : undefined,
            familyInChurch: familyInChurch || undefined,
            relationship,
            attendanceTime,
            participatesInActivity: participates === "Sim",
            activityName:
              participates === "Sim" && activityName.trim()
                ? activityName.trim()
                : undefined,
            requesterType,
            reasons:
              reasons.length > 0 ? reasons : ["Visita pastoral / comunhão"],
            address: {
              street,
              number,
              complement: complement || undefined,
              neighborhood,
              city,
            },
            preferredDays,
            preferredShifts,
            observations: combinedObservations || undefined,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error || "Não foi possível enviar sua solicitação."
        );
      }

      setSubmittedProtocol(
        data.request?.id || `ALTO-${Date.now().toString().slice(-4)}`
      );
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Ocorreu um erro ao enviar seu formulário."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#DCDACF] text-[#252525]">
      {/* Header */}
      <header className="bg-[#252525] text-[#DCDACF] border-b-4 border-[#CB4B3B]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <BrandLogo variant="on-dark2" size="sm" showTagline />
        </div>
      </header>

      {/* Cabeçalho com Título e Texto de Abertura exatos */}
      <div className="bg-[#CB4B3B] text-[#DCDACF] py-8 sm:py-10 border-b border-[#252525]/15">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#252525] text-[#DCDACF] text-[11px] font-extrabold uppercase tracking-widest mb-3">
            <HeartHandshake className="w-3.5 h-3.5 text-[#CB4B3B]" />
            Solicitação de Visita Pastoral
          </div>
          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight leading-tight">
            Visita Pastoral | Igreja do Alto
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#DCDACF] font-medium leading-relaxed">
            Queremos estar mais perto de você e da sua família. Este formulário
            nos ajudará a organizar nossas visitas pastorais, proporcionando um
            tempo de comunhão, cuidado e oração.
          </p>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {submittedProtocol ? (
          <div
            role="status"
            aria-live="polite"
            className="rounded-3xl bg-[#F4F3EE] border-2 border-[#252525] p-8 sm:p-10 shadow-xl text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#CB4B3B] text-[#DCDACF] flex items-center justify-center mx-auto mb-5 shadow-md">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <span className="inline-block px-3.5 py-1 rounded-full bg-[#252525] text-[#DCDACF] text-xs font-extrabold uppercase tracking-widest mb-3">
              Solicitação Registrada • Protocolo #
              {submittedProtocol.slice(-5).toUpperCase()}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#252525]">
              Solicitação enviada com sucesso!
            </h2>
            <p className="mt-3 text-base text-[#252525]/85 max-w-xl mx-auto leading-relaxed">
              Graça e paz, <strong>{name}</strong>! Nossa equipe pastoral já
              recebeu sua solicitação e entrará em contato pelo WhatsApp{" "}
              <strong>{phone}</strong> para confirmar a visita.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => {
                  setSubmittedProtocol(null);
                  setName("");
                  setPhone("");
                  setObservations("");
                  setOtherReasonText("");
                }}
                className="px-6 py-3.5 rounded-xl bg-[#CB4B3B] hover:bg-[#A93829] text-[#DCDACF] font-black text-xs uppercase tracking-wider shadow transition-colors"
              >
                Enviar nova solicitação
              </button>
            </div>
          </div>
        ) : (
          <form
            action="/api/dados"
            method="POST"
            onSubmit={handleSubmit}
            className="rounded-3xl bg-[#F4F3EE] border-2 border-[#252525] shadow-xl overflow-hidden"
          >
            {/* Topo do Cartão */}
            <div className="bg-[#252525] text-[#DCDACF] px-6 sm:px-8 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">
                  Visita Pastoral | Igreja do Alto
                </h2>
                <p className="text-xs text-[#DCDACF]/75 mt-0.5">
                  Campos marcados com * são obrigatórios
                </p>
              </div>
              <MountainIcon size={38} />
            </div>

            <div className="p-6 sm:p-8 space-y-10">
              {formError && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="p-4 rounded-2xl bg-[#F9EAE8] border-2 border-[#CB4B3B] text-[#A93829] flex items-start gap-3 text-sm font-semibold"
                >
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* =========================================================
                  SEÇÃO 1: IDENTIFICAÇÃO
                 ========================================================= */}
              <fieldset className="space-y-6">
                <legend className="text-base sm:text-lg font-black uppercase tracking-tight text-[#252525] flex items-center gap-2.5 pb-2.5 border-b-2 border-[#DCDACF] w-full">
                  <span className="w-7 h-7 rounded-lg bg-[#CB4B3B] text-[#DCDACF] text-xs font-black inline-flex items-center justify-center">
                    1
                  </span>
                  Identificação
                </legend>

                {/* Nome completo * */}
                <div>
                  <label
                    htmlFor="member-name"
                    className="block text-sm font-extrabold uppercase tracking-wide text-[#252525] mb-1.5"
                  >
                    Nome completo *
                  </label>
                  <input
                    type="text"
                    id="member-name"
                    name="name"
                    required
                    minLength={3}
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Resposta curta — digite o nome completo"
                    className="w-full rounded-xl border-2 border-[#252525]/25 bg-white px-4 py-3 text-[#252525] font-medium"
                  />
                  <div className="field-error-msg">
                    <span>⚠️</span> Informe o nome completo.
                  </div>
                </div>

                {/* Telefone / WhatsApp * & Data de nascimento */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="member-phone"
                      className="block text-sm font-extrabold uppercase tracking-wide text-[#252525] mb-1.5"
                    >
                      Telefone / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      id="member-phone"
                      name="phone"
                      required
                      minLength={8}
                      autoComplete="tel"
                      inputMode="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="w-full rounded-xl border-2 border-[#252525]/25 bg-white px-4 py-3 text-[#252525] font-medium"
                    />
                    <div className="field-error-msg">
                      <span>⚠️</span> Informe um telefone/WhatsApp válido.
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="birth-date"
                      className="block text-sm font-extrabold uppercase tracking-wide text-[#252525] mb-1.5"
                    >
                      Data de nascimento
                    </label>
                    <input
                      type="date"
                      id="birth-date"
                      name="birthDate"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full rounded-xl border-2 border-[#252525]/25 bg-white px-4 py-3 text-[#252525] font-medium"
                    />
                  </div>
                </div>

                {/* Estado civil */}
                <div>
                  <span className="block text-sm font-extrabold uppercase tracking-wide text-[#252525] mb-2">
                    Estado civil
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {MARITAL_STATUS.map((status) => (
                      <label
                        key={status}
                        htmlFor={`marital-${status}`}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 cursor-pointer text-xs sm:text-sm min-h-[48px] transition-colors ${
                          maritalStatus === status
                            ? "border-[#CB4B3B] bg-[#CB4B3B]/10 font-bold text-[#252525]"
                            : "border-[#252525]/20 bg-white hover:border-[#252525]/40"
                        }`}
                      >
                        <input
                          type="radio"
                          id={`marital-${status}`}
                          name="maritalStatus"
                          value={status}
                          checked={maritalStatus === status}
                          onChange={() => setMaritalStatus(status)}
                          className="w-4 h-4"
                        />
                        <span>{status}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Nome do cônjuge & Quantas pessoas moram na residência? */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="spouse-name"
                      className="block text-sm font-extrabold uppercase tracking-wide text-[#252525] mb-1.5"
                    >
                      Nome do cônjuge
                    </label>
                    <input
                      type="text"
                      id="spouse-name"
                      name="spouseName"
                      value={spouseName}
                      onChange={(e) => setSpouseName(e.target.value)}
                      placeholder="Resposta curta"
                      className="w-full rounded-xl border-2 border-[#252525]/25 bg-white px-4 py-3 text-[#252525] font-medium"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="household-size"
                      className="block text-sm font-extrabold uppercase tracking-wide text-[#252525] mb-1.5"
                    >
                      Quantas pessoas moram na residência?
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      inputMode="numeric"
                      id="household-size"
                      name="householdSize"
                      value={householdSize}
                      onChange={(e) => setHouseholdSize(e.target.value)}
                      placeholder="Número (ex: 3)"
                      className="w-full rounded-xl border-2 border-[#252525]/25 bg-white px-4 py-3 text-[#252525] font-medium"
                    />
                  </div>
                </div>

                {/* Nome das pessoas da família que participam da Igreja do Alto */}
                <div>
                  <label
                    htmlFor="family-in-church"
                    className="block text-sm font-extrabold uppercase tracking-wide text-[#252525] mb-1"
                  >
                    Nome das pessoas da família que participam da Igreja do Alto
                  </label>
                  <span
                    id="family-in-church-hint"
                    className="block text-xs text-[#252525]/70 mb-1.5"
                  >
                    Opcional — resposta longa
                  </span>
                  <textarea
                    id="family-in-church"
                    name="familyInChurch"
                    rows={2}
                    aria-describedby="family-in-church-hint"
                    value={familyInChurch}
                    onChange={(e) => setFamilyInChurch(e.target.value)}
                    placeholder="Informe o nome dos familiares que participam da Igreja do Alto..."
                    className="w-full rounded-xl border-2 border-[#252525]/25 bg-white p-3.5 text-[#252525] font-medium"
                  />
                </div>
              </fieldset>

              {/* =========================================================
                  SEÇÃO 2: RELACIONAMENTO COM A IGREJA
                 ========================================================= */}
              <fieldset className="space-y-6">
                <legend className="text-base sm:text-lg font-black uppercase tracking-tight text-[#252525] flex items-center gap-2.5 pb-2.5 border-b-2 border-[#DCDACF] w-full">
                  <span className="w-7 h-7 rounded-lg bg-[#CB4B3B] text-[#DCDACF] text-xs font-black inline-flex items-center justify-center">
                    2
                  </span>
                  Relacionamento com a igreja
                </legend>

                {/* Qual é sua relação atual com a Igreja do Alto? * */}
                <div>
                  <span className="block text-sm font-extrabold uppercase tracking-wide text-[#252525] mb-2">
                    Qual é sua relação atual com a Igreja do Alto? *
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {CHURCH_RELATIONSHIP.map((rel) => (
                      <label
                        key={rel}
                        htmlFor={`rel-${rel}`}
                        className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl border-2 cursor-pointer text-xs sm:text-sm min-h-[48px] transition-colors ${
                          relationship === rel
                            ? "border-[#CB4B3B] bg-[#CB4B3B]/10 font-bold text-[#252525]"
                            : "border-[#252525]/20 bg-white hover:border-[#252525]/40"
                        }`}
                      >
                        <input
                          type="radio"
                          id={`rel-${rel}`}
                          name="relationship"
                          value={rel}
                          checked={relationship === rel}
                          onChange={() => setRelationship(rel)}
                          className="w-4 h-4"
                        />
                        <span>{rel}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Há quanto tempo frequenta a Igreja do Alto? */}
                <div>
                  <span className="block text-sm font-extrabold uppercase tracking-wide text-[#252525] mb-2">
                    Há quanto tempo frequenta a Igreja do Alto?
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {ATTENDANCE_TIME.map((timeOpt) => (
                      <label
                        key={timeOpt}
                        htmlFor={`att-${timeOpt}`}
                        className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border-2 cursor-pointer text-xs sm:text-sm min-h-[48px] transition-colors ${
                          attendanceTime === timeOpt
                            ? "border-[#252525] bg-[#252525] text-[#DCDACF] font-bold"
                            : "border-[#252525]/20 bg-white hover:border-[#252525]/40"
                        }`}
                      >
                        <input
                          type="radio"
                          id={`att-${timeOpt}`}
                          name="attendanceTime"
                          value={timeOpt}
                          checked={attendanceTime === timeOpt}
                          onChange={() => setAttendanceTime(timeOpt)}
                          className="w-4 h-4"
                        />
                        <span>{timeOpt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Participa de alguma Casa do Alto, ministério ou atividade da igreja? */}
                <div className="space-y-3">
                  <span className="block text-sm font-extrabold uppercase tracking-wide text-[#252525]">
                    Participa de alguma Casa do Alto, ministério ou atividade da
                    igreja?
                  </span>
                  <div className="grid grid-cols-2 gap-3 max-w-xs">
                    {YES_NO.map((opt) => (
                      <label
                        key={opt}
                        htmlFor={`part-${opt}`}
                        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer text-sm min-h-[48px] transition-colors ${
                          participates === opt
                            ? "border-[#252525] bg-[#252525] text-[#DCDACF] font-bold"
                            : "border-[#252525]/20 bg-white hover:border-[#252525]/40"
                        }`}
                      >
                        <input
                          type="radio"
                          id={`part-${opt}`}
                          name="participates"
                          value={opt}
                          checked={participates === opt}
                          onChange={() => setParticipates(opt)}
                          className="w-4 h-4"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>

                  {/* Se sim: Qual? */}
                  <div className="pt-1">
                    <label
                      htmlFor="activity-name"
                      className={`block text-sm font-extrabold uppercase tracking-wide mb-1.5 ${
                        participates === "Sim"
                          ? "text-[#CB4B3B]"
                          : "text-[#252525]/75"
                      }`}
                    >
                      Se sim: Qual?
                    </label>
                    <input
                      type="text"
                      id="activity-name"
                      name="activityName"
                      value={activityName}
                      onChange={(e) => {
                        setActivityName(e.target.value);
                        if (e.target.value.trim() && participates !== "Sim") {
                          setParticipates("Sim");
                        }
                      }}
                      placeholder="Informe qual Casa do Alto, ministério ou atividade participa"
                      className={`w-full rounded-xl border-2 bg-white px-4 py-3 text-[#252525] font-medium transition-colors ${
                        participates === "Sim"
                          ? "border-[#CB4B3B]"
                          : "border-[#252525]/25"
                      }`}
                    />
                  </div>
                </div>
              </fieldset>

              {/* =========================================================
                  SEÇÃO 3: SOBRE A VISITA
                 ========================================================= */}
              <fieldset className="space-y-6">
                <legend className="text-base sm:text-lg font-black uppercase tracking-tight text-[#252525] flex items-center gap-2.5 pb-2.5 border-b-2 border-[#DCDACF] w-full">
                  <span className="w-7 h-7 rounded-lg bg-[#CB4B3B] text-[#DCDACF] text-xs font-black inline-flex items-center justify-center">
                    3
                  </span>
                  Sobre a visita
                </legend>

                {/* Quem está solicitando esta visita? * */}
                <div>
                  <span className="block text-sm font-extrabold uppercase tracking-wide text-[#252525] mb-2">
                    Quem está solicitando esta visita? *
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {REQUESTER_TYPES.map((reqType) => (
                      <label
                        key={reqType}
                        htmlFor={`reqtype-${reqType}`}
                        className={`flex items-center gap-2.5 p-3.5 rounded-xl border-2 cursor-pointer text-xs sm:text-sm min-h-[48px] transition-colors ${
                          requesterType === reqType
                            ? "border-[#CB4B3B] bg-[#CB4B3B]/10 font-bold text-[#252525]"
                            : "border-[#252525]/20 bg-white hover:border-[#252525]/40"
                        }`}
                      >
                        <input
                          type="radio"
                          id={`reqtype-${reqType}`}
                          name="requesterType"
                          value={reqType}
                          checked={requesterType === reqType}
                          onChange={() => setRequesterType(reqType)}
                          className="w-4 h-4"
                        />
                        <span>{reqType}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Existe algum motivo específico para a visita? */}
                <div>
                  <span className="block text-sm font-extrabold uppercase tracking-wide text-[#252525] mb-1">
                    Existe algum motivo específico para a visita?
                  </span>
                  <span className="block text-xs text-[#252525]/70 mb-2.5">
                    Selecione um ou mais motivos, ou marque &ldquo;Prefiro
                    conversar pessoalmente&rdquo; se preferir tratar de assuntos
                    delicados presencialmente.
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {REQUEST_REASONS.map((reason) => {
                      const checked = reasons.includes(reason);
                      const isPersonal =
                        reason === "Prefiro conversar pessoalmente";
                      return (
                        <label
                          key={reason}
                          htmlFor={`reason-${reason}`}
                          className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border-2 cursor-pointer text-xs sm:text-sm min-h-[48px] transition-colors ${
                            checked
                              ? isPersonal
                                ? "border-[#CB4B3B] bg-[#CB4B3B] text-[#DCDACF] font-bold"
                                : "border-[#252525] bg-[#252525] text-[#DCDACF] font-bold"
                              : "border-[#252525]/20 bg-white hover:border-[#252525]/40"
                          }`}
                        >
                          <input
                            type="checkbox"
                            id={`reason-${reason}`}
                            name="reasons"
                            value={reason}
                            checked={checked}
                            onChange={() => toggleReason(reason)}
                            className="w-4 h-4"
                          />
                          <span className="flex items-center gap-1.5">
                            {isPersonal && <Lock className="w-3.5 h-3.5" />}
                            {reason}
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  {reasons.includes("Outro") && (
                    <div className="mt-3">
                      <label
                        htmlFor="other-reason"
                        className="block text-xs font-extrabold uppercase tracking-wide text-[#CB4B3B] mb-1"
                      >
                        Se marcou &ldquo;Outro&rdquo;, qual seria o motivo?
                        (Opcional)
                      </label>
                      <input
                        type="text"
                        id="other-reason"
                        value={otherReasonText}
                        onChange={(e) => setOtherReasonText(e.target.value)}
                        placeholder="Descreva brevemente o motivo..."
                        className="w-full rounded-xl border-2 border-[#CB4B3B] bg-white px-4 py-2.5 text-sm text-[#252525] font-medium"
                      />
                    </div>
                  )}
                </div>
              </fieldset>

              {/* =========================================================
                  SEÇÃO 4: LOCAL E DISPONIBILIDADE
                 ========================================================= */}
              <fieldset className="space-y-6">
                <legend className="text-base sm:text-lg font-black uppercase tracking-tight text-[#252525] flex items-center gap-2.5 pb-2.5 border-b-2 border-[#DCDACF] w-full">
                  <span className="w-7 h-7 rounded-lg bg-[#CB4B3B] text-[#DCDACF] text-xs font-black inline-flex items-center justify-center">
                    4
                  </span>
                  Local e disponibilidade
                </legend>

                {/* Endereço da visita * */}
                <div className="space-y-4 rounded-2xl bg-[#DCDACF]/35 p-4 sm:p-5 border border-[#252525]/15">
                  <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-[#252525]">
                    <MapPin className="w-4 h-4 text-[#CB4B3B]" />
                    <span>Endereço da visita *</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
                    <div className="sm:col-span-4">
                      <label
                        htmlFor="addr-street"
                        className="block text-xs font-extrabold uppercase tracking-wide text-[#252525] mb-1"
                      >
                        Rua *
                      </label>
                      <input
                        type="text"
                        id="addr-street"
                        name="street"
                        required
                        autoComplete="address-line1"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        placeholder="Nome da rua ou avenida"
                        className="w-full rounded-xl border-2 border-[#252525]/25 bg-white px-4 py-3 text-sm font-medium"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label
                        htmlFor="addr-number"
                        className="block text-xs font-extrabold uppercase tracking-wide text-[#252525] mb-1"
                      >
                        Número *
                      </label>
                      <input
                        type="text"
                        id="addr-number"
                        name="number"
                        required
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        placeholder="Ex: 120"
                        className="w-full rounded-xl border-2 border-[#252525]/25 bg-white px-4 py-3 text-sm font-medium"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label
                        htmlFor="addr-complement"
                        className="block text-xs font-extrabold uppercase tracking-wide text-[#252525] mb-1"
                      >
                        Complemento
                      </label>
                      <input
                        type="text"
                        id="addr-complement"
                        name="complement"
                        value={complement}
                        onChange={(e) => setComplement(e.target.value)}
                        placeholder="Apto, bloco, casa..."
                        className="w-full rounded-xl border-2 border-[#252525]/25 bg-white px-4 py-3 text-sm font-medium"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label
                        htmlFor="addr-neighborhood"
                        className="block text-xs font-extrabold uppercase tracking-wide text-[#252525] mb-1"
                      >
                        Bairro *
                      </label>
                      <input
                        type="text"
                        id="addr-neighborhood"
                        name="neighborhood"
                        required
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                        placeholder="Seu bairro"
                        className="w-full rounded-xl border-2 border-[#252525]/25 bg-white px-4 py-3 text-sm font-medium"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label
                        htmlFor="addr-city"
                        className="block text-xs font-extrabold uppercase tracking-wide text-[#252525] mb-1"
                      >
                        Cidade *
                      </label>
                      <input
                        type="text"
                        id="addr-city"
                        name="city"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Ex: São Paulo"
                        className="w-full rounded-xl border-2 border-[#252525]/25 bg-white px-4 py-3 text-sm font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Melhores dias para receber a visita */}
                <div>
                  <span className="block text-sm font-extrabold uppercase tracking-wide text-[#252525] mb-1 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#CB4B3B]" />
                    Melhores dias para receber a visita *
                  </span>
                  <span className="block text-xs text-[#252525]/70 mb-2">
                    Caixas de seleção com os dias da semana
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {WEEK_DAYS.map((day) => {
                      const checked = preferredDays.includes(day);
                      return (
                        <label
                          key={day}
                          htmlFor={`day-${day}`}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 cursor-pointer text-xs sm:text-sm min-h-[48px] transition-colors ${
                            checked
                              ? "border-[#CB4B3B] bg-[#CB4B3B]/10 font-bold text-[#252525]"
                              : "border-[#252525]/20 bg-white hover:border-[#252525]/40"
                          }`}
                        >
                          <input
                            type="checkbox"
                            id={`day-${day}`}
                            name="preferredDays"
                            value={day}
                            checked={checked}
                            onChange={() => toggleDay(day)}
                            className="w-4 h-4"
                          />
                          <span>{day}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Melhor período */}
                <div>
                  <span className="block text-sm font-extrabold uppercase tracking-wide text-[#252525] mb-2 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#CB4B3B]" />
                    Melhor período *
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {SHIFTS.map((shift) => {
                      const checked = preferredShifts.includes(shift);
                      return (
                        <label
                          key={shift}
                          htmlFor={`shift-${shift}`}
                          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 cursor-pointer text-xs sm:text-sm min-h-[48px] transition-colors ${
                            checked
                              ? "border-[#252525] bg-[#252525] text-[#DCDACF] font-bold"
                              : "border-[#252525]/20 bg-white hover:border-[#252525]/40"
                          }`}
                        >
                          <input
                            type="checkbox"
                            id={`shift-${shift}`}
                            name="preferredShifts"
                            value={shift}
                            checked={checked}
                            onChange={() => toggleShift(shift)}
                            className="w-4 h-4"
                          />
                          <span>{shift}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Alguma observação que gostaria de deixar para a equipe pastoral? */}
                <div>
                  <label
                    htmlFor="observations"
                    className="block text-sm font-extrabold uppercase tracking-wide text-[#252525] mb-1"
                  >
                    Alguma observação que gostaria de deixar para a equipe
                    pastoral?
                  </label>
                  <span
                    id="observations-hint"
                    className="block text-xs text-[#252525]/70 mb-1.5"
                  >
                    Resposta longa — opcional.
                  </span>
                  <textarea
                    id="observations"
                    name="observations"
                    rows={3}
                    aria-describedby="observations-hint"
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="Escreva aqui se desejar..."
                    className="w-full rounded-xl border-2 border-[#252525]/25 bg-white p-4 text-[#252525] font-medium"
                  />
                </div>
              </fieldset>

              <div className="pt-2 border-t-2 border-[#DCDACF] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-[#252525]/75 font-semibold">
                  <Sparkles className="w-4 h-4 text-[#CB4B3B] shrink-0" />
                  <span>
                    Informações confidenciais restritas à liderança pastoral da
                    Igreja do Alto.
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto min-h-[52px] px-8 py-4 rounded-xl bg-[#CB4B3B] hover:bg-[#A93829] disabled:opacity-60 text-[#DCDACF] font-black text-sm uppercase tracking-wider shadow-lg transition-all"
                >
                  {isSubmitting
                    ? "Enviando Solicitação..."
                    : "Enviar Solicitação de Visita"}
                </button>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
