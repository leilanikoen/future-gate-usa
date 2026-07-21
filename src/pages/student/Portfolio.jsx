import { useState, useRef, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { Upload, ChevronUp, ChevronDown, Trash2, Eye, ChevronRight, Plus, Pencil } from "lucide-react";
import { SECTIONS, fileType } from "../../lib/constants.js";
import {
  uploadPortfolioFile, addItem, deleteItem, swapItems, signedUrl,
  listSections, addSection, renameSection, deleteSection,
} from "../../lib/db.js";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Badge from "../../components/ui/Badge.jsx";
import { cn } from "../../lib/cn.js";

const chipColor = (type) =>
  type === "Image" ? "bg-pink-100 text-pink-600" : type === "Video" ? "bg-violet-100 text-violet-600" : "bg-brand-50 text-brand-600";
const chipText = (type) => (type === "Image" ? "IMG" : type === "Video" ? "VID" : "PDF");

export default function Portfolio() {
  const { student, items, reload } = useOutletContext();
  const [custom, setCustom] = useState([]);
  const [active, setActive] = useState("academics");
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const loadSections = useCallback(async () => setCustom(await listSections(student.id)), [student.id]);
  useEffect(() => { loadSections(); }, [loadSections]);

  // built-in sections + custom ones (custom keyed by their row id)
  const allSections = [
    ...SECTIONS,
    ...custom.map((c) => ({ key: c.id, label: c.label, unit: "items", custom: true })),
  ];
  const grouped = {};
  allSections.forEach((s) => (grouped[s.key] = []));
  (items || []).forEach((it) => { (grouped[it.section] ||= []).push(it); });
  Object.values(grouped).forEach((arr) => arr.sort((a, b) => a.position - b.position));

  const activeSection = allSections.find((s) => s.key === active) || allSections[0];
  const list = grouped[activeSection?.key] || [];

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setBusy(true);
    try {
      for (const f of files) {
        const path = await uploadPortfolioFile(student.id, activeSection.key, f);
        await addItem(student.id, activeSection.key, { name: f.name, type: fileType(f.name), storage_path: path });
      }
      await reload();
    } catch (e) { alert("Upload failed: " + e.message); }
    finally { setBusy(false); }
  };
  const onDrop = (e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); };
  const preview = async (it) => { const url = await signedUrl(it.storage_path); if (url) window.open(url, "_blank"); else alert("No file attached."); };
  const move = async (i, dir) => { const j = i + dir; if (j < 0 || j >= list.length) return; await swapItems(list[i], list[j]); await reload(); };
  const remove = async (it) => { await deleteItem(it.id); await reload(); };

  const onAddModule = async () => {
    const label = window.prompt("New module name");
    if (!label?.trim()) return;
    const { data } = await addSection(student.id, label.trim());
    await loadSections();
    if (data) setActive(data.id);
  };
  const onRename = async () => {
    const label = window.prompt("Rename module", activeSection.label);
    if (!label?.trim() || label === activeSection.label) return;
    await renameSection(activeSection.key, label.trim()); await loadSections();
  };
  const onDeleteModule = async () => {
    if (!window.confirm(`Delete “${activeSection.label}” and its files?`)) return;
    await deleteSection(activeSection.key, student.id);
    await loadSections(); await reload();
    setActive("academics");
  };

  return (
    <div className="max-w-6xl">
      <h1 className="text-3xl font-bold tracking-tight">Portfolio Builder</h1>
      <p className="text-muted mt-1 mb-6">Upload, organize, and manage your achievements and supporting documents.</p>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* section list */}
        <Card className="p-2 h-fit">
          {allSections.map((s) => {
            const count = grouped[s.key]?.length || 0;
            const on = active === s.key;
            return (
              <button key={s.key} onClick={() => setActive(s.key)}
                className={cn("w-full flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm mb-0.5 transition-colors",
                  on ? "bg-brand-50 text-brand-700 font-semibold" : "text-ink hover:bg-slate-50")}>
                <span className={cn("w-2 h-2 rounded-full", count > 0 ? "bg-lime-500" : "bg-amber-400")} />
                <span className="flex-1 text-left truncate">{s.label}</span>
                {s.custom && <span className="text-[10px] uppercase tracking-wide text-slate-400">custom</span>}
                <span className="text-slate-400 text-xs">{count}</span>
                <ChevronRight className={cn("w-4 h-4", on ? "text-brand-500" : "text-slate-300")} />
              </button>
            );
          })}
          <button onClick={onAddModule}
            className="w-full flex items-center gap-2 px-3 py-3 mt-1 rounded-xl text-sm font-medium text-brand-600 hover:bg-brand-50">
            <Plus className="w-4 h-4" /> Add module
          </button>
        </Card>

        {/* active section panel */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-2">
              <div>
                <h2 className="text-xl font-bold">{activeSection?.label}</h2>
                <p className="text-sm text-muted">{list.length} {activeSection?.unit} uploaded</p>
              </div>
              {activeSection?.custom && (
                <div className="flex items-center gap-1 mt-0.5">
                  <button onClick={onRename} className="text-slate-400 hover:text-ink p-1" title="Rename"><Pencil className="w-4 h-4" /></button>
                  <button onClick={onDeleteModule} className="text-slate-400 hover:text-rose-500 p-1" title="Delete module"><Trash2 className="w-4 h-4" /></button>
                </div>
              )}
            </div>
            <Badge tone={list.length ? "complete" : "pending"}>{list.length ? "Complete" : "To do"}</Badge>
          </div>

          <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
          <div
            onClick={() => !busy && fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={cn("border-2 border-dashed rounded-2xl py-10 flex flex-col items-center gap-3 cursor-pointer transition-colors",
              dragOver ? "border-brand-500 bg-brand-50" : "border-brand-200 hover:bg-brand-50/40", busy && "opacity-60 pointer-events-none")}
          >
            <div className="w-12 h-12 rounded-xl bg-brand-600 grid place-items-center"><Upload className="w-5 h-5 text-white" /></div>
            <div className="text-center">
              <div className="font-semibold text-sm">{busy ? "Uploading…" : <>Drag &amp; drop files <span className="text-brand-600">here</span></>}</div>
              <div className="text-xs text-muted mt-0.5">PDF · DOCX · JPG · PNG · MP4</div>
            </div>
          </div>

          <div className="text-xs font-semibold uppercase tracking-wider text-muted mt-6 mb-2">Uploaded {activeSection?.unit}</div>
          <div className="space-y-2">
            {list.length === 0 && <p className="text-sm text-muted py-3">Nothing here yet — add your first item above.</p>}
            {list.map((it, i) => (
              <div key={it.id} className="flex items-center gap-3 p-3 rounded-xl border border-hairline">
                <div className="flex flex-col text-slate-300">
                  <button onClick={() => move(i, -1)} className="hover:text-ink" aria-label="Move up"><ChevronUp className="w-3.5 h-3.5" /></button>
                  <button onClick={() => move(i, 1)} className="hover:text-ink" aria-label="Move down"><ChevronDown className="w-3.5 h-3.5" /></button>
                </div>
                <span className={cn("w-9 h-9 rounded-lg grid place-items-center text-[10px] font-bold", chipColor(it.type))}>{chipText(it.type)}</span>
                <div className="flex-1 min-w-0"><div className="font-semibold text-sm truncate">{it.name}</div><div className="text-xs text-muted">{it.type}</div></div>
                <button onClick={() => preview(it)} className="text-slate-400 hover:text-brand-600 p-1" aria-label="Preview"><Eye className="w-4 h-4" /></button>
                <button onClick={() => remove(it)} className="text-slate-400 hover:text-rose-500 p-1" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted mt-5">Changes save automatically.</p>
        </Card>
      </div>
    </div>
  );
}