// Типы отражают то, что реально возвращают ручки бэкенда (src/routes/*.ts). Не придумывать новые поля.

export type AttendanceStatus = 'present' | 'late' | 'excused' | 'absent';
export type LessonStatus = 'planned' | 'completed' | 'cancelled';
export type ShopKind = 'physical' | 'virtual' | 'privilege';
export type OrderStatus = 'pending' | 'issued' | 'cancelled';
export type FeedbackKind = 'highlight' | 'attention' | 'group_note';
export type LeadStatus = 'new' | 'contacted' | 'trial' | 'won' | 'lost';
export type RiskLevel = 'warning' | 'critical';
export type MascotStageCode = 'egg' | 'chick' | 'student' | 'engineer' | 'master';
export type EquipSlot = 'frame' | 'skin' | 'title' | 'theme';
export type CalendarEventKind = 'trial' | 'event';

export interface Mascot {
  level: number;
  xp: number;
  stage: number;
  stageCode: MascotStageCode;
  stageTitle: string;
  xpIntoLevel: number;
  xpForNextLevel: number;
  xpToNextLevel: number;
  progressPercent: number;
  isMax: boolean;
}

export interface Equipped {
  frame: string | null;
  skin: string | null;
  title: string | null;
  theme: string | null;
}

// ---------------------------------------------------------------- публичное
export interface PublicCourse {
  id: string;
  name: string;
  slug: string;
  age_min: number | null;
  age_max: number | null;
  description: string | null;
}

// -------------------------------------------------------------- студент
export interface StudentProfile {
  name: string;
  coins: number;
  mascot: Mascot;
  equipped: Equipped;
  group: { id: string; name: string; course_name: string; current_topic: string | null } | null;
  achievements: Achievement[];
  locked: Omit<Achievement, 'earned_at'>[];
  nextLesson: { id: string; scheduled_at: string; group_name: string } | null;
  pendingHomeworkCount: number;
}

export interface Achievement {
  code: string;
  title: string;
  description: string;
  tier: 'bronze' | 'silver' | 'gold';
  icon: string | null;
  earned_at?: string;
}

export interface CoinTransaction {
  id: string;
  coins: number;
  xp: number;
  reason_code: string;
  reason_text: string | null;
  created_at: string;
}

export interface RatingRow {
  position: number;
  full_name: string;
  month_xp: number;
  level: number;
  is_me: boolean;
}

export interface RatingResponse {
  group: string | null;
  season?: string;
  rows: RatingRow[];
}

export interface ShopItem {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  kind: ShopKind;
  price_coins: number;
  stock: number | null;
  affordable?: boolean;
  owned?: boolean;
}

export interface ShopResponse {
  balance: number | null;
  items: ShopItem[];
}

export interface BuyResponse {
  ok: true;
  order_id: string;
  status: OrderStatus;
  message: string;
}

export interface StudentOrder {
  id: string;
  status: OrderStatus;
  price_coins: number;
  created_at: string;
  issued_at: string | null;
  title: string;
  kind: ShopKind;
  image_url: string | null;
}

export interface InventoryItem {
  id: string;
  title: string;
  kind: ShopKind;
  image_url: string | null;
  acquired_at: string;
}

export interface StudentHomework {
  id: string;
  title: string;
  description: string | null;
  link: string | null;
  attachments: { name: string; url: string }[];
  deadline_at: string | null;
  created_at: string;
  topic: string | null;
  submission_id: string | null;
  status: 'submitted' | 'accepted' | 'excellent' | 'rework' | null;
  feedback: string | null;
  submitted_at: string | null;
}

export interface StudentScheduleItem {
  id: string;
  scheduled_at: string;
  status: LessonStatus;
  group_name: string;
  room: string | null;
  topic: string | null;
}

// -------------------------------------------------------------- преподаватель
export interface TeacherTodayLesson {
  id: string;
  scheduled_at: string;
  status: LessonStatus;
  duration_min: number;
  group_id: string;
  group_name: string;
  room: string | null;
  course_name: string;
  planned_topic: string | null;
  students_count: number;
  marked_count: number;
}

export interface TeacherOverdueLesson {
  id: string;
  scheduled_at: string;
  group_name: string;
}

export interface TeacherUpcomingLesson {
  id: string;
  scheduled_at: string;
  group_name: string;
  course_name: string;
}

export interface TeacherTodayResponse {
  today: TeacherTodayLesson[];
  overdue: TeacherOverdueLesson[];
  upcoming: TeacherUpcomingLesson[];
}

export interface RosterStudent {
  student_id: string;
  full_name: string;
  coins_balance: number;
  attendance_status: AttendanceStatus | null;
  manual_coins_given: number;
}

export interface LessonTopic {
  id: string;
  title: string;
  module_title: string;
  sort_order: number;
}

export interface LessonDetail {
  lesson: {
    id: string;
    group_id: string;
    group_name: string;
    scheduled_at: string;
    status: LessonStatus;
  };
  roster: RosterStudent[];
  topics: LessonTopic[];
  manual: { used: number; limit: number; presets: readonly number[] };
}

export interface TeacherGroup {
  id: string;
  name: string;
  room: string | null;
  capacity: number;
  course_name: string;
  current_topic: string | null;
  students_count: number;
}

export interface GroupStudent {
  id: string;
  full_name: string;
  login: string;
  coins_balance: number;
  xp_total: number;
  attendance_pct: number | null;
  lessons_attended: number;
}

export interface GroupDetail {
  group: TeacherGroup & { teacher_id: string; course_name: string };
  students: GroupStudent[];
  recentLessons: { id: string; scheduled_at: string; status: LessonStatus; topic: string | null }[];
}

