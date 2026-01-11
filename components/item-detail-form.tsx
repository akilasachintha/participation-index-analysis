"use client"

import type React from "react"
import {useCallback, useState} from "react"
import {createClient} from "@/lib/supabase/client"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Textarea} from "@/components/ui/textarea"
import {Label} from "@/components/ui/label"
import {Card, CardContent} from "@/components/ui/card"
import {CheckCircle, Edit, Upload, X} from "lucide-react"
import type {ChecklistItem, ItemDetail} from "@/lib/types"
import {ImageViewerDialog} from "@/components/image-viewer-dialog"

interface ItemDetailFormProps {
    item: ChecklistItem
    projectId: string
    existingDetails: ItemDetail | null
}

export function ItemDetailForm({item, projectId, existingDetails}: ItemDetailFormProps) {
    const [isEditing, setIsEditing] = useState(!existingDetails) // Auto-edit if no existing details
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [isCompleted, setIsCompleted] = useState(item.is_completed || false)
    
    // Image viewer state
    const [viewerOpen, setViewerOpen] = useState(false)
    const [viewerImage, setViewerImage] = useState<{ src: string; alt: string } | null>(null)

    // Form state - initialized from existingDetails
    const [activity, setActivity] = useState(existingDetails?.activity || "")
    const [image1, setImage1] = useState<File | null>(null)
    const [image2, setImage2] = useState<File | null>(null)
    const [image3, setImage3] = useState<File | null>(null)
    const [image4, setImage4] = useState<File | null>(null)
    const [image1Preview, setImage1Preview] = useState<string | null>(existingDetails?.image1_url || null)
    const [image2Preview, setImage2Preview] = useState<string | null>(existingDetails?.image2_url || null)
    const [image3Preview, setImage3Preview] = useState<string | null>(existingDetails?.image3_url || null)
    const [image4Preview, setImage4Preview] = useState<string | null>(existingDetails?.image4_url || null)

    // Participation values - initialized from existingDetails
    // Variable mapping to database columns:
    // fa (Attend) -> attend_fa
    // fc (Consult) -> consult_fc
    // fi (Work/Involve) -> involve_fi
    // fcol (Collaborate) -> collaborate_fcol
    // femp (Empower/Lead) -> empower_femp
    const [fa, setFa] = useState(existingDetails?.attend_fa?.toString() || "")
    const [fc, setFc] = useState(existingDetails?.consult_fc?.toString() || "")
    const [fi, setFi] = useState(existingDetails?.involve_fi?.toString() || "")
    const [fcol, setFcol] = useState(existingDetails?.collaborate_fcol?.toString() || "")
    const [femp, setFemp] = useState(existingDetails?.empower_femp?.toString() || "")

    const [assumptions, setAssumptions] = useState(existingDetails?.assumptions || "")
    const [collectedBy, setCollectedBy] = useState(existingDetails?.data_collected_by || "")
    const [collectionDate, setCollectionDate] = useState(existingDetails?.collection_date || "")

    // Calculate total N from the 5 activity frequencies
    const calculateTotalN = useCallback(() => {
        const attend = Number.parseFloat(fa) || 0
        const consult = Number.parseFloat(fc) || 0
        const workInvolve = Number.parseFloat(fi) || 0
        const collaborate = Number.parseFloat(fcol) || 0
        const empower = Number.parseFloat(femp) || 0
        return attend + consult + workInvolve + collaborate + empower
    }, [fa, fc, fi, fcol, femp])

    // Calculate PI using the new formula: PI = [(fa × 0.2) + (fc × 0.4) + (fi × 0.6) + (fcol × 0.8) + (femp × 1.0)] / N
    const calculatePI = useCallback(() => {
        const attend = Number.parseFloat(fa) || 0
        const consult = Number.parseFloat(fc) || 0
        const workInvolve = Number.parseFloat(fi) || 0
        const collaborate = Number.parseFloat(fcol) || 0
        const empower = Number.parseFloat(femp) || 0
        const n = calculateTotalN()

        if (n === 0) return null

        const pi = (attend * 0.2 + consult * 0.4 + workInvolve * 0.6 + collaborate * 0.8 + empower * 1.0) / n
        return pi.toFixed(4)
    }, [fa, fc, fi, fcol, femp, calculateTotalN])

    const openImageViewer = (src: string, alt: string) => {
        setViewerImage({ src, alt })
        setViewerOpen(true)
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, imageNum: 1 | 2 | 3 | 4) => {
        const file = e.target.files?.[0]
        if (file) {
            // Check file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                alert("Image size should be less than 5MB")
                return
            }

            const reader = new FileReader()
            reader.onloadend = () => {
                if (imageNum === 1) {
                    setImage1(file)
                    setImage1Preview(reader.result as string)
                } else if (imageNum === 2) {
                    setImage2(file)
                    setImage2Preview(reader.result as string)
                } else if (imageNum === 3) {
                    setImage3(file)
                    setImage3Preview(reader.result as string)
                } else {
                    setImage4(file)
                    setImage4Preview(reader.result as string)
                }
            }
            reader.readAsDataURL(file)
        }
    }

    const removeImage = (imageNum: number) => {
        if (imageNum === 1) {
            setImage1(null)
            setImage1Preview(null)
        } else if (imageNum === 2) {
            setImage2(null)
            setImage2Preview(null)
        } else if (imageNum === 3) {
            setImage3(null)
            setImage3Preview(null)
        } else {
            setImage4(null)
            setImage4Preview(null)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        setSuccess(false)

        const supabase = createClient()

        try {
            let image1Url = existingDetails?.image1_url || null
            let image2Url = existingDetails?.image2_url || null
            let image3Url = existingDetails?.image3_url || null
            let image4Url = existingDetails?.image4_url || null

            // Save images as base64 directly in database
            if (image1) {
                image1Url = image1Preview // Already in base64 format
            }

            if (image2) {
                image2Url = image2Preview // Already in base64 format
            }

            if (image3) {
                image3Url = image3Preview // Already in base64 format
            }

            if (image4) {
                image4Url = image4Preview // Already in base64 format
            }

            const calculatedPi = calculatePI()
            const totalN = calculateTotalN()

            const detailsData = {
                checklist_item_id: item.id,
                activity: activity || null,
                image1_url: image1Url,
                image2_url: image2Url,
                image3_url: image3Url,
                image4_url: image4Url,
                total_participation_n: totalN || null,
                // Database column mapping:
                attend_fa: fa ? Number.parseFloat(fa) : null,              // fa = Attend
                consult_fc: fc ? Number.parseFloat(fc) : null,             // fc = Consult
                involve_fi: fi ? Number.parseFloat(fi) : null,             // fi = Work/Involve
                collaborate_fcol: fcol ? Number.parseFloat(fcol) : null,   // fcol = Collaborate
                empower_femp: femp ? Number.parseFloat(femp) : null,       // femp = Empower/Lead
                calculated_pi: calculatedPi ? Number.parseFloat(calculatedPi) : null,
                assumptions: assumptions || null,
                data_collected_by: collectedBy || null,
                collection_date: collectionDate || null,
                updated_at: new Date().toISOString(),
            }

            if (existingDetails?.id) {
                // Update existing details
                const {error: updateError} = await supabase
                    .from("item_details")
                    .update(detailsData)
                    .eq("id", existingDetails.id)

                if (updateError) throw updateError
            } else {
                // Insert new details using upsert to handle duplicates
                const {error: insertError} = await supabase
                    .from("item_details")
                    .upsert(detailsData, {onConflict: "checklist_item_id"})

                if (insertError) throw insertError
            }

            // Mark checklist item as completed
            const {error: itemError} = await supabase
                .from("checklist_items")
                .update({is_completed: true})
                .eq("id", item.id)

            if (itemError) throw itemError

            setSuccess(true)
            setIsCompleted(true)

            // Switch back to read-only view after saving
            setTimeout(() => {
                setSuccess(false)
                setIsEditing(false)
            }, 2000)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save details")
        } finally {
            setIsLoading(false)
        }
    }

    const pi = calculatePI()

    // Read-only view when not editing and has existing details
    if (!isEditing && existingDetails) {
        return (
            <>
            <Card className="border-amber-300">
                <CardContent className="p-6 space-y-6">
                    {/* Edit Button */}
                    <div className="flex justify-end">
                        <Button
                            onClick={() => setIsEditing(true)}
                            className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2"
                        >
                            <Edit className="w-4 h-4"/>
                            Edit Details
                        </Button>
                    </div>

                    {isCompleted && (
                        <div
                            className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded flex items-center gap-2">
                            <CheckCircle className="w-4 h-4"/>
                            <span className="text-sm font-medium">This item has been completed</span>
                        </div>
                    )}

                    {/* Activity Description */}INTEGRATED BUILDING PROCESS
                    <div className="space-y-2">
                        <Label className="text-amber-900 font-semibold">Participent</Label>
                        <div className="border border-amber-300 rounded-md p-3 bg-white min-h-20">
                            <p className="text-sm text-amber-900 whitespace-pre-wrap">{activity || "No activity description"}</p>
                        </div>
                    </div>

                    {/* Images Display */}
                    <div className="space-y-2">
                        <Label className="text-amber-900 font-semibold text-base">Images</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Image 1 */}
                            <div className="space-y-2">
                                <div className="text-sm text-amber-700 font-medium">Image 1</div>
                                <div
                                    className="border-2 border-amber-300 rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition-shadow">
                                    {image1Preview ? (
                                        <div
                                            className="aspect-square w-full flex items-center justify-center overflow-hidden rounded">
                                            <img
                                                src={image1Preview || "/placeholder.svg"}
                                                alt="Image 1"
                                                className="w-full h-full object-contain cursor-pointer hover:scale-105 transition-transform"
                                                onClick={() => openImageViewer(image1Preview, 'Image 1')}
                                            />
                                        </div>
                                    ) : (
                                        <div
                                            className="aspect-square w-full flex items-center justify-center bg-amber-50 rounded">
                                            <span className="text-sm text-amber-600">No image</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Image 2 */}
                            <div className="space-y-2">
                                <div className="text-sm text-amber-700 font-medium">Image 2</div>
                                <div
                                    className="border-2 border-amber-300 rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition-shadow">
                                    {image2Preview ? (
                                        <div
                                            className="aspect-square w-full flex items-center justify-center overflow-hidden rounded">
                                            <img
                                                src={image2Preview || "/placeholder.svg"}
                                                alt="Image 2"
                                                className="w-full h-full object-contain cursor-pointer hover:scale-105 transition-transform"
                                                onClick={() => openImageViewer(image2Preview, 'Image 2')}
                                            />
                                        </div>
                                    ) : (
                                        <div
                                            className="aspect-square w-full flex items-center justify-center bg-amber-50 rounded">
                                            <span className="text-sm text-amber-600">No image</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Image 3 */}
                            <div className="space-y-2">
                                <div className="text-sm text-amber-700 font-medium">Image 3</div>
                                <div
                                    className="border-2 border-amber-300 rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition-shadow">
                                    {image3Preview ? (
                                        <div
                                            className="aspect-square w-full flex items-center justify-center overflow-hidden rounded">
                                            <img
                                                src={image3Preview || "/placeholder.svg"}
                                                alt="Image 3"
                                                className="w-full h-full object-contain cursor-pointer hover:scale-105 transition-transform"
                                                onClick={() => openImageViewer(image3Preview, 'Image 3')}
                                            />
                                        </div>
                                    ) : (
                                        <div
                                            className="aspect-square w-full flex items-center justify-center bg-amber-50 rounded">
                                            <span className="text-sm text-amber-600">No image</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Image 4 */}
                            <div className="space-y-2">
                                <div className="text-sm text-amber-700 font-medium">Image 4</div>
                                <div
                                    className="border-2 border-amber-300 rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition-shadow">
                                    {image4Preview ? (
                                        <div
                                            className="aspect-square w-full flex items-center justify-center overflow-hidden rounded">
                                            <img
                                                src={image4Preview || "/placeholder.svg"}
                                                alt="Image 4"
                                                className="w-full h-full object-contain cursor-pointer hover:scale-105 transition-transform"
                                                onClick={() => openImageViewer(image4Preview, 'Image 4')}
                                            />
                                        </div>
                                    ) : (
                                        <div
                                            className="aspect-square w-full flex items-center justify-center bg-amber-50 rounded">
                                            <span className="text-sm text-amber-600">No image</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Participation Values Table - Read Only */}
                    <div className="space-y-2">
                        <Label className="text-amber-900 font-semibold">Participation Values</Label>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-amber-300">
                                <thead>
                                <tr className="bg-amber-100">
                                    <th className="border border-amber-300 px-3 py-2 text-left text-base text-amber-900">Activity</th>
                                    <th className="border border-amber-300 px-3 py-2 text-left text-base text-amber-900">Description</th>
                                    <th className="border border-amber-300 px-3 py-2 text-left text-base text-amber-900">No.
                                        of participates
                                    </th>
                                </tr>
                                </thead>
                                <tbody>
                                <tr>
                                    <td className="border border-amber-300 px-3 py-2 text-base">Attend(f<sub>a</sub>)</td>
                                    <td className="border border-amber-300 px-3 py-2 text-base">Attending meetings or
                                        events without active contribution
                                    </td>
                                    <td className="border border-amber-300 px-3 py-2 bg-amber-50">
                                        <div className="px-2 py-1 text-base text-amber-900">{fa || "-"}</div>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="border border-amber-300 px-3 py-2 text-base">Consult(f<sub>c</sub>)
                                    </td>
                                    <td className="border border-amber-300 px-3 py-2 text-base">Providing opinions,
                                        feedback, or suggestions
                                    </td>
                                    <td className="border border-amber-300 px-3 py-2 bg-amber-50">
                                        <div className="px-2 py-1 text-base text-amber-900">{fc || "-"}</div>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="border border-amber-300 px-3 py-2 text-base">Work/Involve(f<sub>i</sub>)
                                    </td>
                                    <td className="border border-amber-300 px-3 py-2 text-base">Participating in project
                                        activities or tasks
                                    </td>
                                    <td className="border border-amber-300 px-3 py-2 bg-amber-50">
                                        <div className="px-2 py-1 text-base text-amber-900">{fi || "-"}</div>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="border border-amber-300 px-3 py-2 text-base">Collaborate(f<sub>col</sub>)
                                    </td>
                                    <td className="border border-amber-300 px-3 py-2 text-base">Working jointly with
                                        project leaders or committees in decision-making
                                    </td>
                                    <td className="border border-amber-300 px-3 py-2 bg-amber-50">
                                        <div className="px-2 py-1 text-base text-amber-900">{fcol || "-"}</div>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="border border-amber-300 px-3 py-2 text-base">Empower/Lead(f<sub>emp</sub>)
                                    </td>
                                    <td className="border border-amber-300 px-3 py-2 text-base">Taking leadership roles
                                        and making decisions independently
                                    </td>
                                    <td className="border border-amber-300 px-3 py-2 bg-amber-50">
                                        <div className="px-2 py-1 text-base text-amber-900">{femp || "-"}</div>
                                    </td>
                                </tr>
                                <tr className="bg-amber-50">
                                    <td className="border border-amber-300 px-3 py-2 text-base font-semibold">Total number
                                        of respondents (N)
                                    </td>
                                    <td className="border border-amber-300 px-3 py-2 text-base font-semibold">Total
                                        Participants
                                    </td>
                                    <td className="border border-amber-300 px-3 py-2 bg-amber-100">
                                        <div
                                            className="px-2 py-1 text-base text-amber-900 font-semibold">{calculateTotalN() || "-"}</div>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Formula and PI Display */}
                    <div className="bg-amber-100 p-4 rounded border border-amber-300">
                        <p className="text-sm font-mono text-amber-900 mb-2">
                            PI = [ (f<sub>a</sub> × 0.2) + (f<sub>c</sub> × 0.4) + (f<sub>i</sub> × 0.6) +
                            (f<sub>col</sub> × 0.8) + (f<sub>emp</sub> × 1.0) ] / N
                        </p>
                        <p className="text-lg font-bold text-amber-900">PI = {pi || "....................."}</p>
                        <p className="text-lg font-bold text-amber-900 mt-2">PI%
                            = {pi ? (Number.parseFloat(pi) * 100).toFixed(2) + "%" : "....................."}</p>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label className="text-amber-900 font-semibold">Notes :</Label>
                        <div className="border border-amber-300 rounded-md p-3 bg-white min-h-[60px]">
                            <p className="text-sm text-amber-900 whitespace-pre-wrap">{assumptions || "No notes provided"}</p>
                        </div>
                    </div>

                    {/* Data Collection Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-amber-900 font-semibold">Data Collected by :</Label>
                            <div className="border border-amber-300 rounded-md p-2 bg-white">
                                <p className="text-sm text-amber-900">{collectedBy || "-"}</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-amber-900 font-semibold">Date :</Label>
                            <div className="border border-amber-300 rounded-md p-2 bg-white">
                                <p className="text-sm text-amber-900">{collectionDate || "-"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Back Button */}
                    <div>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => (window.location.href = `/project/${projectId}`)}
                            className="w-full border-amber-300 text-amber-700"
                        >
                            Back to Checklist
                        </Button>
                    </div>
                </CardContent>
            </Card>
            
            {/* Image Viewer Dialog */}
            {viewerImage && (
                <ImageViewerDialog
                    imageSrc={viewerImage.src}
                    imageAlt={viewerImage.alt}
                    open={viewerOpen}
                    onOpenChange={setViewerOpen}
                />
            )}
            </>
        )
    }

    // Edit form view
    return (
        <>
        <form onSubmit={handleSubmit}>
            <Card className="border-amber-300">
                <CardContent className="p-6 space-y-6">
                    {success && (
                        <div
                            className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded flex items-center gap-2">
                            <CheckCircle className="w-5 h-5"/>
                            <span>Data saved successfully! Item marked as complete.</span>
                        </div>
                    )}

                    {isCompleted && (
                        <div
                            className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded flex items-center gap-2">
                            <CheckCircle className="w-4 h-4"/>
                            <span className="text-sm font-medium">This item has been completed</span>
                        </div>
                    )}

                    {/* Activity Description */}
                    <div className="space-y-2">
                        <Label htmlFor="activity" className="text-amber-900 font-semibold">
                            Participation :
                        </Label>
                        <Textarea
                            id="activity"
                            value={activity}
                            onChange={(e) => setActivity(e.target.value)}
                            placeholder="Describe the activity..."
                            rows={3}
                            className="border-amber-300"
                        />
                    </div>

                    {/* Image Upload Section */}
                    <div className="space-y-2">
                        <Label className="text-amber-900 font-semibold text-base">Images</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Image 1 */}
                            <div className="space-y-2">
                                <div className="text-sm text-amber-700 font-medium">Image 1</div>
                                <div
                                    className="border-2 border-dashed border-amber-400 rounded-lg bg-amber-50/50 hover:bg-amber-50 hover:border-amber-500 transition-all">
                                    {image1Preview ? (
                                        <div className="relative aspect-square p-2">
                                            <img
                                                src={image1Preview || "/placeholder.svg"}
                                                alt="Image 1"
                                                className="w-full h-full object-contain rounded"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(1)}
                                                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-colors"
                                            >
                                                <X className="w-4 h-4"/>
                                            </button>
                                        </div>
                                    ) : (
                                        <label
                                            className="cursor-pointer flex flex-col items-center justify-center aspect-square p-4">
                                            <Upload className="w-10 h-10 text-amber-500 mb-2"/>
                                            <span className="text-sm text-amber-700 font-medium">Click to upload</span>
                                            <span className="text-xs text-amber-600 mt-1">Max 5MB</span>
                                            <input type="file" accept="image/*"
                                                   onChange={(e) => handleImageUpload(e, 1)} className="hidden"/>
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Image 2 */}
                            <div className="space-y-2">
                                <div className="text-sm text-amber-700 font-medium">Image 2</div>
                                <div
                                    className="border-2 border-dashed border-amber-400 rounded-lg bg-amber-50/50 hover:bg-amber-50 hover:border-amber-500 transition-all">
                                    {image2Preview ? (
                                        <div className="relative aspect-square p-2">
                                            <img
                                                src={image2Preview || "/placeholder.svg"}
                                                alt="Image 2"
                                                className="w-full h-full object-contain rounded"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(2)}
                                                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-colors"
                                            >
                                                <X className="w-4 h-4"/>
                                            </button>
                                        </div>
                                    ) : (
                                        <label
                                            className="cursor-pointer flex flex-col items-center justify-center aspect-square p-4">
                                            <Upload className="w-10 h-10 text-amber-500 mb-2"/>
                                            <span className="text-sm text-amber-700 font-medium">Click to upload</span>
                                            <span className="text-xs text-amber-600 mt-1">Max 5MB</span>
                                            <input type="file" accept="image/*"
                                                   onChange={(e) => handleImageUpload(e, 2)} className="hidden"/>
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Image 3 */}
                            <div className="space-y-2">
                                <div className="text-sm text-amber-700 font-medium">Image 3</div>
                                <div
                                    className="border-2 border-dashed border-amber-400 rounded-lg bg-amber-50/50 hover:bg-amber-50 hover:border-amber-500 transition-all">
                                    {image3Preview ? (
                                        <div className="relative aspect-square p-2">
                                            <img
                                                src={image3Preview || "/placeholder.svg"}
                                                alt="Image 3"
                                                className="w-full h-full object-contain rounded"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(3)}
                                                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-colors"
                                            >
                                                <X className="w-4 h-4"/>
                                            </button>
                                        </div>
                                    ) : (
                                        <label
                                            className="cursor-pointer flex flex-col items-center justify-center aspect-square p-4">
                                            <Upload className="w-10 h-10 text-amber-500 mb-2"/>
                                            <span className="text-sm text-amber-700 font-medium">Click to upload</span>
                                            <span className="text-xs text-amber-600 mt-1">Max 5MB</span>
                                            <input type="file" accept="image/*"
                                                   onChange={(e) => handleImageUpload(e, 3)} className="hidden"/>
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Image 4 */}
                            <div className="space-y-2">
                                <div className="text-sm text-amber-700 font-medium">Image 4</div>
                                <div
                                    className="border-2 border-dashed border-amber-400 rounded-lg bg-amber-50/50 hover:bg-amber-50 hover:border-amber-500 transition-all">
                                    {image4Preview ? (
                                        <div className="relative aspect-square p-2">
                                            <img
                                                src={image4Preview || "/placeholder.svg"}
                                                alt="Image 4"
                                                className="w-full h-full object-contain rounded"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(4)}
                                                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-colors"
                                            >
                                                <X className="w-4 h-4"/>
                                            </button>
                                        </div>
                                    ) : (
                                        <label
                                            className="cursor-pointer flex flex-col items-center justify-center aspect-square p-4">
                                            <Upload className="w-10 h-10 text-amber-500 mb-2"/>
                                            <span className="text-sm text-amber-700 font-medium">Click to upload</span>
                                            <span className="text-xs text-amber-600 mt-1">Max 5MB</span>
                                            <input type="file" accept="image/*"
                                                   onChange={(e) => handleImageUpload(e, 4)} className="hidden"/>
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Participation Values Table */}
                    <div className="space-y-2">
                        <Label className="text-amber-900 font-semibold">Participation Values</Label>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-amber-300">
                                <thead>
                                <tr className="bg-amber-100">
                                    <th className="border border-amber-300 px-3 py-2 text-left text-base text-amber-900">Activity</th>
                                    <th className="border border-amber-300 px-3 py-2 text-left text-base text-amber-900">Description</th>
                                    <th className="border border-amber-300 px-3 py-2 text-left text-base text-amber-900">No.
                                        of participates
                                    </th>
                                </tr>
                                </thead>
                                <tbody>
                                <tr>
                                    <td className="border border-amber-300 px-3 py-2 text-base">Attend(f<sub>a</sub>)</td>
                                    <td className="border border-amber-300 px-3 py-2 text-base">Attending meetings or
                                        events without active contribution
                                    </td>
                                    <td className="border border-amber-300 px-3 py-2">
                                        <Input
                                            type="number"
                                            value={fa}
                                            onChange={(e) => setFa(e.target.value)}
                                            className="h-8 border-amber-300"
                                            min="0"
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td className="border border-amber-300 px-3 py-2 text-base">Consult(f<sub>c</sub>)
                                    </td>
                                    <td className="border border-amber-300 px-3 py-2 text-base">Providing opinions,
                                        feedback, or suggestions
                                    </td>
                                    <td className="border border-amber-300 px-3 py-2">
                                        <Input
                                            type="number"
                                            value={fc}
                                            onChange={(e) => setFc(e.target.value)}
                                            className="h-8 border-amber-300"
                                            min="0"
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td className="border border-amber-300 px-3 py-2 text-base">Work/Involve(f<sub>i</sub>)
                                    </td>
                                    <td className="border border-amber-300 px-3 py-2 text-base">Participating in project
                                        activities or tasks
                                    </td>
                                    <td className="border border-amber-300 px-3 py-2">
                                        <Input
                                            type="number"
                                            value={fi}
                                            onChange={(e) => setFi(e.target.value)}
                                            className="h-8 border-amber-300"
                                            min="0"
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td className="border border-amber-300 px-3 py-2 text-base">Collaborate(f<sub>col</sub>)
                                    </td>
                                    <td className="border border-amber-300 px-3 py-2 text-base">Working jointly with
                                        project leaders or committees in decision-making
                                    </td>
                                    <td className="border border-amber-300 px-3 py-2">
                                        <Input
                                            type="number"
                                            value={fcol}
                                            onChange={(e) => setFcol(e.target.value)}
                                            className="h-8 border-amber-300"
                                            min="0"
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td className="border border-amber-300 px-3 py-2 text-base">Empower/Lead(f<sub>emp</sub>)
                                    </td>
                                    <td className="border border-amber-300 px-3 py-2 text-base">Taking leadership roles
                                        and making decisions independently
                                    </td>
                                    <td className="border border-amber-300 px-3 py-2">
                                        <Input
                                            type="number"
                                            value={femp}
                                            onChange={(e) => setFemp(e.target.value)}
                                            className="h-8 border-amber-300"
                                            min="0"
                                        />
                                    </td>
                                </tr>
                                <tr className="bg-amber-50">
                                    <td className="border border-amber-300 px-3 py-2 text-base font-semibold">Total number
                                        of respondents (N)
                                    </td>
                                    <td className="border border-amber-300 px-3 py-2 text-base font-semibold">Total
                                        Participants
                                    </td>
                                    <td className="border border-amber-300 px-3 py-2 bg-amber-100">
                                        <div
                                            className="px-2 py-1 text-base text-amber-900 font-semibold h-8 flex items-center">{calculateTotalN() || "0"}</div>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Formula and PI Display */}
                    <div className="bg-amber-100 p-4 rounded border border-amber-300">
                        <p className="text-sm font-mono text-amber-900 mb-2">
                            PI = [ (f<sub>a</sub> × 0.2) + (f<sub>c</sub> × 0.4) + (f<sub>i</sub> × 0.6) +
                            (f<sub>col</sub> × 0.8) + (f<sub>emp</sub> × 1.0) ] / N
                        </p>
                        <p className="text-lg font-bold text-amber-900">PI = {pi || "....................."}</p>
                        <p className="text-lg font-bold text-amber-900 mt-2">PI%
                            = {pi ? (Number.parseFloat(pi) * 100).toFixed(2) + "%" : "....................."}</p>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="assumptions" className="text-amber-900 font-semibold">
                            Notes :
                        </Label>
                        <Textarea
                            id="assumptions"
                            value={assumptions}
                            onChange={(e) => setAssumptions(e.target.value)}
                            placeholder="Enter notes..."
                            rows={2}
                            className="border-amber-300"
                        />
                    </div>

                    {/* Data Collection Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="collected-by" className="text-amber-900 font-semibold">
                                Data Collected by :
                            </Label>
                            <Input
                                id="collected-by"
                                value={collectedBy}
                                onChange={(e) => setCollectedBy(e.target.value)}
                                placeholder="Name"
                                className="border-amber-300"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="collection-date" className="text-amber-900 font-semibold">
                                Date :
                            </Label>
                            <Input
                                id="collection-date"
                                type="date"
                                value={collectionDate}
                                onChange={(e) => setCollectionDate(e.target.value)}
                                className="border-amber-300"
                            />
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && <p className="text-red-600 text-sm">{error}</p>}

                    {/* Submit Button */}
                    <div className="flex gap-4">
                        {existingDetails ? (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditing(false)}
                                className="flex-1 border-amber-300 text-amber-700"
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => (window.location.href = `/project/${projectId}`)}
                                className="flex-1 border-amber-300 text-amber-700"
                                disabled={isLoading}
                            >
                                Back to Checklist
                            </Button>
                        )}
                        <Button type="submit" disabled={isLoading}
                                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white">
                            {isLoading ? "Saving..." : isCompleted ? "Update & Save" : "Save & Mark Complete"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
        
        {/* Image Viewer Dialog */}
        {viewerImage && (
            <ImageViewerDialog
                imageSrc={viewerImage.src}
                imageAlt={viewerImage.alt}
                open={viewerOpen}
                onOpenChange={setViewerOpen}
            />
        )}
    </>
    )
}
