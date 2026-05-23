# Groundstate — Hackathon Demo Video Prompt

---

## The Prompt

You are helping me record a **40-second** hackathon demo video for **Groundstate** — a privacy-preserving voice workspace agent built today at the Google I/O Hackathon, powered by **Gemini 3.5 Flash running as a managed agent** with multi-step tool orchestration. The judges score on Live Demo (45%), Creativity / Originality (35%), and Impact (20%), plus a separate **$5,000 bonus for best use of managed agents** — so "Gemini 3.5 Flash" and "managed agent" must both be named on screen, and the multi-step tool execution must be visibly happening, not narrated over a still. Every claim is backed by something visible on screen — no hedging, no magic.

The 40 seconds must do four things, in order: (a) make an originality claim in the first ~5 seconds, (b) prove that sensitive context never leaves the device, (c) show Gemini 3.5 Flash executing a real multi-step workflow against Google Calendar from a sanitized payload alone, (d) end on a confidentiality proof. This is the **submission video** — the separate 3-minute live judging demo is not in scope here.

Your job is **not** to record the video. Your job is to **drive the live pipeline end-to-end on my machine** while I screen-record, so that every beat lands cleanly. Treat this as a stage-managed run-through: you set the stage, cue each scene, narrate what should be highlighted, and verify the artifact each step produces before moving on.

### Setup (do this before I hit record)

1. Confirm `.env` has `GEMINI_API_KEY`, `GOOGLE_OAUTH_CLIENT_SECRETS`, and `DEFAULT_TIMEZONE` set. Do not print the values — just confirm presence.
2. Confirm `credentials/client_secret.json` exists.
3. Delete `local_case_files/privileged_memo.txt` and `local_case_files/live_capture.wav` so we start from a clean slate the camera can see being created.
4. Start the server in the background: `uvicorn src.main:app --reload --port 8000`. Tail the log so you can flag errors. Do not proceed until you see `Application startup complete`.
5. Hit `GET /api/calendar/setup` once to pre-populate the lawyer + client calendars with the conflicting events (lawyer fully booked except Wed 2–3 PM, client has hairdresser 2–3:30 PM Wed). Confirm the JSON response shows both calendars seeded.
6. Open `http://localhost:8000/` in my browser. Verify the dashboard renders with the local enclave (cream panel) on the left and the cloud gateway (paper-blue panel) on the right. If the layout looks broken, stop and tell me — we do not record over a broken UI.

When all six checks pass, print exactly: **`READY TO RECORD — cue me when you are rolling.`** Then wait for me to say "rolling."

### Recording plan — 5 scenes, ~8s each (40s total)

For each scene below, when I say "next," you execute the action, then in chat give me (a) the voice-over line I should read, (b) what the camera should be looking at, and (c) what visual change to wait for before cutting. **Voice-over lines must be ≤ 12 words** so they fit in an 8-second scene at a natural speaking pace. The two model names — *Gemma 3n* and *Gemini 3.5 Flash* — and the phrase *"managed agent"* must each appear in the audio at least once across the cut. Originality, privacy, and the multi-step agentic workflow are the three claims to land.

**Scene 1 — The originality claim (~5s).**
- Action: dashboard idle. Title card overlay or lower-third on top of the idle UI: *"Groundstate — privilege-grade privacy for cloud agents. Built today."*
- Voice-over: *"Cloud agents can't see attorney-client secrets. Until now."*
- Camera: full dashboard, both panels visible, title card lower-third.
- Cue to cut: 2 seconds of stillness after the line lands.

**Scene 2 — Local capture and the privileged memo (~9s).**
- Action: trigger the pipeline in **simulated** mode via the dashboard's run button (uses `assets/confession.wav` if present, otherwise the safe mock transcript). Watch SSE events `local_transcript` and `local_memo` populate.
- Voice-over: *"Gemma 3n transcribes on-device. The privileged memo stays on the lawyer's disk."*
- Camera: zoom on the cream "local enclave" panel as the transcript and memo stream in. The words "Tartine Bakery" and "banana bread" must be legible on screen — that's the entire payload of this scene.
- Cue to cut: privileged memo fully rendered with disk path `local_case_files/privileged_memo.txt` visible. **This is one of two load-bearing frames in the whole video — if it's not crisp, re-shoot.**

**Scene 3 — The firewall (~6s).**
- Action: the `sanitized_payload` SSE event fires automatically. Do not click — let it animate.
- Voice-over: *"Only this sanitized JSON crosses the wire. Four fields. No PII."*
- Camera: pan to the sanitized payload card. The four-field JSON (`action`, `urgency`, `duration_minutes`, `priority`) is the only thing in focus, ideally side-by-side with the privileged memo for contrast.
- Cue to cut: 1.5-second hold on the side-by-side. This is the privacy argument visualized.

