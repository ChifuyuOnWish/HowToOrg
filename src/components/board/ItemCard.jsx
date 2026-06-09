import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import ItemDetail from './ItemDetail'

function ItemCard({ item, projectId, onItemUpdated }) {
  const [showDetail, setShowDetail] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={() => setShowDetail(true)}
        className="group bg-[#0e0e1a] border border-[#1e1e2e] hover:border-indigo-500/30
          rounded-xl px-3 py-2.5 cursor-pointer transition-all duration-200
          hover:shadow-[0_0_12px_rgba(99,102,241,0.08)]"
      >
        <span className="text-sm text-slate-200 group-hover:text-white transition-colors">
          {item.title}
        </span>
      </div>

      {showDetail && (
        <ItemDetail
          item={item}
          projectId={projectId}
          onClose={() => setShowDetail(false)}
          onItemUpdated={(updated, closeModal = true) => {
            onItemUpdated(updated)
            if (closeModal) setShowDetail(false)
          }}
        />
      )}
    </>
  )
}

export default ItemCard