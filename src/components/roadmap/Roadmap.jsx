import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

const DAY_WIDTH = 40
const ROW_HEIGHT = 36
const HEADER_HEIGHT = 56
const LEFT_COL_WIDTH = 200

function getWeekDays(startDate, numDays) {
  const days = []
  for (let i = 0; i < numDays; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    days.push(d)
  }
  return days
}

function getWeeks(days) {
  const weeks = []
  let current = null
  days.forEach((day, index) => {
    const monday = new Date(day)
    monday.setDate(day.getDate() - ((day.getDay() + 6) % 7))
    const key = monday.toISOString().slice(0, 10)
    if (!current || current.key !== key) {
      current = { key, label: `W${getWeekNumber(day)}`, startIndex: index, span: 1 }
      weeks.push(current)
    } else {
      current.span++
    }
  })
  return weeks
}

function getWeekNumber(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

function daysBetween(a, b) {
  return Math.round((b - a) / 86400000)
}

function toLocalMidnight(dateInput) {
  const d = new Date(dateInput)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function toDateString(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function Roadmap({ projectId }) {
  const [columns, setColumns] = useState([])
  const [items, setItems] = useState({})
  const [projectCreatedAt, setProjectCreatedAt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dragging, setDragging] = useState(null)
  const timelineRef = useRef(null)
  const leftColRef = useRef(null)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const startDate = projectCreatedAt
    ? toLocalMidnight(projectCreatedAt)
    : new Date(today)

  const endDate = new Date(today)
  endDate.setDate(today.getDate() + 90)
  const numDays = Math.max(daysBetween(startDate, endDate), 120)

  const days = getWeekDays(startDate, numDays)
  const weeks = getWeeks(days)
  const todayOffset = daysBetween(startDate, today)
  const totalWidth = numDays * DAY_WIDTH

  useEffect(() => {
    fetchData()
  }, [projectId])

  useEffect(() => {
    if (!loading && projectCreatedAt && timelineRef.current) {
      setTimeout(() => {
        const scrollTo = todayOffset * DAY_WIDTH - timelineRef.current.clientWidth / 2
        timelineRef.current.scrollLeft = Math.max(0, scrollTo)
      }, 50)
    }
  }, [loading, projectCreatedAt])

  const handleMouseMove = useCallback((e) => {
    if (!dragging) return
    const dx = e.clientX - dragging.startX
    const daysDelta = Math.round(dx / DAY_WIDTH)
    setDragging(prev => ({
      ...prev,
      currentEndOffset: prev.originalEndOffset + daysDelta
    }))
  }, [dragging])

  const handleMouseUp = useCallback(async () => {
    if (!dragging) return

    const newEndOffset = dragging.currentEndOffset
    const newDue = new Date(startDate)
    newDue.setDate(newDue.getDate() + newEndOffset)
    const newDueStr = toDateString(newDue)

    setItems(prev => {
      const next = { ...prev }
      next[dragging.listId] = next[dragging.listId].map(item =>
        item.id === dragging.itemId ? { ...item, due_date: newDueStr } : item
      )
      return next
    })

    await supabase
      .from('items')
      .update({ due_date: newDueStr })
      .eq('id', dragging.itemId)

    setDragging(null)
  }, [dragging, startDate])

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragging, handleMouseMove, handleMouseUp])

  function handleTimelineScroll() {
    if (leftColRef.current && timelineRef.current) {
      leftColRef.current.scrollTop = timelineRef.current.scrollTop
    }
  }

  async function fetchData() {
    const { data: project } = await supabase
      .from('projects')
      .select('created_at')
      .eq('id', projectId)
      .single()

    if (project?.created_at) setProjectCreatedAt(project.created_at)

    const { data: lists } = await supabase
      .from('lists')
      .select('*')
      .eq('project_id', projectId)
      .order('position', { ascending: true })

    const { data: allItems } = await supabase
      .from('items')
      .select('*')
      .eq('project_id', projectId)
      .order('position', { ascending: true })

    const grouped = {}
    for (const list of lists ?? []) {
      grouped[list.id] = allItems?.filter(i => i.list_id === list.id) ?? []
    }

    setColumns(lists ?? [])
    setItems(grouped)
    setLoading(false)
  }

  const rows = []
  for (const col of columns) {
    const colItems = items[col.id] ?? []
    if (colItems.length === 0) {
      rows.push({ type: 'empty', col })
    } else {
      for (const item of colItems) {
        rows.push({ type: 'item', item, col })
      }
    }
  }

  if (loading || !projectCreatedAt) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="flex overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>

      {/* Left fixed column */}
      <div
        className="flex-shrink-0 flex flex-col border-r border-[#1e1e2e] bg-[#0a0a0f] z-20"
        style={{ width: LEFT_COL_WIDTH }}
      >
        <div className="flex-shrink-0 border-b border-[#1e1e2e]" style={{ height: HEADER_HEIGHT }} />
        <div ref={leftColRef} style={{ overflowY: 'hidden', flex: 1 }}>
          {rows.map((row, i) => (
            <div
              key={i}
              className="flex items-center px-4 border-b"
              style={{
                height: ROW_HEIGHT,
                borderColor: row.type === 'item' ? row.col.color + '22' : '#1a1a2a',
                backgroundColor: row.type === 'item' ? row.col.color + '08' : 'transparent',
              }}
            >
              {row.type === 'item' ? (
                <div className="flex items-center gap-2 overflow-hidden">
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: row.col.color }}
                  />
                  <span className="text-xs text-slate-300 truncate">{row.item.title}</span>
                </div>
              ) : (
                <span className="text-xs text-slate-600 italic">No items</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div
        ref={timelineRef}
        onScroll={handleTimelineScroll}
        className="flex-1 overflow-auto"
        style={{ scrollbarWidth: 'thin', cursor: dragging ? 'grabbing' : 'default' }}
      >
        <div className="relative" style={{ width: totalWidth }}>

          {/* Headers */}
          <div className="sticky top-0 z-10 bg-[#0a0a0f]" style={{ height: HEADER_HEIGHT }}>
            <div className="flex border-b border-[#1e1e2e]" style={{ height: 28 }}>
              {weeks.map(week => (
                <div
                  key={week.key}
                  className="flex items-center px-2 text-xs font-mono text-slate-400 border-r border-[#1e1e2e] flex-shrink-0"
                  style={{ width: week.span * DAY_WIDTH }}
                >
                  {week.label}
                </div>
              ))}
            </div>
            <div className="flex border-b border-[#1e1e2e]" style={{ height: 28 }}>
              {days.map((day, i) => {
                const isToday = i === todayOffset
                const isWeekend = day.getDay() === 0 || day.getDay() === 6
                return (
                  <div
                    key={i}
                    className={`flex items-center justify-center text-xs flex-shrink-0 border-r border-[#1a1a2a]
                      ${isToday ? 'text-indigo-400 font-bold' : isWeekend ? 'text-slate-600' : 'text-slate-500'}`}
                    style={{ width: DAY_WIDTH }}
                  >
                    {day.getDate()}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Today line */}
          <div
            className="absolute top-0 bottom-0 w-px bg-indigo-500/40 z-10 pointer-events-none"
            style={{ left: todayOffset * DAY_WIDTH + DAY_WIDTH / 2 }}
          />

          {/* Rows */}
          <div>
            {rows.map((row, i) => {
              if (row.type === 'empty') return (
                <div key={i} className="border-b border-[#1a1a2a]" style={{ height: ROW_HEIGHT }} />
              )

              const { item, col } = row
              const isDraggingThis = dragging?.itemId === item.id
              let bar = null

              if (item.due_date || isDraggingThis) {
                const due = isDraggingThis
                  ? (() => { const d = new Date(startDate); d.setDate(d.getDate() + dragging.currentEndOffset); return d })()
                  : toLocalMidnight(item.due_date)

                const created = toLocalMidnight(item.created_at)
                const startOffset = Math.max(0, daysBetween(startDate, created))
                const endOffset = daysBetween(startDate, due)

                if (endOffset >= 0 && startOffset < numDays && endOffset >= startOffset) {
                  const left = startOffset * DAY_WIDTH
                  const width = Math.max((endOffset - startOffset + 1) * DAY_WIDTH, DAY_WIDTH)

                  bar = (
                    <div
                      className="absolute top-0 bottom-0 transition-none"
                      style={{
                        left,
                        width,
                        backgroundColor: col.color + (isDraggingThis ? '77' : '55'),
                        borderRight: `2px solid ${col.color}`,
                        cursor: isDraggingThis ? 'grabbing' : 'grab',
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        const due = toLocalMidnight(item.due_date)
                        const endOffset = daysBetween(startDate, due)
                        setDragging({
                          itemId: item.id,
                          listId: col.id,
                          startX: e.clientX,
                          originalEndOffset: endOffset,
                          currentEndOffset: endOffset,
                        })
                      }}
                    />
                  )
                }
              }

              return (
                <div
                  key={i}
                  className="relative border-b"
                  style={{
                    height: ROW_HEIGHT,
                    borderColor: col.color + '22',
                    backgroundColor: col.color + '08',
                  }}
                >
                  {days.map((day, di) => (
                    day.getDay() === 0 || day.getDay() === 6 ? (
                      <div
                        key={di}
                        className="absolute top-0 bottom-0 pointer-events-none"
                        style={{ left: di * DAY_WIDTH, width: DAY_WIDTH, backgroundColor: '#00000020' }}
                      />
                    ) : null
                  ))}
                  {bar}
                </div>
              )
            })}

            {rows.length < 10 && Array.from({ length: 10 - rows.length }).map((_, i) => (
              <div key={`fill-${i}`} className="border-b border-[#1a1a2a]" style={{ height: ROW_HEIGHT }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}