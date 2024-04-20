import { Components } from "react-markdown";

export const getMarkdownComponents = (): Components => {
  return {
    h1: ({ children }) => {
      return (
        <h1 className="text-primary text-4xl font-bold py-4 border-b border-[#1c2d49] leading-7 mb-2 sm:text-lg ">
          {children}
        </h1>
      );
    },
    h2: ({ children }) => (
      <h2 className="text-primary text-3xl font-bold leading-7 py-3 sm:text-sm sm:m-0">
        {children}
      </h2>
    ),
    p: ({ children }) => (
      <p className="text-primary text-base sm:text-xs leading-7 text-justify max-w-[860px] sm:max-w-[400px]">
        {children}
      </p>
    ),
    div: ({ children }) => <div className="text-primary py-3">{children}</div>,
    a: ({ children, href }) => (
      <a
        className="text-accent cursor-pointer sm:text-xs leading-7"
        href={href}
      >
        {children}
      </a>
    ),
    pre: ({ children }) => (
      <pre className="bg-secondary-content text-secondary rounded p-5 sm:text-xs leading-7">
        {children}
      </pre>
    ),
    code: ({ children }) => (
      <code className="text-sm rounded bg-secondary-content text-secondary max-w-[500px] px-[4px] sm:text-xs leading-7">
        {children}
      </code>
    ),
    blockquote: ({ children }) => (
      <blockquote className="text-justify sm:text-xs leading-7">
        {children}
      </blockquote>
    ),
    li: ({ children }) => (
      <li className="list-disc sm:text-xs leading-7">{children}</li>
    ),
  };
};
