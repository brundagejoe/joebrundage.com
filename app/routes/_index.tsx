import type { V2_MetaFunction } from "@remix-run/node";
import BodyContainer from "~/UI/BodyContainer";
import LaunchOnMount from "~/UI/LaunchOnMount";
import HeroSection from "~/pages/Home/HeroSection";

export const meta: V2_MetaFunction = () => {
  return [
    { title: "Joe Brundage | Software Engineer" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export default function Index() {
  return (
    <div className="font-semibold">
      <BodyContainer>
        <LaunchOnMount>
          <HeroSection />
        </LaunchOnMount>
      </BodyContainer>
    </div>
  );
}
