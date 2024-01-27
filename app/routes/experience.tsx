import BodyContainer from "~/UI/BodyContainer"
import LaunchOnMount from "~/UI/LaunchOnMount"
import ExperienceSection from "~/pages/Home/ExperienceSection"

export default function Experience() {
  return (
    <div className="mb-10 font-semibold">
      <BodyContainer>
        <LaunchOnMount
          className="mt-10 flex w-full flex-col items-center"
          enterFrom="translate-y-[200px] opacity-0"
          enterTo="translate-y-0 opacity-100"
        >
          <ExperienceSection />
        </LaunchOnMount>
      </BodyContainer>
    </div>
  )
}
