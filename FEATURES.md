# BCC Teams — Feature List

Status: Todo / In progress / Done / Verified. Build phases in order.
Feature IDs are used with /build-feature <id>.

## Phase 1 — Foundation
| ID | Feature | Status |
|---|---|---|
| F-001 | Sign up, sign in, sign out, password reset | Todo |
| F-002 | User profile: name, photo, job title, department, phone | Todo |
| F-003 | Organization directory: browse and search all users | Todo |
| F-004 | Presence: Available, Busy, Do not disturb, Be right back, Away, Offline; automatic Away after inactivity; custom status message with expiry | Todo |
| F-005 | Settings: theme (light/dark/high contrast), language, notification preferences | Todo |
| F-006 | Roles: org admin, team owner, member, guest | Todo |

Acceptance criteria F-001:
- A new user can register with email and password and lands in the app shell.
- Wrong password shows an error and does not sign in.
- Signing out returns to the sign-in page; protected pages redirect to sign-in.
- Password reset sends a link that lets the user set a new password.

Acceptance criteria F-004:
- Other users see a presence dot on the user's avatar everywhere it appears.
- Changing status updates for other users within 2 seconds without refresh.
- After 5 minutes of inactivity status becomes Away automatically.
- A status message set to "clear after 1 hour" disappears after 1 hour.

## Phase 2 — Chat
| ID | Feature | Status |
|---|---|---|
| C-001 | 1:1 chat: start a new chat with any user | Todo |
| C-002 | Group chat: up to 250 people, optional group name, add/remove people | Todo |
| C-003 | Chat list: recent chats, unread bold + count, pin, mute, hide, mark unread | Todo |
| C-004 | Send messages in real time; typing indicator; sent/read receipts | Todo |
| C-005 | Rich text: bold, italic, underline, strike, lists, quotes, code blocks, links, headings | Todo |
| C-006 | Emoji picker, GIFs, stickers | Todo |
| C-007 | Reactions on messages (like, heart, laugh, surprised, sad, angry + any emoji) | Todo |
| C-008 | Reply to a specific message (quoted reply) | Todo |
| C-009 | Edit and delete own messages (shows "edited"/"deleted") | Todo |
| C-010 | @mentions of people with notifications | Todo |
| C-011 | Attach files and images; image preview; drag and drop; paste images | Todo |
| C-012 | Mark message important or urgent (urgent repeats notification) | Todo |
| C-013 | Save message / bookmarks list | Todo |
| C-014 | Forward and share a message to another chat | Todo |
| C-015 | Pin messages in a chat | Todo |
| C-016 | Link previews | Todo |
| C-017 | Voice messages (mobile later) | Todo |
| C-018 | Chat tabs: Chat, Files, and custom tabs | Todo |
| C-019 | Pop out a chat into its own window | Todo |
| C-020 | Translate a message inline | Todo |

## Phase 3 — Teams and channels
| ID | Feature | Status |
|---|---|---|
| T-001 | Create a team (public/private, from scratch or from a template), name, description, picture | Todo |
| T-002 | Join public teams, join with code, browse teams | Todo |
| T-003 | Manage members and owners; add guests | Todo |
| T-004 | Team settings: member permissions, @mention rules, fun stuff, archive, delete | Todo |
| T-005 | Standard channels visible to all members | Todo |
| T-006 | Private channels with own member list | Todo |
| T-007 | Shared channels with people from other teams | Todo |
| T-008 | Channel posts with threaded replies; new post vs. reply | Todo |
| T-009 | Announcement posts with headline and banner | Todo |
| T-010 | Channel and team mentions (@channel, @team) | Todo |
| T-011 | Channel tabs: Posts, Files, Notes/Wiki, plus added apps/websites | Todo |
| T-012 | Pin, hide, show, reorder channels and teams | Todo |
| T-013 | Channel notifications: all activity, off, custom | Todo |
| T-014 | Channel moderation: who can post, who can reply | Todo |
| T-015 | Email a message into a channel (channel email address) | Todo |

## Phase 4 — Activity, notifications, search
| ID | Feature | Status |
|---|---|---|
| A-001 | Activity feed: mentions, replies, reactions, missed calls, team adds; filters; unread | Todo |
| A-002 | Desktop/browser notifications with quiet hours | Todo |
| A-003 | Email notification digest for missed activity | Todo |
| A-004 | Global search: messages, people, files, with filters (date, from, in, has attachment) | Todo |
| A-005 | Search inside the current chat/channel (Ctrl+F) | Todo |
| A-006 | Command box: "/" commands (e.g. /available, /busy, /goto) | Todo |
| A-007 | Keyboard shortcuts with a shortcuts help dialog | Todo |

