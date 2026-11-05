# BCC Teams — Feature List

Status: Todo / In progress / Done / Verified. Build phases in order.
Feature IDs are used with /build-feature <id>.

---

## Phase 1 — Foundation
| ID | Feature | Status |
|---|---|---|
| F-001 | Sign up, sign in, sign out, password reset | Verified |
| F-002 | User profile: name, photo, job title, department, phone | Verified |
| F-003 | Organization directory: browse and search all users | Verified |
| F-004 | Presence: Available, Busy, Do not disturb, Be right back, Away, Offline; automatic Away after inactivity; custom status message with expiry | Verified |
| F-005 | Settings: theme (light/dark/high contrast), language, notification preferences | Todo |
| F-006 | Roles: org admin, team owner, member, guest | Todo |
| F-007 | Multiple accounts and organizations: sign into multiple accounts with fast tenant switching | Todo |
| F-008 | Immersive Reader: distraction-free reading mode with text-to-speech, font sizing, and syllable highlighting | Todo |
| F-009 | Accessibility preferences: high contrast mode, screen reader landmarks, keyboard focus traps, reduced animation | Todo |

### Acceptance criteria — Phase 1

#### Acceptance criteria F-001:
- A new user can register with valid email, name, and password and is redirected to the main app shell.
- Submitting an invalid email format or password under 8 characters displays clear inline validation errors without submitting.
- Entering an incorrect password on the sign-in form displays an authentication failure error and denies access.
- Signing out invalidates the current session token in Redis and redirects to the sign-in page.
- Direct navigation to protected application routes while unauthenticated redirects immediately to the sign-in page.
- Requesting a password reset generates a cryptographically secure, time-limited token link that allows setting a new password.

#### Acceptance criteria F-002:
- A user can view their full profile card including avatar, display name, job title, department, email, and phone number.
- A user can edit and update their display name, job title, department, and phone number with immediate persistence to PostgreSQL.
- A user can upload an image (PNG/JPEG up to 5MB) as their profile photo, automatically generating thumbnails stored in SeaweedFS (S3-compatible).
- A user can remove their custom photo, reverting immediately to the default initials avatar on a colored circle.
- Viewing another member's profile card displays their contact information, department, local time, and current presence indicator.

#### Acceptance criteria F-003:
- The organization directory lists all active users in the company alphabetically.
- Typing in the directory search input filters users in real time (< 300ms) by name, job title, department, or email.
- Selecting a user in the directory opens their contact details card with quick action buttons (Chat, Call, Email).
- Inactive or suspended user accounts are automatically excluded from the standard user directory.
- Directory results utilize virtualized scrolling or pagination to ensure smooth rendering with thousands of user records.

#### Acceptance criteria F-004:
- Other users see a presence badge (color dot and status icon) on the user's avatar everywhere it appears in the interface.
- Changing status (Available, Busy, Do not disturb, Be right back, Away, Offline) broadcasts via WebSocket to connected clients within 2 seconds.
- Inactivity of 5 minutes without mouse or keyboard input automatically transitions presence status to Away.
- Resuming user activity automatically restores presence status from Away back to Available.
- Setting status to "Do not disturb" silences incoming audio rings and popup banner toasts while queueing notifications in the Activity feed.
- A user can set a custom status message with an expiration time (1 hour, 4 hours, today, this week); once expired, the message is automatically cleared.

#### Acceptance criteria F-005:
- The settings modal allows switching between Light, Dark, and High-Contrast themes, taking effect instantly across all views without full page reload.
- The user can select their display language from supported locales (e.g. English, French, Spanish, German) with UI strings updating immediately.
- Notification preferences allow toggling banner toasts, sound alerts, and email digests for mentions, replies, and direct messages.
- User preferences are saved to the backend database and persist across browser sessions and devices.
- Full keyboard navigation (Tab, Escape, Enter) allows opening, navigating, modifying, and closing the settings modal without mouse interaction.

#### Acceptance criteria F-006:
- Organization admins can promote standard members to admin or demote admins to members via the admin management interface.
- Team owners can add new members, promote members to co-owners, and remove members from their team.
- Standard members cannot access administrative controls or delete channels they do not own.
- Guests are restricted to specific channels they are invited to and cannot browse full org directories.
- Unauthorized API requests return HTTP 403 Forbidden with descriptive error messages.

