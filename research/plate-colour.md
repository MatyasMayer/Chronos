# Which colour should replace the green plate?

**Outcome:** the owner kept green and chose Leaf `#00612E` by eye, so the recommendation below was not adopted. See the ticket "What is Chronos's visual identity?".

Research for the Yellow Now "Black with Green" theme (`?mode=oled-green`), 2026-11-07.

## The answer

**Recommendation: deep blue, plate `#173F70`.**

**Runner-up: cool slate, plate `#35404F`.** It is the quieter choice, and it fails in different ways from blue, so it is a real fallback. Navy and indigo measure about the same as deep blue, but they are the same bet: if deep blue fails on the iPhone, they probably fail too.

**The green is not bad overall.** Its text contrast is good, it is the cheapest colour to light, and it separates from black as well as any other hue at this lightness. It has three real weaknesses:

1. **Colour-blind separation from brick.** This is the one strong measured defect. Plate-to-brick CIEDE2000 falls from 48.7 to 15.7 in simulated protanopia and to 28.4 in deuteranopia. Deep blue holds at 40.7 and 50.3. The two stay distinguishable, because lightness still differs and both tabs carry words, but the hue difference is gone.
2. **Dark green cannot be rich in sRGB.** The plate has chroma 0.063, already 90% of the sRGB maximum at that lightness and hue. Blue at the same lightness can reach about 0.17. This is the measured part of "muddy", and it comes from the gamut, not from a poor pick of green.
3. **Green carries a meaning.** Green has a tested link to success. In this page the plate also fills the checked tick, so a neutral container and "done" share one colour. The evidence for this is moderate.

**Hypotheses that failed:** "too little separation from black" is not specific to green, "near-black OLED behaviour hurts the plate" is not supported, and "the Now card lacks contrast with the plate" is false.

**What blue costs:** an estimated 5 to 10% more pixel power on this screen, 36% more blue-primary light, and it loses more colour under Night Shift than green does. Nothing here was viewed on a real iPhone.

Labels used below: **[M]** measured here by script, **[S]** supported by a cited source, **[J]** design judgement.

## Candidates

All candidates use one recipe at the current plate's OKLCH lightness (0.369), so hue is what differs. `--bar` equals `--plate` in every set.

### Hex sets

| Candidate | plate / bar | socket | seg | chalk-line | chalk-muted | muted | line | press |
|---|---|---|---|---|---|---|---|---|
| Current green | `#0F4A3D` | `#07261F` | `#2F9079` | `#2F6F60` | `#CFE0D5` | `#A9B6AE` | `#1F2925` | `#101613` |
| **Deep blue** | `#173F70` | `#0A203B` | `#5788C7` | `#456793` | `#D3DDEB` | `#AEB5BF` | `#22262C` | `#121519` |
| **Cool slate** | `#35404F` | `#1A2129` | `#76889E` | `#5C6774` | `#D5DDE8` | `#AFB5BC` | `#23262B` | `#131518` |
| Navy | `#233B76` | `#101E3F` | `#6283CF` | `#4C6499` | `#D5DDEC` | `#AFB4BF` | `#23262C` | `#131519` |
| Indigo | `#36347A` | `#1A1A41` | `#787BD2` | `#5B5E9C` | `#D9DBEB` | `#B2B3BF` | `#25252C` | `#141519` |
| Petrol | `#034854` | `#02252C` | `#4A92A3` | `#3D6E7A` | `#CDE0E5` | `#A9B7BB` | `#1F282A` | `#101617` |
| Violet | `#482E73` | `#25173D` | `#9073CA` | `#6D5896` | `#DEDAE9` | `#B5B2BD` | `#26252B` | `#151419` |
| Plum | `#5A2A57` | `#2F142D` | `#AB6DA5` | `#80547C` | `#E5D7E3` | `#BAB1B9` | `#292429` | `#171317` |
| Warm graphite | `#433F38` | `#22201C` | `#8D8579` | `#69655F` | `#E0DCD5` | `#B7B4AF` | `#272623` | `#161513` |
| Oxblood (control) | `#68262F` | `#371217` | `#BF6971` | `#8E5257` | `#EBD7D8` | `#BEB0B1` | `#2C2424` | `#191314` |

