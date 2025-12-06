"use client"

import {useState} from "react"
import {useRouter} from "next/navigation"
import {Trash2} from "lucide-react"
import {Button} from "@/components/ui/button"
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
import {createClient} from "@/lib/supabase/client"

interface DeleteProjectButtonProps {
    projectId: string
    projectName: string
}

export function DeleteProjectButton({projectId, projectName}: DeleteProjectButtonProps) {
    const router = useRouter()
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
        setIsDeleting(true)
        const supabase = createClient()

        try {
            // Delete project (cascade will handle checklist_items and item_details)
            const {error} = await supabase.from("projects").delete().eq("id", projectId)

            if (error) {
                console.error("Error deleting project:", error)
                alert(`Failed to delete project: ${error.message}`)
                return
            }

            // Redirect to projects list
            router.push("/")
            router.refresh()
        } catch (error) {
            console.error("Error deleting project:", error)
            alert("Failed to delete project")
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4"/>
                    Delete Project
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Project</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete <strong>{projectName}</strong>? This will permanently delete the
                        project and
                        all its checklist items and details. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting}
                                       className="bg-red-600 hover:bg-red-700">
                        {isDeleting ? "Deleting..." : "Delete Project"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
