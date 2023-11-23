import clsx from "clsx";
interface BodyContainerProps {
  serif?: boolean;
  children?: React.ReactNode;
}
const BodyContainer = ({ children, serif }: BodyContainerProps) => {
  return (
    <div
      className={clsx(
        "flex flex-col items-center mx-10",
        serif && "font-serif"
      )}
    >
      {children}
    </div>
  );
};

export default BodyContainer;
