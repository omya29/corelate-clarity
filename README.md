# SentinelIQ Insights

You are a senior SOC engineer and security-product UI/UX architect with 20+ years of experience designing Security Operations Center platforms, SIEM dashboards, incident-response workflows, and analyst investigation interfaces.

Build a professional React frontend for my final-year cybersecurity project:

PROJECT NAME:

"SentinelIQ: An AI-Assisted Alert Correlation and Incident Triage System for SOC Analysts"

IMPORTANT:

This is NOT a SIEM replacement.

This is NOT an XDR.

This is NOT an EDR.

This is NOT a SOAR platform.

SentinelIQ is an analysis and incident-triage layer that works on top of Wazuh.

The dashboard must make this workflow visually obvious:

Security Events

      ↓

Wazuh

      ↓

Wazuh Alerts

      ↓

SentinelIQ

      ↓

Alert Correlation

      ↓

XGBoost Incident Triage

      ↓

SHAP Explainability

      ↓

MITRE ATT&CK Context

      ↓

Ollama Local LLM

      ↓

Incident Summary

      ↓

SOC Analyst

==================================================

1. TECHNOLOGY

==================================================

Use:

- React

- TypeScript

- Tailwind CSS

- Recharts

- Modern component architecture

- Responsive design

- Dark SOC interface

- REST API-ready architecture

The frontend should be designed so that it can later communicate with:

FastAPI backend:

http://localhost:8000

Wazuh API is NOT called directly from React.

React communicates only with the SentinelIQ FastAPI backend.

Do not put Wazuh credentials or secrets in frontend code.

==================================================

2. DESIGN PHILOSOPHY

==================================================

Design this as a REAL SOC analyst dashboard.

Do NOT make it look like:

- a generic admin dashboard

- a cryptocurrency dashboard

- a marketing website

- a futuristic neon cyberpunk interface

- an AI chatbot dashboard

The interface should feel like a professional security operations platform.

Priorities:

1. Incident visibility

2. Alert triage

3. Investigation

4. Correlation

5. Explainability

6. MITRE context

7. Analyst decision making

Use a clean dark interface with restrained colors.

Use color primarily for severity:

Critical = red

High = orange/red

Medium = amber/yellow

Low = blue/gray

Do not overuse glowing effects.

==================================================

3. MAIN NAVIGATION

==================================================

Create a left sidebar with:

- Overview

- Incidents

- Alerts

- Investigation

- Correlations

- MITRE ATT&CK

- Analytics

- Reports

- System Status

- Settings

Top bar:

- SentinelIQ logo/name

- Environment: LAB

- Wazuh connection status

- Backend API status

- Notification icon

- Current analyst/user

==================================================

4. OVERVIEW / SOC DASHBOARD

==================================================

Create the main SOC overview page.

Top KPI cards:

- Critical Incidents

- High Priority Incidents

- Open Incidents

- Alerts Today

- Correlated Incidents

- Average Triage Time

Do NOT invent fake performance improvements such as:

"MTTD reduced by 70%"

unless the backend actually provides measured data.

If displaying demo data, clearly label it:

"DEMO DATA"

Create charts:

1. Alerts over time

2. Incidents by severity

3. Alert-to-incident correlation

4. Top affected hosts

5. Top source IPs

6. MITRE technique distribution

Create a "Priority Incident Queue".

Each row should show:

- Incident ID

- Time

- Severity

- Title

- Affected host

- Source IP

- Alert count

- MITRE technique

- Status

- Assigned analyst

Example:

INC-2026-0042

HIGH

Suspicious Authentication Activity

Ubuntu-Server

192.168.1.25

8 alerts

T1078

Investigating

==================================================

5. INCIDENTS PAGE

==================================================

This is the MOST IMPORTANT page.

The purpose is to show how SentinelIQ transforms multiple alerts into meaningful incidents.

Create filters:

- Severity

- Status

- Time

- Host

- Source IP

- MITRE technique

Incident table:

- Incident ID

- Severity

- Incident title

- Alert count

- First seen

- Last seen

- Affected host

- Source

- MITRE technique

- Priority score

- Status

Clicking an incident opens the investigation page.

==================================================

6. INCIDENT INVESTIGATION PAGE

==================================================

Design this like a professional SOC investigation workspace.

Header:

INC-2026-0042

Suspicious Authentication Activity

Severity:

HIGH

Priority Score:

87/100

Status:

INVESTIGATING

Affected Host:

Ubuntu-Server

Source:

192.168.1.25

--------------------------------------------------

SECTION A — INCIDENT SUMMARY

--------------------------------------------------

Show the AI-generated incident summary.

Example demo text:

"Multiple authentication failures from the same source were followed by a successful login and subsequent suspicious command execution on the affected host. The correlated activity requires analyst investigation."

Label clearly:

AI-ASSISTED SUMMARY

Provider:

Ollama / Local LLM

Do not claim that the LLM detected the attack.

The summary is generated from already processed incident information.

--------------------------------------------------

SECTION B — CORRELATED ALERTS

--------------------------------------------------

Show all alerts belonging to the incident.

