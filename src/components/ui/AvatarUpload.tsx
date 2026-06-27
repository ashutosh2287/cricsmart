"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, Upload } from "lucide-react";

interface AvatarUploadProps {
  currentUrl?: string | null;
  username?: string | null;
  onUpload: (dataUrl: string) => void;
  size?: "md" | "lg";
}

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

function toInitials(name?: string | null): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function getColor(name: string): string {
  const hash = name.toLowerCase().split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return `hsl(${hash % 360}, 45%, 35%)`;
}

export default function AvatarUpload({ currentUrl, username, onUpload, size = "lg" }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = size === "lg" ? "w-24 h-24 text-2xl" : "w-16 h-16 text-lg";
  const displayUrl = preview ?? currentUrl;

  function processFile(file: File) {
    setError(null);

    if (!ACCEPTED.includes(file.type)) {
      setError("Please upload a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > MAX_SIZE) {
      setError("Image must be under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreview(result);
      onUpload(result);
    };
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleRemove() {
    setPreview(null);
    setError(null);
    onUpload("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar Display */}
      <motion.div
        className={`relative group cursor-pointer ${sizeClasses}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {/* Avatar */}
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Avatar"
            className="w-full h-full rounded-full object-cover border-2 border-[var(--border)]"
          />
        ) : (
          <div
            className="w-full h-full rounded-full flex items-center justify-center font-bold text-white border-2 border-[var(--border)]"
            style={{ background: getColor(username ?? "User") }}
          >
            {toInitials(username)}
          </div>
        )}

        {/* Hover Overlay */}
        <motion.div
          className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          initial={false}
        >
          <Camera className="w-5 h-5 text-white" />
        </motion.div>

        {/* Drag Overlay */}
        <AnimatePresence>
          {dragOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-full bg-[var(--brand)]/20 border-2 border-dashed border-[var(--brand)] flex items-center justify-center"
            >
              <Upload className="w-5 h-5 text-[var(--brand)]" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Remove button */}
        {preview && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            onClick={(e) => { e.stopPropagation(); handleRemove(); }}
            className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[var(--danger)] flex items-center justify-center"
          >
            <X className="w-3 h-3 text-white" />
          </motion.button>
        )}
      </motion.div>

      {/* Hidden Input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="hidden"
      />

      {/* Helper Text */}
      <p className="text-xs text-[var(--text-3)] text-center">
        Click or drag to upload. JPG, PNG, WebP under 2MB.
      </p>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-xs text-[var(--danger)]"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
