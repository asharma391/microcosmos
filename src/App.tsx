import { useCallback, useEffect, useState, Suspense, lazy } from "react";
import {
  Microscope,
  Github,
  ArrowUpRight,
  BookOpen,
  Layers2,
  Expand,
  X,
  Box,
  Scan,
  Play,
  Pause,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Sparkles,
  MoveUpRight,
} from "lucide-react";
import { specimens, getSpecimen, type Specimen } from "./data/specimens";
import { Modal } from "./components/Modal";
import { useSpecimenTools } from "./hooks/useSpecimenTools";
const Scene = lazy(() => import("./components/SpecimenScene"));
const repo = "https://github.com/asharma391/microcosmos";
export default function App() {
  const [id, setId] = useState(
      () =>
        getSpecimen(new URLSearchParams(location.search).get("specimen") || "")
          .id,
    ),
    s = getSpecimen(id),
    n = specimens.indexOf(s);
  const [active, setActive] = useState<number | null>(null),
    [labels, setLabels] = useState(false),
    [surface, setSurface] = useState(false),
    [auto, setAuto] = useState(false),
    [reset, setReset] = useState(0),
    [zoom, setZoom] = useState(0),
    [compare, setCompare] = useState(false),
    [other, setOther] = useState("diatom"),
    [notes, setNotes] = useState(false),
    [cinema, setCinema] = useState(false);
  const select = useCallback((value: string) => {
    setId(value);
    setActive(null);
    setReset((r) => r + 1);
    setZoom(0);
    const u = new URL(location.href);
    u.searchParams.set("specimen", value);
    history.replaceState(null, "", u);
  }, []);
  useSpecimenTools(select);
  const step = useCallback(
    (d: number) =>
      select(specimens[(n + d + specimens.length) % specimens.length].id),
    [n, select],
  );
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLSelectElement ||
        e.target instanceof HTMLInputElement ||
        compare ||
        notes
      )
        return;
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "Escape") setCinema(false);
    };
    addEventListener("keydown", fn);
    return () => removeEventListener("keydown", fn);
  }, [step, compare, notes]);
  const closeCompare = useCallback(() => setCompare(false), []),
    closeNotes = useCallback(() => setNotes(false), []);
  const view = (item: Specimen, compact = false) => (
    <Suspense
      fallback={<div className="loading-state">Preparing the viewer…</div>}
    >
      <Scene
        specimen={item}
        autoRotate={auto && !compact}
        surface={surface}
        labels={labels && !compact}
        active={compact ? null : active}
        onSelect={setActive}
        resetKey={reset}
        zoom={compact ? 0 : zoom}
      />
    </Suspense>
  );
  return (
    <div className={`app ${cinema ? "cinema" : ""}`}>
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-mark">
            <Microscope size={23} />
          </span>
          <span>
            microcosmos<span className="brand-dot">.</span>
          </span>
        </a>
        <span className="header-note">A FIELD GUIDE TO THE INVISIBLE</span>
        <nav>
          <button className="text-button" onClick={() => setNotes(true)}>
            <BookOpen size={16} /> Field notes
          </button>
          <a className="github" href={repo} target="_blank" rel="noreferrer">
            <Github size={17} />
            <span>Star on GitHub</span>
            <ArrowUpRight size={14} />
          </a>
        </nav>
      </header>
      <main className="workspace">
        <aside className="sidebar">
          <div className="section-label">
            THE COLLECTION <span>05</span>
          </div>
          <div className="specimen-list">
            {specimens.map((item, i) => (
              <button
                className={`specimen-button ${id === item.id ? "selected" : ""}`}
                key={item.id}
                onClick={() => select(item.id)}
                aria-pressed={id === item.id}
              >
                <span className="thumbnail">
                  <img src={item.image} alt="" />
                </span>
                <span>
                  <b>{item.name}</b>
                  <small>{item.group.toLowerCase()}</small>
                </span>
                <span className="list-number">0{i + 1}</span>
              </button>
            ))}
          </div>
          <div className="sidebar-bottom">
            <span className="edition">VOLUME 001</span>
            <p>
              Small worlds.
              <br />
              <em>Endless wonder.</em>
            </p>
            <i className="sidebar-rule" />
            <small>
              Five specimens.
              <br />A different way to see life.
            </small>
          </div>
        </aside>
        <section
          className="specimen-workspace"
          aria-label={`${s.name} explorer`}
        >
          <div className="specimen-heading">
            <div>
              <div className="eyebrow">
                <span className="number">0{n + 1} / 05</span>
                <span>{s.group.toUpperCase()}</span>
              </div>
              <h1>{s.name}</h1>
              <p className="scientific">{s.latin}</p>
            </div>
            <div className="heading-actions">
              <button
                className="compare-button"
                onClick={() => {
                  if (other === id)
                    setOther(specimens.find((a) => a.id !== id)!.id);
                  setCompare(true);
                }}
              >
                <Layers2 size={16} /> Compare
              </button>
              <button
                className="icon-button"
                aria-label={cinema ? "Exit cinema view" : "Enter cinema view"}
                onClick={() => setCinema(!cinema)}
              >
                {cinema ? <X size={18} /> : <Expand size={18} />}
              </button>
            </div>
          </div>
          <div className="stage">
            <div className="stage-top">
              <span>
                <i className="live-dot" />
                INTERACTIVE SPECIMEN
              </span>
              <span className="render-note">ILLUSTRATIVE 3D MODEL</span>
            </div>
            {view(s)}
            <div className="stage-bottom">
              <span className="scale-indicator">
                <i />
                {s.size}
                <small>typical size range · enlarged view</small>
              </span>
              <span className="orbit-hint">
                Drag to orbit <span>·</span> Scroll to zoom
              </span>
            </div>
          </div>
          <div className="toolbar">
            <div className="segmented">
              <button
                className={!surface ? "active" : ""}
                onClick={() => setSurface(false)}
              >
                <Box size={15} /> Color
              </button>
              <button
                className={surface ? "active" : ""}
                onClick={() => setSurface(true)}
              >
                <Scan size={15} /> Surface
              </button>
            </div>
            <i className="toolbar-divider" />
            <button
              className={`tool ${labels ? "active" : ""}`}
              aria-label="Toggle labels"
              aria-pressed={labels}
              onClick={() => setLabels(!labels)}
            >
              <SlidersHorizontal size={16} />
              <span>Labels</span>
            </button>
            <button
              className={`tool ${auto ? "active" : ""}`}
              aria-label="Toggle rotation"
              aria-pressed={auto}
              onClick={() => setAuto(!auto)}
            >
              {auto ? <Pause size={16} /> : <Play size={16} />}
              <span>Rotate</span>
            </button>
            <button
              className="tool"
              aria-label="Reset view"
              onClick={() => {
                setReset((r) => r + 1);
                setZoom(0);
                setActive(null);
              }}
            >
              <RotateCcw size={16} />
              <span>Reset</span>
            </button>
            <div className="zoom-tools">
              <button
                aria-label="Zoom out"
                onClick={() => setZoom((z) => Math.max(-3, z - 1))}
              >
                <ZoomOut size={17} />
              </button>
              <button
                aria-label="Zoom in"
                onClick={() => setZoom((z) => Math.min(4, z + 1))}
              >
                <ZoomIn size={17} />
              </button>
            </div>
          </div>
          <div className="understage">
            <div>
              <span className="section-label">OBSERVATION 0{n + 1}</span>
              <p>{s.intro}</p>
            </div>
            <div className="next-specimen">
              <button aria-label="Previous specimen" onClick={() => step(-1)}>
                <ChevronLeft size={20} />
              </button>
              <button aria-label="Next specimen" onClick={() => step(1)}>
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </section>
        <aside className="details">
          <div className="detail-header">
            <span className="section-label">A CLOSER LOOK</span>
            <span className="tiny-cross">+</span>
          </div>
          <h2>Remarkable by nature.</h2>
          <div className="structures">
            {s.parts.map((p, i) => (
              <button
                className={`structure ${active === i ? "active" : ""}`}
                key={p.name}
                onClick={() => {
                  setActive(active === i ? null : i);
                  setLabels(true);
                }}
              >
                <span className="structure-index">0{i + 1}</span>
                <span>
                  <b>{p.name}</b>
                  <p>{p.note}</p>
                </span>
                <MoveUpRight size={14} />
              </button>
            ))}
          </div>
          <div className="field-note">
            <Sparkles size={16} />
            <span className="section-label">DID YOU KNOW?</span>
            <p>{s.fact}</p>
          </div>
          <div className="habitat">
            <span className="section-label">WHERE TO FIND IT</span>
            <h3>
              <span>⌖</span>
              {s.habitat}
            </h3>
          </div>
          <button className="sources-button" onClick={() => setNotes(true)}>
            Sources & illustration notes <ArrowUpRight size={14} />
          </button>
        </aside>
      </main>
      <footer>
        <span>EXPLORE THE EXTRAORDINARY IN THE ORDINARY.</span>
        <span>
          Built with curiosity <span className="footer-dot">·</span>
          <a href={repo}>
            Open source <ArrowUpRight size={12} />
          </a>
        </span>
      </footer>
      <Modal
        open={compare}
        onClose={closeCompare}
        label="Compare specimens"
        panelClassName="comparison-modal"
      >
        <span className="section-label">SIDE BY SIDE</span>
        <h2>A matter of perspective.</h2>
        <p className="modal-intro">
          Models fit their own viewports. The bars compare representative
          real-world lengths.
        </p>
        <div className="comparison-columns">
          {[s, getSpecimen(other)].map((item, i) => (
            <section key={i}>
              <div className="comparison-title">
                {i === 0 ? (
                  <h3>{item.name}</h3>
                ) : (
                  <select
                    aria-label="Comparison specimen"
                    value={other}
                    onChange={(e) => setOther(e.target.value)}
                  >
                    {specimens
                      .filter((a) => a.id !== id)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                  </select>
                )}
                <span>{item.group}</span>
              </div>
              <div className="comparison-stage">{view(item, true)}</div>
              <div className="size-row">
                <b>{item.size}</b>
                <span>
                  Representative length: {item.microns.toLocaleString()} µm
                </span>
                <div className="size-track">
                  <i
                    style={{
                      width: `${(item.microns / 2000) * 100}%`,
                      background: item.color,
                    }}
                  />
                </div>
              </div>
              <p>{item.intro}</p>
            </section>
          ))}
        </div>
      </Modal>
      <Modal
        open={notes}
        onClose={closeNotes}
        label="Field notes and sources"
        panelClassName="notes-modal"
      >
        <span className="section-label">THE FIELD NOTES</span>
        <h2>Wonder, with context.</h2>
        <p>
          Microcosmos is an open-source atlas of microscopic life. Explore five
          organisms through curated, interactive illustrations.
        </p>
        <h3>About the models</h3>
        <p>
          AI-generated educational illustrations created with Tripo. Shapes,
          colors, and details are simplified. These are not scans,
          identification tools, or research-grade reconstructions. “Surface” is
          a monochrome rendering style, not an electron-microscope image.
          Structure markers indicate approximate regions.
        </p>
        <h3>Size & scale</h3>
        <p>
          Size varies with species, age, and conditions. Ranges describe the
          represented groups; comparison bars use representative lengths. Models
          are enlarged independently to fit the viewer.
        </p>
        <h3>Reading for {s.name}</h3>
        <a
          className="source-link"
          href={s.source}
          target="_blank"
          rel="noreferrer"
        >
          Read the scientific background <ArrowUpRight size={14} />
        </a>
        <h3>Made possible by open source</h3>
        <p>
          Adapted from{" "}
          <a href="https://github.com/cclank/cell-architecture-studio">
            Cell Architecture Studio
          </a>{" "}
          under the MIT License. Inspired by Dilum Sanjaya and The Bugged Dev.
          Built with React, Three.js, React Three Fiber, and Drei.
        </p>
        <a className="github" href={repo}>
          <Github size={17} /> Explore the source <ArrowUpRight size={14} />
        </a>
      </Modal>
    </div>
  );
}
