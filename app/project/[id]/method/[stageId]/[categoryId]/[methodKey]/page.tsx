import {createClient} from "@/lib/supabase/server"
import {notFound} from "next/navigation"
import Link from "next/link"
import {ItemDetailForm} from "@/components/item-detail-form"

interface PageProps {
    params: Promise<{ id: string; stageId: string; categoryId: string; methodKey: string }>
}

// Method definitions for each category
const methodDefinitions = {
    1: {
        title: "PARTICIPATORY NEEDS ASSESSMENT AND PROGRAMMING",
        subtitle: "Emphasizes early and continuous engagement with actors to inform spatial decision-making",
        methods: {
            A: "Problem-Tree Analysis",
            B: "Surveys & Interviews",
            C: "Focus Group Discussions",
            D: "Participatory Mapping"
        }
    },
    2: {
        title: "COLLABORATIVE DESIGN AND CO-CREATION WORKSHOPS",
        subtitle: "Redistribute power within the design process by creating conditions for meaningful participation",
        methods: {
            A: "Charrettes",
            B: "Scenario-Building Exercises",
            C: "Model-Making Activities"
        }
    },
    3: {
        title: "ITERATIVE FEEDBACK LOOPS AND SYSTEMATIC DOCUMENTATION",
        subtitle: "Recording community inputs, design decisions, and subsequent revisions, and clearly communicating how participant contributions influence the evolving project",
        methods: {
            A: "Public Exhibition"
        }
    },
    4: {
        title: "DIGITAL PARTICIPATORY PLATFORMS",
        subtitle: "Creates continuous and flexible engagement across time and space",
        methods: {
            A: "Web-based Portals",
            B: "Interactive Mapping Tools",
            C: "Online Forums",
            D: "Mobile Applications",
            E: "Immersive Virtual Reality-Based Workshops"
        }
    }
}

export default async function MethodFormPage({params}: PageProps) {
    const {id, stageId, categoryId, methodKey} = await params
    const supabase = await createClient()

    // Fetch project
    const {data: project, error: projectError} = await supabase.from("projects").select("*").eq("id", id).single()

    if (projectError || !project) {
        notFound()
    }

    // Get method definition
    const categoryData = methodDefinitions[categoryId as '1' | '2' | '3' | '4']
    if (!categoryData) {
        notFound()
    }

    const methodName = categoryData.methods[methodKey as keyof typeof categoryData.methods]
    if (!methodName) {
        notFound()
    }

    // Get the actual category from database
    const categoryNames = {
        '1': 'GOAL SETTING',
        '2': 'PROGRAMMING', 
        '3': 'PROGRAMMING',
        '4': 'CO-PRODUCTION'
    }
    const categoryName = categoryNames[categoryId as keyof typeof categoryNames]
    const {data: category} = await supabase
        .from("categories")
        .select("*")
        .eq("name", categoryName)
        .single()

    if (!category) {
        notFound()
    }

    // Check if checklist item already exists for this method in this specific stage
    const methodTitle = `(${methodKey}) ${methodName}`
    let {data: existingItem} = await supabase
        .from("checklist_items")
        .select(`
            *,
            category:categories(*)
        `)
        .eq("project_id", id)
        .eq("category_id", category.id)
        .eq("stage_number", parseInt(stageId))
        .eq("title", methodTitle)
        .single()

    // If item doesn't exist, create it
    if (!existingItem) {
        const {data: newItem, error: insertError} = await supabase
            .from("checklist_items")
            .insert({
                project_id: id,
                category_id: category.id,
                stage_number: parseInt(stageId),
                method_key: methodKey,
                item_type: categoryId === "4" ? "digital" : "analog",
                title: methodTitle,
                description: categoryData.subtitle,
                is_completed: false,
            })
            .select(`
                *,
                category:categories(*)
            `)
            .single()

        if (insertError || !newItem) {
            console.error("Failed to create checklist item:", insertError)
            notFound()
        }
        existingItem = newItem
    }

    // Check if method details already exist
    const {data: existingDetails} = await supabase
        .from("item_details")
        .select("*")
        .eq("checklist_item_id", existingItem.id)
        .single()

    return (
        <div className="min-h-screen bg-amber-50">
            {/* Header */}
            <header className="bg-amber-100 border-b border-amber-200 py-4">
                <div className="container mx-auto px-4">
                    <Link href={`/project/${id}/stage/${stageId}`} className="text-amber-600 hover:text-amber-800 text-sm">
                        ← Back to Stage {stageId}
                    </Link>
                    <h1 className="text-2xl font-bold text-amber-900 mt-1">Participation Index Analysis</h1>
                    <p className="text-amber-700 text-sm">
                        Method: ({methodKey}) {methodName}
                    </p>
                </div>
            </header>

            {/* Breadcrumb */}
            <div className="bg-white border-b border-amber-200 py-3">
                <div className="container mx-auto px-4">
                    <p className="text-amber-700 text-sm">
                        {project?.name} → Stage {stageId} → {categoryData.title}
                    </p>
                </div>
            </div>

            {/* Category Header */}
            <div className="container mx-auto px-4 py-4">
                <div className="bg-amber-200 text-amber-900 px-4 py-3 rounded-t">
                    <h2 className="font-bold text-lg">{categoryData.title}:</h2>
                    <p className="font-semibold text-base mt-1">({methodKey}) {methodName}</p>
                    <p className="text-sm mt-2 text-amber-800">{categoryData.subtitle}</p>
                </div>
            </div>

            {/* Main Content - Detail Form */}
            <main className="container mx-auto px-4 pb-8">
                <ItemDetailForm item={existingItem} projectId={id} existingDetails={existingDetails || null}/>
            </main>
        </div>
    )
}