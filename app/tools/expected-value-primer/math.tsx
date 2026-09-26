import * as React from "react"

export function InlineMath({ children }: { children: React.ReactNode }) {
  return <span className="mx-[0.1em] text-[1.04em] italic">{children}</span>
}

function MathBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 overflow-x-auto text-center text-[1.2rem] opacity-90">
      {children}
    </div>
  )
}

export function ExpectedValueFormula() {
  return (
    <MathBlock>
      <math display="block">
        <mrow>
          <mi>E</mi>
          <mo>[</mo>
          <mi>X</mi>
          <mo>]</mo>
          <mo>=</mo>
          <mi>p</mi>
          <mo>&middot;</mo>
          <msub>
            <mi>x</mi>
            <mn>1</mn>
          </msub>
          <mo>+</mo>
          <mo>(</mo>
          <mn>1</mn>
          <mo>&minus;</mo>
          <mi>p</mi>
          <mo>)</mo>
          <mo>&middot;</mo>
          <msub>
            <mi>x</mi>
            <mn>2</mn>
          </msub>
        </mrow>
      </math>
    </MathBlock>
  )
}

export function StandardDeviationFormula() {
  return (
    <MathBlock>
      <math display="block">
        <mrow>
          <mi>&sigma;</mi>
          <mo>=</mo>
          <mo>|</mo>
          <msub>
            <mi>x</mi>
            <mn>1</mn>
          </msub>
          <mo>&minus;</mo>
          <msub>
            <mi>x</mi>
            <mn>2</mn>
          </msub>
          <mo>|</mo>
          <mo>&middot;</mo>
          <msup>
            <mrow>
              <mo>(</mo>
              <mi>p</mi>
              <mo>(</mo>
              <mn>1</mn>
              <mo>&minus;</mo>
              <mi>p</mi>
              <mo>)</mo>
              <mo>)</mo>
            </mrow>
            <mrow>
              <mn>1</mn>
              <mo>/</mo>
              <mn>2</mn>
            </mrow>
          </msup>
        </mrow>
      </math>
    </MathBlock>
  )
}
