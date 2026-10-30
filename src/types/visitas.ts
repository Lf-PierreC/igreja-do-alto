import {
  ATTENDANCE_TIME,
  CHURCH_RELATIONSHIP,
  FOLLOW_UP_NEEDS,
  INTEGRATION_LEVELS,
  LEADERSHIP_COMM,
  MARITAL_STATUS,
  NEW_VISIT_NEEDED,
  NEW_VISIT_TIMEFRAMES,
  NEXT_STEPS,
  REQUESTER_TYPES,
  REQUEST_REASONS,
  SERVICE_ATTENDANCE,
  SHIFTS,
  SITUATION_LEVELS,
  VISIT_HAPPENED,
  VISIT_REASONS,
  WEEK_DAYS,
  YES_NO,
  YES_NO_UNKNOWN,
} from "@/data/formOptions";

export type MaritalStatus = (typeof MARITAL_STATUS)[number];
export type ChurchRelationship = (typeof CHURCH_RELATIONSHIP)[number];
export type AttendanceTime = (typeof ATTENDANCE_TIME)[number];
export type YesNo = (typeof YES_NO)[number];
export type RequesterType = (typeof REQUESTER_TYPES)[number];
export type RequestReason = (typeof REQUEST_REASONS)[number];
export type WeekDay = (typeof WEEK_DAYS)[number];
export type Shift = (typeof SHIFTS)[number];

export type VisitHappened = (typeof VISIT_HAPPENED)[number];
export type VisitReason = (typeof VISIT_REASONS)[number];
export type SituationLevel = (typeof SITUATION_LEVELS)[number];
export type ServiceAttendance = (typeof SERVICE_ATTENDANCE)[number];
export type IntegrationLevel = (typeof INTEGRATION_LEVELS)[number];
export type YesNoUnknown = (typeof YES_NO_UNKNOWN)[number];
export type FollowUpNeed = (typeof FOLLOW_UP_NEEDS)[number];
export type LeadershipComm = (typeof LEADERSHIP_COMM)[number];
export type NextStep = (typeof NEXT_STEPS)[number];
export type NewVisitNeeded = (typeof NEW_VISIT_NEEDED)[number];
export type NewVisitTimeframe = (typeof NEW_VISIT_TIMEFRAMES)[number];

export type RequestStatus = "pendente" | "agendada" | "realizada" | "cancelada";

export interface Address {
  cep?: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
}

export interface FamilyDependent {
  id: string;
  fullName: string;
  birthDate: string; // YYYY-MM-DD
  gender?: "M" | "F";
  relationship: "Filho(a)" | "Enteado(a)" | "Neto(a)" | "Outro";
  notes?: string; // ex: restrições alimentares, ministério infantil
  cpf?: string; // opcional para menores de 16 anos
  registeredAt: string;
}

export interface Family {
  id: string;
  familyName: string;
  titularMemberId: string;
  spouseMemberId?: string;
  address?: Address;
  createdAt: string;
}

export interface MemberSession {
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone: string;
  familyId?: string;
}

/** Cadastro da pessoa/família (alimentado pela solicitação, portal do membro e pelos relatórios). */
export interface Member {
  id: string;
  name: string;
  phone: string;
  birthDate?: string; // YYYY-MM-DD
  maritalStatus?: MaritalStatus;
  spouseName?: string;
  householdSize?: number;
  familyInChurch?: string;
  relationship: ChurchRelationship;
  attendanceTime?: AttendanceTime;
  participatesInActivity?: boolean;
  activityName?: string;
  address: Address;
  registeredAt: string; // YYYY-MM-DD
  lastVisitDate: string | null; // apenas visitas que aconteceram
  lastVisitedBy?: string;
  /** Situação atual (🟢🟡🟠🔴) — vem do último relatório ou de ajuste manual. */
  situation: SituationLevel;
  situationNote?: string;
  /** Necessidades de acompanhamento já identificadas nas visitas. */
  needs: FollowUpNeed[];
  /** Retorno previsto, calculado a partir de "Quando aproximadamente?". */
  nextVisitDue: string | null;
  nextStep?: NextStep;
  followUpResponsible?: string;
  /** Última comunicação à liderança pastoral ("Sim" ou "Urgente"). */
  leadershipAlert?: Exclude<LeadershipComm, "Não"> | null;
  notes?: string;

  // Campos específicos do Portal do Membro & Núcleo Familiar
  cpf?: string; // CPF único (11 dígitos numéricos limpos)
  email?: string; // E-mail único de login do membro
  password?: string; // Senha para o portal do membro
  isOfficialMember?: boolean; // true = cadastrado no portal oficial; false = registro avulso
  familyId?: string; // ID da família compartilhada com cônjuge e filhos
  familyRole?: "titular" | "conjuge";
  spouseMemberId?: string; // ID do membro com quem tem vínculo de cônjuge
  dependents?: FamilyDependent[]; // Filhos e dependentes menores de 16 anos
}

/** 1. Formulário — Solicitação de Visita Pastoral */
export interface VisitRequest {
  id: string;
  memberId: string;
  memberName: string;
  phone: string;
  relationship: ChurchRelationship;
  requesterType: RequesterType;
  reasons: RequestReason[];
  address: Address;
  preferredDays: WeekDay[];
  preferredShifts: Shift[];
  observations?: string;
  status: RequestStatus;
  assignedPastor?: string;
  scheduledDate?: string;
  createdAt: string;
}

/** 2. Formulário — Relatório de Visita Pastoral */
export interface VisitReport {
  id: string;
  requestId?: string;
  memberId: string;
  memberName: string;
  neighborhood: string;

  // Dados da visita
  visitDate: string;
  approxTime?: string;
  visitors: string[];
  othersPresent?: string;
  visitHappened: VisitHappened;

  // Características da visita
  mainReason?: VisitReason;
  situation?: SituationLevel;

  // Vida na igreja
  serviceAttendance?: ServiceAttendance;
  integration?: IntegrationLevel;
  inCasaDoAlto?: YesNoUnknown;
  inMinistry?: YesNoUnknown;

  // Registro pastoral
  summary?: string;
  photoUrl?: string;
  hasPrayerRequest?: boolean;
  prayerRequest?: string;
  needsFollowUp?: boolean;
  followUpNeeds: FollowUpNeed[];
  leadershipCommunication?: LeadershipComm;
  leadershipNote?: string;

  // Próximos passos
  nextStep?: NextStep;
  needsNewVisit?: NewVisitNeeded;
  newVisitTimeframe?: NewVisitTimeframe;
  nextVisitDue?: string | null;
  followUpResponsible?: string;
  internalNotes?: string;

  createdAt: string;
}

export type UserAccessRole = "admin" | "pastor";

export interface PastorLeader {
  id: string;
  name: string;
  role: string;
  phone: string;
  regionFocus: string;
  username?: string;
  password?: string;
  accessRole?: UserAccessRole;
}

export interface DatabaseSchema {
  schemaVersion: number;
  pastors: PastorLeader[];
  members: Member[];
  requests: VisitRequest[];
  reports: VisitReport[];
}
