import {createClient} from "@/lib/supabase/server"
import {notFound} from "next/navigation"
import Link from "next/link"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Textarea} from "@/components/ui/textarea"
import {ArrowLeft, CheckCircle, Save} from "lucide-react"

interface PageProps {
    params: Promise<{ id: string; stageId: string }>
}

// Lifecycle stages (6 stages)
const lifecycleStages = [
    { id: 1, name: "INITIATION & USER REQUIREMENTS" },
    { id: 2, name: "BRIEFING AND SITE SURVEY" },
    { id: 3, name: "SCHEMATIC AND PRODUCT DESIGN" },
    { id: 4, name: "PRODUCT INFORMATION AND WORKING DRAWINGS (Detail Design)" },
    { id: 5, name: "ASSEMBLY, PRODUCTION AND CONSTRUCTION" },
    { id: 6, name: "CONSUMPTION AND IMPLEMENTATION" },
]

// Participation categories (4 categories - same for ALL stages)
const categories = [
    {
        number: 1,
        title: "PARTICIPATORY NEEDS ASSESSMENT AND PROGRAMMING",
        subtitle: "Emphasizes early and continuous engagement with actors to inform spatial decision-making",
        references: "Arnstein, S. R.; Chambers, R.; Groat, L., & Wang, D.; Krueger, R. A., & Casey, M. A.; Kvale, S., & Brinkmann, S.; Sanoff, H.",
        methods: [
            {key: "A", name: "Problem-Tree Analysis"},
            {key: "B", name: "Surveys & Interviews"},
            {key: "C", name: "Focus Group Discussions"},
            {key: "D", name: "Participatory Mapping"},
        ],
    },
    {
        number: 2,
        title: "COLLABORATIVE DESIGN AND CO-CREATION WORKSHOPS",
        subtitle: "Redistribute power within the design process by creating conditions for meaningful participation",
        references: "Hester, R. T.; Innes, J. E., & Booher, D. E.; Lennterz, B., & Lutzenhiser, A.; Sanders, E. B.-N, & Stappers, P. J.; Sanoff, H.; Till, J.",
        methods: [
            {key: "A", name: "Charrettes"},
            {key: "B", name: "Scenario-Building Exercises"},
            {key: "C", name: "Model-Making Activities"},
        ],
    },
    {
        number: 3,
        title: "ITERATIVE FEEDBACK LOOPS AND SYSTEMATIC DOCUMENTATION",
        subtitle: "Recording community inputs, design decisions, and subsequent revisions, and clearly communicating how participant contributions influence the evolving project",
        references: "Arnstein, S. R.; Callon, M.; Latour, B.; Sanoff, H.",
        methods: [
            {key: "A", name: "Public Exhibition"},
        ],
    },
    {
        number: 4,
        title: "DIGITAL PARTICIPATORY PLATFORMS",
        subtitle: "Creates continuous and flexible engagement across time and space",
        references: "Atzmanstorfer, K., et al.; Batty, M., et al.; Innes, J. E., & Booher, D. E.; Sanders, E. B.-N, & Stappers, P. J.",
        methods: [
            {key: "A", name: "Web-based Portals"},
            {key: "B", name: "Interactive Mapping Tools"},
            {key: "C", name: "Online Forums"},
            {key: "D", name: "Mobile Applications"},
            {key: "E", name: "Immersive Virtual Reality-Based Workshops"},
        ],
    },
]

