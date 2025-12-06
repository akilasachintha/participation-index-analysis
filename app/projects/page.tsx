import {createClient} from "@/lib/supabase/server"
import Link from "next/link"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {formatDistanceToNow} from "date-fns"

export default async function ProjectsPage() {
    const supabase = await createClient()

    const {data: projects, error} = await supabase
        .from("projects")
        .select("*")
        .order("created_at", {ascending: false})

    return (
        <div className="min-h-screen bg-amber-50">
            {/* Header */}
            <header className="bg-amber-100 border-b border-amber-200 py-4">
                <div className="container mx-auto px-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-amber-900">Participation Index Analysis</h1>
                    <Link href="/">
                        <Button className="bg-amber-600 hover:bg-amber-700 text-white">New Project</Button>
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <h2 className="text-xl font-semibold text-amber-900 mb-6">Existing Projects</h2>

                {error && <p className="text-red-600">Error loading projects: {error.message}</p>}

                {projects && projects.length === 0 && (
                    <Card className="border-amber-200">
                        <CardContent className="py-8 text-center">
                            <p className="text-amber-700">No projects yet. Create your first project!</p>
                            <Link href="/">
                                <Button className="mt-4 bg-amber-600 hover:bg-amber-700 text-white">Create
                                    Project</Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {projects?.map((project) => (
                        <div key={project.id} className="h-full">
                            <Link href={`/project/${project.id}`} className="block h-full">
                                <Card
                                    className="border-amber-200 hover:border-amber-400 hover:shadow-md transition-all h-full">
                                    <CardHeader className="bg-amber-100 border-b border-amber-200">
                                        <CardTitle className="text-amber-900 text-lg">{project.name}</CardTitle>
                                        <CardDescription className="text-amber-600">
                                            Created {formatDistanceToNow(new Date(project.created_at), {addSuffix: true})}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <p className="text-amber-700 text-sm line-clamp-2">
                                            {project.description || "No description provided"}
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    )
}