#### Acceptance criteria F-007:
- The top bar profile menu displays all organizations and tenants the signed-in user belongs to.
- Selecting an organization switches the active tenant workspace context without requiring a full re-login.
- Tenant-specific unread message badges are displayed beside each organization entry in the switcher list.
- A user can sign into a secondary account and switch between accounts without logging out of the primary session.
- Leaving a guest organization removes it from the user's organization switcher list.

#### Acceptance criteria F-008:
- Clicking "Immersive Reader" on any message opens a focused, distraction-free overlay containing only the message text.
- The user can customize font size, text spacing, font family, and background theme (light, sepia, dark).
- The reader includes a text-to-speech play button with adjustable speed and voice gender options.
- The reader highlights words or sentences synchronously as they are read aloud.
- The reader provides syllable breakdown and grammar tagging (nouns, verbs, adjectives) toggles.

#### Acceptance criteria F-009:
- High-contrast mode applies high-contrast color tokens adhering to WCAG 2.1 AAA contrast ratios across all components.
- All interactive controls have clear `aria-label`, role definitions, and discernible visual focus rings.
- Enabling "Reduced motion" disables transitions, modal fly-ins, and animated reaction effects.
- Keyboard focus order follows a logical document flow and traps focus appropriately inside modal dialogs and dropdown menus.

---

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
| C-021 | Scheduled send: schedule messages to be dispatched at a future date and time | Todo |
| C-022 | Custom chat sections and folders: organize conversations into custom collapsible groups | Todo |
| C-023 | Automatic chat sections: dedicated auto-updating sections for "Muted" chats and "Meeting" chats | Todo |
| C-024 | Live collaborative components: embed editable real-time checklists, tables, and task trackers inside messages | Todo |
| C-025 | In-chat polls and surveys: create instant interactive polls with real-time result tallies | Todo |
| C-026 | Chat with yourself: personal notes, drafts, and file scratchpad conversation | Todo |
| C-027 | Configurable chat history sharing: choose whether to share none, previous X days, or full history when adding a member to group chat | Todo |
| C-028 | Video clip messages: record and send quick camera video notes directly in chat | Todo |
| C-029 | Autocorrect and Enter-to-send toggle: client-side spelling assistance and option to configure Enter as newline vs. send | Todo |
| C-030 | Read receipts privacy toggle: enable or disable sending and receiving read receipt acknowledgments per user | Todo |
| C-031 | Chat display density: toggle between compact high-density view and comfortable spacious view | Todo |
| C-032 | Praise and kudos cards: send personalized employee appreciation and recognition badges | Todo |
| C-033 | External federation: secure cross-organization direct chat with approved external partner domains | Todo |

### Acceptance criteria — Phase 2

#### Acceptance criteria C-001:
- Clicking "New Chat" opens a recipient picker that autocompletes organizational users as the user types.
- Selecting a user opens an existing 1:1 conversation history if one exists, or initializes a new draft conversation.
- Sending the first message creates the conversation in the database and adds it to both participants' chat lists.
- 1:1 chat header displays the participant's full name, live presence indicator, job title, and quick call/video buttons.

#### Acceptance criteria C-002:
- A user can create a group chat with 2 to 250 participants by adding multiple recipients in the recipient picker.
- Any participant can view and edit the group chat name; edits update in real time for all members.
- Adding a new participant prompts the user to select chat history sharing options (None, past X days, or all history).
- Removing a member revokes their access to subsequent messages; a system notification event is posted in the thread.
- Any participant can voluntarily leave the group chat at any time, posting a departure system message.

#### Acceptance criteria C-003:
- The chat list displays all conversations sorted by the timestamp of the latest message descending.
- Unread chats display bold title text with a brand-colored unread badge indicating the count of new messages.
- A user can Pin a chat, keeping it in a dedicated "Pinned" section at the top of the chat list.
- A user can Mute a chat, preventing sound alerts and toast notifications while maintaining unread badges.
- A user can Hide a chat from their list; receiving a new message automatically unhides it.
- A user can right-click a read chat and select "Mark as unread" to restore its unread state.

