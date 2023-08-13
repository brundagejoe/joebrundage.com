import BodyContainer from "~/UI/BodyContainer";
import LaunchOnMount from "~/UI/LaunchOnMount";
import MenuBar from "~/UI/Menubar";
import ExperienceSection from "~/pages/Home/ExperienceSection";

export default function Experience() {
  return (
    <div className="font-semibold mb-10">
      <MenuBar />
      <BodyContainer>
        <LaunchOnMount
          className="mt-10 w-full flex flex-col items-center"
          enterFrom="translate-y-[100px] scale-150 opacity-0"
          enterTo="translate-y-0 scale-100 opacity-100"
        >
          <ExperienceSection />
        </LaunchOnMount>
      </BodyContainer>
    </div>
  );
}
