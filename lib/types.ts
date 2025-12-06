export interface Project {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  sort_order: number
}

export interface ChecklistItem {
  id: string
  project_id: string
  category_id: string
  item_type: "analog" | "digital"
  title: string
  description: string | null
  is_completed: boolean
  created_at: string
  category?: Category
  item_details?: ItemDetail[]
}

export interface ItemDetail {
  id: string
  checklist_item_id: string
  activity: string | null
  image1_url: string | null
  image2_url: string | null
  image3_url: string | null
  image4_url: string | null
  total_participation_n: number | null
  attend_fa: number | null
  consult_fc: number | null
  involve_fi: number | null
  collaborate_fcol: number | null
  empower_femp: number | null
  calculated_pi: number | null
  assumptions: string | null
  data_collected_by: string | null
  collection_date: string | null
  created_at: string
  updated_at: string
}

export interface CategoryWithItems {
  category: Category
  analogItems: ChecklistItem[]
  digitalItems: ChecklistItem[]
}

// Default checklist items for each category
export const DEFAULT_CHECKLIST_ITEMS: Record<string, { analog: string[]; digital: string[] }> = {
  "GOAL SETTING": {
    analog: [
      "Problem framing/situation analysis",
      "Community needs inventory",
      "Draft broad goals (visioning)",
      "Define measurable objectives & evaluation metrics",
      "Stakeholder validation & prioritization",
    ],
    digital: [
      "Representative stakeholder identification & early inclusion",
      "Baseline geospatial & socio-economic data readiness",
      "Policy/decision-making alignment",
      "Privacy, legal & ethical constraints assessment",
    ],
  },
  PROGRAMMING: {
    analog: [
      "Detailed needs & site analysis",
      "Generate alternative program scenarios",
      "Technical/financial constraints & feasibility",
      "Define roles, tasks & timelines",
    ],
    digital: [
      "Technical readiness & interoperability planning",
      "Digital inclusion & capacity building plan",
      "Data governance setup (metadata, stewardship)",
      "Monitoring indicators (geospatial M&E)",
    ],
  },
  "CO-PRODUCTION": {
    analog: [
      "Design engagement plan",
      "Facilitated workshops / charrettes (iterative)",
      "Visualization & prototyping",
      "Consensus building, negotiation & conflict management",
      "Documenting inputs & feedback loops",
    ],
    digital: [
      "Usability & user centered interface",
      "Incorporation of local knowledge into geodata",
      "Real, visible feedback loops",
      "Moderation, facilitation & technical support during sessions",
      "Transparency & legitimacy of data handling",
    ],
  },
  IMPLEMENTATION: {
    analog: [
      "Phase definition & scheduling",
      "Facilitated workshops / charrettes (iterative)",
      "Procurement & contracting aligned with community goals",
      "On-site supervision with community oversight",
      "Monitoring, evaluation & adaptive adjustments",
      "Handover, maintenance & sustainability arrangements",
    ],
    digital: [
      "Integration of DPP outputs into formal decision",
      "Sustainability & funding for platforms",
      "Geospatial M&E & live updating",
      "Governance, accountability & open reporting",
    ],
  },
}
