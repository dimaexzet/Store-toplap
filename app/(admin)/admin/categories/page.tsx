import { Button } from "@/components/ui/button"
import prisma from "@/lib/prisma"
import Link from "next/link"
import { CategoriesTable } from "@/components/admin/categories/categories-table"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Categories | Admin Dashboard",
  description: "Manage product categories",
}

export default async function CategoriesPage() {
  // Fetch all categories
  const categories = await prisma.category.findMany({
    orderBy: {
      name: 'asc',
    },
    include: {
      _count: {
        select: { products: true },
      },
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">
            Manage product categories in your store
          </p>
        </div>
        <Link href="/admin/categories/new">
          <Button>Add Category</Button>
        </Link>
      </div>

      <CategoriesTable categories={categories} />
    </div>
  )
} 