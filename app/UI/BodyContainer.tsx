interface BodyContainerProps {
  children: React.ReactNode;
}
const BodyContainer = ({ children }: BodyContainerProps) => {
  return <div className="flex flex-col items-center mx-10">{children}</div>;
};

export default BodyContainer;
