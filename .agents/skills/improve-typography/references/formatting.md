# Text formatting

How words look: emphasis, underlining, caps, small caps, size, headings, letterspacing, kerning, color, figures, OpenType features, mixing fonts.

From Butterick’s Practical Typography. Each heading links to the source page.

### [Text formatting](https://practicaltypography.com/text-formatting.html)

- Treat formatting as everything that affects how words look: font, point size, bold and italic, and letterspacing.
- Don’t rely on rote application of rules for formatting; make your own typographic judgments.

### [Underlining](https://practicaltypography.com/underlining.html)

- Don’t underline for emphasis: “It’s ugly and it makes text harder to read.”
- If you feel the urge to underline, use bold or italic instead.
- In special situations like headings, consider all caps, small caps, or a change in point size in place of underlining.
- On the web, move beyond underlined hyperlinks.

### [Goofy fonts](https://practicaltypography.com/goofy-fonts.html)

- Don’t use goofy fonts (e.g., Stencil) in professional documents. “Distinctive is fine. Goofy is not.”
- Keep novelty, script, handwriting, and circus fonts out of anything created by a professional writer.
- Exception: such fonts might be useful on a sign or billboard, where the goal is attracting attention in limited space, but never in a document that asks for a reader’s patience and attention.

### [Monospaced fonts](https://practicaltypography.com/monospaced-fonts.html)

- Don’t use monospaced fonts (e.g., Courier, Menlo, Consolas) in standard body text; use proportional fonts.
- For columns of numbers, use tabular figures, which most proportional fonts include by default, instead of switching to a monospaced font.
- Exception: use a monospaced font when quoting software code or HTML.
- If you do need a monospaced font, avoid Courier, “one of the worst”; use a Courier alternative.

### [Bold or italic](https://practicaltypography.com/bold-or-italic.html)

- Rule #1: treat bold and italic as mutually exclusive; use one or the other, never both.
- Rule #2: use bold and italic as little as possible. “If everything is emphasized, then nothing is emphasized.”
- Use bold and italic only for short bits of text, not long stretches.
- Don’t set whole paragraphs in bold.
- Don’t underline bold text or use lots of bold italic: “both terrible ideas.”
- With a serif font, use italic for gentle emphasis and bold for heavier emphasis.
- With a sans serif font, skip italic and use bold for emphasis.
- Spell it “sans serif,” not “san serif.”
- Italicize uncommon foreign words used in English (bête noire, Weltanschauung) but not common ones (croissant, résumé); when in doubt, consult a dictionary or usage guide.
- Type accented characters correctly in foreign words.
- Don’t apply emphatic formatting to punctuation, parentheses, brackets, or braces adjacent to the outside edges of emphasized text; exception: where this would cause a collision between italic text and adjacent roman punctuation.
- For another emphasis option, consider all caps or small caps.
- Either bold or semibold works for emphasis; bold gives greater contrast with the roman, while semibold is a little easier to read.
- Don’t use weights heavier than bold (black, ultra) at body-text sizes; reserve them for large sizes such as headlines.

### [All caps](https://practicaltypography.com/all-caps.html)

- Use all caps sparingly; it’s fine for less than one line.
- Use caps for headings shorter than one line, headers, footers, captions, labels, and small point sizes.
- Always add letterspacing to caps, and make sure kerning is turned on.
- Don’t capitalize whole paragraphs. “DO YOUR READERS A FAVOR. STOP CAPITALIZING WHOLE PARAGRAPHS.”
- All caps in bold is even worse.
- To emphasize a paragraph, use rules and borders, add a heading that labels it Important, or run it in a larger point size, but don’t capitalize it.
- Apply all-caps formatting to normally typed text (CSS `text-transform: uppercase`) rather than typing with caps lock, so capitalization can be toggled without retyping.
- With caps, use the alternate figures and punctuation designed to align with caps when your font offers them as OpenType features.
- Don’t assume all caps makes legal text “conspicuous”; courts look at more than formatting.
- Don’t type emails in all caps. “You don’t have to shout.”

### [Point size](https://practicaltypography.com/point-size.html)

- On the web, set body text at 15–25 pixels.
- Let your eyes be the judge, not the point size; different fonts at the same point size look different sizes.
- To match a new font to an old one, set the same text in both at the same size, then adjust the new font’s size until lines break in roughly the same places.
- You may emphasize with a larger point size (or de-emphasize with a smaller one), but do it subtly, in small increments. “It’ll be less than you think.”
- On the web, fine-tune size for the particular font; drop the habit of tiny web fonts.
- Don’t use enormous heading sizes on the web; “There is no typographic universe in which you need to double the point size to achieve emphasis.”
- As you reduce point size, also reduce line spacing and line length.
- When setting rules for document length, use word counts instead of point-size and page limits.

### [Headings](https://practicaltypography.com/headings.html)

- Fix the structural problem first: use fewer heading levels.
- Make headings reveal the structure of your argument, not of your document; don’t announce every topic, subtopic, minitopic, and microtopic.
- If you write from an outline, use it as a starting point for headings, then simplify further.
- Limit yourself to three levels of headings; two is better.
- Don’t use all caps in headings; if headings are full sentences, they’re too long for caps.
- Avoid title case in headings, “Because Your Headings Aren’t Titles.”
- Don’t underline headings.
- Don’t center headings, subject to the exceptions in centered text.
- Emphasize headings with space above and below; it’s the best method, “both subtle and effective.”
- Use bold, not italic, in headings; even bold is optional, and non-bold headings work too.
- Increase heading size only a little, by the smallest visible increment: from 12-point text, try 12.5 or 13 point, not 14 or 15.
- Use only two levels of indenting, even with more than two heading levels; don’t indent each heading level a little farther.
- Suppress hyphenation in headings.
- Prevent headings from breaking awkwardly across lines.
- Avoid stacking bold or italic, underlining, point size, all caps, and first-line indents to distinguish heading levels.
- With bold headings, try reducing size by a half or full point to offset a heavy bold.
- Don’t size headings with a modular scale; judge visually. “When your headings look right, they are right. The ratio is irrelevant.”

