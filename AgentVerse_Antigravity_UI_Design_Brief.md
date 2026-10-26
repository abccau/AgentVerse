# AgentVerse UI Redesign — Antigravity Design & Implementation Brief

**Document type:** UI/UX design specification and implementation prompt  
**Product:** AgentVerse — Distributed Multi-Agent AI Workspace  
**Target:** Migrate the existing Vanilla HTML/CSS/JavaScript frontend to React + Vite + TypeScript while retaining the existing FastAPI backend and distributed-node APIs  
**Design direction:** Premium, modern AI operations workspace; visual theme is open, with a recommended deep graphite/navy foundation and restrained violet/cyan accents  
**Primary goal:** Preserve the current employee chat experience while adding real, inspectable monitoring of the four-PC cluster and inter-node HTTP activity.

---

## 1. Instructions for Antigravity

Use this document as the implementation brief. The supplied Phase 1 audit reports that the current frontend is Vanilla HTML/CSS/ES6+ JavaScript, with `switchView(viewName)` routing, custom CSS, and standalone Anime.js v3.2.1—not React. Because the planned reusable screens, interactive topology, live tables, routing, and React-oriented component libraries would benefit from reusable components and predictable state management, migrate the frontend to React + Vite + TypeScript in controlled stages. Keep the existing FastAPI backend and its API contracts. First inspect the actual repository and verify that the audit still matches it; then implement incrementally without inventing endpoints or discarding working behavior.

### Non-negotiable rules
1. Preserve the current AgentVerse chat workspace functionality and familiar layout, but do not treat the existing white background as a constraint. You may redesign the theme and visual language if the result is cohesive, attractive, and usable.
2. Separate the **Employee Workspace** from the **Admin Control Room** using role-based navigation.
3. Enforce authorization on the backend as well as the frontend. Hiding admin links is not authorization.
4. Display actual backend telemetry when available. Clearly label mock/demo data in development; never present fabricated metrics or example requests as live data.
5. Reuse existing endpoints and contracts where possible. If a required endpoint is missing, add a clearly documented backend task or adapter instead of silently faking it.
6. Use components from **Aceternity UI**, **Skiper UI**, and the project’s **Animaster** library where they fit. Verify the exact package/documentation already intended by the project for “Animaster” before installing anything; do not substitute a similarly named library without confirmation.
7. Choose the visual theme that best suits AgentVerse. Recommended direction: a premium AI operations console using deep graphite/navy surfaces, subtle indigo/violet and cyan accents, crisp typography, clear borders, and carefully differentiated status colors. A refined light theme or a theme toggle is also acceptable if it better fits the existing product. Avoid generic templates, excessive gradients, constant animated particles, heavy glassmorphism, or decoration that makes operational information harder to read.
8. Respect `prefers-reduced-motion`; every important status must be conveyed by text/icon as well as color.
9. Keep secrets, credentials, authorization headers, tokens, and sensitive employee document contents out of telemetry and logs by default.
10. Do not break existing chat, file upload, chat history, agent selection, cluster, knowledge, runs, or settings functionality. Treat feature parity as a migration gate before retiring the Vanilla frontend.
11. Do not build two independent frontends long-term. Choose one canonical frontend directory, avoid maintaining duplicated `Frontend/` and `AgentVerse/frontend/` sources, and document the canonical path.

## 1A. Frontend migration decision — Vanilla JavaScript to React

The current implementation, according to the supplied audit, uses Vanilla HTML/CSS/ES6+ JavaScript, a `switchView(viewName)` single-page view switcher, custom CSS, and standalone Anime.js v3.2.1. No `package.json` or React build pipeline was found in that audit.

**Decision: use React for the next development stage.** The expanded product has stateful chat interactions, role-aware navigation, node topology, request filters and detail drawers, live telemetry updates, trace waterfalls, and reusable admin views. React is likely to improve component reuse, state coordination, testability, routing, and maintainability. React is not automatically faster or visually better; the benefit is the ability to manage this richer interface consistently.

