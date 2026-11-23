# Third-party signing primitives

`playback-v5.js` adapts the pure V5 signing module from
[`jackotom/hongguo-drama`, commit `4ffff289d6dd289e589a0fd0e65aa7aa5c2a7567`](https://github.com/jackotom/hongguo-drama/blob/4ffff289d6dd289e589a0fd0e65aa7aa5c2a7567/src/native/playback-v5.js), GPL-3.0-only.
That source credits N3urda/hongguoTV `18c37c2afd0567520135abcae312352542f09083`
and drpys `22261ad`. Adapted 2026-11-17: ESM exports and the existing sm-crypto
SM3 backend. The algorithm and input checks are retained. No captured identities,
sessions, media addresses, account credentials or SDK are included. Public wire
constants are algorithm parameters. Offline oracle tests use synthetic inputs and
store only SHA-256 digests, not request signatures.

Updated 2026-11-23 with bodyless GET support from the same module at
[`92df757ed7be8ea658ee274a6a429b77f49e54e8`](https://github.com/jackotom/hongguo-drama/blob/92df757ed7be8ea658ee274a6a429b77f49e54e8/src/native/playback-v5.js).
That update credits ch6vip/novel-sound 1.0.205 for the current video_tab GET wire
format. GET signs the empty-body digest and omits POST-only headers. Existing
POST wire headers are retained for compatibility. Synthetic GET oracle digests
were independently generated from that pinned module with Node's SM3 backend.

`playback-signature-551.js` adapts the playback-only Argus/Ladon module from
[`jackotom/hongguo-drama`, commit `3f5927d0d605ff7742fde8cbd1bb92ffe951b080`](https://github.com/jackotom/hongguo-drama/blob/3f5927d0d605ff7742fde8cbd1bb92ffe951b080/src/native/playback-signature.js), GPL-3.0-only.
Its header attributes N3urda/hongguoTV `7444bb01aec7b0420740103e551c45f1f66101c9`
and ch6vip/fqapp. Adapted 2026-11-12: ESM exports and the existing sm-crypto SM3
backend for Electron. Only the signing primitives are included; registration,
networking, account data and media addresses are excluded. Protocol constants are
public upstream algorithm data. The local application owns each request identity.

`playback-signing.js` adapts only the signing algorithm block of:

- `woshishiq1/drpys`, commit `22261adfa31435e3b3ef5a730b8a2a75bcaf1715`, `spider/js/红果果[短].js` (GPL-3.0).
- Retrieved through [`tsukiyo-zero/hongguoTV/server/vendor/hongguo.cjs`](https://github.com/tsukiyo-zero/hongguoTV/blob/7b764976ad/server/vendor/hongguo.cjs), whose `server/vendor/NOTICE.md` identifies that original source and license.
- Request construction follows the playback signing correction in [`hongguoTV a5b2587440242fd17f7f92d14a9c841b7c87c21f`](https://github.com/tsukiyo-zero/hongguoTV/commit/a5b2587440242fd17f7f92d14a9c841b7c87c21f).

Retrieved and adapted 2026-11-06. Distributed under GPL-3.0-only; the complete license text is in the repository root `LICENSE`.

Changes: ESM import, branch-0-only hashing, explicit per-request device/version input, injectable clock/random for offline oracle checks, and a GET-only playback request builder. No upstream device identifiers, account credentials, networking, content proxy, or media decryption implementation are included in this module. Synthetic offline test vectors are identified separately in `tests/fixtures/playback-signing.json`.

The application signature fingerprint required by anonymous registration is a public protocol constant, cross-checked against `hongguoTV/kotlin-tv/core/src/main/kotlin/com/hongguotv/core/DeviceRegister.kt`; it is not an account secret or an installation identity.

SM3 is supplied by sm-crypto 0.5.8 (JuneAndGreen/sm-crypto, MIT), because Electron BoringSSL does not provide a native SM3 digest. Its LICENCE_MIT is retained with the packaged dependency.
