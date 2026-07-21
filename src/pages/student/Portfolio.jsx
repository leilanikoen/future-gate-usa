import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import {
  LayoutDashboard, User, GraduationCap, FlaskConical, FileText, Users, HeartHandshake,
  Trophy, Palette, BookOpen, Plane, Image as ImageIcon, Link as LinkIcon, Mail, Folder,
  Plus, Pencil, Trash2, ChevronRight, ChevronLeft, GripVertical, Eye,
  Star, X, Check, Loader2, ExternalLink,
} from "lucide-react";
import {
  listModules, listEntryStubs, getEntry, listEntryFiles,
  addModule, renameModule, deleteModule, reorderModules,
  addEntry, updateEntry, deleteEntry, reorderEntries, ensureSingletonEntry,
  uploadEntryFile, deleteEntryFile, signedUrl,
} from "../../lib/db.js";
import { templateFor, blankFields } from "../../lib/portfolioTemplates.js";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Progress from "../../components/ui/Progress.jsx";
import { Spinner } from "../../components/ui/Feedback.jsx";
import { cn } from "../../lib/cn.js";

const ICONS = {
  LayoutDashboard, User, GraduationCap, FlaskConical, FileText, Users, HeartHandshake,
  Trophy, Palette, BookOpen, Plane, Image: ImageIcon, Link: LinkIcon, Mail, Folder,
};
const Icon = ({ name, className }) => {
  const C = ICONS[name] || Folder;
  return <C className={className} />;
};

const VISIBILITY = [
  { value: "Public", label: "Public", hint: "On your public link — anyone can see it." },
  { value: "School-only", label: "Schools only", hint: "Shown to schools you share the link with." },
  { value: "Private", label: "Private", hint: "Hidden from your public page; mentors can still review it." },
];

/* ---------- small building blocks ---------- */

function FieldLabel({ label, help }) {
  return (
    <div className="mb-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      {help && <span className="ml-2 text-xs text-muted normal-case font-normal">{help}</span>}
    </div>
  );
}

const inputCls =
  "w-full bg-white border border-hairline rounded-xl px-3.5 py-2.5 text-sm placeholder:text-slate-400 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100";

