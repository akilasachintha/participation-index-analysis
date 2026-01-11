"use client"

import {createClient} from "@/lib/supabase/client"
import {useEffect, useState} from "react"
import {notFound} from "next/navigation"
import Link from "next/link"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {ArrowLeft, CheckCircle, BarChart3, PieChart as PieChartIcon, TrendingUp} from "lucide-react"
import {Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid} from "recharts"

interface PageProps {
    params: Promise<{ id: string }>
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
        methods: [
            {key: "A", name: "Public Exhibition"},
        ],
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
            {key: "E", name: "Immersive Virtual Reality-Based Workshops"},
        ],
    },
]

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316']
const CATEGORY_COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6']

export default function AnalyticsPage({params}: PageProps) {
    const [project, setProject] = useState<any>(null)
    const [allItems, setAllItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [id, setId] = useState<string>("")

    useEffect(() => {
        let mounted = true
        let fetching = false
        
        async function loadData() {
            if (fetching || !mounted) return
            fetching = true
            
            try {
                const resolvedParams = await params
                if (!mounted) return
                
                setId(resolvedParams.id)
                const supabase = createClient()

                // Fetch project details
                const {data: projectData, error: projectError} = await supabase
                    .from("projects")
                    .select("*")
                    .eq("id", resolvedParams.id)
                    .single()

                if (!mounted || projectError || !projectData) {
                    console.error('Project fetch error:', projectError)
                    return
                }
                setProject(projectData)

                // Fetch all checklist items for this project with their details
                const {data: itemsData, error: itemsError} = await supabase
                    .from("checklist_items")
                    .select(`
                        id,
                        title,
                        description,
                        item_type,
                        is_completed,
                        stage_number,
                        method_key,
                        category_id,
                        created_at,
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
                    .eq("project_id", resolvedParams.id)

                if (!mounted) return
                
                if (itemsError) {
                    console.error('Items fetch error:', itemsError)
                    setAllItems([])
                    setLoading(false)
                    return
                }
                
                setAllItems(itemsData || [])
                setLoading(false)
                
                // Debug logging
                console.log('=== ANALYTICS DEBUG ===')
                console.log('Total items:', itemsData?.length)
                console.log('Items with details:', itemsData?.filter(item => item.item_details && item.item_details.length > 0).length)
                console.log('Sample items:', itemsData?.slice(0, 3))
                
                // Debug PI values specifically
                const itemsWithPI = itemsData?.filter(item => 
                    item.item_details && 
                    item.item_details.length > 0 && 
                    item.item_details[0].calculated_pi !== null && 
                    item.item_details[0].calculated_pi !== undefined
                )
                console.log('Items with PI values:', itemsWithPI?.length)
                console.log('Sample PI data:', itemsWithPI?.slice(0, 3).map(item => ({
                    stage: item.stage_number,
                    method: item.method_key,
                    pi: item.item_details[0].calculated_pi,
                    piPercent: (item.item_details[0].calculated_pi * 100).toFixed(1)
                })))
            } catch (error) {
                console.error('Load data error:', error)
                if (mounted) {
                    setLoading(false)
                }
            }
        }

        loadData()
        
        return () => {
            mounted = false
        }
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center">
                <div className="text-amber-900 text-xl">Loading analytics...</div>
            </div>
        )
    }

    if (!project) {
        return notFound()
    }

    // Calculate analytics data
    const stageAnalytics = lifecycleStages.map(stage => {
        const stageItems = allItems.filter(item => item.stage_number === stage.id)
        const completed = stageItems.filter(item => 
            item.is_completed || (item.item_details && item.item_details.length > 0)
        ).length
        
        return {
            name: `Stage ${stage.id}`,
            fullName: stage.name,
            total: stageItems.length,
            completed,
            pending: stageItems.length - completed,
            completionRate: stageItems.length > 0 ? Math.round((completed / stageItems.length) * 100) : 0
        }
    })

    const categoryAnalytics = categories.map((category, index) => {
        const categoryItems = allItems.filter(item => 
            category.methods.some(m => m.key === item.method_key)
        )
        const completed = categoryItems.filter(item => 
            item.is_completed || (item.item_details && item.item_details.length > 0)
        ).length
        
        return {
            name: category.title.split(' ').slice(0, 3).join(' ') + '...',
            fullName: category.title,
            total: categoryItems.length,
            completed,
            pending: categoryItems.length - completed,
            completionRate: categoryItems.length > 0 ? Math.round((completed / categoryItems.length) * 100) : 0,
            color: CATEGORY_COLORS[index]
        }
    })

    // Method-wise analytics with PI values
    const methodAnalytics = lifecycleStages.map(stage => {
        const stageItems = allItems.filter(item => item.stage_number === stage.id)
        
        // Create data for ALL 13 methods (across 4 categories)
        const methodsData = categories.flatMap(category => 
            category.methods.map(method => {
                const methodItems = stageItems.filter(item => item.method_key === method.key)
                const completedMethodItems = methodItems.filter(item => 
                    item.is_completed || (item.item_details && item.item_details.length > 0)
                )
                
                // Calculate average PI for this method
                const piValues = completedMethodItems
                    .filter(item => item.item_details && item.item_details.length > 0)
                    .map(item => item.item_details[0]?.calculated_pi)
                    .filter(pi => pi !== null && pi !== undefined)
                
                // Convert PI from 0-1 scale to 0-100% scale
                const avgPI = piValues.length > 0 
                    ? (piValues.reduce((a, b) => a + b, 0) / piValues.length) * 100
                    : 0

                return {
                    methodKey: `${category.number}${method.key}`, // e.g., "1A", "2B"
                    displayKey: method.key,
                    methodName: method.name,
                    categoryName: category.title,
                    categoryNumber: category.number,
                    total: methodItems.length,
                    completed: completedMethodItems.length,
                    avgPI: Math.round(avgPI * 100) / 100, // PI is already 0-100%
                    items: completedMethodItems
                }
            })
        ) // Show all 13 methods for each stage
        
        console.log(`Stage ${stage.id} methods data:`, methodsData.map(m => ({
            key: m.methodKey,
            name: m.methodName,
            completed: m.completed,
            avgPI: m.avgPI
        })))
        
        return {
            stage,
            methods: methodsData,
            totalMethods: 13,
            completedCount: methodsData.filter(m => m.completed > 0).length
        }
    })

    const totalMethods = allItems.length
    const completedMethods = allItems.filter(item => 
        item.is_completed || (item.item_details && item.item_details.length > 0)
    ).length
    const overallCompletion = totalMethods > 0 ? Math.round((completedMethods / totalMethods) * 100) : 0

    const pieData = [
        { name: 'Completed', value: completedMethods, color: '#10b981' },
        { name: 'Pending', value: totalMethods - completedMethods, color: '#d1d5db' }
    ]

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
                            <BarChart3 className="w-8 h-8 inline mr-3"/>
                            Project Analytics
                        </h1>
                        <p className="text-amber-700 text-lg">{project.name}</p>
                        <p className="text-amber-600 text-sm mt-2">
                            6 Lifecycle Stages × 4 Participation Categories
                        </p>
                        {project.description && (
                            <p className="text-amber-600 text-sm mt-2">{project.description}</p>
                        )}
                    </div>
                </div>

                {/* Overall Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="border-2 border-amber-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-amber-700">Overall Completion</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold text-amber-900">{overallCompletion}%</div>
                            <p className="text-sm text-amber-600 mt-1">
                                {completedMethods} of {totalMethods} methods
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-2 border-green-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-green-700">Completed Methods</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold text-green-900">{completedMethods}</div>
                            <p className="text-sm text-green-600 mt-1">
                                <CheckCircle className="w-4 h-4 inline mr-1" />
                                Finished
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-2 border-gray-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-700">Pending Methods</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold text-gray-900">{totalMethods - completedMethods}</div>
                            <p className="text-sm text-gray-600 mt-1">
                                Remaining
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Completion by Lifecycle Stage */}
                    <Card className="border-2 border-amber-200">
                        <CardHeader>
                            <CardTitle className="text-amber-900 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5" />
                                Completion by Lifecycle Stage
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={stageAnalytics}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip 
                                        content={({active, payload}) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload
                                                return (
                                                    <div className="bg-white p-3 border border-amber-300 rounded shadow-lg">
                                                        <p className="font-semibold text-amber-900 mb-1">{data.fullName}</p>
                                                        <p className="text-sm text-green-600">Completed: {data.completed}</p>
                                                        <p className="text-sm text-gray-600">Pending: {data.pending}</p>
                                                        <p className="text-sm text-amber-600 font-semibold mt-1">
                                                            Rate: {data.completionRate}%
                                                        </p>
                                                    </div>
                                                )
                                            }
                                            return null
                                        }}
                                    />
                                    <Legend />
                                    <Bar dataKey="completed" fill="#10b981" name="Completed" />
                                    <Bar dataKey="pending" fill="#d1d5db" name="Pending" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Overall Progress Pie Chart */}
                    <Card className="border-2 border-amber-200">
                        <CardHeader>
                            <CardTitle className="text-amber-900 flex items-center gap-2">
                                <PieChartIcon className="w-5 h-5" />
                                Overall Progress
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {totalMethods === 0 ? (
                                <div className="h-[300px] flex items-center justify-center text-amber-600">
                                    No methods data available yet
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={true}
                                            label={({name, value, percent}) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                                            outerRadius={90}
                                            innerRadius={0}
                                            fill="#8884d8"
                                            dataKey="value"
                                            paddingAngle={2}
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            content={({active, payload}) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0]
                                                    return (
                                                        <div className="bg-white p-3 border border-amber-300 rounded shadow-lg">
                                                            <p className="font-semibold text-amber-900">{data.name}</p>
                                                            <p className="text-sm text-amber-600">Count: {data.value}</p>
                                                            <p className="text-sm text-amber-600">
                                                                {((data.value / totalMethods) * 100).toFixed(1)}%
                                                            </p>
                                                        </div>
                                                    )
                                                }
                                                return null
                                            }}
                                        />
                                        <Legend 
                                            verticalAlign="bottom" 
                                            height={36}
                                            formatter={(value, entry: any) => (
                                                <span className="text-sm font-medium">
                                                    {value}: {entry.payload.value} methods
                                                </span>
                                            )}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    {/* Completion by Category */}
                    <Card className="border-2 border-amber-200 lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-amber-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5" />
                                Completion by Participation Category
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={categoryAnalytics} layout="horizontal">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="name" type="category" width={150} />
                                    <Tooltip 
                                        content={({active, payload}) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload
                                                return (
                                                    <div className="bg-white p-3 border border-amber-300 rounded shadow-lg max-w-sm">
                                                        <p className="font-semibold text-amber-900 mb-1">{data.fullName}</p>
                                                        <p className="text-sm text-green-600">Completed: {data.completed}</p>
                                                        <p className="text-sm text-gray-600">Pending: {data.pending}</p>
                                                        <p className="text-sm text-amber-600 font-semibold mt-1">
                                                            Rate: {data.completionRate}%
                                                        </p>
                                                    </div>
                                                )
                                            }
                                            return null
                                        }}
                                    />
                                    <Legend />
                                    <Bar dataKey="completed" fill="#10b981" name="Completed" />
                                    <Bar dataKey="pending" fill="#d1d5db" name="Pending" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Completion Rate Matrix */}
                <Card className="border-2 border-amber-200">
                    <CardHeader>
                        <CardTitle className="text-amber-900">Completion Rate by Stage</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {stageAnalytics.map((stage, index) => (
                                <div key={index} className="bg-white border border-amber-200 rounded-lg p-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-amber-900 text-sm">{stage.fullName}</h4>
                                        </div>
                                    </div>
                                    <div className="mb-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs text-amber-700">Progress</span>
                                            <span className="text-xs font-bold text-amber-900">{stage.completionRate}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div 
                                                className="bg-gradient-to-r from-amber-500 to-green-500 h-3 rounded-full transition-all"
                                                style={{width: `${stage.completionRate}%`}}
                                            ></div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-xs text-amber-600">
                                        <span>{stage.completed} completed</span>
                                        <span>{stage.pending} pending</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Method-wise Analytics by Stage */}
                <div className="space-y-8">
                    {methodAnalytics.map(({stage, methods, totalMethods, completedCount}, stageIndex) => {
                        return (
                            <Card key={stage.id} className="border-2 border-amber-200">
                                <CardHeader className="bg-amber-50">
                                    <CardTitle className="text-amber-900 flex items-center gap-3">
                                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold">
                                            {stage.id}
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-xl font-bold">{stage.name}</h2>
                                            <p className="text-sm text-amber-700 mt-1">
                                                {completedCount} of {totalMethods} methods completed
                                            </p>
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    {/* All 13 Methods Chart */}
                                    <div className="mb-6">
                                        <h3 className="text-lg font-bold text-amber-900 mb-4">
                                            All Methods - Participation Index Overview
                                        </h3>
                                        <ResponsiveContainer width="100%" height={350}>
                                            <BarChart data={methods}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis 
                                                    dataKey="methodKey" 
                                                    tick={{fontSize: 12}}
                                                    label={{value: 'Methods (Category + Key)', position: 'insideBottom', offset: -5}}
                                                />
                                                <YAxis 
                                                    domain={[0, 100]} 
                                                    label={{value: 'Participation Index (PI %)', angle: -90, position: 'insideLeft'}}
                                                />
                                                <Tooltip 
                                                    content={({active, payload}) => {
                                                        if (active && payload && payload.length) {
                                                            const data = payload[0].payload
                                                            return (
                                                                <div className="bg-white p-3 border border-amber-300 rounded shadow-lg max-w-xs">
                                                                    <p className="font-semibold text-amber-900">{data.methodName}</p>
                                                                    <p className="text-xs text-amber-700 mb-2">{data.categoryName}</p>
                                                                    {data.avgPI > 0 ? (
                                                                        <>
                                                                            <p className="text-sm text-green-600 font-bold">
                                                                                Avg PI: {data.avgPI.toFixed(1)}%
                                                                            </p>
                                                                            <p className="text-sm text-amber-600">
                                                                                Completed: {data.completed}
                                                                            </p>
                                                                        </>
                                                                    ) : (
                                                                        <p className="text-sm text-gray-500 italic">No data yet</p>
                                                                    )}
                                                                </div>
                                                            )
                                                        }
                                                        return null
                                                    }}
                                                />
                                                <Bar dataKey="avgPI" name="Average PI" radius={[8, 8, 0, 0]}>
                                                    {methods.map((entry, index) => (
                                                        <Cell 
                                                            key={`cell-${index}`} 
                                                            fill={
                                                                entry.avgPI === 0 ? '#d1d5db' :
                                                                entry.avgPI >= 60 ? '#10b981' :
                                                                entry.avgPI >= 40 ? '#f59e0b' :
                                                                '#ef4444'
                                                            }
                                                        />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 bg-green-500 rounded"></div>
                                                <span>High PI (≥60%)</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 bg-amber-500 rounded"></div>
                                                <span>Medium PI (40-60%)</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 bg-red-500 rounded"></div>
                                                <span>Low PI (&lt;40%)</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 bg-gray-300 rounded"></div>
                                                <span>No Data</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detailed Table */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="bg-amber-100 border-b-2 border-amber-300">
                                                    <th className="text-left p-3 text-amber-900 font-semibold">Category</th>
                                                    <th className="text-left p-3 text-amber-900 font-semibold">Method</th>
                                                    <th className="text-center p-3 text-amber-900 font-semibold">Status</th>
                                                    <th className="text-center p-3 text-amber-900 font-semibold">Avg PI</th>
                                                    <th className="text-left p-3 text-amber-900 font-semibold">Details</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {methods.map((method, idx) => (
                                                    <tr key={idx} className="border-b border-amber-200 hover:bg-amber-50 transition-colors">
                                                        <td className="p-3">
                                                            <span className="inline-flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                                                     style={{backgroundColor: CATEGORY_COLORS[method.categoryNumber - 1]}}>
                                                                    {method.categoryNumber}
                                                                </div>
                                                                <span className="text-sm text-amber-800 font-medium">
                                                                    Cat {method.categoryNumber}
                                                                </span>
                                                            </span>
                                                        </td>
                                                        <td className="p-3">
                                                            <span className="inline-flex items-center gap-2">
                                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                                                    method.completed > 0 ? 'bg-green-600 text-white' : 'bg-gray-400 text-white'
                                                                }`}>
                                                                    {method.displayKey}
                                                                </div>
                                                                <span className="text-sm text-amber-900 font-medium">{method.methodName}</span>
                                                            </span>
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            {method.completed > 0 ? (
                                                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                                                                    <CheckCircle className="w-4 h-4" />
                                                                    Completed
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-600">
                                                                    Pending
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            {method.avgPI > 0 ? (
                                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                                                                    method.avgPI >= 60 ? 'bg-green-100 text-green-800' :
                                                                    method.avgPI >= 40 ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-red-100 text-red-800'
                                                                }`}>
                                                                    {method.avgPI.toFixed(1)}%
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-400 text-sm">—</span>
                                                            )}
                                                        </td>
                                                        <td className="p-3">
                                                            {method.completed > 0 && method.items.length > 0 ? (
                                                                <details className="text-xs">
                                                                    <summary className="cursor-pointer text-amber-600 hover:text-amber-800 font-medium">
                                                                        View {method.items.length} entry(s)
                                                                    </summary>
                                                                    <div className="mt-2 space-y-2 pl-4">
                                                                        {method.items.map((item, itemIdx) => (
                                                                            <div key={itemIdx} className="bg-green-50 border border-green-200 rounded p-2">
                                                                                {item.item_details && item.item_details.length > 0 && (
                                                                                    <div className="space-y-1">
                                                                                        {item.item_details[0].activity && (
                                                                                            <div>
                                                                                                <span className="font-semibold text-green-800">Activity:</span>{' '}
                                                                                                <span className="text-green-700">{item.item_details[0].activity}</span>
                                                                                            </div>
                                                                                        )}
                                                                                        <div className="grid grid-cols-2 gap-2">
                                                                                            <div>
                                                                                                <span className="font-semibold text-green-800">Attend:</span>{' '}
                                                                                                {item.item_details[0].attend_fa || 0}
                                                                                            </div>
                                                                                            <div>
                                                                                                <span className="font-semibold text-green-800">Consult:</span>{' '}
                                                                                                {item.item_details[0].consult_fc || 0}
                                                                                            </div>
                                                                                            <div>
                                                                                                <span className="font-semibold text-green-800">Involve:</span>{' '}
                                                                                                {item.item_details[0].involve_fi || 0}
                                                                                            </div>
                                                                                            <div>
                                                                                                <span className="font-semibold text-green-800">Collaborate:</span>{' '}
                                                                                                {item.item_details[0].collaborate_fcol || 0}
                                                                                            </div>
                                                                                            <div>
                                                                                                <span className="font-semibold text-green-800">Empower:</span>{' '}
                                                                                                {item.item_details[0].empower_femp || 0}
                                                                                            </div>
                                                                                            <div>
                                                                                                <span className="font-semibold text-green-800">PI:</span>{' '}
                                                                                                <span className="font-bold text-green-900">
                                                                                                    {item.item_details[0].calculated_pi 
                                                                                                        ? (item.item_details[0].calculated_pi * 100).toFixed(1) 
                                                                                                        : 'N/A'}%
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                        {item.item_details[0].data_collected_by && (
                                                                                            <div className="text-xs text-green-600 mt-1">
                                                                                                By: {item.item_details[0].data_collected_by}
                                                                                                {item.item_details[0].collection_date && 
                                                                                                    ` | ${new Date(item.item_details[0].collection_date).toLocaleDateString()}`
                                                                                                }
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </details>
                                                            ) : (
                                                                <span className="text-gray-400 text-sm italic">No data</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
