# Page layout

How text sits on the page: alignment, indents, paragraph and line spacing, line length, margins, hyphenation, block quotes, lists, tables, rules, grids, responsive behavior.

From Butterick’s Practical Typography. Each heading links to the source page.

### [Page layout](https://practicaltypography.com/page-layout.html)

- Don’t tolerate mediocrity just because you’re stuck with a reader-chosen screen size.
- “Don’t accept the defaults. You can do better.” Browser defaults and templates don’t deliver great results with no effort.

### [Body text](https://practicaltypography.com/body-text.html)

- Set up the body text first, since it most affects the document’s appearance.
- Start with font, point size, line spacing, and line length; these four decisions largely determine how body text looks.
- On the web, body text can be either sans serif or serif; on today’s screens serifs look equally good.

### [Centered text](https://practicaltypography.com/centered-text.html)

- Use centered text sparingly; it’s “the typographic equivalent of vanilla ice cream—safe but boring.” Don’t fear asymmetry.
- Centering is acceptable for short phrases or titles.
- You may center major section headings like “Introduction” and “Table of Contents.”
- When centering multiple lines, use line breaks so lines start in sensible places.
- Never center whole text blocks: both edges become uneven, making them hard to read and hard to align with other page elements. Use better heading options instead.

### [Justified text](https://practicaltypography.com/justified-text.html)

- Justification is a matter of personal preference, not a signifier of professional typography; the choice is yours.
- If you justify text, you must turn on hyphenation to prevent “gruesomely large spaces between words.”
- On web pages, prefer left-aligned text; browser justification engines are rudimentary and can look clunky and coarse.
- Distribute extra justification space between words, not between letters. Changing character spacing from line to line makes a justified block “look horrible.”

### [First-line indents](https://practicaltypography.com/first-line-indents.html)

- Signal new paragraphs with either a first-line indent or space between paragraphs, never both. “Using both is a mistake.”
- A first-line indent on the first paragraph of a text is optional.
- Make first-line indents no smaller than the point size and no bigger than four times the point size.
- Scale the indent to the width of the text block: narrow blocks toward the low end of the range; wider blocks get bigger indents.
- Don’t use word spaces or tabs to indent the first line; use the indent setting (CSS: `text-indent`).
- Use hanging (negative) indents for lists with bullets; avoid a hanging indent without a bullet. Text should only be indented inward.
- Avoid drop caps except in certain decorative contexts.

### [Space between paragraphs](https://practicaltypography.com/space-between-paragraphs.html)

- Use 4–10 points of space between paragraphs.
- Never insert an empty paragraph to create space between paragraphs; it’s the worst way.
- Make the space large enough to notice but not so large that paragraphs seem disconnected: 50–100% of the body text size usually suffices.
- The larger the point size, the more space you need between paragraphs to make a visible difference.
- Rely on space after paragraphs, and use space before only in special circumstances (e.g., a block quotation that needs space before and after to look vertically aligned).
- In CSS, use `margin-top` and `margin-bottom`.

### [Line spacing](https://practicaltypography.com/line-spacing.html)

- Set line spacing to 120–145% of the point size for most text. 110% is too tight; 170% is too loose.
- Abandon typewriter habits of single or double spacing: single-spaced text is dense and hard to read; double-spacing is looser than optimal.
- In CSS, use `line-height`, preferably without units.
- Fonts that run small need less line spacing, and vice versa.

### [Line length](https://practicaltypography.com/line-length.html)

- Aim for an average line length of 45–90 characters, including spaces.
- Measure line length in characters per line, not physical units.
- Alternatively, use the alphabet test: fit two to three lowercase alphabets on a line. Especially useful on the web.
- Establish basic line length with margins; reserve side indents for special situations like block quotations.
- If you’ll indent sections or hierarchy levels, start with lines long enough that indented parts still fall within the target range. Use fewer levels of indentation and smaller indents.
- In responsive web layouts, pay attention to line length; neglecting it is the major flaw of many.

### [Page margins](https://practicaltypography.com/page-margins.html)

- On the web, use big margins; focus on line length and let margins grow. “Don’t panic.”
- Don’t fear the resulting white space.
- You needn’t center the text block horizontally; for an asymmetric layout, make the asymmetry obvious.
- Judge layouts with your eyes, not a calculator.

### [Hyphenation](https://practicaltypography.com/hyphenation.html)

