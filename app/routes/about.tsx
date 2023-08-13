import BodyContainer from "~/UI/BodyContainer";
import LaunchOnMount from "~/UI/LaunchOnMount";
import MenuBar from "~/UI/Menubar";
import ExperienceSection from "~/pages/Home/ExperienceSection";

export default function About() {
  return (
    <div className="font-semibold mb-10">
      <MenuBar />
      <BodyContainer>
        <LaunchOnMount className="mt-10 w-full flex flex-col items-center">
          <ExperienceSection />
        </LaunchOnMount>
      </BodyContainer>
    </div>
  );
}
