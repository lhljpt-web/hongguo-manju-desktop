# Windows SDK playback repair

**Goal:** Restore exact full episode playback after all released model routes return empty responses across independent current works.

**Evidence:** Installed 0.1.6 and released 0.1.8 reproduce the failure on two rotated current works. The pinned 8.2 Windows helper returns both requested middle models; the first work's first/middle/last have already passed fresh 1080p download and full audio/video decode. Current-app preload with its exact upstream signer still returns empty for both middle episodes.

**Design:** Keep catalog/search and media validation intact. A main-process SDK adapter invokes the pinned helper with `--videos <exact-id>` and a separate anonymous cache directory. Accept only the exact keyed model, then use the existing provider and media decoder. Prefer this verified route; on helper failure retain the released routes. Do not log subprocess output or send models to the renderer. Track and stop owned helper process trees before application exit/update.

**Scope:** No account import, cache migration, media distribution, or upstream application installation. Runtime material is obtained by the helper from the official application with its pinned integrity checks; no SDK image/configuration or anonymous device state enters Git.

- [x] Write and observe failing process-boundary and transport tests.
- [x] Implement adapter, application lifecycle integration, and pinned component preparation using existing Node/electron-builder tools.
- [x] Include component notices and corresponding source archives, excluding runtime identities/materials/media.
- [x] Pass unit tests, typecheck and build; review the diff.
- [x] Verify two current works' exact first/middle/last with fresh sources and actual packaged audio/video, plus full decode and resume/seek controls.
- Release workflow: publish reviewed source and verified installer through the existing GitHub release workflow; port only the repair to the primary checkout and update the private monitoring ledger.
