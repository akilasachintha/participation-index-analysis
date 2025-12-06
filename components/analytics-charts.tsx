"use client"

import {useMemo} from "react"
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"

interface Category {
  id: string
  name: string
  sort_order: number
}

interface Item {
  id: string
  title: string
  description: string | null
  item_type: "analog" | "digital"
  is_completed: boolean
  category_id: string
  categories: {
    id: string
    name: string
    sort_order: number
  } | {
    id: string
    name: string
    sort_order: number
  }[]
}

interface ItemDetail {
  checklist_item_id: string
  // Database column names (matching activity types):
  attend_fa: number        // fa = Attend
  consult_fc: number       // fc = Consult
  involve_fi: number       // fi = Work/Involve
  collaborate_fcol: number // fcol = Collaborate
  empower_femp: number     // femp = Empower/Lead
}

interface AnalyticsChartsProps {
  categories: Category[]
  items: Item[]
  itemDetails: ItemDetail[]
}

// Generate brown and yellow color variants based on index
const generateColor = (index: number, total: number) => {
  // Hue range: 30-60 (yellow to orange/brown)
  const hue = 30 + ((index * 30) / Math.max(total, 1))
  const saturation = 60 + (index % 4) * 10 // Vary saturation 60-90%
  const lightness = 40 + (index % 3) * 10 // Vary lightness 40-60%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

export function AnalyticsCharts({ categories, items, itemDetails }: AnalyticsChartsProps) {
  // Calculate PI for each item
  const calculatePI = (detail: ItemDetail) => {
    // Map database columns to activity variables
    const fa = detail.attend_fa || 0        // Attend
    const fc = detail.consult_fc || 0       // Consult
    const fi = detail.involve_fi || 0       // Work/Involve
    const fcol = detail.collaborate_fcol || 0  // Collaborate
    const femp = detail.empower_femp || 0   // Empower/Lead

    const N = fa + fc + fi + fcol + femp
    if (N === 0) return 0

    return ((fa * 0.2) + (fc * 0.4) + (fi * 0.6) + (fcol * 0.8) + (femp)) / N
  }

  // Debug: log the data
  console.log('Categories:', categories)
  console.log('Items:', items)
  console.log('Item Details:', itemDetails)

  // Prepare data for charts
  const chartData = useMemo(() => {
    const itemsWithPI = items
      .map((item) => {
        const detail = itemDetails.find((d) => d.checklist_item_id === item.id)
        return {
          ...item,
          pi: detail ? calculatePI(detail) : 0,
          piPercentage: detail ? calculatePI(detail) * 100 : 0,
          hasDetail: !!detail,
        }
      })
      .filter((item) => item.hasDetail) // Only show items with data

    // Group by category
    const byCategory = categories.map((category) => {
      const categoryItems = itemsWithPI.filter((item) => item.category_id === category.id)
      const avgPI = categoryItems.length > 0
        ? categoryItems.reduce((sum, item) => sum + item.pi, 0) / categoryItems.length
        : 0

      return {
        category: category.name,
        averagePI: avgPI * 100,
        itemCount: categoryItems.length,
        analogCount: categoryItems.filter((item) => item.item_type === "analog").length,
        digitalCount: categoryItems.filter((item) => item.item_type === "digital").length,
      }
    }).filter((cat) => cat.itemCount > 0)

    // Individual items data
    const itemsData = itemsWithPI.map((item) => {
      const categoryName = Array.isArray(item.categories) ? item.categories[0]?.name : item.categories.name
      return {
        name: item.title.length > 20 ? item.title.substring(0, 20) + "..." : item.title,
        fullName: item.title,
        pi: item.piPercentage,
        category: categoryName || 'Unknown',
        type: item.item_type,
      }
    })

    // Group items by category for category-wise charts
    const itemsByCategory = categories
      .map((category) => {
        const categoryItems = itemsWithPI
          .filter((item) => item.category_id === category.id)
          .map((item) => ({
            name: item.title.length > 15 ? item.title.substring(0, 15) + "..." : item.title,
            fullName: item.title,
            pi: item.piPercentage,
            type: item.item_type,
          }))
        
        return {
          categoryName: category.name,
          items: categoryItems,
        }
      })
      .filter((cat) => cat.items.length > 0)

    // Completion status
    const completionData = [
      {
        name: "With PI Data",
        value: itemsWithPI.length,
        color: generateColor(0, 2),
      },
      {
        name: "Without PI Data",
        value: items.length - itemsWithPI.length,
        color: generateColor(1, 2),
      },
    ]

    // Type distribution
    const typeData = [
      {
        name: "Analog Methods",
        value: itemsWithPI.filter((item) => item.item_type === "analog").length,
        color: generateColor(0, 2),
      },
      {
        name: "Digital Methods",
        value: itemsWithPI.filter((item) => item.item_type === "digital").length,
        color: generateColor(1, 2),
      },
    ]

    return {
      byCategory,
      itemsData,
      itemsByCategory,
      completionData,
      typeData,
      totalItems: items.length,
      itemsWithData: itemsWithPI.length,
    }
  }, [categories, items, itemDetails])

  console.log('Chart Data:', chartData)

  if (chartData.itemsWithData === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Data Available</CardTitle>
          <CardDescription>
            No participation index data has been entered yet. Complete the item details to see analytics.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2 border-amber-200">
          <CardHeader>
            <CardTitle className="text-amber-900">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-amber-600">{chartData.totalItems}</p>
            <p className="text-sm text-amber-700 mt-2">
              {chartData.itemsWithData} with PI data
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-amber-200">
          <CardHeader>
            <CardTitle className="text-amber-900">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-amber-600">{chartData.byCategory.length}</p>
            <p className="text-sm text-amber-700 mt-2">Active categories</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-amber-200">
          <CardHeader>
            <CardTitle className="text-amber-900">Average PI</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-amber-600">
              {chartData.byCategory.length > 0
                ? (
                    chartData.byCategory.reduce((sum, cat) => sum + cat.averagePI, 0) /
                    chartData.byCategory.length
                  ).toFixed(1)
                : "0.0"}
              %
            </p>
            <p className="text-sm text-amber-700 mt-2">Across all categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="categoryItems" className="space-y-4">
        <TabsList className="bg-amber-100 border-2 border-amber-200">
          <TabsTrigger value="categoryItems" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
            Items by Category
          </TabsTrigger>
          <TabsTrigger value="category" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
            Category Summary
          </TabsTrigger>
          <TabsTrigger value="items" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
            All Items
          </TabsTrigger>
          <TabsTrigger value="distribution" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
            Distribution
          </TabsTrigger>
        </TabsList>

        {/* Category Items View - NEW */}
        <TabsContent value="categoryItems" className="space-y-6">
          {chartData.itemsByCategory.map((categoryData) => (
            <Card key={categoryData.categoryName} className="border-2 border-amber-200">
              <CardHeader>
                <CardTitle className="text-amber-900">{categoryData.categoryName}</CardTitle>
                <CardDescription>
                  Participation Index for each item in this category ({categoryData.items.length} items)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData.items}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#fed7aa" />
                    <XAxis
                      dataKey="name"
                      stroke="#92400e"
                      tick={{ fill: "#92400e", fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis
                      stroke="#92400e"
                      tick={{ fill: "#92400e" }}
                      label={{ value: "PI (%)", angle: -90, position: "insideLeft", fill: "#92400e" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fffbeb",
                        border: "2px solid #fcd34d",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number, name: string, props: any) => [
                        `${value.toFixed(2)}%`,
                        `PI (${props.payload.fullName})`,
                      ]}
                    />
                    <Bar
                      dataKey="pi"
                      name="PI (%)"
                      radius={[8, 8, 0, 0]}
                    >
                      {categoryData.items.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={generateColor(index, categoryData.items.length)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Category View */}
        <TabsContent value="category" className="space-y-4">
          <Card className="border-2 border-amber-200">
            <CardHeader>
              <CardTitle className="text-amber-900">Average PI by Category</CardTitle>
              <CardDescription>Participation Index percentage for each category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData.byCategory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fed7aa" />
                  <XAxis
                    dataKey="category"
                    stroke="#92400e"
                    tick={{ fill: "#92400e" }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis
                    stroke="#92400e"
                    tick={{ fill: "#92400e" }}
                    label={{ value: "PI (%)", angle: -90, position: "insideLeft", fill: "#92400e" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fffbeb",
                      border: "2px solid #fcd34d",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="averagePI" name="Average PI (%)" radius={[8, 8, 0, 0]}>
                    {chartData.byCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={generateColor(index, chartData.byCategory.length)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-2 border-amber-200">
            <CardHeader>
              <CardTitle className="text-amber-900">Item Count by Category</CardTitle>
              <CardDescription>Number of analog and digital items per category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData.byCategory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fed7aa" />
                  <XAxis
                    dataKey="category"
                    stroke="#92400e"
                    tick={{ fill: "#92400e" }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis stroke="#92400e" tick={{ fill: "#92400e" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fffbeb",
                      border: "2px solid #fcd34d",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="analogCount" name="Analog" stackId="a" radius={[8, 8, 0, 0]}>
                    {chartData.byCategory.map((entry, index) => (
                      <Cell key={`cell-analog-${index}`} fill={generateColor(index * 2, chartData.byCategory.length * 2)} />
                    ))}
                  </Bar>
                  <Bar dataKey="digitalCount" name="Digital" stackId="a">
                    {chartData.byCategory.map((entry, index) => (
                      <Cell key={`cell-digital-${index}`} fill={generateColor(index * 2 + 1, chartData.byCategory.length * 2)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Items View */}
        <TabsContent value="items" className="space-y-4">
          <Card className="border-2 border-amber-200">
            <CardHeader>
              <CardTitle className="text-amber-900">PI by Item</CardTitle>
              <CardDescription>Participation Index for each item (hover for full name)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={500}>
                <LineChart data={chartData.itemsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fed7aa" />
                  <XAxis
                    dataKey="name"
                    stroke="#92400e"
                    tick={{ fill: "#92400e", fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={120}
                  />
                  <YAxis
                    stroke="#92400e"
                    tick={{ fill: "#92400e" }}
                    label={{ value: "PI (%)", angle: -90, position: "insideLeft", fill: "#92400e" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fffbeb",
                      border: "2px solid #fcd34d",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number, name: string, props: any) => [
                      `${value.toFixed(2)}%`,
                      `PI (${props.payload.fullName})`,
                    ]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="pi"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    name="PI (%)"
                    dot={(props) => {
                      const { cx, cy, index } = props
                      return (
                        <circle
                          key={`dot-${index}`}
                          cx={cx}
                          cy={cy}
                          r={5}
                          fill={generateColor(index, chartData.itemsData.length)}
                          stroke="none"
                        />
                      )
                    }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Distribution View */}
        <TabsContent value="distribution" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-2 border-amber-200">
              <CardHeader>
                <CardTitle className="text-amber-900">Data Completion</CardTitle>
                <CardDescription>Items with vs. without PI data</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.completionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) =>
                        `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.completionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-2 border-amber-200">
              <CardHeader>
                <CardTitle className="text-amber-900">Method Types</CardTitle>
                <CardDescription>Analog vs. Digital methods with data</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.typeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) =>
                        `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.typeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
