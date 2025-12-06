import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChecklistTable } from "@/components/checklist-table"
import { DeleteProjectButton } from "@/components/delete-project-button"
import { EditProjectButton } from "@/components/edit-project-button"
import { BarChart3 } from "lucide-react"
import type { Category, ChecklistItem, CategoryWithItems } from "@/lib/types"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch project
  const { data: project, error: projectError } = await supabase.from("projects").select("*").eq("id", id).single()

  if (projectError || !project) {
    notFound()
  }

  // Fetch categories
  const { data: categories } = await supabase.from("categories").select("*").order("sort_order")

  // Fetch checklist items with their details
  const { data: checklistItems } = await supabase
    .from("checklist_items")
    .select(`
      *,
      category:categories(*),
      item_details(*)
    `)
    .eq("project_id", id)

  // Organize items by category
  const categorizedItems: CategoryWithItems[] = (categories || []).map((category: Category) => {
    const items = (checklistItems || []).filter((item: ChecklistItem) => item.category_id === category.id)
    return {
      category,
      analogItems: items.filter((item: ChecklistItem) => item.item_type === "analog"),
      digitalItems: items.filter((item: ChecklistItem) => item.item_type === "digital"),
    }
  })

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <header className="bg-linear-to-r from-amber-600 to-amber-700 border-b border-amber-700 py-4 shadow-md">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div>
            <Link href="/" className="text-amber-100 hover:text-white text-sm transition-colors">
              ← Back to Projects
            </Link>
            <h1 className="text-2xl font-bold text-white mt-1">Participation Index Analysis</h1>
            <p className="text-amber-100 text-sm mt-1 max-w-2xl">
              Calculated based on the frequency and intensity of participation activities, weighted according to their
              significance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/project/${id}/analytics`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors shadow-md"
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </Link>
            <EditProjectButton
              projectId={id}
              projectName={project.name}
              projectDescription={project.description}
              projectImage={project.image_url}
            />
            <DeleteProjectButton projectId={id} projectName={project.name} />
          </div>
        </div>
      </header>

      {/* Project Info */}
      <div className="bg-white border-b border-amber-200 py-4 shadow-sm">
        <div className="container mx-auto px-4">
          <p className="text-amber-900">
            <span className="font-semibold">Project:</span> {project.name}
          </p>
          {project.description && (
            <p className="text-amber-700 text-sm mt-1">
              <span className="font-semibold">Description:</span> {project.description}
            </p>
          )}
        </div>
      </div>

      {/* Page 1 Label */}
      <div className="container mx-auto px-4 py-4">
        <div className="inline-block bg-amber-200 text-amber-900 px-3 py-1 text-sm font-semibold rounded">Page 1</div>
      </div>

      {/* Main Content - Checklist Table */}
      <main className="container mx-auto px-4 pb-8">
        <ChecklistTable categorizedItems={categorizedItems} projectId={id} />
      </main>
    </div>
  )
}