### Recommended frontend stack
- React + TypeScript + Vite for the frontend application and build toolchain.
- React Router if there is no existing routing dependency to retain.
- Existing FastAPI backend remains the API server; do not rewrite it as a React/Node backend.
- A single API client module for `/api/v1/cluster`, `/api/v1/query`, and future telemetry/auth APIs.
- CSS variables/design tokens retained or refactored into a consistent theme. Tailwind CSS may be added only if useful; avoid mixing multiple styling systems without a clear boundary.
- `@xyflow/react` for the interactive cluster topology if it fits the repository and passes build/accessibility checks.
- Aceternity UI and Skiper UI components may be integrated selectively after checking each component's installation instructions, dependencies, and accessibility.
- Continue using the existing Anime.js asset for small motions during migration if useful. Wrap animations in React effects/refs and clean them up correctly; do not let animations mutate React-owned DOM unpredictably.
- The specific “Animaster” library remains unverified. Do not guess the package. Keep Anime.js as the known current animation library until the intended Animaster source/package is confirmed.

### Migration approach
1. **Confirm a clean baseline.** Inspect the current repository, run the current app/build/tests, identify the canonical frontend directory, and preserve a Git checkpoint before changing structure.
2. **Create the React app in one canonical frontend directory.** Add the minimum `package.json`, Vite config, TypeScript config, and entry points. Do not duplicate the frontend in two directories.
3. **Port the shared shell first.** Build `AppShell`, sidebar/navigation, header/account menu, status badges, theme tokens, and route guards. Keep current visual functionality while improving the theme.
4. **Port the existing employee chat next.** Preserve `/api/v1/query`, session identifiers, agent modes, file staging, sources, response rendering, and the “How AgentVerse Worked”/execution details that are actually supported. Do not replace real API behavior with mock chat responses.
5. **Port cluster and admin foundation views.** Use the real `/api/v1/cluster` result; show connected count and node state accurately. Keep telemetry screens in honest “instrumentation not yet available” states until there is a real backend feed.
6. **Validate feature parity.** Test chat, history, agent selection, upload, cluster refresh, role navigation, empty/error states, and responsive layout. Keep the old frontend available in version control or a temporary migration branch until parity passes.
7. **Integrate production serving.** Determine the current FastAPI static-serving approach and choose a documented production path for serving the Vite build output. Do not break `GET /`, `/static/*`, or API routing during development. The final setup must have one canonical frontend source.

### Migration constraints
- Keep the FastAPI backend and existing worker-PC endpoints; a frontend migration is not a reason to rewrite agent services.
- Preserve API contracts unless a separately documented backend change is needed.
- Do not claim the client-side role switcher is authentication. Until server-side authentication and role enforcement are implemented, clearly treat it as a development/demo role selector.
- Do not claim the current `connected_count: 3` means 4/4 nodes are online; use the live API result and actual node health.
- Do not mark Phase 1 complete merely because the new shell renders. Feature parity and tests are required.

---

## 2. Product concept

**Employees use AgentVerse. Administrators observe and manage how AgentVerse works.**

### Employee Workspace
A straightforward AI workspace for chatting, uploading files, viewing answers and sources, and inspecting the employee’s own run progress.

### Admin Control Room
A dedicated operations interface for authorized administrators to inspect:
- Four-PC cluster topology and node health
- Actual HTTP requests between nodes
- End-to-end request traces
- Agent execution and run status
- Failures, retries, latency, and node diagnostics
- User access and administrative audit events

Do not expose other employees’ private chats or document contents to ordinary users.

---

## 3. Current UI to preserve

The supplied screenshot shows a white AgentVerse interface with:
- Left sidebar with AgentVerse branding, New Chat, chat history, and Workspace links
- Chat, Cluster, Knowledge, Runs, and Settings navigation
- Top bar with New Chat, AgentVerse Auto, search, and panel controls
- Central welcome message and task cards
- Visible “4 PCs Connected” indicator
- A distributed physical cluster strip naming Research (PC A), Knowledge (PC B), Analytics (PC C), and Control (PC D)
- Bottom message composer with file attachment, agent selector, and send button

