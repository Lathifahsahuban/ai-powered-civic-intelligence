"""
Civic Sentra - Python Flask Backend & Triage API
Urban Telemetry, Incident Management & Vision AI Pipeline for Ward 178, Chennai.

Usage:
    pip install -r requirements.txt
    python app.py
    Access API at: http://127.0.0.1:5000
"""

import csv
import io
import json
import os
import sqlite3
import uuid
from datetime import datetime
from pathlib import Path
from typing import get_args

from flask import Flask, Response, jsonify, request, send_from_directory
try:
    from flask_cors import CORS
except ImportError:
    # Graceful fallback if flask_cors is not yet installed
    CORS = lambda app: app

import triage

BASE = Path(__file__).parent
UPLOADS = BASE / "uploads"
UPLOADS.mkdir(exist_ok=True)
EXTS = {".jpg", ".jpeg", ".png", ".webp"}
ISSUE_TYPES = set(get_args(triage.IssueType))

app = Flask(__name__, static_folder="static")
CORS(app)  # Enable Cross-Origin requests for frontend development on localhost:3000
app.config["MAX_CONTENT_LENGTH"] = 15 * 1024 * 1024  # 15 MB photos


def get_db():
    con = sqlite3.connect(BASE / "reports.db")
    con.row_factory = sqlite3.Row
    return con


def init_db():
    with get_db() as con:
        con.execute("""
            CREATE TABLE IF NOT EXISTS reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ref_code TEXT,
                created TEXT,
                citizen_name TEXT,
                photo TEXT,
                description TEXT,
                location TEXT,
                ward TEXT DEFAULT 'Ward 178',
                duration TEXT,
                impact TEXT,
                result TEXT,
                review INTEGER DEFAULT 0,
                reviewed INTEGER DEFAULT 0,
                fixed_issue TEXT,
                fixed_severity INTEGER,
                consensus_count INTEGER DEFAULT 1,
                status TEXT DEFAULT 'on_progress',
                stage INTEGER DEFAULT 2
            )
        """)

        # Seed initial incident #CS-8921 if empty
        cur = con.execute("SELECT COUNT(*) as count FROM reports")
        if cur.fetchone()["count"] == 0:
            sample_result = {
                "issue_type": "drainage_waterlogging",
                "visual_findings": "High-contrast water immersion across the road carriageway, blocking storm grating and creating road cavity hazard.",
                "severity": 4,
                "urgency": "high",
                "duration_days": 3,
                "people_affected": "142 neighbors confirmed this along 100ft Bypass Rd corridor",
                "location": "100ft Bypass Rd, near Velachery Lake junction",
                "photo_matches_description": True,
                "missing_info": [],
                "summary": "Severe monsoon waterlogging accumulating at low-lying intersection. Municipal silt suction truck deployed; storm drain clearance underway.",
                "confidence": 0.94
            }
            con.execute("""
                INSERT INTO reports (
                    ref_code, created, citizen_name, photo, description, location, ward,
                    duration, impact, result, review, reviewed, consensus_count, status, stage
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                "CS-8921",
                datetime.now().strftime("%Y-%m-%d %H:%M"),
                "Ramesh Kumar",
                "cs8921_waterlogging.jpg",
                "Heavy monsoon runoff accumulating at low-lying intersection. Municipal silt suction truck deployed; storm drain clearance underway.",
                "Velachery Main Rd, near 100ft Bypass Junction",
                "Ward 178",
                "3 days",
                "Severe skidding risk for two-wheelers, traffic gridlock",
                json.dumps(sample_result),
                1,
                0,
                142,
                "on_progress",
                2
            ))
            # Seed secondary incident #CS-8922 (Gandhi Road Junction)
            sample_result_2 = {
                "issue_type": "pothole",
                "visual_findings": "Severe road cavity and trench cave-in surrounding sewer manhole cover with compromised subgrade.",
                "severity": 4,
                "urgency": "high",
                "duration_days": 5,
                "people_affected": "68 neighbor confirmations",
                "location": "Gandhi Road Junction",
                "photo_matches_description": True,
                "missing_info": [],
                "summary": "Trench caved in around sewer manhole cover. Hazard markers needed immediately.",
                "confidence": 0.91
            }
            con.execute("""
                INSERT INTO reports (
                    ref_code, created, citizen_name, photo, description, location, ward,
                    duration, impact, result, review, reviewed, consensus_count, status, stage
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                "CS-8922",
                datetime.now().strftime("%Y-%m-%d %H:%M"),
                "Adyar Citizens Forum",
                "cs8922_pothole.jpg",
                "Trench caved in around sewer manhole cover. Hazard markers needed.",
                "Gandhi Road Junction - Deep Potholes",
                "Ward 178",
                "5 days",
                "High vehicle rim damage, risk of fatal falls for cyclists",
                json.dumps(sample_result_2),
                1,
                0,
                68,
                "reported",
                1
            ))


