import { useState, useMemo, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './ScoreChart.css'

export default function ScoreChart({ practices }) {
    const [filter, setFilter] = useState('all') // 'all', 'module-a', 'module-b', 'module-c', 'simulation'
    const [hoveredPoint, setHoveredPoint] = useState(null)

    // Filter and sort practices
    const filteredPractices = useMemo(() => {
        let filtered = practices
            .filter(p => p.status === 'completed' && p.totalScore != null)
            .sort((a, b) => new Date(a.completedAt || a.startedAt) - new Date(b.completedAt || b.startedAt))

        if (filter !== 'all') {
            filtered = filtered.filter(p => p.type === filter)
        }

        return filtered
    }, [practices, filter])

    const containerRef = useRef(null)
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

    useEffect(() => {
        if (!containerRef.current) return

        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                setDimensions({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height
                })
            }
        })

        resizeObserver.observe(containerRef.current)
        return () => resizeObserver.disconnect()
    }, [])

    // Chart dimensions

    const currentWidth = dimensions.width || 800 // Fallback width
    const currentHeight = dimensions.height || 360
    // Adjust padding based on width to keep it consistent
    // Adjust padding based on width for mobile responsiveness
    const isMobile = currentWidth < 600
    const padding = {
        top: 40,
        right: isMobile ? 30 : 60,
        bottom: 50,
        left: isMobile ? 30 : 60
    }

    // Calculate scales
    const { points, xLabels } = useMemo(() => {
        if (filteredPractices.length === 0) {
            return { points: [], xLabels: [] }
        }

        const minScore = 0
        const maxScore = 100

        // Calculate x positions (evenly spaced)
        const usableWidth = currentWidth - padding.left - padding.right
        const usableHeight = currentHeight - padding.top - padding.bottom

        const points = filteredPractices.map((practice, index) => {
            const count = Math.max(filteredPractices.length - 1, 1)
            const x = padding.left + (index / count) * usableWidth
            const y = padding.top + usableHeight - ((practice.totalScore - minScore) / (maxScore - minScore)) * usableHeight

            return {
                x,
                xNum: x,
                y,
                practice,
                date: new Date(practice.completedAt || practice.startedAt)
            }
        })

        // Generate x-axis labels - unique dates only
        const uniqueDates = new Map()
        points.forEach(point => {
            const dateKey = formatDate(point.date)
            if (!uniqueDates.has(dateKey)) {
                uniqueDates.set(dateKey, point.xNum)
            }
        })
        const xLabels = Array.from(uniqueDates.entries()).map(([label, x]) => ({ x, label }))

        return { points, xLabels }
    }, [filteredPractices, currentWidth, currentHeight])

    // Format date for display
    function formatDate(date) {
        return `${date.getDate()}/${date.getMonth() + 1}`
    }

    // Format full date for tooltip
    function formatFullDate(date) {
        return date.toLocaleDateString('he-IL', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    // Get practice type label
    function getTypeLabel(type) {
        switch (type) {
            case 'module-a': return 'Module A'
            case 'module-b': return 'Module B'
            case 'module-c': return 'Module C'
            case 'simulation': return 'סימולציה'
            default: return type
        }
    }

    // Get point color based on type
    function getPointColor(type) {
        switch (type) {
            case 'module-a': return '#3B82F6' // Blue
            case 'module-b': return '#10B981' // Green
            case 'module-c': return '#F59E0B' // Amber
            case 'simulation': return '#8B5CF6' // Purple
            default: return '#6B7280'
        }
    }

    // Generate line path
    const linePath = useMemo(() => {
        if (points.length < 2) return ''

        return points.map((point, i) => {
            const command = i === 0 ? 'M' : 'L'
            return `${command} ${point.xNum} ${point.y}`
        }).join(' ')
    }, [points])

    const filterOptions = [
        { value: 'all', label: 'הכל' },
        { value: 'module-a', label: 'Module A' },
        { value: 'module-b', label: 'Module B' },
        { value: 'module-c', label: 'Module C' },
        { value: 'simulation', label: 'סימולציה' }
    ]

    if (practices.length === 0) {
        return (
            <div className="score-chart-container card">
                <div className="chart-header">
                    <h3 className="chart-title">📈 גרף התקדמות</h3>
                </div>
                <div className="chart-empty">
                    <p>עדיין לא התחלת לתרגל, אין מה להציג.</p>
                    <p className="chart-empty-sub">בוא נתחיל את התרגול הראשון!</p>
                    <Link to="/practice" className="chart-empty-btn">התחל לתרגל</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="score-chart-container card">
            <div className="chart-header">
                <h3 className="chart-title">📈 גרף התקדמות</h3>
                <div className="chart-filters">
                    {filterOptions.map(opt => (
                        <button
                            key={opt.value}
                            className={`filter-btn ${filter === opt.value ? 'active' : ''}`}
                            onClick={() => setFilter(opt.value)}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="chart-wrapper" ref={containerRef}>
                {filteredPractices.length === 0 ? (
                    <div className="chart-empty">
                        <p>עדיין לא תרגלת מודול זה.</p>
                        <p className="chart-empty-sub">בוא נתחיל את התרגול הראשון!</p>
                        <Link to="/practice" className="chart-empty-btn">התחל לתרגל</Link>
                    </div>
                ) : (
                    <svg
                        className="line-chart"
                        viewBox={`0 0 ${currentWidth} ${currentHeight}`}
                        style={{ overflow: 'visible' }}
                    >
                        {/* Y-axis grid lines and labels */}
                        {[0, 25, 50, 75, 100].map(score => {
                            const y = padding.top + (currentHeight - padding.top - padding.bottom) - (score / 100) * (currentHeight - padding.top - padding.bottom)
                            return (
                                <g key={score}>
                                    <line
                                        x1={padding.left}
                                        y1={y}
                                        x2={currentWidth - padding.right}
                                        y2={y}
                                        className="grid-line"
                                    />
                                    <text
                                        x={padding.left - 10}
                                        y={y + 4}
                                        className="axis-label y-label"
                                    >
                                        {score}
                                    </text>
                                </g>
                            )
                        })}

                        {/* X-axis labels - all dates */}
                        {xLabels.map((label, i) => (
                            <text
                                key={i}
                                x={label.x}
                                y={currentHeight - 10}
                                className="axis-label x-label"
                                textAnchor="middle"
                            >
                                {label.label}
                            </text>
                        ))}

                        {/* Line connecting points */}
                        {points.length > 1 && (
                            <polyline
                                points={points.map(p => `${p.xNum},${p.y}`).join(' ')}
                                className="chart-line"
                            />
                        )}

                        {/* Data points - subtle */}
                        {points.map((point, i) => (
                            <circle
                                key={i}
                                cx={point.x}
                                cy={point.y}
                                r={hoveredPoint === i ? 8 : 5}
                                className="data-point"
                                style={{ fill: getPointColor(point.practice.type) }}
                                onMouseEnter={() => setHoveredPoint(i)}
                                onMouseLeave={() => setHoveredPoint(null)}
                            />
                        ))}
                    </svg>
                )}

                {/* Tooltip */}
                {hoveredPoint !== null && points[hoveredPoint] && (
                    <div
                        className="chart-tooltip"
                        style={{
                            left: points[hoveredPoint].x,
                            top: points[hoveredPoint].y
                        }}
                    >
                        <div className="tooltip-header">
                            <span
                                className="tooltip-type-badge"
                                style={{ backgroundColor: getPointColor(points[hoveredPoint].practice.type) }}
                            >
                                {getTypeLabel(points[hoveredPoint].practice.type)}
                            </span>
                        </div>
                        <div className="tooltip-score">
                            <span className="tooltip-score-value">{points[hoveredPoint].practice.totalScore}</span>
                            <span className="tooltip-score-label">ציון</span>
                        </div>
                        <div className="tooltip-date">
                            {formatFullDate(points[hoveredPoint].date)}
                        </div>
                    </div>
                )}
            </div>

            {/* Legend */}
            {filter === 'all' && (
                <div className="chart-legend">
                    <div className="legend-item">
                        <span className="legend-dot" style={{ backgroundColor: '#3B82F6' }}></span>
                        <span>Module A</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-dot" style={{ backgroundColor: '#10B981' }}></span>
                        <span>Module B</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-dot" style={{ backgroundColor: '#F59E0B' }}></span>
                        <span>Module C</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-dot" style={{ backgroundColor: '#8B5CF6' }}></span>
                        <span>סימולציה</span>
                    </div>
                </div>
            )}
        </div>
    )
}
