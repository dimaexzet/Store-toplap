import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/auth";

const f = createUploadthing();

// Define file upload permissions
const handleAuth = async () => {
  try {
    console.log("Authentication check for uploadthing started");
    const session = await auth();
    
    if (!session) {
      console.error("Authentication failed: No session found");
      throw new Error("Unauthorized: No session");
    }
    
    if (!session.user) {
      console.error("Authentication failed: No user in session");
      throw new Error("Unauthorized: No user");
    }
    
    if (session.user.role !== "ADMIN") {
      console.error("Authorization failed: User is not an admin", session.user);
      throw new Error("Unauthorized: Not an admin");
    }
    
    console.log("Authentication successful for user:", session.user.id);
    return { userId: session.user.id };
  } catch (error) {
    console.error("Authentication error in uploadthing middleware:", error);
    throw error; // Re-throw to be handled by UploadThing
  }
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