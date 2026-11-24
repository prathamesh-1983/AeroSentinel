import { useEffect, useMemo, useState } from "react";
import {
  Activity, Wind, ShieldCheck, House, Route, Bot, LayoutDashboard,
  RefreshCw, MapPin, AlertTriangle, Leaf, Menu, X, ArrowUpRight,
  Gauge, Users, Calculator, Send, CloudSun, CheckCircle2
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, BarChart, Bar
} from "recharts";
import { api } from "./services/api";
import MapPanel from "./components/MapPanel";

type Tab = "overview" | "aerointel" | "familyguard" | "indoorair" | "ecoflow" | "advisor";

const nav: { id: Tab; label: string; icon: any }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "aerointel", label: "AEROINTEL", icon: Wind },
  { id: "familyguard", label: "FAMILYGUARD", icon: ShieldCheck },
  { id: "indoorair", label: "INDOORAIR", icon: House },
  { id: "ecoflow", label: "ECOFLOW", icon: Route },
  { id: "advisor", label: "AI Advisor", icon: Bot }
];

const DEFAULT_LAT = 19.076;
const DEFAULT_LON = 72.8777;

function value(v: unknown, unit = "") {
  return typeof v === "number" ? `${v.toFixed(v < 10 ? 1 : 0)}${unit}` : "N/A";
}

