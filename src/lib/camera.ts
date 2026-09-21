"use client";

import { Capacitor } from "@capacitor/core";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { fileToDataUrl } from "./db";

export type PhotoSource = "camera" | "gallery";

export class CameraPermissionDeniedError extends Error {
  constructor() {
    super("CAMERA_PERMISSION_DENIED");
    this.name = "CameraPermissionDeniedError";
  }
}

/** Convert Capacitor photo result into a durable data URL for IndexedDB. */
async function photoToDataUrl(photo: {
  dataUrl?: string;
  base64String?: string;
  format?: string;
  webPath?: string;
}): Promise<string> {
  if (photo.dataUrl) return photo.dataUrl;
  if (photo.base64String) {
    const mime = photo.format ? `image/${photo.format}` : "image/jpeg";
    return `data:${mime};base64,${photo.base64String}`;
  }
  if (photo.webPath) {
    const res = await fetch(photo.webPath);
    const blob = await res.blob();
    return fileToDataUrl(
      new File([blob], "photo.jpg", { type: blob.type || "image/jpeg" })
    );
  }
  throw new Error("No photo data returned");
}

export function isNativePlatform(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/**
 * Explicit camera permission check + OS prompt (native only).
 * Does NOT request photos/gallery permission — Android 13+ Photo Picker
 * works without it, and pre-requesting can break the gallery.
 */
export async function ensureCameraPermission(): Promise<"granted" | "denied"> {
  if (!isNativePlatform()) return "granted";
  try {
    const current = await Camera.checkPermissions();
    if (current.camera === "granted") return "granted";
    const result = await Camera.requestPermissions({
      permissions: ["camera"],
    });
    if (result.camera === "granted") return "granted";
    return "denied";
  } catch {
    return "denied";
  }
}

/**
 * Capture or pick a photo.
 * Camera path requests CAMERA permission first; denied → CameraPermissionDeniedError
 * so Gallery remains usable. Gallery path skips photos permission pre-request.
 */
export async function capturePhoto(source: PhotoSource): Promise<string> {
  if (source === "camera") {
    const status = await ensureCameraPermission();
    if (status === "denied") throw new CameraPermissionDeniedError();
  }

  const cameraSource =
    source === "camera" ? CameraSource.Camera : CameraSource.Photos;

  const photo = await Camera.getPhoto({
    quality: 85,
    allowEditing: false,
    resultType: CameraResultType.DataUrl,
    source: cameraSource,
    correctOrientation: true,
  });

  return photoToDataUrl(photo);
}

/** Read a File (from web input) as data URL. */
export async function readPickedFile(
  file: File | null
): Promise<string | null> {
  if (!file) return null;
  return fileToDataUrl(file);
}