Oxblood is a control and is rejected: it reads as a relative of brick, which breaks the fixed rule.

### OKLCH and hue distance [M]

Yellow `#F4E52E` is L 0.906, C 0.182, h 104.4. Brick `#B8432A` is L 0.541, C 0.157, h 33.7.

| Candidate | L | C | h | % of sRGB max C | L* | C*ab | Hue to yellow | Hue to brick |
|---|---|---|---|---|---|---|---|---|
| Current green | 0.369 | 0.063 | 174.4 | 90 | 27.7 | 22.2 | 70° | 141° |
| Deep blue | 0.367 | 0.096 | 255.3 | 78 | 26.5 | 32.7 | 151° | 138° |
| Cool slate | 0.368 | 0.030 | 256.2 | 23 | 26.7 | 10.5 | 152° | 137° |
| Navy | 0.367 | 0.105 | 265.0 | 42 | 26.1 | 38.6 | 161° | 129° |
| Indigo | 0.368 | 0.116 | 280.4 | 52 | 25.7 | 45.6 | 176° | 113° |
| Petrol | 0.370 | 0.064 | 213.8 | 98 | 27.6 | 19.2 | 109° | 180° |
| Violet | 0.369 | 0.114 | 297.9 | 57 | 25.5 | 45.5 | 166° | 96° |
| Plum | 0.368 | 0.095 | 329.7 | 56 | 25.3 | 34.0 | 135° | 64° |
| Warm graphite | 0.369 | 0.013 | 81.7 | 17 | 26.8 | 4.9 | 23° | 48° |
| Oxblood | 0.368 | 0.095 | 14.8 | 64 | 25.4 | 31.9 | 90° | 19° |

Hue angles mean little for the two near-neutrals, whose chroma is too low for hue to carry much.

### Contrast [M]

Unchanged in every set: on-yellow on yellow is 14.79:1, Lc 88.3; on the spent yellow it is 11.24:1, Lc 72.7. White on brick is 5.42:1, Lc -81.5. The first and last match `notes.md`.

| Candidate | Chalk on plate | Chalk-muted on plate | Plate vs black | Plate vs yellow | Seg vs black |
|---|---|---|---|---|---|
| Current green | 9.23, Lc -90.1 | 7.39, Lc -74.8 | 2.07, Lc -9.2 | 7.79, Lc 76.0 | 5.39, Lc -35.5 |
| Deep blue | 9.63, Lc -90.9 | 7.73, Lc -75.8 | 1.98, Lc -8.3 | 8.12, Lc 76.9 | 5.75, Lc -37.7 |
| Cool slate | 9.55, Lc -91.0 | 7.68, Lc -76.0 | 2.00, Lc -8.2 | 8.06, Lc 77.1 | 5.79, Lc -37.8 |
| Navy | 9.74, Lc -91.2 | 7.85, Lc -76.3 | 1.96, Lc -8.0 | 8.22, Lc 77.2 | 5.67, Lc -37.2 |
| Indigo | 9.89, Lc -91.5 | 7.92, Lc -76.2 | 1.93, Lc -7.7 | 8.34, Lc 77.6 | 5.56, Lc -36.5 |
| Petrol | 9.26, Lc -90.0 | 7.47, Lc -75.2 | 2.06, Lc -9.2 | 7.82, Lc 75.9 | 5.93, Lc -38.9 |
| Violet | 9.96, Lc -91.7 | 8.00, Lc -76.5 | 1.91, Lc -7.5 | 8.41, Lc 77.8 | 5.49, Lc -36.0 |
| Plum | 10.02, Lc -91.7 | 7.96, Lc -75.9 | 1.90, Lc -7.5 | 8.45, Lc 77.8 | 5.46, Lc -35.9 |
| Warm graphite | 9.50, Lc -91.0 | 7.66, Lc -76.0 | 2.01, Lc -8.3 | 8.02, Lc 77.0 | 5.76, Lc -37.6 |
| Oxblood | 10.00, Lc -91.5 | 7.99, Lc -76.0 | 1.91, Lc -7.7 | 8.44, Lc 77.6 | 5.47, Lc -36.1 |

