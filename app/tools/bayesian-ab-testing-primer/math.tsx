import * as React from "react"

/**
 * MathML set to sit with the body serif: no chips, no boxes, just space.
 */

export function InlineMath({ children }: { children: React.ReactNode }) {
  return <span className="mx-[0.1em] text-[1.04em]">{children}</span>
}

export function MathBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 overflow-x-auto text-center text-[1.2rem] opacity-90">
      {children}
    </div>
  )
}

export function BetaDensityFormula() {
  return (
    <MathBlock>
      <math display="block">
        <mrow>
          <mi>f</mi>
          <mo>(</mo>
          <mi>p</mi>
          <mo>;</mo>
          <mi>&alpha;</mi>
          <mo>,</mo>
          <mi>&beta;</mi>
          <mo>)</mo>
          <mo>=</mo>
          <mfrac>
            <mrow>
              <msup>
                <mi>p</mi>
                <mrow>
                  <mi>&alpha;</mi>
                  <mo>-</mo>
                  <mn>1</mn>
                </mrow>
              </msup>
              <msup>
                <mrow>
                  <mo>(</mo>
                  <mn>1</mn>
                  <mo>-</mo>
                  <mi>p</mi>
                  <mo>)</mo>
                </mrow>
                <mrow>
                  <mi>&beta;</mi>
                  <mo>-</mo>
                  <mn>1</mn>
                </mrow>
              </msup>
            </mrow>
            <mrow>
              <mi>B</mi>
              <mo>(</mo>
              <mi>&alpha;</mi>
              <mo>,</mo>
              <mi>&beta;</mi>
              <mo>)</mo>
            </mrow>
          </mfrac>
        </mrow>
      </math>
    </MathBlock>
  )
}

export function BetaFunctionFormula() {
  return (
    <MathBlock>
      <math display="block">
        <mrow>
          <mi>B</mi>
          <mo>(</mo>
          <mi>&alpha;</mi>
          <mo>,</mo>
          <mi>&beta;</mi>
          <mo>)</mo>
          <mo>=</mo>
          <msubsup>
            <mo>&#x222B;</mo>
            <mn>0</mn>
            <mn>1</mn>
          </msubsup>
          <msup>
            <mi>t</mi>
            <mrow>
              <mi>&alpha;</mi>
              <mo>-</mo>
              <mn>1</mn>
            </mrow>
          </msup>
          <msup>
            <mrow>
              <mo>(</mo>
              <mn>1</mn>
              <mo>-</mo>
              <mi>t</mi>
              <mo>)</mo>
            </mrow>
            <mrow>
              <mi>&beta;</mi>
              <mo>-</mo>
              <mn>1</mn>
            </mrow>
          </msup>
          <mspace width="0.4em" />
          <mi>d</mi>
          <mi>t</mi>
        </mrow>
      </math>
    </MathBlock>
  )
}

export function PosteriorUpdateFormula() {
  return (
    <MathBlock>
      <math display="block">
        <mrow>
          <mi>Beta</mi>
          <mo>(</mo>
          <mi>&alpha;</mi>
          <mo>+</mo>
          <mi>successes</mi>
          <mo>,</mo>
          <mi>&beta;</mi>
          <mo>+</mo>
          <mi>failures</mi>
          <mo>)</mo>
        </mrow>
      </math>
    </MathBlock>
  )
}

export function PosteriorUpdateCountsFormula() {
  return (
    <MathBlock>
      <math display="block">
        <mrow>
          <mi>&alpha;</mi>
          <mo>=</mo>
          <mn>1</mn>
          <mo>+</mo>
          <mi>successes</mi>
          <mspace width="1.2em" />
          <mi>&beta;</mi>
          <mo>=</mo>
          <mn>1</mn>
          <mo>+</mo>
          <mi>failures</mi>
        </mrow>
      </math>
    </MathBlock>
  )
}

export function ProbBBeatsAFormula() {
  return (
    <MathBlock>
      <math display="block">
        <mrow>
          <mi>P</mi>
          <mo>(</mo>
          <msub>
            <mi>&#x3B8;</mi>
            <mi>B</mi>
          </msub>
          <mo>&gt;</mo>
          <msub>
            <mi>&#x3B8;</mi>
            <mi>A</mi>
          </msub>
          <mo>)</mo>
          <mo>=</mo>
          <msubsup>
            <mo>&#x222B;</mo>
            <mn>0</mn>
            <mn>1</mn>
          </msubsup>
          <msub>
            <mi>f</mi>
            <mi>B</mi>
          </msub>
          <mo>(</mo>
          <mi>x</mi>
          <mo>)</mo>
          <mspace width="0.3em" />
          <msub>
            <mi>F</mi>
            <mi>A</mi>
          </msub>
          <mo>(</mo>
          <mi>x</mi>
          <mo>)</mo>
          <mspace width="0.3em" />
          <mi>d</mi>
          <mi>x</mi>
        </mrow>
      </math>
    </MathBlock>
  )
}

