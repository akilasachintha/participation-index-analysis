"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { X, ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImageViewerDialogProps {
  imageSrc: string
  imageAlt: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImageViewerDialog({ imageSrc, imageAlt, open, onOpenChange }: ImageViewerDialogProps) {
  const [zoom, setZoom] = useState(100)

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full h-[90vh] p-0 gap-0">
        <DialogTitle className="sr-only">{imageAlt}</DialogTitle>
        <DialogDescription className="sr-only">
          Image viewer for {imageAlt}
        </DialogDescription>
        
        {/* Floating Controls */}
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-2 border border-amber-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoom <= 50}
            className="h-8 w-8 p-0 hover:bg-amber-100 disabled:opacity-50"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-amber-900 font-medium min-w-12 text-center">{zoom}%</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoom >= 200}
            className="h-8 w-8 p-0 hover:bg-amber-100 disabled:opacity-50"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-amber-200 mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 p-0 hover:bg-amber-100"
            title="Close"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Title */}
        <div className="px-6 pt-6 pb-3">
          <h3 className="text-lg font-semibold text-amber-900">{imageAlt}</h3>
        </div>

        {/* Image container */}
        <div className="flex-1 overflow-auto bg-amber-50 px-6 pb-6">
          <div className="flex items-center justify-center min-h-full">
            <img
              src={imageSrc}
              alt={imageAlt}
              style={{ width: `${zoom}%`, height: 'auto' }}
              className="max-w-none transition-all duration-200"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