export default function App() {
  const [tab, setTab] = useState<Tab>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lat, setLat] = useState(DEFAULT_LAT);
  const [lon, setLon] = useState(DEFAULT_LON);
  const [air, setAir] = useState<any>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [households, setHouseholds] = useState<any[]>([]);
  const [householdForm, setHouseholdForm] = useState({ name: "My Household", city: "Mumbai", household_size: 4, rooms: 3, monthly_budget: 2500, routine: "School and office commute on weekdays" });
  const [cadrInput, setCadrInput] = useState({ length_m: 5, width_m: 4, height_m: 2.8, air_changes_per_hour: 5 });
  const [cadrResult, setCadrResult] = useState<any>(null);
  const [routeInput, setRouteInput] = useState({ origin_lat: 19.076, origin_lon: 72.8777, destination_lat: 19.2183, destination_lon: 72.9781, mode: "car" });
  const [routeResult, setRouteResult] = useState<any>(null);
  const [question, setQuestion] = useState("How can my family reduce exposure during a pollution peak?");
  const [answer, setAnswer] = useState<any>(null);
  const [asking, setAsking] = useState(false);
  const [notice, setNotice] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");
    try {
      const [a, f, al, h] = await Promise.all([
        api.currentAir(lat, lon), api.forecast(lat, lon), api.alerts(lat, lon), api.households()
      ]);
      setAir(a);
      setForecast(f);
      setAlerts(al.alerts || []);
      setHouseholds(h);
    } catch (e: any) {
      setError(e.message || "Could not connect to the backend. Check that FastAPI is running.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadDashboard(); }, [lat, lon]);

  const current = air?.current || {};
  const forecastData = useMemo(() => (forecast?.points || []).slice(0, 18).map((p: any) => ({
    ...p, label: p.time ? new Date(p.time).toLocaleTimeString([], { hour: "2-digit" }) : ""
  })), [forecast]);

  async function saveHousehold(e: React.FormEvent) {
    e.preventDefault();
    try {
      const created = await api.createHousehold(householdForm);
      setHouseholds((old) => [created, ...old]);
      setNotice("Household profile saved successfully.");
    } catch (e: any) { setNotice(e.message); }
  }

  async function calculateCadr(e: React.FormEvent) {
    e.preventDefault();
    try { setCadrResult(await api.cadr(cadrInput)); }
    catch (e: any) { setNotice(e.message); }
  }

  async function compareRoute(e: React.FormEvent) {
    e.preventDefault();
    try { setRouteResult(await api.route(routeInput)); }
    catch (e: any) { setNotice(e.message); }
  }

  async function askAdvisor(e: React.FormEvent) {
    e.preventDefault();
    setAsking(true);
    try {
      setAnswer(await api.ask(question, { location: air?.location, current: air?.current, data_status: air?.data_status }));
    } catch (e: any) { setAnswer({ answer: e.message, provider: "Request error" }); }
    finally { setAsking(false); }
  }

  const statusLabel = air?.is_demo ? "DEMO DATA" : "PROVIDER DATA";
  const aqi = current.us_aqi;
  const aqiLabel = typeof aqi === "number" ? (aqi <= 50 ? "Good" : aqi <= 100 ? "Moderate" : aqi <= 150 ? "Unhealthy for sensitive groups" : "Unhealthy") : "Unavailable";

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><Wind size={23} /></div>
          <div><strong>AERO<span>SENTINEL</span></strong><small>URBAN AIR INTELLIGENCE</small></div>
          <button className="icon-btn mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X /></button>
        </div>
        <div className="nav-caption">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {nav.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`nav-item ${tab === id ? "active" : ""}`} onClick={() => { setTab(id); setMobileOpen(false); }}>
              <Icon size={18} /><span>{label}</span>{id === "aerointel" && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="mini-status"><span className="pulse" /> Systems operational</div>
          <p>Environmental decision support · v1.0</p>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="icon-btn mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu /></button>
          <div className="breadcrumb">Workspace <span>/</span> {nav.find(n => n.id === tab)?.label}</div>
          <div className="top-actions">
            <div className="location-chip"><MapPin size={15} /><span>Mumbai region</span></div>
            <button className="icon-btn" onClick={() => void loadDashboard()} aria-label="Refresh data"><RefreshCw size={17} /></button>
            <div className="avatar">AS</div>
          </div>
        </header>

        <div className="content">
          <section className="welcome-row">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /> INTELLIGENCE PLATFORM</div>
              <h1>{tab === "overview" ? "Clean air starts with intelligence." : nav.find(n => n.id === tab)?.label}</h1>
              <p className="subtitle">Environmental insights translated into practical, everyday decisions.</p>
            </div>
            <div className="live-pill"><span className="pulse" /> {loading ? "SYNCING" : "SYSTEM READY"}</div>
          </section>

          {error && <div className="notice error"><AlertTriangle size={17} /> {error}</div>}
          {notice && <div className="notice"><CheckCircle2 size={17} /> {notice}<button onClick={() => setNotice("")}>Dismiss</button></div>}

          {(tab === "overview" || tab === "aerointel") && <>
            <div className="section-heading"><div><h2>{tab === "overview" ? "Environmental overview" : "Urban pollution intelligence"}</h2><p>Selected location · {air?.location?.name || "Mumbai region"}</p></div><span className={`data-badge ${air?.is_demo ? "demo" : ""}`}>{statusLabel}</span></div>
            <div className="metric-grid">
              <Metric icon={<Gauge />} label="US AQI" metric={value(aqi)} detail={aqiLabel} tone="cyan" />
              <Metric icon={<Wind />} label="PM2.5" metric={value(current.pm2_5, " µg/m³")} detail="Fine particulate matter" tone="orange" />
              <Metric icon={<Activity />} label="PM10" metric={value(current.pm10, " µg/m³")} detail="Coarse particulate matter" tone="purple" />
              <Metric icon={<CloudSun />} label="Ozone" metric={value(current.ozone, " µg/m³")} detail="Provider pollutant field" tone="green" />
            </div>
            <div className="two-col">
              <Panel title="Pollution forecast" subtitle="Next 18 hourly forecast points" action="24–72h provider window">
                <div className="chart-wrap">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={forecastData}>
                      <defs><linearGradient id="pmFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22c7c5" stopOpacity={0.32}/><stop offset="95%" stopColor="#22c7c5" stopOpacity={0}/></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#26364a" />
                      <XAxis dataKey="label" stroke="#8494a9" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#8494a9" tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: "#101e30", border: "1px solid #30445d", borderRadius: 10, color: "#fff" }} />
                      <Area type="monotone" dataKey="pm2_5" name="PM2.5 µg/m³" stroke="#22c7c5" fill="url(#pmFill)" strokeWidth={2.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <p className="chart-footnote">Source: {forecast?.source || "Waiting for provider"} · {forecast?.data_status || "pending"}</p>
              </Panel>
              <Panel title="Pollution signals" subtitle="Latest available pollutant fields">
                <div className="pollutant-list">
                  {[
                    ["Nitrogen dioxide", current.nitrogen_dioxide, "NO₂"],
                    ["Sulphur dioxide", current.sulphur_dioxide, "SO₂"],
                    ["Carbon monoxide", current.carbon_monoxide, "CO"],
                    ["Ozone", current.ozone, "O₃"]
                  ].map(([label, val, short]: any) => <div className="pollutant-row" key={short}><div><b>{short}</b><span>{label}</span></div><strong>{value(val, " µg/m³")}</strong></div>)}
                </div>
                <div className="source-note"><CheckCircle2 size={15}/> Values are provider fields, not independently verified sensor readings.</div>
              </Panel>
            </div>
            <div className="two-col lower-grid">
              <Panel title="Location intelligence" subtitle="Selected monitoring coordinates">
                <MapPanel lat={lat} lon={lon} />
                <div className="coordinate-row"><span>Latitude {lat.toFixed(4)}</span><span>Longitude {lon.toFixed(4)}</span></div>
              </Panel>
              <Panel title="Early-warning center" subtitle="Configurable screening rules">
                {alerts.length ? alerts.map((a, i) => <div className="alert-card" key={i}><AlertTriangle size={18}/><div><b>{a.title}</b><p>{a.detail}</p></div></div>) : <div className="empty-state"><ShieldCheck size={27}/><b>No active screening alerts</b><span>No configured screening rule was triggered by the latest available data.</span></div>}
                <div className="source-note">Alerts are application screening signals, not official government warnings.</div>
              </Panel>
            </div>
          </>}

          {tab === "familyguard" && <div className="module-grid">
            <Panel title="Household digital twin" subtitle="Create a household profile to personalize general clean-air planning">
              <form className="form-grid" onSubmit={saveHousehold}>
                <Field label="Household name"><input value={householdForm.name} onChange={e => setHouseholdForm({...householdForm, name:e.target.value})} required /></Field>
                <Field label="City"><input value={householdForm.city} onChange={e => setHouseholdForm({...householdForm, city:e.target.value})} required /></Field>
                <Field label="Household members"><input type="number" min="1" max="30" value={householdForm.household_size} onChange={e => setHouseholdForm({...householdForm, household_size:+e.target.value})} /></Field>
                <Field label="Rooms"><input type="number" min="1" max="100" value={householdForm.rooms} onChange={e => setHouseholdForm({...householdForm, rooms:+e.target.value})} /></Field>
                <Field label="Monthly improvement budget (₹)"><input type="number" min="0" value={householdForm.monthly_budget} onChange={e => setHouseholdForm({...householdForm, monthly_budget:+e.target.value})} /></Field>
                <Field label="Routine"><input value={householdForm.routine} onChange={e => setHouseholdForm({...householdForm, routine:e.target.value})} /></Field>
                <button className="primary-btn form-submit" type="submit"><Users size={16}/> Save household profile</button>
              </form>
            </Panel>
            <Panel title="Saved households" subtitle="Persisted in the application database">
              {households.length ? households.map(h => <div className="household-row" key={h.id}><div className="household-icon"><House /></div><div><b>{h.name}</b><span>{h.city} · {h.household_size} members · {h.rooms} rooms</span></div><ArrowUpRight size={17}/></div>) : <div className="empty-state"><Users size={28}/><b>No household profiles yet</b><span>Create your first profile to get started.</span></div>}
            </Panel>
            <Panel title="Today's family clean-air checklist" subtitle="General planning prompts">
              {["Check the latest outdoor air-quality data before outdoor activity.","Review forecast timing for strenuous outdoor plans.","Reduce indoor smoke and other avoidable pollution sources.","Check filter condition and follow manufacturer maintenance instructions.","Follow local public-health advice during pollution episodes."].map(item => <label className="check-row" key={item}><input type="checkbox"/><span>{item}</span></label>)}
            </Panel>
            <Panel title="Personalization principles" subtitle="How FamilyGuard makes recommendations">
              <div className="principle"><ShieldCheck/><div><b>Context-aware</b><p>Uses selected location, household size and routine to organize practical suggestions.</p></div></div>
              <div className="principle"><Activity/><div><b>Transparent</b><p>Separates provider observations, forecasts and estimates.</p></div></div>
              <div className="principle"><Users/><div><b>Privacy-conscious</b><p>Does not require diagnoses or detailed medical records.</p></div></div>
            </Panel>
          </div>}

          {tab === "indoorair" && <div className="two-col">
            <Panel title="Room CADR calculator" subtitle="Estimate a target clean air delivery rate">
              <form className="form-grid one-col" onSubmit={calculateCadr}>
                <Field label="Room length (metres)"><input type="number" min="0.1" step="0.1" value={cadrInput.length_m} onChange={e => setCadrInput({...cadrInput,length_m:+e.target.value})}/></Field>
                <Field label="Room width (metres)"><input type="number" min="0.1" step="0.1" value={cadrInput.width_m} onChange={e => setCadrInput({...cadrInput,width_m:+e.target.value})}/></Field>
                <Field label="Ceiling height (metres)"><input type="number" min="0.1" step="0.1" value={cadrInput.height_m} onChange={e => setCadrInput({...cadrInput,height_m:+e.target.value})}/></Field>
                <Field label="Target air changes per hour"><input type="number" min="0.1" max="30" step="0.5" value={cadrInput.air_changes_per_hour} onChange={e => setCadrInput({...cadrInput,air_changes_per_hour:+e.target.value})}/></Field>
                <button className="primary-btn" type="submit"><Calculator size={16}/> Calculate required CADR</button>
              </form>
              {cadrResult && <div className="result-box"><span>Estimated required CADR</span><strong>{cadrResult.required_cadr_m3h} <small>m³/h</small></strong><div className="result-stats"><span>Room volume<b>{cadrResult.room_volume_m3} m³</b></span><span>Equivalent<b>{cadrResult.required_cadr_cfm} CFM</b></span></div><p>{cadrResult.note}</p></div>}
            </Panel>
            <Panel title="Ventilation advisor" subtitle="Use outdoor conditions as one input">
              <div className="vent-status"><Wind size={27}/><div><b>Check before ventilating</b><span>Latest selected-location PM2.5: {value(current.pm2_5, " µg/m³")}</span></div></div>
              <p className="body-copy">When outdoor pollution is elevated, avoid assuming that opening windows will improve indoor air. Consider reducing indoor sources, using suitable filtration and ventilating when outdoor conditions are comparatively better.</p>
              <div className="tip-list"><div><CheckCircle2/> Check outdoor readings and forecast timing.</div><div><CheckCircle2/> Use kitchen exhaust where appropriate during cooking.</div><div><CheckCircle2/> Maintain filters according to manufacturer instructions.</div><div><CheckCircle2/> Seek qualified advice for building ventilation changes.</div></div>
              <div className="source-note">This is general educational guidance, not a real-time indoor sensor reading.</div>
            </Panel>
          </div>}

          {tab === "ecoflow" && <div className="two-col">
            <Panel title="Mobility comparison" subtitle="Compare illustrative travel-mode estimates">
              <form className="form-grid one-col" onSubmit={compareRoute}>
                <div className="form-two">
                  <Field label="Origin latitude"><input type="number" step="0.0001" value={routeInput.origin_lat} onChange={e => setRouteInput({...routeInput,origin_lat:+e.target.value})}/></Field>
                  <Field label="Origin longitude"><input type="number" step="0.0001" value={routeInput.origin_lon} onChange={e => setRouteInput({...routeInput,origin_lon:+e.target.value})}/></Field>
                </div>
                <div className="form-two">
                  <Field label="Destination latitude"><input type="number" step="0.0001" value={routeInput.destination_lat} onChange={e => setRouteInput({...routeInput,destination_lat:+e.target.value})}/></Field>
                  <Field label="Destination longitude"><input type="number" step="0.0001" value={routeInput.destination_lon} onChange={e => setRouteInput({...routeInput,destination_lon:+e.target.value})}/></Field>
                </div>
                <Field label="Travel mode"><select value={routeInput.mode} onChange={e => setRouteInput({...routeInput,mode:e.target.value})}><option value="car">Private car</option><option value="walking">Walking</option><option value="cycling">Cycling</option><option value="public_transport">Public transport</option></select></Field>
                <button className="primary-btn" type="submit"><Route size={16}/> Compare journey estimate</button>
              </form>
              {routeResult && <div className="result-box"><span>{routeResult.label} · illustrative estimate</span><strong>{routeResult.distance_km} <small>km</small></strong><div className="result-stats"><span>Estimated time<b>{routeResult.estimated_minutes} min</b></span><span>Transport CO₂<b>{routeResult.estimated_transport_co2_kg} kg</b></span></div><p>{routeResult.warning}</p><p>Method: {routeResult.distance_method}</p></div>}
            </Panel>
            <Panel title="Lower-impact mobility" subtitle="Practical sustainable travel prompts">
              <div className="mobility-option"><div className="mode-icon"><Leaf/></div><div><b>Walking and cycling</b><p>Consider for suitable short journeys when routes and conditions are safe.</p></div></div>
              <div className="mobility-option"><div className="mode-icon"><Users/></div><div><b>Public transport</b><p>Compare available public transport options and passenger-level emissions assumptions.</p></div></div>
              <div className="mobility-option"><div className="mode-icon"><Route/></div><div><b>Trip consolidation</b><p>Combining errands can reduce repeated journeys.</p></div></div>
              <div className="source-note">No live traffic, street-level pollution sampling or turn-by-turn route geometry is provided by this starter module.</div>
            </Panel>
          </div>}

          {tab === "advisor" && <div className="advisor-layout">
            <Panel title="AEROSENTINEL Intelligence" subtitle="Ask an environmental question using available context">
              <div className="ai-intro"><div className="ai-orb"><Bot size={28}/></div><div><b>Your clean-air decision assistant</b><p>Grounded in selected application context where available. Gemini is optional.</p></div></div>
              <form onSubmit={askAdvisor}>
                <label className="field-label" htmlFor="question">Your question</label>
                <textarea id="question" rows={4} value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ask about air quality, ventilation, household planning or mobility..."/>
                <button className="primary-btn" type="submit" disabled={asking || question.trim().length < 3}><Send size={16}/>{asking ? "Thinking..." : "Ask AEROSENTINEL"}</button>
              </form>
              {answer && <div className="ai-answer"><div className="answer-head"><Bot size={17}/><b>Intelligence response</b><span>{answer.provider}</span></div><p>{answer.answer}</p><small>{answer.disclaimer}</small></div>}
            </Panel>
            <Panel title="Suggested questions" subtitle="Explore the four systems">
              {["How can my family reduce exposure during a pollution peak?","How should I decide when to ventilate a room?","How do I calculate the right purifier CADR?","What are the limitations of route emission estimates?"].map(q => <button className="suggestion" key={q} onClick={() => setQuestion(q)}>{q}<ArrowUpRight size={15}/></button>)}
              <div className="source-note">AI responses are informational, may be incomplete and must not be treated as medical advice.</div>
            </Panel>
          </div>}

          <footer className="footer"><span>© 2026 AEROSENTINEL</span><span>Data transparency · Privacy-conscious · Clean-air intelligence</span><span>Built for PromptWars Challenge 6</span></footer>
        </div>
      </main>
    </div>
  );
}

function Metric({ icon, label, metric, detail, tone }: any) {
  return <div className="metric-card"><div className={`metric-icon ${tone}`}>{icon}</div><div className="metric-label">{label}</div><div className="metric-value">{metric}</div><div className="metric-detail">{detail}</div><div className="metric-spark"><span/></div></div>;
}
function Panel({ title, subtitle, action, children }: any) {
  return <section className="panel"><div className="panel-head"><div><h3>{title}</h3><p>{subtitle}</p></div>{action && <span className="panel-action">{action}</span>}</div>{children}</section>;
}
function Field({ label, children }: any) { return <label className="field"><span className="field-label">{label}</span>{children}</label>; }