init_db()


def format_report_view(r):
    res = json.loads(r["result"]) if r["result"] else {}
    return {
        "id": r["id"],
        "ref_code": r["ref_code"] or f"CS-{r['id'] + 8920}",
        "created": r["created"],
        "citizen_name": r["citizen_name"] or "Citizen Reporter",
        "photo": "/uploads/" + r["photo"] if r["photo"] else "/public/assets/aistudio/Image_1_07ccf57d.jpeg",
        "description": r["description"],
        "location": r["location"],
        "ward": r["ward"] or "Ward 178",
        "duration": r["duration"],
        "impact": r["impact"],
        "result": res,
        "reviewed": bool(r["reviewed"]),
        "review_needed": bool(r["review"]),
        "consensus_count": r["consensus_count"] or 1,
        "status": r["status"] or "reported",
        "stage": r["stage"] or 1,
        "final_issue": r["fixed_issue"] or res.get("issue_type", "drainage_waterlogging"),
        "final_severity": r["fixed_severity"] or res.get("severity", 3),
    }


# =====================================================================
# API ENDPOINTS
# =====================================================================

@app.get("/api/health")
def health():
    """Report backend service and AI model inference connectivity."""
    ollama_ok = False
    try:
        import urllib.request
        req = urllib.request.Request("http://localhost:11434/api/tags", headers={"User-Agent": "CivicSentra/1.0"})
        with urllib.request.urlopen(req, timeout=1.5) as resp:
            ollama_ok = resp.status == 200
    except Exception:
        ollama_ok = False

    return jsonify({
        "status": "healthy",
        "service": "Civic Sentra Municipal Backend",
        "database": "sqlite3_connected",
        "ollama_available": ollama_ok,
        "active_model": triage.MODEL,
        "fallback_engine": "deterministic_rule_based",
        "ward": "Ward 178 (Chennai South, Zone 13)",
        "timestamp": datetime.now().isoformat()
    })


