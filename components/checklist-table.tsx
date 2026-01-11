"use client"

import {useState} from "react"
import {Check, Edit, Plus, Trash2, X} from "lucide-react"
import Link from "next/link"
import {useRouter} from "next/navigation"
import {createClient} from "@/lib/supabase/client"
import type {CategoryWithItems} from "@/lib/types"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Textarea} from "@/components/ui/textarea"
import {Label} from "@/components/ui/label"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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

export function ChecklistTable({categorizedItems, projectId}: ChecklistTableProps) {
    const router = useRouter()
    const supabase = createClient()

    // Separate predefined and custom categories
    const predefinedCategoryNames = ['GOAL SETTING', 'PROGRAMMING', 'CO-PRODUCTION', 'IMPLEMENTATION']
    const predefinedCategories = categorizedItems.filter(item =>
        predefinedCategoryNames.includes(item.category.name)
    )
    const customCategories = categorizedItems.filter(item =>
        !predefinedCategoryNames.includes(item.category.name)
    )

    // Get category descriptions
    const getCategoryDescription = (categoryName: string) => {
        const descriptions = {
            'GOAL SETTING': 'Emphasizes early and continuous engagement with actors to inform spatial decision-making',
            'PROGRAMMING': 'Redistribute power within the design process by creating conditions for meaningful collaboration',
            'CO-PRODUCTION': 'Recording community inputs, design decisions, and subsequent revisions, and clearly communicating how participant contributions influence the evolving project',
            'IMPLEMENTATION': 'Creates continuous and flexible engagement across time and space'
        }
        return descriptions[categoryName as keyof typeof descriptions] || ''
    }

    // Toggle completion status
    const handleToggleCompletion = async (itemId: string, currentStatus: boolean) => {
        try {
            const {error} = await supabase
                .from("checklist_items")
                .update({
                    is_completed: !currentStatus,
                    updated_at: new Date().toISOString()
                })
                .eq("id", itemId)

            if (error) throw error

            router.refresh()
        } catch (error) {
            console.error("Error toggling completion:", error)
            alert("Failed to update item status")
        }
    }

    // State for adding new category
    const [newCategoryName, setNewCategoryName] = useState("")
    const [isAddingCategory, setIsAddingCategory] = useState(false)

    // State for adding new items
    const [newItemTitle, setNewItemTitle] = useState("")
    const [newItemDescription, setNewItemDescription] = useState("")
    const [addingItemTo, setAddingItemTo] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // State for editing items
    const [editingItem, setEditingItem] = useState<{
        id: string;
        title: string;
        description: string | null
    } | null>(null)
    const [editItemTitle, setEditItemTitle] = useState("")
    const [editItemDescription, setEditItemDescription] = useState("")

    // Add new category/section
    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return
        setIsSubmitting(true)

        try {
            const maxSortOrder = Math.max(...categorizedItems.map((c) => c.category.sort_order), 0)

            const {error} = await supabase.from("categories").insert({
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
            const {error: deleteItemsError} = await supabase
                .from("checklist_items")
                .delete()
                .eq("category_id", categoryId)
                .eq("project_id", projectId)

            if (deleteItemsError) {
                console.error("Error deleting checklist items:", deleteItemsError)
                throw new Error(`Failed to delete items: ${deleteItemsError.message}`)
            }

            // Check if any other projects use this category
            const {data: otherItems, error: checkError} = await supabase
                .from("checklist_items")
                .select("id")
                .eq("category_id", categoryId)
                .limit(1)

            if (checkError) {
                console.error("Error checking other items:", checkError)
            }

            // Only delete category if no other projects use it
            if (!otherItems || otherItems.length === 0) {
                const {error: deleteCategoryError} = await supabase.from("categories").delete().eq("id", categoryId)

                if (deleteCategoryError) {
                    console.error("Error deleting category:", deleteCategoryError)
                    throw new Error(`Failed to delete category: ${deleteCategoryError.message}`)
                }
            }

            router.refresh()
        } catch (error) {
            console.error("Error deleting category:", error)
            alert(`Failed to delete category: ${error instanceof Error ? error.message : "Unknown error"}`)
        } finally {
            setIsSubmitting(false)
        }
    }

    // Add new checklist item
    const handleAddItem = async () => {
        if (!newItemTitle.trim() || !addingItemTo) return
        setIsSubmitting(true)

        try {
            const {error} = await supabase.from("checklist_items").insert({
                project_id: projectId,
                category_id: addingItemTo,
                item_type: "analog", // default to analog for backward compatibility
                title: newItemTitle.trim(),
                description: newItemDescription.trim() || null,
                is_completed: false,
            })

            if (error) throw error

            setNewItemTitle("")
            setNewItemDescription("")
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
            const {error} = await supabase.from("checklist_items").delete().eq("id", itemId)

            if (error) throw error

            router.refresh()
        } catch (error) {
            console.error("Error deleting item:", error)
            alert("Failed to delete item")
        } finally {
            setIsSubmitting(false)
        }
    }

    // Edit checklist item
    const handleEditItem = async () => {
        if (!editItemTitle.trim() || !editingItem) return
        setIsSubmitting(true)

        try {
            const {error} = await supabase
                .from("checklist_items")
                .update({
                    title: editItemTitle.trim(),
                    description: editItemDescription.trim() || null,
                })
                .eq("id", editingItem.id)

            if (error) throw error

            setEditingItem(null)
            setEditItemTitle("")
            setEditItemDescription("")
            router.refresh()
        } catch (error) {
            console.error("Error editing item:", error)
            alert("Failed to edit item")
        } finally {
            setIsSubmitting(false)
        }
    }



    return (
        <div className="space-y-6">
            {customCategories.map((categoryData) => {
                const allItems = [...categoryData.analogItems, ...categoryData.digitalItems]
                
                return (
                    <div key={categoryData.category.id} className="bg-white border border-amber-200 rounded-lg p-6 shadow-sm">
                        {/* Category Header */}
                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-amber-900 mb-2">
                                {categoryData.category.name}
                            </h3>
                        </div>

                        {/* Sub-items */}
                        <div className="space-y-2">
                            {allItems.map((item, itemIndex) => {
                                const letter = String.fromCharCode(65 + itemIndex)
                                
                                return (
                                    <div key={item.id} className="flex items-start gap-3 group">
                                        <button
                                            onClick={() => handleToggleCompletion(item.id, item.is_completed)}
                                            className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-colors ${
                                                item.is_completed
                                                    ? 'bg-green-600 border-green-600 text-white'
                                                    : 'border-amber-400 text-amber-600 hover:bg-amber-50'
                                            }`}
                                            disabled={isSubmitting}
                                        >
                                            {item.is_completed ? <Check className="w-4 h-4" /> : letter}
                                        </button>
                                        
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-amber-900">
                                                    ({letter}) {item.title}
                                                </span>
                                                {item.item_type && (
                                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                                        item.item_type === 'analog' 
                                                            ? 'bg-blue-100 text-blue-800' 
                                                            : 'bg-purple-100 text-purple-800'
                                                    }`}>
                                                        {item.item_type}
                                                    </span>
                                                )}
                                            </div>
                                            {item.description && (
                                                <p className="text-sm text-amber-600 mt-1">{item.description}</p>
                                            )}
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Dialog
                                                open={editingItem?.id === item.id}
                                                onOpenChange={(open) => {
                                                    if (open) {
                                                        setEditingItem({
                                                            id: item.id,
                                                            title: item.title,
                                                            description: item.description
                                                        })
                                                        setEditItemTitle(item.title)
                                                        setEditItemDescription(item.description || "")
                                                    } else {
                                                        setEditingItem(null)
                                                        setEditItemTitle("")
                                                        setEditItemDescription("")
                                                    }
                                                }}
                                            >
                                                <DialogTrigger asChild>
                                                    <button className="p-1 hover:bg-amber-100 rounded" disabled={isSubmitting}>
                                                        <Edit className="w-4 h-4 text-amber-600"/>
                                                    </button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Edit Item</DialogTitle>
                                                        <DialogDescription>Update the title and description of this item.</DialogDescription>
                                                    </DialogHeader>
                                                    <div className="py-4 space-y-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="edit-title" className="text-amber-900 font-semibold">Title</Label>
                                                            <Input
                                                                id="edit-title"
                                                                placeholder="Enter item title..."
                                                                value={editItemTitle}
                                                                onChange={(e) => setEditItemTitle(e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="edit-description" className="text-amber-900 font-semibold">Description (Optional)</Label>
                                                            <Textarea
                                                                id="edit-description"
                                                                placeholder="Enter item description..."
                                                                value={editItemDescription}
                                                                onChange={(e) => setEditItemDescription(e.target.value)}
                                                                rows={3}
                                                                className="resize-none"
                                                            />
                                                        </div>
                                                    </div>
                                                    <DialogFooter>
                                                        <DialogClose asChild>
                                                            <Button variant="outline">Cancel</Button>
                                                        </DialogClose>
                                                        <Button
                                                            onClick={handleEditItem}
                                                            disabled={isSubmitting || !editItemTitle.trim()}
                                                            className="bg-amber-600 hover:bg-amber-700"
                                                        >
                                                            Save Changes
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>

                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <button className="p-1 hover:bg-red-100 rounded" disabled={isSubmitting}>
                                                        <Trash2 className="w-4 h-4 text-red-600"/>
                                                    </button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete Item</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Are you sure you want to delete "{item.title}"? This action cannot be undone.
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
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Add new item button */}
                        <div className="mt-4 pt-4 border-t border-amber-200">
                            <Dialog open={addingItemTo === categoryData.category.id} onOpenChange={(open) => {
                                setAddingItemTo(open ? categoryData.category.id : null)
                                if (!open) {
                                    setNewItemTitle("")
                                    setNewItemDescription("")
                                }
                            }}>
                                <DialogTrigger asChild>
                                    <button 
                                        className="flex items-center gap-2 text-amber-700 hover:text-amber-900 font-medium text-sm"
                                        disabled={isSubmitting}
                                    >
                                        <Plus className="w-4 h-4"/> Add item to this category
                                    </button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add Item</DialogTitle>
                                        <DialogDescription>Create a new item for {categoryData.category.name}.</DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4 space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="item-title" className="text-amber-900 font-semibold">Title</Label>
                                            <Input
                                                id="item-title"
                                                placeholder="Enter item title..."
                                                value={newItemTitle}
                                                onChange={(e) => setNewItemTitle(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="item-description" className="text-amber-900 font-semibold">Description (Optional)</Label>
                                            <Textarea
                                                id="item-description"
                                                placeholder="Enter item description..."
                                                value={newItemDescription}
                                                onChange={(e) => setNewItemDescription(e.target.value)}
                                                rows={3}
                                                className="resize-none"
                                            />
                                        </div>
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
                        </div>

                        {/* Delete category button for custom categories */}
                        <div className="mt-4 pt-4 border-t border-amber-200">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <button className="flex items-center gap-2 text-red-700 hover:text-red-900 font-medium text-sm">
                                        <Trash2 className="w-4 h-4"/> Delete Category
                                    </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Category</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to delete the "{categoryData.category.name}" category? 
                                            This will also delete all items in this category for this project. This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => handleDeleteCategory(categoryData.category.id)}
                                            className="bg-red-600 hover:bg-red-700"
                                        >
                                            Delete Category
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                )
            })}

            {/* Add New Category Section */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                <Dialog open={isAddingCategory} onOpenChange={setIsAddingCategory}>
                    <DialogTrigger asChild>
                        <button className="flex items-center gap-2 text-amber-700 hover:text-amber-900 font-medium">
                            <Plus className="w-5 h-5"/> Add New Category
                        </button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Category</DialogTitle>
                            <DialogDescription>Create a new custom category for your project.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Input
                                placeholder="Enter category name (e.g., MONITORING)..."
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
                                Add Category
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}
