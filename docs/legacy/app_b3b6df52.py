"""Civic Issue Triage website.   Run:  python app.py   then open http://localhost:5000"""
import csv, io, json, sqlite3, uuid
from datetime import datetime
from pathlib import Path
from typing import get_args

from flask import Flask, Response, jsonify, request, send_from_directory

import triage

BASE = Path(__file__).parent
UPLOADS = BASE / "uploads"
UPLOADS.mkdir(exist_ok=True)
EXTS = {".jpg", ".jpeg", ".png", ".webp"}
ISSUE_TYPES = set(get_args(triage.IssueType))

app = Flask(__name__, static_folder="static")
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024  # 10 MB photos


def db():
    con = sqlite3.connect(BASE / "reports.db")
    con.row_factory = sqlite3.Row
    return con


with db() as con:
    con.execute("""CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT, created TEXT, photo TEXT,
        description TEXT, location TEXT, duration TEXT, impact TEXT,
        result TEXT, review INTEGER, reviewed INTEGER DEFAULT 0,
        fixed_issue TEXT, fixed_severity INTEGER)""")


def view(r):
    res = json.loads(r["result"])
    return dict(id=r["id"], created=r["created"], photo="/uploads/" + r["photo"],
                description=r["description"], location=r["location"],
                duration=r["duration"], impact=r["impact"], result=res,
                reviewed=bool(r["reviewed"]),
                final_issue=r["fixed_issue"] or res["issue_type"],
                final_severity=r["fixed_severity"] or res["severity"])


@app.get("/")
def index():
    return send_from_directory("static", "index.html")


@app.get("/uploads/<path:name>")
def upload(name):
    return send_from_directory(UPLOADS, name)


@app.post("/api/triage")
def triage_report():
    photo = request.files.get("photo")
    ext = Path(photo.filename).suffix.lower() if photo else ""
    if ext not in EXTS:
        return jsonify(error="Please attach a photo (jpg, png or webp)."), 400
    f = {k: request.form.get(k, "").strip() or "not provided"
         for k in ("description", "location", "duration", "impact")}
    name = uuid.uuid4().hex + ext
    photo.save(UPLOADS / name)
    try:
        rep = triage.analyze(str(UPLOADS / name), f["description"], f["location"],
                             f["duration"], f["impact"])
    except Exception as e:
        (UPLOADS / name).unlink(missing_ok=True)
        return jsonify(error=f"The model could not analyze this report. "
                             f"Is Ollama running? ({e})"), 502
    res = rep.model_dump()
    res["needs_human_review"] = triage.needs_human_review(rep)
    with db() as con:
        cur = con.execute(
            "INSERT INTO reports (created, photo, description, location, duration, impact,"
            " result, review) VALUES (?,?,?,?,?,?,?,?)",
            (datetime.now().strftime("%Y-%m-%d %H:%M"), name, f["description"],
             f["location"], f["duration"], f["impact"], json.dumps(res),
             int(res["needs_human_review"])))
    res["id"] = cur.lastrowid
    return jsonify(res)


@app.get("/api/reports")
def reports():
    sql = "SELECT * FROM reports"
    if request.args.get("review_only"):
        sql += " WHERE review=1 AND reviewed=0"
    items = [view(r) for r in db().execute(sql)]
    items.sort(key=lambda x: (x["reviewed"], -x["final_severity"], -x["id"]))
    return jsonify(items)


@app.post("/api/reports/<int:rid>/review")
def review(rid):
    d = request.get_json(silent=True) or {}
    if d.get("issue_type") not in ISSUE_TYPES or d.get("severity") not in (1, 2, 3, 4, 5):
        return jsonify(error="Invalid review."), 400
    with db() as con:
        con.execute("UPDATE reports SET reviewed=1, fixed_issue=?, fixed_severity=? WHERE id=?",
                    (d["issue_type"], d["severity"], rid))
    return jsonify(ok=True)


def safe(v):  # stop spreadsheet formula injection from user-typed text
    v = str(v)
    return "'" + v if v[:1] in "=+-@" else v


@app.get("/api/export.csv")
def export():
    out = io.StringIO()
    w = csv.writer(out)
    w.writerow(["id", "created", "photo", "description", "location", "duration", "impact",
                "model_issue_type", "model_severity", "final_issue_type",
                "final_severity", "reviewed"])
    for r in map(view, db().execute("SELECT * FROM reports ORDER BY id")):
        w.writerow([r["id"], r["created"], r["photo"].split("/")[-1], safe(r["description"]),
                    safe(r["location"]), safe(r["duration"]), safe(r["impact"]),
                    r["result"]["issue_type"], r["result"]["severity"], r["final_issue"],
                    r["final_severity"], int(r["reviewed"])])
    return Response(out.getvalue(), mimetype="text/csv",
                    headers={"Content-Disposition": "attachment; filename=reports.csv"})


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000)
