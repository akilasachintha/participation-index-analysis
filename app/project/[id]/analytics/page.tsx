import {createClient} from "@/lib/supabase/server"
import {notFound} from "next/navigation"
import Link from "next/link"
import {ArrowLeft} from "lucide-react"
import {AnalyticsCharts} from "@/components/analytics-charts"

export default async function AnalyticsPage({
                                                params,
                                            }: {
    params: Promise<{ id: string }>
}) {
    const {id} = await params
    const supabase = await createClient()

    // Fetch project details
    const {data: project, error: projectError} = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single()

    if (projectError || !project) {
        notFound()
    }

    // Fetch all categories
    const {data: categories} = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", {ascending: true})

    // Fetch all checklist items for this project with their details
    const {data: items, error: itemsError} = await supabase
        .from("checklist_items")
        .select(`
      id,
      title,
      description,
      item_type,
      is_completed,
      category_id,
      categories!inner (
        id,
        name,
        sort_order
      )
    `)
        .eq("project_id", id)
        .order("created_at", {ascending: true})

    console.log('Items fetched:', items?.length, items)
    console.log('Items error:', itemsError)

    // Fetch ALL item details from the table to see what exists
    const {data: allItemDetails} = await supabase
        .from("item_details")
        .select("*")

    console.log('ALL item details in database:', allItemDetails?.length, allItemDetails)

    // Fetch item details (PI values) for this project's items
    let itemDetails = null
    if (items && items.length > 0) {
        const itemIds = items.map((item) => item.id)
        console.log('Fetching details for item IDs:', itemIds)

        const {data, error: detailsError} = await supabase
            .from("item_details")
            .select(`
        checklist_item_id,
        attend_fa,
        consult_fc,
        involve_fi,
        collaborate_fcol,
        empower_femp
      `)
            .in("checklist_item_id", itemIds)

        itemDetails = data
        console.log('Item details fetched:', itemDetails?.length, itemDetails)
        console.log('Details error:', detailsError)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href={`/project/${id}`}
                        className="inline-flex items-center gap-2 text-amber-700 hover:text-amber-900 mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4"/>
                        Back to Project
                    </Link>
                    <div className="bg-white rounded-lg shadow-md p-6 border-2 border-amber-200">
                        <h1 className="text-3xl font-bold text-amber-900 mb-2">
                            Project Analytics
                        </h1>
                        <p className="text-amber-700 text-lg">{project.name}</p>
                        {project.description && (
                            <p className="text-amber-600 text-sm mt-2">{project.description}</p>
                        )}
                    </div>
                </div>

                {/* Analytics Charts */}
                <AnalyticsCharts
                    categories={categories || []}
                    items={items || []}
                    itemDetails={itemDetails || []}
                />
            </div>
        </div>
    )
}
