"""
Civic issue triage with a local vision model (Ollama).

Setup:
    ollama pull qwen2.5vl:7b
    pip install ollama pydantic

Usage:
    python triage.py photo.jpg
"""
import sys
from typing import Literal, Optional

from ollama import chat
from pydantic import BaseModel, Field

MODEL = "qwen2.5vl:3b"  # change to gemma3:4b etc. if your machine is limited


class Report(BaseModel):
    issue_type: Literal[
        "pothole", "drainage_waterlogging", "garbage", "streetlight", "other", "unclear"
    ]
    visual_findings: str = Field(description="Only what is visible in the photo")
    severity: int = Field(ge=1, le=5, description="1 = minor, 5 = dangerous")
    urgency: Literal["low", "medium", "high"]
    duration_days: Optional[int] = Field(description="Days the problem has persisted, if stated")
    people_affected: str
    location: str
    photo_matches_description: bool
    missing_info: list[str]
    summary: str


SYSTEM_PROMPT = """You triage citizen reports of civic problems (potholes, drainage, garbage, etc.).
You receive a photo and the reporter's details. Rules:
- Describe only what you can actually see in the photo. Do not invent details.
- If the photo and the written description disagree, set photo_matches_description to false.
- Severity: 1 = cosmetic, 2 = nuisance, 3 = disrupts daily life, 4 = significant hazard or
  long-running, 5 = immediate danger to people.
- Raise severity/urgency for long duration, many people affected, or safety risks
  (near schools, hospitals, busy roads, standing water, exposed wires).
- List anything important that is missing or vague in missing_info.
- Keep the summary to two sentences."""


def analyze(image_path: str, description: str, location: str, duration: str, impact: str) -> Report:
    user_text = (
        f"Description: {description}\n"
        f"Location: {location}\n"
        f"How long it has persisted: {duration}\n"
        f"Impact on people: {impact}"
    )
    response = chat(
        model=MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_text, "images": [image_path]},
        ],
        format=Report.model_json_schema(),  # forces output to match the schema
        options={"temperature": 0},
    )
    return Report.model_validate_json(response.message.content)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("Usage: python triage.py <photo>")

    report = analyze(
        image_path=sys.argv[1],
        description="Large pothole in the middle of the road, water collects in it when it rains.",
        location="Anna Nagar 2nd Avenue, Chennai",
        duration="About 3 weeks",
        impact="Two-wheelers swerve to avoid it, one person fell last week.",
    )
    print(report.model_dump_json(indent=2))
