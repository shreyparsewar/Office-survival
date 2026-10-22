import type { CSSProperties } from "react";

export function PixelArt({ name, className = "", style, minutes = 0 }: { name: string; className?: string; style?: CSSProperties; minutes?: number }) {
  const ink = "#303733", light = "#f1e7c9", mid = "#baae8d";
  const art: Record<string, React.ReactNode> = {
    Mail: <><path fill={mid} d="M6 18h52v34H6z"/><path fill={light} d="M8 16h48v31H8z"/><path stroke={ink} strokeWidth="3" fill="none" d="m8 17 24 19 24-19M8 47l17-15m31 15L39 32"/><path fill="#c15e44" d="M46 10h14v14H46z"/></>,
    Calendar: <><path fill={mid} d="M13 10h42v47H13z"/><path fill={light} d="M9 6h42v47H9z"/><path fill="#aa4b39" d="M9 6h42v12H9z"/><path fill={ink} d="M17 2h4v10h-4zm21 0h4v10h-4zM17 25h5v5h-5zm11 0h5v5h-5zm11 0h5v5h-5zM17 37h5v5h-5zm11 0h5v5h-5zm11 0h5v5h-5z"/></>,
    Tasks: <><path fill={mid} d="M14 9h40v47H14z"/><path fill={light} d="M10 5h40v47H10z"/><path fill="#476451" d="M17 16h5v5h-5zm0 12h5v5h-5zm0 12h5v5h-5z"/><path fill={ink} d="M28 17h15v3H28zm0 12h15v3H28zm0 12h11v3H28z"/></>,
    Solitaire: <><path fill={ink} d="M6 9h30v44H6zm25 5h29v44H31z"/><path fill="#eadfbe" d="M9 12h24v38H9zm25 5h23v38H34z"/><path fill="#ae4c39" d="M17 22h8v7h6v8h-6v7h-8v-7h-6v-8h6z"/><path fill={ink} d="m45 26 9 10-9 10-9-10z"/></>,
    Internet: <><path fill="#d8d2ae" d="M21 5h24v5h8v8h5v28h-5v8h-8v5H21v-5h-8v-8H8V18h5v-8h8z"/><path fill="#588d9a" d="M23 9h20v5h9v8h3v20h-3v8h-9v5H23v-5h-9v-8h-3V22h3v-8h9z"/><path fill="#6e8154" d="M14 19h17v7h8v9h-9v15H20V38h-8zm25-5h9v9h-9zm5 26h9v8h-9z"/><path fill="none" stroke={light} strokeWidth="2" d="M10 31h45M31 9v46"/></>,
    "Recycle Bin": <><path fill={mid} d="M18 15h30l-3 41H21z"/><path fill="#e1d9bd" d="M14 11h32l-3 40H17z"/><path stroke={ink} strokeWidth="2" d="m21 18 2 25m8-25v25m8-25-2 25"/><path fill={ink} d="M11 9h38v5H11zm10-5h17v5H21z"/></>,
    coffee: <><path fill="#80664c" d="M7 51h49v5H7z"/><path fill={mid} d="M12 24h33v26H12zm33 3h11v17H45z"/><path fill={light} d="M9 20h33v26H9zm33 3h10v16H42z"/><path fill="#745039" d="M12 21h27v5H12z"/><path fill={ink} d="M16 31h18v3H16zm5 5h8v3h-8z"/><path fill="#dfddcc" d="M18 4h3v10h-3zm13 3h3v11h-3z"/></>,
    plant: <><path fill="#406342" d="M28 13h5v31h-5zM8 9h17v5h6v13H19V22h-6v-6H8zm30-5h17v12h-6v7H33V11h5zM6 28h18v5h7v10H17v-5H6zm33-2h17v12H44v7H32V32h7z"/><path fill="#789457" d="M11 10h13v5H11zm29-4h12v5H40zm-31 24h14v4H9z"/><path fill="#ab6748" d="M18 43h27v17H18z"/><path fill="#d58b5d" d="M14 40h35v7H14z"/><path fill="#75442e" d="M39 47h6v13h-6z"/></>,
    Phone: <><path fill="#777b67" d="M9 33h47v24H9z"/><path fill="#ddd3b3" d="M7 27h46v25H7z"/><path fill={ink} d="M7 7h13v5h24V7h12v23H43V18H20v12H7z"/><path fill="#636b5d" d="M9 8h8v12H9zm37 0h8v12h-8z"/><path fill={ink} d="M19 32h5v4h-5zm10 0h5v4h-5zm10 0h5v4h-5zM19 40h5v4h-5zm10 0h5v4h-5zm10 0h5v4h-5z"/><path fill="none" stroke={ink} strokeWidth="3" d="M56 22h5v38H46"/></>,
    printer: <><path fill={light} d="M17 4h30v23H17z"/><path fill="#777965" d="M8 20h48v34H8z"/><path fill="#c5ba98" d="M4 16h49v32H4z"/><path fill="#e3d8b7" d="M4 16h49v12H4z"/><path fill={ink} d="M12 33h32v10H12zM24 8h17v2H24zm0 5h17v2H24z"/><path fill={light} d="M15 38h28v21H15z"/><path fill="#c1bda6" d="M21 44h15v2H21zm0 6h15v2H21z"/><path fill="#719457" d="M39 23h4v4h-4z"/></>,
    Drawer: <><path fill="#775c42" d="M4 12h55v45H4z"/><path fill="#b48b5d" d="M6 9h49v39H6z"/><path fill="#ceb17c" d="M6 9h49v7H6z"/><path fill={ink} d="M11 22h39v3H11zm0 17h39v3H11zM25 29h13v4H25z"/><path fill="#dfd6b9" d="M13 16h21v6H13z"/></>,
    lamp: <><path fill={ink} d="M24 55h31v5H24zM37 29h5v29h-5zM18 15l5-3 18 20-5 3z"/><path fill="#4e6859" d="M12 5h22v7h7v10H5V12h7z"/><path fill="#e9c977" d="M8 22h30v4H8z"/><path fill="#708578" d="M13 6h16v4H13z"/></>,
    floppy: <><path fill="#343e46" d="M10 7h40l6 6v44H10z"/><path fill="#b3b9ac" d="M18 7h25v20H18z"/><path fill="#465254" d="M34 9h6v15h-6z"/><path fill={light} d="M17 35h32v18H17z"/><path fill="#ab5542" d="M17 35h32v5H17z"/></>,
    clock: <><path fill={ink} d="M18 3h28v5h10v10h5v28h-5v10H46v5H18v-5H8V46H3V18h5V8h10z"/><path fill={light} d="M19 8h26v5h8v7h3v24h-3v7h-8v5H19v-5h-8v-7H8V20h3v-7h8z"/><path fill={ink} d="M30 12h3v5h-3zM12 30h5v3h-5zm36 0h5v3h-5zM30 48h3v5h-3z"/><rect x="30" y="20" width="4" height="14" fill={ink} transform={`rotate(${(9 + minutes / 60) * 30} 32 32)`}/><rect x="31" y="12" width="2" height="22" fill={ink} transform={`rotate(${minutes % 60 * 6} 32 32)`}/></>,
    keyboard: <><path fill="#8c886f" d="M1 20h60v26H1z"/><path fill="#d8cfb1" d="M1 17h57v25H1z"/><path fill="#827f6e" d="M6 22h4v4H6zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zM6 29h4v4H6zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zM14 36h28v3H14z"/></>,
    mouse: <><path fill="#948e74" d="M23 18h18v5h5v31h-5v5H23v-5h-5V23h5z"/><path fill={light} d="M21 15h17v5h5v30h-5v5H21v-5h-5V20h5z"/><path stroke={ink} strokeWidth="2" fill="none" d="M30 15V2m-14 29h27M29 16v15"/></>,
  };
  return <svg className={className} style={style} viewBox={name === "keyboard" ? "0 15 64 35" : "0 0 64 64"} fill="none" shapeRendering="crispEdges" aria-hidden="true">{art[name] ?? art.Tasks}</svg>;
}