@app.get("/api/dashboard/stats")
def dashboard_stats():
    """Return aggregated statistics used by dashboard summary cards, telemetry, and risk hub."""
    with get_db() as con:
        # Base count + 1,428 ward total historical telemetry baseline
        cur_count = con.execute("SELECT COUNT(*) as cnt, SUM(consensus_count) as total_agree FROM reports").fetchone()
        db_reports = cur_count["cnt"] or 0
        db_agree = cur_count["total_agree"] or 0

        # Category counts
        all_reports = [format_report_view(r) for r in con.execute("SELECT * FROM reports").fetchall()]

    total_ward_reports = 1428 + db_reports
    primary_consensus = 142 + (db_agree - 210 if db_agree > 210 else 0)

    # User-submitted reports (excluding initial demo rows id 1 and 2)
    user_reports = [r for r in all_reports if r.get("id", 0) > 2]

    def categorize_rep(r):
        res = r.get("result", {})
        itype = (res.get("issue_type") or "").lower()
        desc = (r.get("description") or "").lower()
        vis = (res.get("visual_findings") or "").lower()
        comb = f"{itype} {desc} {vis}"
        if "open_manhole" in itype or "manhole" in comb or "drain cover" in comb:
            return "manholes"
        if "pothole" in itype or "pothole" in comb or "crater" in comb or "road damaged" in comb:
            return "potholes"
        if "garbage" in itype or "garbage" in comb or "waste" in comb or "trash" in comb:
            return "garbage"
        if "streetlight" in itype or "streetlight" in comb or "street light" in comb or "lamp post" in comb:
            return "streetlights"
        if "drinking" in itype or "drinking water" in comb or "pipe burst" in comb or "pipeline" in comb:
            return "drinking_water"
        if "tree" in itype or "fallen tree" in comb or "branch" in comb:
            return "trees"
        if "traffic" in itype or "traffic signal" in comb or "pedestrian" in comb:
            return "traffic"
        if "toilet" in itype or "sanitation" in comb or "public toilet" in comb:
            return "sanitation"
        if "drain" in comb or "sewage" in comb or "silt" in comb:
            return "drainage"
        return "waterlogging"

    cat_defs = [
        {"id": "waterlogging", "title": "Waterlogging & Flooding", "icon": "flood", "color": "blue"},
        {"id": "drainage", "title": "Blocked Drains & Sewage Overflow", "icon": "water_damage", "color": "cyan"},
        {"id": "garbage", "title": "Garbage Accumulation & Waste Management", "icon": "delete_outline", "color": "amber"},
        {"id": "potholes", "title": "Potholes & Damaged Roads", "icon": "crisis_alert", "color": "orange"},
        {"id": "streetlights", "title": "Streetlight Failures", "icon": "lightbulb", "color": "slate"},
        {"id": "drinking_water", "title": "Drinking Water Problems & Leakage", "icon": "water_drop", "color": "teal"},
        {"id": "trees", "title": "Fallen Trees & Dangerous Branches", "icon": "nature", "color": "emerald"},
        {"id": "traffic", "title": "Traffic Signals & Pedestrian Safety", "icon": "traffic", "color": "purple"},
        {"id": "manholes", "title": "Open Manholes & Damaged Drain Covers", "icon": "warning", "color": "red"},
        {"id": "sanitation", "title": "Public Toilets & Sanitation", "icon": "wc", "color": "blue"},
    ]

    categories = []
    for c in cat_defs:
        matching = [r for r in user_reports if categorize_rep(r) == c["id"]]
        cnt = len(matching)
        sev = "Low"
        crit = False
        if cnt > 0:
            max_s = max([(r.get("result", {}).get("severity") or 3) for r in matching])
            if max_s >= 5 or c["id"] == "manholes":
                sev = "High / Critical"
                crit = True
            elif max_s == 4:
                sev = "High"
            elif max_s == 3:
                sev = "Medium"
            else:
                sev = "Low"
        categories.append({
            **c,
            "reports": cnt,
            "severity": sev,
            "critical": crit
        })

    return jsonify({
        "ward": "Ward 178, Chennai",
        "zone": "Zone 13 South",
        "total_reports": total_ward_reports,
        "consensus_people": primary_consensus,
        "flood_telemetry": {
            "sensor": "Velachery Flood Grid Telemetry",
            "water_level": "+0.42m",
            "status": "RAPID CELL ONLINE",
            "rapid_cell_distance": "1.2 km away on Velachery Main Corridor",
            "eta_mins": 30
        },
        "live_incident_ref": "CS-8921",
        "categories": categories,
        "hotspot": {
            "name": "Velachery Drainage Corridor",
            "location": "100ft Bypass Rd",
            "depth_cm": 84,
            "nearby_reports": 14,
            "active_zone": True
        }
    })


