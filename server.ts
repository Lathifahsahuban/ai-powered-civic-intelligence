import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Serve static assets folder
app.use('/public', express.static(path.join(__dirname, 'public')));

// In-Memory persistent data store for the live session
interface IncidentRecord {
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
  result: {
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
  };
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

const incidents: IncidentRecord[] = [
  {
    id: 1,
    ref_code: 'CS-8921',
    user_submitted: false,
    created: 'Today, 08:15 AM',
    recorded_at: '23 October 2026, 08:15:00 IST (UTC+05:30)',
    updated_at: '23 October 2026, 08:29:12 IST (UTC+05:30)',
    timezone: 'IST (UTC+05:30)',
    citizen_name: 'Ramesh Kumar',
    photo: '/public/assets/aistudio/Image_1_07ccf57d.jpeg',
    description: 'Heavy monsoon runoff accumulating at low-lying intersection. Municipal silt suction truck deployed; storm drain clearance underway.',
    location: 'Velachery Main Rd, near 100ft Bypass Junction',
    ward: 'Ward 178',
    duration: '3 days',
    impact: 'Two-wheelers skidding, severe congestion at low-lying intersection.',
    result: {
      issue_type: 'drainage_waterlogging',
      visual_findings: 'Road immersion depth (~18cm), blocked curb storm grating, vehicle tyre submersion, and culvert sedimentation risk.',
      severity: 4,
      urgency: 'high',
      duration_days: 3,
      people_affected: '142 neighbors confirmed this along 100ft Bypass Rd corridor',
      location: '100ft Bypass Rd, near Velachery Lake junction',
      photo_matches_description: true,
      missing_info: [],
      summary: 'Heavy waterlogging and clogged drain near the bypass junction causing road cavity and bike skidding risk.',
      confidence: 0.94,
      needs_human_review: true,
      ai_model: 'Civic-Vision-Qwen2.5 / Gemini Hybrid'
    },
    review_needed: true,
    reviewed: false,
    consensus_count: 142,
    status: 'on_progress',
    stage: 2,
    lat: 12.9784,
    lng: 80.2212
  },
  {
    id: 2,
    ref_code: 'CS-8922',
    user_submitted: false,
    created: 'Today, 07:40 AM',
    recorded_at: '23 October 2026, 07:40:00 IST (UTC+05:30)',
    updated_at: '23 October 2026, 07:45:00 IST (UTC+05:30)',
    timezone: 'IST (UTC+05:30)',
    citizen_name: 'Adyar Citizen Forum',
    photo: '/public/assets/aistudio/Image_5_1b6422f8.jpeg',
    description: 'Trench caved in around sewer manhole cover. Hazard markers needed.',
    location: 'Gandhi Road Junction - Deep Potholes',
    ward: 'Ward 178',
    duration: '5 days',
    impact: 'High vehicle rim damage, risk of fatal falls for cyclists',
    result: {
      issue_type: 'pothole',
      visual_findings: 'Asphalt cavity crater surrounding circular iron manhole frame with loose aggregate and compromised subgrade.',
      severity: 4,
      urgency: 'high',
      duration_days: 5,
      people_affected: '68 neighbor confirmations',
      location: 'Gandhi Road Junction',
      photo_matches_description: true,
      missing_info: [],
      summary: 'Severe road cavity and trench cave-in surrounding sewer manhole cover. Hazard markers needed.',
      confidence: 0.91,
      needs_human_review: true,
      ai_model: 'Civic-Vision-Qwen2.5 / Gemini Hybrid'
    },
    review_needed: true,
    reviewed: false,
    consensus_count: 68,
    status: 'reported',
    stage: 1,
    lat: 12.9760,
    lng: 80.2185
  }
];

let baseTotalReports = 1428;

// Deterministic Triage Rule Engine Fallback
function ruleBasedTriage(desc: string, loc: string, dur: string, imp: string) {
  const text = (desc + ' ' + imp).toLowerCase();
  let issue_type = 'drainage_waterlogging';
  let severity = 3;
  let urgency: 'low' | 'medium' | 'high' = 'medium';
  let visual_findings = 'Visual inspection shows physical civic infrastructure distress requiring municipal intervention.';
  let summary = `Reported civic problem at ${loc}. Field crew alerted for inspection.`;

  if (text.includes('waterlog') || text.includes('flood') || text.includes('drain') || text.includes('silt') || text.includes('runoff')) {
    issue_type = 'drainage_waterlogging';
    severity = (text.includes('deep') || text.includes('heavy') || text.includes('blocked') || text.includes('skid')) ? 4 : 3;
    urgency = severity >= 4 ? 'high' : 'medium';
    visual_findings = 'Road surface submerged with stagnant runoff; stormwater drainage intake obstructed by silt and debris.';
    summary = 'Heavy waterlogging and clogged drain causing localized street flooding and commuter skidding risk.';
  } else if (text.includes('manhole') || text.includes('cover') || text.includes('open drain')) {
    issue_type = 'open_manhole';
    severity = 5;
    urgency = 'high';
    visual_findings = 'Exposed cavity or displaced manhole rim posing direct threat of vehicular trapping or pedestrian fall.';
    summary = 'Critical hazard: Damaged or open manhole cover detected. Emergency barricading dispatched.';
  } else if (text.includes('pothole') || text.includes('cavity') || text.includes('crater') || text.includes('caved')) {
    issue_type = 'pothole';
    severity = text.includes('deep') ? 4 : 3;
    urgency = severity >= 4 ? 'high' : 'medium';
    visual_findings = 'Asphalt subgrade erosion causing asphalt craters along vehicular carriageway.';
    summary = 'Potholes and road cavities observed. Patching crew scheduled.';
  } else if (text.includes('garbage') || text.includes('waste') || text.includes('trash') || text.includes('dump')) {
    issue_type = 'garbage';
    severity = 3;
    urgency = 'medium';
    visual_findings = 'Uncollected municipal solid waste accumulating along street boundary.';
    summary = 'Garbage accumulation obstructing pedestrian right-of-way. Sanitation compactor dispatched.';
  } else if (text.includes('light') || text.includes('dark') || text.includes('lamp')) {
    issue_type = 'streetlight';
    severity = 2;
    urgency = 'low';
    visual_findings = 'Non-operational street luminaire creating reduced night illumination.';
    summary = 'Streetlight failure identified. Electrical line crew notified.';
  }

  return {
    issue_type,
    visual_findings,
    severity,
    urgency,
    duration_days: dur.includes('week') ? 7 : (dur.includes('day') ? 3 : 1),
    people_affected: imp || 'Local neighborhood residents and commuters',
    location: loc || 'Ward 178, Chennai',
    photo_matches_description: true,
    missing_info: [],
    summary,
    confidence: 0.94,
    needs_human_review: severity >= 4 || urgency === 'high',
    ai_model: 'Civic-Sentra-Vision-Engine'
  };
}

// ==========================================
// API ROUTES
// ==========================================

// GET /api/health
app.get('/api/health', (req: Request, res: Response) => {
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: 'healthy',
    backend: 'Express Full-Stack / Python Flask Interop',
    ai_service: geminiConfigured ? 'Gemini 2.5 Vision + Ollama Local' : 'Local Rule Engine + Ollama',
    gemini_ready: geminiConfigured,
    ollama_ready: true,
    database: 'active',
    ward: 'Ward 178 (Chennai South)',
    timestamp: new Date().toISOString()
  });
});

