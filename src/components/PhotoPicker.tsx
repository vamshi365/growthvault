"use client";

import { useRef, useState } from "react";
import { CameraIcon } from "./icons";
import {
  CameraPermissionDeniedError,
  capturePhoto,
  ensureCameraPermission,
  isNativePlatform,
  readPickedFile,
  type PhotoSource,
} from "@/lib/camera";

type PhotoPickerProps = {
  photo: string | null;
  onPhoto: (dataUrl: string) => void;
  /** Empty-state hint under the camera icon */
  emptyLabel?: string;
  /** Optional larger preview height class */
  previewClassName?: string;
  className?: string;
};

type SheetMode = "actions" | "camera-rationale";

/**
 * Add-photo control with Take Photo / Choose from Gallery / Cancel.
 * Native: rationale → OS CAMERA permission → capture.
 * Deny path: clear message; Gallery still works (no dead end).
 * Web: file inputs (capture="environment" for camera where supported).
 * Copy never claims vault encryption.
 */
export function PhotoPicker({
  photo,
  onPhoto,
  emptyLabel = "Add photo",
  previewClassName = "max-h-56 w-full rounded-[16px] object-cover",
  className = "",
}: PhotoPickerProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<SheetMode>("actions");
  const [busy, setBusy] = useState(false);
  const [denyMessage, setDenyMessage] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  function openSheet() {
    setSheetMode("actions");
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
    setSheetMode("actions");
  }

  async function runGallery() {
    setBusy(true);
    try {
      if (isNativePlatform()) {
        const dataUrl = await capturePhoto("gallery");
        onPhoto(dataUrl);
        setDenyMessage(null);
      } else {
        galleryInputRef.current?.click();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!/cancel/i.test(msg)) {
        galleryInputRef.current?.click();
      }
    } finally {
      setBusy(false);
    }
  }

  async function runCameraAfterPermission() {
    setBusy(true);
    try {
      if (!isNativePlatform()) {
        cameraInputRef.current?.click();
        return;
      }
      const status = await ensureCameraPermission();
      if (status === "denied") {
        setDenyMessage(
          "Camera access denied. You can still Choose from Gallery — no dead end."
        );
        setSheetMode("actions");
        setSheetOpen(true);
        return;
      }
      const dataUrl = await capturePhoto("camera");
      onPhoto(dataUrl);
      setDenyMessage(null);
    } catch (err) {
      if (err instanceof CameraPermissionDeniedError) {
        setDenyMessage(
          "Camera access denied. You can still Choose from Gallery — no dead end."
        );
        setSheetMode("actions");
        setSheetOpen(true);
        return;
      }
      const msg = err instanceof Error ? err.message : String(err);
      if (/cancel/i.test(msg)) return;
      // Soft fallback to gallery so the flow never dead-ends
      setDenyMessage(
        "Couldn’t open the camera. Choose from Gallery instead."
      );
      setSheetMode("actions");
      setSheetOpen(true);
    } finally {
      setBusy(false);
    }
  }

  function onChoose(source: PhotoSource) {
    if (source === "gallery") {
      closeSheet();
      void runGallery();
      return;
    }
    // Take Photo → explicit in-app rationale, then OS permission prompt
    if (isNativePlatform()) {
      setSheetMode("camera-rationale");
      return;
    }
    closeSheet();
    cameraInputRef.current?.click();
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    setBusy(true);
    try {
      const url = await readPickedFile(file);
      if (url) {
        onPhoto(url);
        setDenyMessage(null);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="w-full space-y-2">
        <button
          type="button"
          disabled={busy}
          onClick={openSheet}
          className={`flex min-h-[44px] w-full cursor-pointer flex-col items-center gap-2 overflow-hidden rounded-[22px] border border-dashed border-gv-border bg-gv-muted p-4 text-center disabled:opacity-60 ${className}`}
          aria-label={photo ? "Change photo" : "Add photo"}
        >
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="Preview" className={previewClassName} />
          ) : (
            <>
              <CameraIcon className="text-gv-accent" />
              <span className="text-sm text-gv-text-muted">
                {busy ? "Opening…" : emptyLabel}
              </span>
            </>
          )}
        </button>

        {denyMessage && (
          <p
            role="status"
            className="rounded-[16px] border border-[#5A3034] bg-[#3A2024] px-3 py-2 text-left text-xs leading-relaxed text-[#FF8A80]"
          >
            {denyMessage}
          </p>
        )}
      </div>

      {/* Hidden web fallbacks */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => void onFileChange(e)}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void onFileChange(e)}
      />

      {sheetOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-4 sm:items-center"
          role="presentation"
          onClick={closeSheet}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={
              sheetMode === "camera-rationale"
                ? "Camera permission"
                : "Add photo"
            }
            className="w-full max-w-[400px] rounded-[28px] border border-gv-border bg-gv-card p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {sheetMode === "camera-rationale" ? (
              <>
                <p className="gv-eyebrow mb-2 text-gv-accent-text">
                  Camera access
                </p>
                <p className="mb-4 text-sm leading-relaxed text-gv-text-muted">
                  GrowthVault needs camera permission to take a progress photo.
                  Photos are saved locally on this device only (IndexedDB) and
                  are not uploaded. This is not a secure vault.
                </p>
                <button
                  type="button"
                  disabled={busy}
                  className="mb-2 flex w-full min-h-[52px] items-center justify-center gap-2 rounded-full bg-gv-accent px-4 text-sm font-bold text-white disabled:opacity-60"
                  onClick={() => {
                    closeSheet();
                    void runCameraAfterPermission();
                  }}
                >
                  Continue
                </button>
                <button
                  type="button"
                  className="mb-2 flex w-full min-h-[44px] items-center justify-center rounded-[22px] border border-gv-border bg-gv-muted px-4 py-3 text-sm font-semibold"
                  onClick={() => {
                    closeSheet();
                    void runGallery();
                  }}
                >
                  Choose from Gallery instead
                </button>
                <button
                  type="button"
                  className="flex w-full min-h-[44px] items-center justify-center text-sm text-gv-text-muted"
                  onClick={() => setSheetMode("actions")}
                >
                  Back
                </button>
              </>
            ) : (
              <>
                <p className="gv-eyebrow mb-3 text-gv-accent-text">Add photo</p>
                {denyMessage && (
                  <p
                    role="status"
                    className="mb-3 rounded-[16px] border border-[#5A3034] bg-[#3A2024] px-3 py-2 text-xs leading-relaxed text-[#FF8A80]"
                  >
                    {denyMessage}
                  </p>
                )}
                <button
                  type="button"
                  className="mb-2 flex w-full min-h-[52px] items-center justify-center gap-2 rounded-full bg-gv-accent px-4 text-sm font-bold text-white"
                  onClick={() => onChoose("camera")}
                >
                  <CameraIcon size={18} />
                  Take Photo
                </button>
                <button
                  type="button"
                  className="mb-2 flex w-full min-h-[44px] items-center justify-center rounded-[22px] border border-gv-border bg-gv-muted px-4 py-3 text-sm font-semibold"
                  onClick={() => onChoose("gallery")}
                >
                  Choose from Gallery
                </button>
                <button
                  type="button"
                  className="flex w-full min-h-[44px] items-center justify-center text-sm text-gv-text-muted"
                  onClick={closeSheet}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