Keep this overall information architecture for the employee-facing chat. You may substantially improve the color palette, surface treatment, typography, iconography, spacing, and responsive behavior. Use the screenshot as a layout/functionality reference, not a color-theme constraint, and do not turn the product into an unrelated marketing site.

---

## 4. Application navigation and routes

Use React Router (or a comparable maintained React router already present) for the React frontend. Suggested route map:

### Shared
- `/login`
- `/app/chat`
- `/app/runs`
- `/app/runs/:runId`
- `/app/knowledge`
- `/app/profile`

### Admin-only
- `/admin/overview`
- `/admin/topology`
- `/admin/traffic`
- `/admin/traces/:traceId`
- `/admin/nodes`
- `/admin/agents`
- `/admin/knowledge`
- `/admin/users`
- `/admin/audit-logs`
- `/admin/settings`

If the current app is not using these paths, map the same screen concepts onto its existing routing conventions rather than introducing duplicate route systems.

### Role-based navigation
- **Employee:** Chat, My Runs, Knowledge (if authorized), Profile/Settings.
- **Admin:** Control Room, Topology, Traffic, Traces, Nodes, Agents, Knowledge, Users, Audit Logs, Settings.
- Show a clear role label in the account menu.
- Protect all admin API routes on the server. Deny access by default when the role cannot be verified.

---

## 5. Design system

### Visual direction
The current screenshot is a reference for layout and existing functionality—not a requirement to keep a white background. Antigravity may choose the palette that produces the strongest cohesive result.

**Recommended art direction: “AgentVerse Mission Control”**
- Deep graphite / navy foundations for a modern AI operations-console feel.
- Subtle violet or indigo for orchestration and interactive focus; cyan for live traffic and network activity.
- Clear, high-contrast text and restrained surface layering; use borders and spacing to separate panels.
- Healthy, warning, failed, and unknown states must remain immediately distinguishable.
- Keep employee chat calmer and less dense than the admin console, while making both feel like one product.
- A refined light theme or a light/dark theme toggle is acceptable if it feels better in the existing codebase. Do not preserve white purely because the supplied screenshot is white.

### Example dark-theme tokens (suggested, not mandatory)
- App background: `#0B1020`
- Main surface: `#111827`
- Raised surface: `#172033`
- Subtle surface: `#1E293B`
- Primary text: `#F8FAFC`
- Secondary text: `#CBD5E1`
- Muted text: `#94A3B8`
- Border: `#273449`
- Primary accent / action: `#818CF8`
- Orchestration accent: `#A78BFA`
- Network / live traffic accent: `#22D3EE`
- Success: `#34D399`
- Warning: `#FBBF24`
- Error: `#F87171`
- Info: `#38BDF8`

If a light theme is selected, use corresponding tokens with appropriate contrast. Treat these values as a starting palette and test text, status labels, charts, and focus states for accessibility. Avoid using accent colors for large areas of body text or status meaning without labels/icons.

### Layout
- Desktop sidebar: approximately 248–264 px, collapsible.
- Top bar: approximately 56 px high.
- Content gutters: 24–32 px on desktop; 16 px on narrow screens.
- Cards: 10–14 px corner radius, subtle border, little or no shadow.
- Use a consistent spacing scale and existing design tokens where available.
- Typography: use the project’s current font if appropriate; otherwise Inter or a similar legible sans-serif.
- Ensure keyboard focus, accessible labels, useful empty states, loading states, and error states.

---

## 6. Screen A — Employee Chat

Keep the supplied screenshot’s layout and improve the details.

### Header
- AgentVerse / current workspace title
- Agent mode selector (e.g., AgentVerse Auto)
- Cluster health pill such as “4 PCs connected”
- Search conversations
- Sidebar/panel toggle
- Account menu with role label

