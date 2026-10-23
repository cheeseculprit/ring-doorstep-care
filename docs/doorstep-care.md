# Doorstep Care: Ring event-history demo

Category: caretaking. This is an activity log, not an emergency or wellness detection service. Motion cannot identify a person; a quiet log is not proof of safety or absence. It stores no Ring media or activity in a database. The optional offline sample is synthetic and is **not** a Ring simulator.

## Local setup

1. Use Node.js 20+ and run `npm ci` from the repository root.
2. Sign into the [Ring Developer Playground](https://developer.amazon.com/ring/console/playground), generate a short-lived access token, and use its Ring simulator or a consented Ring device. The Playground requires an Amazon Developer sign-in.
3. Copy `.env.example` to `.env.local`. Set `RING_ACCESS_TOKEN` to the Playground token. Generate an installation UUID with `node -p "require('node:crypto').randomUUID()"` and set `RING_HARDWARE_ID` to it. Do not commit or show either value. Do not set `RING_REFRESH_TOKEN` alongside `RING_ACCESS_TOKEN`.
4. Run `npm run dev`, visit `http://localhost:3000/care`, and select **Ring activity**. The server discovers accessible devices, requests motion and doorbell history for the selected one, and returns only metadata. Use **Refresh activity** after triggering an event on the simulator. If the Playground simulator does not add that event to history, the empty response is still a genuine Ring API response; the simulator's live view can be shown at `/` using the existing WHEP flow. Do not present the offline sample as simulator evidence.
5. If you receive 401, regenerate the short-lived token and restart. For 406, check the UUID and Ring's server-IP restrictions. History is limited to activity after user consent; this page displays the first page only. Do not infer that an empty history means no visitors.

The route is `app/api/care/activity/route.ts`. It calls `https://api.amazonvision.com/v1/devices` then `/v1/history/devices/{device_id}/events?event_types=motion,ding` from the server. The selected ID must be in the discovered device list. It sends Bearer authorization, `User-Agent`, `Hardware_Id`, and content-type headers. The browser receives no token, images, or video. The refresh button sends a new request; there is no background monitoring or emergency alerting. Don't expose this demo unauthenticated on the public internet with your Ring credentials: the local route currently has no user login.

Run `npm test` and `npm run build` for local checks. Neither test substitutes for a real Ring simulator run.

## Demo video shot list (English, target 2 minutes)

- 0:00–0:20: Introduce Doorstep Care, its caretaking use case, and the safety disclaimer.
- 0:20–0:45: Show the Ring Developer Playground's simulator and token-generation screen. Never show the actual token.
- 0:45–1:20: Show the simulator's event or live view in the existing dashboard; open `/care` in Ring activity mode, select the device, and refresh. Explain clearly whether the event appears in history. An empty history is not an event success.
- 1:20–1:45: Show the actual server-side API calls in the source and the activity timeline. If needed, show the offline sample separately, with the label visible.
- 1:45–2:00: State limitations and product feedback. Record the screen and English narration, upload publicly to YouTube or Vimeo, then put the URL in the submission. No video has been recorded or published by this repository.

## Product feedback (observed docs and local code; live API feedback pending)

| API/tool | What works well | Friction or request | Validation status |
| --- | --- | --- | --- |
| Ring Device Discovery (`GET /v1/devices`) | One call exposes the devices available to a token; good for a device picker. | Examples should consistently include mandatory `User-Agent` and `Hardware_Id` headers to avoid 406 confusion. | Code integrated; live token not tested here. |
| Ring Event History (`GET /v1/history/devices/{id}/events`) | Metadata-only motion/ding filter is privacy-conscious for a simple activity log. | Document explicitly whether Playground-simulated events become history entries; a consent-gated empty response is otherwise hard to distinguish from a simulator limitation. A bounded time-window query would help simple caretaking summaries. | Code and fixture normalization tested; live token not tested here. |
| Ring Developer Playground and simulator | Token generation and simulated live-view events allow development without owning hardware. | Provide a deterministic event-history fixture/trigger and a shareable test-mode guide. | Sign-in wall encountered here; no simulator session performed. |
| Server-side `fetch` / Next.js route | Keeps Bearer credentials out of browser requests and makes errors explicit. | This local sample still needs a login, deployment hardening and durable audit design for production. | Local build and unit tests only. |
| Existing Ring WHEP live stream at `/` | Provides an independent Ring-simulator video path when history is empty. | Short session durations and teardown complicate demos; do not infer video works until tested with a token. | Existing repository implementation; not validated in this change. |

Sources: [Ring Partner API reference](https://developer.amazon.com/docs/ring/api-documentation.html), including Device Discovery, Event History and required headers; [Ring release notes](https://developer.amazon.com/docs/ring/release-notes.html) for the Playground and event simulator.
