import { Text, Title } from "~/UI/Typography"

interface ResumeItem {
  company: string
  companyLink: string
  jobTitle: string
  startDate: string
  endDate: string
  description: string[]
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
    companyLink: "https://rpchiro.com",
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
]

const ResumeItem = ({ resumeItem }: { resumeItem: ResumeItem }) => {
  return (
    <div>
      <Title href={resumeItem.companyLink}>{resumeItem.company}</Title>
      <div className="mt-2 flex gap-x-2">
        <Text className="font-semibold text-black">{resumeItem.jobTitle}</Text>
        <Text>
          ({resumeItem.startDate}&#8211;{resumeItem.endDate})
        </Text>
      </div>
      <ul className="mt-4 flex list-disc flex-col gap-y-3">
        {resumeItem.description.map((desc, index) => {
          return (
            <li key={index}>
              <Text>{desc}</Text>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

const ExperienceSection = () => {
  return (
    <div className="flex flex-col items-center">
      <div className="box-content flex max-w-md flex-col gap-y-16 px-8">
        {resumeItems.map((item, index) => {
          return <ResumeItem key={index} resumeItem={item} />
        })}
      </div>
    </div>
  )
}

export default ExperienceSection