### Welcome state
- Title: “How can I help you today?”
- Subtitle: “Research · Analyze data · Code · Document RAG”
- Four compact task cards:
  1. Full multi-agent workflow
  2. Web research and intelligence
  3. Document and RAG analysis
  4. Data analytics and code sandbox
- Do not make cards imply a capability is operational unless it is available in the current build.

### Composer
- Multiline prompt input
- File attachment
- Agent selector
- Send/stop control
- Keyboard behavior: Enter to send; Shift+Enter for newline
- Show upload progress, validation failures, and file limits clearly.

### Run progress
Show an understandable state sequence:
`Planning → Dispatching → Running → Evaluating → Completed`
Possible terminal states: `Failed`, `Cancelled`, `Needs attention`.
The UI must use actual run state from the backend. Do not force parallel agent tasks into a false sequential timeline.

### “How AgentVerse worked” panel
A collapsible explanation for the current run:
- Planner / orchestrator actions
- Agents selected
- PC/node assigned to each task
- Relevant knowledge sources
- Task timings and outcome
- Retry or failure information, if present
Only show information the signed-in user is authorized to see.

---

## 7. Screen B — Admin Control Room Overview

This is the main new administrative screen.

### Page header
**AgentVerse Control Room**  
Subtitle: “Distributed infrastructure and execution health”  
Controls: time range, refresh status, last updated timestamp.

### KPI cards
1. Connected nodes: `4 / 4` only if confirmed by live health checks
2. Active executions: live count
3. Failed requests: count over selected time range
4. Response latency: clearly define whether the value is average, p50, or p95

Every metric needs a loading state, an unavailable state, and a timestamp/source where useful. Do not hardcode the sample values in this specification.

### Topology preview
Show the Control PC connected to:
- Research — PC A
- Knowledge / Document & RAG — PC B
- Analytics & Code — PC C

The Control PC represents the orchestration gateway. The view must reflect actual configured nodes and actual health state. If the current topology cannot be inferred from telemetry, show the configured node list and label the topology as configured rather than verified.

### Recent activity
A small event list:
- Request dispatched
- Agent started/completed
- Node health changed
- Request failed/retried
- Run completed
Use real event timestamps and a link to the relevant trace/run.

### Admin quick links
- View HTTP traffic
- Inspect traces
- Manage nodes
- Review failures
- Manage users

---

## 8. Screen C — Interactive Cluster Topology

Use a node-and-edge canvas; `@xyflow/react` is the recommended candidate for the React migration after verifying compatibility. Reuse an existing graph package only if it is already suitable and maintaining it is clearly preferable.

### Node cards
Each PC/node card should show:
- Friendly name and node ID
- Role
- Host/IP and port, subject to admin permission
- Health state: Online, Busy, Slow, Disconnected, Failed, Unknown
- Model/service label if reported by the node
- Last heartbeat time
- Active task count
- Latency if measured
- “Inspect node” action

Possible existing node configuration from the current project context:
- Control Gateway — `192.168.1.30:8000`
- Research — `192.168.1.26:8000`
- Document / RAG — `192.168.1.11:8000`
- Analytics & Code — `192.168.1.12:8000`

Treat these as development configuration values, not immutable production constants. Read addresses from the existing configuration/API; do not hardcode them into reusable UI components.

### Connection edges
- Draw an edge only for a configured or observed relationship.
- Animate/highlight an edge only when a real correlated request event occurs.
- Show source, destination, route/method summary, status, and duration on selection.
- Do not show continuously moving packets when no request is happening.

### Node details drawer
Tabs:
- Overview
- Recent requests
- Active tasks
- Health/diagnostics
- Configuration (admin only)

Never provide a UI control for destructive operations unless the backend has a protected endpoint, the action is authorized, and a confirmation flow exists.

---

## 9. Screen D — HTTP Traffic Explorer

