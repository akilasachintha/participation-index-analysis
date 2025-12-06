"use client"

export function PrintButton() {
    return (
        <button
            className="print-btn"
            onClick={() => window.print()}
            style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                background: '#d97706',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.background = '#b45309'
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.background = '#d97706'
            }}
        >
            Print / Save PDF
        </button>
    )
}
