import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type tParams = Promise<{ id: string }>;

// GET /api/admin/categories/[id] - Get category by ID
export async function GET(
  req: NextRequest,
  { params }: { params: tParams }
) {
  try {
    const session = await auth();
    
    // Check if user is authenticated and is an admin
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const { id } = await params;
    
    // Retrieve category
    const category = await prisma.category.findUnique({
      where: { id },
    });
    
    if (!category) {
      return new NextResponse("Category not found", { status: 404 });
    }
    
    return NextResponse.json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// PATCH /api/admin/categories/[id] - Update category
export async function PATCH(
  req: NextRequest,
  { params }: { params: tParams }
) {
  try {
    const session = await auth();
    
    // Check if user is authenticated and is an admin
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const { id } = await params;
    const { name } = await req.json();
    
    // Validate request data
    if (!name || typeof name !== "string" || name.trim() === "") {
      return new NextResponse("Invalid category name", { status: 400 });
    }
    
    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });
    
    if (!existingCategory) {
      return new NextResponse("Category not found", { status: 404 });
    }
    
    // Check if name already exists (excluding current category)
    const nameExists = await prisma.category.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
        id: {
          not: id,
        },
      },
    });
    
    if (nameExists) {
      return new NextResponse("Category name already exists", { status: 400 });
    }
    
    // Update category
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: { name },
    });
    
    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error("Error updating category:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// DELETE /api/admin/categories/[id] - Delete category
export async function DELETE(
  req: NextRequest,
  { params }: { params: tParams }
) {
  try {
    const session = await auth();
    
    // Check if user is authenticated and is an admin
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const { id } = await params;
    
    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          select: { id: true },
          take: 1,
        },
      },
    });
    
    if (!category) {
      return new NextResponse("Category not found", { status: 404 });
    }
    
    // Check if category has products
    if (category.products.length > 0) {
      return new NextResponse(
        "Cannot delete category with associated products",
        { status: 400 }
      );
    }
    
    // Delete category
    await prisma.category.delete({
      where: { id },
    });
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting category:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 