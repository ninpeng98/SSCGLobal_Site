# Vendored libraries

이 폴더의 파일은 npm 레지스트리 원본을 그대로 복사한 것이다. 고치지 않는다.
받는 법과 무결성 확인: `docs/superpowers/plans/2026-10-08-golden-hour-site-redesign.md` Task 2.
파일을 바꾼 뒤에는 `node scripts/vendor-manifest.mjs` 로 이 표를 다시 쓴다.

| Library | npm | License |
|---|---|---|
| GSAP (core, ScrollTrigger, SplitText) | `gsap@3.15.0` | GSAP Standard "No Charge" License — https://gsap.com/standard-license |
| Lenis | `lenis@1.3.26` | MIT |
| Swiper | `swiper@14.3.0` | MIT |
| canvas-confetti | `canvas-confetti@1.9.4` | ISC |

| File | SHA-384 |
|---|---|
| `assets/vendor/canvas-confetti-1.9.4/LICENSE` | `sha384-zCiVvdizLOnnv+aW3LAAcPWp2r00TJ68ZCRMnR3/wzXJmfS8Ddvzez5pL38sg/8r` |
| `assets/vendor/canvas-confetti-1.9.4/confetti.browser.js` | `sha384-bopE5cbMjKUprmGnIRk2UdvCnHImrRLCtNW2uR6oDYqO+o3XWJeuIrWWxDzeDgNW` |
| `assets/vendor/gsap-3.15.0/LICENSE-NOTE.txt` | `sha384-dzl6/CjBXxGs2gxdKhZXviBla97DTsDbrKqJifuv3TEnwfTwDKMym/GnRlBg4VrN` |
| `assets/vendor/gsap-3.15.0/ScrollTrigger.min.js` | `sha384-wl5TeDVvOWt30Pbf8aSo2ZrzsOjddu3avOBvHe+p+OhJt9gP6w9YXmDkN5DK2/dF` |
| `assets/vendor/gsap-3.15.0/SplitText.min.js` | `sha384-SWJ0lLVRoipvHh59xj0pL7uC7Ih51F+5smaFtrG+2nr+TlDZU5SYJHmxfolbeNTr` |
| `assets/vendor/gsap-3.15.0/gsap.min.js` | `sha384-XmJ9SoHtVOHoQUcKvFAzVXwdkKo1Ie3bhmSoIAkcdsHGaIrVJIkmozyq0FJeb/Ly` |
| `assets/vendor/lenis-1.3.26/LICENSE` | `sha384-PyD8X+O0kEos0JAaO0BiHHWceuXLKAhXm3bbl1G/GzImGZj35/YlMOMtuZBANmVT` |
| `assets/vendor/lenis-1.3.26/lenis.css` | `sha384-gvLq/iOMNnPchdosgVym5huSVkKipHCQaqSw2Eg0V52Mzmlf169ZOsXcNc2cNu8x` |
| `assets/vendor/lenis-1.3.26/lenis.min.js` | `sha384-jqpi9VmOdhyLoLURgjCn7EpnG9BbnHW57ibIZoeaIU+erWDH3k8fQQg0xH2ySjnw` |
| `assets/vendor/swiper-14.3.0/LICENSE` | `sha384-jwhYrp47kgvqiLX1Rlclklm6i3KH4EYiF9nQDClkB4eS/6d2NfnoXjWZSCOfDKKP` |
| `assets/vendor/swiper-14.3.0/swiper-bundle.min.css` | `sha384-xkKzAc7JSlGq3SLCZHugx/i0gfYZf6kaFzg3v9/wz0HtsAFYPLz7aUvCFTac8KBk` |
| `assets/vendor/swiper-14.3.0/swiper-bundle.min.js` | `sha384-nimz5qRuF8SOYqiuzkhgKleYiz6jIj9pUhB/LlAAsbB6I3fI9v9s5RMwMTzEyOAY` |
