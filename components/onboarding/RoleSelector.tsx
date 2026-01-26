"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import type { TargetRole } from "@/types";
import { cn } from "@/lib/utils/cn";

type RoleCard = {
  id: TargetRole;
  name: string;
  description: string;
  ditherSvg: JSX.Element;
};

const ROLE_CARDS: RoleCard[] = [
  {
    id: "consulting",
    name: "Management Consulting",
    description: "McKinsey, BCG, Bain, and boutique firms",
    ditherSvg: (
      <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
        <defs>
          <pattern id="pat-mc-1" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="white" opacity="0.6" />
          </pattern>
          <pattern id="pat-mc-2" x="0" y="0" width="3" height="3" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="0.8" fill="white" opacity="0.3" />
          </pattern>
          <pattern id="pat-mc-3" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.3" fill="white" opacity="0.8" />
          </pattern>
        </defs>

        <g transform="translate(50, 60)">
          <path d="M 80 100 L 220 100 L 220 220 L 80 220 Z" fill="url(#pat-mc-2)" />
          <path d="M 80 100 L 100 80 L 240 80 L 220 100 Z" fill="url(#pat-mc-3)" />
          <path d="M 220 100 L 240 80 L 240 200 L 220 220 Z" fill="url(#pat-mc-1)" />

          <path d="M 100 80 L 240 80 L 240 200 L 100 200 Z" fill="url(#pat-mc-1)" opacity="0.9" />

          <path
            d="M 145 80 L 145 60 Q 145 50 155 50 L 185 50 Q 195 50 195 60 L 195 80"
            fill="none"
            stroke="white"
            strokeWidth="8"
            strokeLinecap="round"
          />

          <rect x="100" y="80" width="140" height="40" fill="url(#pat-mc-3)" opacity="0.5" />

          <rect x="120" y="110" width="15" height="20" rx="2" fill="white" opacity="0.8" />
          <rect x="205" y="110" width="15" height="20" rx="2" fill="white" opacity="0.8" />

          <path d="M 100 200 L 115 200 L 100 185 Z" fill="white" opacity="0.5" />
          <path d="M 240 200 L 225 200 L 240 185 Z" fill="white" opacity="0.5" />
        </g>
      </svg>
    ),
  },
  {
    id: "pm",
    name: "Product Management",
    description: "Product roles at tech companies",
    ditherSvg: (
      <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
        <defs>
          <pattern id="pat-pm-1" x="0" y="0" width="3" height="3" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1" fill="white" opacity="0.5" />
          </pattern>
          <pattern id="pat-pm-2" x="0" y="0" width="2" height="2" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.7" fill="white" opacity="0.3" />
          </pattern>
        </defs>

        <g transform="translate(60, 80)">
          <path d="M 40 160 L 40 60 L 180 20 L 180 120 Z" fill="url(#pat-pm-2)" opacity="0.5" />
          <path d="M 40 60 L 50 65 L 190 25 L 180 20 Z" fill="white" opacity="0.4" />
          <path d="M 190 25 L 190 125 L 180 120 L 180 20 Z" fill="white" opacity="0.2" />

          <path d="M 50 165 L 50 65 L 190 25 L 190 125 Z" fill="url(#pat-pm-1)" />
          <path d="M 60 155 L 60 75 L 180 40 L 180 120 Z" fill="black" opacity="0.3" />
          <path d="M 60 155 L 60 75 L 180 40 L 180 120 Z" fill="url(#pat-pm-2)" />

          <path d="M 50 165 L 190 125 L 250 155 L 110 195 Z" fill="url(#pat-pm-1)" />
          <path d="M 110 195 L 250 155 L 250 165 L 110 205 Z" fill="white" opacity="0.3" />
          <path d="M 50 165 L 110 195 L 110 205 L 50 175 Z" fill="white" opacity="0.5" />

          <path d="M 130 175 L 170 163 L 185 170 L 145 182 Z" fill="white" opacity="0.2" />

          <path d="M 80 160 L 180 132 L 220 152 L 120 180 Z" fill="black" opacity="0.2" />
          <line x1="90" y1="160" x2="190" y2="132" stroke="white" strokeWidth="1" opacity="0.3" />
          <line x1="100" y1="165" x2="200" y2="137" stroke="white" strokeWidth="1" opacity="0.3" />
        </g>
      </svg>
    ),
  },
  {
    id: "ib",
    name: "Investment Banking",
    description: "Goldman, Morgan Stanley, JP Morgan, and boutiques",
    ditherSvg: (
      <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
        <defs>
          <pattern id="pat-ib-1" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.3" fill="white" opacity="0.5" />
          </pattern>
          <pattern id="pat-ib-2" x="0" y="0" width="3" height="3" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="0.9" fill="white" opacity="0.3" />
          </pattern>
          <pattern id="pat-ib-top" x="0" y="0" width="2" height="2" patternUnits="userSpaceOnUse">
            <rect width="1" height="1" fill="white" opacity="0.8" />
          </pattern>
        </defs>

        <g transform="translate(70, 50)">
          <path d="M 0 250 L 150 300 L 300 250 L 150 200 Z" fill="url(#pat-ib-2)" opacity="0.3" />

          <path d="M 60 270 L 60 220 L 100 205 L 100 255 Z" fill="url(#pat-ib-1)" />
          <path d="M 100 255 L 100 205 L 120 215 L 120 265 Z" fill="white" opacity="0.3" />
          <path d="M 60 220 L 100 205 L 120 215 L 80 230 Z" fill="url(#pat-ib-top)" />

          <path d="M 110 260 L 110 180 L 150 165 L 150 245 Z" fill="url(#pat-ib-1)" />
          <path d="M 150 245 L 150 165 L 170 175 L 170 255 Z" fill="white" opacity="0.3" />
          <path d="M 110 180 L 150 165 L 170 175 L 130 190 Z" fill="url(#pat-ib-top)" />

          <path d="M 160 250 L 160 120 L 200 105 L 200 235 Z" fill="url(#pat-ib-1)" />
          <path d="M 200 235 L 200 105 L 220 115 L 220 245 Z" fill="white" opacity="0.3" />
          <path d="M 160 120 L 200 105 L 220 115 L 180 130 Z" fill="url(#pat-ib-top)" />

          <path d="M 90 190 L 140 150 L 190 90 L 240 60" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" />
          <path d="M 240 60 L 225 65 M 240 60 L 235 75" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" />
        </g>
      </svg>
    ),
  },
  {
    id: "pe",
    name: "Private Equity",
    description: "KKR, Blackstone, Apollo, and growth equity",
    ditherSvg: (
      <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
        <defs>
          <pattern id="pat-pe-1" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="white" opacity="0.5" />
          </pattern>
          <pattern id="pat-pe-2" x="0" y="0" width="3" height="3" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="0.9" fill="white" opacity="0.3" />
          </pattern>
        </defs>

        <g transform="translate(50, 100)">
          <path d="M 0 150 L 80 120 L 100 160 L 20 190 Z" fill="url(#pat-pe-1)" />
          <path d="M 80 120 L 110 110 L 130 150 L 100 160 Z" fill="white" opacity="0.1" />

          <path d="M 300 150 L 220 120 L 200 160 L 280 190 Z" fill="url(#pat-pe-1)" />
          <path d="M 220 120 L 190 110 L 170 150 L 200 160 Z" fill="white" opacity="0.1" />

          <path d="M 110 110 L 160 95 L 170 135 L 120 150 Z" fill="url(#pat-pe-2)" />
          <path d="M 120 150 L 170 135 L 165 155 L 115 170 Z" fill="white" opacity="0.4" />

          <path d="M 190 110 L 140 125 L 150 165 L 200 150 Z" fill="url(#pat-pe-2)" />

          <path d="M 145 105 L 165 100 L 160 120 L 140 125 Z" fill="white" opacity="0.6" />
          <path d="M 155 102 L 175 97 L 170 117 L 150 122 Z" fill="white" opacity="0.6" />

          <path d="M 150 70 L 155 85 L 170 90 L 155 95 L 150 110 L 145 95 L 130 90 L 145 85 Z" fill="white" />
        </g>
      </svg>
    ),
  },
  {
    id: "corporate_strategy",
    name: "Corporate Strategy",
    description: "In-house strategy teams at F500",
    ditherSvg: (
      <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
        <defs>
          <pattern id="pat-strat-1" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.3" fill="white" opacity="0.5" />
          </pattern>
          <pattern id="pat-strat-2" x="0" y="0" width="3" height="3" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="0.9" fill="white" opacity="0.3" />
          </pattern>
        </defs>

        <g transform="translate(100, 60)">
          <ellipse cx="100" cy="280" rx="60" ry="20" fill="url(#pat-strat-1)" />
          <path d="M 40 280 L 40 290 Q 100 320 160 290 L 160 280" fill="url(#pat-strat-2)" />

          <rect x="92" y="100" width="16" height="180" fill="url(#pat-strat-1)" />
          <path d="M 92 100 L 100 85 L 108 100 Z" fill="white" />

          <path d="M 100 85 L 20 105 L 20 115 L 100 95 Z" fill="url(#pat-strat-1)" />
          <path d="M 100 85 L 180 105 L 180 115 L 100 95 Z" fill="url(#pat-strat-1)" />

          <circle cx="100" cy="95" r="5" fill="white" />

          <line x1="20" y1="110" x2="10" y2="180" stroke="white" strokeWidth="1" opacity="0.6" />
          <line x1="20" y1="110" x2="30" y2="180" stroke="white" strokeWidth="1" opacity="0.6" />
          <line x1="20" y1="110" x2="20" y2="180" stroke="white" strokeWidth="1" opacity="0.6" />
          <path d="M 0 180 L 40 180 L 35 200 L 5 200 Z" fill="url(#pat-strat-2)" />
          <ellipse cx="20" cy="180" rx="20" ry="6" fill="url(#pat-strat-1)" stroke="white" strokeWidth="1" />

          <line x1="180" y1="110" x2="170" y2="160" stroke="white" strokeWidth="1" opacity="0.6" />
          <line x1="180" y1="110" x2="190" y2="160" stroke="white" strokeWidth="1" opacity="0.6" />
          <line x1="180" y1="110" x2="180" y2="160" stroke="white" strokeWidth="1" opacity="0.6" />
          <path d="M 160 160 L 200 160 L 195 180 L 165 180 Z" fill="url(#pat-strat-2)" />
          <ellipse cx="180" cy="160" rx="20" ry="6" fill="url(#pat-strat-1)" stroke="white" strokeWidth="1" />
        </g>
      </svg>
    ),
  },
  {
    id: "tech",
    name: "Tech / Strategy",
    description: "Strategy and operations at tech companies",
    ditherSvg: (
      <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
        <defs>
          <pattern id="dither-tech" x="0" y="0" width="3" height="3" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1" fill="white" opacity="0.5" />
          </pattern>
          <pattern id="dither-tech-dense" x="0" y="0" width="2" height="2" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="1" height="1" fill="white" opacity="0.6" />
          </pattern>
          <pattern id="dither-tech-light" x="0" y="0" width="3" height="3" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="0.8" fill="white" opacity="0.3" />
          </pattern>
        </defs>

        <g transform="translate(60, 60)">
          <path d="M 0 160 L 140 230 L 280 160 L 140 90 Z" fill="url(#dither-tech-light)" opacity="0.1" />

          {[0, 1, 2, 3, 4].map((i) => {
            const yStart = 145 + i * 12;
            const xStart = 70 + i * 10;

            return (
              <g key={`trace-left-${i}`}>
                <path
                  d={`M ${xStart} ${yStart} L ${xStart - 20} ${yStart + 10} L ${xStart - 20} ${yStart + 35} L ${xStart - 40} ${yStart + 45}`}
                  stroke="white"
                  strokeWidth="2"
                  fill="none"
                  opacity="0.6"
                />
                <circle cx={xStart - 40} cy={yStart + 45} r="3" fill="white" opacity="0.8" />
                <rect x={xStart} y={yStart - 3} width="4" height="6" fill="white" transform="skewY(-26)" />
              </g>
            );
          })}

          {[0, 1, 2, 3, 4].map((i) => {
            const yStart = 193 - i * 12;
            const xStart = 130 + i * 10;

            return (
              <g key={`trace-right-${i}`}>
                <path
                  d={`M ${xStart} ${yStart} L ${xStart + 20} ${yStart + 10} L ${xStart + 45} ${yStart + 10} L ${xStart + 60} ${yStart + 5}`}
                  stroke="white"
                  strokeWidth="2"
                  fill="none"
                  opacity="0.6"
                />
                <circle cx={xStart + 60} cy={yStart + 5} r="3" fill="white" opacity="0.8" />
                <rect x={xStart - 2} y={yStart - 3} width="4" height="6" fill="white" transform="skewY(26)" />
              </g>
            );
          })}

          {[0, 1, 2, 3].map((i) => {
            const xStart = 100 + i * 15;
            const yStart = 90 + i * 8;
            return (
              <g key={`trace-top-${i}`}>
                <path
                  d={`M ${xStart} ${yStart} L ${xStart} ${yStart - 20} L ${xStart + 15} ${yStart - 35}`}
                  stroke="white"
                  strokeWidth="1.5"
                  fill="none"
                  opacity="0.4"
                />
                <circle cx={xStart + 15} cy={yStart - 35} r="2" fill="white" opacity="0.4" />
              </g>
            );
          })}

          <path d="M 140 80 L 220 120 L 140 160 L 60 120 Z" fill="url(#dither-tech-dense)" />

          <path d="M 140 100 L 180 120 L 140 140 L 100 120 Z" fill="white" opacity="0.2" />

          <path d="M 140 160 L 220 120 L 220 160 L 140 200 Z" fill="url(#dither-tech)" />

          <path d="M 60 120 L 140 160 L 140 200 L 60 160 Z" fill="url(#dither-tech-light)" />

          <path d="M 140 200 L 140 160 M 60 120 L 140 160 L 220 120" stroke="white" strokeWidth="1" opacity="0.5" fill="none" />
        </g>
      </svg>
    ),
  },
  {
    id: "marketing",
    name: "Marketing / Brand Strategy",
    description: "Brand management and go-to-market strategy",
    ditherSvg: (
      <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
        <defs>
          <pattern id="pat-mkt-1" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="white" opacity="0.5" />
          </pattern>
          <pattern id="pat-mkt-2" x="0" y="0" width="3" height="3" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="0.8" fill="white" opacity="0.3" />
          </pattern>
        </defs>

        <g transform="translate(60, 60) rotate(-15 150 150)">
          <ellipse cx="220" cy="150" rx="30" ry="60" fill="url(#pat-mkt-2)" />
          <ellipse cx="220" cy="150" rx="25" ry="55" fill="black" opacity="0.3" />

          <path d="M 220 90 L 80 130 L 80 170 L 220 210 Z" fill="url(#pat-mkt-1)" />

          <rect x="50" y="130" width="30" height="40" fill="white" opacity="0.4" />
          <ellipse cx="50" cy="150" rx="5" ry="20" fill="white" opacity="0.6" />

          <path
            d="M 120 160 L 120 220 Q 120 240 140 240 L 160 240"
            stroke="url(#pat-mkt-1)"
            strokeWidth="15"
            fill="none"
            strokeLinecap="round"
          />

          <path d="M 260 120 Q 280 150 260 180" stroke="white" strokeWidth="4" fill="none" opacity="0.6" />
          <path d="M 280 100 Q 320 150 280 200" stroke="white" strokeWidth="4" fill="none" opacity="0.4" />
          <path d="M 300 80 Q 360 150 300 220" stroke="white" strokeWidth="4" fill="none" opacity="0.2" />
        </g>
      </svg>
    ),
  },
  {
    id: "wealth_management",
    name: "Wealth Management",
    description: "Private banking and asset management",
    ditherSvg: (
      <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
        <defs>
          <pattern id="pat-wm-1" x="0" y="0" width="5" height="5" patternUnits="userSpaceOnUse">
            <circle cx="2.5" cy="2.5" r="1.5" fill="white" opacity="0.4" />
          </pattern>
          <pattern id="pat-wm-2" x="0" y="0" width="3" height="3" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1.2" fill="white" opacity="0.6" />
          </pattern>
        </defs>

        <g transform="translate(80, 70)">
          <path d="M 50 50 L 180 50 L 180 180 L 50 180 Z" fill="url(#pat-wm-1)" />
          <path d="M 50 50 L 80 20 L 210 20 L 180 50 Z" fill="url(#pat-wm-2)" />
          <path d="M 180 50 L 210 20 L 210 150 L 180 180 Z" fill="white" opacity="0.3" />

          <rect x="65" y="65" width="100" height="100" fill="black" opacity="0.2" />

          <path d="M 65 65 L 165 65 L 165 165 L 65 165 Z" fill="url(#pat-wm-1)" />
          <path d="M 65 65 L 75 75 L 155 75 L 165 65" fill="white" opacity="0.2" />

          <rect x="45" y="75" width="20" height="10" rx="2" fill="white" />
          <rect x="45" y="145" width="20" height="10" rx="2" fill="white" />

          <circle cx="115" cy="115" r="25" fill="url(#pat-wm-2)" stroke="white" strokeWidth="2" />
          <line x1="115" y1="115" x2="115" y2="95" stroke="white" strokeWidth="4" strokeLinecap="round" />
          <line x1="115" y1="115" x2="132" y2="125" stroke="white" strokeWidth="4" strokeLinecap="round" />
          <line x1="115" y1="115" x2="98" y2="125" stroke="white" strokeWidth="4" strokeLinecap="round" />
          <circle cx="115" cy="115" r="5" fill="white" />
        </g>
      </svg>
    ),
  },
];

