"use client";

import React, { FC, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useParams } from "next/navigation";

// eslint-disable-next-line react/display-name

const PageView: React.FC = () => {
  const { id } = useParams();

  const [markdown, setMarkdown] = useState<string>();

  useEffect(() => {
    const getMarkdown = async () => {
      const response = await fetch(
        `https://raw.githubusercontent.com/Quantum3-Labs/speedrunstark/${id}/README.md`,
        // `https://raw.githubusercontent.com/scaffold-eth/se-2-challenges/challenge-0-simple-nft/README.md`,
      );
      const markdownData = await response.text();
      setMarkdown(markdownData);
    };

    getMarkdown();
  }, [id]);
  return (
    <div className=" flex items-center w-full justify-center sm:text-[12px] ">
      <div className="max-w-[860px] py-20 sm:max-w-[400px] sm:py-5 sm:px-5 leading-7">
        <ReactMarkdown
          components={{
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
            div: ({ children }) => (
              <div className="text-primary py-3">{children}</div>
            ),
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
          }}
        >
          {markdown}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default PageView;
