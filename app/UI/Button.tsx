interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
}
const Button = ({ children, onClick }: ButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="w-fit cursor-pointer rounded-full border-2 border-black px-5 py-3 font-bold transition-colors duration-300 hover:bg-black hover:text-white"
    >
      {children}
    </button>
  );
};

export default Button;