export default async function StagePage({params}: PageProps) {
    const {id, stageId} = await params
    const supabase = await createClient()

    // Fetch project
    const {data: project, error: projectError} = await supabase.from("projects").select("*").eq("id", id).single()

    if (projectError || !project) {
        notFound()
    }

    // Get the selected lifecycle stage
    const selectedLifecycleStage = lifecycleStages.find(s => s.id === parseInt(stageId))
    if (!selectedLifecycleStage) {
        notFound()
    }

    // Fetch categories from database to get their UUIDs
    const {data: dbCategories} = await supabase
        .from("categories")
        .select("*")
        .order("sort_order")

    // Create a mapping of category names to their database IDs
    const categoryNameToId: Record<string, string> = {}
    const categoryNames = ['GOAL SETTING', 'PROGRAMMING', 'PROGRAMMING', 'CO-PRODUCTION']
    dbCategories?.forEach(cat => {
        categoryNameToId[cat.name] = cat.id
    })

    // Map our frontend categories to database category IDs
    const categoryIdMap: Record<number, string> = {
        1: categoryNameToId['GOAL SETTING'],
        2: categoryNameToId['PROGRAMMING'],
        3: categoryNameToId['PROGRAMMING'],
        4: categoryNameToId['CO-PRODUCTION']
    }

    // Fetch completion status and form data for all items in this project
    const {data: allItems, error: itemsError} = await supabase
        .from("checklist_items")
        .select(`
            id,
            category_id,
            title,
            is_completed,
            created_at,
            updated_at,
            item_details (
                activity,
                attend_fa,
                consult_fc,
                involve_fi,
                collaborate_fcol,
                empower_femp,
                calculated_pi,
                assumptions,
                data_collected_by,
                collection_date
            )
        `)
        .eq("project_id", id)

    console.log('Query error:', itemsError)
    console.log('Raw items:', allItems)

    // Consider an item completed if is_completed is true OR it has item_details
    const completedItems = allItems?.filter(item => 
        item.is_completed || (item.item_details && item.item_details.length > 0)
    ) || []

    // Debug logging
    console.log('=== DEBUG INFO ===')
    console.log('Stage ID:', stageId)
    console.log('All items count:', allItems?.length)
    console.log('Completed items count:', completedItems?.length)
    console.log('Category ID Map:', categoryIdMap)
    console.log('Completed items details:', JSON.stringify(completedItems, null, 2))

    const completedMethods = completedItems?.reduce((acc, item) => {
        if (!acc[item.stage_number]) acc[item.stage_number] = new Set()
        acc[item.stage_number].add(item.method_key)
        return acc
    }, {} as Record<number, Set<string>>) || {}

    // Group completed items by stage and method for display
    const completedFormItems = completedItems?.reduce((acc, item) => {
        if (!acc[item.stage_number]) acc[item.stage_number] = {}
        if (!acc[item.stage_number][item.method_key]) acc[item.stage_number][item.method_key] = []
        acc[item.stage_number][item.method_key].push(item)
        return acc
    }, {} as Record<number, Record<string, any[]>>) || {}

    // Show the complete hierarchical checklist for all stages
    return (
        <div className="min-h-screen bg-amber-50">
            {/* Header */}
            <header className="bg-linear-to-r from-amber-600 to-amber-700 border-b border-amber-700 py-4 shadow-md">
                <div className="container mx-auto px-4 flex items-center justify-between">
                    <div>
                        <Link href={`/project/${id}`} className="text-amber-100 hover:text-white text-sm transition-colors">
                            ← Back to Project
                        </Link>
                        <h1 className="text-2xl font-bold text-white mt-1">Participation Index Analysis</h1>
                        <p className="text-amber-100 text-sm mt-1 max-w-2xl">
                            Stage {stageId}: {selectedLifecycleStage.name}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href={`/project/${id}/checklist`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors shadow-md"
                        >
                            Detailed Checklist
                        </Link>
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

            {/* Stage Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <Card className="mb-6">
                        <CardHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 bg-amber-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                                    {stageId}
                                </div>
                                <div>
                                    <CardTitle className="text-2xl text-amber-900">
                                        {selectedLifecycleStage.name}
                                    </CardTitle>
                                    <p className="text-amber-700 font-medium">Complete participation methods for this stage</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Actor Involvement Methods - References Section */}
                            <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-300 rounded-lg">
                                <h3 className="text-2xl font-bold text-amber-900 mb-3">ACTOR INVOLVEMENT METHODS</h3>
                                <p className="text-sm text-amber-800 italic leading-relaxed">
                                    Arnstein, S. R.; Atzmanstorfer, K., et al.; Batty, M., et al.; Callon, M.; Chambers, R.; Groat, L., & Wang, D.; Hester, R. T.; Innes, J. E., & Booher, D. E.; Krueger, R. A., & Casey, M. A.; Kvale, S., & Brinkmann, S.; Latour, B.; Lennterz, B., & Lutzenhiser, A.; Sanders, E. B.-N, & Stappers, P. J.; Sanoff, H.; Till, J.
                                </p>
                            </div>

                            <div className="space-y-6">
                                {/* Loop through ALL 4 categories for this lifecycle stage */}
                                {categories.map((category) => {
                                    // Filter completed items for this category using the database category ID
                                    const categoryDbId = categoryIdMap[category.number]
                                    const categoryCompletedItems = completedItems?.filter(item => {
                                        // Match by category_id
                                        const categoryMatches = item.category_id === categoryDbId
                                        
                                        // Check if title matches this category's methods (backward compatibility)
                                        const titleMatches = category.methods.some(m => 
                                            item.title?.includes(`(${m.key})`)
                                        )
                                        
                                        return categoryMatches || titleMatches
                                    }) || []

                                    return (
                                        <div key={category.number} className="bg-white border border-amber-200 rounded-lg p-6 shadow-sm">
                                            <div className="mb-4">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-xl font-bold text-amber-900">
                                                        {category.number}. {category.title}
                                                    </h3>
                                                    {categoryCompletedItems.length > 0 && (
                                                        <div className="flex items-center gap-2 text-green-600">
                                                            <CheckCircle className="w-5 h-5" />
                                                            <span className="text-sm font-semibold">
                                                                {categoryCompletedItems.length} completed
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-amber-700 text-sm mt-1">
                                                    ({category.subtitle})
                                                </p>
                                            </div>
                                            {category.methods.length > 0 && (
                                                <div className="space-y-2">
                                                    {category.methods.map((method) => {
                                                        // Check if this method is completed by checking method_key OR title
                                                        const isCompleted = categoryCompletedItems.some(item => 
                                                            item.method_key === method.key || 
                                                            item.title?.includes(`(${method.key})`)
                                                        ) || false
                                                        
                                                        return (
                                                            <div key={method.key} className="flex items-start gap-3">
                                                                <Link href={`/project/${id}/method/${stageId}/${category.number}/${method.key}`}>
                                                                    <button
                                                                        className={`flex-shrink-0 w-8 h-8 rounded-full border-2 text-sm font-bold transition-colors flex items-center justify-center ${
                                                                            isCompleted
                                                                                ? 'border-green-500 bg-green-50 text-green-700 hover:border-green-600'
                                                                                : 'border-amber-400 text-amber-600 hover:bg-amber-50 hover:border-amber-600'
                                                                        }`}
                                                                    >
                                                                        {method.key}
                                                                    </button>
                                                                </Link>
                                                                <div className="flex-1 flex items-center gap-2">
                                                                    <span className={`font-medium ${isCompleted ? 'text-green-900' : 'text-amber-900'}`}>
                                                                        ({method.key}) {method.name}
                                                                    </span>
                                                                    {isCompleted && (
                                                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}

                                            {categoryCompletedItems.length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-amber-200">
                                                    <h4 className="text-sm font-semibold text-green-800 mb-3">Completed Methods:</h4>
                                                    <div className="space-y-3">
                                                        {categoryCompletedItems.map((item, index) => {
                                                            // Find the method details from the category
                                                            const methodDetail = category.methods.find(m => m.key === item.method_key)
                                                            const methodName = methodDetail?.name || 'Unknown Method'
                                                            
                                                            return (
                                                                <div key={index} className="bg-green-50 border border-green-200 rounded-md p-3">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">
                                                                                {item.method_key}
                                                                            </div>
                                                                            <span className="text-sm font-medium text-green-800">
                                                                                ({item.method_key}) {methodName}
                                                                            </span>
                                                                        </div>
                                                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                                                    </div>
                                                                <div className="space-y-2">
                                                                    <div className="text-xs text-green-700 bg-white rounded p-2 border">
                                                                        <div className="flex justify-between items-start">
                                                                            <div className="flex-1">
                                                                                {item.item_details && item.item_details.length > 0 ? (
                                                                                    <div className="space-y-1">
                                                                                        {(() => {
                                                                                            const details = item.item_details[0]
                                                                                            const displayFields = [
                                                                                                { key: 'activity', label: 'Activity' },
                                                                                                { key: 'attend_fa', label: 'Attend (FA)' },
                                                                                                { key: 'consult_fc', label: 'Consult (FC)' },
                                                                                                { key: 'involve_fi', label: 'Involve (FI)' },
                                                                                                { key: 'collaborate_fcol', label: 'Collaborate (FCOL)' },
                                                                                                { key: 'empower_femp', label: 'Empower (FEMP)' },
                                                                                                { key: 'calculated_pi', label: 'Participation Index (PI)' },
                                                                                                { key: 'assumptions', label: 'Assumptions' },
                                                                                                { key: 'data_collected_by', label: 'Data Collected By' },
                                                                                                { key: 'collection_date', label: 'Collection Date' }
                                                                                            ]

                                                                                            return displayFields
                                                                                                .filter(field => details[field.key] !== null && details[field.key] !== undefined && details[field.key] !== '')
                                                                                                .map(field => (
                                                                                                    <div key={field.key}>
                                                                                                        <span className="font-medium capitalize">{field.label}:</span>{' '}
                                                                                                        <span>{String(details[field.key])}</span>
                                                                                                    </div>
                                                                                                ))
                                                                                        })()}
                                                                                    </div>
                                                                                ) : (
                                                                                    <span>Form data available</span>
                                                                                )}
                                                                            </div>
                                                                            <span className="text-green-500 text-xs ml-2">
                                                                                {new Date(item.updated_at).toLocaleDateString()}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )})}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>


                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}