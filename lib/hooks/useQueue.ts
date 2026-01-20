"use client";

import { useContext } from "react";
import { QueueContext } from "@/lib/context/QueueContext";

export function useQueue() {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error("useQueue must be used within QueueProvider.");
  }
  return context;
}
