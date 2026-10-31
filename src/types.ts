export const ISSUE_TYPES = ['waterlogging_flooding','blocked_drain_sewage','garbage_waste','pothole_road_damage','streetlight_failure','water_supply_leakage','fallen_tree_branch','traffic_signal_pedestrian_safety','open_manhole_drain_cover','public_toilet_sanitation','other','unclear'] as const;
export type IssueType = typeof ISSUE_TYPES[number];
export type Status = 'reported' | 'on_progress' | 'resolved';
export interface ReportInput {
  citizen_name: string; location: string; description: string; duration?: string; impact?: string; ward?: string;
  photoBase64?: string; lat?: number; lng?: number; occurred_at?: string; reporter_id?: string;
}
export interface TriageResult {
  issue_type: IssueType; visual_findings: string; severity: number; urgency: 'low'|'medium'|'high';
  immediate_hazard: boolean; people_affected: string; affected_count: number|null; location: string;
  photo_matches_description: 'yes'|'no'|'cannot_tell'; missing_info: string[]; summary: string; confidence: number;
  needs_human_review: boolean; ai_model: string; source: 'gemini'|'rules'; fallback_reason?: string;
}
export interface Recurrence {
  group_id?: number; kind: 'new'|'duplicate'|'confirmation'|'potential_recurrence'; event_id: number; recurrence_count: number;
  previous_ids: number[]; evidence: string[]; match_method: 'coordinates'|'location_text'|'none';
}
export interface Priority { level: 'low'|'medium'|'high'|'critical'; score: number; reasons: string[] }
export interface Review { at: string; issue_type: IssueType; severity: number; immediate_hazard: boolean; status: Status; note: string }
export interface Incident {
  id: number; ref_code: string; created: string; recorded_at: string; updated_at?: string;
  occurred_at: string; citizen_name: string; photo: string; description: string; location: string; ward: string;
  duration: string; impact: string; result: TriageResult; assessment_status: 'pending'|'complete'|'failed';
  review_needed: boolean; reviewed: boolean; fixed_issue?: IssueType; fixed_severity?: number;
  consensus_count: number; status: Status; stage: number;
  lat?: number; lng?: number; user_submitted: boolean; recurrence: Recurrence; priority: Priority; reviews: Review[];
}
export interface StoredIncident extends Incident { confirmation_ids: string[]; reporter_id: string }
export interface RiskCategory { id: string; title: string; reports: number; severity: 'Low'|'Medium'|'High'|'High / Critical'; icon: string; color: string; critical?: boolean }
export interface DashboardStats {
  total_reports: number; unique_events: number; recurring_problems: number; pending_reviews: number; resolved: number;
  consensus_people: number; categories: RiskCategory[]; live_incident: Incident|null; ward: string; zone: string;
}
export interface BackendHealth {
  status: string; backend: string; ai_service: string; gemini_ready: boolean; ollama_ready: boolean;
  database: string; ward: string; timestamp: string; provider_configured: boolean; provider_last_status: string;
}
export function effectiveCategory(i: Incident): IssueType { return i.fixed_issue ?? i.result.issue_type; }
export function effectiveSeverity(i: Incident): number { return i.fixed_severity ?? i.result.severity; }
export const label = (value: string) => value.replaceAll('_', ' ');