#### Acceptance criteria C-004:
- Messages sent in a chat appear in the recipient's view via WebSocket within 500ms without page reload.
- When a participant types into the message composer, a typing indicator ("Alice is typing...") appears for others and disappears after 3 seconds of inactivity.
- Sent messages display a single checkmark (sent/delivered).
- When the recipient focuses the chat window and views the message, a double checkmark or avatar read receipt appears for the sender.

#### Acceptance criteria C-005:
- The message input bar supports a rich text formatting toolbar for bold, italic, underline, strikethrough, blockquote, and headings (H1, H2, H3).
- Bulleted and numbered lists can be created and formatted cleanly.
- Code snippets can be formatted in an inline `code` tag or inside a multi-line fenced code block with syntax highlighting.
- Hyperlinks can be inserted with custom anchor text and validate for safe URLs (http/https).

#### Acceptance criteria C-006:
- Clicking the emoji button opens an accessible categorized emoji picker with search capability.
- Selecting an emoji inserts it into the composer or sends it immediately.
- A GIF search tab lets users query open-source GIF providers and preview animated GIFs before sending.
- Selecting a sticker sends a high-resolution sticker graphic into the chat feed.

#### Acceptance criteria C-007:
- Hovering over any message reveals a quick reaction bar with default reactions (Like, Heart, Laugh, Surprised, Sad, Angry).
- Clicking any reaction adds the user's reaction badge to the message footer with count increment.
- Clicking an existing reaction of one's own toggles and removes it.
- Hovering over a reaction badge displays the list of users who reacted with that emoji.
- The reaction picker allows selecting any Unicode emoji as a message reaction.

#### Acceptance criteria C-008:
- Hovering over a message and selecting "Reply" quotes the original message in the composer preview.
- Sending the reply embeds a clickable quote block showing the sender name and preview snippet of the source message.
- Clicking the quoted block scrolls smoothly to the original message in the chat history and briefly highlights it.

#### Acceptance criteria C-009:
- A user can edit their own sent messages; the message updates in real time for all participants with an "(edited)" indicator and timestamp.
- A user can delete their own sent message; the message body is replaced with "This message has been deleted".
- Admins/moderators can delete messages that violate policies, leaving a system tombstone indicator.
- Non-author members do not see "Edit" or "Delete" options on messages sent by others.

#### Acceptance criteria C-010:
- Typing `@` in the composer brings up an autocomplete popover filtering participants of the current chat.
- Selecting a user inserts an interactive `@User Name` mention token.
- Submitting the message generates an activity notification specifically alerting the mentioned individual.
- Mentioned messages display a distinct visual highlight in the recipient's message timeline.

#### Acceptance criteria C-011:
- A user can attach files and images via an attachment paperclip button, dragging and dropping files onto the chat, or pasting from clipboard.
- Files are securely uploaded to SeaweedFS/S3 and display with file name, file size, and extension icon.
- Uploaded image attachments display responsive inline previews with a click-to-zoom lightbox view.
- Non-image files provide a direct download button and file metadata display.

#### Acceptance criteria C-012:
- The composer allows marking a message as "Standard", "Important", or "Urgent".
- An "Important" message renders with a prominent red banner and exclamation icon in the chat stream.
- An "Urgent" message triggers persistent high-priority notifications and alerts the recipient every 2 minutes for up to 20 minutes until read.

#### Acceptance criteria C-013:
- Hovering over a message and selecting "Save message" adds it to the user's private Bookmarks / Saved list.
- A dedicated "Saved messages" view accessible from the profile menu displays all bookmarked items chronologically.
- Clicking a saved item jumps directly to its original conversation and location in history.
- Selecting "Unsave" removes the message from the bookmarks collection.

#### Acceptance criteria C-014:
- Selecting "Forward message" opens a modal to choose one or more target chats or channels.
- Adding an optional comment forwards both the source message copy and comment to the selected targets.
- The forwarded message clearly indicates "Forwarded from [Author]".

#### Acceptance criteria C-015:
- A user can pin up to 10 important messages to the top banner of a chat.
- Pinned messages appear in a collapsible header banner accessible to all participants.
- Clicking a pinned banner message scrolls directly to that message in the conversation timeline.
- Unpinning removes the message from the pinned header list.

