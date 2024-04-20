"use client";

import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useParams } from "next/navigation";

const PageView: React.FC = () => {
  const { id } = useParams();

  const [markdown, setMarkdown] = useState<string>();

  useEffect(() => {
    const getMarkdown = async () => {
      const response = await fetch(
        `https://raw.githubusercontent.com/Quantum3-Labs/speedrunstark/${id}/README.md`,
      );
      const markdownData = await response.text();
      setMarkdown(markdownData);
    };

    getMarkdown();
  }, [id]);
  return (
    <div className=" flex items-center w-full justify-center sm:text-[12px] ">
      <div className="max-w-[800px] py-20 sm:max-w-[400px] sm:py-5 sm:px-5 ">
        <ReactMarkdown>{markdown}</ReactMarkdown>
      </div>
    </div>
  );
};

export default PageView;