This is a priority feature. It should expose real request metadata between AgentVerse nodes.

### Filters
- Time range
- Source node
- Destination node
- HTTP method
- Status class / error only
- Route
- Trace ID or request ID
- Duration threshold

### Table columns
- Time
- Source → Destination
- Method
- Endpoint
- HTTP status
- Duration
- Trace ID
- Related run

Use server-side pagination for large volumes. Include sorting, loading, empty, and error states.

### Request detail side panel
When a row is selected, show:
- Timestamp
- Trace ID and request ID
- Source and destination node
- HTTP method and route
- HTTP status
- Duration and timeout information
- Retry count if recorded
- Related run/agent task
- Sanitized request/response metadata
- Error summary and link to the full trace

### Privacy and logging
Never log or display:
- Passwords
- Authorization headers
- Session tokens or cookies
- API keys
- Full sensitive employee prompts/documents by default
- Unredacted private response bodies

Prefer allowlisted structured fields and explicit redaction over trying to remove secrets after logging. Access to detailed traffic should be restricted and audit logged.

### Important
Example route names such as `/research/run`, `/knowledge/search`, and `/analysis/run` are placeholders only. Discover the actual FastAPI routes from the repository and backend OpenAPI schema. The UI must show real routes and actual results.

---

## 10. Screen E — End-to-End Trace Viewer

Use a timeline/waterfall view to explain one user request across services.

### Trace header
- Trace ID
- Start/end time
- Total duration
- Outcome
- Number of spans
- Related run ID (if available)

### Timeline
Render actual spans in their observed order and duration. Show parallel operations as parallel spans, not as a fabricated linear sequence.

Potential spans include:
- Browser → Control Gateway
- Orchestrator / planner
- Control Gateway → Research node
- Control Gateway → Document/RAG node
- Control Gateway → Analytics/Code node
- Evaluation
- Response delivery

Only render spans that exist in the trace data. Show missing instrumentation as “Not instrumented,” not as a successful invisible operation.

### Span detail
- Service/node
- Operation name
- Start time and duration
- Status/error
- Parent span
- Safe attributes such as method, route template, status code, node ID, agent type, retry count
- Related logs, if correlation is implemented

OpenTelemetry-compatible traces are recommended for cross-service correlation. Propagate trace context between FastAPI nodes so one distributed workflow can be followed across the cluster.

---

## 11. Screen F — Nodes, Agents, Runs, Knowledge, Users

### Nodes
- Configured nodes
- Last health check / heartbeat
- Health status
- Model/service availability
- Active task count
- Connection test
- Recent errors

### Agents
- Agent name and role
- Capabilities
- Assigned node
- Availability
- Last execution
- Success/failure counts, if tracked

### Runs
- Run ID, submitted time, duration, outcome
- Request owner, respecting access control
- Agents involved
- Related trace
- Failure/retry details
- Employee view should be limited to that employee’s authorized runs.

### Knowledge
- Collections and document counts
- Indexing status
- Embedding/model status
- Retrieval query and source IDs, only where the viewer is authorized
- Avoid exposing sensitive document contents in system-wide views.

### Users
- User list and role
- Provision/disable account, if supported
- Role changes with confirmation
- Record administrative changes in an audit log.
- Do not implement password storage or authentication from scratch if the project already has an identity provider or secure auth layer.

---

## 12. Component library strategy

Use the requested libraries selectively; avoid importing several competing animation systems for the same interaction.

### Aceternity UI
Official catalog: https://ui.aceternity.com/components

Good candidates:
- **Sidebar** or a restrained navbar component, if compatible with the existing navigation
- **Animated Tabs** for Node/Trace detail sections
- **File Upload** for a more polished chat upload interaction
- **Typewriter Effect** only for a subtle empty-state headline or optional demo—not for every live response
- **Timeline** only if it can be adapted to actual run events
- **Code Block** for code-agent output, if already needed

