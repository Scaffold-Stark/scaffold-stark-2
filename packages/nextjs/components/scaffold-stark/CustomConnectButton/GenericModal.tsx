import { useTheme } from "next-themes";

const GenericModal = ({
  children,
  className = "modal-box modal-border bg-modal rounded-[8px] border flex flex-col relative w-full max-w-xs p-6",
  modalId,
}: {
  children: React.ReactNode;
  className?: string;
  modalId: string;
}) => {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  return (
    <label htmlFor={modalId} className="modal backdrop-blur-sm cursor-pointer">
      <label className={className} style={{ minHeight: "auto" }}>
        {/* dummy input to capture event onclick on modal box */}
        <input className="h-0 w-0 absolute top-0 left-0" />
        {children}
      </label>
    </label>
  );
};

export default GenericModal;
