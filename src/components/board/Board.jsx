import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Column from './Column'
import AddColumn from './AddColumn'

function Board({ projectId }) {
  const [columns, setColumns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchColumns() {
      const { data, error } = await supabase
        .from('lists')
        .select('*')
        .eq('project_id', projectId)
        .order('position', { ascending: true })

      setLoading(false)
      if (error) { console.error(error); return }
      setColumns(data ?? [])
    }
    fetchColumns()
  }, [projectId])

  function handleColumnAdded(newColumn) {
    setColumns(prev => [...prev, newColumn])
  }

  function handleColumnUpdated(updatedColumn) {
    setColumns(prev => prev.map(c => c.id === updatedColumn.id ? updatedColumn : c))
  }

  function handleColumnDeleted(columnId) {
    setColumns(prev => prev.filter(c => c.id !== columnId))
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 px-6 pt-4 min-h-[calc(100vh-180px)]"
      style={{ scrollbarWidth: 'thin' }}>
      {columns.map(column => (
        <Column
          key={column.id}
          column={column}
          onColumnUpdated={handleColumnUpdated}
          onColumnDeleted={handleColumnDeleted}
        />
      ))}
      <AddColumn projectId={projectId} onColumnAdded={handleColumnAdded} />
    </div>
  )
}

export default Board