import clsx from "clsx";
interface BodyContainerProps {
  serif?: boolean;
  children?: React.ReactNode;
}
const BodyContainer = ({ children, serif }: BodyContainerProps) => {
  return (
    <div
      className={clsx(
        "flex flex-col items-center lg:mx-10 mx-4",
        serif && "font-serif"
      )}
    >
      {children}
    </div>
  );
};

export default BodyContainer;
