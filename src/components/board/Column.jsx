function Column({ column }) {
  return (
    <div className="flex-shrink-0 w-72 flex flex-col bg-[#11111c] border border-[#1e1e2e] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1e1e2e]">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: column.color }} />
        <span className="font-semibold text-sm text-white flex-1 truncate">{column.name}</span>
        <span className="text-xs text-slate-500 font-mono">0</span>
      </div>

      {/* Items area — empty for now */}
      <div className="flex-1 p-3 min-h-[200px]">
        <p className="text-xs text-slate-600 text-center mt-4">No items yet</p>
      </div>

      {/* Add item button */}
      <div className="px-3 pb-3">
        <button className="w-full py-2 rounded-xl text-xs text-slate-500 hover:text-indigo-400
          border border-dashed border-[#2a2a3d] hover:border-indigo-500/50 transition-all duration-200">
          + Add item
        </button>
      </div>
    </div>
  )
}

export default Column