# Data Display Guide

How to build a tool page that presents quantitative results, in the house style.
The reference implementation is `app/tools/bayesian-ab-test/`. Read it before
building a new one.

This style is **opt-in**. Most tools use the default shadcn look described in
`app/tools/AGENTS.md`. Reach for this one when a page's job is to *show a
result and explain it* — a calculator, a model readout, an analysis. Don't use
it for form-heavy utilities, converters, or anything whose output is a single
value.

The principles come from Edward Tufte, *The Visual Display of Quantitative
Information*. Where a rule below has a reason attached, keep the reason: it is
what lets you apply the rule to a case this document doesn't cover.

---

## 1. The governing test

Before adding anything to the page, ask what data it carries. A border carries
none. A card header carries none. A tooltip carries data but hides it until
hovered, which means the reader cannot compare it to anything.

**Maximize the share of ink that is data.** In practice this means the default
answer to "should this be in a Card?" is no. Structure comes from three things,
in this order:

1. Whitespace
2. A hairline rule (`border-t border-current/20`)
3. A small tracked label

You will not need a fourth. Do not nest a bordered box inside a bordered box —
if you find yourself doing it, the outer box is the one to delete.

## 2. Every number appears exactly once

Before the rewrite, `bayesian-ab-test` rendered `probabilityMeaningfulLift`
three separate times in three separate panels. Each repeat was ink that added
nothing and a place for the page to contradict itself.

If two sections want the same number, the sections are wrong, not the number.
Merge them, or make one of them reference the other in prose.

## 3. Answer "compared to what?"

A number alone is not a finding. `96.4%` and `3.1%` set in the same size and
weight tell the reader nothing about which one matters.

Give every important quantity a second, visual encoding:

- A row of probabilities becomes a **dot plot on one shared axis**. Sorted, it
  renders as a staircase — and the shape of the staircase is itself the
  distribution, read a second way. See `ProbabilityStaircase`.
- A single probability inside a sentence gets an inline **strip** with a tick at
  the decision threshold. See `ProbabilityStrip`.
- A quantity with uncertainty gets a **distribution**, not a point estimate.

If a figure would only restate a number the reader already has, cut the figure.

## 4. Plot the quantity the decision turns on

This is the mistake most worth avoiding. The old page charted variant A's rate
and variant B's rate on separate curves, and left the *difference between them*
— the only thing anyone acts on — as a text string in a paragraph.

Work out what question the page exists to answer, then plot that. Supporting
quantities can be tables or small secondary figures.

## 5. Label directly; never rely on a tooltip

A legend makes the reader look away and match colors. A tooltip makes them hunt.
Put the label next to the thing:

- Name a curve at its own apex (`RateDistributionFigure` labels `A 5.51%` and
  `B 6.03%` in the plot).
- Name a reference line above the line itself.
- Print interval endpoints at the ends of the interval.

Guard every direct label against collision. `LiftDistributionFigure` drops its
threshold label when the threshold sits too close to zero
(`thresholdLabelFits`), and flips a label's anchor rather than letting it run
off the frame. A label that overlaps the data is worse than no label.

## 6. Captions are sentences that carry content

Not `"Posterior win probability, practical significance, and status."` That is a
dashboard panel title and it says nothing.

A caption states what the figure shows, how to read its parts, and what the
reader should take from it — including live numbers from the result:

> Posterior density of B's lift over A. The shaded left tail is the 4.1% of the
> distribution where B is the worse variant. The bar beneath the curve spans the
> central 95%, thickened across the central 50%, with the median at the dot.

Write the page as a short report. Lead with a sentence that states the
conclusion in plain language, then show the evidence.

---

## 7. Typography

Serif for reading, sans for pointing. This is what Tufte's own books do — Bembo
for the text, Gill Sans for the figure labels.

**The rule:** a number read as *language* stays serif; a number read as *data*
goes sans. `95.9%` in the middle of a sentence is prose. The same figure in a
column you scan for differences is data.

| Class | Face | Use for |
|---|---|---|
| `.plate` | EB Garamond | Page wrapper. Sets the serif, lining figures, base size |
| `.plate-figures` | serif | Numerals **inside running prose** |
| `.plate-label` | Inter | Tracked uppercase labels: section heads, table heads, rail |
| `.plate-data` | Inter | Numerals in tables, input values, scanned columns |
| `.plate-chart` | Inter | Put on every `<svg>`; all chart text inherits it |

Defined at the bottom of `app/globals.css`.

**These classes set face and figure style only.** Size, weight, color, and
spacing stay with Tailwind utilities at the call site. Don't add `font-size` to
a `.plate-*` rule — they are unlayered and would silently beat Tailwind's
`text-[...]`.

Two things to remember when mixing:

- **Inter's x-height runs larger than Garamond's.** A label that was
  `text-[0.72rem]` in serif wants `text-[0.66rem]` in sans to look the same
  size. Chart text went from `fontSize={13}` to `{12}` for the same reason.
- **Garamond ships old-style figures** — 3, 4, 7, 9 drop below the baseline.
  Lovely in a sentence, wrong in a table. `.plate` forces `lining-nums`
  globally; the data classes add `tabular-nums` so digits sit in fixed columns.

The `terminal` theme overrides all of these back to its mono face. Any new
`.plate-*` class must be added to that override or it will break the theme.

