"use client";

import { useEffect } from "react";
import { bootstrapRealtime } from "@/services/bootstrapRealtime";

export default function BootstrapRealtime() {

  useEffect(() => {

    bootstrapRealtime();

  }, []);

  return null;
}
