import { Link } from "@remix-run/react"
import profilePicture from "../../images/joe-hannah-500x500.png"
import Button from "~/UI/Button"

const HeroSection = () => {
  return (
    <div className="flex flex-col items-center gap-8 md:mt-10 md:w-[800px] md:flex-row-reverse">
      <img
        className="w-[200px] md:w-[400px]"
        src={profilePicture}
        alt="joe at Zion"
      />
      <div className="flex flex-col gap-y-8 md:py-4">
        <p className="text-3xl">
          Hi I'm Joe! I'm a Software Engineer who loves web development and
          computer graphics.
        </p>
        <div className="flex flex-col items-center gap-y-2 md:items-start">
          <Link className="w-fit" to={"mailto:joebrundage@icloud.com"}>
            <Button>
              <div className="w-[150px] text-xl">Email me</div>
            </Button>
          </Link>
          <Link
            className="w-fit"
            target="_blank"
            to={"https://www.linkedin.com/in/brundagejoe/"}
          >
            <Button>
              <div className="w-[150px] text-xl">My Linkedin</div>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default HeroSection
