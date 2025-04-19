'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/use-toast'
import { useUploadThing } from '@/lib/uploadthing'
import Image from 'next/image'
import { X, Upload, ImagePlus, Loader2 } from 'lucide-react'

type Category = {
  value: string
  label: string
}

type ProductFormProps = {
  productId?: string
  initialData?: {
    name: string
    description: string
    price: number
    stock: number
    categoryId: string
    featured: boolean
    imageUrl?: string | null
    images?: { id: string; url: string }[]
  }
  categories: Category[]
}

export function ProductForm({ productId, initialData, categories }: ProductFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const isEditMode = !!productId
  
  // Form state
  const [name, setName] = useState(initialData?.name || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [price, setPrice] = useState(initialData?.price?.toString() || '')
  const [stock, setStock] = useState(initialData?.stock?.toString() || '0')
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '')
  const [featured, setFeatured] = useState(initialData?.featured || false)
  
  // Image upload state
  const [images, setImages] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Initialize images from initialData
  useEffect(() => {
    if (initialData?.images && initialData.images.length > 0) {
      setImages(initialData.images.map(img => img.url))
    } else if (initialData?.imageUrl) {
      setImages([initialData.imageUrl])
    }
  }, [initialData])
  
  // Setup uploadthing
  const { startUpload } = useUploadThing('productImage')
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles) {
      const filesArray = Array.from(selectedFiles)
      setFiles(prevFiles => [...prevFiles, ...filesArray])
    }
  }
  
  // Remove a file from the list
  const removeFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index))
  }
  
  // Remove an already uploaded image
  const removeImage = (index: number) => {
    setImages(prevImages => prevImages.filter((_, i) => i !== index))
  }
  
  // Handle image upload
  const handleImageUpload = async () => {
    if (files.length === 0) return []
    
    setIsUploading(true)
    try {
      // Проверка размера и типа файлов
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          throw new Error(`File "${file.name}" is not an image`);
        }
        
        // Максимальный размер файла (8MB)
        const maxSize = 8 * 1024 * 1024;
        if (file.size > maxSize) {
          throw new Error(`File "${file.name}" exceeds the 8MB size limit`);
        }
      }

      console.log('Attempting to upload files:', files.map(f => ({ name: f.name, type: f.type, size: f.size })));
      
      // Загружаем файлы напрямую без обертки
      const uploadedImages = await startUpload(files);
      
      if (!uploadedImages || uploadedImages.length === 0) {
        console.error('Upload failed: No files were uploaded');
        throw new Error('No files were uploaded');
      }
      
      console.log('Upload successful:', uploadedImages);
      const imageUrls = uploadedImages.map(img => img.url);
      
      setImages(prevImages => [...prevImages, ...imageUrls]);
      setFiles([]);
      
      return imageUrls;
    } catch (error) {
      console.error('Error uploading images:', error);
      
      // Provide more detailed error message based on the error
      let errorMessage = 'There was an error uploading your images. Please try again.';
      
      if (error instanceof Error) {
        console.error('Error details:', error.message, error.stack);
        errorMessage = error.message || errorMessage;
      }
      
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: errorMessage,
      });
      return [];
    } finally {
      setIsUploading(false);
    }
  };
  
  // Form validation
  const validateForm = () => {
    if (!name) {
      toast({
        variant: 'destructive',
        title: 'Name required',
        description: 'Please enter a product name',
      })
      return false
    }
    
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid price',
        description: 'Please enter a valid price greater than 0',
      })
      return false
    }
    
    if (!categoryId) {
      toast({
        variant: 'destructive',
        title: 'Category required',
        description: 'Please select a category',
      })
      return false
    }
    
    if (images.length === 0 && files.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Images required',
        description: 'Please add at least one product image',
      })
      return false
    }
    
    return true
  }
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    
    try {
      // Upload any pending files
      let allImageUrls = [...images]
      if (files.length > 0) {
        const newImageUrls = await handleImageUpload()
        allImageUrls = [...allImageUrls, ...newImageUrls]
      }
      
      // Prepare form data
      const formData = {
        name,
        description,
        price: Number(price),
        stock: Number(stock),
        categoryId,
        featured,
        images: allImageUrls,
      }
      
      // Create or update product
      const response = await fetch(
        isEditMode ? `/api/admin/products/${productId}` : '/api/admin/products',
        {
          method: isEditMode ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      )
      
      if (!response.ok) {
        throw new Error(`Failed to ${isEditMode ? 'update' : 'create'} product`)
      }
      
      toast({
        title: `Product ${isEditMode ? 'updated' : 'created'}`,
        description: `${name} has been ${isEditMode ? 'updated' : 'created'} successfully.`,
      })
      
      // Redirect to products page
      router.push('/admin/products')
      router.refresh()
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} product:`, error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to ${isEditMode ? 'update' : 'create'} product. Please try again.`,
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Product' : 'Create New Product'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name*</Label>
                <Input
                  id="name"
                  placeholder="Enter product name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price">Price*</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Category*</Label>
                <Select value={categoryId} onValueChange={setCategoryId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  placeholder="0"
                  min="0"
                  step="1"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter product description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="featured"
                checked={featured}
                onCheckedChange={(checked) => setFeatured(!!checked)}
              />
              <Label htmlFor="featured" className="text-sm font-medium">
                Featured product (will be displayed on homepage)
              </Label>
            </div>
            
            <div className="space-y-2">
              <Label>Product Images*</Label>
              
              {/* Image Preview */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
                  {images.map((imageUrl, index) => (
                    <div key={index} className="relative group aspect-square">
                      <Image
                        src={imageUrl}
                        alt={`Product image ${index + 1}`}
                        width={200}
                        height={200}
                        className="object-cover w-full h-full rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-black bg-opacity-50 rounded-full p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* File Selector */}
              <div className="space-y-2">
                {files.length > 0 && (
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between border rounded-md p-2">
                        <div className="flex items-center space-x-2">
                          <ImagePlus className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm truncate max-w-[200px]">
                            {file.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleImageUpload}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Selected Files
                        </>
                      )}
                    </Button>
                  </div>
                )}
                
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG or WEBP (max 10MB)
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/products')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditMode ? 'Saving...' : 'Creating...'}
              </>
            ) : (
              <>{isEditMode ? 'Save Changes' : 'Create Product'}</>
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
} 