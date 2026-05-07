import { useMemo, useState } from "react";
import { findPlantById, PLANTS } from "./data/plants";
import { findRemedyById, REMEDIES, REMEDY_CATEGORIES } from "./data/remedies";

const NAV_ITEMS = [
  { id: "plants", icon: "🌿", label: "Plant Library" },
  { id: "remedies", icon: "🫚", label: "Remedies" },
  { id: "identifier", icon: "🔍", label: "Identify (Coming Soon)" },
  { id: "about", icon: "📜", label: "About" },
];

export default function App() {
  const [activePage, setActivePage] = useState("plants");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedPlantId, setSelectedPlantId] = useState(null);
  const [remedySearch, setRemedySearch] = useState("");
  const [remedyCategory, setRemedyCategory] = useState("all");
  const [selectedRemedyId, setSelectedRemedyId] = useState(null);

  const handleFile = (selectedFile) => {
    setFile(selectedFile);
    setImage(URL.createObjectURL(selectedFile));
    setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setResult(data);
    } catch {
      setResult({ plant: "Error", confidence: "Could not reach backend." });
    } finally {
      setLoading(false);
    }
  };

  const filteredPlants = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = PLANTS.slice().sort((a, b) => a.commonName.localeCompare(b.commonName));
    if (!q) return base;
    return base.filter((p) => {
      const hay = [
        p.commonName,
        p.botanicalName,
        ...(p.otherNames ?? []),
        ...(p.keyUses ?? []),
        ...(p.tags ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [search]);

  const selectedPlant = useMemo(() => {
    if (!selectedPlantId) return null;
    return findPlantById(selectedPlantId);
  }, [selectedPlantId]);

  const plantImageUrlCandidates = (plantId) => ([
    `/plants/${plantId}.jpg`,
    `/plants/${plantId}.png`,
    `/plants/${plantId}.webp`,
  ]);

  const filteredRemedies = useMemo(() => {
    const q = remedySearch.trim().toLowerCase();
    return REMEDIES.filter((r) => {
      if (remedyCategory !== "all" && r.category !== remedyCategory) return false;
      if (!q) return true;
      const herbNames = (r.herbs ?? [])
        .map((id) => findPlantById(id)?.commonName ?? id)
        .join(" ");
      const hay = [r.title, r.summary, r.category, herbNames, ...(r.tips ?? [])]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [remedyCategory, remedySearch]);

  const selectedRemedy = useMemo(() => {
    if (!selectedRemedyId) return null;
    return findRemedyById(selectedRemedyId);
  }, [selectedRemedyId]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'DM Sans', sans-serif;
          background: #f5f0e8;
          color: #2c2416;
        }

        .layout { display: flex; height: 100vh; overflow: hidden; }

        /* SIDEBAR */
        .sidebar {
          width: ${sidebarOpen ? "220px" : "64px"};
          background: #1a2e1a;
          display: flex;
          flex-direction: column;
          transition: width 0.3s ease;
          overflow: hidden;
          flex-shrink: 0;
          z-index: 10;
        }
        .sidebar-logo {
          padding: 20px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid #2d4a2d;
          min-height: 64px;
        }
        .sidebar-logo-icon {
          width: 32px; height: 32px;
          background: #4a7c4a;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }
        .sidebar-logo-text {
          font-family: 'Playfair Display', serif;
          font-size: 15px;
          color: #c8dfc8;
          white-space: nowrap;
          overflow: hidden;
          opacity: ${sidebarOpen ? 1 : 0};
          transition: opacity 0.2s;
        }
        .nav { flex: 1; padding: 16px 8px; display: flex; flex-direction: column; gap: 4px; }
        .nav-item {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 12px;
          border-radius: 10px;
          cursor: pointer;
          transition: background 0.15s;
          color: #8aaa8a;
          white-space: nowrap;
          overflow: hidden;
        }
        .nav-item:hover { background: #2d4a2d; color: #c8dfc8; }
        .nav-item.active { background: #4a7c4a; color: #e8f5e8; }
        .nav-icon { font-size: 18px; flex-shrink: 0; width: 20px; text-align: center; }
        .nav-label {
          font-size: 14px; font-weight: 500;
          opacity: ${sidebarOpen ? 1 : 0};
          transition: opacity 0.2s;
        }
        .sidebar-footer {
          padding: 16px 8px;
          border-top: 1px solid #2d4a2d;
        }

        /* MAIN */
        .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

        /* TOPBAR */
        .topbar {
          height: 64px;
          background: #fffef9;
          border-bottom: 1px solid #e0d8c8;
          display: flex; align-items: center;
          padding: 0 24px;
          gap: 16px;
          flex-shrink: 0;
        }
        .topbar-toggle {
          width: 36px; height: 36px;
          border: none; background: #f0ebe0;
          border-radius: 8px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; color: #5a4a30;
          transition: background 0.15s;
        }
        .topbar-toggle:hover { background: #e0d8c0; }
        .topbar-title {
          font-family: 'Playfair Display', serif;
          font-size: 20px; color: #2c2416;
          flex: 1;
        }
        .topbar-badge {
          background: #e8f5e8; color: #2d5a2d;
          font-size: 12px; font-weight: 500;
          padding: 4px 12px; border-radius: 20px;
          border: 1px solid #c8dfc8;
        }

        /* CONTENT */
        .content {
          flex: 1; overflow-y: auto;
          padding: 32px;
          background: #f5f0e8;
        }

        /* BUTTONS */
        .btn {
          border: 1px solid #d8ccb4;
          background: #fffef9;
          color: #2c2416;
          border-radius: 10px;
          padding: 10px 14px;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          transition: background 0.15s, transform 0.05s;
        }
        .btn:hover { background: #f5f0e8; }
        .btn:active { transform: translateY(1px); }

        /* IDENTIFIER PAGE */
        .identifier-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; max-width: 900px; }
        @media (max-width: 700px) { .identifier-grid { grid-template-columns: 1fr; } }

        .card {
          background: #fffef9;
          border: 1px solid #e0d8c8;
          border-radius: 16px;
          padding: 24px;
        }
        .card-title {
          font-family: 'Playfair Display', serif;
          font-size: 18px; color: #2c2416;
          margin-bottom: 16px;
        }
        .drop-zone {
          border: 2px dashed #c8b896;
          border-radius: 12px;
          min-height: 180px;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          cursor: pointer; transition: border-color 0.2s, background 0.2s;
          background: ${dragging ? "#f0ebe0" : "#faf7f2"};
          border-color: ${dragging ? "#8a6a3a" : "#c8b896"};
          margin-bottom: 16px; padding: 16px;
        }
        .drop-zone:hover { border-color: #8a6a3a; background: #f0ebe0; }
        .drop-icon { font-size: 36px; margin-bottom: 8px; }
        .drop-text { font-size: 13px; color: #8a7a60; text-align: center; line-height: 1.6; }
        .preview-img { max-width: 100%; max-height: 200px; border-radius: 10px; object-fit: cover; }

        .file-label {
          display: inline-block;
          background: #f0ebe0; color: #5a4a30;
          padding: 8px 18px; border-radius: 8px;
          cursor: pointer; font-size: 13px; font-weight: 500;
          border: 1px solid #d8ccb4;
          transition: background 0.15s;
          margin-bottom: 12px;
        }
        .file-label:hover { background: #e0d4b8; }

        .identify-btn {
          width: 100%;
          background: #2d5a2d; color: #e8f5e8;
          border: none; padding: 13px;
          border-radius: 10px; font-size: 15px;
          font-weight: 500; cursor: pointer;
          transition: background 0.15s, opacity 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .identify-btn:hover:not(:disabled) { background: #1a3d1a; }
        .identify-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .result-box {
          background: #eef6ee;
          border: 1px solid #b8d4b8;
          border-radius: 12px; padding: 20px;
          margin-top: 16px;
        }
        .result-plant { font-family: 'Playfair Display', serif; font-size: 22px; color: #1a3d1a; margin-bottom: 4px; }
        .result-conf { font-size: 13px; color: #5a8a5a; }

        .notice {
          background: #fff7e8;
          border: 1px solid #edd4a8;
          color: #5a4a30;
          border-radius: 12px;
          padding: 14px 16px;
          font-size: 13px;
          line-height: 1.6;
          margin-bottom: 16px;
        }

        .tips-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
        .tip-item {
          display: flex; gap: 10px; align-items: flex-start;
          font-size: 13px; color: #5a4a30; line-height: 1.5;
        }
        .tip-dot { width: 6px; height: 6px; border-radius: 50%; background: #8a6a3a; margin-top: 6px; flex-shrink: 0; }

        /* REMEDIES PAGE */
        .remedies-toolbar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
        .select {
          background: #fffef9;
          border: 1px solid #e0d8c8;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          color: #2c2416;
          outline: none;
        }
        .select:focus { border-color: #8a6a3a; }
        .remedies-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; max-width: 1000px; }
        .remedy-card {
          background: #fffef9; border: 1px solid #e0d8c8;
          border-radius: 14px; padding: 20px;
          transition: transform 0.15s, box-shadow 0.15s;
          cursor: pointer;
        }
        .remedy-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(44,36,22,0.1); }
        .remedy-condition { font-family: 'Playfair Display', serif; font-size: 16px; color: #2c2416; margin-bottom: 8px; }
        .remedy-herbs { font-size: 12px; color: #8a6a3a; background: #f5ede0; padding: 4px 10px; border-radius: 20px; display: inline-block; margin-bottom: 10px; }
        .remedy-summary { font-size: 13px; color: #5a4a30; line-height: 1.6; }
        .remedy-prep { font-size: 13px; color: #5a4a30; line-height: 1.6; }

        /* PLANT LIBRARY PAGE */
        .herbs-search {
          background: #fffef9; border: 1px solid #e0d8c8;
          border-radius: 10px; padding: 10px 16px;
          font-size: 14px; font-family: 'DM Sans', sans-serif;
          width: 100%; max-width: 360px;
          margin-bottom: 24px; color: #2c2416;
          outline: none;
        }
        .herbs-search:focus { border-color: #8a6a3a; }
        .plants-toolbar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .plants-count { font-size: 12px; color: #8a7a60; }
        .herbs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; max-width: 1100px; }
        .herb-card {
          background: #fffef9; border: 1px solid #e0d8c8;
          border-radius: 12px; padding: 16px;
          display: flex; align-items: flex-start; gap: 14px;
          transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
          cursor: pointer;
        }
        .herb-card:hover { background: #f5f0e8; transform: translateY(-1px); box-shadow: 0 6px 18px rgba(44,36,22,0.08); }
        .plant-thumb {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          object-fit: cover;
          border: 1px solid #e0d8c8;
          background: #faf7f2;
          flex-shrink: 0;
        }
        .herb-emoji { font-size: 28px; }
        .herb-name { font-family: 'Playfair Display', serif; font-size: 15px; color: #2c2416; }
        .herb-use { font-size: 12px; color: #8a7a60; margin-top: 2px; }
        .plant-botanical { font-size: 12px; color: #6a5a45; margin-top: 4px; }
        .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
        .chip {
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 999px;
          border: 1px solid #d8ccb4;
          color: #5a4a30;
          background: #faf7f2;
        }

        /* PLANT DETAIL MODAL */
        .modal-backdrop {
          position: fixed; inset: 0;
          background: rgba(26, 46, 26, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
          z-index: 50;
        }
        .modal {
          width: 100%;
          max-width: 760px;
          background: #fffef9;
          border: 1px solid #e0d8c8;
          border-radius: 18px;
          box-shadow: 0 24px 70px rgba(0,0,0,0.25);
          overflow: hidden;
        }
        .modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 18px 20px;
          border-bottom: 1px solid #eee6d8;
          background: #fff;
        }
        .modal-title { display: flex; align-items: center; gap: 12px; }
        .modal-emoji { font-size: 28px; }
        .modal-names h3 {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          color: #2c2416;
          margin-bottom: 2px;
        }
        .modal-names p { font-size: 12px; color: #8a7a60; line-height: 1.5; }
        .modal-body { padding: 18px 20px 22px; }
        .plant-hero {
          width: 100%;
          height: 200px;
          border-radius: 14px;
          object-fit: cover;
          border: 1px solid #e0d8c8;
          background: #faf7f2;
          margin-top: 14px;
        }
        .section { margin-top: 16px; }
        .section h4 {
          font-family: 'Playfair Display', serif;
          font-size: 14px;
          color: #2c2416;
          margin-bottom: 8px;
        }
        .text { font-size: 13px; color: #5a4a30; line-height: 1.8; }
        .list { margin-left: 18px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 740px) { .grid-2 { grid-template-columns: 1fr; } }

        /* ABOUT PAGE */
        .about-card { max-width: 600px; }
        .about-text { font-size: 14px; color: #5a4a30; line-height: 1.8; margin-bottom: 16px; }
        .about-tag {
          display: inline-block; background: #e8f5e8; color: #2d5a2d;
          font-size: 12px; padding: 4px 12px; border-radius: 20px;
          margin: 4px; border: 1px solid #c8dfc8;
        }

        /* PAGE HEADER */
        .page-header { margin-bottom: 28px; }
        .page-heading { font-family: 'Playfair Display', serif; font-size: 28px; color: #2c2416; margin-bottom: 6px; }
        .page-sub { font-size: 14px; color: #8a7a60; }

        /* SPINNER */
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner { width: 24px; height: 24px; border: 3px solid #c8dfc8; border-top-color: #2d5a2d; border-radius: 50%; animation: spin 0.7s linear infinite; margin: 16px auto 0; }
      `}</style>

      <div className="layout">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">🌿</div>
            <span className="sidebar-logo-text">AyurVeda</span>
          </div>
          <nav className="nav">
            {NAV_ITEMS.map(item => (
              <div
                key={item.id}
                className={`nav-item ${activePage === item.id ? "active" : ""}`}
                onClick={() => setActivePage(item.id)}
                title={item.label}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </div>
            ))}
          </nav>
          <div className="sidebar-footer">
            <div className="nav-item" style={{ color: "#8aaa8a", fontSize: 12 }}>
              <span className="nav-icon">🌱</span>
              <span className="nav-label" style={{ fontSize: 11 }}>v1.0 · Sandesh</span>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <div className="main">
          {/* TOPBAR */}
          <header className="topbar">
            <button className="topbar-toggle" onClick={() => setSidebarOpen(o => !o)}>
              {sidebarOpen ? "◀" : "▶"}
            </button>
            <h1 className="topbar-title">
              {NAV_ITEMS.find(n => n.id === activePage)?.label}
            </h1>
            <span className="topbar-badge">🌿 Ayurvedic App</span>
          </header>

          {/* CONTENT */}
          <main className="content">

            {/* PLANT IDENTIFIER */}
            {activePage === "identifier" && (
              <>
                <div className="page-header">
                  <h2 className="page-heading">Identify a Plant</h2>
                  <p className="page-sub">UI is ready — ML identification will be added last</p>
                </div>
                <div className="notice">
                  The read-only encyclopedia (Plant Library + Remedies) is being completed first.
                  Identification will be enabled once the ML model is integrated.
                </div>
                <div className="identifier-grid">
                  <div className="card">
                    <p className="card-title">Upload Image</p>
                    <div
                      className="drop-zone"
                      onDragOver={e => { e.preventDefault(); setDragging(true); }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={handleDrop}
                    >
                      {image
                        ? <img src={image} alt="Selected plant" className="preview-img" />
                        : <>
                            <div className="drop-icon">🌿</div>
                            <p className="drop-text">Drag & drop a plant image here<br />or choose a file below</p>
                          </>
                      }
                    </div>
                    <label className="file-label">
                      Choose Image
                      <input type="file" accept="image/*" onChange={e => handleFile(e.target.files[0])} hidden />
                    </label>
                    <br />
                    <button className="identify-btn" onClick={handleUpload} disabled={!file || loading}>
                      {loading ? "Identifying…" : "Identify Plant 🌱"}
                    </button>
                    {loading && <div className="spinner" />}
                    {result && (
                      <div className="result-box">
                        <p className="result-plant">🌿 {result.plant}</p>
                        <p className="result-conf">Confidence: {result.confidence}</p>
                      </div>
                    )}
                  </div>

                  <div className="card">
                    <p className="card-title">Tips for best results</p>
                    <ul className="tips-list">
                      {[
                        "Use a clear, well-lit photo of the plant",
                        "Capture leaves, flowers, or bark close-up",
                        "Avoid blurry or dark images",
                        "One plant per image works best",
                        "Natural daylight gives the most accurate results",
                      ].map((tip, i) => (
                        <li key={i} className="tip-item">
                          <span className="tip-dot" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            )}

            {/* PLANT LIBRARY */}
            {activePage === "plants" && (
              <>
                <div className="page-header">
                  <h2 className="page-heading">Plant Library</h2>
                  <p className="page-sub">Read-only Ayurvedic plant profiles (expandable)</p>
                </div>

                <div className="plants-toolbar">
                  <input
                    className="herbs-search"
                    placeholder="Search by name, use, or botanical name…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <div className="plants-count">
                    {filteredPlants.length} plant{filteredPlants.length === 1 ? "" : "s"}
                  </div>
                </div>

                <div className="herbs-grid">
                  {filteredPlants.map((p) => (
                    <div
                      key={p.id}
                      className="herb-card"
                      onClick={() => setSelectedPlantId(p.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") setSelectedPlantId(p.id);
                      }}
                      title={`Open ${p.commonName}`}
                    >
                      <img
                        className="plant-thumb"
                        src={plantImageUrlCandidates(p.id)[0]}
                        alt={p.commonName}
                        loading="lazy"
                        onError={(e) => {
                          const el = e.currentTarget;
                          const list = plantImageUrlCandidates(p.id);
                          const idx = list.indexOf(el.src.replace(window.location.origin, ""));
                          const next = list[idx + 1];
                          if (next) el.src = next;
                          else el.style.display = "none";
                        }}
                      />
                      <span className="herb-emoji">{p.emoji ?? "🌿"}</span>
                      <div style={{ flex: 1 }}>
                        <p className="herb-name">{p.commonName}</p>
                        <p className="plant-botanical">{p.botanicalName}</p>
                        <p className="herb-use">{(p.keyUses ?? []).slice(0, 2).join(" • ")}</p>
                        <div className="chips">
                          {(p.tags ?? []).slice(0, 3).map((t) => (
                            <span key={t} className="chip">{t}</span>
                          ))}
                        </div>
                      </div>
                      <div style={{ color: "#8a7a60", fontSize: 12, marginTop: 2 }}>View</div>
                    </div>
                  ))}
                </div>

                {selectedPlant && (
                  <div
                    className="modal-backdrop"
                    onClick={() => setSelectedPlantId(null)}
                    role="presentation"
                  >
                    <div
                      className="modal"
                      onClick={(e) => e.stopPropagation()}
                      role="dialog"
                      aria-modal="true"
                    >
                      <div className="modal-header">
                        <div className="modal-title">
                          <div className="modal-emoji">{selectedPlant.emoji ?? "🌿"}</div>
                          <div className="modal-names">
                            <h3>{selectedPlant.commonName}</h3>
                            <p>
                              <em>{selectedPlant.botanicalName}</em>
                              {selectedPlant.otherNames?.length ? ` · ${selectedPlant.otherNames.join(", ")}` : ""}
                            </p>
                          </div>
                        </div>
                        <button className="btn" onClick={() => setSelectedPlantId(null)}>Close</button>
                      </div>
                      <div className="modal-body">
                        <p className="text">{selectedPlant.description}</p>
                        <img
                          className="plant-hero"
                          src={plantImageUrlCandidates(selectedPlant.id)[0]}
                          alt={selectedPlant.commonName}
                          loading="lazy"
                          onError={(e) => {
                            const el = e.currentTarget;
                            const list = plantImageUrlCandidates(selectedPlant.id);
                            const idx = list.indexOf(el.src.replace(window.location.origin, ""));
                            const next = list[idx + 1];
                            if (next) el.src = next;
                            else el.style.display = "none";
                          }}
                        />

                        <div className="section grid-2">
                          <div className="card" style={{ padding: 16 }}>
                            <p className="card-title" style={{ marginBottom: 10 }}>Key uses</p>
                            <ul className="text list">
                              {(selectedPlant.keyUses ?? []).map((u) => (
                                <li key={u}>{u}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="card" style={{ padding: 16 }}>
                            <p className="card-title" style={{ marginBottom: 10 }}>Parts & forms</p>
                            <p className="text"><strong>Parts used:</strong> {(selectedPlant.partsUsed ?? []).join(", ")}</p>
                            <p className="text" style={{ marginTop: 10 }}><strong>Common forms:</strong> {(selectedPlant.forms ?? []).join(", ")}</p>
                          </div>
                        </div>

                        <div className="section">
                          <h4>Precautions</h4>
                          <ul className="text list">
                            {(selectedPlant.precautions ?? []).map((p) => (
                              <li key={p}>{p}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="section">
                          <h4>Tags</h4>
                          <div className="chips">
                            {(selectedPlant.tags ?? []).map((t) => (
                              <span key={t} className="chip">{t}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* REMEDIES */}
            {activePage === "remedies" && (
              <>
                <div className="page-header">
                  <h2 className="page-heading">Ayurvedic Remedies</h2>
                  <p className="page-sub">Read-only home-style routines and preparations</p>
                </div>

                <div className="remedies-toolbar">
                  <input
                    className="herbs-search"
                    placeholder="Search remedies (e.g. cough, digestion, turmeric)…"
                    value={remedySearch}
                    onChange={(e) => setRemedySearch(e.target.value)}
                  />
                  <select
                    className="select"
                    value={remedyCategory}
                    onChange={(e) => setRemedyCategory(e.target.value)}
                    aria-label="Filter by category"
                  >
                    <option value="all">All categories</option>
                    {REMEDY_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                  <div className="plants-count">
                    {filteredRemedies.length} remed{filteredRemedies.length === 1 ? "y" : "ies"}
                  </div>
                </div>

                <div className="remedies-grid">
                  {filteredRemedies.map((r) => (
                    <div
                      key={r.id}
                      className="remedy-card"
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedRemedyId(r.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") setSelectedRemedyId(r.id);
                      }}
                      title={`Open ${r.title}`}
                    >
                      <p className="remedy-condition">{r.title}</p>
                      <span className="remedy-herbs">
                        {r.herbs
                          .map((id) => findPlantById(id)?.commonName ?? id)
                          .join(", ")}
                      </span>
                      <p className="remedy-summary">{r.summary}</p>
                      <div className="chips">
                        {r.herbs.slice(0, 3).map((id) => {
                          const p = findPlantById(id);
                          if (!p) return null;
                          return (
                            <span
                              key={id}
                              className="chip"
                              role="button"
                              tabIndex={0}
                              onClick={() => { setSelectedPlantId(id); setActivePage("plants"); }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") { setSelectedPlantId(id); setActivePage("plants"); }
                              }}
                              title={`Open ${p.commonName}`}
                              style={{ cursor: "pointer" }}
                            >
                              {p.emoji ?? "🌿"} {p.commonName}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {selectedRemedy && (
                  <div
                    className="modal-backdrop"
                    onClick={() => setSelectedRemedyId(null)}
                    role="presentation"
                  >
                    <div
                      className="modal"
                      onClick={(e) => e.stopPropagation()}
                      role="dialog"
                      aria-modal="true"
                    >
                      <div className="modal-header">
                        <div className="modal-title">
                          <div className="modal-emoji">🫚</div>
                          <div className="modal-names">
                            <h3>{selectedRemedy.title}</h3>
                            <p>
                              {REMEDY_CATEGORIES.find((c) => c.id === selectedRemedy.category)?.label ?? selectedRemedy.category}
                              {" · "}
                              {selectedRemedy.herbs
                                .map((id) => findPlantById(id)?.commonName ?? id)
                                .join(", ")}
                            </p>
                          </div>
                        </div>
                        <button className="btn" onClick={() => setSelectedRemedyId(null)}>Close</button>
                      </div>
                      <div className="modal-body">
                        <p className="text">{selectedRemedy.summary}</p>

                        <div className="section">
                          <h4>Steps</h4>
                          <ol className="text list">
                            {(selectedRemedy.steps ?? []).map((s) => (
                              <li key={s}>{s}</li>
                            ))}
                          </ol>
                        </div>

                        {!!(selectedRemedy.tips ?? []).length && (
                          <div className="section">
                            <h4>Tips</h4>
                            <ul className="text list">
                              {(selectedRemedy.tips ?? []).map((t) => (
                                <li key={t}>{t}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {!!(selectedRemedy.precautions ?? []).length && (
                          <div className="section">
                            <h4>Precautions</h4>
                            <ul className="text list">
                              {(selectedRemedy.precautions ?? []).map((p) => (
                                <li key={p}>{p}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="section">
                          <h4>Ingredients (tap to open plant)</h4>
                          <div className="chips">
                            {selectedRemedy.herbs.map((id) => {
                              const p = findPlantById(id);
                              if (!p) return (
                                <span key={id} className="chip">{id}</span>
                              );
                              return (
                                <span
                                  key={id}
                                  className="chip"
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => { setSelectedPlantId(id); setActivePage("plants"); setSelectedRemedyId(null); }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") { setSelectedPlantId(id); setActivePage("plants"); setSelectedRemedyId(null); }
                                  }}
                                  title={`Open ${p.commonName}`}
                                  style={{ cursor: "pointer" }}
                                >
                                  {p.emoji ?? "🌿"} {p.commonName}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ABOUT */}
            {activePage === "about" && (
              <>
                <div className="page-header">
                  <h2 className="page-heading">About</h2>
                  <p className="page-sub">The story behind this project</p>
                </div>
                <div className="card about-card">
                  <p className="about-text">
                    AyurVeda App is a project by <strong>Sandesh Dharel</strong>, a Computer Engineering student from Chitwan, Nepal. The goal is to bridge traditional Ayurvedic knowledge with modern technology — making ancient remedies accessible to everyone through a simple, beautiful interface.
                  </p>
                  <p className="about-text">
                    Browse a growing library of Ayurvedic plants, explore remedies, and (soon) identify a plant from an image using ML. More features are on the way.
                  </p>
                  <div>
                    <span className="about-tag">React Frontend</span>
                    <span className="about-tag">Flask Backend</span>
                    <span className="about-tag">Python 3.14</span>
                    <span className="about-tag">Plant Library (Read-only)</span>
                    <span className="about-tag">Made in Nepal 🇳🇵</span>
                  </div>
                </div>
              </>
            )}

          </main>
        </div>
      </div>
    </>
  );
}