- In justified text, hyphenation is mandatory.
- In left-aligned text, hyphenation is optional; it doesn’t improve legibility, so consider turning it off.
- As line length gets shorter, hyphenation becomes essential to avoid awkward breaks.
- Suppress automatic hyphenation in headings, where it often causes more problems than it solves.
- In CSS, enable hyphenation with `hyphens: auto` and suppress it for specific elements with `hyphens: none`.
- If you use CSS hyphenation, be prepared for some clunkers, since browsers offer almost no control.
- In a CMS like WordPress, consider a plugin that inserts soft hyphens if your project demands full justification; otherwise it’s probably not worth the work.

### [Block quotations](https://practicaltypography.com/block-quotations.html)

- Reduce the point size and line spacing of block quotations slightly.
- On the web, indent the block about 2–5 ems on the left, optionally the same on the right.
- Make side indents noticeable but not so large that line length gets too short.
- Don’t put quotation marks at the ends of block quotations; they’re redundant.
- Use block quotations only when unavoidable (e.g., when accuracy demands extensive quoting), not as a form of emphasis.
- To make readers attend to quoted material, edit it carefully and integrate it into the text. “Don’t just shovel it into a block quotation.”

### [Bulleted and numbered lists](https://practicaltypography.com/bulleted-and-numbered-lists.html)

- Don’t type bullets or numbers manually; use automated lists (HTML: `<ul>` and `<ol>`).
- You may set the list index in a different font, or smaller point size, than the list item.
- Don’t use asterisks as bullets; they’re too small and too high.
- Avoid overlarge bullets; make them noticeable but no bigger. Prefer hollow bullets over solid ones for subtlety.
- Dingbat fonts can supply alternative bullets and numbers; prefer simple geometric dingbats over pictorial ones, and tread carefully with unfamiliar symbols that may carry cultural or religious significance.

### [Tables](https://practicaltypography.com/tables.html)

- Use tables for spreadsheet-style grids of numbers or data.
- Always fix the two default-table defects: cell borders and cell margins.
- Turn off all cell borders to start, then turn them back on only as needed to improve legibility.
- In CSS, watch out that tables, rows, and cells can each have separate border settings.
- Increase cell margins to improve legibility of dense tables; default margins are too tight.
- Add cell margin gingerly, in small increments.
- Cell margins needn’t match on all sides; top and bottom can be bigger than the sides.
- In CSS, add padding to `td` for cell margins; consider CSS grid layout as a more flexible alternative to table markup.

### [Grids of numbers](https://practicaltypography.com/grids-of-numbers.html)

- Make typographic logic follow numerical logic.
- Golden rule: in any column, vertically align digits with the same meaning.
- Don’t apply the same formatting to all numbers; different kinds of numbers need different typography.
- Use tabular figures so digits line up.
- Align nominal numbers like invoice numbers right.
- For money quantities, include currency symbols, commas, and cents, and align right so dollars and cents line up.
- Add a leading zero to quantities between 0 and 1.
- Align measurements on their decimal points.
- Align zip codes left; align phone numbers right.
- Don’t pad physical measurements with extra zeros, since trailing zeros imply precision.
- Use the thousands comma in columns, even for numbers under 10,000, so they align.
- Remove garish colors and needlessly thick rules and borders; give cells adequate margins; keep line spacing even; avoid inapt system fonts like Calibri.
- Format column labels after the numbers; inconsistent choices (e.g., a centered label) are fine if they look right.
- In grids, prefer lining figures for their vertical consistency.

### [Rules and borders](https://practicaltypography.com/rules-and-borders.html)

- Use rules and borders sparingly. Try increasing space above and below first; it usually works equally well.
- Set border thickness between half a point and one point. Thinner borders don’t reproduce well on screens; thicker ones create noise. “You want to see the data, not the lines around the data.”
- Avoid chartjunk such as thick grid lines.
- Don’t use patterned borders (dots, dashes, double lines); use a single solid line.
- Rules allow more latitude; thicker-than-one-point or patterned rules are permitted, but they wear out their welcome faster than the classic half-point solid rule.
- In CSS, for borders only between columns set `border-left` on `td+td`; only between rows, set `border-top` on `tr+tr`.
- Never make rules or borders from repeated typographic characters (punctuation, hyphens, dashes, math symbols, stacked parentheses).
- When attaching a rule to headings, put it above the heading rather than below, so it separates the previous section from the current heading.

### [Widow and orphan control](https://practicaltypography.com/widow-and-orphan-control.html)

- On the web, prevent a small word alone on a paragraph’s last line (which “always looks bad”) with a nonbreaking space and some programming.

