# Implementation Plan: Visual Stage Upgrades for the "Run Intake" Demo

This document outlines the visual, aesthetic, and functional upgrades to the **Groundstate** dashboard to make it highly engaging, dramatic, and clear for judges on stage during the Google I/O Hackathon.

## User Review Required

> [!IMPORTANT]
> **Stage Presentation Mode:**
> All upgrades are backwards-compatible and preserve the existing local Gemma-3n & Cloud Gemini Workspace pipelines.
>
> We are restructuring the layout from a standard **2-column layout** to a high-fidelity **3-column dashboard** (`Local Laptop` -> `Firewall Seam` -> `Cloud Agent` -> `Live Workspace State`) to maximize visual understanding from a distance on a projector screen.

---

## Proposed Changes

We will implement four high-impact stage enhancements:

```
+---------------------------------------------------------------------------------------------------+
|                                  GROUNDSTATE HACKATHON DASHBOARD                                  |
+-----------------------------------+-----------------------------------+---------------------------+
|  [COLUMN 1: LOCAL ATTORNEY LAPTOP] |   [COLUMN 2: CLOUD ORCHESTRATOR]  |  [COLUMN 3: LIVE STATE]   |
|  • Ingest Presets / Live Mic      |   • Sanitized Payload (JSON)      |  • Live side-by-side      |
|  • Audio Waveform (SVG animated)  |   • Workspace Actions Ledger      |    Calendar Timeline      |
|  • Pipeline Logs & Raw Transcript |   • Agent Reasoning Stream        |    (Conflict -> Resolved) |
|  • Privileged Memo (Local Disk)   |                                   |  • Gmail Draft Preview    |
+-----------------------------------+-----------------------------------+---------------------------+
|                                    [SECURITY BOUNDARY WALL]                                       |
|                  Animated transit particles cross the firewall during sanitization                |
+---------------------------------------------------------------------------------------------------+
```

### 1. Interactive Side-by-Side Weekly Calendar Panel
* **Purpose:** The primary business logic (rescheduling Matthieu's hairdressing appointment to Wed 15:30 to fit the lawyer's single open Wed 14:00 slot) is currently invisible on-screen. We will render a weekly schedule grid (Monday, Tuesday, Wednesday) showing both calendars side-by-side.
* **States:**
  - **Initial State:** Client's hairdresser appointment on Wednesday 14:00 overlaps with the Lawyer's only free slot. Rendered in a pulsing **alert-red conflict halo** with text: `"⚠️ CONFLICT: Wednesday 14:00"`.
  - **Resolution State:** The hairdresser event smoothly slides down to 15:30, and a brand-new glowing green event **`⚖️ Case Consultation`** pops in at 14:00 on both columns. The header flashes green: `"✅ CONFLICT AUTOMATICALLY RESOLVED"`.
* **APIs:** Add `/api/calendar/events` to FastAPI to retrieve both calendar events dynamically for initial render and post-resolution updates.

### 2. Physical Glowing "Security Firewall Boundary"
* **Purpose:** Clearly illustrate the physical separation between what stays local (laptop) and what goes to the cloud.
* **Design:** We will place an animated vertical laser divider between Column 1 (Local) and Column 2 (Cloud).
* **Animation:** When Gemma sanitizes the transcript, a glowing data packet floats from Column 1, flashes/scans across the firewall seam (triggering a laser scanning effect), strips PII (banana bread, Tartine, Matthieu disappear from the packet text), and lands on Column 2 as a safe, content-free JSON payload.

### 3. Dynamic Bouncing Audio Waveform Visualizer
* **Purpose:** Make sound capture and simulated ingestion feel alive and reactive.
* **Design:** A premium SVG/Canvas voice visualizer placed inside the local column. When "Run Intake" or "Live Mic" is clicked, gradient neon bars bounce dynamically. During processing, it sweeps across the text displays with a "neural matrix scan" effect.

### 4. Interactive Demo Flow Presets
* **Purpose:** Allow the presenter to showcase all of Groundstate's capabilities (not just calendar rescheduling, but also statutory legal research and Imagen 3 slide generation) with single clicks.
* **Presets:**
  1. **"Confession Intake (Conflict Demo)"** (Runs the main stolen banana bread audio, resolves calendar conflicts, drafts email).
  2. **"Statutes Grounding (Web Research)"** (Runs web grounding tool to fetch Petty Theft PC 484 penalties and displays a research binder).
  3. **"Imagen Slide Creator (Imagen 3)"** (Generates a slide mockup of a "secure client vault door" using Imagen 3 and renders it inline in the reasoning log with a beautiful reveal).

---

## Component Updates

### 1. [MODIFY] [main.py](file:///Users/mgsa/Code/Groundstate/src/main.py)
* Add `/api/calendar/events` endpoint to retrieve Lawyer and Client calendar schedules.
* Extend the `/api/pipeline/run` endpoint's `mode` parameter to support `"research"` and `"slide"` presets.
* Seed high-fidelity payloads for the presets to guarantee flawless execution without MLX lag on stage.

### 2. [MODIFY] [index.html](file:///Users/mgsa/Code/Groundstate/src/static/index.html)
* Rework layout into a stunning 3-column configuration using CSS grid.
* Add full styling and DOM structures for the **Live side-by-side Calendar**, **Animated Firewall Barrier**, **SVG Audio Visualizer**, and **Quick Presets pills**.
* Implement Javascript handlers to pull data from `/api/calendar/events` on page load, setup, and completed steps.
* Add beautiful custom animations for the data packet cross-over, calendar shift, and Imagen slide fade-in.

---

## Verification Plan

### Automated/Local Tests
* Run the FastAPI server:
  ```bash
  uvicorn src.main:app --reload --port 8000
  ```
* Verify in the browser that the 3-column dashboard renders beautifully.
* Test each of the three presets:
  - Verify **Confession Intake** seeds the calendars, highlights the red conflict, runs the local transcript, sanitizes, triggers the cloud agent, animates the calendar resolution, and drafts the email.
  - Verify **Statutes Grounding** queries the web search tool and outputs the formatted California Penal Code 484.
  - Verify **Imagen Slide Creator** queries Imagen 3, generates `/static/generated_slide.png`, and displays the image inline in the agent reasoning stream.
* Perform the "Confidentiality Proof" query ("Who stole the banana bread?") and verify that the agent blocks it and maintains security.
