import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    console.log("Checking auth status...");

    // Получаем сессию
    const session = await auth();
    
    // Логгируем информацию
    console.log("Session exists:", !!session);
    
    if (session) {
      return NextResponse.json({
        authenticated: true,
        user: session.user
      });
    } else {
      return NextResponse.json({
        authenticated: false
      });
    }
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json({
      error: "Authentication check failed",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: process.env.NODE_ENV === "development" && error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 