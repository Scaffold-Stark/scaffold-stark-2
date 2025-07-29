import React, { useState, useRef, useEffect } from "react";
import { type Toast, ToastPosition, toast } from "react-hot-toast";
import { XMarkIcon } from "@heroicons/react/20/solid";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/solid";
import { useScrollLock } from "~~/hooks/useScrollLock";

type NotificationProps = {
  content: React.ReactNode;
  status: "success" | "info" | "loading" | "error" | "warning";
  duration?: number;
  icon?: string;
  position?: ToastPosition;
};

type NotificationOptions = {
  duration?: number;
  icon?: string;
  position?: ToastPosition;
};

const ENUM_STATUSES = {
  success: <CheckCircleIcon className="w-7 text-success" />,
  loading: <span className="w-6 loading loading-spinner"></span>,
  error: <ExclamationCircleIcon className="w-7 text-error" />,
  info: <InformationCircleIcon className="w-7 text-info" />,
  warning: <ExclamationTriangleIcon className="w-7 text-warning" />,
};

const DEFAULT_DURATION = 3000;
const DEFAULT_POSITION: ToastPosition = "top-center";

const ToastContent = ({
  t,
  content,
  status,
  icon,
  position,
}: NotificationProps & { t: Toast }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsExpand, setNeedsExpand] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useScrollLock(isExpanded);

  useEffect(() => {
    if (contentRef.current) {
      const lineHeight = parseInt(
        window.getComputedStyle(contentRef.current).lineHeight,
      );
      const totalHeight = contentRef.current.scrollHeight;
      const numberOfLines = totalHeight / lineHeight;
      setNeedsExpand(numberOfLines > 10);
    }
  }, [content]);

  return (
    <div
      className={`flex flex-col max-w-sm rounded-xl shadow-center shadow-accent bg-base-200 md:p-4 p-2 transform-gpu relative transition-all duration-500 ease-in-out
      ${
        position?.substring(0, 3) === "top"
          ? `hover:translate-y-1 ${t.visible ? "top-0" : "-top-96"}`
          : `hover:-translate-y-1 ${t.visible ? "bottom-0" : "-bottom-96"}`
      }`}
    >
      <div className="flex flex-row items-start space-x-2">
        <div className="leading-[0] self-center">
          {icon ? icon : ENUM_STATUSES[status]}
        </div>

        <div className="flex-1 min-w-0 md:max-w-max max-w-[230px]">
          <div
            ref={contentRef}
            className={`break-words whitespace-pre-line ${icon ? "mt-1" : ""}
              ${
                isExpanded
                  ? "max-h-[600px] overflow-y-auto"
                  : "line-clamp-10 overflow-hidden"
              }`}
          >
            {content}
          </div>
        </div>

        <div
          className={`cursor-pointer text-lg shrink-0 ${icon ? "mt-1" : ""}`}
          onClick={() => toast.dismiss(t.id)}
        >
          <XMarkIcon
            className="w-6 cursor-pointer"
            onClick={() => toast.remove(t.id)}
          />
        </div>
      </div>

      {needsExpand && (
        <div className="flex items-center justify-center mt-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-500 hover:text-blue-700 text-sm"
          >
            {!isExpanded ? "View Details" : "Close Details"}
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Custom Notification
 */
const Notification = ({
  content,
  status,
  duration = DEFAULT_DURATION,
  icon,
  position = DEFAULT_POSITION,
}: NotificationProps) => {
  return toast.custom(
    (t: Toast) => (
      <ToastContent
        t={t}
        content={content}
        status={status}
        icon={icon}
        position={position}
        duration={duration}
      />
    ),
    {
      duration: status === "loading" ? Infinity : duration,
      position,
    },
  );
};

export const notification = {
  success: (content: React.ReactNode, options?: NotificationOptions) => {
    return Notification({ content, status: "success", ...options });
  },
  info: (content: React.ReactNode, options?: NotificationOptions) => {
    return Notification({ content, status: "info", ...options });
  },
  warning: (content: React.ReactNode, options?: NotificationOptions) => {
    return Notification({ content, status: "warning", ...options });
  },
  error: (content: React.ReactNode, options?: NotificationOptions) => {
    const logId = `tx-error-${Date.now()}`;
    console.error(`[${logId}] Transaction error:`, content);

    const fallbackContent: React.ReactNode = (
      <div>
        <div className="font-semibold text-red-500 text-base">
          ❌ Transaction failed
        </div>
        <div className="text-sm">Check the console for more details.</div>
        <div className="text-sm">
          <a
            href={`#${logId}`}
            className="text-blue-500 underline"
            onClick={() => console.log(`Navigate to log ID: ${logId}`)}
          >
            View log: {logId}
          </a>
        </div>
      </div>
    );

    return Notification({
      content: fallbackContent,
      status: "error",
      ...options,
    });
  },
  loading: (content: React.ReactNode, options?: NotificationOptions) => {
    return Notification({ content, status: "loading", ...options });
  },
  remove: (toastId: string) => {
    toast.remove(toastId);
  },
};
