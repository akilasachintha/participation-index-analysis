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

    // State for adding new category
    const [newCategoryName, setNewCategoryName] = useState("")
    const [isAddingCategory, setIsAddingCategory] = useState(false)

    // State for adding new items
    const [newItemTitle, setNewItemTitle] = useState("")
    const [newItemDescription, setNewItemDescription] = useState("")
    const [addingItemTo, setAddingItemTo] = useState<{ categoryId: string; type: "analog" | "digital" } | null>(null)
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
                category_id: addingItemTo.categoryId,
                item_type: addingItemTo.type,
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

    const renderCategoryRow = (categoryData: CategoryWithItems, showDeleteButton: boolean = false) => (
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
                {/* Delete category button - only for custom categories */}
                {showDeleteButton && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <button
                                className="absolute top-1 right-1 p-1 bg-red-100 hover:bg-red-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                disabled={isSubmitting}
                            >
                                <Trash2 className="w-3 h-3 text-red-600"/>
                            </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete Category</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to delete "{categoryData.category.name}"? This will remove all
                                    items in
                                    this category for this project.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={(e) => {
                                        e.preventDefault()
                                        handleDeleteCategory(categoryData.category.id)
                                    }}
                                    disabled={isSubmitting}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    {isSubmitting ? "Deleting..." : "Delete"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
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
                                    className={`w-5 h-5 border-2 shrink-0 flex items-center justify-center mt-0.5 ${
                                        item.is_completed ? "bg-green-500 border-green-500" : "border-amber-400"
                                    }`}
                                >
                                    {item.is_completed && <Check className="w-3 h-3 text-white"/>}
                                </div>
                                <span
                                    className={`text-sm hover:text-amber-700 ${
                                        item.is_completed ? "text-green-700" : "text-amber-800"
                                    }`}
                                >
                          {item.title}
                        </span>
                            </Link>
                            <div
                                className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0">
                                {/* Edit item button */}
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
                                        <button
                                            className="p-1 hover:bg-amber-100 rounded"
                                            disabled={isSubmitting}
                                        >
                                            <Edit className="w-4 h-4 text-amber-600"/>
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Edit Item</DialogTitle>
                                            <DialogDescription>Update the title and description of this
                                                item.</DialogDescription>
                                        </DialogHeader>
                                        <div className="py-4 space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-analog-title"
                                                       className="text-amber-900 font-semibold">Title</Label>
                                                <Input
                                                    id="edit-analog-title"
                                                    placeholder="Enter item title..."
                                                    value={editItemTitle}
                                                    onChange={(e) => setEditItemTitle(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-analog-description"
                                                       className="text-amber-900 font-semibold">Description
                                                    (Optional)</Label>
                                                <Textarea
                                                    id="edit-analog-description"
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
                                {/* Delete item button */}
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <button
                                            className="p-1 hover:bg-red-100 rounded"
                                            disabled={isSubmitting}
                                        >
                                            <X className="w-4 h-4 text-red-500"/>
                                        </button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Item</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to delete "{item.title}"? This will also remove
                                                any associated data.
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
                            onClick={() => setAddingItemTo({categoryId: categoryData.category.id, type: "analog"})}
                            className="mt-3 flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 hover:bg-amber-50 px-2 py-1 rounded transition-colors"
                        >
                            <Plus className="w-3 h-3"/> Add analog item
                        </button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Analog Item</DialogTitle>
                            <DialogDescription>Create a new analog method item for this category.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="analog-title" className="text-amber-900 font-semibold">Title</Label>
                                <Input
                                    id="analog-title"
                                    placeholder="Enter item title..."
                                    value={newItemTitle}
                                    onChange={(e) => setNewItemTitle(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="analog-description" className="text-amber-900 font-semibold">Description
                                    (Optional)</Label>
                                <Textarea
                                    id="analog-description"
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
                                    className={`w-5 h-5 border-2 shrink-0 flex items-center justify-center mt-0.5 ${
                                        item.is_completed ? "bg-green-500 border-green-500" : "border-amber-400"
                                    }`}
                                >
                                    {item.is_completed && <Check className="w-3 h-3 text-white"/>}
                                </div>
                                <span
                                    className={`text-sm hover:text-amber-700 ${
                                        item.is_completed ? "text-green-700" : "text-amber-800"
                                    }`}
                                >
                          {item.title}
                        </span>
                            </Link>
                            <div
                                className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0">
                                {/* Edit item button */}
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
                                        <button
                                            className="p-1 hover:bg-amber-100 rounded"
                                            disabled={isSubmitting}
                                        >
                                            <Edit className="w-4 h-4 text-amber-600"/>
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Edit Item</DialogTitle>
                                            <DialogDescription>Update the title and description of this
                                                item.</DialogDescription>
                                        </DialogHeader>
                                        <div className="py-4 space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-digital-title"
                                                       className="text-amber-900 font-semibold">Title</Label>
                                                <Input
                                                    id="edit-digital-title"
                                                    placeholder="Enter item title..."
                                                    value={editItemTitle}
                                                    onChange={(e) => setEditItemTitle(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-digital-description"
                                                       className="text-amber-900 font-semibold">Description
                                                    (Optional)</Label>
                                                <Textarea
                                                    id="edit-digital-description"
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
                                {/* Delete item button */}
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <button
                                            className="p-1 hover:bg-red-100 rounded"
                                            disabled={isSubmitting}
                                        >
                                            <X className="w-4 h-4 text-red-500"/>
                                        </button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Item</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to delete "{item.title}"? This will also remove
                                                any associated data.
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
                            onClick={() => setAddingItemTo({categoryId: categoryData.category.id, type: "digital"})}
                            className="mt-3 flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 hover:bg-amber-50 px-2 py-1 rounded transition-colors"
                        >
                            <Plus className="w-3 h-3"/> Add digital item
                        </button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Digital Item</DialogTitle>
                            <DialogDescription>Create a new digital method item for this category.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="digital-title" className="text-amber-900 font-semibold">Title</Label>
                                <Input
                                    id="digital-title"
                                    placeholder="Enter item title..."
                                    value={newItemTitle}
                                    onChange={(e) => setNewItemTitle(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="digital-description" className="text-amber-900 font-semibold">Description
                                    (Optional)</Label>
                                <Textarea
                                    id="digital-description"
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
            </td>
        </tr>
    )

    return (
        <div className="overflow-x-auto space-y-6">
            {/* Predefined Categories Table */}
            <div>
                <h2 className="text-lg font-semibold text-amber-900 mb-2">Standard Categories</h2>
                <table className="w-full border-collapse border border-amber-300 bg-white">
                    <thead>
                    <tr className="bg-amber-100">
                        <th className="border border-amber-300 px-4 py-2 text-left text-amber-900 font-semibold w-16">Category</th>
                        <th className="border border-amber-300 px-4 py-2 text-left text-amber-900 font-semibold">
                            <div>Analog Methods</div>
                            <div className="text-xs font-normal text-amber-700">(Sanoff, 2000)</div>
                        </th>
                        <th className="border border-amber-300 px-4 py-2 text-left text-amber-900 font-semibold">
                            <div>Digital Methods</div>
                            <div className="text-xs font-normal text-amber-700">(Atzmanstorfer et al., 2025)</div>
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    {predefinedCategories.map((categoryData) => renderCategoryRow(categoryData, false))}
                    </tbody>
                </table>
            </div>

            {/* Custom Categories Table - Always show with add button */}
            <div>
                <h2 className="text-lg font-semibold text-amber-900 mb-2">Custom Categories</h2>
                <table className="w-full border-collapse border border-amber-300 bg-white">
                    {customCategories.length > 0 && (
                        <>
                            <thead>
                            <tr className="bg-amber-100">
                                <th className="border border-amber-300 px-4 py-2 text-left text-amber-900 font-semibold w-16">Category</th>
                                <th className="border border-amber-300 px-4 py-2 text-left text-amber-900 font-semibold">
                                    Analog Methods
                                </th>
                                <th className="border border-amber-300 px-4 py-2 text-left text-amber-900 font-semibold">
                                    Digital Methods
                                </th>
                            </tr>
                            </thead>
                            <tbody>
                            {customCategories.map((categoryData) => renderCategoryRow(categoryData, true))}
                            </tbody>
                        </>
                    )}
                    {/* Add New Category/Section Row */}
                    <tbody>
                    <tr>
                        <td className="border border-amber-300 bg-amber-200 p-2 w-16"></td>
                        <td className="border border-amber-300 p-4" colSpan={2}>
                            <Dialog open={isAddingCategory} onOpenChange={setIsAddingCategory}>
                                <DialogTrigger asChild>
                                    <button
                                        className="flex items-center gap-2 text-amber-700 hover:text-amber-900 font-medium">
                                        <Plus className="w-4 h-4"/> Add New Section
                                    </button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add New Section/Category</DialogTitle>
                                        <DialogDescription>Create a new custom category section for your
                                            project.</DialogDescription>
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
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </div>
    )
}
