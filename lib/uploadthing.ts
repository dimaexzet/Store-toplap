import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

// Простая базовая конфигурация
export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>(); 