**Scene 4 — Gemini 3.5 Flash managed agent books and rebooks (~12s).**
- Action: the agent stream begins automatically. Watch the action ledger fill with the four tool calls in order: `list_upcoming_events` → `reschedule_conflicting_appointment` → `schedule_consultation` → `draft_confirmation_email`. Then `appointments_update` and `email_draft` fire.
- Voice-over (split across the scene): *"Gemini 3.5 Flash, as a managed agent, runs four tools: reads both calendars, moves the client's haircut, books the consultation, drafts the email."*
- Camera: follow the action ledger top-to-bottom as each row flips `running` → `done`. Then cut to the email draft card. The email body must mention the rescheduled hairdresser slot and must **not** mention banana bread or Tartine.
- Cue to cut: ledger fully green, email draft visible, "Saved as draft · not sent" badge showing. This frame is what unlocks the $5K managed-agent bonus — if any tool call fails or the ledger is incomplete, re-shoot.

**Scene 5 — The interrogation (~8s, the punchline).**
- Action: in the "Verify · ask the cloud agent anything" chat box, send `Who stole the banana bread?` via the proof endpoint. The interaction ID from Scene 4 must be reused — verify it in the network panel before claiming success.
- Voice-over: *"We ask the cloud agent for the secret. It doesn't know."*
- Camera: full-frame on the chat container. The refusal fills the bubble. End frame: refusal on the right, privileged memo still visible on the left.
- Cue to cut: hold 2 seconds on the contrast frame, then fade. **This is the second load-bearing frame.**

### After recording

1. Stop the uvicorn server.
2. Show me the contents of `local_case_files/privileged_memo.txt` so I have a still I can drop into the video as a B-roll insert.
3. Print the four sanitized JSON fields and the email draft body as plain text so I can use them as on-screen captions if any take is illegible.
4. Generate a one-screen "Built today" credit card listing only what we built at the hackathon (the orchestrator + SSE stream in `src/main.py`, the local sanitization in `src/local_llm.py`, the managed-agent harness in `src/gemini_agent.py`, the calendar conflict-resolution tools in `src/workspace/calendar.py`, and the dashboard UI). This addresses the rule that the video must *clearly identify original contributions* — without it we risk disqualification. I'll splice it in as the final frame.
5. Do **not** delete the case files or live capture — I may need to re-shoot a scene.

### Recovery rules

- If the Gemini call fails mid-scene, **stop immediately**, tell me which scene broke, suggest one fix, and wait. Do not silently fall back to mock — the demo's credibility depends on the cloud call being real.
- If the calendar setup endpoint returns events that don't match the "lawyer fully booked except Wed 2–3 PM" shape, re-seed it before we resume. The conflict-resolution beat (Scene 4) is the whole point of the workflow showcase; if it's degraded, we re-shoot.
- If I say "cut," pause everything and wait for "rolling" again. Never resume the pipeline on your own.

### Tone

Every voice-over line should sound like a product claim a CTO would say at a board meeting — declarative, no hedging, no "we tried to" or "ideally." The UI does the proving; the narration just points.

---

## Notes for the human (you, not Claude Code)

- The five-scene structure maps 1:1 to the SSE events in `src/main.py:run_pipeline` — there's no improvisation Claude Code has to do, just stage-management.
- Scene 2's "Tartine / banana bread" frame and Scene 5's refusal frame are the **two** shots the whole video lives or dies on. If you only get those two clean, the cut still works.
- For the screen recording itself, I'd recommend ScreenStudio or CleanShot (smooth cursor + auto-zoom). Set the dashboard zoom to 110–125% so JSON keys are legible at 1080p.

### Hackathon rule alignment — checklist before submitting

- [ ] Video is ≤ 60 seconds (rule cap; this prompt targets 40s).
- [ ] "Gemini 3.5 Flash" appears in the voice-over (problem statement requires it).
- [ ] "Managed agent" appears in voice-over **and** the multi-step tool execution is visibly happening on screen (unlocks the $5K bonus prize).
- [ ] Multi-step / agentic workflow framing is explicit — Scene 4's four-tool ledger is the proof.
- [ ] "Built today" credit card lists only what the team produced at the event (rule: original contributions must be clearly identifiable, or disqualification).
- [ ] Repository is **public** on GitHub before submitting (rule requirement).
- [ ] Submission form filled at `cerebralvalley.ai/e/google-io-hackathon/hackathon/submit` with all teammates added.
- [ ] Separate plan exists for the **3-minute live judging demo** — that's a different artifact from this video, with Q&A buffer and slower pacing. Don't re-use this prompt for the live demo.
- Keep total runtime ≤ 120s — hackathon judges skim. Five scenes × ~20s is the right budget.
- If you want a cold-open hook, splice a 2-second pre-roll of the privileged memo being written to disk (Finder window showing the file appear) before Scene 1. It frames the whole video as "watch what *doesn't* leave this folder."
