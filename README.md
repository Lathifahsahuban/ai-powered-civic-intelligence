# ai-powered-civic-intelligence
## 🚀 Live Prototype

**Explore our working dashboard:** https://ai.studio/apps/c374b283-2f75-46cd-9539-e45c4c2d080f

Try our interactive prototype to explore the civic issue reporting dashboard and its features.

ai-powered civic intelligence system to identify,classify,and prioritize recurring civic problems
Civic Issue Triage
A small tool that takes a citizen's report about a civic problem, a photo plus a short description, location, duration, and impact on people, and turns it into a structured assessment: what the problem is, how severe and urgent it is, whether it is an immediate hazard, and whether a human should review it.

It runs entirely on your own machine using a local vision model through Ollama. No data leaves your computer.

Status: starter project. The prompt and test set are in place, but accuracy has not yet been measured on real photos. Run the evaluation (below) before relying on the output.
What it handles
Ten topics, plus two fallback labels:

Issue type
Examples
waterlogging_flooding
Flooded roads, water entering homes, flooded underpasses
blocked_drain_sewage
Choked drains, sewage overflow
garbage_waste
Overflowing bins, dumping, burning waste
pothole_road_damage
Potholes, cracks, sinkholes, damaged speed breakers
streetlight_failure
Dead or flickering lights, exposed wiring on poles
water_supply_leakage
Burst pipes, leaks, discoloured or contaminated drinking water
fallen_tree_branch
Fallen trees, dangerous hanging branches
traffic_signal_pedestrian_safety
Dead signals, missing or faded crossings
open_manhole_drain_cover
Missing or broken manhole and drain covers
public_toilet_sanitation
Locked, dirty, waterless, or overflowing public toilets
other, unclear
Anything else, or a photo that shows no civic problem

How it works
The photo and the user's text are sent together to a local vision model.
The model is given written rules for each topic (what makes it more or less severe) and must answer in a fixed JSON format, enforced with a schema.
Plain code, not the model, decides whether the case needs human review. A case is flagged when severity is 4 or 5, there is an immediate hazard, the photo does not match the description, the type is other or unclear, or three or more details are missing.

Severity scale: 1 = cosmetic, 2 = nuisance, 3 = disrupts daily life, 4 = significant hazard or long-running, 5 = immediate danger to people. Urgency follows from it: 4-5 high, 3 medium, 1-2 low.

Example output (illustrative):

{

  "issue_type": "waterlogging_flooding",

  "secondary_issue_type": null,

  "visual_findings": "Knee-deep water across the full width of the road, a two-wheeler stalled",

  "severity": 4,

  "urgency": "high",

  "immediate_hazard": false,

  "duration_days": 2,

  "people_affected": "Commuters, bus passengers, nearby shops",

  "location": "Main Road, Ward 12",

  "photo_matches_description": "yes",

  "missing_info": [],

  "summary": "Knee-deep flooding has blocked the main road for two days. Buses and shops are affected.",

  "needs_human_review": true

}
Setup
You need Python 3.9+ and Ollama.

# 1. Pull a vision model (about 6 GB, wants ~8 GB of RAM/VRAM)

ollama pull qwen2.5vl:7b

# On a weaker machine: ollama pull gemma3:4b

# 2. Install the Python libraries

pip install -r requirements.txt

If you use a different model, change MODEL at the top of triage.py, or pass --model to the evaluation script.
Usage
Triage a single report:

python triage.py photos/flood_001.jpg \

  --description "Knee-deep water on the road, cars stalling" \

  --location "Main Road, Ward 12" \

  --duration "2 days" \

  --impact "Buses stopped, shops closed"

On Windows, put the command on one line without the backslashes.
The test set: scenarios.csv
500 labeled scenarios, 50 per topic. Each row says what the photo should show and what the user would write, along with the correct answer.

Column
Meaning
id
Row id, also the photo filename (for example flood_001)
split
train (400 rows) or test (100 rows)
topic
One of the ten topics
photo_brief
What to photograph for this row
description, location, duration, impact
What the user would type
expected_issue_type, expected_severity, expected_urgency
Correct classification
expected_immediate_hazard
true if someone could be hurt right now
expected_photo_match
yes, no, or cannot_tell
expected_missing_info
What the model should ask for when details are missing


Each topic has 42 clear reports, 4 reports with missing or vague details, and 4 where the photo does not match the description.

Things to know:

The scenarios are synthetic text. There are no photos in this repo. Use photo_brief as a shot list and add real photos named after each id.
The labels were written from the severity rules in triage.py, not by a municipal authority. Review them, especially the test rows, and change any you disagree with.
Wording is repetitive by design. Add real user messages, including regional languages, as you collect them.

To regenerate or extend the set, edit the situations in generate_scenarios.py and run python generate_scenarios.py.
Evaluating the model
Put photos in a photos/ folder named after the row id (flood_001.jpg, garbage_014.png, and so on), then:

python evaluate.py --photos ./photos --check                          # count photos found, no model calls

python evaluate.py --photos ./photos --topic garbage_waste --limit 5  # quick trial

python evaluate.py --photos ./photos                                  # full test split

python evaluate.py --photos ./photos --split all                      # train and test rows

It prints a summary and writes every prediction to results.csv. Read the numbers in this order:

Hazards caught. Missing a real danger (an open manhole, wires near water) is the worst kind of error.
Issue-type mix-ups. Repeated confusions show which rules to sharpen in the prompt.
Severity within 1. Exact matches will be lower, and people disagree by a point too.
Improving it
Run the evaluation and look at the mistakes in results.csv.
Sharpen the CATEGORY_GUIDE text in triage.py, or add worked examples to the prompt, then re-run.
Only consider fine-tuning if accuracy stops improving. It needs a GPU and a separate toolchain.
Limits
This is a triage aid, not a decision-maker. High-severity and unclear cases should always be reviewed by a person.
Photos may contain faces, number plates, or home locations. Blur them, and keep photos/ out of public repositories.
Daytime photos cannot prove a streetlight is off, and a photo of a tap cannot prove how long water has been missing. The model is told to answer cannot_tell in cases like these.
Files
triage.py               Runs the model on one report

evaluate.py             Scores the model against scenarios.csv

generate_scenarios.py   Builds scenarios.csv

scenarios.csv           500 labeled test scenarios

requirements.txt        ollama, pydantic 

