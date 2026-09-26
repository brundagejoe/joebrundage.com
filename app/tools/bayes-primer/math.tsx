import * as React from "react"

function MathBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 overflow-x-auto text-center text-[1rem] sm:text-[1.2rem] opacity-90">
      {children}
    </div>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <mrow>
      <mi>P</mi>
      <mo>(</mo>
      {children}
      <mo>)</mo>
    </mrow>
  )
}

function NotH() {
  return (
    <mrow>
      <mo>&not;</mo>
      <mi>H</mi>
    </mrow>
  )
}

export function BayesRuleFormula() {
  return (
    <MathBlock>
      <math display="block">
        <mrow>
          <P>
            <mi>H</mi>
            <mo>|</mo>
            <mi>E</mi>
          </P>
          <mo>=</mo>
          <mfrac>
            <mrow>
              <P>
                <mi>E</mi>
                <mo>|</mo>
                <mi>H</mi>
              </P>
              <mo>&middot;</mo>
              <P>
                <mi>H</mi>
              </P>
            </mrow>
            <P>
              <mi>E</mi>
            </P>
          </mfrac>
        </mrow>
      </math>
    </MathBlock>
  )
}

export function EvidenceFormula() {
  return (
    <MathBlock>
      <math display="block">
        <mrow>
          <P>
            <mi>E</mi>
          </P>
          <mo>=</mo>
          <P>
            <mi>E</mi>
            <mo>|</mo>
            <mi>H</mi>
          </P>
          <mo>&middot;</mo>
          <P>
            <mi>H</mi>
          </P>
          <mo>+</mo>
          <P>
            <mi>E</mi>
            <mo>|</mo>
            <NotH />
          </P>
          <mo>&middot;</mo>
          <mrow>
            <mo>(</mo>
            <mn>1</mn>
            <mo>&minus;</mo>
            <P>
              <mi>H</mi>
            </P>
            <mo>)</mo>
          </mrow>
        </mrow>
      </math>
    </MathBlock>
  )
}
