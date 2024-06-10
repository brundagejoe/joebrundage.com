import type { MetaFunction } from "@remix-run/node"
import BodyContainer from "~/UI/BodyContainer"
import HeroSection from "~/pages/Home/HeroSection"

export const meta: MetaFunction = () => {
  return [
    { title: "Joe Brundage | Software Engineer" },
    { name: "description", content: "Joe Brundage's personal website" },
  ]
}

export default function Index() {
  return (
    <div className="font-semibold">
      <BodyContainer>
        <HeroSection />
      </BodyContainer>
    </div>
  )
}
