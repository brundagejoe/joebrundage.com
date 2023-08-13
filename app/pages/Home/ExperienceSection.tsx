import { Link } from "@remix-run/react";

interface ResumeItem {
  company: string;
  companyLink: string;
  jobTitle: string;
  startDate: string;
  endDate: string;
  description: string[];
}

const resumeItems: ResumeItem[] = [
  {
    company: "Neighbor",
    companyLink: "https://www.neighbor.com/",
    jobTitle: "Software Engineer",
    startDate: "Jan 2022",
    endDate: "Present",
    description: [
      "Designed, developed, tested, and supported code in React, Ruby On Rails, and Go",
      "Built an in-browser photo editor that saves our company 20+ hours a week in work",
      "Optimized areas of our code base to deliver content to users three times as fast",
      "Collaborated efficiently with a team of engineers and product managers",
    ],
  },
  {
    company: "Naccarato Leadership Center",
    companyLink: "rpchiro.com",
    jobTitle: "Information Technology Specialist",
    startDate: "Dec 2020",
    endDate: "Dec 2021",
    description: [
      "Managed a database of more than 30,000 clients and enhanced weekly email deliverability to each client",
      "Scripted in Python, C++, and Java to automate tasks for team members and increase daily productivity",
      "Worked with non-technical team members to design user interfaces for the company website",
    ],
  },
  {
    company: "Brigham Young University",
    companyLink: "https://byu.edu",
    jobTitle: "Teacher's Assistant",
    startDate: "Sept 2020",
    endDate: "Dec 2020",
    description: [
      "Mentored and taught students in CS 142, which covers the fundamentals of computer programming",
      "Spent one-on-one time with students helping them solve issues with their code and debugging software issues on their computers",
    ],
  },
];

const ExperienceSection = () => {
  return (
    <div className="w-fit">
      <h2 className="text-3xl mb-4">Experience</h2>
      <div className="flex flex-col gap-y-4">
        {resumeItems.map((item) => {
          return (
            <div key={`resume-for-${item.company}`}>
              <Link
                to={item.companyLink}
                className="flex-col w-fit flex text-2xl group/link"
              >
                {item.company}
                <div className="mt-[-2px] h-[2px] w-full rounded-xl bg-black transition-all duration-300 max-w-0 group-hover/link:max-w-full"></div>
              </Link>
              <div className="flex flex-col md:flex-row md:justify-between">
                <h4 className="text-xl">{item.jobTitle}</h4>
                <p className="text-xl font-medium">
                  {item.startDate}&#8211;{item.endDate}
                </p>
              </div>
              <ul className="list-disc pl-4 text-xl">
                {item.description.map((desc, index) => {
                  return (
                    <li
                      className="md:w-[800px]"
                      key={`resume-description-${item.company}-${index}`}
                    >
                      {desc}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExperienceSection;
