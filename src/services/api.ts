import { DashboardStats, Incident, BackendHealth } from '../types';

let currentApiBase = localStorage.getItem('civic_sentra_api_base') || '/api';

export function getApiBase(): string {
  return currentApiBase;
}

export function setApiBase(url: string): void {
  currentApiBase = url.replace(/\/+$/, '');
  localStorage.setItem('civic_sentra_api_base', currentApiBase);
}

export async function fetchHealth(): Promise<BackendHealth> {
  const res = await fetch(`${currentApiBase}/health`);
  if (!res.ok) {
    throw new Error(`Health check failed with status ${res.status}`);
  }
  return res.json();
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${currentApiBase}/dashboard/stats`);
  if (!res.ok) {
    throw new Error(`Failed to fetch stats: ${res.status}`);
  }
  return res.json();
}

export async function fetchIncidents(params?: { category?: string; severity?: string; status?: string; search?: string }): Promise<Incident[]> {
  const query = new URLSearchParams();
  if (params?.category) query.set('category', params.category);
  if (params?.severity) query.set('severity', params.severity);
  if (params?.status) query.set('status', params.status);
  if (params?.search) query.set('search', params.search);

  const qs = query.toString() ? `?${query.toString()}` : '';
  const res = await fetch(`${currentApiBase}/incidents${qs}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch incidents: ${res.status}`);
  }
  return res.json();
}

export async function fetchIncident(id: string | number): Promise<Incident> {
  const res = await fetch(`${currentApiBase}/incidents/${id}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch incident ${id}`);
  }
  return res.json();
}

export async function agreeIncident(id: string | number): Promise<{ ok: boolean; consensus_count: number; message: string }> {
  const res = await fetch(`${currentApiBase}/incidents/${id}/agree`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) {
    throw new Error(`Failed to agree to incident: ${res.status}`);
  }
  return res.json();
}

export async function submitTriage(data: {
  citizen_name: string;
  location: string;
  description: string;
  duration?: string;
  impact?: string;
  ward?: string;
  photoBase64?: string;
}): Promise<{ success: boolean; id: number; ref_code: string; incident: Incident; triage_result: any; message: string }> {
  const res = await fetch(`${currentApiBase}/triage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ error: 'Submission failed' }));
    throw new Error(errData.error || `Triage failed with status ${res.status}`);
  }

  return res.json();
}

export async function reviewReport(id: number, issue_type: string, severity: number): Promise<any> {
  const res = await fetch(`${currentApiBase}/reports/${id}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ issue_type, severity })
  });
  if (!res.ok) {
    throw new Error(`Review failed with status ${res.status}`);
  }
  return res.json();
}
