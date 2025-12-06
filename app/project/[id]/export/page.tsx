import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import type { Category, ChecklistItem, CategoryWithItems, ItemDetail } from "@/lib/types"
import { PrintButton } from "@/components/print-button"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ExportPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch project
  const { data: project, error: projectError } = await supabase.from("projects").select("*").eq("id", id).single()

  if (projectError || !project) {
    notFound()
  }

  // Fetch categories
  const { data: categories } = await supabase.from("categories").select("*").order("sort_order")

  // Fetch checklist items with their details
  const { data: checklistItems } = await supabase
    .from("checklist_items")
    .select(`
      *,
      category:categories(*),
      item_details(*)
    `)
    .eq("project_id", id)

  // Organize items by category
  const categorizedItems: CategoryWithItems[] = (categories || []).map((category: Category) => {
    const items = (checklistItems || []).filter((item: ChecklistItem) => item.category_id === category.id)
    return {
      category,
      analogItems: items.filter((item: ChecklistItem) => item.item_type === "analog"),
      digitalItems: items.filter((item: ChecklistItem) => item.item_type === "digital"),
    }
  })

  // Get all items with details for the detail pages (not just completed ones)
  const itemsWithDetails = (checklistItems || []).filter(
    (item: ChecklistItem) => item.item_details && item.item_details.length > 0,
  )

  return (
    <html>
      <head>
        <title>{project.name} - Participation Index Analysis</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>{`
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .page-break { page-break-before: always; }
            @page { margin: 1cm; size: A4; }
            .container { max-width: 100%; padding: 0; }
          }
          
          * { box-sizing: border-box; }
          
          body { 
            font-family: system-ui, -apple-system, sans-serif; 
            margin: 0; 
            padding: 16px; 
            background: #fffbeb; 
            line-height: 1.5;
          }
          
          .container { 
            max-width: 900px; 
            margin: 0 auto; 
            width: 100%;
          }
          
          .header { 
            background: linear-gradient(135deg, #d97706, #b45309); 
            color: white; 
            padding: 20px; 
            border-radius: 8px; 
            margin-bottom: 20px; 
          }
          .header h1 { 
            margin: 0 0 12px 0; 
            font-size: clamp(20px, 5vw, 28px); 
            word-wrap: break-word;
          }
          .header p { 
            margin: 6px 0; 
            opacity: 0.95; 
            font-size: clamp(13px, 3vw, 15px);
            word-wrap: break-word;
          }
          
          .section-title { 
            background: #fef3c7; 
            padding: 12px 16px; 
            border-left: 4px solid #d97706; 
            margin: 20px 0 16px 0; 
            font-weight: 600; 
            color: #78350f; 
            font-size: clamp(14px, 3.5vw, 16px);
            word-wrap: break-word;
          }
          
          table { 
            width: 100%; 
            border-collapse: collapse; 
            background: white; 
            margin-bottom: 20px; 
            overflow-x: auto;
            display: block;
          }
          
          @media (min-width: 768px) {
            table { display: table; }
          }
          
          thead, tbody, tr { display: table; width: 100%; table-layout: fixed; }
          
          th, td { 
            border: 1px solid #fbbf24; 
            padding: 10px 8px; 
            text-align: left; 
            vertical-align: top; 
            font-size: clamp(12px, 2.5vw, 14px);
            word-wrap: break-word;
          }
          
          th { 
            background: #fef3c7; 
            color: #78350f; 
            font-weight: 600; 
          }
          
          .category-cell { 
            background: #fde68a; 
            writing-mode: vertical-rl; 
            text-orientation: mixed; 
            transform: rotate(180deg); 
            font-weight: bold; 
            color: #78350f; 
            min-width: 40px; 
            width: 40px;
            text-align: center; 
            padding: 8px 4px;
          }
          
          .check { 
            display: inline-block; 
            width: 14px; 
            height: 14px; 
            border: 2px solid #fbbf24; 
            margin-right: 6px; 
            vertical-align: middle; 
            flex-shrink: 0;
          }
          .check.completed { 
            background: #22c55e; 
            border-color: #22c55e; 
            color: white;
            text-align: center;
            line-height: 10px;
            font-size: 10px;
          }
          
          .item { 
            display: flex; 
            align-items: flex-start; 
            margin-bottom: 6px; 
            font-size: clamp(12px, 2.5vw, 14px);
          }
          
          .detail-card { 
            background: white; 
            border: 1px solid #fbbf24; 
            border-radius: 8px; 
            padding: 16px; 
            margin-bottom: 20px; 
          }
          
          .detail-header { 
            background: #fef3c7; 
            margin: -16px -16px 16px -16px; 
            padding: 14px 16px; 
            border-radius: 8px 8px 0 0; 
            border-bottom: 1px solid #fbbf24; 
          }
          .detail-header h3 { 
            margin: 0; 
            color: #78350f; 
            font-size: clamp(14px, 3.5vw, 16px);
            word-wrap: break-word;
          }
          .detail-header .category { 
            font-size: clamp(11px, 2.5vw, 12px); 
            color: #92400e; 
            margin-top: 4px; 
          }
          
          .detail-grid { 
            display: grid; 
            grid-template-columns: 1fr; 
            gap: 12px; 
            margin-bottom: 16px; 
          }
          
          @media (min-width: 640px) {
            .detail-grid { grid-template-columns: 1fr 1fr; }
          }
          
          .detail-label { 
            font-size: clamp(11px, 2.5vw, 12px); 
            color: #92400e; 
            margin-bottom: 4px; 
            font-weight: 600;
          }
          .detail-value { 
            font-size: clamp(12px, 3vw, 14px); 
            color: #78350f; 
            word-wrap: break-word;
          }
          
          .formula-box { 
            background: #fef3c7; 
            padding: 14px; 
            border-radius: 8px; 
            margin-top: 16px; 
          }
          .formula { 
            font-family: monospace; 
            font-size: clamp(11px, 2.8vw, 14px); 
            color: #78350f; 
            word-wrap: break-word;
            overflow-x: auto;
          }
          .pi-result { 
            font-size: clamp(18px, 5vw, 24px); 
            font-weight: bold; 
            color: #d97706; 
            margin-top: 8px; 
          }
          
          .images-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 16px; 
            margin-top: 20px;
            margin-bottom: 20px;
          }
          
          @media (min-width: 768px) {
            .images-grid { 
              grid-template-columns: 1fr 1fr 1fr 1fr;
              gap: 20px;
            }
          }
          
          .image-box { 
            border: 2px solid #fbbf24; 
            border-radius: 8px; 
            overflow: hidden; 
            aspect-ratio: 1; 
            background: white; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            padding: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          
          .image-box img { 
            max-width: 100%; 
            max-height: 100%; 
            object-fit: contain; 
            width: 100%;
            height: 100%;
          }
          
          .participation-table { 
            width: 100%; 
            margin-top: 16px; 
            overflow-x: auto;
            display: block;
          }
          
          @media (min-width: 768px) {
            .participation-table { display: table; }
          }
          
          .participation-table thead,
          .participation-table tbody,
          .participation-table tr { 
            display: table; 
            width: 100%; 
            table-layout: fixed; 
          }
          
          .participation-table th { 
            background: #fef3c7; 
            font-size: clamp(10px, 2.2vw, 12px); 
            padding: 8px 4px;
          }
          .participation-table td { 
            text-align: center; 
            font-size: clamp(11px, 2.5vw, 14px); 
            padding: 8px 4px;
          }
          
          @media print { 
            button { display: none; } 
            body { padding: 0; }
            .container { padding: 0; }
          }
          
          @media (max-width: 480px) {
            body { padding: 12px; }
            .header { padding: 16px; }
            .detail-card { padding: 12px; }
            .detail-header { margin: -12px -12px 12px -12px; padding: 12px; }
          }
        `}</style>
      </head>
      <body>
        <PrintButton />

        <div className="container">
          {/* Cover Page */}
          <div className="header">
            <h1>Participation Index Analysis</h1>
            <p>
              <strong>Project:</strong> {project.name}
            </p>
            {project.description && (
              <p>
                <strong>Description:</strong> {project.description}
              </p>
            )}
            <p>
              <strong>Generated:</strong> {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Page 1 - Checklist Table */}
          <div className="section-title">Page 1 - Checklist Overview</div>

          <table>
            <thead>
              <tr>
                <th style={{ width: "60px" }}>Category</th>
                <th>ANALOG</th>
                <th>DIGITAL</th>
              </tr>
            </thead>
            <tbody>
              {categorizedItems.map((categoryData) => (
                <tr key={categoryData.category.id}>
                  <td className="category-cell">{categoryData.category.name}</td>
                  <td>
                    {categoryData.analogItems.map((item) => (
                      <div key={item.id} className="item">
                        <span className={`check ${item.is_completed ? "completed" : ""}`}>
                          {item.is_completed && "✓"}
                        </span>
                        <span>{item.title}</span>
                      </div>
                    ))}
                  </td>
                  <td>
                    {categoryData.digitalItems.map((item) => (
                      <div key={item.id} className="item">
                        <span className={`check ${item.is_completed ? "completed" : ""}`}>
                          {item.is_completed && "✓"}
                        </span>
                        <span>{item.title}</span>
                      </div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Formula Reference */}
          <div className="formula-box">
            <div className="detail-label">Participation Index Formula</div>
            <div className="formula">PI = [ (fvh × 1) + (fh × 0.8) + (fn × 0.6) + (fl × 0.4) + (fvl × 0.2) ] / N</div>
          </div>

          {/* Detail Pages for Items with Details */}
          {itemsWithDetails.length > 0 && (
            <>
              <div className="page-break"></div>
              <div className="section-title">Item Details</div>

              {itemsWithDetails.map((item: ChecklistItem) => {
                const detail = item.item_details?.[0] as ItemDetail | undefined
                if (!detail) return null

                return (
                  <div key={item.id} className="detail-card">
                    <div className="detail-header">
                      <h3>{item.title}</h3>
                      <div className="category">
                        {item.category?.name} - {item.item_type?.toUpperCase()}
                      </div>
                    </div>

                    {item.description && (
                      <div style={{ marginBottom: "16px" }}>
                        <div className="detail-label">Description</div>
                        <div className="detail-value" style={{ whiteSpace: "pre-wrap" }}>{item.description}</div>
                      </div>
                    )}

                    {detail.activity && (
                      <div style={{ marginBottom: "16px" }}>
                        <div className="detail-label">Activity</div>
                        <div className="detail-value">{detail.activity}</div>
                      </div>
                    )}

                    {/* Images */}
                    {(detail.image1_url || detail.image2_url || detail.image3_url || detail.image4_url) && (
                      <>
                        <div className="detail-label" style={{ marginTop: "20px", fontSize: "14px" }}>Images</div>
                        <div className="images-grid">
                          <div className="image-box">
                            {detail.image1_url ? (
                              <img src={detail.image1_url || "/placeholder.svg"} alt="Image 1" />
                            ) : (
                              <div style={{ color: "#92400e", fontSize: "12px", textAlign: "center" }}>No image</div>
                            )}
                          </div>
                          <div className="image-box">
                            {detail.image2_url ? (
                              <img src={detail.image2_url || "/placeholder.svg"} alt="Image 2" />
                            ) : (
                              <div style={{ color: "#92400e", fontSize: "12px", textAlign: "center" }}>No image</div>
                            )}
                          </div>
                          <div className="image-box">
                            {detail.image3_url ? (
                              <img src={detail.image3_url || "/placeholder.svg"} alt="Image 3" />
                            ) : (
                              <div style={{ color: "#92400e", fontSize: "12px", textAlign: "center" }}>No image</div>
                            )}
                          </div>
                          <div className="image-box">
                            {detail.image4_url ? (
                              <img src={detail.image4_url || "/placeholder.svg"} alt="Image 4" />
                            ) : (
                              <div style={{ color: "#92400e", fontSize: "12px", textAlign: "center" }}>No image</div>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Participation Table */}
                    <table className="participation-table">
                      <thead>
                        <tr>
                          <th>Total (N)</th>
                          <th>Attend (fa)</th>
                          <th>Consult (fc)</th>
                          <th>Involve (fi)</th>
                          <th>Collaborate (fcol)</th>
                          <th>Empower (femp)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>{detail.total_participation_n ?? "-"}</td>
                          <td>{detail.attend_fa ?? "-"}</td>
                          <td>{detail.consult_fc ?? "-"}</td>
                          <td>{detail.involve_fi ?? "-"}</td>
                          <td>{detail.collaborate_fcol ?? "-"}</td>
                          <td>{detail.empower_femp ?? "-"}</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* PI Result */}
                    {detail.calculated_pi !== null && (
                      <div className="formula-box">
                        <div className="detail-label">Calculated Participation Index</div>
                        <div className="pi-result">PI = {detail.calculated_pi?.toFixed(4)}</div>
                      </div>
                    )}

                    {/* Additional Info */}
                    <div className="detail-grid" style={{ marginTop: "16px" }}>
                      {detail.assumptions && (
                        <div>
                          <div className="detail-label">Assumptions</div>
                          <div className="detail-value">{detail.assumptions}</div>
                        </div>
                      )}
                      {detail.data_collected_by && (
                        <div>
                          <div className="detail-label">Data Collected By</div>
                          <div className="detail-value">{detail.data_collected_by}</div>
                        </div>
                      )}
                      {detail.collection_date && (
                        <div>
                          <div className="detail-label">Collection Date</div>
                          <div className="detail-value">{new Date(detail.collection_date).toLocaleDateString()}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>

        <script
          dangerouslySetInnerHTML={{
            __html: `
          document.querySelector('.print-btn').addEventListener('click', function() {
            window.print();
          });
        `,
          }}
        />
      </body>
    </html>
  )
}
