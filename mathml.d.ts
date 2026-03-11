import type * as React from "react"

type MathMLElementProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLElement>,
  HTMLElement
>

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      math: MathMLElementProps & { display?: string }
      mrow: MathMLElementProps
      mi: MathMLElementProps
      mo: MathMLElementProps
      mn: MathMLElementProps
      mfrac: MathMLElementProps
      msup: MathMLElementProps
      msub: MathMLElementProps
      msubsup: MathMLElementProps
      mtable: MathMLElementProps & { columnalign?: string; rowspacing?: string }
      mtr: MathMLElementProps
      mtd: MathMLElementProps
      mspace: MathMLElementProps & { width?: string }
    }
  }
}

export {}
