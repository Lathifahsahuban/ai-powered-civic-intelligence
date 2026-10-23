export interface TriageResult {
  issue_type: string;
  visual_findings: string;
  severity: number;
  urgency: 'low' | 'medium' | 'high';
  duration_days?: number | null;
  people_affected: string;
  location: string;
  photo_matches_description: boolean;
  missing_info: string[];
  summary: string;
  confidence: number;
  needs_human_review?: boolean;
  ai_model?: string;
}

export interface Incident {
  id: number;
  ref_code: string;
  created: string;
  citizen_name: string;
  photo: string;
  description: string;
  location: string;
  ward: string;
  duration: string;
  impact: string;
  result: TriageResult;
  review_needed: boolean;
  reviewed: boolean;
  fixed_issue?: string | null;
  fixed_severity?: number | null;
  consensus_count: number;
  status: 'reported' | 'on_progress' | 'resolved';
  stage: number;
  lat?: number;
  lng?: number;
  recorded_at?: string;
  updated_at?: string | null;
  timezone?: string;
  user_submitted?: boolean;
}

export interface RiskCategory {
  id: string;
  title: string;
  reports: number;
  severity: 'Low' | 'Medium' | 'High' | 'High / Critical';
  icon: string;
  color: string;
  critical?: boolean;
}

export interface DashboardStats {
  ward: string;
  zone: string;
  total_reports: number;
  consensus_people: number;
  live_incident: Incident;
  flood_telemetry: {
    sensor: string;
    water_level: string;
    status: string;
    rapid_cell_distance: string;
    eta_mins: number;
  };
  categories: RiskCategory[];
  hotspot: {
    name: string;
    location: string;
    corridor?: string;
    depth_cm: number;
    nearby_reports: number;
    active_zone: boolean;
  };
}

export interface BackendHealth {
  status: string;
  backend: string;
  ai_service: string;
  service?: string;
  gemini_ready: boolean;
  ollama_ready: boolean;
  database: string;
  ward: string;
  timestamp: string;
}
