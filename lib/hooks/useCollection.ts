"use client";

import { useContext } from "react";
import { CollectionContext } from "@/lib/context/CollectionContext";

export function useCollection() {
  const context = useContext(CollectionContext);

  if (!context) {
    throw new Error("useCollection must be used within CollectionProvider.");
  }

  return context;
}
