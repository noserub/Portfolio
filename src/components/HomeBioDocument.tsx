import React from "react";
import { motion } from "motion/react";
import type { BioDocument, BioParagraph, BioRun } from "../lib/homePageContent";
import { modern } from "../design/modernTokens";

function gradientStops(delayIndex: number) {
  const sets = [
    [
      "linear-gradient(45deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)",
      "linear-gradient(90deg, #8b5cf6 0%, #3b82f6 50%, #fbbf24 100%)",
      "linear-gradient(135deg, #3b82f6 0%, #fbbf24 50%, #ec4899 100%)",
      "linear-gradient(180deg, #fbbf24 0%, #ec4899 50%, #8b5cf6 100%)",
      "linear-gradient(45deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)",
    ],
    [
      "linear-gradient(90deg, #8b5cf6 0%, #3b82f6 50%, #fbbf24 100%)",
      "linear-gradient(135deg, #3b82f6 0%, #fbbf24 50%, #ec4899 100%)",
      "linear-gradient(180deg, #fbbf24 0%, #ec4899 50%, #8b5cf6 100%)",
      "linear-gradient(45deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)",
      "linear-gradient(90deg, #8b5cf6 0%, #3b82f6 50%, #fbbf24 100%)",
    ],
    [
      "linear-gradient(135deg, #3b82f6 0%, #fbbf24 50%, #ec4899 100%)",
      "linear-gradient(180deg, #fbbf24 0%, #ec4899 50%, #8b5cf6 100%)",
      "linear-gradient(45deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)",
      "linear-gradient(90deg, #8b5cf6 0%, #3b82f6 50%, #fbbf24 100%)",
      "linear-gradient(135deg, #3b82f6 0%, #fbbf24 50%, #ec4899 100%)",
    ],
    [
      "linear-gradient(180deg, #fbbf24 0%, #ec4899 50%, #8b5cf6 100%)",
      "linear-gradient(45deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)",
      "linear-gradient(90deg, #8b5cf6 0%, #3b82f6 50%, #fbbf24 100%)",
      "linear-gradient(135deg, #3b82f6 0%, #fbbf24 50%, #ec4899 100%)",
      "linear-gradient(180deg, #fbbf24 0%, #ec4899 50%, #8b5cf6 100%)",
    ],
  ] as const;
  const set = sets[delayIndex % sets.length];
  return [...set];
}

export interface BioDocumentRendererProps {
  document: BioDocument;
  paragraphGapRem?: number;
  lineHeight?: number;
  className?: string;
  variant?: "classic" | "modern";
}

export function BioDocumentRenderer({
  document,
  paragraphGapRem = 1,
  lineHeight = 1.625,
  className = "",
  variant = "classic",
}: BioDocumentRendererProps) {
  let gradientRunIndex = 0;

  const renderRun = (run: BioRun, pIndex: number, rIndex: number) => {
    const key = `p${pIndex}-r${rIndex}-${run.type}`;
    if (!run.text && run.type !== "text") return null;

    if (run.type === "text" && !run.text) {
      return null;
    }

    if (run.type === "bold") {
      return (
        <strong
          key={key}
          className={variant === "modern" ? "font-semibold" : "font-bold"}
          style={variant === "modern" ? { color: modern.text } : undefined}
        >
          {run.text}
        </strong>
      );
    }

    if (run.type === "gradient") {
      if (variant === "modern") {
        return (
          <span key={key} style={{ color: modern.accent }}>
            {run.text}
          </span>
        );
      }
      const idx = gradientRunIndex++;
      return (
        <motion.span
          key={key}
          className="inline-block"
          animate={{
            backgroundImage: gradientStops(idx),
          }}
          transition={{
            duration: 10 + (idx % 4),
            repeat: Infinity,
            ease: "linear",
            delay: idx * 2.5,
          }}
          style={{
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {run.text}
        </motion.span>
      );
    }

    return (
      <span key={key} className="inline">
        {run.text}
      </span>
    );
  };

  const paragraphs = document.paragraphs?.length
    ? document.paragraphs
    : [{ runs: [{ type: "text" as const, text: "" }] }];

  return (
    <div
      className={`${variant === "modern" ? "mb-0 pr-0 max-w-xl" : "text-lg md:text-xl text-foreground mb-6 pr-8 md:pr-12 lg:pr-16"} ${className}`}
    >
      <div className="flex flex-col" style={{ gap: `${paragraphGapRem}rem` }}>
        {paragraphs.map((para: BioParagraph, pIndex: number) => (
          <p
            key={pIndex}
            className={`break-words ${variant === "modern" ? "text-[1.0625rem] leading-relaxed" : "leading-relaxed"}`}
            style={{
              lineHeight: variant === "modern" ? lineHeight : lineHeight,
              color: variant === "modern" ? "#8C8C8C" : undefined,
            }}
          >
            {para.runs?.map((run, rIndex) => renderRun(run, pIndex, rIndex))}
          </p>
        ))}
      </div>
    </div>
  );
}
