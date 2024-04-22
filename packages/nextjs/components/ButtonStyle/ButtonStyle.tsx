interface ButtonProps {
  children: string;
  size?: "small" | "large";
  onClick?: () => void;
}

const ButtonStyle = ({ children, size = "small", onClick }: ButtonProps) => {
  const isSmall = size === "small";
  return (
    <button
      onClick={onClick}
      className={`btn btn-secondary my-4 base_button__${isSmall ? "small" : "large"}`}
    >
      {children}
    </button>
  );
};

export default ButtonStyle;
