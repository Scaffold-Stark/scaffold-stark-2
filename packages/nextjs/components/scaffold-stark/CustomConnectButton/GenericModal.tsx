import { useTheme } from "next-themes";

const GenericModal = ({
  isOpen,
  onClose,
  animate,
  children,
  className,
  position,
}: {
  isOpen: boolean;
  onClose: (e: React.MouseEvent<HTMLButtonElement>) => void;
  animate: boolean;
  children: React.ReactNode;
  className?: string;
  position?: string;
}) => {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  return (
    <>
      {isOpen && (
        <section
          onClick={onClose}
          className={`fixed h-screen w-screen grid  top-0 left-0  z-[99] backdrop-blur justify-center items-center
            ${!isOpen ? "hidden" : ""}`}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`bg-modal rounded-[15px] flex flex-col transition-[opacity,transform] duration-500 ease-in-out border border-[#4f4ab7] ${
              animate
                ? "translate-y-0 opacity-100"
                : "translate-y-full opacity-0"
            } ${className}`}
          >
            {children}
          </div>
        </section>
      )}
    </>
  );
};

export default GenericModal;
