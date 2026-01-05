import React from 'react'
import waterBg from '../../Icon/water-bg.png'
import doIcon from '../../Icon/DO.png'
import bodIcon from '../../Icon/BOD.png'
import philmap from '../../Icon/philmap.png'
import scientist from '../../Icon/Scientist.png'
import phIcon from '../../Icon/ph.png'
import waterParamIcon from '../../Icon/water.png'

export default function Header() {
  const icons = [phIcon, doIcon, waterParamIcon, bodIcon]

  return (
    <header className="header-banner card relative overflow-hidden">
      <img src={waterBg} alt="water background" className="header-bg absolute inset-0 w-full h-full object-cover opacity-95" />

      <div className="header-content relative z-10 w-full py-4 px-4 flex flex-col items-center">
        <h1 className="header-title">Laguna Lake!</h1>
        <div className="header-sub">WATER QUALITY MONITORING</div>

        <img src={philmap} alt="left icon" className="side-icon side-left hidden md:block" />

        <div className="icons-row mt-4">
          {icons.map((ic, idx) => (
            <div key={idx} className="icon-badge">
              <img src={ic} alt={`icon-${idx}`} />
            </div>
          ))}
        </div>

        <img src={scientist} alt="right icon" className="side-icon side-right hidden md:block" />

        <div className="header-tagline mt-6">Track and analyze the water quality of Laguna Lake</div>
      </div>

      {/* scientist image removed per request */}
    </header>
  )
}
