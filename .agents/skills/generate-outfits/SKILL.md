---
name: generate-outfits
description: Curate complete outfits from the local Wardrobe database and generate identity-preserving square modeled photos for every selected look end to end. Use when a user asks Codex for outfit ideas, combinations, looks, styling suggestions, a lookbook, or modeled outfit images based on clothes already imported into this Wardrobe.
---

# Generate Outfits

Create a complete local outfit collection from `data/library.json`: select strong combinations, generate a square modeled image for each, verify every result, and save the finished manifest and images under `data/`.

## Begin with the count

Ask `How many outfits would you like me to generate?` unless the user already provided a positive count. Do not choose a default silently.

Also obtain the intended season, occasions, dress codes, or styling direction when the user named them. Otherwise create a balanced everyday mix without blocking on more questions.

Do the workflow end to end after receiving the count. Do not stop after returning suggestions, a manifest, or prompts.

## Requirements

- Read and follow the built-in `imagegen` skill before generating images.
- Require `data/library.json`, enough tops and bottoms for the requested count, and a local identity reference at `data/model-reference.png` or `WARDROBE_MODEL_REFERENCE`.
- Keep every source garment and identity image local and unchanged.
- Never add `data/`, the identity reference, garment images, or generated photos to Git.
- Use only wardrobe items that exist in the current database and whose local assets resolve successfully.
- Generate exactly the requested number of unique outfits and exactly one accepted modeled photo for each.

## Parallel work

Use subagents when the user requests more than eight outfits or explicitly asks for parallel generation. Keep one main agent responsible for the complete wardrobe inventory, global combination uniqueness, garment-usage balance, manifest reconciliation, and final QA.

Assign each worker a disjoint set of outfit IDs plus the exact identity and garment reference paths. Require every worker to return the outfit ID, filled prompt, reference list, generated path, status, and visual-review notes. Never allow two workers to generate or write the same outfit ID. Run workers in waves when concurrency is limited, reconcile results after every wave, and resume only missing or failed IDs.

## 1. Inspect the wardrobe

Read `data/library.json`. Resolve `/api/import/library/FILENAME` assets to `data/imported/FILENAME`. Group items by:

- `upperbody` — tops
- `wholebody_up` — jackets and outer layers
- `lowerbody` — bottoms
- `accessories_up` — optional accessories
- `shoes` — optional shoes

Create checkerboard contact sheets of at most 12 garment cutouts and inspect them. Use both metadata and visual evidence; do not style from filenames or colors alone.

For every candidate garment, record the visually observed fit and proportion: fitted, regular, or oversized volume; cropped, waist, hip, or long length; straight, tapered, or wide leg; natural waist position; hem behavior; and real closure. Record only physically supported wearing options such as open, partly fastened, fully fastened, tucked, shallow front-tucked, or naturally untucked. Also record its dominant hue, warm/cool/neutral temperature, light/medium/dark value, saturation, and whether texture changes how the color reads. These observations override vague names and tags.

If the wardrobe cannot support the requested number of genuinely distinct outfits, tell the user the maximum useful count and ask whether to continue with that number.

## 2. Curate the combinations

For menswear styling, body-proportion requests, Prada-inspired direction, or when the user says prior looks feel ugly, generic, boxy, or catalog-like, read [references/menswear-styling.md](references/menswear-styling.md) before choosing combinations.

Each outfit must contain exactly one top and one bottom, with an optional jacket, shoes, and restrained accessory. Use these principles recovered from the established Wardrobe outfit workflow:

- Favor tonal or analogous color harmony for cohesion.
- Use complementary contrast selectively and keep one color or garment dominant.
- Let one graphic, pattern, texture, or saturated piece carry the statement.
- Balance visual weight and silhouette: pair fuller bottoms with a cleaner top; keep heavier layers over a simple base.
- Use outer layers to frame the base look, repeat a present color, or add one controlled contrast.
- Keep layered looks physically plausible and make every selected garment visibly identifiable.
- Diversify garment usage instead of repeatedly leaning on the easiest neutral pieces.
- Design silhouette first and color second. Every look needs a deliberate waist position, top-to-bottom volume relationship, trouser-to-shoe transition, and one clearly dominant garment or idea.
- Translate body goals through garment proportion and styling only. Preserve the person's real body; never make them artificially taller, thinner, or broader.
- Prada-inspired does not mean merely combining gray, black, brown, and khaki. Use a controlled base plus one purposeful tension: formal with technical, polished shoes with relaxed clothing, a bright inner layer under a sober shell, or a strict line interrupted by one graphic or unusual proportion.
- Reject bland combinations in which every piece has equal visual weight, both top and bottom are loose without a waist strategy, or an untucked mid-hip top sits over relaxed trousers with generic sneakers.

