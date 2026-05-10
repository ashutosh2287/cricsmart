"use client";

import { useEffect } from "react";
import { initEngines } from "@/services/engineBootstrap";

export default function EngineBootstrap() {
  useEffect(() => {
    initEngines();
  }, []);

  return null;
}