### [Space above and below](https://practicaltypography.com/space-above-and-below.html)

- Use space above and below headings as a form of emphasis, instead of piling on point size, color, bold, or italic, or shouting in all caps.
- Make the space below a heading smaller than the space above, so the heading sits closer to the text it introduces.
- Don’t add so much space that it becomes excessive (e.g., pushing a heading below the bottom of the browser window).
- If you already use space between paragraphs, make the space around headings larger to create a distinction.
- In CSS, use `margin-top` and `margin-bottom`.

### [Columns](https://practicaltypography.com/columns.html)

- On the web, generally avoid CSS columns; web pages have an indefinite bottom edge. Use them only for small amounts of text or link lists that fit on a single screen.

### [Grids](https://practicaltypography.com/grids.html)

- Use grids in moderation as a starting point; “the eye must always be the final judge.”
- If your layout seems messy or aimless, move elements onto the grid to encourage consistency.
- Don’t treat grid alignment as a guarantee of a good layout: “if you take ugly shit and align it to a grid—it’s still ugly shit.”
- Use grids to guide positioning, sizing, and alignment of both visible elements and invisible ones (margins, paragraph spacing, indents).
- Prefer a coarser, simpler grid; a complicated grid “might as well be no grid at all.”
- Grids needn’t be rigid or symmetric; usually it’s better if they aren’t.
- Mathematical ratios don’t guarantee a good layout; rely on your eyes, not your calculator.
- Let a grid emerge from experimentation if you like; the goal is typographic consistency, not grids per se.
- For scalable web layouts, consider starting with a grid of 1rem (tied to the viewport via media query) or 1vw.
- Skip baseline grids for books and websites; they impose too much rigidity and work for too little benefit. They suit wide multi-column layouts like newspapers.

### [Paragraph and character styles](https://practicaltypography.com/paragraph-and-character-styles.html)

- Use styles instead of formatting element by element.
- Use a style any time two document elements should be formatted identically.
- Define formatting attributes together in a style and apply it, so matching elements stay consistent and can be changed centrally.
- Use style inheritance: define foundation styles and base more elaborate styles on them.
- Name styles by function (e.g., Block Quotation), not appearance (e.g., Caslon Bold 11.5 point).
- Fix the ugly defaults of built-in styles before using them.

### [Responsive web design](https://practicaltypography.com/responsive-web-design.html)

- The rules of good typography don’t change with screen size; don’t let body text reflow edge to edge at a fixed point size.
- Don’t treat the screen edges as the boundaries of the text block.
- Keep line length at 45–90 characters at every screen width; test that text stays in range.
- Scale point size and element width at the same rate, e.g., with the CSS `vw` unit.
- Skip the CSS `ch` unit; it’s only the width of the zero.
- If text reflows inside an element, bound line length with `max-width` (again, `vw` helps).
- Be careful tying mobile layouts to pixel-width media queries; high thresholds (up to 1400px) show mobile layouts in normal desktop windows.
- To serve mobile layouts to large phones, consider detecting mobile vs. desktop with JavaScript and loading the appropriate stylesheet.
- Consider serving different body-font weights by platform (e.g., slightly heavier for Windows).

### [Screen-reading considerations](https://practicaltypography.com/screen-reading-considerations.html)

- For screen text, use whatever font you’d prefer on the printed page; 1990s screen-optimized fonts like Georgia and Calibri have no special legibility benefit on today’s screens.
- Exception: system fonts remain useful for sharing draft documents, since they’re installed everywhere.
- For text read only on screen, consider smaller margins and a larger point size.
- Upgrade to a 4K desktop monitor; “it’s well worth it.”

### [Websites](https://practicaltypography.com/websites.html)

- Avoid tiny point sizes for body text.
- Avoid huge point sizes for headings.
- Don’t rely on a small handful of system fonts like Arial, Georgia, and Verdana.
- Don’t cram page edges with inscrutable wads of navigational links.
- Don’t build layouts with large blocks of color.
- Be wary of questionable free fonts, especially Google Fonts.
- Don’t blame browsers or tools for poor web typography; the excuses have gone stale.
- Don’t follow the template-driven cargo cult (video backgrounds, the 960 grid, hamburger buttons atop full-bleed stock photos). “We swapped ugly for boring.”
- Draw visual ideas from outside the web: books, posters, art, software, and other designed objects, of this era and earlier. “Steal from better sources.”
- Experiment; “Doing it wrong is a prerequisite to doing it right.”
