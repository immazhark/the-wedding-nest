# TWN media collection: inventory and placement map

Source: `C:\Users\khana\OneDrive\Desktop\TWNMedia` (outside the repo; never committed; originals untouched). Scanned 25 Nov 2026. Stable IDs `M001`-`M364` are the sorted position of each file's relative path at scan time; if files are added later, extend rather than renumber. Per the owner's 18 Nov statement, permission exists for uploaded media; that does not clear identifiable people, names, licence plates or third-party content, flagged below. No numbers on this page are launch approval.

## Coverage (honest counts)

| Measure | Count |
| --- | --- |
| Files discovered (recursive) | 373 (364 at first scan + 9 converted JPEGs, IDs M365-M373) |
| Images (jpg/jpeg/heic/heif) | 308 |
| Videos (mp4) | 56 |
| Exact byte duplicates (extra copies) | 26 (23 images, 3 videos) |
| Distinct images | 285 |
| Distinct images viewed (300 px contact sheets) | 274 |
| Blocked: HEIC/HEIF not decodable here (HEVC); 9 now supplied as JPEG (M365-M373, in Packing/) | 12 files (11 distinct) |
| Videos decoded and sampled (8 frames each + 1.2 s audio-decode probe) | 56, 0 decode errors |
| Videos probed, cut-detected, audio-measured and dense-timeline sampled (ffmpeg) | 53 distinct (3 duplicates) |
| **Videos watched at real-time playback / audio heard** | **0** |
| GPS tags in image EXIF | none found in the 296 decodable images |
| Assets integrated on the site (25 Nov) | 16 live, 27 more prepared for unpublished service pages (T0033-T0058 + trousseau film): catering page M350, M092, M091, M093, M340, M008 and video M107 (T0027-T0032); video M081 (home kitchen arch, #133); images M212, M174, M221, M185, M114, M316, M200 (gallery reel, #134, T0019-T0025); M154 (décor door, T0026) |

Not fully reviewed: images were judged on 300 px thumbnails (subject, composition, obvious quality, visible text/plates/faces), not at 100%; videos were frame-sampled, so motion quality, jump cuts and audio content remain unchecked. Both need a full-resolution/playback pass on each selected asset before publication.

## Exact duplicate groups

- M001 = M249 (048A1291.JPG.jpeg)
- M002 = M251 (048A1303.JPG.jpeg)
- M003 = M263 (048A1315.JPG.jpeg)
- M004 = M298 (048A1359.JPG.jpeg)
- M005 = M299 (048A1360.JPG.jpeg)
- M006 = M302 (048A1363.JPG.jpeg)
- M007 = M303 (048A1364.JPG.jpeg)
- M008 = M305 (048A1366.JPG.jpeg)
- M009 = M307 (048A1368.JPG.jpeg)
- M010 = M308 (048A1369.JPG.jpeg)
- M011 = M309 (048A1370.JPG.jpeg)
- M012 = M310 (048A1371.JPG.jpeg)
- M013 = M322 (048A1383.JPG.jpeg)
- M014 = M015 (1-1.jpg (1).jpeg)
- M018 = M133 (1000002112.heic)
- M019 = M041 (1000011407.jpg.jpeg)
- M021 = M067 (1000011776.mp4)
- M026 = M076 (20250811_180919.mp4)
- M027 = M028 (20251125_205931 (1).mp4)
- M042 = M190 (Cars/IMG-20250722-WA0001.jpg)
- M110 = M111 (Catering/SIA03246 (1).jpg)
- M116 = M117 = M118 (Catering/VAR01846 (1).JPG)
- M185 = M245 (Grooms/SIA02720.JPG)
- M186 = M246 (Grooms/SIA02757.JPG)
- M192 = M202 (IMG-20250821-WA0300.jpg.jpeg)

## HEIC/HEIF resolution — 25 November 2026

ffmpeg 9.1 (Gyan full build) decodes every HEIC/HEIF original in one command: `ffmpeg -i <file> -frames:v 1 -q:v 2 out.jpg` (the grid of tiles is stitched to the full 4284x5712 frame). All 11 distinct files, including `1000002088.heic` and `Floral/IMG_1540.HEIC`, were converted and previewed on a contact sheet; originals are untouched and the JPEGs are not yet in the repository or collection. Findings before any use:

- `1000002088.heic` (M017): trousseau basket of six tulle-wrapped pouches; MK, DKNY and Calvin Klein branded goods are legible, so prefer a crop or the unbranded Packing frames until the owner decides about third-party brands.
- `Floral/IMG_1540.HEIC` (M170): purple-and-yellow draped backdrop with white flower frame, but a wall air-conditioner, ceiling fan and a plain sofa dominate the frame. Needs a tight crop or exclusion; not hero quality.
- Favours M132-M134: M133 duplicates M018. M134 shows cone labels with printed personal names/wording: do not publish without the client's permission or a blur.
- Packing M224-M229: usable tulle-and-ribbon trousseau frames (baskets, footwear, suitcases); consistent with the Trousseau page selection.

The "convert the 11 blocked HEIC files" item below is therefore a decode question solved; the remaining work is selection and privacy review.

## Blocked (HEIC/HEIF, Chrome/sharp cannot decode)

- M017 1000002088.heic (3.6 MB)
- M018 1000002112.heic (3.7 MB)
- M132 Favours/1000002006.heif (2.7 MB)
- M133 Favours/1000002112.heif (3.7 MB)
- M134 Favours/1000002114.heif (1.5 MB)
- M170 Floral/IMG_1540.HEIC (2.5 MB)
- M224 Packing/1000001958.heif (3.9 MB)
- M225 Packing/1000001962.heif (3.6 MB)
- M226 Packing/1000001996.heif (2.5 MB)
- M227 Packing/1000002074.heif (2.5 MB)
- M228 Packing/1000002078.heif (2.5 MB)
- M229 Packing/1000002082.heif (3.3 MB)

Needs conversion on the owner's phone/Windows HEIF extension to JPEG, or a decoder with HEVC support. Not skipped silently: status **blocked**.

## Images: what is in the collection (range-level, from the contact sheets)

| IDs | Subject | Quality and notes |
| --- | --- | --- |
| M001-M005, M013, M248-M254 (+dups) | Hall with TWN catering banner; service team of 4 posing | Bright, sharp; faces identifiable (staff). Team shots M002/M248/M250 usable pending staff comfort |
| M003, M259-M273 | Full catering team group (about 12) in front of lit hall | Many near-identical frames; pick one. Faces identifiable; staff consent |
| M274-M291 | Same team from behind, banner centre; one man in TWN shirt back-to | Good "brand" back shots, no faces; M278-M286 strong |
| M255-M258 | Man in blue holding banner (founder or staff, unconfirmed) | Do not name |
| M287-M297 | Live kitchen counter in carved arch hall with banner and cooks | Strong catering context; M287-M290 wide, M291-M295 closer; cooks' faces small |
| M004-M012, M304-M318, M051-M065, M087-M097, M120-M126, M312-M342 | Food: starters, desserts, biryani, salads, round-table spreads | Large set of strong food photography; M008, M054, M057, M306, M313, M314-M318 (biryani), M339-M340, M349-M350 are the best focal-shot candidates. Near-duplicates abound (M314/M315, M316-M318, M334-M336) |
| M319-M333, M347-M361 | Round table buffet spread with banner and hall | Good wide set; M352-M354 clean; M355-M361 include two men posing (identifiable) |
| M084, M094, M110, M112-M118 | Place settings: gold-rimmed bowls, napkins, long table, shallow focus | Premium detail, no faces. M112-M116 strong |
| M064, M099, M106, M191, M212-M215 | Long banquet / round table / pink table / outdoor night seating with string lights | M212-M215 night garden seating very strong atmosphere; M064 has guests' faces |
| M127-M131, M205-M209, M204 | Hall stage décor (floral, chandeliers, sofas), ceiling chandeliers; M204 camera LCD with nikah | M130/M131/M205/M206 excellent; M130 already used on the site (hero) |
| M153-M159, M161-M169, M152, M160, M163 | Marigold-jasmine haldi backdrop, door garlands, staircase garlands, pink-and-gold floral backdrop, trays | Home-event décor; phone photos 3-4 MP quality: fine at medium size, not hero |
| M148-M151, M169 | Bridal bed with rose petals | Strong colour; private-room imagery, confirm sensitivity |
| M171-M177 | Groom portraits (in sherwani and turban) and father adjusting turban | Excellent; identifiable people; M171/M173/M174 portrait candidates |
| M178-M184 | Dark tuxedo bow-tie detail series (7 near-identical) | Very dark; pick one at most |
| M185, M186 (+M245, M246) | Nikah paper signing, handshake with jasmine bracelets | Strong; hands only, names on document not legible at this scale |
| M192, M199-M201 | Mehndi hands; M192 group | M192 already on site; M199-M201 great vertical detail |
| M221-M223 | Garlanded couple holding hands, gold dress | Strong; faces absent |
| M135-M147, M152, M216-M220 | Favours with printed invitation cards, welcome boards | Real client names and dates are legible on cards and boards. Do not publish without blur/consent |
| M136, M138, M188, M189, M193, M194, M196, M210, M232, M242, M243 | Favour boxes, jasmine bracelets, hampers, gift bags | Product-style detail; clean; M136/M138/M196 on-brand (Qubool Hai) |
| M233-M241, M244 | Trousseau and gift trays, outfit stand | Phone photos, clutter; moderate |
| M042-M050, M019, M041 | Decorated wedding cars at night/day | Licence plates legible: blur before use. M043 (car at hall) and M042 best |
| M014-M016, M034-M040, M247 | Menu deck slides (about, packages, four menus, add-ons, goal, contact with QR) | Graphics, not photography; source for approved text only. Do not use as imagery |
| M195 | Man holding two jasmine garlands | Identifiable person |
| M211 | Dry-ice fog entry, people on a stage | Faces; atmospheric |
| M208 | Black-and-white sofa and decor detail | Pleasing detail |

## Videos (56; ffmpeg 9.1 review: probe, scene cuts, audio levels, timestamped sheets)

Every video was probed and scanned with ffmpeg (25 Nov, local only): true display size (phone clips carry
rotation metadata), duration, frame rate, scene-cut count and mean audio level, plus a timestamped contact
sheet at roughly one frame per 1-2 seconds across the whole timeline. The strongest candidates were
inspected on those dense sheets before any clip was chosen. **Not done:** real-time playback and listening,
so audio content (speech or music) is unverified; every published clip is encoded silent. "Loud" tracks are
probably music from the phone or an editor: rights are unknown, another reason to publish silent.

| ID | Path | Display size | Duration | fps | Audio | Scene cuts | Subject, notes, use |
| --- | --- | --- | --- | --- | --- | --- | --- |
| M020 | 1000011773.mp4 | 1920x1080 | 1.0 s | 31.2 | ambient (-20 dB) | 0 | Chef at kitchen counter plating; 1 s clip + logo sting (too short) |
| M021 | 1000011776.mp4 | 1072x1920 | 7.3 s | 30.2 | silent track | 1 | Dessert pot being stirred with wooden paddle; ends on TWN logo sting. Strong, no faces |
| M022 | 1000115024.mp4 | 2160x3840 | 49.6 s | 60 | loud (-11 dB), likely music | 35 | Wedding highlight reel (groom, shoes, flame, hands, embraces). 2160x3840, 50 s. Identifiable people; likely third-party videographer work; confirm; **used:** home films (portrait) |
| M023 | 1000130874.mp4 | 1920x1080 | 24.1 s | 50 | loud (-11 dB), likely music | 9 | Venue-at-night + wedding details reel, watermark top-left; confirm origin; **used:** home films + photo-film door loop 4.8-10.8 s |
| M025 | 20250811_180013.mp4 | 1080x1920 | 7.3 s | 30 | ambient (-19 dB) | 0 | Large pot of meat curry, steam. Strong texture, no faces |
| M026 | 20250811_180919.mp4 | 1080x1920 | 10.1 s | 30 | ambient (-21 dB) | 0 | Pot with steaming bone-in meat curry, no faces |
| M027 | 20251125_205931 (1).mp4 | 1080x1920 | 3.3 s | 28.7 | ambient (-28 dB) | 0 | Orange curry bubbling in copper pot, clean, 3.3 s loop candidate |
| M028 | exact duplicate of M027 | | | | | | |
| M029 | 20260115_212434.mp4 | 1080x1920 | 5.3 s | 30 | ambient (-28 dB) | 0 | Decorated white SUV with red ribbon; photographers visible (faces); handheld; **used:** home transport door loop 2.5-5.3 s |
| M030 | 20260405_163117.mp4 | 720x1280 | 6.5 s | 30 | ambient (-23 dB) | 0 | Guests eating at round tables, faces/backs; handheld |
| M031 | 20260601_224642.mp4 | 720x1280 | 5.7 s | 30 | ambient (-27 dB) | 0 | Photographer in street at night beside decorated car; faces |
| M032 | 20260603_205311.mp4 | 720x1280 | 7.8 s | 30 | ambient (-19 dB) | 0 | Saffron milk dessert stirred in huge pot. Strong, no faces |
| M033 | 20260603_205810.mp4 | 720x1280 | 5.9 s | 29.9 | ambient (-24 dB) | 0 | Kheer/white dessert with nuts in pot. Good texture, no faces |
| M066 | Catering/1000000429.mp4 | 540x960 | 16.2 s | 30 | loud (-17 dB), likely music | 4 | Kebab/biryani prep montage with burned-in "Hyderabadi pakwaan" text + logo sting |
| M067 | exact duplicate of M021 | | | | | | |
| M068 | Catering/20250811_111749.mp4 | 1080x1920 | 5.5 s | 30 | ambient (-23 dB) | 0 | Raw goat carcasses, close. Not suitable for public use |
| M069 | Catering/20250811_113101.mp4 | 1080x1920 | 11.3 s | 30 | ambient (-25 dB) | 0 | Raw meat being butchered on block. Not suitable for hero use |
| M070 | Catering/20250811_114022.mp4 | 1080x1920 | 12.7 s | 30 | ambient (-26 dB) | 0 | Raw chicken piles. Not suitable for hero use |
| M071 | Catering/20250811_121721.mp4 | 1080x1920 | 6.6 s | 30 | ambient (-21 dB) | 0 | Rice soaking in large pan; weak |
| M072 | Catering/20250811_124940.mp4 | 1080x1920 | 10.5 s | 30 | ambient (-21 dB) | 0 | Dry-goods/ingredients tables; clutter, branded packaging; weak |
| M073 | Catering/20250811_125009.mp4 | 1080x1920 | 6.4 s | 30.1 | ambient (-22 dB) | 0 | Packaged spices/branded bottles; third-party brands; weak |
| M074 | Catering/20250811_165629.mp4 | 1080x1920 | 5.5 s | 30 | ambient (-19 dB) | 0 | Green chicken curry in pan; mediocre |
| M075 | Catering/20250811_180303.mp4 | 1080x1920 | 8.5 s | 30 | ambient (-18 dB) | 0 | Dark masala meat in pan, steam; good texture |
| M076 | exact duplicate of M026 | | | | | | |
| M077 | Catering/20250811_183734.mp4 | 1080x1920 | 16.1 s | 30 | ambient (-18 dB) | 0 | Capsicum-meat pan, 16 s static; usable b-roll |
| M078 | Catering/20250811_183834.mp4 | 1080x1920 | 4.8 s | 30 | ambient (-18 dB) | 0 | Glossy dark masala being stirred; good |
| M079 | Catering/20250811_224738.mp4 | 1080x1920 | 10.5 s | 30 | ambient (-22 dB) | 0 | Empty table settings pan; weak, wobbly |
| M080 | Catering/20250811_230052.mp4 | 1080x1920 | 12.4 s | 29.9 | ambient (-24 dB) | 0 | Hall full of seated guests (faces); wobbly walk |
| M081 | Catering/20250811_233230.mp4 | 1080x1920 | 6.5 s | 30 | ambient (-18 dB) | 0 | Chef (TWN apron) plating dish into plate with sauce; strong, shows craft; face visible; **used:** home kitchen arch (#133) |
| M082 | Catering/20250811_233243.mp4 | 1080x1920 | 8.1 s | 30 | ambient (-19 dB) | 0 | Chef plating mutton from pot; strong; face visible |
| M083 | Catering/20250811_233307.mp4 | 1080x1920 | 7.3 s | 30 | ambient (-19 dB) | 0 | Chef ladling haleem-like dish into bowl; strong; face visible |
| M085 | Catering/20250812_005735.mp4 | 1080x1920 | 7.3 s | 30 | ambient (-23 dB) | 0 | Dry-ice fog over banquet table, guests (faces); atmospheric, shaky |
| M098 | Catering/20251125_204505.mp4 | 1080x1920 | 35.0 s | 29.9 | ambient (-29 dB) | 3 | Walk along laden banquet table (35 s); food strong, some wobble |
| M100 | Catering/20251221_224803.mp4 | 1080x1920 | 7.1 s | 30 | ambient (-29 dB) | 0 | Large hall dinner service (faces) |
| M101 | Catering/20260104_133313.mp4 | 1080x1920 | 10.5 s | 29.9 | loud (-17 dB), likely music | 0 | Open-air kitchen yard, wobbly, messy; weak |
| M102 | Catering/20260405_140629.mp4 | 1280x720 | 6.2 s | 29.9 | ambient (-27 dB) | 0 | Round table with PRIME carton and decor; landscape, weak |
| M103 | Catering/20260603_204616.mp4 | 720x1280 | 4.4 s | 30 | loud (-14 dB), likely music | 0 | Crispy-crust dum biryani top, close; good, 4.4 s |
| M104 | Catering/20260603_204639.mp4 | 720x1280 | 6.1 s | 29.9 | loud (-15 dB), likely music | 0 | Clay pots + curry pan; short; fair |
| M105 | Catering/20260603_204714.mp4 | 720x1280 | 4.0 s | 30 | loud (-17 dB), likely music | 0 | Biryani layer with fried onions close; fair |
| M107 | Catering/InShot_20251025_155158595.mp4 | 1080x1920 | 21.2 s | 30.1 | silent track | 2 | Chef plates starter/biryani, TWN apron; InShot edit with logo sting; strong sequence; **used:** catering film (#138) |
| M108 | Catering/InShot_20251126_150834901.mp4 | 1080x1920 | 20.1 s | 30.1 | silent track | 0 | Haleem-like pot being stirred + plating; logo sting end |
| M109 | Catering/InShot_20260622_153843867.mp4 | 1080x1920 | 43.1 s | 30 | ambient (-25 dB) | 18 | Personal talking/interview style: man seated beside mosque-style building, kitchen b-roll; speech audio unreviewed; personal/identifiable |
| M119 | Catering/VID_20250613_050437_236.mp4 | 720x900 | 11.9 s | 30 | none | 0 | Raw meat cutting on tarp; no audio. Not for public use |
| M164 | Floral/20260601_153748.mp4 | 720x1280 | 23.4 s | 29.9 | near-silent (-36 dB) | 2 | Floral door/bed decor in a flat; vertical phone walk-through; **used:** home décor door loop 0.2-5.6 s |
| M187 | Haldi.mp4 | 1080x1920 | 17.7 s | 60 | ambient (-18 dB) | 3 | Haldi decor marigold-jasmine backdrop walk-through; burned-in @twn.events (former domain) so unusable unedited |
| M197 | InShot_20251217_010147774.mp4 | 1080x1920 | 18.0 s | 30.1 | silent track | 4 | Plating starters/biryani; TWN apron; logo end; strong; **used:** home catering door loop 5.9-9.7 s |
| M198 | InShot_20260616_175109909.mp4 | 1080x1920 | 21.4 s | 30.1 | silent track | 2 | Catering banner + buffet table walk; burned-in numbers; decent |
| M203 | Mix/1000009166.mp4 | 720x1280 | 13.6 s | 30 | loud (-17 dB), likely music | 2 | Building facade lit for wedding with "shadi wala ghar", @thewedding.nest overlays; nice but overlaid text |
| M230 | Packing/1000006623.mp4 | 720x1280 | 20.7 s | 30 | loud (-15 dB), likely music | 10 | Gifted trousseau packing with "Packed with perfection" overlay; logo sting; **used:** trousseau film (prepared) |
| M231 | Packing/1000007152.mp4 | 544x960 | 39.3 s | 30 | loud (-16 dB), likely music | 0 | Packed shoes/trousseau with overlay "Dream, delicately packed"; logo sting |
| M343 | TWN/048A1404.MP4 | 1920x1080 | 4.6 s | 25 | near-silent (-43 dB) | 0 | Round-table buffet spread + banner, 1080p static; clean |
| M344 | TWN/048A1405.MP4 | 1920x1080 | 4.1 s | 25 | near-silent (-42 dB) | 0 | Round-table spread + banner, static; clean |
| M345 | TWN/048A1407.MP4 | 1920x1080 | 5.6 s | 25 | near-silent (-43 dB) | 0 | Overhead-ish round table spread; clean |
| M362 | VID-20250911-WA0010.mp4 | 720x1280 | 9.2 s | 30 | ambient (-28 dB) | 1 | Decorated Maybach, licence plate readable; privacy blur needed |
| M363 | VID-20251021-WA0034.mp4 | 478x850 | 6.9 s | 30.1 | ambient (-22 dB) | 1 | Cook plating crispy starters; TWN apron; face visible |
| M364 | VID-20251021-WA0038.mp4 | 478x850 | 17.1 s | 30 | ambient (-25 dB) | 1 | Cook plating a white dessert, garnish; TWN apron; strong |

## Where the collection helps the current site (from `docs/progress.md` open items)

| Site gap | Candidates | Notes |
| --- | --- | --- |
| Catering page hero is a blurred chandelier, not food | M349/M350 (biryani with banner, shallow focus), M352-M354, M319-M321 | Food-led, shows the banner and hall; one asset only |
| Catering arch loop is a flat saffron close-up | M032 (saffron dessert stir), M021 (stir, trim logo sting), M027, M103 | Silent, 3-6 s, loop; no faces. M081/M082/M363/M364 show real craft but include faces/branded aprons (staff approval) |
| "Makeup and beauty" door shows mehndi hands | No makeup photo in the collection | Use M199-M201 for a Mehndi door or relabel; no invented capability |
| Hall-stage photo repeats | M205, M206, M207, M131, M212-M215 | M212-M215 (night garden seating) adds variety |
| Mehendi, nikah, groom details | M171-M177, M185, M186, M221-M223, M199-M201 | Consent for identifiable groom/family |
| Haldi/home decor, gifting, packing | M153-M155, M161, M162; videos M230/M231 | Possible new "decor and gifting" row; owner must confirm these are services, not just one-off work |
| Favours | M136, M138, M196, M188 | Avoid M135-M147 (names) |
| Cars | M043, M042, M049 | Blur plates; confirm whether car decoration is a service |

## Owner decisions (25 Nov: faces, client names on cards, plate blur, `twn.events` overlays to be ignored, no raw-meat imagery; all cleared or instructed)

Remaining follow-ups: blur licence plates before any car image or video (M042-M050, M019, M029, M362) goes live; never publish M187 or other `twn.events` overlays unedited; keep audio muted until heard.

## Original decisions (superseded by the above)

1. Faces: staff team (M002, M003, M248-M273, M355-M361), groom/family (M171-M177), guests (M064, M211, several videos), chefs in videos. Which may be shown?
2. Client names/dates on invitations and welcome boards (M135-M147, M152, M216-M220). Recommend not publishing without blur or consent.
3. Licence plates (cars): blur before use, as done for earlier media.
4. Third-party-looking footage (M022, M023 edited reels, M203 overlay) and branded/overlay footage (M187 shows the former domain @twn.events; never publish it).
5. Raw-meat clips (M068-M070, M119): not for marketing pages.
6. M109 (talking head, speech audio) and all audio tracks: unreviewed.

## Next steps

- Convert the 11 blocked HEIC files and add them to this inventory.
- Full-resolution check and crop for each selected image, then derivatives through the existing manifest and pipeline (`src/content/media/*.json`, `src/assets/events/`); videos encoded small and muted with posters, outside the image glob until the video pipeline exists.
- First proposed integration PR: catering hero + arch loop + one new décor and one mehendi image, subject to the decisions above.
