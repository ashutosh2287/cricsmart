"use client";

import { useEffect } from "react";
import { initEngines } from "@/services/engineBootstrap";
import { enableWhyDidYouRender } from "@/lib/whyDidYouRender";

export default function EngineBootstrap() {
  useEffect(() => {
    enableWhyDidYouRender().catch((error) => {
      console.error("WHY DID YOU RENDER ERROR", error);
    });
    initEngines();
  }, []);

  return null;
}
