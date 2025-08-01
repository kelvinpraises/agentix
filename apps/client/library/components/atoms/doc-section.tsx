"use client";

import { cn } from "@/library/utils";
import { ChevronDown, ChevronRight } from "lucide-react";
import React, { useState } from "react";

const DocSection = ({
  title,
  open,
  className,
  children,
}: {
  title: string;
  open?: boolean;
  className?: string;
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(open ?? false);

  return (
    <div className="mb-4">
      <button
        className={cn(
          "flex items-center w-full text-left text-xl font-black mb-2",
          className
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronDown className="mr-2" /> : <ChevronRight className="mr-2" />}
        {title}
      </button>
      {isOpen && <div className="pl-4">{children}</div>}
    </div>
  );
};

export default DocSection;
