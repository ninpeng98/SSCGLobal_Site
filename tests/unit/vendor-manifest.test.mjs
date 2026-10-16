import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderManifest, SOURCES } from '../../scripts/vendor-manifest.mjs';
import { parseVendorManifest } from '../../scripts/verify.mjs';

test('renderManifest lists every library and round-trips through parseVendorManifest', () => {
  const files = [
    { file: 'assets/vendor/gsap-3.15.0/gsap.min.js', sha384: 'sha384-AAA=' },
    { file: 'assets/vendor/lenis-1.3.26/lenis.min.js', sha384: 'sha384-BBB=' },
  ];
  const md = renderManifest(SOURCES, files);
  for (const s of SOURCES) assert.ok(md.includes(`\`${s.npm}\``), `missing ${s.npm}`);
  assert.deepEqual(parseVendorManifest(md), files);
});

test('SOURCES pins the versions from the spec', () => {
  assert.deepEqual(SOURCES.map((s) => s.npm), ['gsap@3.15.0', 'lenis@1.3.26', 'canvas-confetti@1.9.4']);
});
