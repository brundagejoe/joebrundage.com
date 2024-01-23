import BodyContainer from "~/UI/BodyContainer";

const recentBooks = [
  {
    title: "Ready Player One",
    author: "Ernest Cline",
    yearCreated: 2011,
    link: "https://www.amazon.com/Ready-Player-One-Ernest-Cline/dp/0307887448",
  },
  {
    title: "The Martian",
    author: "Andy Weir",
    yearCreated: 2014,
    link: "https://www.amazon.com/Project-Hail-Mary-Andy-Weir/dp/0593135202",
  },
  {
    title: "Project Hail Mary",
    author: "Andy Weir",
    yearCreated: 2021,
    link: "https://www.amazon.com/Project-Hail-Mary-Andy-Weir/dp/0593135202",
  },
  {
    title: "How Will you Measure Your Life?",
    author: "Clayton Christensen",
    yearCreated: 2012,
    link: "https://www.amazon.com/How-Will-Measure-Your-Life/dp/0062102419",
  },
  {
    title: "Sapiens: A Brief History of Humankind",
    author: "Yuval Noah Harari",
    yearCreated: 2015,
    link: "https://www.amazon.com/Sapiens-Humankind-Yuval-Noah-Harari/dp/0062316095",
  },
  {
    title: "Steve Jobs",
    author: "Walter Isaacson",
    yearCreated: 2011,
    link: "https://www.amazon.com/Steve-Jobs-Walter-Isaacson/dp/1451648537",
  },
  {
    title: "Romney: A Reckoning",
    author: "McKay Coppins",
    yearCreated: 2023,
    link: "https://www.amazon.com/Romney-Reckoning-McKay-Coppins/dp/1982196203",
  },
  {
    title: "Rita Hayworth and Shawshank Redemption",
    author: "Stephen King",
    yearCreated: 1982,
    link: "https://www.amazon.com/Rita-Hayworth-Shawshank-Redemption-Stephen/dp/1982155752",
  },
  {
    title: "11/22/63",
    author: "Stephen King",
    yearCreated: 2011,
    link: "https://www.amazon.com/11-22-63-Stephen-King/dp/1451627289",
  },
];

export default function Books() {
  return (
    <BodyContainer>
      <div className="flex flex-col gap-y-2">
        <h1 className="mb-2 text-3xl font-bold">
          Some of the books I've recently read
        </h1>
        {recentBooks.map((book, index) => {
          return (
            <a href={book.link} key={`book-${index}`} className="text-xl">
              <span className="font-bold">{book.title}</span> by{" "}
              <span>
                {book.author} ({book.yearCreated})
              </span>
            </a>
          );
        })}
      </div>
    </BodyContainer>
  );
}
