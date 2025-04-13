import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/auth";

const f = createUploadthing();

// Define file upload permissions
const handleAuth = async () => {
  const session = await auth();
  
  // Ensure the user is authenticated and is an admin
  if (!session || !session.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  
  return { userId: session.user.id };
};

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you need
  productImage: f({ image: { maxFileSize: "8MB", maxFileCount: 10 } })
    // Set permissions and file types
    .middleware(() => handleAuth())
    // Handle finished upload
    .onUploadComplete(({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
      
      return { url: file.url };
    }),
  
  // Add more routes as needed
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter; 