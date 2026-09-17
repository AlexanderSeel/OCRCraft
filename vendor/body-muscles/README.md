# OCRCraft WebP registration

Source: https://github.com/vulovix/body-muscles

Pinned commit: `15c8085ee97cb94c51f92c75224416b15f955b5c`.
The upstream front/back definitions contain 89 regions (including joints,
hands, feet, head and spine), not 89 distinct muscles.
`paths.json` extracts the original IDs, names, views and SVG paths.
Apache-2.0 license and original NOTICE are included alongside it.

## Changes made by OCRCraft

- `calibration.json`: independently calibrated target contours on the existing
  376 × 504 WebP, German labels, region kind and legacy training-group mapping.
- `reported-landmarks.json`: trainer-reported uncovered surface points used in
  calibration and regression tests.
- `transformed-svg-contours.json`: source contours sampled and transformed into
  each target region with scanline registration. The source drawing has a
  different pose, proportions and disconnected decorative strips.
- The interactive surface uses the calibrated outer contour to close those
  decorative gaps. Both WebP highlighting and hit testing use that same surface.
  This is an adapted anatomical map, not a single affine scaling of the SVG.

Run `node --import=tsx scripts/calibrate-muscle-map.ts` to rebuild the derived
contours, domain metadata and migration 022. Once migration 022 is deployed,
catalog changes require a new migration; do not rewrite it for deployed data.
No generation API or API key is required.

`detail:<upstream-id>` keeps detailed selections distinct from legacy group IDs.
The 25 semantic trainer groups remain selectable. A group filter includes its
detailed children; a detail filter can find older coarse records but never
infers an opposite-side or sibling-detail mapping. Existing exercises are not
automatically relabeled with unsupported muscle-head or side-specific claims.

Semantic grouping is intentionally separated from physical source identity.
In particular, `serratus-anterior-left` and `serratus-anterior-right` keep their
stable upstream/detail IDs but are exposed through the dedicated `serratus`
training group. Broad `core` combines Abs, Obliques and Serratus, while each
specific group still highlights only its own raster regions.

## Coverage and limits

Automated checks cover all 89 upstream-backed reachable surfaces, every reported
landmark, reference bounds, compatibility, database persistence and
migration idempotence. The pinned commit above is the upstream `main` revision
against which this 89-region manifest was verified.
`node scripts/check-muscle-map.mjs` checks responsive rendering and form state
against a running app at localhost:3000 (Edge by default; BROWSER_CHANNEL can
select another installed Chromium channel).

The raster cannot depict all deep muscles independently. QL, hip-flexor and
other detailed labels denote approximate surface regions; they are not a
medical anatomical segmentation. Head/face, spine, elbow, knee, hand and foot
entries are explicitly classified as body areas in the metadata.