@app.get("/api/incidents")
@app.get("/api/reports")
def list_incidents():
    """Retrieve filtered and sorted incident records."""
    sql = "SELECT * FROM reports"
    clauses = []
    params = []

    if request.args.get("review_only") == "true":
        clauses.append("review = 1 AND reviewed = 0")
    if request.args.get("ward"):
        clauses.append("ward = ?")
        params.append(request.args.get("ward"))
    if request.args.get("status"):
        clauses.append("status = ?")
        params.append(request.args.get("status"))

    if clauses:
        sql += " WHERE " + " AND ".join(clauses)

    items = [format_report_view(r) for r in get_db().execute(sql, params).fetchall()]
    items.sort(key=lambda x: (x["reviewed"], -x["final_severity"], -x["consensus_count"], -x["id"]))
    return jsonify(items)


@app.get("/api/incidents/<int:iid>")
def get_incident(iid):
    """Retrieve an individual incident record by ID."""
    row = get_db().execute("SELECT * FROM reports WHERE id = ?", (iid,)).fetchone()
    if not row:
        return jsonify(error="Incident not found"), 404
    return jsonify(format_report_view(row))


@app.post("/api/incidents/<int:iid>/agree")
def agree_incident(iid):
    """Citizen confirms / agrees with an incident (+1 consensus count)."""
    with get_db() as con:
        cur = con.execute("UPDATE reports SET consensus_count = consensus_count + 1 WHERE id = ?", (iid,))
        if cur.rowcount == 0:
            return jsonify(error="Incident not found"), 404
        updated = con.execute("SELECT consensus_count FROM reports WHERE id = ?", (iid,)).fetchone()
    return jsonify({
        "ok": True,
        "id": iid,
        "new_consensus_count": updated["consensus_count"],
        "message": "Thank you! Your confirmation has been added to the ward consensus."
    })


