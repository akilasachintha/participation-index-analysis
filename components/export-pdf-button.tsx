"use client"

import {useState} from "react"
import {FileDown, Loader2} from "lucide-react"
import {Button} from "@/components/ui/button"

interface ExportPdfButtonProps {
    projectId: string
    projectName: string
}

export function ExportPdfButton({projectId, projectName}: ExportPdfButtonProps) {
    const [isExporting, setIsExporting] = useState(false)

    const handleExport = async () => {
        setIsExporting(true)

        // Open the print-friendly page in a new window
        const printWindow = window.open(`/project/${projectId}/export`, "_blank", "width=1200,height=800")

        if (printWindow) {
            printWindow.onload = () => {
                setTimeout(() => {
                    printWindow.print()
                    setIsExporting(false)
                }, 1000)
            }
        } else {
            setIsExporting(false)
        }
    }

    return (
        <Button onClick={handleExport} disabled={isExporting} className="bg-amber-600 hover:bg-amber-700 text-white">
            {isExporting ? (
                <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin"/>
                    Preparing...
                </>
            ) : (
                <>
                    <FileDown className="w-4 h-4 mr-2"/>
                    Export PDF
                </>
            )}
        </Button>
    )
}
