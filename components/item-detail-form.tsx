"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, X, CheckCircle, Edit } from "lucide-react"
import type { ChecklistItem, ItemDetail } from "@/lib/types"

interface ItemDetailFormProps {
  item: ChecklistItem
  projectId: string
  existingDetails: ItemDetail | null
}

export function ItemDetailForm({ item, projectId, existingDetails }: ItemDetailFormProps) {
  const [isEditing, setIsEditing] = useState(!existingDetails) // Auto-edit if no existing details
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isCompleted, setIsCompleted] = useState(item.is_completed || false)

  // Form state - initialized from existingDetails
  const [activity, setActivity] = useState(existingDetails?.activity || "")
  const [image1, setImage1] = useState<File | null>(null)
  const [image2, setImage2] = useState<File | null>(null)
  const [image1Preview, setImage1Preview] = useState<string | null>(existingDetails?.image1_url || null)
  const [image2Preview, setImage2Preview] = useState<string | null>(existingDetails?.image2_url || null)

  // Participation values - initialized from existingDetails
  const [totalN, setTotalN] = useState(existingDetails?.total_participation_n?.toString() || "")
  const [fvh, setFvh] = useState(existingDetails?.very_high_participation_fvh?.toString() || "")
  const [fh, setFh] = useState(existingDetails?.high_participation_fh?.toString() || "")
  const [fn, setFn] = useState(existingDetails?.normal_participation_fn?.toString() || "")
  const [fl, setFl] = useState(existingDetails?.low_participation_fl?.toString() || "")
  const [fvl, setFvl] = useState(existingDetails?.very_low_participation_fvl?.toString() || "")

  const [assumptions, setAssumptions] = useState(existingDetails?.assumptions || "")
  const [collectedBy, setCollectedBy] = useState(existingDetails?.data_collected_by || "")
  const [collectionDate, setCollectionDate] = useState(existingDetails?.collection_date || "")

  // Calculate PI
  const calculatePI = useCallback(() => {
    const n = Number.parseFloat(totalN) || 0
    const veryHigh = Number.parseFloat(fvh) || 0
    const high = Number.parseFloat(fh) || 0
    const normal = Number.parseFloat(fn) || 0
    const low = Number.parseFloat(fl) || 0
    const veryLow = Number.parseFloat(fvl) || 0

    if (n === 0) return null

    const pi = (veryHigh * 1 + high * 0.8 + normal * 0.6 + low * 0.4 + veryLow * 0.2) / n
    return pi.toFixed(4)
  }, [totalN, fvh, fh, fn, fl, fvl])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, imageNum: 1 | 2) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (imageNum === 1) {
          setImage1(file)
          setImage1Preview(reader.result as string)
        } else {
          setImage2(file)
          setImage2Preview(reader.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = (imageNum: 1 | 2) => {
    if (imageNum === 1) {
      setImage1(null)
      setImage1Preview(null)
    } else {
      setImage2(null)
      setImage2Preview(null)
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

      // Upload images if new ones were selected
      if (image1) {
        const fileName = `${item.id}-1-${Date.now()}.${image1.name.split(".").pop()}`
        const { error: uploadError } = await supabase.storage.from("participation-images").upload(fileName, image1)

        if (uploadError) {
          // If bucket doesn't exist, store as base64
          image1Url = image1Preview
        } else {
          const { data: urlData } = supabase.storage.from("participation-images").getPublicUrl(fileName)
          image1Url = urlData.publicUrl
        }
      }

      if (image2) {
        const fileName = `${item.id}-2-${Date.now()}.${image2.name.split(".").pop()}`
        const { error: uploadError } = await supabase.storage.from("participation-images").upload(fileName, image2)

        if (uploadError) {
          image2Url = image2Preview
        } else {
          const { data: urlData } = supabase.storage.from("participation-images").getPublicUrl(fileName)
          image2Url = urlData.publicUrl
        }
      }

      const calculatedPi = calculatePI()

      const detailsData = {
        checklist_item_id: item.id,
        activity: activity || null,
        image1_url: image1Url,
        image2_url: image2Url,
        total_participation_n: totalN ? Number.parseFloat(totalN) : null,
        very_high_participation_fvh: fvh ? Number.parseFloat(fvh) : null,
        high_participation_fh: fh ? Number.parseFloat(fh) : null,
        normal_participation_fn: fn ? Number.parseFloat(fn) : null,
        low_participation_fl: fl ? Number.parseFloat(fl) : null,
        very_low_participation_fvl: fvl ? Number.parseFloat(fvl) : null,
        calculated_pi: calculatedPi ? Number.parseFloat(calculatedPi) : null,
        assumptions: assumptions || null,
        data_collected_by: collectedBy || null,
        collection_date: collectionDate || null,
        updated_at: new Date().toISOString(),
      }

      if (existingDetails?.id) {
        // Update existing details
        const { error: updateError } = await supabase
          .from("item_details")
          .update(detailsData)
          .eq("id", existingDetails.id)

        if (updateError) throw updateError
      } else {
        // Insert new details
        const { error: insertError } = await supabase.from("item_details").insert(detailsData)

        if (insertError) throw insertError
      }

      // Mark checklist item as completed
      const { error: itemError } = await supabase
        .from("checklist_items")
        .update({ is_completed: true })
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
      <Card className="border-amber-300">
        <CardContent className="p-6 space-y-6">
          {/* Edit Button */}
          <div className="flex justify-end">
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Details
            </Button>
          </div>

          {isCompleted && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">This item has been completed</span>
            </div>
          )}

          {/* Description based on category */}
          <div className="bg-amber-50 p-4 rounded border border-amber-200">
            <p className="text-sm text-amber-800">
              {item.category?.name === "GOAL SETTING" &&
                "Gather background, social and physical context, and stakeholders affected."}
              {item.category?.name === "PROGRAMMING" &&
                "Surveys, mapping, functional requirements, context restrictions."}
              {item.category?.name === "CO-PRODUCTION" && "Document engagement activities and participant feedback."}
              {item.category?.name === "IMPLEMENTATION" && "Track implementation progress and community involvement."}
            </p>
          </div>

          {/* Activity Description */}
          <div className="space-y-2">
            <Label className="text-amber-900 font-semibold">Activity :</Label>
            <div className="border border-amber-300 rounded-md p-3 bg-white min-h-[80px]">
              <p className="text-sm text-amber-900 whitespace-pre-wrap">{activity || "No activity description"}</p>
            </div>
          </div>

          {/* Images Display */}
          <div className="grid grid-cols-2 gap-4">
            {/* Image 1 */}
            <div className="space-y-2">
              <Label className="text-amber-900 font-semibold">Image 1</Label>
              <div className="border border-amber-300 rounded-lg p-4 text-center min-h-[150px] flex items-center justify-center bg-white">
                {image1Preview ? (
                  <img
                    src={image1Preview || "/placeholder.svg"}
                    alt="Image 1"
                    className="max-h-[120px] mx-auto object-contain"
                  />
                ) : (
                  <span className="text-sm text-amber-600">No image uploaded</span>
                )}
              </div>
            </div>

            {/* Image 2 */}
            <div className="space-y-2">
              <Label className="text-amber-900 font-semibold">Image 2</Label>
              <div className="border border-amber-300 rounded-lg p-4 text-center min-h-[150px] flex items-center justify-center bg-white">
                {image2Preview ? (
                  <img
                    src={image2Preview || "/placeholder.svg"}
                    alt="Image 2"
                    className="max-h-[120px] mx-auto object-contain"
                  />
                ) : (
                  <span className="text-sm text-amber-600">No image uploaded</span>
                )}
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
                    <th className="border border-amber-300 px-3 py-2 text-left text-sm text-amber-900">Level</th>
                    <th className="border border-amber-300 px-3 py-2 text-left text-sm text-amber-900">Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-amber-300 px-3 py-2 text-sm">Total participation(N)</td>
                    <td className="border border-amber-300 px-3 py-2 bg-amber-50">
                      <div className="px-2 py-1 text-sm text-amber-900">{totalN || "-"}</div>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-amber-300 px-3 py-2 text-sm">Very high participation(fvh)</td>
                    <td className="border border-amber-300 px-3 py-2 bg-amber-50">
                      <div className="px-2 py-1 text-sm text-amber-900">{fvh || "-"}</div>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-amber-300 px-3 py-2 text-sm">High participation(fh)</td>
                    <td className="border border-amber-300 px-3 py-2 bg-amber-50">
                      <div className="px-2 py-1 text-sm text-amber-900">{fh || "-"}</div>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-amber-300 px-3 py-2 text-sm">Normal participation (fn)</td>
                    <td className="border border-amber-300 px-3 py-2 bg-amber-50">
                      <div className="px-2 py-1 text-sm text-amber-900">{fn || "-"}</div>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-amber-300 px-3 py-2 text-sm">Low participation(fl)</td>
                    <td className="border border-amber-300 px-3 py-2 bg-amber-50">
                      <div className="px-2 py-1 text-sm text-amber-900">{fl || "-"}</div>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-amber-300 px-3 py-2 text-sm">Very low participation(fvl)</td>
                    <td className="border border-amber-300 px-3 py-2 bg-amber-50">
                      <div className="px-2 py-1 text-sm text-amber-900">{fvl || "-"}</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Formula and PI Display */}
          <div className="bg-amber-100 p-4 rounded border border-amber-300">
            <p className="text-sm font-mono text-amber-900 mb-2">
              PI = [ (fvh x 1) + (fh x 0.8) + (fn x 0.6) + (fl x 0.4) + (fvl x 0.2) ] / N
            </p>
            <p className="text-lg font-bold text-amber-900">PI = {pi || "....................."}</p>
          </div>

          {/* Assumptions */}
          <div className="space-y-2">
            <Label className="text-amber-900 font-semibold">Assumptions :</Label>
            <div className="border border-amber-300 rounded-md p-3 bg-white min-h-[60px]">
              <p className="text-sm text-amber-900 whitespace-pre-wrap">{assumptions || "No assumptions provided"}</p>
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
    )
  }

  // Edit form view
  return (
    <form onSubmit={handleSubmit}>
      <Card className="border-amber-300">
        <CardContent className="p-6 space-y-6">
          {success && (
            <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>Data saved successfully! Item marked as complete.</span>
            </div>
          )}

          {isCompleted && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">This item has been completed</span>
            </div>
          )}

          {/* Description based on category */}
          <div className="bg-amber-50 p-4 rounded border border-amber-200">
            <p className="text-sm text-amber-800">
              {item.category?.name === "GOAL SETTING" &&
                "Gather background, social and physical context, and stakeholders affected."}
              {item.category?.name === "PROGRAMMING" &&
                "Surveys, mapping, functional requirements, context restrictions."}
              {item.category?.name === "CO-PRODUCTION" && "Document engagement activities and participant feedback."}
              {item.category?.name === "IMPLEMENTATION" && "Track implementation progress and community involvement."}
            </p>
          </div>

          {/* Activity Description */}
          <div className="space-y-2">
            <Label htmlFor="activity" className="text-amber-900 font-semibold">
              Activity :
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
          <div className="grid grid-cols-2 gap-4">
            {/* Image 1 */}
            <div className="space-y-2">
              <Label className="text-amber-900 font-semibold">Image 1</Label>
              <div className="border-2 border-dashed border-amber-300 rounded-lg p-4 text-center min-h-[150px] flex items-center justify-center relative">
                {image1Preview ? (
                  <div className="relative w-full h-full">
                    <img
                      src={image1Preview || "/placeholder.svg"}
                      alt="Image 1"
                      className="max-h-[120px] mx-auto object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(1)}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center">
                    <Upload className="w-8 h-8 text-amber-400" />
                    <span className="text-sm text-amber-600 mt-2">Click to upload</span>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 1)} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            {/* Image 2 */}
            <div className="space-y-2">
              <Label className="text-amber-900 font-semibold">Image 2</Label>
              <div className="border-2 border-dashed border-amber-300 rounded-lg p-4 text-center min-h-[150px] flex items-center justify-center relative">
                {image2Preview ? (
                  <div className="relative w-full h-full">
                    <img
                      src={image2Preview || "/placeholder.svg"}
                      alt="Image 2"
                      className="max-h-[120px] mx-auto object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(2)}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center">
                    <Upload className="w-8 h-8 text-amber-400" />
                    <span className="text-sm text-amber-600 mt-2">Click to upload</span>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 2)} className="hidden" />
                  </label>
                )}
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
                    <th className="border border-amber-300 px-3 py-2 text-left text-sm text-amber-900">Level</th>
                    <th className="border border-amber-300 px-3 py-2 text-left text-sm text-amber-900">Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-amber-300 px-3 py-2 text-sm">Total participation(N)</td>
                    <td className="border border-amber-300 px-3 py-2">
                      <Input
                        type="number"
                        value={totalN}
                        onChange={(e) => setTotalN(e.target.value)}
                        className="h-8 border-amber-300"
                        min="0"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-amber-300 px-3 py-2 text-sm">Very high participation(fvh)</td>
                    <td className="border border-amber-300 px-3 py-2">
                      <Input
                        type="number"
                        value={fvh}
                        onChange={(e) => setFvh(e.target.value)}
                        className="h-8 border-amber-300"
                        min="0"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-amber-300 px-3 py-2 text-sm">High participation(fh)</td>
                    <td className="border border-amber-300 px-3 py-2">
                      <Input
                        type="number"
                        value={fh}
                        onChange={(e) => setFh(e.target.value)}
                        className="h-8 border-amber-300"
                        min="0"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-amber-300 px-3 py-2 text-sm">Normal participation (fn)</td>
                    <td className="border border-amber-300 px-3 py-2">
                      <Input
                        type="number"
                        value={fn}
                        onChange={(e) => setFn(e.target.value)}
                        className="h-8 border-amber-300"
                        min="0"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-amber-300 px-3 py-2 text-sm">Low participation(fl)</td>
                    <td className="border border-amber-300 px-3 py-2">
                      <Input
                        type="number"
                        value={fl}
                        onChange={(e) => setFl(e.target.value)}
                        className="h-8 border-amber-300"
                        min="0"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-amber-300 px-3 py-2 text-sm">Very low participation(fvl)</td>
                    <td className="border border-amber-300 px-3 py-2">
                      <Input
                        type="number"
                        value={fvl}
                        onChange={(e) => setFvl(e.target.value)}
                        className="h-8 border-amber-300"
                        min="0"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Formula and PI Display */}
          <div className="bg-amber-100 p-4 rounded border border-amber-300">
            <p className="text-sm font-mono text-amber-900 mb-2">
              PI = [ (fvh x 1) + (fh x 0.8) + (fn x 0.6) + (fl x 0.4) + (fvl x 0.2) ] / N
            </p>
            <p className="text-lg font-bold text-amber-900">PI = {pi || "....................."}</p>
          </div>

          {/* Assumptions */}
          <div className="space-y-2">
            <Label htmlFor="assumptions" className="text-amber-900 font-semibold">
              Assumptions :
            </Label>
            <Textarea
              id="assumptions"
              value={assumptions}
              onChange={(e) => setAssumptions(e.target.value)}
              placeholder="Enter assumptions..."
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
            <Button type="submit" disabled={isLoading} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white">
              {isLoading ? "Saving..." : isCompleted ? "Update & Save" : "Save & Mark Complete"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
