import { CategoryForm } from "@/components/admin/categories/category-form"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "New Category | Admin Dashboard",
  description: "Add a new product category",
}

export default function NewCategoryPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add Category</h1>
        <p className="text-muted-foreground">
          Create a new product category
        </p>
      </div>

      <CategoryForm />
    </div>
  )
} 