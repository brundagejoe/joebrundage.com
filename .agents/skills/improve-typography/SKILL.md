---
name: improve-typography
description: Review or improve typography using every web-relevant rule from Butterick’s Practical Typography. Use when asked about a site’s or page’s typography, fonts, type hierarchy, reading experience, or typographic polish of copy (quotes, dashes, spacing).
---

# Improve typography

The rules come from Matthew Butterick’s [Practical Typography](https://practicaltypography.com/), with print-only and word-processor advice removed. The core rules below apply to every job. The reference files hold the rest, sorted by topic. Each rule links to its source page.

## Reference files

Load each file the job touches, and read it in full. Each file is short enough to apply rule by rule.

| File | Load when the job touches |
| --- | --- |
| [`references/layout.md`](references/layout.md) | alignment, indents, paragraph and line spacing, line length, margins, hyphenation, block quotes, lists, tables, rules and borders, grids, responsive behavior, whole-site layout |
| [`references/formatting.md`](references/formatting.md) | emphasis, underlining, links, caps, small caps, sizes, headings, letterspacing, kerning, color, figures, OpenType features, combining fonts |
| [`references/fonts.md`](references/fonts.md) | choosing, replacing, licensing, loading, or identifying a font, including the system-font lists and alternatives to common defaults |
| [`references/characters.md`](references/characters.md) | the text itself: quotes, apostrophes, dashes, ellipses, symbols, spaces, soft hyphens, ligatures, code samples |
| [`references/documents.md`](references/documents.md) | emails, slide presentations, résumés |
| [`references/principles.md`](references/principles.md) | a full review or redesign, or deciding whether a rule should give way to the brand or content |

A full-site review touches every file.

## Steps

1. **Survey.** Read the actual pages, stylesheets, font files, and representative content. Name the primary reading task, the audience, and the existing visual language. Load the reference files for this job.
2. **Body text first.** Set font, size, line height, and line length together on real paragraphs before anything else. Check them against the core rules and `layout.md`.
3. **Hierarchy.** Headings, emphasis, and spacing, per `formatting.md` and `layout.md`. Keep HTML heading levels semantic even when the visual levels differ.
4. **Details.** Lists, tables, links, captions, navigation, and the characters in authored copy, per `characters.md` and the rest of the loaded files.
5. **Verify.** Look at the rendered result at narrow and wide viewports. Where the site supports them, also check browser zoom and both color themes. Check line length in characters at each width, wrapping, overflow, link and focus states, contrast, and font loading and fallbacks. If you can’t inspect the rendered page, say what is unverified.

The job is done when every rule in each loaded file has been checked against the work. Each rule ends one of three ways: it is satisfied, it is fixed, or you recorded a reason to depart from it.

## Guardrails

- Apply character fixes, such as curly quotes, dashes, and ellipses, to authored prose only. Leave code, identifiers, literal data, user-generated content, and translated strings as they are. Make each change on purpose, never as a find-and-replace across the whole codebase.
- Ask before adding a paid font or a new webfont dependency. Licensing, cost, and loading time are the user’s call.
- When a rule conflicts with the brand, the content, or accessibility, keep what the site needs and say which rule gave way. Treat the numeric ranges as targets you tune by eye.

## Reporting

For a review, list each finding with its location, the rule it breaks (with a link to the source page), and a concrete fix, ordered by impact. For changes you made, explain the most consequential ones, how you verified them, and what remains unverified.

## Core rules

### [Typography in ten minutes](https://practicaltypography.com/typography-in-ten-minutes.html)

- Start every project by making the body text look good; then worry about the rest.
- Body text appearance is determined primarily by four choices: point size, line spacing, line length, and font.
- On the web, set body text at 15–25 pixels. Adjust as needed, since fonts at the same size don’t appear equally large.
- Set line spacing at 120–145% of the point size.
- In CSS, use `line-height`, preferably with a unitless value (130% becomes 1.3).
- Keep line length to an average of 45–90 characters per line, or 2–3 lowercase alphabets.
- On the web, prevent text from flowing to the edges of the browser window.
- Ignore system fonts and free fonts; buy a professional font — “the fastest, easiest, and most visible improvement you can make.”
- If a professional font is impossible, you can use system fonts, but choose wisely.
- Never choose Times New Roman or Arial — “favored only by the apathetic and sloppy.”

### [Summary of key rules](https://practicaltypography.com/summary-of-key-rules.html)

- Treat point size, line spacing, line length, and font as the four most important considerations for body text.
- Use 15–25 pixels for body text on the web.
- Use line spacing of 120–145% of the point size.
- Keep the average line length at 45–90 characters (including spaces).
- Use a professional font — the easiest and most visible improvement.
- Avoid goofy fonts, monospaced fonts, most free fonts, and system fonts — especially Times New Roman and Arial.
- Use curly quotation marks, not straight ones.
- Use bold or italic as little as possible, and not together.
- Never underline, except perhaps for web links.
- Use all caps only for less than one line of text.
- Use centered text sparingly.
- Put only one space between sentences.
- Don’t use multiple word spaces or other white-space characters in a row.
- If you don’t have real small caps, don’t use them at all.
- Add 5–12% extra letterspacing to all caps and small caps.
- Always turn kerning on.
- Use first-line indents of one to four times the point size, or 4–10 points of space between paragraphs — not both.
- Always use hyphenation with justified text.
- Don’t confuse hyphens and dashes, and don’t use multiple hyphens as a dash.
- Use ampersands sparingly, unless part of a proper name.
- Use proper trademark and copyright symbols, not alphabetic approximations.
- In a document longer than three pages, use at most one exclamation point.
- Put a nonbreaking space after paragraph (¶) and section (§) marks.
- Make ellipses with the proper character (…), not periods and spaces.
- Make apostrophes point downward (’).
- Make foot and inch marks straight, not curly.