type SelectedRole = TargetRole | "exploring" | null;

interface RoleSelectorProps {
  selected: SelectedRole;
  onSelect: (role: SelectedRole) => void;
  onContinue: () => void;
  onSkip: () => void;
  onLogoClick: () => void;
}

export default function RoleSelector({
  selected,
  onSelect,
  onContinue,
  onSkip,
  onLogoClick,
}: RoleSelectorProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!selected || selected === "exploring") {
      return;
    }
    const index = ROLE_CARDS.findIndex((role) => role.id === selected);
    if (index >= 0) {
      setFocusedIndex(index);
    }
  }, [selected]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const updateFocusedIndex = () => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    const center = container.scrollLeft + container.clientWidth / 2;
    let nextIndex = focusedIndex;
    let closestDistance = Number.POSITIVE_INFINITY;

    cardRefs.current.forEach((card, index) => {
      if (!card) {
        return;
      }
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(center - cardCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        nextIndex = index;
      }
    });

    if (nextIndex !== focusedIndex) {
      setFocusedIndex(nextIndex);
    }
  };

  const handleScroll = () => {
    if (rafRef.current !== null) {
      return;
    }
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      updateFocusedIndex();
    });
  };

  const scrollToIndex = (index: number) => {
    const target = cardRefs.current[index];
    if (!target) {
      return;
    }
    target.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    setFocusedIndex(index);
  };

  const handleCardClick = (roleId: TargetRole, index: number) => {
    onSelect(roleId);
    scrollToIndex(index);
  };

  const handlePrevious = () => {
    scrollToIndex(Math.max(0, focusedIndex - 1));
  };

  const handleNext = () => {
    scrollToIndex(Math.min(ROLE_CARDS.length - 1, focusedIndex + 1));
  };

  const canContinue = selected !== null;

  return (
    <div className="relative h-full flex flex-col overflow-hidden bg-[#0a0a0a] text-white">
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-zinc-500/10 blur-3xl animate-pulse" />
        <div
          className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-zinc-400/10 blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="relative z-10 flex h-full flex-col p-4 md:p-6 lg:p-8">
        <div className="flex flex-1 flex-col justify-center">
          <div className="mt-16 mb-4 text-center sm:mb-8">
            <h1 className="text-sm font-medium text-zinc-500 uppercase tracking-widest">
              What role are you preparing for?
            </h1>
          </div>

          <div className="relative z-20 mb-6 sm:mb-8">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={focusedIndex === 0}
              className="absolute left-0 top-1/2 z-20 -translate-y-1/2 rounded-full border border-[#2a2a2a] bg-[#1a1a1a] p-3 transition-all hover:bg-[#2a2a2a] disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Previous role"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={focusedIndex === ROLE_CARDS.length - 1}
              className="absolute right-0 top-1/2 z-20 -translate-y-1/2 rounded-full border border-[#2a2a2a] bg-[#1a1a1a] p-3 transition-all hover:bg-[#2a2a2a] disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Next role"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="overflow-x-auto px-12 pb-8 pt-8 scrollbar-hide snap-x snap-mandatory"
            >
              <div className="flex gap-4 sm:gap-6 w-max mx-auto px-[50vw] -translate-x-[160px] sm:-translate-x-[180px]">
                {ROLE_CARDS.map((role, index) => {
                  const isSelected = selected === role.id;
                  return (
                    <button
                      key={role.id}
                      ref={(element) => {
                        cardRefs.current[index] = element;
                      }}
                      type="button"
                      onClick={() => handleCardClick(role.id, index)}
                      className={cn(
                        "group relative h-[340px] w-[280px] flex-shrink-0 overflow-hidden rounded-2xl transition-all duration-300 sm:h-[380px] sm:w-[320px] snap-center",
                        "hover:-translate-y-2 hover:scale-[1.02]",
                        isSelected
                          ? "ring-2 ring-zinc-400 shadow-2xl shadow-zinc-500/20 scale-100 opacity-100"
                          : "hover:shadow-xl hover:shadow-zinc-500/10 scale-90 opacity-60 hover:opacity-100"
                      )}
                    >
                      <div className="absolute inset-0 bg-[#0a0a0a]">
                        <div className="absolute inset-0 flex items-center justify-center p-6">
                          {role.ditherSvg}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/90" />
                        <div
                          className="absolute inset-0 opacity-20 mix-blend-overlay"
                          style={{
                            backgroundImage:
                              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
                          }}
                        />
                      </div>

                      <div className="relative flex h-full flex-col justify-end p-6">
                        <div
                          className={cn(
                            "absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg transition-all",
                            isSelected ? "scale-100 opacity-100" : "scale-75 opacity-0"
                          )}
                        >
                          <Check className="h-4 w-4 text-black" />
                        </div>

                        <div>
                          <h3 className="mb-2 text-left text-lg font-bold">{role.name}</h3>
                          <p className="text-left text-xs leading-relaxed text-gray-300">
                            {role.description}
                          </p>
                        </div>
                      </div>

                      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-500/20 to-transparent" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 pb-2">
              {ROLE_CARDS.map((role, index) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => scrollToIndex(index)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    index === focusedIndex
                      ? "w-6 bg-white"
                      : "w-1.5 bg-zinc-700 hover:bg-zinc-600"
                  )}
                  aria-label={`Go to ${role.name}`}
                />
              ))}
            </div>
          </div>

          <div className="mx-auto mb-4 w-full max-w-sm flex justify-center">
            <button
              type="button"
              onClick={onSkip}
              className="text-xs text-zinc-500 hover:text-white transition-colors py-2"
            >
              Skip for now
            </button>
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={onContinue}
              disabled={!canContinue}
              className={cn(
                "rounded-xl px-8 py-3 text-sm font-semibold transition-all hover:scale-105",
                canContinue
                  ? "bg-white text-black shadow-lg shadow-zinc-500/20 hover:bg-zinc-200"
                  : "cursor-not-allowed bg-[#2a2a2a] text-[#6a6a6a]"
              )}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