Avoid decorative backgrounds such as stars, beams, shader effects, or 3D cards on the operational dashboard. They would distract from status and traffic data.

### Skiper UI
Official components catalog: https://skiper-ui.com/components

- Inspect the current catalog and installation instructions before selecting a component.
- Use only components whose source, dependencies, license/access, and compatibility are confirmed.
- Prefer suitable navigation, command palette, transitions, or interaction patterns where they improve the product.
- Do not replace the entire design system with Skiper components if that creates inconsistent spacing, colors, or accessibility.

### Animaster
- The exact library/package is not identified by this brief.
- Inspect `package.json`, lockfile, project documentation, and any existing component imports to determine which Animaster package the team means.
- If absent or ambiguous, leave a small TODO in the implementation plan and ask for the exact documentation/package name instead of guessing or installing a similarly named library.
- Use it only for suitable animation/interaction components once verified.

### Animation rule
Use motion to explain state changes:
- New message appears
- Run step changes
- Node status changes
- Actual request highlights an edge
- A trace span expands
- Toast appears after an action

Keep most transitions around 150–250 ms. Avoid constant movement, large spring bounces, or animation that delays access to data. Honor reduced-motion preferences.

---

## 13. Suggested component inventory

Names are proposed abstractions, not claims that these components already exist.

### Shared UI
- `AppShell`
- `AppSidebar`
- `AppHeader`
- `RoleGate`
- `StatusBadge`
- `MetricCard`
- `DataTable`
- `EmptyState`
- `ErrorState`
- `LoadingSkeleton`
- `ConfirmDialog`
- `DetailsDrawer`
- `LiveConnectionIndicator`

### Employee
- `ChatWorkspace`
- `ChatHistory`
- `MessageComposer`
- `AttachmentPicker`
- `AgentModeSelector`
- `RunProgress`
- `HowItWorkedPanel`
- `SourcesPanel`

### Admin
- `ControlRoomOverview`
- `ClusterTopology`
- `ClusterNode`
- `ClusterEdge`
- `NodeDetailsDrawer`
- `TrafficExplorer`
- `RequestDetailsDrawer`
- `TraceWaterfall`
- `TraceSpanDetails`
- `FailureCenter`
- `NodeHealthTable`
- `AgentRegistry`
- `AdminAuditLog`

---

## 14. Backend data contract checklist

Before connecting UI, inspect the current backend and map available endpoints to these data needs.

### Node health
- Stable node ID
- Name and role
- Configured address (admin-only if appropriate)
- Status
- Last heartbeat
- Model/service availability
- Active task count, if tracked
- Measured latency, if available

### HTTP request event
- Event ID
- Timestamp
- Trace ID / request ID
- Source and destination node IDs
- Method
- Route template (avoid raw query strings that may contain sensitive data)
- HTTP status
- Duration
- Retry count, if tracked
- Safe error code/message
- Related run/task IDs

### Trace/span
- Trace ID and span ID
- Parent span ID
- Service/node name
- Operation name
- Start/end or duration
- Status
- Safe attributes

### Live feed
- Server-sent events or WebSocket, depending on existing architecture
- Authentication and role checks
- Reconnect behavior and backoff
- Heartbeat/connection state
- Event ordering strategy
- Bounded buffering so a disconnected browser does not accumulate unbounded data

If data is not currently emitted, implement instrumentation and an authenticated telemetry API as a separate backend task. The React UI must not pretend that browser-side polling alone can see every internal request between PCs.

---

## 15. Security, privacy, and reliability

- Enforce role authorization on every protected backend endpoint.
- Validate sessions and handle expiry.
- Use secure transport where deployment supports it; do not assume a private LAN alone makes traffic safe.
- Redact secrets and sensitive payloads before storage.
- Restrict access to raw operational logs and audit administrative access.
- Rate-limit sensitive admin operations where appropriate.
- Validate all user-provided filter values on the server.
- Show stale/unknown node status when health data is outdated.
- Avoid reporting “online” solely because a configuration entry exists.
- Provide clear empty/error states when telemetry is unavailable.
- Do not make destructive actions one-click; require permission and confirmation.

