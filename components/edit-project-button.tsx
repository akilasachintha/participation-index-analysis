"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Edit, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"

interface EditProjectButtonProps {
  projectId: string
  projectName: string
  projectDescription: string | null
  projectImage: string | null
}

export function EditProjectButton({
  projectId,
  projectName,
  projectDescription,
  projectImage,
}: EditProjectButtonProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState(projectName)
  const [description, setDescription] = useState(projectDescription || "")
  const [newImage, setNewImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(projectImage)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB")
        return
      }
      setNewImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setNewImage(null)
    setImagePreview(null)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError("Project name is required")
      return
    }

    setIsUpdating(true)
    setError(null)
    const supabase = createClient()

    try {
      let imageUrl = projectImage

      // If new image was selected, use the base64 preview
      if (newImage) {
        imageUrl = imagePreview
      }

      const { error: updateError } = await supabase
        .from("projects")
        .update({
          name: name.trim(),
          description: description.trim() || null,
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId)

      if (updateError) {
        console.error("Error updating project:", updateError)
        throw new Error(`Failed to update project: ${updateError.message}`)
      }

      setIsOpen(false)
      router.refresh()
    } catch (err) {
      console.error("Error updating project:", err)
      setError(err instanceof Error ? err.message : "Failed to update project")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2 border-amber-300 text-amber-700">
          <Edit className="w-4 h-4" />
          Edit Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>Update your project details and image</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleUpdate} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="edit-project-name">Project Name</Label>
            <Input
              id="edit-project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter project description"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-project-image">Project Image (Optional)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Project preview" className="w-full h-40 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label htmlFor="edit-project-image" className="flex flex-col items-center justify-center cursor-pointer py-4">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">Click to upload project image</span>
                  <span className="text-xs text-gray-500 mt-1">Max size: 5MB</span>
                  <input
                    id="edit-project-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
          {error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsOpen(false)
                setName(projectName)
                setDescription(projectDescription || "")
                setImagePreview(projectImage)
                setNewImage(null)
                setError(null)
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating} className="flex-1 bg-amber-600 hover:bg-amber-700">
              {isUpdating ? "Updating..." : "Update Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
