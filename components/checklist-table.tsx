"use client"

import { useState } from "react"
import { Check, Plus, Trash2, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { CategoryWithItems } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ChecklistTableProps {
  categorizedItems: CategoryWithItems[]
  projectId: string
}

export function ChecklistTable({ categorizedItems, projectId }: ChecklistTableProps) {
  const router = useRouter()
  const supabase = createClient()

  // State for adding new category
  const [newCategoryName, setNewCategoryName] = useState("")
  const [isAddingCategory, setIsAddingCategory] = useState(false)

  // State for adding new items
  const [newItemTitle, setNewItemTitle] = useState("")
  const [addingItemTo, setAddingItemTo] = useState<{ categoryId: string; type: "analog" | "digital" } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Add new category/section
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return
    setIsSubmitting(true)

    try {
      const maxSortOrder = Math.max(...categorizedItems.map((c) => c.category.sort_order), 0)

      const { error } = await supabase.from("categories").insert({
        name: newCategoryName.trim().toUpperCase(),
        sort_order: maxSortOrder + 1,
      })

      if (error) {
        console.error("Supabase error adding category:", error)
        throw error
      }

      setNewCategoryName("")
      setIsAddingCategory(false)
      router.refresh()
    } catch (error) {
      console.error("Error adding category:", error)
      alert(`Failed to add category: ${error instanceof Error ? error.message : JSON.stringify(error)}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete category/section
  const handleDeleteCategory = async (categoryId: string) => {
    setIsSubmitting(true)

    try {
      // First delete all checklist items in this category for this project
      await supabase.from("checklist_items").delete().eq("category_id", categoryId).eq("project_id", projectId)

      // Check if any other projects use this category
      const { data: otherItems } = await supabase
        .from("checklist_items")
        .select("id")
        .eq("category_id", categoryId)
        .limit(1)

      // Only delete category if no other projects use it
      if (!otherItems || otherItems.length === 0) {
        await supabase.from("categories").delete().eq("id", categoryId)
      }

      router.refresh()
    } catch (error) {
      console.error("Error deleting category:", error)
      alert("Failed to delete category")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Add new checklist item
  const handleAddItem = async () => {
    if (!newItemTitle.trim() || !addingItemTo) return
    setIsSubmitting(true)

    try {
      const { error } = await supabase.from("checklist_items").insert({
        project_id: projectId,
        category_id: addingItemTo.categoryId,
        item_type: addingItemTo.type,
        title: newItemTitle.trim(),
        is_completed: false,
      })

      if (error) throw error

      setNewItemTitle("")
      setAddingItemTo(null)
      router.refresh()
    } catch (error) {
      console.error("Error adding item:", error)
      alert("Failed to add item")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete checklist item
  const handleDeleteItem = async (itemId: string) => {
    setIsSubmitting(true)

    try {
      // First delete item details if any
      await supabase.from("item_details").delete().eq("checklist_item_id", itemId)

      // Then delete the checklist item
      const { error } = await supabase.from("checklist_items").delete().eq("id", itemId)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("Error deleting item:", error)
      alert("Failed to delete item")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-amber-300 bg-white">
        <thead>
          <tr className="bg-amber-100">
            <th className="border border-amber-300 px-4 py-2 text-left text-amber-900 font-semibold w-16">Category</th>
            <th className="border border-amber-300 px-4 py-2 text-left text-amber-900 font-semibold">ANALOG:</th>
            <th className="border border-amber-300 px-4 py-2 text-left text-amber-900 font-semibold">DIGITAL:</th>
          </tr>
        </thead>
        <tbody>
          {categorizedItems.map((categoryData) => (
            <tr key={categoryData.category.id}>
              {/* Category Label - Vertical */}
              <td className="border border-amber-300 bg-amber-200 p-2 align-top relative group">
                <div
                  className="writing-mode-vertical text-amber-900 font-bold text-sm"
                  style={{
                    writingMode: "vertical-rl",
                    textOrientation: "mixed",
                    transform: "rotate(180deg)",
                    minHeight: "120px",
                  }}
                >
                  {categoryData.category.name}
                </div>
                {/* Delete category button */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      className="absolute top-1 right-1 p-1 bg-red-100 hover:bg-red-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={isSubmitting}
                    >
                      <Trash2 className="w-3 h-3 text-red-600" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Category</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{categoryData.category.name}"? This will remove all items in
                        this category for this project.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteCategory(categoryData.category.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </td>

              {/* Analog Items */}
              <td className="border border-amber-300 p-4 align-top">
                <ul className="space-y-2">
                  {categoryData.analogItems.map((item) => (
                    <li key={item.id} className="flex items-start gap-2 group/item">
                      <Link
                        href={`/project/${projectId}/item/${item.id}`}
                        className="flex items-start gap-2 hover:bg-amber-50 p-1 rounded flex-1"
                      >
                        <div
                          className={`w-5 h-5 border-2 flex-shrink-0 flex items-center justify-center mt-0.5 ${
                            item.is_completed ? "bg-green-500 border-green-500" : "border-amber-400"
                          }`}
                        >
                          {item.is_completed && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span
                          className={`text-sm hover:text-amber-700 ${
                            item.is_completed ? "text-green-700" : "text-amber-800"
                          }`}
                        >
                          {item.title}
                        </span>
                      </Link>
                      {/* Delete item button */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            className="p-1 hover:bg-red-100 rounded opacity-0 group-hover/item:opacity-100 transition-opacity flex-shrink-0"
                            disabled={isSubmitting}
                          >
                            <X className="w-4 h-4 text-red-500" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Item</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{item.title}"? This will also remove any associated data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteItem(item.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </li>
                  ))}
                </ul>
                {/* Add analog item button */}
                <Dialog
                  open={addingItemTo?.categoryId === categoryData.category.id && addingItemTo?.type === "analog"}
                  onOpenChange={(open) => !open && setAddingItemTo(null)}
                >
                  <DialogTrigger asChild>
                    <button
                      onClick={() => setAddingItemTo({ categoryId: categoryData.category.id, type: "analog" })}
                      className="mt-3 flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 hover:bg-amber-50 px-2 py-1 rounded transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Add analog item
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Analog Item</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <Input
                        placeholder="Enter item title..."
                        value={newItemTitle}
                        onChange={(e) => setNewItemTitle(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                      />
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button
                        onClick={handleAddItem}
                        disabled={isSubmitting || !newItemTitle.trim()}
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        Add Item
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </td>

              {/* Digital Items */}
              <td className="border border-amber-300 p-4 align-top">
                <ul className="space-y-2">
                  {categoryData.digitalItems.map((item) => (
                    <li key={item.id} className="flex items-start gap-2 group/item">
                      <Link
                        href={`/project/${projectId}/item/${item.id}`}
                        className="flex items-start gap-2 hover:bg-amber-50 p-1 rounded flex-1"
                      >
                        <div
                          className={`w-5 h-5 border-2 flex-shrink-0 flex items-center justify-center mt-0.5 ${
                            item.is_completed ? "bg-green-500 border-green-500" : "border-amber-400"
                          }`}
                        >
                          {item.is_completed && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span
                          className={`text-sm hover:text-amber-700 ${
                            item.is_completed ? "text-green-700" : "text-amber-800"
                          }`}
                        >
                          {item.title}
                        </span>
                      </Link>
                      {/* Delete item button */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            className="p-1 hover:bg-red-100 rounded opacity-0 group-hover/item:opacity-100 transition-opacity flex-shrink-0"
                            disabled={isSubmitting}
                          >
                            <X className="w-4 h-4 text-red-500" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Item</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{item.title}"? This will also remove any associated data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteItem(item.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </li>
                  ))}
                </ul>
                {/* Add digital item button */}
                <Dialog
                  open={addingItemTo?.categoryId === categoryData.category.id && addingItemTo?.type === "digital"}
                  onOpenChange={(open) => !open && setAddingItemTo(null)}
                >
                  <DialogTrigger asChild>
                    <button
                      onClick={() => setAddingItemTo({ categoryId: categoryData.category.id, type: "digital" })}
                      className="mt-3 flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 hover:bg-amber-50 px-2 py-1 rounded transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Add digital item
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Digital Item</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <Input
                        placeholder="Enter item title..."
                        value={newItemTitle}
                        onChange={(e) => setNewItemTitle(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                      />
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button
                        onClick={handleAddItem}
                        disabled={isSubmitting || !newItemTitle.trim()}
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        Add Item
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Add New Category/Section Button */}
      <div className="mt-4">
        <Dialog open={isAddingCategory} onOpenChange={setIsAddingCategory}>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50 bg-transparent">
              <Plus className="w-4 h-4 mr-2" /> Add New Section
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Section/Category</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="Enter section name (e.g., MONITORING)..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                onClick={handleAddCategory}
                disabled={isSubmitting || !newCategoryName.trim()}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Add Section
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Formula Reference */}
      <div className="mt-6 p-4 bg-white border border-amber-300 rounded">
        <h3 className="font-semibold text-amber-900 mb-2">Participation Index Formula:</h3>
        <div className="text-sm text-amber-800 font-mono bg-amber-50 p-3 rounded">
          PI = [ (fvh x 1) + (fh x 0.8) + (fn x 0.6) + (fl x 0.4) + (fvl x 0.2) ] / N
        </div>
        <p className="text-xs text-amber-600 mt-2">
          Where: fvh = Very High, fh = High, fn = Normal, fl = Low, fvl = Very Low participation frequencies, N = Total
          participation
        </p>
      </div>
    </div>
  )
}
