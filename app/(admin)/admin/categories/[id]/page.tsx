import { CategoryForm } from "@/components/admin/categories/category-form"
import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Edit Category | Admin Dashboard",
  description: "Edit a product category",
}

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  // Fetch category by ID
  const category = await prisma.category.findUnique({
    where: { id },
  })
  
  if (!category) {
    return notFound()
  }
  
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Category</h1>
        <p className="text-muted-foreground">
          Update a product category
        </p>
      </div>

      <CategoryForm categoryId={id} initialData={category} />
    </div>
  )
} 