### Choose the best wearing mode

Choose how each garment is worn only after judging the complete outfit. Open, partly fasten, fully fasten, tuck, shallow front-tuck, or leave a garment naturally untucked only when that treatment improves silhouette, color hierarchy, garment visibility, or the waist and shoe line.

- Never vary a garment merely to make the collection look different.
- Preserve the garment's true closure, hem, pockets, and intended construction.
- Keep a gathered, ribbed, elastic, cropped, or structured hem untucked when tucking would erase its defining shape.
- Open an outer layer only when its real closure permits it and the visible inner layer improves the outfit.
- Use the same wearing mode again across multiple looks when it remains the strongest choice.
- Store the chosen treatment and its reason in `styling.layering` or `styling.waist`.

Cover a useful mix of the user’s requested contexts. Without specific direction, balance casual, smart-casual, warm-weather, layered, dark-tonal, and statement looks as the wardrobe permits.

### Mandatory color gate

Color is a separate pass/fail decision, not an afterthought to silhouette. Before keeping a combination:

- Name one dominant color family, one supporting family, and at most one deliberate accent. Neutrals may bridge them but must not all sit at the same muddy value.
- Keep roughly 60–80 percent controlled base, 20–30 percent support, and 5–15 percent accent when a saturated accent exists.
- Check hue temperature and value together. Warm brown, camel, cream, and olive may harmonize, but require a dark or light anchor when their values are too similar. Cool gray, navy, black, and white require enough value separation to keep layers readable.
- Make the footwear either continue the trouser line, repeat a color already present above the waist, or act as the single intentional interruption. Reject an isolated shoe color with no visual explanation.
- A graphic, check, logo, or bright top already supplies accent colors. Keep the rest quiet and do not introduce a second unrelated accent.
- Tonal outfits pass only when at least two of value, temperature, texture, or material clearly separate adjacent garments.
- Judge colors from the garment cutouts and modeled output under neutral light; do not trust metadata names alone and do not let warm scene grading turn gray into brown, cream into yellow, or navy into black.

Build `$WORK/outfits.json` with the final target count:

```json
{
  "version": 1,
  "outfits": [
    {
      "id": "navy-camel-classic",
      "name": "Navy & Camel Classic",
      "occasion": ["smart-casual", "office"],
      "garmentIds": ["import-...", "import-..."],
      "reason": "Deep navy and camel create controlled warm-cool contrast.",
      "styling": {
        "silhouette": "short open jacket over a tucked fitted top and full straight trousers",
        "waist": "natural-to-high waist remains visible",
        "hem": "one clean trouser break over a low-profile shoe",
        "layering": "outer worn open using its real closure",
        "colorLogic": "navy is the dark dominant base, camel is the warm supporting field, and black footwear repeats the dark upper line",
        "shoeLogic": "polished shoe sharpens the relaxed trouser",
        "tension": "technical outer against tailored trouser",
        "pose": "mid-step, torso slightly off-axis, clothing unobstructed"
      },
      "styleScore": 9,
      "setting": "a quiet warm-stone courtyard with restrained greenery",
      "image": "outfit-images/navy-camel-classic.png",
      "status": "planned"
    }
  ]
}
```

Use stable lowercase hyphenated IDs. Reject duplicate garment combinations even when names or settings differ.

### Mandatory styling audit

First require the mandatory color gate to pass and store its concrete logic as `styling.colorLogic`. Then score each planned look from 0 to 2 on five dimensions: silhouette intention, body-proportion logic, visual hierarchy, purposeful tension, and shoe/hem resolution. Keep only looks scoring at least 8/10 with no zero. Store the total as `styleScore` and the concrete decisions in `styling`.