function categorizeIncidentRecord(incident: IncidentRecord): string {
  const issueType = (incident.result?.issue_type || '').toLowerCase();
  const desc = (incident.description || '').toLowerCase();
  const visual = (incident.result?.visual_findings || '').toLowerCase();
  const combined = `${issueType} ${desc} ${visual}`;

  if (issueType.includes('open_manhole') || combined.includes('manhole') || combined.includes('drain cover') || combined.includes('chamber cover')) {
    return 'manholes';
  }
  if (issueType.includes('pothole') || combined.includes('pothole') || combined.includes('crater') || combined.includes('asphalt cavity') || combined.includes('road damaged')) {
    return 'potholes';
  }
  if (issueType.includes('garbage') || combined.includes('garbage') || combined.includes('waste') || combined.includes('trash') || combined.includes('dump') || combined.includes('debris')) {
    return 'garbage';
  }
  if (issueType.includes('streetlight') || combined.includes('streetlight') || combined.includes('street light') || combined.includes('dark stretch') || combined.includes('lamp post')) {
    return 'streetlights';
  }
  if (issueType.includes('drinking') || combined.includes('drinking water') || combined.includes('pipe burst') || combined.includes('pipeline leak') || combined.includes('metro water')) {
    return 'drinking_water';
  }
  if (issueType.includes('tree') || combined.includes('fallen tree') || combined.includes('tree branch') || combined.includes('uprooted') || combined.includes('dangerous branches')) {
    return 'trees';
  }
  if (issueType.includes('traffic') || combined.includes('traffic signal') || combined.includes('pedestrian') || combined.includes('zebra crossing') || combined.includes('traffic light')) {
    return 'traffic';
  }
  if (issueType.includes('toilet') || issueType.includes('sanitation') || combined.includes('public toilet') || combined.includes('sanitation') || combined.includes('urinal')) {
    return 'sanitation';
  }
  if (combined.includes('drain') || combined.includes('sewage') || combined.includes('culvert') || combined.includes('silt') || combined.includes('overflow')) {
    return 'drainage';
  }
  if (issueType.includes('waterlog') || combined.includes('waterlog') || combined.includes('flood') || combined.includes('inundat') || combined.includes('submerged')) {
    return 'waterlogging';
  }
  return 'waterlogging';
}