Example:

Alert 01

Failed SSH authentication

Severity: Medium

10:32:14

Alert 02

Repeated authentication failure

Severity: Medium

10:32:20

Alert 03

Successful authentication

Severity: High

10:33:02

Alert 04

Suspicious command execution

Severity: High

10:33:40

Provide:

- timestamps

- event type

- source IP

- destination host

- Wazuh rule ID

- original severity

Create a visual timeline.

--------------------------------------------------

SECTION C — CORRELATION VIEW

--------------------------------------------------

Create a visual relationship/timeline showing:

Source IP

      ↓

Authentication Failures

      ↓

Successful Login

      ↓

Command Execution

      ↓

File Activity

The purpose is to show why SentinelIQ grouped these alerts into one incident.

Do not create fake attack relationships unless demo data explicitly defines them.

==================================================

7. XGBOOST TRIAGE SECTION

==================================================

Create a card:

"ML-ASSISTED TRIAGE"

Show:

Model:

XGBoost

Prediction:

HIGH PRIORITY

Priority Score:

87 / 100

Do NOT call XGBoost an LLM.

Do NOT say XGBoost generated the incident summary.

Explain:

"XGBoost estimates incident priority from structured incident features."

Show feature inputs:

- Alert count

- Maximum alert severity

- Authentication failures

- Suspicious process activity

- Privilege changes

- Number of affected hosts

- Event frequency

- Time-window characteristics

Only display features actually supplied by the backend.

==================================================

8. SHAP EXPLAINABILITY

==================================================

Create a professional explainability panel:

"WHY WAS THIS INCIDENT PRIORITIZED?"

Show a horizontal feature-contribution chart.

Example:

Maximum Alert Severity       +0.31

Suspicious Process Activity +0.24

Authentication Failures     +0.18

Privilege Change             +0.12

Alert Frequency              +0.08

Clearly explain:

"SHAP values show how individual features influenced the XGBoost prediction."

Do not imply SHAP itself performs prediction.

Include:

Model prediction:

HIGH

Explanation:

Visible feature contributions

==================================================

9. MITRE ATT&CK

==================================================

Create a MITRE ATT&CK section.

Show:

Technique ID

Technique Name

T1078

Valid Accounts

T1059

Command and Scripting Interpreter

Each technique should show:

- ID

- name

- tactic

- evidence

- confidence if available

Do not automatically invent MITRE mappings.

Use backend-provided mappings.

Create a "View in MITRE ATT&CK" button as a placeholder for future integration.

==================================================

10. ALERT DETAILS

==================================================

Allow the analyst to open the original alert.

Show:

- Wazuh rule ID

- Timestamp

- Agent

- Host

- Source IP

- Destination IP

- Username

- Event type

- Severity

- Full raw alert JSON

Add:

"View Raw Event"

Use a collapsible JSON viewer.

==================================================

11. ANALYST ACTIONS

==================================================

Provide realistic analyst actions:

- Assign Incident

- Change Status

- Add Note

- Mark as False Positive

- Escalate

- Close Incident

Do NOT implement automated containment or automated attack response.

SentinelIQ assists the analyst.

The analyst remains the decision maker.

==================================================

12. ALERTS PAGE

==================================================

Show raw Wazuh alerts received by SentinelIQ.

Columns:

- Alert ID

- Timestamp

- Rule ID

- Severity

- Agent

- Host

- Source IP

- Event Type

- Correlation Status

Correlation status:

Correlated

Uncorrelated

Part of Incident

Allow filtering.

==================================================

13. CORRELATIONS PAGE

==================================================

Create a page specifically showing how SentinelIQ groups alerts.

Example:

Correlation Group CG-001

8 alerts

↓

Same source IP

↓

Same host

↓

5-minute time window

↓

Related event types

↓

Incident INC-2026-0042

Make the logic visually understandable to a non-cybersecurity examiner.

==================================================

14. MITRE PAGE

==================================================

Create a MITRE overview.

Show:

- Techniques observed

- Tactics

- Technique frequency

- Incident relationships

Use a matrix-style visualization if appropriate.

Do not create a fake full MITRE ATT&CK implementation.

Only display techniques returned by backend data.

==================================================

15. ANALYTICS PAGE

==================================================

Show historical analytics:

- Alerts per day

- Incidents per day

- Severity distribution

- Correlation rate

- False-positive rate

- Analyst triage time

Important:

If metrics are not available from the backend, show:

"Awaiting backend data"

Do NOT fabricate real-world performance claims.

==================================================

16. REPORTS PAGE

==================================================

Allow the analyst to generate/view incident reports.

Report should contain:

- Incident ID

- Date/time

- Affected host

- Source

- Related alerts

- Correlation information

- Priority

- XGBoost prediction

- SHAP explanation

- MITRE techniques

- AI-assisted summary

- Analyst notes

- Final status

==================================================

17. SYSTEM STATUS PAGE

==================================================

Show component health:

Wazuh API

CONNECTED / DISCONNECTED

FastAPI

CONNECTED / DISCONNECTED

PostgreSQL