APCA signs follow the polarity of the pair. Plate vs black and seg vs black treat the colour as foreground on black. Plate vs yellow treats it as foreground on yellow.

All sets clear Apple's 4.5:1 minimum and its 7:1 target for custom colours ([Apple HIG, Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode)) for both text pairs. Contrast does not separate the candidates, because lightness was held equal.

### CIEDE2000, normal and simulated vision [M]

Simulation: Machado, Oliveira & Fernandes 2009, severity 1.0 (full dichromacy), [published matrices](https://www.inf.ufrgs.br/~oliveira/pubs_files/CVD_Simulation/CVD_Simulation.html), applied to linear RGB as [the R colorspace package now does](https://rdrr.io/cran/colorspace/man/simulate_cvd.html). The authors' page does not state the space.

| Candidate | Plate-brick: normal / protan / deutan / tritan | Plate-yellow: normal / protan / deutan / tritan | Plate-black: normal / protan / deutan / tritan |
|---|---|---|---|
| Current green | 48.7 / **15.7** / 28.4 / 53.7 | 63.6 / 59.1 / 63.9 / 64.4 | 26.0 / 19.7 / 17.2 / 26.0 |
| Deep blue | 42.8 / 40.7 / 50.3 / 54.7 | 82.2 / 75.3 / 80.3 / 63.2 | 25.5 / 26.2 / 25.5 / 25.0 |
| Cool slate | 36.4 / 29.4 / 38.0 / 37.7 | 70.8 / 68.0 / 70.2 / 61.8 | 19.3 / 19.6 / 19.2 / 19.9 |
| Navy | 42.2 / 42.6 / 51.9 / 54.4 | 81.9 / 77.3 / 81.7 / 63.6 | 27.0 / 27.1 / 26.3 / 24.4 |
| Indigo | 41.4 / 44.4 / 52.7 / 49.2 | 85.9 / 79.6 / 82.3 / 65.5 | 28.4 / 27.5 / 26.9 / 21.9 |
| Petrol | 50.4 / 29.1 / 40.3 / 52.2 | 68.8 / 65.9 / 71.8 / 63.4 | 24.0 / 21.0 / 20.3 / 26.1 |
| Violet | 39.5 / 43.8 / 50.6 / 32.8 | 87.0 / 80.2 / 80.2 / 59.6 | 28.6 / 26.4 / 25.9 / 19.1 |
| Plum | 33.6 / 37.6 / 40.7 / 23.4 | 83.4 / 77.3 / 71.9 / 59.0 | 27.4 / 21.2 / 20.7 / 25.3 |
| Warm graphite | 29.2 / 17.1 / 25.9 / 29.2 | 62.5 / 62.3 / 62.4 / 57.2 | 17.9 / 17.7 / 18.1 / 17.9 |
| Oxblood | 21.6 / 20.2 / 22.4 / 18.1 | 74.5 / 69.0 / 60.1 / 59.6 | 27.4 / 13.9 / 20.5 / 28.8 |

Use these for ranking only; see the limits below.

### Estimated OLED light and power

This is an estimate, not a measurement. Pixel power is modelled as a weighted sum of linear R, G and B, the linear form [Chameleon](https://arxiv.org/abs/1101.1240) fitted on 2011 phones (R² above 0.95). The same paper says red and green costs differ from device to device, so the weights here are assumptions:

- "Equal" weights the three channels the same.
- "Blue-heavy" uses 22/22/56%. Those shares come from simulated figures seen only in a search excerpt of a USPTO patent. I could not confirm them in the document, so treat them as a stress case.

The plate covers 19.8% of the phone screenshot [M].

| Candidate | Y (white = 1) | Plate power vs white, equal / blue-heavy | Plate power vs green | Whole phone screen vs green | Blue primary, screen mean (vs green) |
|---|---|---|---|---|---|
| Current green | 0.053 | 4.0% / 4.2% | 1.00× | 0 | 0.063 |
| Deep blue | 0.049 | 7.3% / 10.4% | 1.84× / 2.45× | +4.5% / +10.3% | 0.086 (+36%) |
| Cool slate | 0.050 | 5.5% / 6.3% | 1.38× / 1.49× | +2.0% / +3.5% | 0.069 (+10%) |
| Navy | 0.048 | 8.1% / 11.5% | 2.02× / 2.72× | +5.5% / +12.2% | 0.090 (+42%) |
| Indigo | 0.047 | 8.9% / 12.5% | 2.22× / 2.96× | +6.6% / +13.8% | 0.092 (+46%) |
| Petrol | 0.053 | 5.1% / 6.4% | 1.29× / 1.52× | +1.5% / +3.7% | 0.072 (+13%) |
| Violet | 0.046 | 8.8% / 11.6% | 2.20× / 2.76× | +6.4% / +12.4% | 0.088 (+39%) |
| Plum | 0.045 | 7.4% / 8.1% | 1.84× / 1.92× | +4.5% / +6.5% | 0.073 (+15%) |
| Warm graphite | 0.050 | 4.8% / 4.5% | 1.21× / 1.07× | +1.1% / +0.5% | 0.062 (-2%) |
| Oxblood | 0.045 | 6.2% / 5.1% | 1.55× / 1.20× | +3.0% / +1.4% | 0.060 (-6%) |

The percentages cover pixel power only, not the phone. Yellow gives 60% of this screen's light and the plate 6% [M]. Chameleon calls [green the most efficient colour](https://arxiv.org/abs/1101.1240) on the phones it tested. Later work reports that [linear models no longer capture modern OLEDs](https://www.purdue.edu/newsroom/releases/2021/Q3/dark-mode-may-not-save-your-phones-battery-life-as-much-as-you-think,-but-there-are-a-few-silver-linings.html) (press release, secondary; I did not read the paper), and that study covered Android only.

## Why the green is weak: the five hypotheses

### 1. Too dark or too low in chroma, so muddy: partly true

- **Too dark: fails.** Every candidate shares its lightness, and the green has the highest luminance of them all (Y 0.053) [M].
- **Low chroma: true in absolute terms, but not a mistake.** C 0.063 is 90% of the sRGB limit of 0.070 at this lightness and hue. At the same lightness the limit is 0.167 at h 262 and 0.218 at h 280 [M]. Teal and petrol hit the same wall (0.062 to 0.068).
- **Display P3 would lift the limit to 0.095** [M], but only on wide-gamut screens, and it does nothing for colour blindness.
- "Muddy" itself is a perception that I cannot measure.

### 2. Yellow-to-green hue distance too small: fails as a contrast problem

- The distance is the smallest of the chromatic candidates (70° against 151° for deep blue), and the a*b* distance is 80 against 116 [M].
- The Now card still has a firm edge: 7.79:1, ΔL* 61.9 [M]. Lightness does that work, so the card does not lack contrast.
- The research cuts both ways. In [Schloss & Palmer 2011](https://pmc.ncbi.nlm.nih.gov/articles/PMC3037488), pair preference and harmony fell as hue difference rose, which favours green. But figural preference rose with hue contrast, and warm figures were preferred on cool backgrounds, which favours blue for a yellow insert.
- That study groups green with blue among the cool hues, so it does not settle green against blue. It used small lab patches, not interface cards.

### 3. Green means success or OK: moderately supported

- [Moller, Elliot & Maier 2009](https://peeref.com/works/64085540) linked green to success words, though not to general positive words (abstract only).
- [Pravossoudovitch et al. 2014](https://doi.org/10.1080/00140139.2014.889220) found a weaker green-safety link with words and none with symbols (abstract-level summary only).
- Apple advises [against using one colour for different meanings](https://developer.apple.com/design/human-interface-guidelines/color). The same page notes that colour meaning varies by culture.
- [J] The conflict is concrete here: the plate fills the checked tick, and "1 due today" sits on a calm green tab beside a red one, which can read as "fine".
- Limit: these studies used matched lab colours and words. None tested a dark teal container. This plate's hue, 174°, is also a blue-leaning green, so the cue may be weaker than in the studies.

### 4. Brick and green are the worst colour-blind pair: supported, and the main defect

- Protanopia takes plate-brick from 48.7 to 15.7, and deuteranopia to 28.4 [M].
- In protanopia the plate is nearly grey (Lab 29, -1, 5) and brick a dull olive (38, -3, 30) [M].
- A hue sweep at this lightness finds the worst point near h 135 to 150 (ΔE about 8) and the best band at h 255 to 285 (39 to 41 at worst across normal vision and all three types) [M]. The current hue sits on the slope of that trough.
- Fixing the green does not help. Lightening it makes protanopia worse: `#14574A` gives 14.7 and `#1A6A59` gives 13.6. A purer green, `#104C24`, gives 8.0 [M].
- It is not an accessibility failure. ΔE 15.7 is still visible, and the tab and flag carry words and a glyph, which is what [WCAG 1.4.1](https://www.w3.org/TR/WCAG22/) and [Apple](https://developer.apple.com/design/human-interface-guidelines/color) ask for.
- As many as [8% of men of Northern European ancestry](https://www.nature.com/articles/nmeth.1618.pdf) have a red-green deficiency (a regional figure; I confirmed it only from a search excerpt).

### 5. Plate-to-black separation too low on OLED: fails as a green problem

- 2.07:1 is at the top of the range. All candidates sit between 1.90 and 2.07 [M]. Green is not worse, and blue is slightly lower.
- Lc -9.2 is below [APCA's Lc 15 floor for discernible non-text](https://git.apcacontrast.com/documentation/APCAeasyIntro), but so is every candidate. This comes from lightness, not hue. It matters most for the thin plate-coloured rules (3 px under section heads, 1.5 px on the dock), because [chromatic sensitivity falls at finer detail](https://pmc.ncbi.nlm.nih.gov/articles/PMC1193381) and thin lines lean on luminance. WCAG 1.4.11 would ask for 3:1 only if those rules are needed to identify something; [J] they look decorative.
- One green-specific point: plate-black ΔE falls to 19.7 and 17.2 under protanopia and deuteranopia, against 26.2 and 25.5 for deep blue [M].
- **Near-black behaviour:** no evidence of a problem for the plate. Its luminance is about 5.3 cd/m² with white at 100 and 0.11 with white at 2 (Y × white, assuming no panel error) [M]. Published crush affects [roughly code values 1 to 5, up to 10 in the worst case](https://tftcentral.co.uk/articles/does-oled-have-a-black-crush-problem-understanding-and-testing-oled-shadow-detail) (monitors at about 200 nits, not phones). The plate's main channels are 61 and 74.
- The socket and `--press` are darker and untested. I found no near-black or low-grey measurement for the iPhone 14.

### What the green does well

- Text contrast passes with room to spare.
- Normal-vision separation from brick is second best of all candidates.
- It is close to the lowest for power and blue light.
- It keeps its colour under a warm shift.
- [Palmer & Schloss 2010](https://pmc.ncbi.nlm.nih.gov/articles/PMC2889342) found dark green more preferred than the hue pattern of the other cuts would suggest.

## Ranking

1. **Deep blue.** Near-best colour-blind separation, more than double green's in protanopia. Largest hue contrast with yellow that stays calm. It reads as a neutral sign colour, not a status [J]. In the renders it looked calmer than navy [J], and Material warns that [saturated colours "vibrate" on dark backgrounds](https://codelabs.developers.google.com/codelabs/design-material-darktheme/). Blue also tops preference in the saturated, light and muted cuts of [Palmer & Schloss 2010](https://pmc.ncbi.nlm.nih.gov/articles/PMC2889342), though I found no reported result for dark blue, so this is weak support.
2. **Cool slate.** The strongest on neutral meaning: yellow stays the only loud colour. Protanopia nearly doubles against green (29.4), and it costs little. It is weaker in three ways: lowest chroma of the coloured sets, so it may read as "off" [J]; lower normal-vision distance from brick (36.4); and a socket close to black (ΔE 9.4 against 15.7), which weakens the free state.
3. **Navy.** Numbers within about 2 ΔE of deep blue, more chroma, more light. It looked louder in the render [J].
4. **Indigo.** Best colour-blind numbers and the exact opposite hue to yellow, but it reads as purple rather than neutral, gives more identity than a container needs [J], and costs the most light.
5. **Petrol.** Better than green on colour blindness (29.1, 40.3), but it has the same gamut wall and looks like a cousin of the green, so it hardly answers the request [J].
6. **Violet.** Tritan separation from brick falls to 32.8, and it has a strong character [J].
7. **Plum.** Close to brick in normal vision (33.6) and tritan (23.4), and warm enough to feel related to it [J].
8. **Warm graphite.** Protanopia 17.1 is about as weak as green, normal distance from brick is lower (29.2), and it is nearest to black. It is cheap, but on these measures it is no improvement on the green.
9. **Oxblood.** Rejected: 19° from brick, ΔE 21.6.

Deep blue and navy differ by less than the simulation or the formula can be trusted to resolve. The choice between them rests on the render, which is judgement.

### What would change this

- **The real iPhone view.** If deep blue looks too vivid or too cold in daily use, take slate.
- **Who uses it.** If only people with normal colour vision ever use Chronos, the main defect drops out. Green and petrol then compete, and the case rests on meaning and richness.
- **Night use.** Under an illustrative warm shift [M; gains R 1, G 0.82, B 0.50 are my assumption, not Apple's values], deep blue's chroma falls from 0.096 to 0.057 and its contrast with black from 1.98 to 1.74. Green goes from 0.063 to 0.070 and 2.07 to 1.86. Slate turns nearly grey (0.008), which is harmless. Eyes also adapt, so the real loss is smaller. If the app is mostly used at night with Night Shift on, the blue advantage shrinks.
- **Blue and yellow associations.** The pair recalls flags and retail brands [J]. If that bothers the owner, take slate or indigo.
- **Battery as a priority.** Slate or graphite, though the difference is small.
- **Thin rules matter.** A lighter plate helps, at a cost. Deep blue at L 0.43 (`#285183`) gives Lc -14.4 on black, but chalk-muted falls to 5.90:1, below Apple's 7:1 target. I would stay at L 0.37.

## Other evidence and side effects

- **Blue light at night.** Screen mean blue primary rises 36% with deep blue, but stays near 0.09 where a white screen is 1.0 and this theme's light paper is 0.84 [M, estimate]. Evening display effects follow [melanopic irradiance in a dose-dependent way](https://pubmed.ncbi.nlm.nih.gov/36854795/) (72 men, whole-display conditions). [Chang et al. 2015](https://pmc.ncbi.nlm.nih.gov/articles/PMC4313820) tested hours of reading on a bright eReader. The Night Shift [iPad study](https://everydaymatters.rpi.edu/new-lrc-study-evaluates-the-effectiveness-of-apples-ipad-night-shift-application/) (institution's summary, secondary) concluded that colour change alone is not enough and brightness matters too. None of this tested a dark card on black, so I cannot claim harm or safety. Brightness and the yellow card very likely matter more than the plate [J].
- **Brick beside blue.** On black, [most observers see red nearer than blue](https://www.psy.ritsumei.ac.jp/akitaoka/Kitaoka2015_ReferenceWorkEntry_Chromostereopsis.pdf). The tabs touch, so check for a slight depth effect or edge shimmer on the phone. It was not visible in the renders, but those cannot show it reliably.
- **Perceived brightness.** Saturated colours can [look brighter than their luminance](https://zendy.io/title/10.1889/jsid19.10.658) suggests, so Y may understate the coloured plates. I found no reliable figure for dark blue.
- **Blue also means something.** Apple's guidance covers interactive colour too, and blue is a common link colour [J]. The plate holds Add and tabs as well as cards, so this is mild.
- **Display.** iPhone 14: [OLED, P3, True Tone, 2,000,000:1, 800 nits typical](https://support.apple.com/en-us/111850). DXOMARK reports [480 Hz PWM, about 5% reflectance, and low brightness in low light as a weakness](https://www.dxomark.com/apple-iphone-14-display-test/) (third party). CSS hex values are [sRGB](https://www.w3.org/TR/css-color-4/), so these colours should match between Brave and the iPhone apart from True Tone, Night Shift and the room. Apple notes colours [look muted in bright surroundings and saturated in the dark](https://developer.apple.com/design/human-interface-guidelines/color).

## Applying it

- **More tokens carry the green tint than the brief lists:** `--box`, `--tickbox`, `--seg-past`, and the inherited `--slab`, `--slab-ink`, `--slab-muted`.

| Set | box / tickbox | seg-past | slab | slab-ink | slab-muted |
|---|---|---|---|---|---|
| Deep blue | `#848B96` | `#4D535A` | `#DCE2E9` | `#12161C` | `#424850` |
| Cool slate | `#858B93` | `#4E5359` | `#DCE2E9` | `#13161C` | `#424850` |

- `today.html` line 83 sets `--bar`, `--seg`, `--chalk-muted` and `--chalk-line` for both `oled` and `oled-green`, and line 80 does the same for `--muted`, `--line` and `--press`. Scope the new values to `oled-green`, or the Full black theme changes too.
- `--ink` and `--chalk` (`#F2F5EE`) keep a faint green-yellow tint (C 0.010). They are fixed in the brief and looked fine in the renders.
- The mode name `oled-green`, the code comments and `notes.md` all say green and will need updating.

## Limits

- **Nothing was viewed on a real iPhone or calibrated display.** The renders are headless Chrome screenshots in sRGB, viewed as images. There is no panel behaviour in them, no room light, no True Tone and no Night Shift.
- **Colour-blindness figures are one model at full severity.** Real anomalous trichromats see less loss, and no colour-blind person checked this. Tritanopia is included for completeness; my sources did not confirm its prevalence, though it is generally described as rare.
- **CIEDE2000 was [intended for small differences](https://hajim.rochester.edu/ece/sites/gsharma/presentations/talkciede2000cic04.pdf)** (Sharma's talk). One study found it [reasonable on large differences](https://zendy.io/title/10.1002/col.20693), but values of 15 to 85 here are for ranking, not for reading as visual steps. The formula also has a [discontinuity near 180° hue separation](https://hajim.rochester.edu/ece/sites/gsharma/papers/CIEDE2000CRNAFeb05.pdf), which may touch yellow pairs with indigo and violet.
- **Oklab** is [built for normal, well-lit viewing, from CAM16-derived data](https://bottosson.github.io/posts/oklab/), not dark-adapted OLED viewing. Its [hue uniformity is better than CIE LCH](https://www.w3.org/TR/css-color-4/), but equal L is still only an approximation of equal lightness.
- **APCA** is a [public beta version](https://github.com/Myndex/apca-w3) (0.1.9, as used here), not a standard. WCAG 2.x ratios can [mislead near black](https://git.apcacontrast.com/documentation/APCAeasyIntro).
- **The preference studies do not transfer directly.** They sampled [American adults rating lab colour patches](https://pmc.ncbi.nlm.nih.gov/articles/PMC2889342), not students using an app on black. No study here tested this layout.
- **Material's guidance** assumes a [`#121212` surface](https://codelabs.developers.google.com/codelabs/design-material-darktheme/), not pure black, and I could not retrieve the original Material dark theme page.
- **Sources I could not read in full:** Moller 2009, Pravossoudovitch 2014, Wong 2011, Dash & Hu 2021, and Jonauskaite 2020, which I left out because I could not check its per-colour results.
- **Colour sets.** Hex sets come from a recipe, not hand tuning. Rounding to 8 bits moves values slightly.

## How it was measured

Scripts are in `C:\Users\ASUS\AppData\Local\Temp\claude\ca1fd16ddc51db07\c4bc0df0-ebcc-4cc4-b58e-632511ccbf66\scratchpad`: `lib.js`, `verify.js`, `candidates.js`, `measure.js`, `sweep.js`, `power.js`, `mock.js`. Contact sheets of all candidates in the real page are `c-sheet1.png` and `c-sheet2.png` in the same folder. It is a temporary folder.

Checks passed before use:

- CIEDE2000 matched 11 pairs from [Sharma, Wu & Dalal](https://hajim.rochester.edu/ece/sites/gsharma/ciede2000/) to within 0.00004.
- OKLCH reproduced the blue and yellow values in [CSS Color 4](https://www.w3.org/TR/css-color-4/), using [Ottosson's matrices](https://bottosson.github.io/posts/oklab/).
- APCA reproduced four known values with the [0.1.9 constants](https://raw.githubusercontent.com/Myndex/apca-w3/master/src/apca-w3.js).
- WCAG used the [2.2 luminance definition](https://www.w3.org/TR/WCAG22/) and reproduced the contrast figures in `notes.md`.
- Machado left neutral grey unchanged.