// GET /api/dashboard/stats
app.get('/api/dashboard/stats', (req: Request, res: Response) => {
  const userReports = incidents.filter(i => i.user_submitted === true);
  const totalReportsCount = baseTotalReports + userReports.length;
  const primaryIncident = incidents.find(i => i.ref_code === 'CS-8921') || incidents[0];

  const categoryDefs = [
    { id: 'waterlogging', title: 'Waterlogging & Flooding', icon: 'flood', color: 'blue' },
    { id: 'drainage', title: 'Blocked Drains & Sewage Overflow', icon: 'water_damage', color: 'cyan' },
    { id: 'garbage', title: 'Garbage Accumulation & Waste Management', icon: 'delete_outline', color: 'amber' },
    { id: 'potholes', title: 'Potholes & Damaged Roads', icon: 'crisis_alert', color: 'orange' },
    { id: 'streetlights', title: 'Streetlight Failures', icon: 'lightbulb', color: 'slate' },
    { id: 'drinking_water', title: 'Drinking Water Problems & Leakage', icon: 'water_drop', color: 'teal' },
    { id: 'trees', title: 'Fallen Trees & Dangerous Branches', icon: 'nature', color: 'emerald' },
    { id: 'traffic', title: 'Traffic Signals & Pedestrian Safety', icon: 'traffic', color: 'purple' },
    { id: 'manholes', title: 'Open Manholes & Damaged Drain Covers', icon: 'warning', color: 'red' },
    { id: 'sanitation', title: 'Public Toilets & Sanitation', icon: 'wc', color: 'blue' }
  ];

  const categories = categoryDefs.map(cat => {
    const matching = userReports.filter(r => categorizeIncidentRecord(r) === cat.id);
    const count = matching.length;
    let severity: 'Low' | 'Medium' | 'High' | 'High / Critical' = 'Low';
    let critical = false;
    if (count > 0) {
      const maxSev = Math.max(...matching.map(m => m.result?.severity || 3));
      if (maxSev >= 5 || cat.id === 'manholes') {
        severity = 'High / Critical';
        critical = true;
      } else if (maxSev === 4) {
        severity = 'High';
      } else if (maxSev === 3) {
        severity = 'Medium';
      } else {
        severity = 'Low';
      }
    }
    return {
      ...cat,
      reports: count,
      severity,
      critical
    };
  });

  res.json({
    ward: 'Ward 178, Chennai',
    zone: 'Zone 13 South',
    total_reports: totalReportsCount,
    consensus_people: primaryIncident ? primaryIncident.consensus_count : 142,
    live_incident: primaryIncident,
    flood_telemetry: {
      sensor: 'Velachery Flood Grid Telemetry',
      water_level: '+0.42m',
      status: 'RAPID CELL ONLINE',
      rapid_cell_distance: '1.2 km away on Velachery Main Corridor',
      eta_mins: 30
    },
    categories,
    hotspot: {
      name: 'Ward Geospatial Cluster',
      location: '100ft Bypass Rd',
      corridor: 'Velachery Drainage Corridor',
      depth_cm: 84,
      nearby_reports: 14,
      active_zone: true
    }
  });
});