## 8. Color

Draw SVG in `currentColor` with opacity, never a fixed hex or a theme token.
One set of geometry then works in light, dark, and terminal with no palette per
theme, and the lint rule against raw colors never fires.

```tsx
<path d={linePath(curve)} fill="none" stroke="currentColor" strokeWidth={1.25} opacity={0.75} />
```

Use opacity to rank things: data ~0.75–1.0, rules and axes ~0.35, secondary
fills ~0.1. Hue should encode something or be absent. The reference page uses
none.

## 9. Charts: hand-rolled SVG, not Recharts

Recharts is fine for a conventional dashboard chart and is still the right
choice elsewhere in this repo. It fights you on everything in this guide —
range frames, direct labels, suppressing the grid, annotating in-plot.

For a figure in this style, write the SVG. The pattern is in `figures.tsx`:

- `makeScale(domain, range)` — a linear scale, ~4 lines
- `niceTicks(lower, upper, target)` — human-readable tick positions
- `linePath` / `areaPath` — point arrays to `d` strings
- A `viewBox` with `className="plate-chart h-auto w-full overflow-visible"` for
  responsive sizing

**Range frames.** The axis line spans the data, not the padded domain. In
`LiftDistributionFigure` the baseline runs `curveStart` to `curveEnd`, so the
frame itself reports the range of the data — a free extra encoding.

**Don't hide a flat result by cropping the axis.** If a quantity barely moves,
a zero baseline that shows it barely moving *is the finding*. Figure 4 on the
reference page looks empty on purpose: waiting buys you almost nothing, and the
empty space says so.

## 10. Floating-point math and hydration

A page like this computes a lot during render — transcendental functions, Monte
Carlo sampling, scale arithmetic. **Those results are not bit-identical between
the SSR runtime and the browser**, and if you write raw floats into SVG
attributes or inline styles, React will report a hydration mismatch and refuse
to patch it:

```
server  x2="464.1558872076944"    client  x2={464.1558872076941}
server  width:"95.9114%"          client  width:"95.91138673472564%"
```

Two defenses, and you want both:

1. **Render computed figures only after mount.** Keep the static prose (title,
   lede) server-rendered, and gate everything downstream of it on a
   `hasInitializedFromUrl`-style flag set in `useEffect`. These pages read their
   state from the URL client-side anyway, so the server has nothing true to say
   about the results.
2. **Round coordinates at the path builders.** `linePath` and `areaPath` round
   to 2 decimals. Sub-pixel precision buys nothing visually and it keeps the
   markup small.

Rounding alone is not sufficient: a seeded Monte Carlo run can diverge by far
more than a rounding step when a float difference flips a rejection-sampling
branch. Gate on mount.

## 11. Tables

No vertical rules. One rule under the head, one at the bottom, one above a
total or difference row. Numerals right-aligned, `tabular-nums`, `pl-5` between
columns so headers don't run together.

## 12. Page skeleton

```
[13–15rem input rail]  [44rem reading column]  [12rem margin notes]
```

- **Rail** — sticky at `lg`. Bare inputs with a bottom hairline, no boxes;
  label left, value right, `has-[:focus]:border-current/70` for focus.
- **Column** — the report. `Section` label, then figure, then caption.
- **Margin** — the `Row` component puts a sidenote beside its content on `xl`
  and collapses it inline below. Notes go here; parentheticals in the main text
  are a smell.

Split the file. `model.ts` for math and types, `figures.tsx` for the SVG,
`page.tsx` for layout and copy. `page.tsx` should be readable as prose.

---

## Checklist

- [ ] No `Card`. No box inside a box.
- [ ] Every number appears once.
- [ ] The quantity the decision turns on is plotted, not just stated.
- [ ] Every series is labeled in-plot; no legends, no tooltips.
- [ ] Direct labels are guarded against collision and overflow.
- [ ] Captions are sentences with live numbers, not panel titles.
- [ ] Serif for prose and in-sentence numbers; sans for labels, chart text, and
      scanned columns.
- [ ] SVG is `currentColor`; verified in light, dark, **and** terminal.
- [ ] Axes are range frames; no gridlines unless a reader must read values off
      the plot.
- [ ] Tables have no vertical rules and use tabular numerals.
- [ ] Computed figures render after mount; no hydration mismatch. Check with
      the CDP console snippet rather than trusting the dev-overlay badge.
- [ ] `npm run check` passes.
- [ ] You have looked at the rendered page, not just the diff. A headless
      screenshot works:
      `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=6000 --window-size=1440,2650 --screenshot=out.png --user-data-dir=./tmp-profile "http://localhost:3000/tools/<slug>"`

## A note on what you will find

Presenting data honestly tends to expose problems the old layout hid. Plotting
the waiting-scenario table on the reference page revealed that expected regret
was non-monotone — pure Monte Carlo noise from too few simulations and a shared
RNG stream. The table made it look like rounding; the line chart made it look
like nonsense, because it was.

When a new figure looks wrong, check the data before you adjust the figure.

The same happened with hydration. The old page rounded every number through
`formatPercent(x, 2)` and let Recharts draw only after it measured its
container, so cross-runtime float drift never reached the DOM. Rendering raw
coordinates made a latent problem visible. That is the style working as
intended — but it means you must actually read the console, not just look at the
page.
