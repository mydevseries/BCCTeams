# Decisions

(One entry per important technical decision: date, decision, reason.)

---

## 2026-11-04 — Open-source alternatives to Microsoft proprietary dependencies

### 1. Document Editing & Presentations (Alternative to Microsoft Office & PowerPoint Live)
- **Features affected:** D-006 (Co-editing documents), M-025 (Built-in slide presentation)
- **Decision:** Use **Collabora Online** integrated via the standard WOPI (Web Application Open Platform Interface) protocol. For in-meeting presentation decks (M-025), use **PDF.js** and **Reveal.js** for client-side slide rendering, speaker notes, and synchronous slide position broadcasting over WebSockets.
- **Reason:** Provides full browser-based viewing and concurrent co-editing of docx, xlsx, and pptx documents without proprietary Microsoft licenses or cloud subscriptions. Clean open-source integration fits our self-hosted architecture.

---

### 2. Calendar Synchronization & Channel Email (Alternative to Microsoft Exchange / Outlook)
- **Features affected:** W-001 (Calendar synchronization), T-015 (Email message into channel)
- **Decision:** Implement calendar sync using open RFC standards: **iCalendar (RFC 5545)** and **CalDAV (RFC 4791)**, alongside official REST APIs for Google Calendar and Microsoft Graph (for external Exchange mailboxes). Channel email ingestion (T-015) uses **Haraka** (open-source, highly extensible Node.js SMTP receiver) parsing MIME messages directly into PostgreSQL and SeaweedFS attachments.
- **Reason:** Completely avoids hard dependencies on on-premise Exchange or Microsoft 365 tenant infrastructure, allowing users to synchronize with any standard corporate or public calendar provider.

---

### 3. File Storage, Versioning, and Libraries (Alternative to Microsoft SharePoint & OneDrive)
- **Features affected:** D-001 through D-008 (Files library, sharing links, version history, recycle bin, checkout)
- **Decision:** Use **SeaweedFS** (high-performance, distributed S3-compatible object storage, Apache-2.0 license) paired with **PostgreSQL** for relational metadata, hierarchical folder structures, chunked uploads, permission evaluation, and version tombstones. (Replaces MinIO, whose community edition is archived and no longer actively maintained).
- **Reason:** SeaweedFS is active, fast, fully S3-compatible, Apache-2.0 licensed, and provides sub-millisecond metadata handling, volume management, and complete self-hosted control.

---

### 4. AI Assistant, Summaries, and Meeting Recaps (Alternative to Microsoft Copilot)
- **Features affected:** I-001 (Unread chat summaries), I-002 (AI assistant), I-003 (Meeting recap & action items), I-004 (Custom AI agents), P-006 (AI assistant)
- **Decision:** Build a **provider-agnostic AI service**. Start with a pluggable **cloud API adapter** supporting standard modern LLM interfaces with streaming responses; self-hosted model runners (e.g. via local inference servers) are an optional subsequent extension. Avoid hardcoding or locking into specific proprietary models.
- **Reason:** Keeps the architecture flexible, cloud/provider-agnostic, and immediately testable without requiring heavy local GPU hardware up front.

---

### 5. Live Collaborative Components in Chat (Alternative to Microsoft Loop)
- **Features affected:** C-024 (Collaborative tables, checklists, and task trackers in messages)
- **Decision:** Use **TipTap + Yjs** (high-performance CRDT library, MIT license) for rich collaborative components, synchronized over Socket.IO binary channels.
- **Reason:** Provides robust offline-tolerant, conflict-free collaborative editing with zero lock-in to proprietary Loop servers.

---

### 6. Video Compositing, Virtual Backgrounds & Together Mode (Alternative to Teams Together Mode)
- **Features affected:** M-012 (Background blur/replace), M-024 (Presenter overlay modes), M-026 (Together Mode)
- **Decision:** Utilize **Google MediaPipe Selfie Segmentation Web SDK** (Apache-2.0) running client-side on WebGL / WebAssembly. Segmented foreground person masks are composited in HTML5 Canvas before injection into LiveKit WebRTC video tracks.
- **Reason:** Zero server-side compute required for background segmentation; works seamlessly in modern Chromium and WebKit browsers.

---

### 7. Real-Time Meeting Captions & Transcription (Alternative to Microsoft Cognitive Services)
- **Features affected:** M-014 (Live captions), M-023 (Transcript without recording), M-038 (Video meeting recap)
- **Decision:** Employ **faster-whisper** / **whisper.cpp** (OpenAI Whisper architecture, MIT license) deployed as a streaming audio worker connected directly to the LiveKit audio track egress or WebRTC audio bridge.
- **Reason:** Delivers accurate multi-language transcription and timestamped diarization completely on-premises with no per-minute cloud billing.
