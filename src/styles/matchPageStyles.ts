// Match page styles exported as a JS string for reliable injection
// This avoids CSS import issues with Turbopack/Vercel

export const matchPageStyles = `
  /* ── tokens ── */
  .mdp-root {
    --mdp-cyan: #00E5FF;
    --mdp-green: #00FF87;
    --mdp-purple: #7C3AED;
    --mdp-amber: #F59E0B;
    --mdp-red: #EF4444;
    --mdp-teal: #06B6D4;
    --mdp-bg: #040A14;
    --mdp-surface: rgba(255,255,255,0.03);
    --mdp-surface-2: rgba(255,255,255,0.05);
    --mdp-border: rgba(255,255,255,0.07);
    --mdp-border-med: rgba(255,255,255,0.12);
    --mdp-text-1: #F0F4F8;
    --mdp-text-2: #94A3B8;
    --mdp-text-3: #475569;
  }

  @keyframes mdp-pulse { 0% { transform:scale(1); opacity:.5 } 100% { transform:scale(2.5); opacity:0 } }
  .mdp-live-dot { display:inline-block; position:relative; width:8px; height:8px; flex-shrink:0 }
  .mdp-live-dot::before { content:''; position:absolute; inset:0; border-radius:50%; background:var(--mdp-red); animation:mdp-pulse 1.4s ease-out infinite; opacity:.5 }
  .mdp-live-dot::after  { content:''; position:absolute; inset:1px; border-radius:50%; background:var(--mdp-red) }
  .mdp-live-dot.amber::before, .mdp-live-dot.amber::after { background:var(--mdp-amber) }
  .mdp-live-dot.green::before,  .mdp-live-dot.green::after  { background:var(--mdp-green) }

  .mdp-hero {
    background: linear-gradient(135deg, rgba(0,229,255,0.08) 0%, rgba(124,58,237,0.06) 50%, rgba(0,255,135,0.04) 100%);
    border: 1px solid rgba(0,229,255,0.12);
    border-radius: 16px;
    padding: 20px 24px;
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(8px);
  }
  .mdp-hero::before {
    content: '';
    position: absolute;
    top: -60px; right: -60px;
    width: 220px; height: 220px;
    background: radial-gradient(circle, rgba(0,229,255,0.08), transparent 65%);
    pointer-events: none;
  }
  .mdp-hero-eyebrow {
    font-size: 10px; font-weight: 700; letter-spacing: .18em;
    color: var(--mdp-cyan); text-transform: uppercase; margin-bottom: 6px;
    display: flex; align-items: center; gap: 7px;
  }
  .mdp-hero-title {
    font-size: clamp(20px, 2.5vw, 28px);
    font-weight: 800; letter-spacing: -.025em;
    color: var(--mdp-text-1); margin: 0 0 4px;
    font-family: "Space Grotesk", "DM Sans", sans-serif;
  }
  .mdp-hero-sub { font-size: 12px; color: var(--mdp-text-3); }

  .mdp-score-big {
    font-size: clamp(36px, 5vw, 56px);
    font-weight: 900; letter-spacing: -.04em;
    color: var(--mdp-text-1); line-height: 1;
  }
  .mdp-score-over { font-size: 13px; color: var(--mdp-text-3); margin-top: 3px; font-family: monospace; }

  .mdp-pill {
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 10px;
    padding: 10px 14px;
    min-height: 64px;
    display: flex; flex-direction: column; justify-content: space-between;
    transition: border-color .2s, box-shadow .2s;
  }
  .mdp-pill:hover { border-color: rgba(0,229,255,0.25); box-shadow: 0 0 12px rgba(0,229,255,0.08); }
  .mdp-pill-label {
    font-size: 10px; font-weight: 700; letter-spacing: .14em;
    text-transform: uppercase; color: var(--mdp-text-3);
  }
  .mdp-pill-value {
    font-size: 14px; font-weight: 700; color: var(--mdp-text-1); margin-top: 6px;
  }
  .mdp-pill.cyan  { border-color: rgba(0,229,255,0.15); }
  .mdp-pill.green { border-color: rgba(0,255,135,0.15); }
  .mdp-pill.amber { border-color: rgba(245,158,11,0.15); }
  .mdp-pill.red   { border-color: rgba(239,68,68,0.15); }
  .mdp-pill.cyan  .mdp-pill-value { color: var(--mdp-cyan); }
  .mdp-pill.green .mdp-pill-value { color: var(--mdp-green); }
  .mdp-pill.amber .mdp-pill-value { color: var(--mdp-amber); }
  .mdp-pill.red   .mdp-pill-value { color: var(--mdp-red); }

  .mdp-ball {
    width: 32px; height: 32px; border-radius: 50%;
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    color: var(--mdp-text-1); flex-shrink: 0;
  }
  .mdp-ball.four   { background: rgba(0,229,255,0.15); border-color: rgba(0,229,255,0.35); color: var(--mdp-cyan); }
  .mdp-ball.six    { background: rgba(0,255,135,0.15); border-color: rgba(0,255,135,0.35); color: var(--mdp-green); }
  .mdp-ball.wicket { background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.35); color: var(--mdp-red); }
  .mdp-ball.wide   { background: rgba(245,158,11,0.1);  border-color: rgba(245,158,11,0.25); color: var(--mdp-amber); }
  .mdp-ball.noball { background: rgba(245,158,11,0.1);  border-color: rgba(245,158,11,0.25); color: var(--mdp-amber); }

  .mdp-tabbar {
    display: flex; gap: 0;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    overflow-x: auto;
    position: sticky; top: 24px; z-index: 20;
    background: rgba(4,10,20,0.92); backdrop-filter: blur(16px) saturate(1.2);
    border-radius: 0;
    padding: 0 2px;
  }
  .mdp-tabbar::-webkit-scrollbar { display: none; }
  .mdp-tab {
    padding: 10px 16px; font-size: 12px; font-weight: 600;
    letter-spacing: .05em; text-transform: capitalize;
    color: var(--mdp-text-3); white-space: nowrap;
    border: none; background: none; cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: color .2s, border-color .2s;
  }
  .mdp-tab:hover  { color: var(--mdp-text-2); }
  .mdp-tab.active { color: var(--mdp-cyan); border-bottom-color: var(--mdp-cyan); font-weight: 700; }

  .mdp-sec-eyebrow {
    font-size: 10px; font-weight: 700; letter-spacing: .18em;
    text-transform: uppercase; color: rgba(0,229,255,0.7); margin-bottom: 4px;
  }
  .mdp-sec-title { font-size: 16px; font-weight: 700; color: var(--mdp-text-1); }

  .mdp-card {
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px; padding: 18px 20px;
    transition: border-color .2s, box-shadow .2s;
  }
  .mdp-card:hover { border-color: rgba(0,229,255,0.15); box-shadow: 0 0 15px rgba(0,229,255,0.06); }

  .mdp-rail-label {
    font-size: 9px; font-weight: 700; letter-spacing: .18em;
    text-transform: uppercase; color: var(--mdp-text-3); margin-bottom: 3px;
  }
  .mdp-rail-value {
    font-size: 14px; font-weight: 700; color: var(--mdp-text-1);
    padding: 8px 12px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 8px;
  }
  .mdp-rail-value.cyan  { color: var(--mdp-cyan); border-color: rgba(0,229,255,0.15); background: rgba(0,229,255,0.05); }
  .mdp-rail-value.green { color: var(--mdp-green); border-color: rgba(0,255,135,0.15); background: rgba(0,255,135,0.05); }
  .mdp-rail-value.amber { color: var(--mdp-amber); border-color: rgba(245,158,11,0.15); background: rgba(245,158,11,0.05); }

  .mdp-batter-row {
    display: grid;
    grid-template-columns: minmax(140px,1.6fr) .7fr .7fr .7fr .8fr;
    gap: 10px; align-items: center;
    padding: 10px 14px; border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.07);
    background: rgba(255,255,255,0.025);
    font-size: 13px; transition: background .2s;
  }
  .mdp-batter-row:hover { background: rgba(255,255,255,0.045); }
  .mdp-batter-row.striker  { border-color: rgba(245,158,11,0.25); background: rgba(245,158,11,0.07); }
  .mdp-batter-row.nonstriker { border-color: rgba(0,229,255,0.2); background: rgba(0,229,255,0.05); }

  .mdp-bowler-row {
    display: grid; grid-template-columns: 1fr repeat(4, .7fr);
    gap: 10px; align-items: center;
    padding: 10px 14px; border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.06);
    background: rgba(255,255,255,0.025);
    font-size: 13px; transition: background .2s;
  }
  .mdp-bowler-row:hover { background: rgba(255,255,255,0.04); }

  .mdp-innings-btn {
    padding: 7px 18px; border-radius: 8px; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all .2s;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04); color: var(--mdp-text-2);
  }
  .mdp-innings-btn.active {
    background: linear-gradient(135deg, var(--mdp-cyan), #0077FF);
    border-color: transparent; color: #040A14;
  }

  .mdp-squad-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 9px 14px; border-radius: 9px;
    border: 1px solid rgba(255,255,255,0.06);
    background: rgba(255,255,255,0.025);
    font-size: 13px; transition: background .2s;
  }
  .mdp-squad-row:hover { background: rgba(255,255,255,0.05); }
  .mdp-role-badge {
    font-size: 10px; font-weight: 700; letter-spacing: .08em;
    padding: 2px 7px; border-radius: 4px;
  }
  .mdp-role-badge.BAT  { background: rgba(0,255,135,0.1); color: var(--mdp-green); }
  .mdp-role-badge.BOWL { background: rgba(239,68,68,0.1); color: var(--mdp-red); }
  .mdp-role-badge.AR   { background: rgba(0,229,255,0.1); color: var(--mdp-cyan); }
  .mdp-role-badge.WK   { background: rgba(245,158,11,0.1); color: var(--mdp-amber); }

  .mdp-admin-btn {
    padding: 10px 20px; border-radius: 10px; font-size: 13px; font-weight: 700;
    cursor: pointer; transition: all .2s; border: none;
    letter-spacing: .03em;
  }
  .mdp-admin-btn.start  { background: linear-gradient(135deg,#00E5FF,#0077FF); color:#040A14; }
  .mdp-admin-btn.start:hover  { box-shadow: 0 0 28px rgba(0,229,255,0.3); transform: translateY(-1px); }
  .mdp-admin-btn.pause  { background: rgba(245,158,11,0.85); color:#040A14; }
  .mdp-admin-btn.stop   { background: rgba(239,68,68,0.8); color:#fff; }
  .mdp-admin-btn:disabled { opacity:.45; cursor:not-allowed; transform:none !important; box-shadow:none !important; }
  .mdp-speed-btn {
    padding: 7px 14px; border-radius: 8px; font-size: 12px; font-weight: 700;
    cursor: pointer; transition: all .2s;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04); color: var(--mdp-text-2);
  }
  .mdp-speed-btn.active {
    border-color: rgba(0,229,255,0.3);
    background: rgba(0,229,255,0.1);
    color: var(--mdp-cyan);
  }

  .mdp-prob-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
  .mdp-prob-cell {
    padding: 12px 14px; border-radius: 10px; border: 1px solid transparent;
  }
  .mdp-prob-cell .label { font-size: 10px; text-transform:uppercase; letter-spacing:.12em; margin-bottom:6px; }
  .mdp-prob-cell .val   { font-size: 18px; font-weight: 800; }
  .mdp-prob-cell.batting { background: rgba(0,255,135,0.07); border-color: rgba(0,255,135,0.2); }
  .mdp-prob-cell.batting .label { color: rgba(0,255,135,0.7); }
  .mdp-prob-cell.batting .val   { color: var(--mdp-green); }
  .mdp-prob-cell.bowling { background: rgba(239,68,68,0.07); border-color: rgba(239,68,68,0.2); }
  .mdp-prob-cell.bowling .label { color: rgba(239,68,68,0.8); }
  .mdp-prob-cell.bowling .val   { color: var(--mdp-red); }
  .mdp-prob-cell.pressure { background: rgba(245,158,11,0.07); border-color: rgba(245,158,11,0.2); }
  .mdp-prob-cell.pressure .label { color: rgba(245,158,11,0.8); }
  .mdp-prob-cell.pressure .val   { color: var(--mdp-amber); }

  .mdp-live-split { display: grid; grid-template-columns: minmax(0,1fr) 290px; gap: 14px; }
  @media(max-width:1024px) { .mdp-live-split { grid-template-columns:1fr; } }

  .mdp-ctrl-btn {
    display:inline-flex; align-items:center; gap:7px;
    padding:9px 18px; border-radius:9px; font-size:13px; font-weight:700;
    cursor:pointer; transition:all .2s; border:none;
  }
  .mdp-ctrl-btn.primary { background:linear-gradient(135deg,#00E5FF,#0077FF); color:#040A14; }
  .mdp-ctrl-btn.primary:hover { box-shadow:0 0 24px rgba(0,229,255,0.25); transform:translateY(-1px); }
  .mdp-ctrl-btn.ghost { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); color:var(--mdp-text-2); }
  .mdp-ctrl-btn.ghost:hover { border-color:rgba(0,229,255,0.3); color:var(--mdp-cyan); }

  .mdp-replay-btn {
    padding:6px 14px; border-radius:8px; font-size:12px; font-weight:600;
    background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1);
    color:var(--mdp-text-2); cursor:pointer; transition:all .2s;
  }
  .mdp-replay-btn:hover { border-color:rgba(0,229,255,0.3); color:var(--mdp-cyan); }

  .mdp-divider { height:1px; background:rgba(255,255,255,0.06); margin:0; }

  .mdp-root ::-webkit-scrollbar { width:4px; height:4px; }
  .mdp-root ::-webkit-scrollbar-track { background:transparent; }
  .mdp-root ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:4px; }
`;
