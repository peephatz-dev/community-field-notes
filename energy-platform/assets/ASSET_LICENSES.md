# Asset provenance and licenses

Prepared 14 October 2026 for the Community Energy Resilience Platform. All rendering assets are self-hosted; the live application does not call the Poly Haven API.

## Public domain rendering assets

Poly Haven states that its HDRIs, textures and 3D models are licensed under [CC0 1.0](https://polyhaven.com/license). They may be redistributed and used commercially. Source API requests used the `CommunityEnergyResilienceAssetPreparation/1.0` User-Agent in accordance with [Poly Haven API Terms](https://github.com/Poly-Haven/Public-API/blob/master/ToS.md).

The textures were downloaded at 1k and resized to 512 px as JPEG quality 87. The model geometry was preserved, with source glTF and binary buffers packed as GLB and textures resized to 512 px. The HDRI was retained at 1k. Source download MD5 values were checked before conversion.

| Local path | Size | Source / license | Intended use |
| --- | ---: | --- | --- |
| `textures/wood-planks-diffuse.jpg` | 55 KiB | [wood_planks_grey](https://polyhaven.com/a/wood_planks_grey) · [CC0](https://polyhaven.com/license) | Walkway deck, weathered village cladding and cage walkways |
| `textures/wood-planks-normal.jpg` | 30 KiB | [wood_planks_grey](https://polyhaven.com/a/wood_planks_grey) · [CC0](https://polyhaven.com/license) | Walkway deck, weathered village cladding and cage walkways |
| `textures/wood-planks-arm.jpg` | 36 KiB | [wood_planks_grey](https://polyhaven.com/a/wood_planks_grey) · [CC0](https://polyhaven.com/license) | Walkway deck, weathered village cladding and cage walkways |
| `textures/corrugated-iron-diffuse.jpg` | 57 KiB | [corrugated_iron](https://polyhaven.com/a/corrugated_iron) · [CC0](https://polyhaven.com/license) | Corrugated metal roofing and industrial cladding |
| `textures/corrugated-iron-normal.jpg` | 32 KiB | [corrugated_iron](https://polyhaven.com/a/corrugated_iron) · [CC0](https://polyhaven.com/license) | Corrugated metal roofing and industrial cladding |
| `textures/corrugated-iron-arm.jpg` | 26 KiB | [corrugated_iron](https://polyhaven.com/a/corrugated_iron) · [CC0](https://polyhaven.com/license) | Corrugated metal roofing and industrial cladding |
| `textures/coastal-sand-diffuse.jpg` | 71 KiB | [coast_sand_02](https://polyhaven.com/a/coast_sand_02) · [CC0](https://polyhaven.com/license) | Shore ground / sand surface detail |
| `textures/coastal-sand-normal.jpg` | 80 KiB | [coast_sand_02](https://polyhaven.com/a/coast_sand_02) · [CC0](https://polyhaven.com/license) | Shore ground / sand surface detail |
| `textures/coastal-sand-arm.jpg` | 32 KiB | [coast_sand_02](https://polyhaven.com/a/coast_sand_02) · [CC0](https://polyhaven.com/license) | Shore ground / sand surface detail |
| `sky/kloppenheim_06_puresky_1k.hdr` | 1146 KiB | [kloppenheim_06_puresky](https://polyhaven.com/a/kloppenheim_06_puresky) · [CC0](https://polyhaven.com/license) | Outdoor sky environment lighting / reflections; not a field photograph |
| `models/utility-box.glb` | 280 KiB | [utility_box_01](https://polyhaven.com/a/utility_box_01) · [CC0](https://polyhaven.com/license) | Generic detailed industrial enclosure prop; conceptual reconstructed equipment exterior |
| `models/portable-generator.glb` | 1225 KiB | [portable_generator](https://polyhaven.com/a/portable_generator) · [CC0](https://polyhaven.com/license) | Optional generic workshop or backup equipment visual prop; not established installed equipment |

The utility box model is approximately 0.52 × 1.12 × 0.432 m and contains 4,404 triangles. The generator model is approximately 0.819 × 0.577 × 0.564 m and contains 26,419 triangles. They are generic appearance references, not evidence of the community’s installed devices or a specified tested product. The generator is an optional illustrative prop; the project’s current backup simulation does not assert a real installed generator.

No accurately licensed southern Thai fishing-boat GLB or exact ESP32/sensor hardware model was identified within the selected primary libraries. Fishing boats, cages, low voltage prototype equipment and buildings can be reconstructed with detailed procedural geometry informed by the images below. Do not present such geometry as surveyed digital-twin capture.

## Authentic field references

These photographs were already included in the user-provided Data Pack and published in the existing project repository and visual library. They are copied unchanged for the same project’s field-reference gallery. No CC0 or external redistribution license is asserted for them. Do not use them as PBR textures or imply that the reconstructed 3D environment reproduces their exact geography.

| Local path | Existing published source | Original Data Pack path | Observed reference |
| --- | --- | --- | --- |
| `reference/salahum-03.webp` | [Source photograph](https://peephatz-dev.github.io/community-field-notes/community-images/salahum-03.webp) | ภาคใต้ _ บ้านศาลาหุม อ.สิงหนคร จ.สงขลา/ภาพถ่ายชุมชน/บ้านศาลาหุม 19.jpg | Fishing cages / blue boat / water color reference |
| `reference/salahum-11.webp` | [Source photograph](https://peephatz-dev.github.io/community-field-notes/community-images/salahum-11.webp) | ภาคใต้ _ บ้านศาลาหุม อ.สิงหนคร จ.สงขลา/ภาพถ่ายชุมชน/บ้านศาลาหุม 33.jpg | Weathered wooden platform / low village roofs / water tank reference |
| `reference/salahum-18.webp` | [Source photograph](https://peephatz-dev.github.io/community-field-notes/community-images/salahum-18.webp) | ภาคใต้ _ บ้านศาลาหุม อ.สิงหนคร จ.สงขลา/ภาพถ่ายชุมชน/บ้านศาลาหุม 9.jpg | Cages next to corrugated-roof shoreline houses reference |

Observed visual cues: grey-green or pale turquoise opaque estuary water; rectangular net cages with thin timber/bamboo supports and blue barrel floats; low shoreline homes with corrugated metal roofs, pale walls and muted red/green metal siding; weathered wooden walkways. These observations inform appearance only and do not establish electrical or water-quality causes.

Total assets in this manifest: **4.32 MB**, including the three field reference images. Machine-readable provenance is in [`public/assets/asset-manifest.json`](public/assets/asset-manifest.json).

## Self-hosted typography

- Manrope (Manrope Project Authors), provided through `@fontsource-variable/manrope` 5.3.0, [SIL Open Font License 1.1](https://github.com/google/fonts/tree/main/ofl/manrope).
- IBM Plex Sans Thai (IBM Corp.), provided through `@fontsource/ibm-plex-sans-thai` 5.3.0, [SIL Open Font License 1.1](https://github.com/google/fonts/tree/main/ofl/ibmplexsansthai).

Fonts are bundled by Next.js and served from the same origin. Complete OFL notices ship in `public/assets/licenses/`.
