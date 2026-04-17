'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckSquare, AlertTriangle, Search, User, Calendar, Filter, ArrowUpDown,
} from 'lucide-react';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';
import {
  PageHeader, Card, Badge, EmptyState, LoadingSkeleton, Button, StatCard,
  type BadgeTone,
} from '../_components/admin-ui';

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
type TaskSource = 'MARKETING' | 'PO';
type SortKey = 'date-asc' | 'date-desc' | 'created-desc' | 'status';

interface Task {
  id: string;
  title: string;
  description: string | null;
  source: TaskSource;
  status: TaskStatus;
  responsible: string | null;
  targetDate: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_META: Record<TaskStatus, { label: string; tone: BadgeTone }> = {
  TODO: { label: 'Yapılacak', tone: 'neutral' },
  IN_PROGRESS: { label: 'Devam Ediyor', tone: 'info' },
  COMPLETED: { label: 'Tamamlandı', tone: 'success' },
  CANCELLED: { label: 'İptal', tone: 'danger' },
};

const SOURCE_TONE: Record<TaskSource, BadgeTone> = {
  MARKETING: 'info',
  PO: 'warning',
};

type FilterStatus = 'ALL' | TaskStatus;
const FILTER_OPTIONS: { key: FilterStatus; label: string }[] = [
  { key: 'ALL', label: 'Tümü' },
  { key: 'TODO', label: 'Yapılacak' },
  { key: 'IN_PROGRESS', label: 'Devam' },
  { key: 'COMPLETED', label: 'Tamam' },
  { key: 'CANCELLED', label: 'İptal' },
];

function daysUntil(d: string): number {
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getDeadlineLabel(task: Task): { text: string; tone: BadgeTone } | null {
  if (!task.targetDate || task.status === 'COMPLETED' || task.status === 'CANCELLED') return null;
  const days = daysUntil(task.targetDate);
  if (days < 0) return { text: `${Math.abs(days)} gün gecikti`, tone: 'danger' };
  if (days === 0) return { text: 'Bugün son gün', tone: 'warning' };
  if (days <= 7) return { text: `${days} gün kaldı`, tone: 'warning' };
  return null;
}

export default function TaskTrackingPage() {
  const { tokens } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [filterSource, setFilterSource] = useState<'ALL' | TaskSource>('ALL');
  const [filterResponsible, setFilterResponsible] = useState('');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date-asc');

  // Inline edit state
  const [editingResponsibleId, setEditingResponsibleId] = useState<string | null>(null);
  const [responsibleDraft, setResponsibleDraft] = useState('');
  const [patchLoading, setPatchLoading] = useState<string | null>(null);
  const dateInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const fetchTasks = async (background = false) => {
    if (!tokens?.accessToken) return;
    if (background) setRefreshing(true); else setLoading(true);
    try {
      const res = await api<any>('/api/v1/marketing/tasks', { token: tokens.accessToken });
      if (res.status === 'success' && res.data) {
        const raw = res.data as any;
        const list: Task[] = Array.isArray(raw) ? raw : Array.isArray(raw.data) ? raw.data : [];
        setTasks(list);
      }
    } catch {}
    if (background) setRefreshing(false); else setLoading(false);
  };

  useEffect(() => { fetchTasks(false); }, [tokens?.accessToken]);
  useEffect(() => {
    const i = setInterval(() => fetchTasks(true), 30000);
    return () => clearInterval(i);
  }, [tokens?.accessToken]);

  const patchTask = async (taskId: string, body: Record<string, string | null>) => {
    if (!tokens?.accessToken) return;
    setPatchLoading(taskId);

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...body } as Task : t)),
    );

    try {
      await api(`/api/v1/marketing/tasks/${taskId}`, {
        method: 'PATCH',
        token: tokens.accessToken,
        body,
      });
      fetchTasks(true);
    } catch {
      // revert on failure
      fetchTasks(true);
    }
    setPatchLoading(null);
  };

  const handleStatusChange = (id: string, status: TaskStatus) => patchTask(id, { status });
  const handleDateChange = (id: string, date: string) => patchTask(id, { targetDate: date });
  const handleResponsibleSave = (id: string) => {
    setEditingResponsibleId(null);
    patchTask(id, { responsible: responsibleDraft.trim() });
  };

  // Unique responsibles for filter dropdown
  const allResponsibles = useMemo(
    () => Array.from(new Set(tasks.map((t) => t.responsible).filter(Boolean) as string[])).sort(),
    [tasks],
  );

  // Filter + search + sort
  const visible = useMemo(() => {
    let list = tasks;
    if (filterStatus !== 'ALL') list = list.filter((t) => t.status === filterStatus);
    if (filterSource !== 'ALL') list = list.filter((t) => t.source === filterSource);
    if (filterResponsible) list = list.filter((t) => t.responsible === filterResponsible);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        (t.responsible || '').toLowerCase().includes(q),
      );
    }

    const sorted = [...list];
    sorted.sort((a, b) => {
      switch (sortKey) {
        case 'date-asc':
          if (!a.targetDate) return 1;
          if (!b.targetDate) return -1;
          return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
        case 'date-desc':
          if (!a.targetDate) return 1;
          if (!b.targetDate) return -1;
          return new Date(b.targetDate).getTime() - new Date(a.targetDate).getTime();
        case 'status': {
          const order: Record<TaskStatus, number> = { TODO: 0, IN_PROGRESS: 1, COMPLETED: 2, CANCELLED: 3 };
          return order[a.status] - order[b.status];
        }
        case 'created-desc':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    return sorted;
  }, [tasks, filterStatus, filterSource, filterResponsible, search, sortKey]);

  // Counts
  const counts = useMemo(() => {
    const c: Record<FilterStatus, number> = { ALL: tasks.length, TODO: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0 };
    tasks.forEach((t) => { c[t.status]++; });
    return c;
  }, [tasks]);

  const overdueCount = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.targetDate &&
          t.status !== 'COMPLETED' &&
          t.status !== 'CANCELLED' &&
          daysUntil(t.targetDate) < 0,
      ).length,
    [tasks],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Görev Takibi"
        desc="Pazarlama ve PO görevlerini yönetin, sorumluluk atayın, tarih belirleyin"
        icon={CheckSquare}
        back={{ href: '/dashboard/admin', label: 'Yönetim Paneli' }}
      />

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Toplam" value={counts.ALL} accent="slate" />
        <StatCard label="Yapılacak" value={counts.TODO} accent="blue" />
        <StatCard label="Devam" value={counts.IN_PROGRESS} accent="violet" />
        <StatCard label="Tamam" value={counts.COMPLETED} accent="emerald" />
        <StatCard
          label="Gecikmiş"
          value={overdueCount}
          icon={AlertTriangle}
          accent={overdueCount > 0 ? 'rose' : 'slate'}
        />
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Başlık, açıklama, sorumlu ara..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Status filter */}
          <div className="flex gap-1 p-1 rounded-lg bg-slate-800/50 border border-slate-700/50">
            {FILTER_OPTIONS.map((opt) => {
              const active = filterStatus === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => setFilterStatus(opt.key)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                    active ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                  <span className="ml-1.5 text-[10px] opacity-75">
                    {counts[opt.key]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Source */}
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value as 'ALL' | TaskSource)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300 focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">Tüm Kaynaklar</option>
            <option value="MARKETING">Marketing</option>
            <option value="PO">PO</option>
          </select>

          {/* Responsible */}
          {allResponsibles.length > 0 && (
            <select
              value={filterResponsible}
              onChange={(e) => setFilterResponsible(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300 focus:border-blue-500 focus:outline-none"
            >
              <option value="">Tüm Sorumlular</option>
              {allResponsibles.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          )}

          {/* Sort */}
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300 focus:border-blue-500 focus:outline-none"
          >
            <option value="date-asc">Vade (Yakın → Uzak)</option>
            <option value="date-desc">Vade (Uzak → Yakın)</option>
            <option value="created-desc">En Yeni</option>
            <option value="status">Duruma Göre</option>
          </select>
        </div>
      </Card>

      {/* Task list */}
      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title={search || filterStatus !== 'ALL' || filterSource !== 'ALL' || filterResponsible ? 'Eşleşen görev yok' : 'Henüz görev yok'}
        />
      ) : (
        <div className="space-y-2">
          {refreshing && (
            <div className="text-right text-xs text-slate-500 animate-pulse">Güncelleniyor...</div>
          )}
          {visible.map((task) => {
            const deadline = getDeadlineLabel(task);
            return (
              <div
                key={task.id}
                className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-4 hover:border-slate-600 transition"
              >
                <div className="flex flex-wrap items-start gap-4">
                  {/* Left: Content */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge tone={SOURCE_TONE[task.source]}>{task.source}</Badge>
                      <Badge tone={STATUS_META[task.status].tone}>{STATUS_META[task.status].label}</Badge>
                      {deadline && <Badge tone={deadline.tone}>{deadline.text}</Badge>}
                    </div>
                    <div className="text-sm font-semibold text-white leading-snug">{task.title}</div>
                    {task.description && (
                      <div className="text-xs text-slate-400 leading-relaxed">{task.description}</div>
                    )}
                  </div>

                  {/* Right: Controls */}
                  <div className="flex flex-col gap-2 shrink-0 w-full sm:w-[240px]">
                    {/* Status */}
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase tracking-wider font-medium flex items-center gap-1">
                        <Filter className="h-3 w-3" /> Durum
                      </label>
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                        disabled={patchLoading === task.id}
                        className="mt-0.5 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs font-medium text-white focus:border-blue-500 focus:outline-none disabled:opacity-50"
                      >
                        <option value="TODO">Yapılacak</option>
                        <option value="IN_PROGRESS">Devam Ediyor</option>
                        <option value="COMPLETED">Tamamlandı</option>
                        <option value="CANCELLED">İptal</option>
                      </select>
                    </div>

                    {/* Responsible */}
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase tracking-wider font-medium flex items-center gap-1">
                        <User className="h-3 w-3" /> Sorumlu
                      </label>
                      {editingResponsibleId === task.id ? (
                        <input
                          type="text"
                          value={responsibleDraft}
                          onChange={(e) => setResponsibleDraft(e.target.value)}
                          onBlur={() => handleResponsibleSave(task.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleResponsibleSave(task.id);
                            if (e.key === 'Escape') setEditingResponsibleId(null);
                          }}
                          placeholder="İsim..."
                          autoFocus
                          className="mt-0.5 w-full rounded-lg border border-blue-500/50 bg-slate-900 px-2 py-1.5 text-xs text-white focus:outline-none"
                        />
                      ) : (
                        <button
                          onClick={() => {
                            setEditingResponsibleId(task.id);
                            setResponsibleDraft(task.responsible || '');
                          }}
                          className={`mt-0.5 w-full rounded-lg border px-2 py-1.5 text-left text-xs transition ${
                            task.responsible
                              ? 'border-slate-700 bg-slate-900 text-white hover:border-slate-600'
                              : 'border-dashed border-slate-600 bg-transparent text-slate-500 hover:border-slate-500 hover:text-slate-400'
                          }`}
                        >
                          {task.responsible || '+ Ata'}
                        </button>
                      )}
                    </div>

                    {/* Target Date */}
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase tracking-wider font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Hedef Tarih
                      </label>
                      <input
                        ref={(el) => { dateInputRefs.current[task.id] = el; }}
                        type="date"
                        value={task.targetDate ? task.targetDate.split('T')[0] : ''}
                        onChange={(e) => handleDateChange(task.id, e.target.value)}
                        disabled={patchLoading === task.id}
                        className="mt-0.5 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none disabled:opacity-50 [color-scheme:dark]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
