import { Components } from "react-markdown";

export const getMarkdownComponents = (): Components => {
  return {
    h1: ({ children }) => {
      return (
        <h1 className="text-primary text-4xl font-bold py-4 border-b border-[#1c2d49] mb-2 sm:text-lg ">
          {children}
        </h1>
      );
    },
    h2: ({ children }) => (
      <h2 className="text-primary text-3xl font-bold py-3 sm:text-sm sm:m-0">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-primary text-xl font-bold py-3 sm:text-sm sm:m-0">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="text-primary text-base sm:text-xs lg:text-sm text-justify max-w-[860px] sm:max-w-[400px] sm:overflow-auto ">
        {children}
      </p>
    ),
    strong: ({ children }) => (
      <strong className="text-primary text-base sm:text-xs lg:text-sm">
        {children}
      </strong>
    ),
    div: ({ children }) => <div className="text-primary py-3">{children}</div>,
    a: ({ children, href }) => (
      <a className="text-accent cursor-pointer sm:text-xs" href={href}>
        {children}
      </a>
    ),
    pre: ({ children }) => (
      <pre className="bg-secondary-content text-secondary rounded p-5 text-base sm:text-xs lg:text-sm overflow-auto">
        {children}
      </pre>
    ),
    code: ({ children }) => (
      <code className="text-sm rounded bg-secondary-content text-secondary w-full px-[4px] sm:text-xs">
        {children}
      </code>
    ),
    blockquote: ({ children }) => (
      <blockquote className="text-justify text-base sm:text-xs lg:text-sm ">
        {children}
      </blockquote>
    ),
    li: ({ children }) => (
      <li className="list-disc text-base sm:text-xs lg:text-sm ">{children}</li>
    ),
  };
};