export function OfficeBackdrop() {
  return <svg className="office-backdrop" viewBox="0 0 1200 610" preserveAspectRatio="none" shapeRendering="crispEdges" aria-hidden="true">
    <defs><pattern id="wall" width="8" height="8" patternUnits="userSpaceOnUse"><path fill="#b3b6a2" d="M0 0h8v8H0z"/><path fill="#a7ab99" d="M0 0h2v2H0zm4 4h2v2H4z"/></pattern><pattern id="wood" width="180" height="12" patternUnits="userSpaceOnUse"><path fill="#b08c63" d="M0 0h180v12H0z"/><path fill="#a4825d" d="M0 0h60v2H0zm100 7h80v2h-80z"/></pattern></defs>
    <path fill="url(#wall)" d="M0 0h1200v365H0z"/><path fill="#969e8c" d="M0 0h75v365H0zM0 345h1200v35H0z"/>
    <path fill="#596c62" d="M0 0h12v363H0zm63 0h12v363H63zM0 348h1200v14H0z"/>
    <path fill="#6b725f" d="M839 25h294v246H839z"/><path fill="#e7dabc" d="M847 30h280v232H847z"/><path fill="#849d9e" d="M858 39h258v209H858z"/>
    <path fill="#bbc5b1" d="M862 72h52v12h-52zm105-17h66v11h-66zM1070 93h40v10h-40z"/>
    <path fill="#617b7b" d="M858 166h30v82h-30zm35-47h47v129h-47zm54 32h33v97h-33zm37-49h53v146h-53zm59 65h31v81h-31zm35-40h38v121h-38z"/>
    <path fill="#97aba4" d="M900 129h6v9h-6zm18 0h6v9h-6zm-18 23h6v9h-6zm18 0h6v9h-6zM995 114h8v9h-8zm19 0h8v9h-8zm-19 22h8v9h-8zm19 0h8v9h-8z"/>
    <path fill="#dacdb0" d="M980 35h9v216h-9zM856 141h261v8H856z"/>
    <path fill="#d1c5a5" d="M846 40h280v7H846zm0 22h280v7H846zm0 22h280v7H846zm0 22h280v7H846z"/>
    <path fill="#525e50" d="M837 259h299v12H837z"/>
    <path fill="#70583e" d="M110 52h216v171H110z"/><path fill="#b18c5b" d="M117 59h202v156H117z"/>
    <path fill="#efe7c8" d="M131 77h73v100h-73z"/><path fill="#d4cbb0" d="M137 92h54v3h-54zm0 11h49v3h-49zm0 11h52v3h-52zm0 11h41v3h-41zm0 25h37v3h-37z"/>
    <path fill="#b9533d" d="M159 73h7v7h-7z"/><path fill="#e7cb75" d="M221 115h73v67h-73z"/><path fill="#655c3f" d="M234 135h47v4h-47zm0 11h34v4h-34zm0 11h39v4h-39z"/><path fill="#576d55" d="M252 112h7v7h-7z"/>
    <path fill="#e0d5b5" d="M130 267h159v46H130z"/><path fill="#526352" d="M135 272h149v36H135z"/>
    <path fill="url(#wood)" d="M0 363h1200v229H0z"/><path fill="#7e6247" d="M0 576h1200v34H0z"/><path fill="#d0ad7b" d="M0 363h1200v8H0z"/><path fill="#604f3d" d="M0 602h1200v8H0z"/>
    <path fill="#8d7054" d="M273 414h570v125H273z"/><path fill="#6c7868" d="M285 407h549v121H285z"/><path fill="#7d8977" d="M291 413h537v109H291z"/>
    <path fill="#b8ab87" d="M913 459h154v84H913z"/><path fill="#e3d9bd" d="M906 449h154v84H906z"/><path fill="#cec5aa" d="M919 465h120v3H919zm0 13h120v3H919zm0 13h105v3H919zm0 13h109v3H919z"/>
    <path stroke="#3d463d" strokeWidth="4" d="M746 400v29h65v64h-28" fill="none"/>
  </svg>;
}