Automatically reject a look before rendering when any of these is true:

- no clear waist, vertical frame, or deliberate long line
- oversized or boxy top plus wide/relaxed bottom without a strong counterbalance
- multiple graphics, patterns, logos, or utility-pocket systems competing
- default neutral layering that has neither silhouette interest nor material/category tension
- three unrelated color families or more than one saturated accent competing for attention
- adjacent brown, khaki, gray, olive, or cream pieces collapsing into one muddy mid-value block
- footwear introducing an isolated color that neither continues the trouser nor repeats or deliberately interrupts the upper palette
- trouser length and shoe shape produce an accidental ankle gap, excessive pooling, or bulky cutoff
- the proposed styling depends on inventing a closure, changing garment length, or hiding a selected piece
- a tuck, roll, or unfastened treatment is used for novelty but weakens the garment's real shape or the outfit's proportions

## 3. Prepare references and prompts

Create one generation package per outfit:

1. Identity reference
2. Exact top cutout
3. Exact bottom cutout
4. Optional exact outer layer
5. Optional exact shoes or accessory only when deliberately selected

Read [references/outfit-image-prompt.md](references/outfit-image-prompt.md) and fill its template from the exact outfit record. Inspect every outer-layer reference before choosing the layered clause; never infer a zipper, buttons, placket, opening, or closure.

Fill the prompt's styling direction from the audited `styling` record. State the selected natural wearing mode, visible waist when relevant, outer closure treatment, color hierarchy, trouser break, shoe relationship, and pose. Do not let the generator improvise these decisions.

Use one unified background for the complete collection. Unless the user supplies a different fixed setting, use the same cool-neutral gray architectural gallery or passage, soft directional natural daylight, near-neutral color grade, no visible signage or readable environmental text, and the same camera height, lens feel, subject scale, and framing. Vary only the pose enough to keep garments readable. Do not rotate locations, times of day, or color casts between looks.

## 4. Generate every outfit

Create one square 1:1 modeled PNG per outfit with Imagegen. Save working outputs outside `data/` until they pass review. Use the smallest valid set of references for each call and never omit a selected garment.

Generate in bounded batches when the collection is large. Track every outfit as `planned`, `generated`, `accepted`, or `failed`; resume only missing or failed IDs.

## 5. Verify and correct

Compare every output against the identity and all garment references. Inspect contact sheets of at most 12 modeled outfits, then open questionable images individually.

Require:

- recognizable identity, face, hair, age, build, and body proportions
- every selected garment present and recognizable
- exact garment color, material, fit, construction, graphics, logos, text, proportions, and closures
- complete head-to-shoes framing with readable outfit and realistic anatomy
- natural layering without invented openings or hidden inner pieces
- no unselected visible garments except plain neutral shoes or invisible basics when no shoes were selected
- no extra person, text overlay, watermark, product mockup, or synthetic AI polish
- the planned waist, hem, layering, dominant idea, and shoe relationship are visibly executed
- exact garment hues remain faithful and the planned dominant/support/accent hierarchy remains readable without muddy value collapse or scene-induced color drift
- an editorial walking or off-axis stance rather than a stiff symmetrical catalog pose, unless symmetry is a deliberate part of the audited look

Regenerate identity drift, missing or redesigned garments, fake closures or text, anatomy failures, or cropped feet. Do not mark an outfit accepted based on plausibility alone.

## 6. Deliver locally

After all requested outfits pass:

1. Create `data/outfit-images/` if needed.
2. Copy each accepted PNG to `data/outfit-images/OUTFIT-ID.png`.
3. Set every accepted manifest image to `/api/import/outfits/OUTFIT-ID.png` only if the app exposes that endpoint; otherwise keep the repository-relative `outfit-images/OUTFIT-ID.png` path.
4. Atomically write the exact requested collection to `data/outfits.json`.
5. Reopen every copied file and verify that the count of images, unique outfit IDs, and accepted manifest records all equal the number the user requested.

Do not claim the current gallery displays outfits unless the app has an outfit route. The completed local assets and manifest are still the deliverable.

## Finish

Report the requested and completed count, output paths, any regenerated failures, and the styling mix. Display up to 12 modeled outfits in chat and point the user to the local folder for the rest.