function DynamicField({ field, value, onChange }) {
  const { type, options } = field;
  if (type === "textarea") {
    return <textarea rows={3} className={cn(inputCls, "resize-y")} value={value || ""} onChange={(e) => onChange(e.target.value)} />;
  }
  if (type === "select") {
    return (
      <select className={inputCls} value={value || ""} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select…</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  if (type === "tags") {
    const asText = Array.isArray(value) ? value.join(", ") : (value || "");
    return (
      <input className={inputCls} value={asText}
        onChange={(e) => onChange(e.target.value.split(",").map((t) => t.trim()).filter(Boolean))}
        placeholder="Comma-separated" />
    );
  }
  const htmlType = type === "date" ? "date" : type === "number" ? "number" : type === "url" ? "url" : "text";
  return <input type={htmlType} className={inputCls} value={value || ""} onChange={(e) => onChange(e.target.value)} />;
}

/* ---------- evidence uploader ---------- */

function Evidence({ studentId, entryId, files, setFiles }) {
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = useCallback(async (fileList) => {
    const arr = Array.from(fileList || []);
    if (!arr.length) return;
    setBusy(true);
    try {
      for (const f of arr) {
        const row = await uploadEntryFile(studentId, entryId, f);
        setFiles((prev) => [...prev, row]);
      }
    } catch (e) { alert(`Upload failed: ${e.message || e}`); }
    setBusy(false);
  }, [studentId, entryId, setFiles]);

  const preview = async (f) => {
    const url = await signedUrl(f.storage_path);
    if (url) window.open(url, "_blank", "noopener");
  };
  const remove = async (f) => {
    await deleteEntryFile(f.id, f.storage_path);
    setFiles((prev) => prev.filter((x) => x.id !== f.id));
  };

  return (
    <div>
      <FieldLabel label="Supporting evidence" />
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
        className={cn("border-2 border-dashed rounded-2xl py-8 text-center transition-colors",
          drag ? "border-brand-400 bg-brand-50" : "border-hairline")}
      >
        <button type="button" onClick={() => inputRef.current?.click()}
          className="w-11 h-11 grid place-items-center rounded-full bg-brand-600 text-white mx-auto mb-2 hover:bg-brand-700">
          {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
        </button>
        <div className="text-sm">
          Drop files here or <button type="button" className="text-brand-600 font-semibold hover:underline" onClick={() => inputRef.current?.click()}>browse</button>
        </div>
        <div className="text-xs text-muted mt-0.5">Documents, images, and video</div>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </div>
      {files.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {files.map((f) => (
            <div key={f.id} className="flex items-center gap-2 text-sm border border-hairline rounded-xl px-3 py-2">
              <FileText className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate flex-1">{f.name}</span>
              <button onClick={() => preview(f)} title="Preview" className="text-slate-400 hover:text-brand-600"><Eye className="w-4 h-4" /></button>
              <button onClick={() => remove(f)} title="Remove" className="text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- entry editor ---------- */

function EntryEditor({ student, module, entryId, onBack, onSaved, onDeleted }) {
  const tpl = templateFor(module);
  const [loading, setLoading] = useState(true);
  const [entry, setEntry] = useState(null);
  const [files, setFiles] = useState([]);
  const [fields, setFields] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const [e, f] = await Promise.all([getEntry(entryId), listEntryFiles(entryId)]);
      if (!alive) return;
      setEntry(e);
      setFiles(f);
      setFields({ ...blankFields(module.template), ...(e?.fields || {}) });
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [entryId, module.template]);

  const setEntryField = (k, v) => { setEntry((p) => ({ ...p, [k]: v })); setSaved(false); };
  const setFieldValue = (k, v) => { setFields((p) => ({ ...p, [k]: v })); setSaved(false); };

  const save = async () => {
    setSaving(true);
    const patch = {
      title: entry.title || "",
      subtitle: entry.subtitle || null,
      entry_date: entry.entry_date || null,   // 'YYYY-MM-DD' string straight from the date input
      featured: !!entry.featured,
      visibility: entry.visibility || "Public",
      fields,
    };
    const { error } = await updateEntry(entryId, patch);
    setSaving(false);
    if (error) { alert(`Could not save: ${error.message}`); return; }
    setSaved(true);
    onSaved?.();
  };

  const del = async () => {
    if (!confirm("Delete this entry? This can't be undone.")) return;
    await deleteEntry(entryId);
    onDeleted?.();
  };

  if (loading) return <Card className="p-6"><Spinner label="Loading…" /></Card>;
  if (!entry) return <Card className="p-6 text-muted">This entry could not be loaded.</Card>;

  const isSingleton = module.kind === "singleton";
  const vis = VISIBILITY.find((v) => v.value === (entry.visibility || "Public"));

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-5">
        {isSingleton
          ? <h2 className="text-lg font-bold">{module.label}</h2>
          : <button onClick={onBack} className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink"><ChevronLeft className="w-4 h-4" /> {module.label}</button>}
        <div className="flex items-center gap-2">
          {!isSingleton && <Button variant="danger" size="sm" onClick={del}><Trash2 className="w-4 h-4" /> Delete</Button>}
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
            {saving ? "Saving…" : saved ? "Saved" : "Save"}
          </Button>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <FieldLabel label="Title" />
          <input className={inputCls} value={entry.title || ""} onChange={(e) => setEntryField("title", e.target.value)} placeholder={`e.g. ${tpl.noun ? tpl.noun[0].toUpperCase() + tpl.noun.slice(1) : "Title"}`} />
        </div>
        <div>
          <FieldLabel label="One-line summary" help="Shown on your Home page and in this list" />
          <input className={inputCls} value={entry.subtitle || ""} onChange={(e) => setEntryField("subtitle", e.target.value)} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4 items-end">
          <div>
            <FieldLabel label="Date" help="Feeds the growth timeline" />
            <input type="date" className={inputCls} value={entry.entry_date || ""} onChange={(e) => setEntryField("entry_date", e.target.value)} />
          </div>
          <label className="inline-flex items-center gap-2 pb-2.5 cursor-pointer select-none">
            <input type="checkbox" className="w-4 h-4 accent-brand-600" checked={!!entry.featured} onChange={(e) => setEntryField("featured", e.target.checked)} />
            <span className="text-sm font-medium inline-flex items-center gap-1"><Star className="w-4 h-4 text-amber-500" /> Feature on Home page</span>
          </label>
        </div>

        <div>
          <FieldLabel label="Who can see this" />
          <div className="inline-flex bg-white border border-hairline rounded-xl p-1">
            {VISIBILITY.map((v) => (
              <button key={v.value} onClick={() => setEntryField("visibility", v.value)}
                className={cn("px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap",
                  (entry.visibility || "Public") === v.value ? "bg-brand-600 text-white" : "text-muted hover:text-ink")}>
                {v.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted mt-1.5">{vis?.hint}</p>
        </div>

        {tpl.fields.map((f) => (
          <div key={f.id}>
            <FieldLabel label={f.label} help={f.help} />
            <DynamicField field={f} value={fields[f.id]} onChange={(v) => setFieldValue(f.id, v)} />
          </div>
        ))}

        {tpl.hasEvidence && <Evidence studentId={student.id} entryId={entryId} files={files} setFiles={setFiles} />}
      </div>
    </Card>
  );
}

/* ---------- entry list for a collection module ---------- */

function EntryList({ module, entries, onOpen, onAdd, onRename, onReorder }) {
  const tpl = templateFor(module);
  const noun = tpl.noun || "entry";
  const [renaming, setRenaming] = useState(false);
  const [label, setLabel] = useState(module.label);
  const dragId = useRef(null);

  useEffect(() => { setLabel(module.label); }, [module.id, module.label]);

  const commitRename = async () => {
    setRenaming(false);
    const v = label.trim();
    if (v && v !== module.label) await onRename(v);
    else setLabel(module.label);
  };

  const onDrop = async (targetId) => {
    const from = dragId.current;
    dragId.current = null;
    if (!from || from === targetId) return;
    const ids = entries.map((e) => e.id);
    const a = ids.indexOf(from), b = ids.indexOf(targetId);
    ids.splice(b, 0, ids.splice(a, 1)[0]);
    await onReorder(ids);
  };

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          {renaming ? (
            <input autoFocus className={cn(inputCls, "text-lg font-bold")} value={label}
              onChange={(e) => setLabel(e.target.value)} onBlur={commitRename}
              onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") { setRenaming(false); setLabel(module.label); } }} />
          ) : (
            <h2 className="text-lg font-bold inline-flex items-center gap-2">
              {module.label}
              <button onClick={() => setRenaming(true)} className="text-slate-300 hover:text-brand-600" title="Rename section"><Pencil className="w-4 h-4" /></button>
            </h2>
          )}
          <p className="text-sm text-muted mt-0.5">{tpl.blurb || `Add each ${noun} with results and reflection.`}</p>
        </div>
        <Button size="sm" onClick={onAdd}><Plus className="w-4 h-4" /> Add {noun}</Button>
      </div>

      {entries.length === 0 ? (
        <div className="border border-dashed border-hairline rounded-2xl p-10 text-center text-muted text-sm">
          No {noun}s yet. Click “Add {noun}” to create your first.
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => {
            const filled = (e.title || "").trim();
            return (
              <div key={e.id} draggable
                onDragStart={() => { dragId.current = e.id; }}
                onDragOver={(ev) => ev.preventDefault()}
                onDrop={() => onDrop(e.id)}
                onClick={() => onOpen(e.id)}
                className="group flex items-center gap-3 border border-hairline rounded-xl px-3 py-3 hover:border-brand-300 hover:bg-slate-50 cursor-pointer">
                <GripVertical className="w-4 h-4 text-slate-300 shrink-0 cursor-grab" onClick={(ev) => ev.stopPropagation()} />
                <span className="w-9 h-9 grid place-items-center rounded-lg bg-brand-50 text-brand-600 shrink-0"><Icon name={module.icon} className="w-4 h-4" /></span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">{filled || `New ${noun}`}</div>
                  <div className="text-sm text-muted truncate">{e.subtitle || (filled ? "" : "Not filled in yet")}</div>
                </div>
                {e.featured && <Badge tone="pending" className="shrink-0">Featured</Badge>}
                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/* ---------- module rail ---------- */

function ModuleRail({ modules, counts, selectedId, onSelect, onAddModule }) {
  const dragId = useRef(null);
  return (
    <div className="lg:w-72 shrink-0">
      <div className="space-y-1.5 max-h-[46vh] lg:max-h-none overflow-y-auto pr-1">
        {modules.map((m) => (
          <button key={m.id}
            draggable
            onDragStart={() => { dragId.current = m.id; }}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => onSelect(m.id)}
            className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-left transition-colors",
              selectedId === m.id ? "bg-brand-50 text-brand-700 font-semibold" : "hover:bg-slate-50 text-ink")}>
            <GripVertical className="w-3.5 h-3.5 text-slate-300 shrink-0 cursor-grab" onClick={(e) => e.stopPropagation()} />
            <Icon name={m.icon} className="w-4 h-4 shrink-0" />
            <span className="flex-1 truncate">{m.label}</span>
            {m.kind !== "computed" && (
              <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">{counts[m.id] || 0}</span>
            )}
          </button>
        ))}
      </div>
      <button onClick={onAddModule}
        className="mt-2 w-full border border-dashed border-hairline rounded-xl py-2.5 text-sm text-muted hover:text-brand-600 hover:border-brand-300">
        + Add module
      </button>
    </div>
  );
}

/* ---------- add-module modal (replaces the native prompt) ---------- */

function AddModuleModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const create = async () => {
    if (!name.trim()) return;
    setBusy(true);
    await onCreate(name.trim());
    setBusy(false);
  };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">Add a module</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-ink"><X className="w-4 h-4" /></button>
        </div>
        <FieldLabel label="Module name" />
        <input autoFocus className={inputCls} value={name} placeholder="e.g. Music, Internships, Portfolio"
          onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") create(); }} />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={create} disabled={busy || !name.trim()}>{busy ? "Creating…" : "Create"}</Button>
        </div>
      </div>
    </div>
  );
}

/* ---------- page ---------- */

export default function Portfolio() {
  const { student, publicUrl, reload: reloadLayout } = useOutletContext();
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState([]);
  const [entries, setEntries] = useState([]);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [openEntryId, setOpenEntryId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    const [m, e] = await Promise.all([listModules(student.id), listEntryStubs(student.id)]);
    setModules(m);
    setEntries(e);
    setSelectedModuleId((cur) => cur || m[0]?.id || null);
    setLoading(false);
  }, [student.id]);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => {
    const c = {};
    entries.forEach((e) => { c[e.module_id] = (c[e.module_id] || 0) + 1; });
    return c;
  }, [entries]);

  // progress = share of non-computed modules that have at least one titled entry
  const pct = useMemo(() => {
    const tracked = modules.filter((m) => m.kind !== "computed");
    if (!tracked.length) return 0;
    const filledModuleIds = new Set(entries.filter((e) => (e.title || "").trim()).map((e) => e.module_id));
    const filled = tracked.filter((m) => filledModuleIds.has(m.id)).length;
    return Math.round((filled / tracked.length) * 100);
  }, [modules, entries]);

  const selectedModule = modules.find((m) => m.id === selectedModuleId) || null;
  const moduleEntries = entries.filter((e) => e.module_id === selectedModuleId);

  const selectModule = async (id) => {
    setOpenEntryId(null);
    setSelectedModuleId(id);
    const m = modules.find((x) => x.id === id);
    if (m && m.kind === "singleton") {
      const row = await ensureSingletonEntry(student.id, id);
      setOpenEntryId(row.id);
      setEntries((prev) => (prev.some((e) => e.id === row.id) ? prev : [...prev, row]));
    }
  };

  const refresh = async () => { await load(); await reloadLayout?.(); };

  const onAddEntry = async () => {
    const row = await addEntry(student.id, selectedModuleId);
    setEntries((prev) => [...prev, row]);
    setOpenEntryId(row.id);
  };

  const onCreateModule = async (name) => {
    const m = await addModule(student.id, name);
    setShowAdd(false);
    setModules((prev) => [...prev, m]);
    setSelectedModuleId(m.id);
    setOpenEntryId(null);
  };

  const onDeleteModule = async () => {
    if (!selectedModule?.is_custom) return;
    if (!confirm(`Delete the “${selectedModule.label}” module and everything in it?`)) return;
    await deleteModule(selectedModule.id);
    setSelectedModuleId(null);
    setOpenEntryId(null);
    await refresh();
  };

  if (loading) return <Spinner label="Loading your portfolio…" />;

  return (
    <div className="max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolio Builder</h1>
          <p className="text-muted mt-1">Build each section into admissions-ready detail. Your Home page updates automatically.</p>
        </div>
        <a href={publicUrl} target="_blank" rel="noreferrer">
          <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /> Preview</Button>
        </a>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 max-w-xs"><Progress value={pct} /></div>
        <span className="text-sm font-semibold text-brand-700">{pct}% complete</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <ModuleRail modules={modules} counts={counts} selectedId={selectedModuleId}
          onSelect={selectModule} onAddModule={() => setShowAdd(true)} />

        <div className="flex-1 min-w-0">
          {!selectedModule ? (
            <Card className="p-10 text-center text-muted">Select a section to start building.</Card>
          ) : selectedModule.kind === "computed" ? (
            <Card className="p-8 text-center">
              <span className="w-12 h-12 grid place-items-center rounded-2xl bg-brand-50 text-brand-600 mx-auto mb-3"><LayoutDashboard className="w-6 h-6" /></span>
              <h2 className="text-lg font-bold">Your Home page is automatic</h2>
              <p className="text-sm text-muted mt-1 max-w-md mx-auto">
                It’s generated from everything you add below — highlight counts, featured achievements, and your growth timeline. Nothing to edit here.
              </p>
              <a href={publicUrl} target="_blank" rel="noreferrer" className="inline-block mt-4">
                <Button variant="ghost" size="sm"><ExternalLink className="w-4 h-4" /> Preview public page</Button>
              </a>
            </Card>
          ) : openEntryId ? (
            <EntryEditor
              student={student} module={selectedModule} entryId={openEntryId}
              onBack={() => setOpenEntryId(null)}
              onSaved={refresh}
              onDeleted={async () => { setOpenEntryId(null); await refresh(); }}
            />
          ) : (
            <>
              <EntryList module={selectedModule} entries={moduleEntries}
                onOpen={setOpenEntryId} onAdd={onAddEntry}
                onRename={async (label) => { await renameModule(selectedModule.id, label); await refresh(); }}
                onReorder={async (ids) => { await reorderEntries(ids); await load(); }}
              />
              {selectedModule.is_custom && (
                <button onClick={onDeleteModule} className="mt-3 text-xs text-rose-600 hover:underline inline-flex items-center gap-1">
                  <Trash2 className="w-3.5 h-3.5" /> Delete this module
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {showAdd && <AddModuleModal onClose={() => setShowAdd(false)} onCreate={onCreateModule} />}
    </div>
  );
}