#### Acceptance criteria C-016:
- Posting a valid HTTP/HTTPS URL automatically fetches metadata and renders an inline preview card with title, description, and thumbnail image.
- If the URL does not provide OpenGraph metadata, a clean fallback link pill is displayed without broken layouts.
- Link previews can be dismissed or removed by the author before or after sending.

#### Acceptance criteria C-017:
- Clicking the microphone icon begins audio recording with a real-time audio waveform visualizer and elapsed timer.
- The user can pause, resume, cancel, or preview playback of their voice note before sending.
- Sending attaches an audio player widget in the chat with play/pause controls, seek bar, and duration indicator.

#### Acceptance criteria C-018:
- The chat header contains tabs: "Chat" (default timeline) and "Files" (all attachments shared in this chat).
- The "Files" tab aggregates every shared document/image with columns for Name, Modified date, and Shared By.
- Users can click the "+" button on the header bar to add custom web tabs with secure URL sandboxing.

#### Acceptance criteria C-019:
- Clicking the "Pop out chat" icon opens the active conversation in an independent, lightweight browser window.
- Messages sent or received in the popped-out window synchronize instantaneously with the main window.
- Closing the popout window cleanly returns focus to the primary application without session interruption.

#### Acceptance criteria C-020:
- Hovering over a message in a foreign language presents a "Translate" option.
- Selecting "Translate" renders the translated text directly below the original message with a "Translated by BCC" tag.
- The user can click "See original" to toggle back to the original untranslated text.

#### Acceptance criteria C-021:
- Right-clicking or long-pressing the Send button allows selecting "Schedule send" with date and time picker.
- Scheduled messages are held in a pending draft tray visible only to the author.
- The author can edit, reschedule, or delete the scheduled message before its dispatch time.
- At the scheduled timestamp, the message is automatically broadcast to all participants via backend cron/scheduler.

#### Acceptance criteria C-022:
- Users can create custom named chat sections/folders in the chat sidebar.
- Users can drag and drop conversations into custom sections or use context menu "Move to section".
- Custom sections can be collapsed or expanded, saving their collapse state in user preferences.
- Renaming or deleting a custom section does not delete the conversations inside it.

#### Acceptance criteria C-023:
- The chat sidebar features automatic sections for "Muted chats" and "Meeting chats".
- Muting a chat automatically moves it under the "Muted" section (can be toggled on/off in settings).
- Conversations associated with calendar meetings appear organized in the "Meeting chats" section.
- Unmuting a chat returns it to the main recent chats list.

#### Acceptance criteria C-024:
- Users can insert a live collaborative component (checklist, table, or task list) into any chat message.
- Any participant can check/uncheck items, edit cells, or add rows in real time without creating a new message.
- Collaborative state synchronizes over WebSockets using CRDTs (Yjs) with conflict-free merging.
- Edits display the avatar of the person currently modifying an element.

#### Acceptance criteria C-025:
- A user can create a quick poll with a question, multiple choice options, and toggle for anonymous voting.
- The poll renders as an interactive card in the chat timeline where participants vote with one click.
- Vote tallies and percentages update in real time for all participants as votes are cast.
- The poll creator can export results to CSV or close voting at any time.

#### Acceptance criteria C-026:
- The chat sidebar includes a dedicated "Chat with yourself" entry pinned by default.
- The user can send text, files, links, and voice notes to this private conversation.
- The conversation functions as a personal scratchpad accessible across all signed-in devices.
- Messages in the self-chat support all rich text, search, and bookmarking capabilities.

#### Acceptance criteria C-027:
- When adding a new member to an existing group chat, a dialog offers 3 history choices: "Don't include chat history", "Include history from the past [X] days", or "Include all chat history".
- Choosing "Don't include" ensures the new participant only sees messages sent after their join time.
- Choosing a day range limits the query scope of visible messages for that user.
- A system message in the chat records that the user was added and specifies the history sharing policy chosen.

#### Acceptance criteria C-028:
- Clicking the video clip button in the composer opens a video recording modal with camera/mic preview.
- The user can record a video message up to 60 seconds, with pause, retake, and playback preview.
- Dispatched video clips render as rounded inline video players with play/pause, scrub bar, and mute controls.
- Video clips are encoded in H.264/MP4 and stored securely in SeaweedFS object storage.

