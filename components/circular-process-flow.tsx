import {createClient} from "@/lib/supabase/server"
import Link from "next/link"
import {CheckCircle} from "lucide-react"

interface CircularProcessFlowProps {
    projectId: string
}

const stages = [
    {
        number: 1,
        title: "PARTICIPATORY NEEDS ASSESSMENT AND PROGRAMMING",
        subtitle: "Emphasizes early and continuous engagement with actors to inform spatial decision-making",
        methods: [
            {key: "A", name: "Problem-Tree Analysis"},
            {key: "B", name: "Surveys & Interviews"},
            {key: "C", name: "Focus Group Discussions"},
            {key: "D", name: "Participatory Mapping"},
        ],
        category: "GOAL SETTING",
        position: "top-left",
    },
    {
        number: 2,
        title: "COLLABORATIVE DESIGN AND CO-CREATION WORKSHOPS",
        subtitle: "Redistribute power within the design process by creating conditions for meaningful collaboration",
        methods: [
            {key: "A", name: "Charrettes"},
            {key: "B", name: "Scenario Building Exercises"},
            {key: "C", name: "Model-Making Activities"},
        ],
        category: "PROGRAMMING",
        position: "top-right",
    },
    {
        number: 3,
        title: "ITERATIVE FEEDBACK LOOPS AND SYSTEMATIC DOCUMENTATION",
        subtitle: "Recording community inputs, design decisions, and subsequent revisions, and clearly communicating how participant contributions influence the evolving project",
        methods: [
            {key: "A", name: "Public Exhibition"},
        ],
        category: "PROGRAMMING",
        position: "right",
    },
    {
        number: 4,
        title: "DIGITAL PARTICIPATORY PLATFORMS",
        subtitle: "Creates continuous and flexible engagement across time and space",
        methods: [
            {key: "A", name: "Web-based Portals"},
            {key: "B", name: "Interactive Mapping Tools"},
            {key: "C", name: "Online Forums"},
            {key: "D", name: "Mobile Applications"},
            {key: "E", name: "Immersive/Virtual Reality-Based Workshops"},
        ],
        category: "CO-PRODUCTION",
        position: "bottom-right",
    },
    {
        number: 5,
        title: "ASSEMBLY, PRODUCTION AND CONSTRUCTION",
        subtitle: "Detail Design",
        methods: [],
        category: "CO-PRODUCTION",
        position: "bottom-left",
    },
    {
        number: 6,
        title: "CONSUMPTION AND IMPLEMENTATION",
        subtitle: "Utility-Latest",
        methods: [],
        category: "IMPLEMENTATION",
        position: "left",
    },
]

