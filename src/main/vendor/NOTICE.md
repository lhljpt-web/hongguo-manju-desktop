# Third-party signing primitives

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
