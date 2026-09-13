import { lazy, Suspense, useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Box, ChevronDown, Expand, Eye, Gamepad2, Github, Grid3X3, Info, Layers2, Microscope, Move3D, Pause, Play, RotateCcw, Scan, Search, Sparkles, X, ZoomIn, ZoomOut } from "lucide-react";
import { specimens, getSpecimen, type Specimen } from "./data/specimens";
import { Modal } from "./components/Modal";
import { useSpecimenTools } from "./hooks/useSpecimenTools";

const Scene = lazy(() => import("./components/SpecimenScene"));
const repo = "https://github.com/asharma391/microcosmos";

export default function App() {
  const [id, setId] = useState(() => getSpecimen(new URLSearchParams(location.search).get("specimen") || "").id);
  const specimen = getSpecimen(id);
  const index = specimens.indexOf(specimen);
  const [active, setActive] = useState<number | null>(0);
  const [labels, setLabels] = useState(true);
  const [surface, setSurface] = useState(false);
  const [auto, setAuto] = useState(true);
  const [reset, setReset] = useState(0);
  const [zoom, setZoom] = useState(0);
  const [overlay, setOverlay] = useState<"compare"|"gallery"|"notes"|"quiz"|null>(null);
  const [other, setOther] = useState("diatom");
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [cinema, setCinema] = useState(false);

  const select = useCallback((next: string) => {
    setId(next); setActive(0); setReset((r) => r + 1); setZoom(0); setOverlay(null);
    const url = new URL(location.href); url.searchParams.set("specimen", next); history.replaceState(null, "", url);
  }, []);
  useSpecimenTools(select);
  const step = useCallback((delta: number) => select(specimens[(index + delta + specimens.length) % specimens.length].id), [index, select]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (overlay || event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return;
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
      if (event.key === "Escape") setCinema(false);
    };
    addEventListener("keydown", key); return () => removeEventListener("keydown", key);
  }, [overlay, step]);

  const filtered = specimens.filter((item) => `${item.name} ${item.group}`.toLowerCase().includes(query.toLowerCase()));
  const quizOptions = useMemo(() => [specimen, ...specimens.filter((s) => s.id !== specimen.id).slice(0, 3)].sort(() => .5 - Math.random()), [specimen]);
  const view = (item: Specimen, compact=false) => <Suspense fallback={<div className="loading-state">Preparing specimen…</div>}><Scene specimen={item} autoRotate={auto && !compact} surface={surface} labels={labels && !compact} active={compact ? null : active} onSelect={setActive} resetKey={reset} zoom={compact ? 0 : zoom} /></Suspense>;
  const style = { "--accent": specimen.color } as CSSProperties;

  return <div className={`app-shell ${cinema ? "cinema" : ""}`} style={style}>
    <header className="topbar">
      <a className="brand-block" href="/"><span className="brand-orb"><Microscope size={25}/></span><span><b>Microcosmos Atlas</b><em>Explore life at the microscopic level</em></span></a>
      <nav aria-label="Primary navigation">
        <button onClick={() => setOverlay("gallery")}><Grid3X3/><span>Gallery</span></button>
        <button onClick={() => setOverlay("compare")}><Layers2/><span>Compare</span></button>
        <button onClick={() => setOverlay("notes")}><BookOpen/><span>Field guide</span></button>
        <button onClick={() => { setAnswer(null); setOverlay("quiz"); }}><Gamepad2/><span>Quiz</span></button>
        <a className="star-button" href={repo} target="_blank" rel="noreferrer"><Github/><span>Star on GitHub</span></a>
      </nav>
    </header>

    <div className="specimen-strip" aria-label="Specimen collection">
      {specimens.map((item) => <button key={item.id} className={item.id === id ? "selected" : ""} onClick={() => select(item.id)}><img src={item.image}/><span><b>{item.name}</b><small>{item.group}</small></span></button>)}
    </div>

    <main className="app-grid">
      <aside className="left-rail">
        <section className="panel library-panel">
          <div className="panel-heading"><span><Sparkles size={16}/> Specimen library</span><small>09</small></div>
          <label className="search"><Search size={15}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search specimens"/></label>
          <div className="library-list">{filtered.map((item, i) => <button key={item.id} className={item.id === id ? "active" : ""} onClick={() => select(item.id)}><span className="index">{String(i+1).padStart(2,"0")}</span><img src={item.image}/><span><b>{item.name}</b><em>{item.latin}</em></span><ChevronDown size={15}/></button>)}</div>
        </section>
        <section className="panel parts-panel">
          <div className="panel-heading"><span><Eye size={16}/> Structures</span><small>{specimen.parts.length}</small></div>
          {specimen.parts.map((part, i) => <button key={part.name} className={active === i ? "active" : ""} onClick={() => {setActive(i); setLabels(true);}}><span>{String(i+1).padStart(2,"0")}</span><b>{part.name}</b><ArrowRight size={15}/></button>)}
        </section>
      </aside>

      <section className="center-column">
        <div className="panel stage-card">
          <div className="stage-title"><div><span className="kicker">SPECIMEN {String(index+1).padStart(2,"0")} · {specimen.group.toUpperCase()}</span><h1>{specimen.name}</h1><p>{specimen.latin}</p></div><button onClick={() => setCinema(!cinema)} aria-label="Expand viewer">{cinema ? <X/> : <Expand/>}</button></div>
          <div className="view-selector"><span>VIEW MODE</span><button className={!surface ? "active" : ""} onClick={() => setSurface(false)}><Box/> 3D specimen</button><button className={surface ? "active" : ""} onClick={() => setSurface(true)}><Scan/> Microscope</button></div>
          <div className="tool-rail">
            <button className={labels ? "active" : ""} onClick={() => setLabels(!labels)} title="Toggle labels"><Eye/><span>Labels</span></button>
            <button className={auto ? "active" : ""} onClick={() => setAuto(!auto)} title="Auto rotate">{auto ? <Pause/> : <Play/>}<span>Rotate</span></button>
            <button onClick={() => setZoom((z) => Math.min(4,z+1))}><ZoomIn/><span>Zoom in</span></button>
            <button onClick={() => setZoom((z) => Math.max(-3,z-1))}><ZoomOut/><span>Zoom out</span></button>
            <button onClick={() => {setReset((r)=>r+1);setZoom(0);setActive(0);}}><RotateCcw/><span>Reset</span></button>
          </div>
          <div className="scene-wrap">{view(specimen)}</div>
          <div className="stage-hint"><Move3D size={15}/> Drag to rotate · scroll to zoom</div>
          <div className="sticky-note">Look closely—<br/><b>the invisible is alive.</b></div>
          <div className="scale"><span/><b>{specimen.size}</b><small>typical length</small></div>
        </div>
        <div className="bottom-panels">
          <section className="panel microscope-card"><div className="panel-heading"><span><Microscope size={16}/> Microscope view</span><small>REFERENCE PLATE</small></div><div className="micro-body"><img src={specimen.image}/><div><b>How to find it</b><p>{specimen.lens}</p><a href={specimen.source} target="_blank" rel="noreferrer">Scientific source <ArrowUpRight size={14}/></a></div></div></section>
          <section className="panel compare-card"><div className="panel-heading"><span>Compare scale</span><Info size={15}/></div><div className="scale-visual"><div className="scale-dot"/><span>{specimen.microns.toLocaleString()} µm</span><i style={{width:`${Math.max(4,Math.min(100,specimen.microns/20))}%`}}/></div><p>{specimen.name} is about <b>{specimen.microns >= 1000 ? `${specimen.microns/1000} mm` : `${specimen.microns} micrometres`}</b> long in this representative comparison.</p><button onClick={() => setOverlay("compare")}>Open comparison view <ArrowRight size={17}/></button></section>
        </div>
      </section>

      <aside className="right-rail">
        <section className="panel info-panel">
          <span className="kicker">SPECIMEN PROFILE</span><h2>{specimen.name}</h2><em>{specimen.latin}</em><p className="intro">{specimen.intro}</p>
          <div className="quick-facts"><div><span>SIZE</span><b>{specimen.size}</b></div><div><span>HABITAT</span><b>{specimen.habitat}</b></div></div>
          <div className="fact-list"><div><span>MOVE</span><p>{specimen.movement}</p></div><div><span>ENERGY</span><p>{specimen.feeding}</p></div><div><span>ECOSYSTEM</span><p>{specimen.role}</p></div></div>
          <div className="biological-note"><Sparkles size={17}/><div><span>BIOLOGICAL NOTE</span><p>{specimen.fact}</p></div></div>
          <div className="active-part"><span>SELECTED STRUCTURE · {String((active ?? 0)+1).padStart(2,"0")}</span><h3>{specimen.parts[active ?? 0].name}</h3><p>{specimen.parts[active ?? 0].note}</p></div>
        </section>
        <section className="panel question-card"><span>OBSERVATION PROMPT</span><p>{specimen.question}</p><button onClick={() => setOverlay("quiz")}>Test yourself <ArrowRight size={16}/></button></section>
      </aside>
    </main>

    <footer><span>09 SPECIMENS · 36 LABELED STRUCTURES · FULLY INTERACTIVE</span><a href={repo}>OPEN SOURCE ON GITHUB <ArrowUpRight size={13}/></a></footer>

    <Modal open={overlay === "gallery"} onClose={() => setOverlay(null)} label="Specimen gallery" panelClassName="wide-modal"><span className="kicker">SPECIMEN GALLERY</span><h2>Nine worlds in a drop of water.</h2><div className="gallery-grid">{specimens.map((item) => <button key={item.id} onClick={() => select(item.id)}><img src={item.image}/><span><b>{item.name}</b><em>{item.latin}</em><small>{item.size}</small></span></button>)}</div></Modal>
    <Modal open={overlay === "compare"} onClose={() => setOverlay(null)} label="Compare specimens" panelClassName="wide-modal"><span className="kicker">SIDE BY SIDE</span><h2>A matter of perspective.</h2><div className="comparison-columns">{[specimen,getSpecimen(other)].map((item,i) => <section key={i}><div className="comparison-name">{i===0?<h3>{item.name}</h3>:<select value={other} onChange={(e)=>setOther(e.target.value)}>{specimens.filter((x)=>x.id!==id).map((x)=><option value={x.id} key={x.id}>{x.name}</option>)}</select>}<span>{item.size}</span></div><div className="comparison-stage">{view(item,true)}</div><p>{item.intro}</p></section>)}</div></Modal>
    <Modal open={overlay === "quiz"} onClose={() => setOverlay(null)} label="Specimen quiz" panelClassName="quiz-modal"><span className="kicker">QUICK IDENTIFICATION</span><h2>Who lives here?</h2><img className="quiz-image" src={specimen.image}/><p className="quiz-clue">Clue: {specimen.role}</p><div className="quiz-options">{quizOptions.map((item)=><button key={item.id} className={answer ? item.id===specimen.id?"correct":item.id===answer?"wrong":"":""} onClick={()=>setAnswer(item.id)}>{item.name}</button>)}</div>{answer&&<p className="quiz-result">{answer===specimen.id?"Correct — excellent observation.":`Look again. This is ${specimen.name}.`}</p>}</Modal>
    <Modal open={overlay === "notes"} onClose={() => setOverlay(null)} label="Field guide" panelClassName="notes-modal"><span className="kicker">FIELD GUIDE</span><h2>Wonder, with context.</h2><p>Microcosmos Atlas is an open-source, interactive field guide to nine microscopic organisms. Every specimen includes an orbitable model, labeled structures, scale, ecology, feeding, movement, microscope tips and a scientific reading link.</p><h3>About the models</h3><p>Models and reference plates were generated with AI for visual education. Forms, colors and label positions are simplified illustrations rather than microscope scans or research-grade reconstructions.</p><h3>Made possible by open source</h3><p>Adapted from <a href="https://github.com/cclank/cell-architecture-studio">Cell Architecture Studio</a> under the MIT License. Inspired by the 3D cell explorer by Dilum Sanjaya and the Anatomy project by The Bugged Dev.</p><a className="star-button" href={repo}><Github/> Explore the source <ArrowUpRight/></a></Modal>
  </div>;
}
