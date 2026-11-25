Windows SDK playback component

The application invokes the unmodified hongguo-sdk-playback.exe from
jackotom/hongguo-drama v8.2 in a separate process. Exact binary and source
archive hashes, dependency versions and public download locations are in
source-manifest.json. The component's corresponding source archive is
distributed with this application's GitHub release as *-sdk-sources.zip.

Rebuild the helper using the upstream windows-source archive's
scripts/build-sdk-playback-win.ps1 with Python 3.11 and its pinned dependencies.
The script builds the PyInstaller bootloader with --no-cfg for Unicorn.
Our scripts/prepare-sdk-playback.mjs verifies and packages the release binary;
it does not install the upstream application or change user data.

The helper source is supplied under upstream GPL-3.0. Unicorn includes GPL-2.0
engine code and BSD Python bindings; its complete source and original notices
are included in the corresponding source bundle. PyInstaller uses GPL-2.0-or-
later with a bootloader exception. Python uses the PSF license. Requests and
urllib3 use Apache-2.0/MIT; idna, charset-normalizer, PyCryptodome and setuptools
retain their BSD/MIT/public-domain notices. Certifi uses MPL-2.0. Exact original
license texts are extracted from the pinned source distributions into notices.

At first use the helper obtains integrity-checked inputs from the official
application and creates a new anonymous device in the selected local profile.
No account cookies are imported. SDK images, configuration, device/session
state, signed media URLs and media keys are not included in our source or
release assets. The application never logs helper stdout/stderr.

Reference: https://github.com/jackotom/hongguo-drama/releases/tag/v8.2
