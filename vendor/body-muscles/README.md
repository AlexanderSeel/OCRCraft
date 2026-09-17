# OCRCraft WebP registration

Source: https://github.com/vulovix/body-muscles

Pinned commit: `15c8085ee97cb94c51f92c75224416b15f955b5c`.
The upstream front/back definitions contain 89 regions (including joints,
hands, feet, head and spine), not 89 distinct muscles.
`paths.json` extracts the original IDs, names, views and SVG paths.
Apache-2.0 license and original NOTICE are included alongside it.

## Changes made by OCRCraft

- `calibration.json`: independently calibrated target contours on the existing
  376 × 504 WebP, German labels, region kind and mapping to the 24 training groups.
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
The 24 groups remain selectable. A group filter includes its detailed children;
a detail filter can find older coarse records but never infers an opposite-side
or sibling-detail mapping. Existing exercises are not automatically relabeled
with unsupported muscle-head or side-specific claims.

## Coverage and limits

Automated checks cover all 89 reachable surfaces, every reported landmark,
reference bounds, compatibility, database persistence and migration idempotence.
`node scripts/check-muscle-map.mjs` checks responsive rendering and form state
against a running app at localhost:3000 (Edge by default; BROWSER_CHANNEL can
select another installed Chromium channel).

The raster cannot depict all deep muscles independently. QL, hip-flexor and
other detailed labels denote approximate surface regions; they are not a
medical anatomical segmentation. Head/face, spine, elbow, knee, hand and foot
entries are explicitly classified as body areas in the metadata.