export interface PendingOrder {
  id: string;
  created_at: string;
  price_coins: number;
  student_name: string;
  group_name: string | null;
  item_title: string;
  kind: ShopKind;
}

export interface TeacherScheduleItem {
  id: string;
  scheduled_at: string;
  status: LessonStatus;
  group_name: string;
  room: string | null;
  course_name: string;
}

// -------------------------------------------------------------- домашки (общее)
export interface HomeworkSubmissionRow {
  student_id: string;
  full_name: string;
  submission_id: string | null;
  content: string | null;
  attachments: { name: string; url: string }[];
  submitted_at: string | null;
  status: 'submitted' | 'accepted' | 'excellent' | 'rework' | null;
  feedback: string | null;
  was_on_time: boolean | null;
}

export interface HomeworkSubmissionsResponse {
  homework: { id: string; group_id: string; title: string; deadline_at: string | null };
  submissions: HomeworkSubmissionRow[];
}

// -------------------------------------------------------------- родитель
export interface ParentChild {
  id: string;
  full_name: string;
  coins_balance: number;
  xp_total: number;
  group_name: string | null;
  course_name: string | null;
  lessons_left: number | null;
}

export interface ParentOverview {
  child: { id: string; full_name: string };
  progress: Mascot;
  coins: number;
  attendance: { total: number; attended: number; percent: number };
  subscription: { lessons_paid: number; lessons_used: number; lessons_left: number; low: boolean };
  achievements: { title: string; icon: string | null; tier: string; earned_at: string }[];
  topicsCovered: { title: string; last_at: string }[];
}

export interface ParentAttendanceDay {
  id: string;
  scheduled_at: string;
  lesson_status: LessonStatus;
  cancelled_by_school: boolean;
  cancel_reason: string | null;
  attendance_status: AttendanceStatus | null;
  topic: string | null;
  group_name: string;
}

export interface ParentFeedbackItem {
  id: string;
  kind: FeedbackKind;
  text: string;
  created_at: string;
  scheduled_at: string;
  teacher_name: string | null;
}

export interface ParentHomeworkItem {
  id: string;
  title: string;
  description: string | null;
  deadline_at: string | null;
  status: 'submitted' | 'accepted' | 'excellent' | 'rework' | null;
  feedback: string | null;
  submitted_at: string | null;
}

export interface Payment {
  id: string;
  amount_kzt: number;
  lessons_count: number;
  method: 'kaspi' | 'cash' | 'transfer';
  paid_at: string;
  period_label: string | null;
  comment: string | null;
  student_name?: string;
}

export interface LessonBalance {
  student_id: string;
  lessons_paid: number;
  lessons_used: number;
  lessons_left: number;
}

export interface ParentPaymentsResponse {
  payments: Payment[];
  balance: LessonBalance | null;
}

export interface ParentScheduleItem {
  id: string;
  scheduled_at: string;
  status: LessonStatus;
  group_name: string;
  room: string | null;
}

// -------------------------------------------------------------- админ
export interface AdminDashboard {
  lessonsToday: { completed: number; planned: number };
  notClosed: { id: string; scheduled_at: string; group_name: string; teacher: string | null }[];
  groups: { id: string; name: string; capacity: number; course_name: string; filled: number }[];
  money: { revenue_month: number; payments_count: number };
  atRisk: {
    student_id: string;
    full_name: string;
    miss_last2: number;
    miss_last3: number;
    last_lesson_at: string | null;
    risk_level: RiskLevel;
  }[];
  debtors: { id: string; full_name: string; lessons_left: number }[];
  pendingOrders: number;
  newLeads: number;
}

export interface ShopReportRow {
  month: string;
  coins_spent: number;
  cost_kzt: number;
  orders: number;
}

export interface EmittedRow {
  month: string;
  coins_emitted: number;
  coins_burned: number;
}

export interface ShopReport {
  issued: ShopReportRow[];
  emitted: EmittedRow[];
}

export interface AdminStudentParent {
  id: string;
  full_name: string;
  phone: string;
}

export interface AdminStudentRow {
  id: string;
  full_name: string;
  login: string;
  is_active: boolean;
  status: string;
  coins_balance: number;
  xp_total: number;
  group_name: string | null;
  lessons_left: number | null;
  parents: AdminStudentParent[];
}

export interface CreateStudentResponse {
  student_id: string;
  parent_id: string | null;
  login: string;
  pin: string;
  parent_pin: string | null;
}

export interface AdminGroup {
  id: string;
  name: string;
  room: string | null;
  capacity: number;
  branch_id: string;
  course_id: string;
  teacher_id: string | null;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  child_age: number | null;
  course_slug: string | null;
  comment: string | null;
  source: string | null;
  utm: Record<string, string>;
  status: LeadStatus;
  created_at: string;
}

export interface AdminCoinsAdjustResponse {
  id: string;
  student_id: string;
  coins: number;
  xp: number;
  reason_code: string;
  created_at: string;
}

export interface AdminStaff {
  id: string;
  full_name: string;
  phone: string;
  role: 'teacher' | 'admin';
}

// -------------------------------------------------------------- календарь
export interface CalendarLesson {
  id: string;
  scheduled_at: string;
  duration_min: number;
  status: LessonStatus;
  group_id: string;
  group_name: string;
  room: string | null;
  course_name: string;
  teacher_name: string | null;
}

export interface CalendarEvent {
  id: string;
  kind: CalendarEventKind;
  title: string;
  description: string | null;
  starts_at: string;
  duration_min: number;
  room: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  lead_id: string | null;
  teacher_id: string | null;
  teacher_name: string | null;
}

export interface AdminCalendarResponse {
  lessons: CalendarLesson[];
  events: CalendarEvent[];
}