### [Hierarchical headings](https://practicaltypography.com/hierarchical-headings.html)

- Don’t label hierarchical headings with the traditional scheme of roman numerals, capital letters, numerals, lowercase letters, and romanettes: “a terrible way.”
- Avoid roman numerals and romanettes; use plain numbers instead.
- Avoid letters as indexes, which grow hard to map to numbers past F, G, H.
- Don’t mix roman numerals and letters, which creates ambiguous references.
- Don’t use a single index per heading, which loses the reader’s place in the hierarchy.
- Use tiered numbers (as technical writers do) to index hierarchical headings.
- In CSS, use the `counter-increment` property for tiered numbers.

### [Letterspacing](https://practicaltypography.com/letterspacing.html)

- Don’t letterspace lowercase text in ordinary circumstances.
- Always add 5–12% extra letterspacing to all caps and small caps, especially at small sizes.
- In CSS, use `letter-spacing` of 0.05em to 0.12em.
- Treat 5–12% as a guide, not an absolute limit, but don’t spread letters too far: “If the spaces between letters are large enough to fit more letters, you’ve gone overboard.”
- Exception: add letterspacing to lowercase smaller than 9 point to keep letter spaces distinct.
- Exception: remove letterspacing from lowercase used at large sizes, such as headlines.
- When defining a style with all caps or small caps, include letterspacing in the style.

### [Kerning](https://practicaltypography.com/kerning.html)

- Always use kerning.
- In CSS, use `text-rendering: optimizeLegibility` and enable the OpenType `kern` feature.
- Unless you’re a professional typographer, rely on the font’s built-in kerning rather than kerning manually.

### [Color](https://practicaltypography.com/color.html)

- Remember that light–dark contrast draws the eye most powerfully, which is why bold emphasizes more than italic.
- A thin or small font can carry a more intense color than a heavy or large one.
- Avoid colored type on a colored background.
- Don’t use color for emphasis at body-text sizes; it isn’t noticed unless it’s loud.
- Use color judiciously; prefer multiple shades of one color to multiple contrasting colors.
- On the web, apply restraint: less color is more effective.
- On screen, consider dark-gray text instead of black.
- Use color to denote hyperlinks (with or without underlining), but be careful using color on non-clickable text.
- Adjust light colors gently and dark colors more boldly.
- For the most vibrant red, make it slightly orange.
- Gradient fills can work: a background gradient that gently changes brightness can give type a natural sense of dimensionality.

### [Alternate figures](https://practicaltypography.com/alternate-figures.html)

- It’s never wrong to use your font’s default figures.
- Lining figures work in any situation and are always preferred with all-caps text.
- Oldstyle figures work best in lowercase body text, but whether to use them there is your choice.
- Don’t use oldstyle figures with caps. “They look wrong.”
- In body text, prefer proportional figures.
- Use tabular figures for vertically aligned columns, such as grids of numbers.
- To check for tabular figures, type a line of zeroes above a line of ones; equal lengths mean tabular.

### [Ordinals](https://practicaltypography.com/ordinals.html)

- Don’t superscript ordinals.
- In HTML, don’t put ordinals in `<sup>` tags.
- Specially designed superscript alphabets and figures in professional fonts are fine for ordinals.

### [Small caps](https://practicaltypography.com/small-caps.html)

- Use small caps as an alternative to bold, italic, or all caps.
- Use real small caps; never use synthesized small caps, which are “inferior counterfeits.”
- Follow the all-caps rules with small caps: use them sparingly, add letterspacing, and turn on kerning.
- Expect to buy fonts with real small caps; system fonts like Times New Roman don’t have them.
- Apply small caps through styles, whether they live in a separate font file or in the OpenType `smcp` feature.
- Starting capitalized words with regular caps is optional; the author prefers not to.
- In CSS, `font-variant: small-caps` is now safe to use, but it gives real small caps only if the font has them.

### [OpenType features](https://practicaltypography.com/opentype-features.html)

- Use an OpenType feature only when both the font and the application support it.
- Check a professional font’s specimen sheets to see which OpenType features it supports.
- In CSS, activate features with `font-feature-settings`.

### [Mixing fonts](https://practicaltypography.com/mixing-fonts.html)

- Treat mixing fonts as an option, not a requirement; you can get plenty from one font using point size, bold or italic, small caps, and so on.
- Most documents can tolerate a second font, few a third, and almost none four or more.
- Treat all slides of a presentation as one document when counting fonts.
- Mix any two fonts that are identifiably different; you don’t have to pair serif with sans serif.
- Lower contrast between mixed fonts can be more effective than higher contrast.
- Give each font a consistent role: e.g., one for body text and one for headings; one for the center of the document and one for the edges (line numbers, footer); or one for list bullets or numbers and one for list text.
- Use one font per paragraph; change fonts only at paragraph breaks.
- Combine fonts by the same designer (e.g., Atlas and Lyon; Alright Sans and Harriet; Concourse and Equity).

### [Web & email addresses](https://practicaltypography.com/web-and-email-addresses.html)

- If readers must type a long web address, use an address-shortening service such as TinyURL or Bitly, but don’t rely on it being permanent.
- In a footnote or endnote, consider giving the long address with a shortened version next to it.
- Don’t hyphenate web addresses; use line breaks to control where they wrap.
- Don’t hyphenate email addresses either.