export function RiemannPassFormula() {
  return (
    <MathBlock>
      <math display="block">
        <mtable columnalign="left" rowspacing="0.6em">
          <mtr>
            <mtd>
              <msub>
                <mi>F</mi>
                <mi>A</mi>
              </msub>
              <mo>(</mo>
              <msub>
                <mi>x</mi>
                <mi>i</mi>
              </msub>
              <mo>)</mo>
              <mo>+=</mo>
              <msub>
                <mi>f</mi>
                <mi>A</mi>
              </msub>
              <mo>(</mo>
              <msub>
                <mi>x</mi>
                <mi>i</mi>
              </msub>
              <mo>)</mo>
              <mo>&#x00B7;</mo>
              <mi>&#x394;x</mi>
            </mtd>
          </mtr>
          <mtr>
            <mtd>
              <mi>P</mi>
              <mo>+=</mo>
              <msub>
                <mi>f</mi>
                <mi>B</mi>
              </msub>
              <mo>(</mo>
              <msub>
                <mi>x</mi>
                <mi>i</mi>
              </msub>
              <mo>)</mo>
              <mo>&#x00B7;</mo>
              <msub>
                <mi>F</mi>
                <mi>A</mi>
              </msub>
              <mo>(</mo>
              <msub>
                <mi>x</mi>
                <mi>i</mi>
              </msub>
              <mo>)</mo>
              <mo>&#x00B7;</mo>
              <mi>&#x394;x</mi>
            </mtd>
          </mtr>
        </mtable>
      </math>
    </MathBlock>
  )
}

export function ExpectedLossFormula() {
  return (
    <MathBlock>
      <math display="block">
        <mtable columnalign="left" rowspacing="0.7em">
          <mtr>
            <mtd>
              <msub>
                <mi>Loss</mi>
                <mi>B</mi>
              </msub>
              <mo>=</mo>
              <mi>E</mi>
              <mo>[</mo>
              <mo>max</mo>
              <mo>(</mo>
              <msub>
                <mi>&#x3B8;</mi>
                <mi>A</mi>
              </msub>
              <mo>&#x2212;</mo>
              <msub>
                <mi>&#x3B8;</mi>
                <mi>B</mi>
              </msub>
              <mo>,</mo>
              <mn>0</mn>
              <mo>)</mo>
              <mo>]</mo>
            </mtd>
          </mtr>
          <mtr>
            <mtd>
              <msub>
                <mi>Loss</mi>
                <mi>A</mi>
              </msub>
              <mo>=</mo>
              <mi>E</mi>
              <mo>[</mo>
              <mo>max</mo>
              <mo>(</mo>
              <msub>
                <mi>&#x3B8;</mi>
                <mi>B</mi>
              </msub>
              <mo>&#x2212;</mo>
              <msub>
                <mi>&#x3B8;</mi>
                <mi>A</mi>
              </msub>
              <mo>,</mo>
              <mn>0</mn>
              <mo>)</mo>
              <mo>]</mo>
            </mtd>
          </mtr>
        </mtable>
      </math>
    </MathBlock>
  )
}

export function StoppingThresholdFormula() {
  return (
    <MathBlock>
      <math display="block">
        <mrow>
          <mo>Ship B when </mo>
          <msub>
            <mi>Loss</mi>
            <mi>B</mi>
          </msub>
          <mo>=</mo>
          <mi>E</mi>
          <mo>[</mo>
          <mo>max</mo>
          <mo>(</mo>
          <msub>
            <mi>&#x3B8;</mi>
            <mi>A</mi>
          </msub>
          <mo>&#x2212;</mo>
          <msub>
            <mi>&#x3B8;</mi>
            <mi>B</mi>
          </msub>
          <mo>,</mo>
          <mn>0</mn>
          <mo>)</mo>
          <mo>]</mo>
          <mo>&lt;</mo>
          <mi>&#x3B5;</mi>
        </mrow>
      </math>
    </MathBlock>
  )
}

export function MinimumSampleSizeFormula() {
  return (
    <MathBlock>
      <math display="block">
        <mrow>
          <msub>
            <mi>N</mi>
            <mi>min</mi>
          </msub>
          <mo>=</mo>
          <mo>min</mo>
          <mo>{`{`}</mo>
          <mi>N</mi>
          <mo>:</mo>
          <msub>
            <mi>Loss</mi>
            <mi>B</mi>
          </msub>
          <mo>(</mo>
          <mi>N</mi>
          <mo>)</mo>
          <mo>&lt;</mo>
          <mi>&#x3B5;</mi>
          <mo>{`}`}</mo>
        </mrow>
      </math>
    </MathBlock>
  )
}