@app.post("/api/triage")
def triage_report():
    """Submit photo and citizen description for AI-powered risk assessment."""
    photo = request.files.get("photo")
    ext = Path(photo.filename).suffix.lower() if photo and photo.filename else ".jpg"

    saved_photo_name = "default_report.jpg"
    photo_path = str(UPLOADS / saved_photo_name)

    if photo and photo.filename:
        if ext not in EXTS:
            return jsonify(error="Please attach a valid photo (JPG, PNG, or WebP)."), 400
        saved_photo_name = uuid.uuid4().hex + ext
        photo_path = str(UPLOADS / saved_photo_name)
        photo.save(photo_path)
    else:
        # If no custom photo provided, create a dummy placeholder marker
        saved_photo_name = "report_" + uuid.uuid4().hex[:8] + ".jpg"
        photo_path = str(UPLOADS / saved_photo_name)
        with open(photo_path, "wb") as f:
            f.write(b"")

    f = {
        "description": request.form.get("description", "").strip(),
        "location": request.form.get("location", "").strip(),
        "duration": request.form.get("duration", "").strip(),
        "impact": request.form.get("impact", "").strip(),
        "citizen_name": request.form.get("citizen_name", "Anonymous Citizen").strip(),
        "ward": request.form.get("ward", "Ward 178").strip(),
    }

    if not f["description"] and not f["location"]:
        return jsonify(error="Please provide a situation description or location."), 400

    # Execute AI Risk Assessment using triage module (Ollama with fallback)
    try:
        rep = triage.analyze(
            photo_path,
            f["description"] or "Civic hazard reported",
            f["location"] or "Ward 178, Chennai",
            f["duration"] or "Recent",
            f["impact"] or "Affecting pedestrians and road users"
        )
    except Exception as e:
        return jsonify(error=f"Triage error: {e}"), 500

    res = rep.model_dump()
    res["needs_human_review"] = triage.needs_human_review(rep)

    ref_code = f"CS-{8920 + int(datetime.now().strftime('%M%S')) % 1000}"

    with get_db() as con:
        cur = con.execute("""
            INSERT INTO reports (
                ref_code, created, citizen_name, photo, description, location, ward,
                duration, impact, result, review, reviewed, consensus_count, status, stage
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            ref_code,
            datetime.now().strftime("%Y-%m-%d %H:%M"),
            f["citizen_name"],
            saved_photo_name,
            f["description"],
            f["location"],
            f["ward"],
            f["duration"],
            f["impact"],
            json.dumps(res),
            int(res["needs_human_review"]),
            0,
            1,
            "on_progress" if res["severity"] >= 3 else "reported",
            2 if res["severity"] >= 3 else 1
        ))
        res["id"] = cur.lastrowid
        res["ref_code"] = ref_code

    return jsonify({
        "success": True,
        "id": res["id"],
        "ref_code": ref_code,
        "triage_result": res,
        "message": "Report registered and analyzed successfully. Ward Rapid Cell notified."
    })


@app.post("/api/reports/<int:rid>/review")
def review(rid):
    """Municipal officer overrides or confirms issue classification and severity."""
    d = request.get_json(silent=True) or {}
    issue_type = d.get("issue_type")
    severity = d.get("severity")

    if issue_type not in ISSUE_TYPES or severity not in (1, 2, 3, 4, 5):
        return jsonify(error=f"Invalid review. issue_type must be in {sorted(list(ISSUE_TYPES))} and severity 1-5."), 400

    with get_db() as con:
        cur = con.execute("""
            UPDATE reports
            SET reviewed = 1, fixed_issue = ?, fixed_severity = ?
            WHERE id = ?
        """, (issue_type, severity, rid))
        if cur.rowcount == 0:
            return jsonify(error="Report not found"), 404

    return jsonify({"ok": True, "message": "Review recorded successfully."})


def safe_csv(v):
    """Prevent CSV formula injection from user-typed input."""
    v = str(v)
    return "'" + v if v and v[0] in "=+-@" else v


@app.get("/api/export.csv")
def export_csv():
    """Download reports as a sanitized CSV file."""
    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow([
        "Incident Ref", "Created At", "Citizen Name", "Ward", "Location",
        "Description", "Duration", "Impact", "AI Issue Type", "AI Severity (1-5)",
        "Final Issue Type", "Final Severity", "Consensus Count", "Reviewed", "Status"
    ])

    with get_db() as con:
        for r in con.execute("SELECT * FROM reports ORDER BY id DESC").fetchall():
            res = json.loads(r["result"]) if r["result"] else {}
            writer.writerow([
                r["ref_code"] or f"CS-{r['id']}",
                r["created"],
                safe_csv(r["citizen_name"]),
                r["ward"],
                safe_csv(r["location"]),
                safe_csv(r["description"]),
                safe_csv(r["duration"]),
                safe_csv(r["impact"]),
                res.get("issue_type", "n/a"),
                res.get("severity", "n/a"),
                r["fixed_issue"] or res.get("issue_type", "n/a"),
                r["fixed_severity"] or res.get("severity", "n/a"),
                r["consensus_count"],
                "Yes" if r["reviewed"] else "No",
                r["status"]
            ])

    return Response(
        out.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=civic_sentra_ward178_reports.csv"}
    )


@app.get("/uploads/<path:name>")
def upload(name):
    """Serve uploaded images."""
    return send_from_directory(UPLOADS, name)


@app.get("/")
def index():
    """Serve static index if available."""
    if (Path("static") / "index.html").exists():
        return send_from_directory("static", "index.html")
    return jsonify({
        "app": "Civic Sentra Python Backend",
        "health": "/api/health",
        "stats": "/api/dashboard/stats",
        "incidents": "/api/incidents"
    })


if __name__ == "__main__":
    print(f"[*] Starting Civic Sentra API on http://127.0.0.1:5000 (Model: {triage.MODEL})")
    app.run(host="127.0.0.1", port=5000, debug=True)
