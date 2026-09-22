import { useCallback, useEffect, useState } from "react";
import { getErrorMessage, setAuthToken } from "./api";
import api from "./api";
import { socket } from "./socket";
import "./App.css";

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("taskflow_token"));
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("taskflow_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [view, setView] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [filters, setFilters] = useState({ status: "", priority: "" });

  const loadJobs = useCallback(async (activeFilters = filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100", sort: "-createdAt" });
      if (activeFilters.status) params.set("status", activeFilters.status);
      if (activeFilters.priority) params.set("priority", activeFilters.priority);
      const response = await api.get(`/jobs?${params.toString()}`);
      setJobs(response.data);
      setMessage("");
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  useEffect(() => {
    if (!token) return undefined;

    let active = true;
    queueMicrotask(() => {
      if (active) loadJobs(filters);
    });
    socket.connect();
    const refreshFromSocket = () => loadJobs(filters);
    socket.on("job:updated", refreshFromSocket);

    return () => {
      active = false;
      socket.off("job:updated", refreshFromSocket);
      socket.disconnect();
    };
  }, [token, filters, loadJobs]);

  function handleLogin(loginData) {
    setToken(loginData.token);
    setUser(loginData.user);
    localStorage.setItem("taskflow_token", loginData.token);
    localStorage.setItem("taskflow_user", JSON.stringify(loginData.user));
  }

  function handleLogout() {
    setToken(null);
    setUser(null);
    setJobs([]);
    localStorage.removeItem("taskflow_token");
    localStorage.removeItem("taskflow_user");
  }

  async function handleDelete(job) {
    if (!window.confirm(`Delete ${job.type}?`)) return;

    try {
      await api.delete(`/jobs/${job._id}`);
      setSelectedJob(null);
      setView("jobs");
      await loadJobs();
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  if (!token) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div><strong>TaskFlow</strong><span>Job queue console</span></div>
        <div className="user-menu"><span>{user?.name || user?.email}</span><button className="button secondary" onClick={handleLogout}>Log out</button></div>
      </header>
      <div className="workspace">
        <aside className="sidebar">
          {[["dashboard", "Dashboard"], ["jobs", "Jobs"], ["create", "Create job"]].map(([key, label]) => (
            <button key={key} className={`nav-button ${view === key ? "active" : ""}`} onClick={() => setView(key)}>{label}</button>
          ))}
          <div className="connection"><span className="dot" /> Live updates enabled</div>
        </aside>
        <main className="content">
          {message && <div className="alert">{message}</div>}
          {view === "dashboard" && <Dashboard jobs={jobs} loading={loading} onSelect={(job) => { setSelectedJob(job); setView("details"); }} />}
          {view === "jobs" && <><JobFilters filters={filters} onChange={setFilters} /><JobsTable jobs={jobs} loading={loading} onSelect={(job) => { setSelectedJob(job); setView("details"); }} onRefresh={loadJobs} /></>}
          {view === "create" && <CreateJob onSaved={(job) => { setJobs((current) => [job, ...current]); setView("details"); setSelectedJob(job); }} />}
          {view === "edit" && <CreateJob job={selectedJob} onSaved={(job) => { setSelectedJob(job); setView("details"); }} />}
          {view === "details" && <JobDetails job={selectedJob} onBack={() => setView("jobs")} onEdit={() => setView("edit")} onDelete={handleDelete} />}
        </main>
      </div>
    </div>
  )
}

function LoginForm({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "register") {
        await api.post("/auth/register", form);
      }

      const response = await api.post("/auth/login", {
        email: form.email,
        password: form.password,
      });
      onLogin(response.data);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  const isRegistering = mode === "register";

  return <div className="login-page"><form className="login-card" onSubmit={submit}><p className="eyebrow">TASK QUEUE PLATFORM</p><h1>{isRegistering ? "Create account" : "Welcome back"}</h1><p className="muted">{isRegistering ? "Create an account to submit and monitor jobs." : "Sign in to inspect your jobs and worker activity."}</p>{error && <div className="alert">{error}</div>}{isRegistering && <label>Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} minLength="2" required /></label>}<label>Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label><label>Password<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} minLength="6" required /></label><button className="button primary" disabled={loading}>{loading ? (isRegistering ? "Creating account..." : "Signing in...") : (isRegistering ? "Create account" : "Sign in")}</button><button type="button" className="text-button auth-switch" onClick={() => { setMode(isRegistering ? "login" : "register"); setError(""); }}>{isRegistering ? "Already have an account? Sign in" : "Need an account? Register"}</button></form></div>;
}

function Dashboard({ jobs, loading, onSelect }) {
  const counts = jobs.reduce((result, job) => ({ ...result, [job.status]: (result[job.status] || 0) + 1 }), {});
  return <section><div className="page-heading"><div><p className="eyebrow">OVERVIEW</p><h1>Dashboard</h1><p className="muted">A live view of your BullMQ-backed jobs.</p></div></div><div className="stats">{[["Total", jobs.length, "total"], ["Pending", counts.pending || 0, "pending"], ["Processing", counts.processing || 0, "processing"], ["Completed", counts.completed || 0, "completed"], ["Failed", counts.failed || 0, "failed"]].map(([label, value, tone]) => <div className={`stat ${tone}`} key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><div className="panel"><div className="panel-heading"><h2>Recent jobs</h2><button className="button secondary" onClick={() => window.location.reload()}>Refresh</button></div><JobsTable jobs={jobs.slice(0, 5)} loading={loading} onSelect={onSelect} compact /></div></section>;
}

function JobFilters({ filters, onChange }) {
  return <div className="filter-bar"><label>Status<select value={filters.status} onChange={(event) => onChange({ ...filters, status: event.target.value })}><option value="">All statuses</option><option value="pending">Pending</option><option value="processing">Processing</option><option value="completed">Completed</option><option value="failed">Failed</option><option value="cancelled">Cancelled</option></select></label><label>Priority<select value={filters.priority} onChange={(event) => onChange({ ...filters, priority: event.target.value })}><option value="">All priorities</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label></div>;
}

function JobsTable({ jobs, loading, onSelect, onRefresh, compact = false }) {
  if (loading) return <p className="muted">Loading jobs...</p>;
  if (!jobs.length) return <div className="empty"><h2>No jobs yet</h2><p className="muted">Create a job to see the worker pipeline in action.</p></div>;
  return <div className="table-wrap"><table><thead><tr><th>Type</th><th>Status</th><th>Priority</th><th>Attempts</th><th>Created</th>{!compact && <th />}</tr></thead><tbody>{jobs.map((job) => <tr key={job._id} onClick={() => onSelect(job)}><td><strong>{job.type}</strong><small>{job._id}</small></td><td><span className={`status ${job.status}`}>{job.status}</span></td><td>{job.priority}</td><td>{job.attempts}</td><td>{new Date(job.createdAt).toLocaleString()}</td>{!compact && <td><button className="text-button" onClick={(event) => { event.stopPropagation(); onSelect(job); }}>View</button></td>}</tr>)}</tbody></table>{onRefresh && <button className="button secondary refresh-button" onClick={onRefresh}>Refresh jobs</button>}</div>;
}

function CreateJob({ job, onSaved }) {
  const isEditing = Boolean(job);
  const [form, setForm] = useState({ type: job?.type || "SEND_EMAIL", priority: job?.priority || "medium", payload: JSON.stringify(job?.payload || { to: "user@example.com" }, null, 2), scheduledAt: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const request = { type: form.type, priority: form.priority, payload: JSON.parse(form.payload) };
      if (form.scheduledAt) request.scheduledAt = new Date(form.scheduledAt).toISOString();
      const response = isEditing ? await api.patch(`/jobs/${job._id}`, request) : await api.post("/jobs", request);
      onSaved(response.data);
    } catch (requestError) {
      setError(requestError instanceof SyntaxError ? "Payload must be valid JSON." : getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  return <section><div className="page-heading"><div><p className="eyebrow">WORKER INPUT</p><h1>{isEditing ? "Edit job" : "Create job"}</h1><p className="muted">{isEditing ? "Update the job before it is processed." : "Submit work to the existing Express and BullMQ pipeline."}</p></div></div><form className="panel form-grid" onSubmit={submit}>{error && <div className="alert full-width">{error}</div>}<label>Job type<input value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} required /></label><label>Priority<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option>low</option><option>medium</option><option>high</option></select></label><label>Schedule (optional)<input type="datetime-local" min={new Date().toISOString().slice(0, 16)} value={form.scheduledAt} onChange={(event) => setForm({ ...form, scheduledAt: event.target.value })} /></label><label className="full-width">Payload (JSON)<textarea rows="6" value={form.payload} onChange={(event) => setForm({ ...form, payload: event.target.value })} required /></label><div className="full-width"><button className="button primary" disabled={loading}>{loading ? (isEditing ? "Saving..." : "Submitting...") : (isEditing ? "Save changes" : "Create job")}</button></div></form></section>;
}

function JobDetails({ job, onBack, onEdit, onDelete }) {
  if (!job) return <section className="empty"><h2>Select a job first</h2><button className="button secondary" onClick={onBack}>Back to jobs</button></section>;
  return <section><button className="text-button back-button" onClick={onBack}>← Back to jobs</button><div className="page-heading"><div><p className="eyebrow">JOB DETAILS</p><h1>{job.type}</h1><p className="muted">{job._id}</p></div><div className="detail-actions"><span className={`status ${job.status}`}>{job.status}</span><button className="button secondary" onClick={onEdit}>Edit</button><button className="button danger" onClick={() => onDelete(job)}>Delete</button></div></div><div className="detail-grid">{[["Priority", job.priority], ["Attempts", job.attempts], ["Progress", `${job.progress ?? 0}%`], ["Created", new Date(job.createdAt).toLocaleString()], ["Updated", new Date(job.updatedAt).toLocaleString()], ["Scheduled", new Date(job.scheduledAt).toLocaleString()]].map(([label, value]) => <div className="detail" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><div className="panel"><h2>Payload</h2><pre>{JSON.stringify(job.payload, null, 2)}</pre>{job.error && <div className="alert">{job.error}</div>}</div></section>;
}

export default App