CONNECTED / DISCONNECTED

XGBoost Model

LOADED / NOT LOADED

SHAP

AVAILABLE / NOT AVAILABLE

Ollama

CONNECTED / DISCONNECTED

React Frontend

ONLINE

Use realistic status indicators.

Do not hardcode "CONNECTED" once backend integration exists.

==================================================

18. DATA FLOW

==================================================

The UI must reflect this actual architecture:

Security Events

        ↓

Wazuh

        ↓

Wazuh API

        ↓

FastAPI

        ↓

Alert Ingestion

        ↓

Parsing & Normalization

        ↓

Alert Correlation

        ↓

Incident Triage

        ↓

XGBoost

        ↓

SHAP

        ↓

MITRE ATT&CK Mapping

        ↓

Ollama Local LLM

        ↓

PostgreSQL

        ↓

React Dashboard

        ↓

SOC Analyst

IMPORTANT:

React must NOT directly call Wazuh.

React communicates with FastAPI.

==================================================

19. BACKEND API DESIGN

==================================================

Design the frontend with API service functions ready for:

GET /api/health

GET /api/alerts

GET /api/alerts/{id}

GET /api/incidents

GET /api/incidents/{id}

GET /api/incidents/{id}/alerts

GET /api/incidents/{id}/explanation

GET /api/incidents/{id}/mitre

GET /api/dashboard/metrics

PATCH /api/incidents/{id}/status

POST /api/incidents/{id}/notes

POST /api/incidents/{id}/assign

POST /api/incidents/{id}/summary

Do not assume these endpoints already exist.

Create a clean API service layer so they can be connected later.

==================================================

20. DEMO MODE

==================================================

Create a DEMO MODE so the UI works before the backend is finished.

Clearly label demo data.

Use realistic SOC examples:

- Failed SSH login

- Successful login

- Suspicious PowerShell execution

- Privilege escalation

- Suspicious file creation

- Authentication anomalies

Do not use real people's information.

Create enough demo data to demonstrate:

1. Multiple alerts

2. Alert correlation

3. Incident creation

4. Priority scoring

5. SHAP explanation

6. MITRE mapping

7. AI summary

8. Analyst workflow

==================================================

21. CRITICAL TECHNICAL RULES

==================================================

DO NOT:

- claim SentinelIQ replaces Wazuh

- claim XGBoost detects attacks

- claim SHAP performs prediction

- claim Ollama detects attacks

- claim the LLM determines severity

- expose Wazuh credentials in React

- directly connect React to Wazuh

- invent MITRE mappings

- invent performance statistics

- invent security detections

- create fake "real-time" functionality without backend support

The correct responsibilities are:

Wazuh:

Security event collection and alert generation

SentinelIQ:

Alert ingestion, normalization, correlation, incident triage, explainability, MITRE context and analyst assistance

XGBoost:

Incident priority/severity prediction

SHAP:

Explanation of XGBoost prediction

Ollama + LLM:

Human-readable incident summary

PostgreSQL:

Persist processed incidents and related information

React:

SOC analyst interface

==================================================

22. VISUAL QUALITY

==================================================

Make the dashboard look like a serious cybersecurity product.

Use:

- clear hierarchy

- compact tables

- readable typography

- severity badges

- professional charts

- investigation timelines

- expandable panels

- tooltips

- filtering

- search

- pagination

- responsive layout

Avoid:

- excessive gradients

- giant cards

- excessive animations

- hacker imagery

- skulls

- Matrix rain

- neon green everywhere

- unnecessary 3D graphics

The dashboard should look credible enough to demonstrate to a SOC professional.

==================================================

23. FINAL DEMONSTRATION FLOW

==================================================

The dashboard should support this demonstration:

1. Start Wazuh.

2. Start SentinelIQ FastAPI backend.

3. Start Ollama.

4. Start React dashboard.

5. Launch an attack simulation from Kali against the Ubuntu server.

6. Wazuh detects the resulting events and generates alerts.

7. SentinelIQ retrieves the alerts through Wazuh API.

8. Alerts appear in the Alerts page.

9. Related alerts are correlated.

10. An incident appears in the Incident Queue.

11. XGBoost provides the incident priority.

12. SHAP shows why the model produced that priority.

13. MITRE techniques are displayed from available evidence/mapping.

14. Ollama generates an analyst-friendly incident summary.

15. PostgreSQL stores the incident.

16. The SOC analyst investigates and updates the incident status.

Build the frontend so this entire workflow can be demonstrated clearly.

==================================================

24. MOST IMPORTANT UI PRINCIPLE

==================================================

A SOC analyst should be able to answer these questions within seconds:

1. What happened?

2. How serious is it?

3. Which alerts are related?

4. Why was it prioritized?

5. Which host/user is affected?

6. What MITRE technique is involved?

7. What should I investigate?

8. What did the AI summarize?

9. What action has the analyst taken?

Design the interface around these questions.

Start by building the complete frontend with realistic DEMO MODE data and a clean API abstraction layer.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://corelate-clarity.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b904bf4f-6feb-495a-9361-5267455f0b11).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
