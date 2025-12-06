import {createClient} from "@/lib/supabase/server"
import {notFound} from "next/navigation"
import Link from "next/link"
import {ItemDetailForm} from "@/components/item-detail-form"

interface PageProps {
    params: Promise<{ id: string; itemId: string }>
}

export default async function ItemDetailPage({params}: PageProps) {
    const {id, itemId} = await params
    const supabase = await createClient()

    const {data: item, error} = await supabase
        .from("checklist_items")
        .select(`
      *,
      category:categories(*)
    `)
        .eq("id", itemId)
        .single()

    if (error || !item) {
        notFound()
    }

    const {data: existingDetails} = await supabase
        .from("item_details")
        .select("*")
        .eq("checklist_item_id", itemId)
        .single()

    // Fetch project for breadcrumb
    const {data: project} = await supabase.from("projects").select("name").eq("id", id).single()

    console.log("[v0] Item loaded:", item.id, item.title)
    console.log("[v0] Existing details:", existingDetails)

    return (
        <div className="min-h-screen bg-amber-50">
            {/* Header */}
            <header className="bg-amber-100 border-b border-amber-200 py-4">
                <div className="container mx-auto px-4">
                    <Link href={`/project/${id}`} className="text-amber-600 hover:text-amber-800 text-sm">
                        ← Back to Checklist
                    </Link>
                    <h1 className="text-2xl font-bold text-amber-900 mt-1">Participation Index Analysis</h1>
                </div>
            </header>

            {/* Breadcrumb */}
            <div className="bg-white border-b border-amber-200 py-3">
                <div className="container mx-auto px-4">
                    <p className="text-amber-700 text-sm">
                        {project?.name} → {item.category?.name}
                    </p>
                </div>
            </div>

            {/* Category Header */}
            <div className="container mx-auto px-4 py-4">
                <div className="bg-amber-200 text-amber-900 px-4 py-3 rounded-t">
                    <h2 className="font-bold text-lg">{item.category?.name}:</h2>
                    <p className="font-semibold text-base mt-1">{item.title}</p>
                    {item.description && (
                        <p className="text-sm mt-2 text-amber-800 whitespace-pre-wrap">{item.description}</p>
                    )}
                </div>
            </div>

            {/* Main Content - Detail Form */}
            <main className="container mx-auto px-4 pb-8">
                <ItemDetailForm item={item} projectId={id} existingDetails={existingDetails || null}/>
            </main>
        </div>
    )
}
