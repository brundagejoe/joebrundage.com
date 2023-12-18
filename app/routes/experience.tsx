import BodyContainer from "~/UI/BodyContainer";
import LaunchOnMount from "~/UI/LaunchOnMount";
import ExperienceSection from "~/pages/Home/ExperienceSection";

export default function Experience() {
  return (
    <div className="font-semibold mb-10">
      <BodyContainer>
        <LaunchOnMount
          className="mt-10 w-full flex flex-col items-center"
          enterFrom="translate-y-[200px] opacity-0"
          enterTo="translate-y-0 opacity-100"
        >
          <ExperienceSection />
        </LaunchOnMount>
      </BodyContainer>
    </div>
  );
}
