import {createClient} from "@/lib/supabase/server"
import {NextRequest, NextResponse} from "next/server"

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; stageId: string; methodId: string }> }
) {
    try {
        const { id, methodId } = await params
        const supabase = await createClient()

        // Toggle completion status for checklist item
        const { data: item, error: fetchError } = await supabase
            .from("checklist_items")
            .select("is_completed")
            .eq("id", methodId)
            .eq("project_id", id)
            .single()

        if (fetchError) {
            throw fetchError
        }

        const { data, error } = await supabase
            .from("checklist_items")
            .update({
                is_completed: !item.is_completed,
                updated_at: new Date().toISOString()
            })
            .eq("id", methodId)
            .eq("project_id", id)
            .select()
            .single()

        if (error) throw error

        return NextResponse.redirect(new URL(`/project/${id}/stage/${await params.then(p => p.stageId)}`, request.url))
    } catch (error) {
        console.error("Error toggling item completion:", error)
        return NextResponse.json(
            { error: "Failed to update item status" },
            { status: 500 }
        )
    }
}