export async function CircularProcessFlow({projectId}: CircularProcessFlowProps) {
    const supabase = await createClient()

    // Fetch checklist items to determine completion status per lifecycle stage
    const {data: checklistItems} = await supabase
        .from("checklist_items")
        .select(`
            id,
            stage_number,
            is_completed,
            item_details (
                id
            )
        `)
        .eq("project_id", projectId)

    // Determine which lifecycle stages (1-6) have completed items
    const completedStages = new Set<number>()

    if (checklistItems) {
        // For each of the 6 lifecycle stages
        for (let stageNum = 1; stageNum <= 6; stageNum++) {
            // Check if any items for this stage are completed
            const stageItems = checklistItems.filter(item => {
                // Match by stage_number if it exists, otherwise check all items (backward compatibility)
                return item.stage_number === stageNum || (item.stage_number === null && stageNum === 1)
            })
            
            const hasCompletedItems = stageItems.some(item => 
                item.is_completed || (item.item_details && item.item_details.length > 0)
            )

            if (hasCompletedItems) {
                completedStages.add(stageNum)
            }
        }
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-amber-900 mb-2">INTEGRATED BUILDING PROCESS</h2>
                <p className="text-amber-700 italic">(Turin, Latour)</p>
            </div>

            {/* Process Stages List */}
            <div className="max-w-7xl mx-auto space-y-24">
                {/* First Row: Stages 1-3 */}
                <div className="flex items-center justify-center gap-4">
                    <Link href={`/project/${projectId}/stage/1`} className="block group flex-shrink-0">
                        <div className={`p-4 border-2 rounded-xl transition-all duration-300 cursor-pointer transform hover:scale-[1.02] min-w-[200px] ${
                            completedStages.has(1)
                                ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-400 hover:border-green-500 hover:shadow-lg hover:shadow-green-100/50'
                                : 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-100/50'
                        }`}>
                            <div className="flex items-start gap-3">
                                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-md ${
                                    completedStages.has(1)
                                        ? 'bg-green-600 text-white'
                                        : 'bg-amber-600 text-white'
                                }`}>
                                    {completedStages.has(1) ? <CheckCircle className="w-4 h-4" /> : 1}
                                </div>
                                <div className={`font-semibold leading-tight text-sm ${
                                    completedStages.has(1) ? 'text-green-900' : 'text-amber-900'
                                }`}>
                                    INITIATION &<br/>
                                    <span className={`font-medium text-xs ${
                                        completedStages.has(1) ? 'text-green-700' : 'text-amber-700'
                                    }`}>USER<br/>REQUIREMENTS</span>
                                </div>
                            </div>
                        </div>
                    </Link>

                    <div className="flex-shrink-0 text-amber-600 text-2xl font-bold">→</div>

                    <Link href={`/project/${projectId}/stage/2`} className="block group flex-shrink-0">
                        <div className={`p-4 border-2 rounded-xl transition-all duration-300 cursor-pointer transform hover:scale-[1.02] min-w-[200px] ${
                            completedStages.has(2)
                                ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-400 hover:border-green-500 hover:shadow-lg hover:shadow-green-100/50'
                                : 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-100/50'
                        }`}>
                            <div className="flex items-start gap-3">
                                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-md ${
                                    completedStages.has(2)
                                        ? 'bg-green-600 text-white'
                                        : 'bg-amber-600 text-white'
                                }`}>
                                    {completedStages.has(2) ? <CheckCircle className="w-4 h-4" /> : 2}
                                </div>
                                <div className={`font-semibold leading-tight text-sm ${
                                    completedStages.has(2) ? 'text-green-900' : 'text-amber-900'
                                }`}>
                                    BRIEFING AND SITE<br/>
                                    <span className={`font-medium text-xs ${
                                        completedStages.has(2) ? 'text-green-700' : 'text-amber-700'
                                    }`}>SURVEY</span>
                                </div>
                            </div>
                        </div>
                    </Link>

                    <div className="flex-shrink-0 text-amber-600 text-2xl font-bold">→</div>

                    <Link href={`/project/${projectId}/stage/3`} className="block group flex-shrink-0">
                        <div className={`p-4 border-2 rounded-xl transition-all duration-300 cursor-pointer transform hover:scale-[1.02] min-w-[200px] ${
                            completedStages.has(3)
                                ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-400 hover:border-green-500 hover:shadow-lg hover:shadow-green-100/50'
                                : 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-100/50'
                        }`}>
                            <div className="flex items-start gap-3">
                                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-md ${
                                    completedStages.has(3)
                                        ? 'bg-green-600 text-white'
                                        : 'bg-amber-600 text-white'
                                }`}>
                                    {completedStages.has(3) ? <CheckCircle className="w-4 h-4" /> : 3}
                                </div>
                                <div className={`font-semibold leading-tight text-sm ${
                                    completedStages.has(3) ? 'text-green-900' : 'text-amber-900'
                                }`}>
                                    SCHEMATIC AND<br/>
                                    <span className={`font-medium text-xs ${
                                        completedStages.has(3) ? 'text-green-700' : 'text-amber-700'
                                    }`}>PRODUCT DESIGN</span>
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Vertical Arrow: 3 to 4 */}
                <div className="flex justify-end pr-80">
                    <div className="text-amber-600 text-4xl font-bold">↓</div>
                </div>

                {/* Second Row: Stages 6-5-4 */}
                <div className="flex items-center justify-center gap-4">
                    <Link href={`/project/${projectId}/stage/6`} className="block group flex-shrink-0">
                        <div className={`p-4 border-2 rounded-xl transition-all duration-300 cursor-pointer transform hover:scale-[1.02] min-w-[200px] ${
                            completedStages.has(6)
                                ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-400 hover:border-green-500 hover:shadow-lg hover:shadow-green-100/50'
                                : 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-100/50'
                        }`}>
                            <div className="flex items-start gap-3">
                                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-md ${
                                    completedStages.has(6)
                                        ? 'bg-green-600 text-white'
                                        : 'bg-amber-600 text-white'
                                }`}>
                                    {completedStages.has(6) ? <CheckCircle className="w-4 h-4" /> : 6}
                                </div>
                                <div className={`font-semibold leading-tight text-sm ${
                                    completedStages.has(6) ? 'text-green-900' : 'text-amber-900'
                                }`}>
                                    CONSUMPTION AND<br/>
                                    <span className={`font-medium text-xs ${
                                        completedStages.has(6) ? 'text-green-700' : 'text-amber-700'
                                    }`}>IMPLEMENTATION</span>
                                </div>
                            </div>
                        </div>
                    </Link>

                    <div className="flex-shrink-0 text-amber-600 text-2xl font-bold">←</div>

                    <Link href={`/project/${projectId}/stage/5`} className="block group flex-shrink-0">
                        <div className={`p-4 border-2 rounded-xl transition-all duration-300 cursor-pointer transform hover:scale-[1.02] min-w-[200px] ${
                            completedStages.has(5)
                                ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-400 hover:border-green-500 hover:shadow-lg hover:shadow-green-100/50'
                                : 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-100/50'
                        }`}>
                            <div className="flex items-start gap-3">
                                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-md ${
                                    completedStages.has(5)
                                        ? 'bg-green-600 text-white'
                                        : 'bg-amber-600 text-white'
                                }`}>
                                    {completedStages.has(5) ? <CheckCircle className="w-4 h-4" /> : 5}
                                </div>
                                <div className={`font-semibold leading-tight text-sm ${
                                    completedStages.has(5) ? 'text-green-900' : 'text-amber-900'
                                }`}>
                                    ASSEMBLY,<br/>
                                    <span className={`font-medium text-xs ${
                                        completedStages.has(5) ? 'text-green-700' : 'text-amber-700'
                                    }`}>PRODUCTION AND CONSTRUCTION</span>
                                </div>
                            </div>
                        </div>
                    </Link>

                    <div className="flex-shrink-0 text-amber-600 text-2xl font-bold">←</div>

                    <Link href={`/project/${projectId}/stage/4`} className="block group flex-shrink-0">
                        <div className={`p-4 border-2 rounded-xl transition-all duration-300 cursor-pointer transform hover:scale-[1.02] min-w-[200px] ${
                            completedStages.has(4)
                                ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-400 hover:border-green-500 hover:shadow-lg hover:shadow-green-100/50'
                                : 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-100/50'
                        }`}>
                            <div className="flex items-start gap-3">
                                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-md ${
                                    completedStages.has(4)
                                        ? 'bg-green-600 text-white'
                                        : 'bg-amber-600 text-white'
                                }`}>
                                    {completedStages.has(4) ? <CheckCircle className="w-4 h-4" /> : 4}
                                </div>
                                <div className={`font-semibold leading-tight text-sm ${
                                    completedStages.has(4) ? 'text-green-900' : 'text-amber-900'
                                }`}>
                                    PRODUCT INFORMATION<br/>
                                    <span className={`font-medium text-xs ${
                                        completedStages.has(4) ? 'text-green-700' : 'text-amber-700'
                                    }`}>AND WORKING DRAWINGS</span><br/>
                                    <span className={`text-xs italic ${
                                        completedStages.has(4) ? 'text-green-600' : 'text-amber-600'
                                    }`}>(Detail Design)</span>
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    )
}