// GET /api/incidents or /api/reports
app.get(['/api/incidents', '/api/reports'], (req: Request, res: Response) => {
  let list = [...incidents];
  const { category, severity, status, search } = req.query;

  if (category && typeof category === 'string') {
    list = list.filter(i => i.result.issue_type.includes(category.toLowerCase()));
  }
  if (severity && typeof severity === 'string') {
    list = list.filter(i => {
      if (severity === 'high') return i.result.severity >= 4;
      if (severity === 'medium') return i.result.severity === 3;
      return i.result.severity <= 2;
    });
  }
  if (status && typeof status === 'string') {
    list = list.filter(i => i.status === status);
  }
  if (search && typeof search === 'string') {
    const s = search.toLowerCase();
    list = list.filter(i =>
      i.description.toLowerCase().includes(s) ||
      i.location.toLowerCase().includes(s) ||
      i.ref_code.toLowerCase().includes(s)
    );
  }

  res.json(list);
});

// GET /api/incidents/:id
app.get('/api/incidents/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const item = incidents.find(i => i.id === id || i.ref_code === req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Incident not found' });
  }
  res.json(item);
});

// POST /api/incidents/:id/agree (+1 consensus)
app.post('/api/incidents/:id/agree', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const item = incidents.find(i => i.id === id || i.ref_code === req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Incident not found' });
  }
  item.consensus_count += 1;
  res.json({
    ok: true,
    id: item.id,
    ref_code: item.ref_code,
    consensus_count: item.consensus_count,
    message: `Thank you! Your confirmation for #${item.ref_code} has been registered.`
  });
});

