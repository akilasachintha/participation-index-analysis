"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DEFAULT_CHECKLIST_ITEMS } from "@/lib/types"
import { Plus, FolderOpen, Calendar, CheckCircle2, Circle, ArrowRight, BarChart3, Upload, X, Image as ImageIcon } from "lucide-react"

interface Project {
  id: string
  name: string
  description: string | null
  image_url: string | null
  created_at: string
  completed_count?: number
  total_count?: number
}

export default function HomePage() {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [projectImage, setProjectImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    const supabase = createClient()

    const { data: projectsData, error: projectsError } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false })

    if (projectsError) {
      console.error("Error fetching projects:", projectsError)
      setIsLoadingProjects(false)
      return
    }

    // Fetch completion stats for each project
    const projectsWithStats = await Promise.all(
      (projectsData || []).map(async (project) => {
        const { data: items } = await supabase
          .from("checklist_items")
          .select("is_completed")
          .eq("project_id", project.id)

        const total = items?.length || 0
        const completed = items?.filter((item) => item.is_completed).length || 0

        return { ...project, completed_count: completed, total_count: total }
      }),
    )

    setProjects(projectsWithStats)
    setIsLoadingProjects(false)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        setError("Image size should be less than 5MB")
        return
      }
      setProjectImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setProjectImage(null)
    setImagePreview(null)
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError("Project name is required")
      return
    }

    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      let imageUrl: string | null = null

      // Save image as base64 directly in database
      if (projectImage) {
        imageUrl = imagePreview // Already in base64 format from FileReader
      }

      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({ 
          name: name.trim(), 
          description: description.trim() || null,
          image_url: imageUrl
        })
        .select()
        .single()

      if (projectError) throw projectError

      const { data: categories, error: catError } = await supabase.from("categories").select("*").order("sort_order")

      if (catError) throw catError

      const checklistItems: Array<{
        project_id: string
        category_id: string
        item_type: string
        title: string
      }> = []

      for (const category of categories) {
        const defaultItems = DEFAULT_CHECKLIST_ITEMS[category.name]
        if (defaultItems) {
          defaultItems.analog.forEach((title) => {
            checklistItems.push({
              project_id: project.id,
              category_id: category.id,
              item_type: "analog",
              title,
            })
          })
          defaultItems.digital.forEach((title) => {
            checklistItems.push({
              project_id: project.id,
              category_id: category.id,
              item_type: "digital",
              title,
            })
          })
        }
      }

      if (checklistItems.length > 0) {
        const { error: itemsError } = await supabase.from("checklist_items").insert(checklistItems)
        if (itemsError) throw itemsError
      }

      setDialogOpen(false)
      setName("")
      setDescription("")
      setProjectImage(null)
      setImagePreview(null)
      router.push(`/project/${project.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project")
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getCompletionPercentage = (completed: number, total: number) => {
    if (total === 0) return 0
    return Math.round((completed / total) * 100)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Participation Index</h1>
              <p className="text-sm text-muted-foreground">Analysis Dashboard</p>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card">
              <DialogHeader>
                <DialogTitle className="text-foreground">Create New Project</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Start a new Participation Index Analysis project
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateProject} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name" className="text-foreground font-medium">
                    Project Name
                  </Label>
                  <Input
                    id="project-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter project name"
                    className="bg-background border-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-foreground font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter project description"
                    rows={3}
                    className="bg-background border-input resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-image" className="text-foreground font-medium">
                    Project Image (Optional)
                  </Label>
                  <div className="border-2 border-dashed border-input rounded-lg p-4">
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Project preview"
                          className="w-full h-40 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label
                        htmlFor="project-image"
                        className="flex flex-col items-center justify-center cursor-pointer py-4"
                      >
                        <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">Click to upload project image</span>
                        <span className="text-xs text-muted-foreground mt-1">Max size: 5MB</span>
                        <input
                          id="project-image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
                {error && <p className="text-destructive text-sm bg-destructive/10 p-2 rounded-md">{error}</p>}
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {isLoading ? "Creating..." : "Create Project"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* About Participation Index Analysis Section */}
        <Card className="bg-card border-border mb-8">
          <CardHeader>
            <CardTitle className="text-foreground text-xl">About Participation Index Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              Measuring community participation is essential to assessing the level of engagement and influence of
              stakeholders in development projects. Participation is multidimensional, encompassing attendance,
              consultation, involvement, collaboration, and empowerment. Various researchers have highlighted that
              participation is not merely about presence, but about the extent of contribution and decision-making power
              (Arnstein, 1969; Pretty, 1995; IAP2, 2018). In this study, participation is quantified using a
              Participation Index (PI), calculated based on frequency and intensity of participation activities,
              weighted according to their significance. Following the frameworks of Arnstein (1969), Pretty (1995), and
              IAP2 (2018), community participation activities were classified into five levels based on the depth of
              engagement:
            </p>

            {/* Activity Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border rounded-lg">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border px-4 py-2 text-left text-foreground font-semibold">Activity</th>
                    <th className="border border-border px-4 py-2 text-left text-foreground font-semibold">
                      Description
                    </th>
                    <th className="border border-border px-4 py-2 text-left text-foreground font-semibold">Weight</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-border px-4 py-2 text-foreground">Attend</td>
                    <td className="border border-border px-4 py-2 text-muted-foreground">
                      Attending meetings or events without active contribution
                    </td>
                    <td className="border border-border px-4 py-2 text-center text-foreground font-medium">0.2</td>
                  </tr>
                  <tr className="bg-muted/30">
                    <td className="border border-border px-4 py-2 text-foreground">Consult</td>
                    <td className="border border-border px-4 py-2 text-muted-foreground">
                      Providing opinions, feedback, or suggestions
                    </td>
                    <td className="border border-border px-4 py-2 text-center text-foreground font-medium">0.4</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-4 py-2 text-foreground">Work/Involve</td>
                    <td className="border border-border px-4 py-2 text-muted-foreground">
                      Participating in project activities or events
                    </td>
                    <td className="border border-border px-4 py-2 text-center text-foreground font-medium">0.6</td>
                  </tr>
                  <tr className="bg-muted/30">
                    <td className="border border-border px-4 py-2 text-foreground">Collaborate</td>
                    <td className="border border-border px-4 py-2 text-muted-foreground">
                      Working jointly with project leaders or committees in decision-making
                    </td>
                    <td className="border border-border px-4 py-2 text-center text-foreground font-medium">0.8</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-4 py-2 text-foreground">Empower/Lead</td>
                    <td className="border border-border px-4 py-2 text-muted-foreground">
                      Taking leadership roles and making decisions independently
                    </td>
                    <td className="border border-border px-4 py-2 text-center text-foreground font-medium">1.0</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Formula Section */}
            <div className="bg-muted/50 p-6 rounded-lg border border-border">
              <p className="text-foreground font-semibold mb-3">Participation Index Formula:</p>
              <div className="bg-background p-4 rounded border border-border mb-4 overflow-x-auto">
                <p className="font-mono text-sm text-foreground whitespace-nowrap">
                  PI = (f<sub>a</sub> × 0.2) + (f<sub>c</sub> × 0.4) + (f<sub>i</sub> × 0.6) + (f<sub>col</sub> × 0.8)
                  + (f<sub>emp</sub> × 1.0)
                </p>
              </div>
              <p className="text-muted-foreground text-sm mb-2">
                The resulting PI value ranges from 0 to 1 and can be converted into a percentage:
              </p>
              <div className="bg-background p-3 rounded border border-border mb-4">
                <p className="font-mono text-sm text-foreground">
                  PI% = PI × 100
                </p>
              </div>

              {/* Legend */}
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">
                  • f<sub>a</sub> = frequency of respondents who only attended
                </p>
                <p className="text-muted-foreground">
                  • f<sub>c</sub> = frequency of respondents who consulted
                </p>
                <p className="text-muted-foreground">
                  • f<sub>i</sub> = frequency of respondents who worked/involved in activities
                </p>
                <p className="text-muted-foreground">
                  • f<sub>col</sub> = frequency of respondents who collaborated
                </p>
                <p className="text-muted-foreground">
                  • f<sub>emp</sub> = frequency of respondents who are empowered or led
                </p>
                <p className="text-muted-foreground">
                  • N = total number of respondents
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FolderOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{projects.length}</p>
                <p className="text-sm text-muted-foreground">Total Projects</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {projects.filter((p) => p.completed_count === p.total_count && (p.total_count ?? 0) > 0).length}
                </p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <Circle className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {projects.filter((p) => (p.completed_count ?? 0) < (p.total_count ?? 0)).length}
                </p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects Section */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">Your Projects</h2>
        </div>

        {isLoadingProjects ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-card border-border animate-pulse">
                <CardHeader className="pb-3">
                  <div className="h-5 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-2 bg-muted rounded w-full"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <Card className="bg-card border-border border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <FolderOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No projects yet</h3>
              <p className="text-muted-foreground text-center mb-4 max-w-sm">
                Create your first Participation Index Analysis project to get started
              </p>
              <Button
                onClick={() => setDialogOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Your First Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => {
              const percentage = getCompletionPercentage(project.completed_count ?? 0, project.total_count ?? 0)
              const isComplete = percentage === 100 && (project.total_count ?? 0) > 0

              return (
                <div key={project.id} onClick={() => router.push(`/project/${project.id}`)} className="cursor-pointer">
                  <Card className="bg-card border-border hover:border-primary/50 transition-all group h-full overflow-hidden">
                    {project.image_url && (
                      <div className="w-full h-32 bg-muted overflow-hidden">
                        <img
                          src={project.image_url}
                          alt={project.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-foreground text-base font-medium truncate group-hover:text-primary transition-colors">
                            {project.name}
                          </CardTitle>
                          <CardDescription className="text-muted-foreground mt-1 line-clamp-2">
                            {project.description || "No description"}
                          </CardDescription>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                        <Calendar className="h-3 w-3" />
                        {formatDate(project.created_at)}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className={`font-medium ${isComplete ? "text-success" : "text-foreground"}`}>
                            {project.completed_count}/{project.total_count} items
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${isComplete ? "bg-success" : "bg-primary"}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
