function ItemCard({ item }) {
  return (
    <div className="group bg-[#0e0e1a] border border-[#1e1e2e] hover:border-indigo-500/30
      rounded-xl px-3 py-2.5 cursor-pointer transition-all duration-200
      hover:shadow-[0_0_12px_rgba(99,102,241,0.08)]">
      <span className="text-sm text-slate-200 group-hover:text-white transition-colors">
        {item.title}
      </span>
    </div>
  )
}

export default ItemCard