## Phase 5 — Files
| ID | Feature | Status |
|---|---|---|
| D-001 | Files app: recent, my files, shared with me, downloads | Todo |
| D-002 | Team/channel file library with folders, upload, download, rename, move, delete | Todo |
| D-003 | File preview in app (images, PDF, video, Office files via preview service) | Todo |
| D-004 | Sharing links with permissions (view/edit, people/org/anyone) | Todo |
| D-005 | Version history and restore | Todo |
| D-006 | Co-editing documents (later: integrate ONLYOFFICE or Collabora) | Todo |

## Phase 6 — Calendar and meetings
| ID | Feature | Status |
|---|---|---|
| M-001 | Calendar: day, work week, week, month views; join from calendar | Todo |
| M-002 | Schedule a meeting: title, attendees, time, recurrence, channel meeting, scheduling assistant (free/busy) | Todo |
| M-003 | Meet now (instant meeting) from chat or channel | Todo |
| M-004 | Pre-join screen: camera/mic preview, device selection, background | Todo |
| M-005 | Video and audio meeting with gallery view, speaker view, together mode-style layout | Todo |
| M-006 | Mute/unmute, camera on/off, active speaker highlight | Todo |
| M-007 | Screen sharing (screen, window, tab) with presenter controls | Todo |
| M-008 | Meeting chat, reactions, raise hand | Todo |
| M-009 | Participants panel: invite, mute others, remove, spotlight, pin | Todo |
| M-010 | Lobby and meeting options (who can bypass lobby, who can present, mute all) | Todo |
| M-011 | Roles: organizer, co-organizer, presenter, attendee | Todo |
| M-012 | Background blur and custom background images | Todo |
| M-013 | Recording, stored in Files, with playback | Todo |
| M-014 | Live captions and transcription | Todo |
| M-015 | Breakout rooms | Todo |
| M-016 | Polls during meetings | Todo |
| M-017 | Whiteboard during meetings (integrate an open-source whiteboard, e.g. Excalidraw) | Todo |
| M-018 | Meeting notes and recap (attendance report, recording, transcript) | Todo |
| M-019 | Webinars with registration; town halls (large broadcast) | Todo |
| M-020 | Guests join by link without an account | Todo |

## Phase 7 — Calls
| ID | Feature | Status |
|---|---|---|
| K-001 | 1:1 and group audio/video calls from chat or profile | Todo |
| K-002 | Incoming call screen with accept/decline; ringtones | Todo |
| K-003 | Call history, missed calls, voicemail | Todo |
| K-004 | Speed dial / contacts | Todo |
| K-005 | Call transfer, hold, call forwarding settings | Todo |
| K-006 | Phone (PSTN) calling via a SIP provider (later) | Todo |

## Phase 8 — Apps and automation
| ID | Feature | Status |
|---|---|---|
| P-001 | Apps page: install apps into chats, channels, meetings | Todo |
| P-002 | Built-in apps: Tasks (planner board), Lists, Approvals, Shifts, Wiki | Todo |
| P-003 | Incoming webhooks and outgoing webhooks for channels | Todo |
| P-004 | Bots API so BCC can build its own bots | Todo |
| P-005 | Workflows (simple automation: when X happens, do Y) | Todo |
| P-006 | AI assistant: summarize chats/meetings, draft replies (later) | Todo |

## Phase 9 — Admin, security, compliance
| ID | Feature | Status |
|---|---|---|
| S-001 | Admin center: users, teams, policies, usage reports | Todo |
| S-002 | SSO (Microsoft Entra ID, Google) and MFA | Todo |
| S-003 | Messaging, meeting and guest policies | Todo |
| S-004 | Retention policies and legal hold | Todo |
| S-005 | Audit log | Todo |
| S-006 | Data export | Todo |
| S-007 | Encryption in transit and at rest; end-to-end encrypted 1:1 calls | Todo |

## Phase 10 — Desktop and mobile
| ID | Feature | Status |
|---|---|---|
| X-001 | Windows/macOS/Linux desktop app with Tauri: tray icon, native notifications, auto-start, auto-update | Todo |
| X-002 | Android and iOS app with Expo: chat, channels, calls, meetings, push notifications | Todo |
| X-003 | Offline support and message sync | Todo |
