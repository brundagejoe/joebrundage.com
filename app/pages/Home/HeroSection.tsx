import { Link } from "@remix-run/react";
import profilePicture from "../../images/joe-hannah-500x500.png";
import Button from "~/UI/Button";

const HeroSection = () => {
  return (
    <div className="md:mt-10 flex flex-col md:flex-row-reverse items-center gap-8 md:w-[800px]">
      <img
        className="w-[200px] md:w-[400px]"
        src={profilePicture}
        alt="joe at Zion"
      />
      <div className="flex flex-col gap-y-8 md:py-4">
        <p className="text-3xl">
          I'm Joe Brundage. I'm a Software Engineer who loves web development
          and computer graphics.
        </p>
        <div className="flex flex-col gap-y-2">
          <Link to={"mailto:joebrundage@icloud.com"}>
            <Button>
              <div className="text-xl w-[150px]">Email me</div>
            </Button>
          </Link>
          <Link to={"https://www.linkedin.com/in/brundagejoe/"}>
            <Button>
              <div className="text-xl w-[150px]">My Linkedin</div>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