#### Acceptance criteria C-029:
- The composer provides automatic client-side spelling suggestions and autocorrect.
- The user can toggle "Send on Enter" off in settings; when disabled, Enter inserts a new line and Ctrl+Enter (or clicking Send) sends the message.
- The send setting persists across app sessions and devices.

#### Acceptance criteria C-030:
- Users can toggle "Read receipts" on or off in Privacy Settings.
- When turned off, the user does not send read receipts to others when viewing messages.
- When turned off, the user also cannot see read receipts from other participants in 1:1 chats.
- Group chats with over 20 members automatically disable individual read receipts to preserve performance.

#### Acceptance criteria C-031:
- The settings modal includes a "Chat density" preference with "Comfortable" (default) and "Compact" options.
- Compact mode reduces vertical padding between messages, compresses avatar sizes, and aligns timestamps inline.
- Switching density mode applies instantly across all active chat views without refreshing the page.

#### Acceptance criteria C-032:
- Clicking the "Praise" badge button opens a dialog with customizable appreciation titles (e.g. Achiever, Team Player, Problem Solver, Creative, Thank You).
- The user can select recipient(s), choose a decorative badge theme, and write a custom personal note.
- Submitting publishes a visually prominent celebration card to the chat feed alerting the recipient.

#### Acceptance criteria C-033:
- Organization admins can configure federated domains for external business collaboration.
- Users can start a 1:1 or group chat with an external user by entering their federated email address.
- External contacts display an "External" badge beside their name throughout the conversation.
- File sharing and administrative restrictions can be enforced specifically for external federated chats.

---

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
| T-016 | "Shared" channel tab: unified view containing the team file library and an "In messages" media/link browser | Todo |
| T-017 | Member tags: create and manage group tags (e.g. @frontend, @designers) for targeted notifications | Todo |
| T-018 | Threaded channel layout customization: toggle between modern top-level post list and dedicated threaded conversation stream | Todo |
| T-019 | Channel analytics: view engagement metrics, active contributors, message volume, and read trends | Todo |
| T-020 | Communities: large-scale open forums for company-wide discussions, announcements, and interest groups | Todo |

---

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
| A-008 | Custom notification sounds and per-activity sound toggle: assign custom alert chimes and mute specific activity triggers | Todo |
| A-009 | Recent search history and saved queries: quickly recall recent search queries and jump to frequent contacts/channels | Todo |
| A-010 | Search type-ahead dropdown | Todo |

### Acceptance criteria — Phase 4

#### Acceptance criteria A-010:
- Typing in the top search box opens a dropdown below it, updating as I type (debounced ~150ms), with no need to press Enter.
- Top row: the typed text with "Press Enter to see all results".
- "People" section: up to 5 matching users with avatar, presence dot, name with the matched letters in bold, and job title. Clicking one opens their profile card (later: starts a chat).
- "Messages", "Chats & channels" and "Files" sections appear automatically once those features exist; until then they're hidden, not shown as errors.
- When the box is empty and focused, show recent searches and recently viewed people.
- "Suggested" section with "Invite people to BCC Teams" (Coming soon until the invite feature exists).
- Keyboard: Up/Down to move, Enter to open, Esc to close. Ctrl+E focuses the search box.
- Results only include people the signed-in user is allowed to see.
- Works in light and dark mode, follows DESIGN.md.

---

## Phase 5 — Files
| ID | Feature | Status |
|---|---|---|
| D-001 | Files app: recent, my files, shared with me, downloads | Todo |
| D-002 | Team/channel file library with folders, upload, download, rename, move, delete | Todo |
| D-003 | File preview in app (images, PDF, video, Office files via preview service) | Todo |
| D-004 | Sharing links with permissions (view/edit, people/org/anyone) | Todo |
| D-005 | Version history and restore | Todo |
| D-006 | Co-editing documents (integrate Collabora Online via WOPI) | Todo |
| D-007 | Recycle bin and file restoration: browse deleted files with a 30-day retention window and one-click restore | Todo |
| D-008 | File checkout and locking: lock files during editing to prevent accidental overwrite conflicts | Todo |

