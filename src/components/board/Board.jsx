import { useEffect, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { supabase } from '../../lib/supabase'
import Column from './Column'
import AddColumn from './AddColumn'
import ItemCard from './ItemCard'

function Board({ projectId }) {
  const [columns, setColumns] = useState([])
  const [items, setItems] = useState({}) // { [listId]: [...items] }
  const [loading, setLoading] = useState(true)
  const [activeItem, setActiveItem] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  useEffect(() => {
    fetchBoard()
  }, [projectId])

  async function fetchBoard() {
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

  function handleColumnAdded(newColumn) {
    setColumns(prev => [...prev, newColumn])
    setItems(prev => ({ ...prev, [newColumn.id]: [] }))
  }

  function handleColumnUpdated(updatedColumn) {
    setColumns(prev => prev.map(c => c.id === updatedColumn.id ? updatedColumn : c))
  }

  function handleColumnDeleted(columnId) {
    setColumns(prev => prev.filter(c => c.id !== columnId))
    setItems(prev => {
      const next = { ...prev }
      delete next[columnId]
      return next
    })
  }

  function handleItemAdded(listId, newItem) {
    setItems(prev => ({ ...prev, [listId]: [...(prev[listId] ?? []), newItem] }))
  }

  function handleItemUpdated(updatedItem) {
    setItems(prev => {
      const next = { ...prev }
      for (const listId in next) {
        next[listId] = next[listId].map(i => i.id === updatedItem.id ? updatedItem : i)
      }
      return next
    })
  }

  function findListOfItem(itemId) {
    for (const listId in items) {
      if (items[listId].some(i => i.id === itemId)) return listId
    }
    return null
  }

  function handleDragStart({ active }) {
    const listId = findListOfItem(active.id)
    if (!listId) return
    const item = items[listId].find(i => i.id === active.id)
    setActiveItem(item)
  }

  function handleDragOver({ active, over }) {
    if (!over) return
    const activeListId = findListOfItem(active.id)
    const overListId = items[over.id] !== undefined ? over.id : findListOfItem(over.id)

    if (!activeListId || !overListId || activeListId === overListId) return

    setItems(prev => {
      const activeItems = [...prev[activeListId]]
      const overItems = [...prev[overListId]]
      const activeIndex = activeItems.findIndex(i => i.id === active.id)
      const [moved] = activeItems.splice(activeIndex, 1)
      moved.list_id = overListId
      overItems.push(moved)
      return { ...prev, [activeListId]: activeItems, [overListId]: overItems }
    })
  }

  async function handleDragEnd({ active, over }) {
    setActiveItem(null)
    if (!over) return

    const listId = findListOfItem(active.id)
    if (!listId) return

    const listItems = items[listId]
    const activeIndex = listItems.findIndex(i => i.id === active.id)
    const overIndex = listItems.findIndex(i => i.id === over.id)

    if (activeIndex !== overIndex && overIndex !== -1) {
      const reordered = arrayMove(listItems, activeIndex, overIndex)
      setItems(prev => ({ ...prev, [listId]: reordered }))

      // Update positions in DB
      await Promise.all(reordered.map((item, index) =>
        supabase.from('items').update({ position: index, list_id: listId }).eq('id', item.id)
      ))
    } else {
      // Just update list_id if moved to another column
      await supabase
        .from('items')
        .update({ list_id: listId, position: listItems.length - 1 })
        .eq('id', active.id)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
    </div>
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div
        className="flex gap-4 overflow-x-auto pb-6 px-6 pt-4 min-h-[calc(100vh-180px)]"
        style={{ scrollbarWidth: 'thin' }}
      >
        {columns.map(column => (
          <Column
            key={column.id}
            column={column}
            items={items[column.id] ?? []}
            onColumnUpdated={handleColumnUpdated}
            onColumnDeleted={handleColumnDeleted}
            onItemAdded={(item) => handleItemAdded(column.id, item)}
            onItemUpdated={handleItemUpdated}
          />
        ))}
        <AddColumn projectId={projectId} onColumnAdded={handleColumnAdded} />
      </div>

      <DragOverlay>
        {activeItem && (
          <div className="bg-[#0e0e1a] border border-indigo-500/50 rounded-xl px-3 py-2.5 shadow-xl w-72 opacity-90">
            <span className="text-sm text-white">{activeItem.title}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

export default Board