---

## 16. Implementation phases

### Phase 1 — React migration and feature parity
- Verify the supplied audit against the current repository and record the current app's baseline behavior.
- Create a React + Vite + TypeScript frontend in one canonical directory while retaining the existing FastAPI backend.
- Port the shared shell, role-aware navigation, theme tokens, and reusable components.
- Port employee chat and preserve the current `/api/v1/query` behavior, file staging, agent selection, history, response rendering, and execution details.
- Port the Admin Overview and existing Cluster/Knowledge/Runs/Settings views that are currently implemented.
- Use real API data; clearly label unavailable telemetry instead of fabricating it.
- Run feature-parity checks before retiring the old Vanilla frontend.

### Phase 2 — Live cluster
- Connect node list and health checks to actual backend APIs.
- Build topology and node detail drawer.
- Add timestamps, stale states, and connection test feedback.

### Phase 3 — HTTP traffic and traces
- Inspect FastAPI routes and inter-node HTTP clients.
- Add structured instrumentation and trace propagation.
- Build authenticated telemetry endpoints/feed.
- Implement Traffic Explorer and Trace Viewer using real events.

### Phase 4 — Operations and governance
- Add failure center, agent registry, node diagnostics, audit logs, and user management where supported.
- Add tests for authorization and redaction.
- Improve mobile/tablet responsiveness and keyboard navigation.

Do not attempt all phases as one giant refactor. Deliver in small, working increments and run existing tests/build after each phase.

---

## 17. Acceptance criteria

### Employee workspace
- Existing chat workflow still works.
- Chat history, upload, agent selector, and send/stop states remain functional.
- Employees cannot access another employee’s private runs or admin pages.
- The cluster indicator shows actual health or a clearly labelled unknown state.

### Admin access
- Admin routes require a verified admin role.
- Direct URL access by an employee is denied by the backend.
- Role changes and privileged actions are audited where supported.

### Topology
- The four configured nodes are represented using backend configuration.
- Node status comes from real health/heartbeat data.
- Clicking a node opens its detail panel.
- An edge highlights only in response to a real event.

### Traffic and traces
- Rows are populated from real instrumented HTTP events.
- Selecting a row reveals its trace/request ID and safe metadata.
- Parallel spans are represented accurately.
- Sensitive headers and payloads are redacted.
- Missing telemetry is reported honestly rather than replaced with fabricated data.

### Quality
- Layout works at desktop and tablet widths and remains usable on mobile.
- Keyboard focus is visible and controls have accessible names.
- Reduced-motion preference is respected.
- Loading, empty, stale, and error states are implemented.
- Build and relevant tests pass.

---

## 18. Final instruction to Antigravity

Start by inspecting the existing repository and report:
1. Confirm the current frontend is Vanilla HTML/CSS/JavaScript as described in the audit, then list its entry files, routing, styling, and dependencies.
2. Identify the canonical frontend directory and detect duplicate/synced copies before modifying anything.
3. Map the current frontend API calls and verify the existing API contracts.
4. Existing FastAPI routes and node health/communication APIs.
5. Existing authentication and role model, if any.
6. Existing request logging and trace propagation, if any.
7. Whether the exact Animaster package can be identified from the repository.

Then implement **Phase 1 only: React migration and feature parity**. Do not just add React to the current Vanilla UI while keeping two independent frontends. Keep FastAPI and worker nodes in place. Use the recommended Mission Control visual direction, but choose the most cohesive accessible theme for the product. First migrate the shared shell and employee chat, then the admin shell/foundation views; keep the migration small enough to test and review. Provide a short summary of changed files, commands/tests run, feature-parity status, API gaps, and what remains for Phase 2. Do not claim real HTTP traffic monitoring works until the backend emits and exposes the necessary telemetry.