---

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
| M-017 | Whiteboard during meetings (integrate Excalidraw) | Todo |
| M-018 | Meeting notes and recap (attendance report, recording, transcript) | Todo |
| M-019 | Webinars with registration; town halls (large broadcast) | Todo |
| M-020 | Guests join by link without an account | Todo |
| M-021 | Moderated Q&A panel: structured questions, attendee upvoting, answers, and organizer moderation | Todo |
| M-022 | Meeting timer and hideable toolbar: in-call meeting duration tracker and auto-hiding control bar for uncluttered view | Todo |
| M-023 | Live transcript without recording: generate and view real-time text transcription without saving video/audio files | Todo |
| M-024 | Presenter overlay modes: stand-out presenter cutout silhouette over shared screen, side-by-side, and reporter layouts | Todo |
| M-025 | Built-in slide presentation: present slide decks natively with audience sync, speaker notes, and private slide preview | Todo |
| M-026 | Immersive Together Mode: composite participant camera feeds into virtual auditorium or conference room scenes (via MediaPipe) | Todo |
| M-027 | Large gallery and front-row layouts: 7x7 grid (up to 49 video feeds simultaneously) and front-row hybrid meeting layout | Todo |
| M-028 | Focus mode: hide incoming video feeds from other attendees during presentations to reduce distractions and bandwidth | Todo |
| M-029 | Noise suppression and voice isolation: client-side WebAudio AI filtering for background noise and echo cancellation | Todo |
| M-030 | Live translated captions: real-time automatic translation of captions into attendee's preferred language | Todo |
| M-031 | Language interpretation: dedicated audio channels for live human interpreters alongside the original audio | Todo |
| M-032 | Sign language view: prioritize and pin sign language interpreter video feed in a fixed, high-visibility position | Todo |
| M-033 | Meeting registration and attendance reports: custom attendee signup pages and downloadable participation logs | Todo |
| M-034 | Custom meeting templates and branding: predefined meeting policies, security defaults, and custom organization logo banners | Todo |
| M-035 | Video and screen watermarking: dynamic semi-transparent email overlay on video and shared screens for confidential meetings | Todo |
| M-036 | Sensitivity labels: apply compliance classifications (Public, Internal, Confidential) enforcing encryption and recording rules | Todo |
| M-037 | Dial-in telephone conferencing: provide PSTN phone numbers and conference pins for audio-only dial-in participants | Todo |
| M-038 | Video meeting recap: automated post-meeting summary combining recording chapter marks, attendance list, transcript, and shared files | Todo |
| M-039 | Shared apps on meeting stage: collaboratively interact with third-party tools, diagrams, and boards directly on the main meeting stage | Todo |
| M-040 | Conference room hardware integration: pair and control dedicated meeting room displays, cameras, and audio consoles | Todo |

---

## Phase 7 — Calls
| ID | Feature | Status |
|---|---|---|
| K-001 | 1:1 and group audio/video calls from chat or profile | Todo |
| K-002 | Incoming call screen with accept/decline; ringtones | Todo |
| K-003 | Call history, missed calls, voicemail | Todo |
| K-004 | Speed dial / contacts | Todo |
| K-005 | Call transfer, hold, call forwarding settings | Todo |
| K-006 | Phone (PSTN) calling via a SIP provider (later) | Todo |
| K-007 | Call queues: route incoming calls to distributed agent groups with queue music, waiting limits, and round-robin dispatch | Todo |
| K-008 | Auto attendants: interactive voice response (IVR) phone menus with customizable greeting prompts and keypad routing | Todo |
| K-009 | Call park and pickup: put a call on hold in a shared orbit with a retrieval code for any colleague to pick up | Todo |
| K-010 | Call merge: combine two active phone/VoIP calls into a single three-way conference call | Todo |
| K-011 | Call delegation and executive assistant support: allow designated colleagues to make and receive calls on an executive's behalf | Todo |
| K-012 | Shared lines / group call pickup: ring multiple team phones simultaneously or sequentially for departmental lines | Todo |
| K-013 | Contact groups: create custom organized categories of contacts for quick group calling and presence monitoring | Todo |
| K-014 | Explicit recording and transcription consent: prompt callers with an audible and visual consent acknowledgment prior to recording | Todo |

---

