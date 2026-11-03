---
name: improve-typography
description: Review and improve a website's typography using principles from Butterick's Practical Typography. Use when asked to refine a site's reading experience, type hierarchy, font choices, or typographic polish.
---

# Improve website typography

Make the site's text easier to read and its hierarchy more distinctive and coherent. Apply Matthew Butterick's [Practical Typography](https://practicaltypography.com/) as design guidance, using visual judgment and the site's purpose rather than mechanically enforcing rules. Respect the existing brand, content, language, accessibility needs, and project conventions.

Read [typography principles](references/typography-principles.md) when reviewing or implementing a site's typography. It contains the practical page-layout and text-formatting guidance to apply to the actual content; use the relevant sections rather than treating every item as a mandatory change.

## Work from the reading experience outward

1. Inspect the actual pages, styles, available fonts, and representative content. Identify the primary reading task, audience, and existing visual language. If the user asks for a review, identify and prioritize specific problems; if they ask for improvements, implement them within the requested scope.
2. Start with body text: font, size, line height, and measure. Judge them together on real paragraphs. Butterick suggests 15–25px on the web, 1.2–1.45 line height, and an average of 45–90 characters per line; these are starting points, not conformance targets. Adjust for the typeface, content, viewport and user needs. Prefer relative sizes and unitless line height; constrain prose width without constraining the whole interface.
3. Establish a clear hierarchy through spacing, size, weight, and placement. Use as few visual levels as the content needs; distinguish headings without automatically making them enormous. Give headings a closer visual relationship to the content that follows. Keep HTML heading levels meaningful even when visual styles differ.
4. Refine paragraphs, lists, captions, navigation, forms, and dense interface text in context. Use consistent paragraph spacing, restrained emphasis, and a deliberate alignment. For continuous prose, prefer start-aligned text; if justification is appropriate, check hyphenation and word spacing in the actual languages and browsers. Use centered text selectively.
5. Inspect the rendered result at narrow and wide viewports and, where available, with zoom and both color themes. Check long and short content, wrapping, overflow, links, focus states, contrast, and font loading/fallbacks. Run the project's relevant checks. If visual inspection isn't available, say so and describe what remains unverified.

## Make considered choices

- Choose type for the content and voice, with readable shapes, suitable weights, character coverage, and reliable rendering. One well-used family may be enough; give a second family a consistent role. Review existing licensed fonts before adding one. Free and system fonts can be appropriate; don't assume price guarantees quality or add a paid font without authorization. Check webfont licensing, loading cost, and fallback behavior before introducing an asset.
- Use a limited, consistent type scale, tuned by eye rather than a mandatory mathematical ratio. Distinguish interactive links beyond color where needed, and preserve recognizable hover and keyboard focus states. Maintain sufficient text contrast and avoid using color alone to communicate meaning.
- Use capitalization, letterspacing, bold, and italics purposefully. Long all-caps passages and heavily tracked body text are difficult to read. If using short uppercase labels, test modest positive tracking at their actual size. Avoid fake small caps and synthesized styles where real variants are available.
- Polish punctuation in authored prose when appropriate: curly quotation marks and apostrophes, appropriate dashes, and nonbreaking spaces for meaningful groups. Preserve code, identifiers, user-generated content, localization, and literal data; never apply blind global substitutions.
- Adapt to the medium: maintain comfortable text measure and margins across viewport sizes, let content reflow, and avoid fixed heights that clip enlarged text. Honor user text sizing and zoom. Avoid copying a generic template when a typographic choice can better express the site's character.

Explain the most consequential changes and their rationale, how they were verified, and any remaining limitations. For a review, connect each finding to its location and a practical correction.

## Sources

The central guidance is adapted from [Typography in ten minutes](https://practicaltypography.com/typography-in-ten-minutes.html), [headings](https://practicaltypography.com/headings.html), [mixing fonts](https://practicaltypography.com/mixing-fonts.html), [websites](https://practicaltypography.com/websites.html), and [responsive web design](https://practicaltypography.com/responsive-web-design.html). Consult the book for deeper context; its print-oriented recommendations and font preferences need judgment when applied to a particular website.
