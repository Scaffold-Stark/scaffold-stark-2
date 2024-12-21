import { useTheme } from "next-themes";

const GenericModal = ({
  children,
  className = "modal-box modal-border bg-modal  rounded-[8px] border border-border flex flex-col gap-3 justify-around relative bg-background",
  modalId,
}: {
  children: React.ReactNode;
  className?: string;
  modalId: string;
}) => {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  return (
    <label htmlFor={modalId} className="modal cursor-pointer backdrop-blur">
      <label className={className}>
        {/* dummy input to capture event onclick on modal box */}
        <input className="absolute left-0 top-0 h-0 w-0" />
        {children}
      </label>
    </label>
  );
};

export default GenericModal;