## Phase 8 — Apps and automation
| ID | Feature | Status |
|---|---|---|
| P-001 | Apps page: install apps into chats, channels, meetings | Todo |
| P-002 | Built-in apps: Tasks (planner board), Lists, Approvals, Shifts, Wiki | Todo |
| P-003 | Incoming webhooks and outgoing webhooks for channels | Todo |
| P-004 | Bots API so BCC can build its own bots | Todo |
| P-005 | Workflows (simple automation: when X happens, do Y) | Todo |
| P-006 | AI assistant: summarize chats/meetings, draft replies (later) | Todo |
| P-007 | Message extensions: search and insert third-party rich cards, tasks, and data directly from the message composer bar | Todo |
| P-008 | Adaptive cards support: render interactive structured cards with action buttons, inputs, and form submissions in chats | Todo |
| P-009 | Admin app catalog and approval workflow: tenant-wide app management with permissions review and role-based app deployment | Todo |

---

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
| S-008 | Data Loss Prevention (DLP): inspect outgoing messages and files for sensitive patterns (credit cards, API keys) and block or warn | Todo |
| S-009 | eDiscovery: compliance search across historical messages, files, and transcripts with legal hold export | Todo |
| S-010 | Information barriers: establish regulatory communication walls preventing specified departments from contacting each other | Todo |
| S-011 | Conditional access policies: restrict workspace access based on client IP ranges, geographic location, and MFA compliance | Todo |
| S-012 | Call quality dashboard: real-time telemetry and diagnostic metrics (jitter, packet loss, latency, audio bitrate) for all calls | Todo |
| S-013 | Organization usage analytics: dashboards tracking daily active users, message volume, meeting counts, and storage usage | Todo |
| S-014 | Device management: inventory of enrolled desktop and mobile devices with remote sign-out and wipe capabilities | Todo |

---

## Phase 10 — Desktop and mobile
| ID | Feature | Status |
|---|---|---|
| X-001 | Windows/macOS/Linux desktop app with Tauri: tray icon, native notifications, auto-start, auto-update | Todo |
| X-002 | Android and iOS app with Expo: chat, channels, calls, meetings, push notifications | Todo |
| X-003 | Offline support and message sync | Todo |
| X-004 | Companion device mode: join an ongoing meeting from a secondary mobile device to present or share photos with muted audio | Todo |
| X-005 | Quiet hours and quiet days scheduler on mobile: automatically suppress push notifications outside work hours and on weekends | Todo |

---

## Phase 11 — Calendar & Workplace
| ID | Feature | Status |
|---|---|---|
| W-001 | Calendar synchronization: bidirectional sync with Google Calendar and CalDAV/Exchange accounts | Todo |
| W-002 | Out-of-office presence integration: display scheduled out-of-office status and custom auto-reply in direct chats | Todo |
| W-003 | Working hours and location indicator: set standard weekly schedule and display daily location (in-office vs. remote) | Todo |
| W-004 | Meeting room and resource booking: reserve physical conference rooms, projectors, and equipment with availability calendar | Todo |
| W-005 | Appointment booking pages: public scheduling links allowing clients to book available 1:1 or group appointment slots | Todo |
| W-006 | Virtual appointments: lightweight client appointment management with automated reminders and one-click browser join | Todo |

---

## Phase 12 — Frontline
| ID | Feature | Status |
|---|---|---|
| L-001 | Walkie-talkie mode: instant push-to-talk voice channel over cellular and Wi-Fi for shift teams | Todo |
| L-002 | Updates and shift checklists: structured digital submission forms for daily inspection reports, incident logs, and shift handover | Todo |
| L-003 | Task publishing: centralized task distribution from headquarters/managers to multiple frontline store/branch locations | Todo |

---

## Phase 13 — AI
| ID | Feature | Status |
|---|---|---|
| I-001 | Unread chat summaries: on-demand AI synopsis of high-volume unread chat channels and group conversations | Todo |
| I-002 | AI assistant in chats, channels, and meetings: conversational contextual assistant to draft messages, find information, and answer questions | Todo |
| I-003 | Meeting AI recap and action items: automatic extraction of key decisions, discussion highlights, and assigned action items from transcripts | Todo |
| I-004 | Custom AI agents: build and deploy custom domain-specific AI agents connected to team knowledge bases and workflows | Todo |
