import { useCallback, useRef, useState } from "react";

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
  label?: string;
  accept?: string;
}

export default function UploadZone({
  onFileSelected,
  disabled = false,
  label = "Arrastrá un archivo",
  accept,
}: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      onFileSelected(file);
    },
    [onFileSelected],
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (!disabled) setDragging(true);
  }

  function handleDragLeave() {
    setDragging(false);
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer ${
        disabled
          ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-50"
          : dragging
            ? "border-black bg-gray-50"
            : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
        disabled={disabled}
      />
      <svg
        className="mx-auto h-10 w-10 text-gray-400 mb-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-xs text-gray-400">
        o hacé click para seleccionar un archivo
      </p>
    </div>
  );
}