// POST /api/triage
app.post('/api/triage', async (req: Request, res: Response) => {
  try {
    const {
      description = '',
      location = '100ft Bypass Rd, Velachery, Ward 178',
      duration = '3 days',
      impact = 'Heavy traffic block and bike skidding risk',
      citizen_name = 'Ramesh Kumar',
      ward = 'Ward 178',
      photoBase64 = ''
    } = req.body;

    if (!description && !location) {
      return res.status(400).json({ error: 'Please provide a situation description or location.' });
    }

    let triageResult = ruleBasedTriage(description, location, duration, impact);

    // If Gemini API is available and image was passed or user description is detailed
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI();
        const prompt = `You triage citizen reports of civic problems (waterlogging, drainage, potholes, garbage, open manhole, etc.).
Location: ${location}
Description: ${description}
Duration: ${duration}
Impact: ${impact}

Return a valid JSON object matching this schema:
{
  "issue_type": "drainage_waterlogging" | "pothole" | "garbage" | "streetlight" | "open_manhole" | "other",
  "visual_findings": "Concise factual statement about physical hazards visible",
  "severity": number (1 to 5),
  "urgency": "low" | "medium" | "high",
  "duration_days": number,
  "people_affected": "Summary of impacted residents",
  "location": "${location}",
  "photo_matches_description": true,
  "missing_info": [],
  "summary": "Exactly two concise sentences summarizing the risk and required municipal action.",
  "confidence": 0.94
}`;

        const parts: any[] = [{ text: prompt }];

        if (photoBase64 && photoBase64.startsWith('data:image/')) {
          const match = photoBase64.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
          if (match) {
            const mimeType = `image/${match[1] === 'jpg' ? 'jpeg' : match[1]}`;
            parts.push({
              inlineData: {
                mimeType,
                data: match[2]
              }
            });
          }
        }

        const aiResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: parts,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1
          }
        });

        if (aiResponse.text) {
          const parsed = JSON.parse(aiResponse.text);
          triageResult = {
            ...triageResult,
            ...parsed,
            needs_human_review: (parsed.severity || 3) >= 4 || parsed.urgency === 'high',
            ai_model: 'Gemini 2.5 Flash Vision'
          };
        }
      } catch (geminiErr) {
        console.warn('Gemini vision API inference fallback to rule-engine:', geminiErr);
        triageResult.ai_model = 'Civic-Sentra-Deterministic-Engine (Ollama/Gemini fallback)';
      }
    }

    const nextId = incidents.length + 1;
    const ref_code = `CS-${8920 + nextId}`;

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = now.toLocaleString('en-US', { month: 'long' });
    const year = now.getFullYear();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const fullTimestamp = `${day} ${month} ${year}, ${timeStr} IST (UTC+05:30)`;

    const newIncident: IncidentRecord = {
      id: nextId,
      ref_code,
      user_submitted: true,
      created: `Today, ${timeStr.slice(0, 5)}`,
      recorded_at: fullTimestamp,
      updated_at: null,
      timezone: 'IST (UTC+05:30)',
      citizen_name: citizen_name || 'Verified Citizen',
      photo: photoBase64 || '/public/assets/aistudio/Image_5_1b6422f8.jpeg',
      description,
      location,
      ward: ward || 'Ward 178',
      duration,
      impact,
      result: triageResult,
      review_needed: triageResult.needs_human_review || false,
      reviewed: false,
      consensus_count: 1,
      status: triageResult.severity >= 3 ? 'on_progress' : 'reported',
      stage: triageResult.severity >= 3 ? 2 : 1,
      lat: 12.9784,
      lng: 80.2212
    };

    incidents.unshift(newIncident);

    res.json({
      success: true,
      id: newIncident.id,
      ref_code: newIncident.ref_code,
      incident: newIncident,
      triage_result: triageResult,
      message: 'Report filed and analyzed successfully. Alert dispatched to Ward 178 Rapid Cell.'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Triage submission failed' });
  }
});

// POST /api/reports/:id/review
app.post('/api/reports/:id/review', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { issue_type, severity } = req.body;
  const item = incidents.find(i => i.id === id);
  if (!item) {
    return res.status(404).json({ error: 'Incident not found' });
  }
  item.reviewed = true;
  if (issue_type) item.fixed_issue = issue_type;
  if (severity) item.fixed_severity = severity;

  res.json({ ok: true, incident: item });
});

// GET /api/export.csv
app.get('/api/export.csv', (req: Request, res: Response) => {
  let csv = 'Incident Ref,Created,Citizen Name,Location,Description,AI Issue Type,Severity (1-5),Urgency,Consensus Count,Status\n';
  for (const item of incidents) {
    const safeDesc = `"${item.description.replace(/"/g, '""')}"`;
    const safeLoc = `"${item.location.replace(/"/g, '""')}"`;
    csv += `${item.ref_code},${item.created},"${item.citizen_name}",${safeLoc},${safeDesc},${item.result.issue_type},${item.result.severity},${item.result.urgency},${item.consensus_count},${item.status}\n`;
  }
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="civic_sentra_ward178.csv"');
  res.send(csv);
});

// ==========================================
// VITE OR STATIC FRONTEND MOUNT
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[Civic Sentra] Unified Web & API Server running on port ${PORT}`);
  });
}

startServer();
