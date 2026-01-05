import React, { useRef } from 'react'
import dashboardImg from '../../Icon/dashboard.png'
import waterImg from '../../Icon/water.png'
import mapImg from '../../Icon/map.png'

export default function Sidebar({ active, setActive, collapsed = false, setCollapsed = () => {} }) {
  // Simple sidebar: no search, no collapsed-mode controls, no profile extras.
  const navRef = useRef(null)

  const items = [
    { name: 'dashboard', label: 'Dashboard' },
    { name: 'water', label: 'Water Quality' },
    { name: 'map', label: 'Map' },
  ]

  const iconColors = {
    dashboard: 'bg-blue-500',
    water: 'bg-teal-500',
    map: 'bg-amber-400',
  }

  const iconMap = {
    dashboard: dashboardImg,
    water: waterImg,
    map: mapImg,
  }

  const onKeyActivate = (e, name) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setActive(name)
    }
  }

  const Item = ({ name, icon: Icon, label }) => {
    const isActive = active === name
    const containerClass = `relative w-full flex items-center ${collapsed ? 'justify-center' : 'justify-start'}`
    const btnClass = `group flex items-center gap-3 w-full ${collapsed ? 'justify-center' : 'justify-start'} py-2 px-2 transition-all duration-150 focus:outline-none rounded-md bg-white/05 ${
      isActive ? 'bg-white/20 text-white' : 'text-white/90 hover:bg-white/10'
    }`
    return (
      <div className={containerClass}>
        <button
          onClick={() => setActive(name)}
          onKeyDown={(e) => onKeyActivate(e, name)}
          title={label}
          aria-current={isActive ? 'page' : undefined}
          className={btnClass}
        >
          <span className={`${iconColors[name]} rounded-full flex items-center justify-center shrink-0`} style={{ width: '45px', height: '45px' }}>
            <img src={iconMap[name]} alt={`${label} icon`} className="object-contain block" style={{ width: '27px', height: '27px' }} />
          </span>
          {!collapsed && (
            <span
              className="ml-3 text-sm font-bold"
              style={{
                fontFamily: 'Inter, Poppins, sans-serif',
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: '11px'
              }}
            >
              {label}
            </span>
          )}
        </button>
      </div>
    )
  }

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : 'expanded'} flex flex-col items-center py-6 gap-6 transition-all duration-200`} style={{ minWidth: collapsed ? 32 : 110 }}>
      <div className="flex flex-col items-center gap-2">
        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
          <div className="w-9 h-9 rounded-full bg-white/30" />
        </div>
      </div>

      <nav ref={navRef} className="flex-1 w-full px-2 flex flex-col items-center gap-2" role="navigation" aria-label="Main navigation">
        {items.map((it) => (
          <div key={it.name} className={`item ${active === it.name ? 'active' : ''}`}>
            <Item {...it} />
          </div>
        ))}
      </nav>

      {/* static rail: no collapse control */}
    </aside>
  )
}
