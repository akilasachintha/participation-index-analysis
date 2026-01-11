import {CircularProcessFlow} from "@/components/circular-process-flow"

interface CircularProcessFlowWrapperProps {
    projectId: string
}

export function CircularProcessFlowWrapper({ projectId }: CircularProcessFlowWrapperProps) {
    return <CircularProcessFlow projectId={projectId} />
}