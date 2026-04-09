'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';

// ── Types ──

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
type TaskSource = 'MARKETING' | 'PO';

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

// ── Display helpers ──

const statusLabel: Record<TaskStatus, string> = {
  TODO: 'Yapilacak',
  IN_PROGRESS: 'Devam Ediyor',
  COMPLETED: 'Tamamlandi',
  CANCELLED: 'Iptal',
};

const statusColor: Record<TaskStatus, string> = {
  TODO: 'bg-slate-100 text-slate-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-rose-100 text-rose-700',
};

const sourceColor: Record<TaskSource, string> = {
  MARKETING: 'bg-purple-100 text-purple-700',
  PO: 'bg-amber-100 text-amber-700',
};

type FilterStatus = 'ALL' | TaskStatus;

const filterOptions: { key: FilterStatus; label: string }[] = [
  { key: 'ALL', label: 'Tumu' },
  { key: 'TODO', label: 'Yapilacak' },
  { key: 'IN_PROGRESS', label: 'Devam Ediyor' },
  { key: 'COMPLETED', label: 'Tamamlandi' },
  { key: 'CANCELLED', label: 'Iptal' },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getDeadlineBorder(task: Task): string {
  if (!task.targetDate || task.status === 'COMPLETED' || task.status === 'CANCELLED') return 'border-slate-200';
  const days = daysUntil(task.targetDate);
  if (days < 0) return 'border-rose-400 border-2';
  if (days <= 7) return 'border-amber-400 border-2';
  return 'border-slate-200';
}

// ── Component ──

export default function TaskTrackingPage() {
  const { tokens } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [filterResponsible, setFilterResponsible] = useState('');

  // Inline edit state
  const [editingResponsible, setEditingResponsible] = useState<string | null>(null);
  const [responsibleDraft, setResponsibleDraft] = useState('');
  const [patchLoading, setPatchLoading] = useState<string | null>(null);

  // ── Fetch tasks ──
  const fetchTasks = async (background = false) => {
    if (!tokens?.accessToken) return;
    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'ALL') params.set('status', filterStatus);
      if (filterResponsible) params.set('responsible', filterResponsible);
      const query = params.toString() ? `?${params.toString()}` : '';

      const [tasksRes, upcomingRes] = await Promise.all([
        api<Task[]>(`/api/v1/marketing/tasks${query}`, { token: tokens.accessToken }),
        api<Task[]>('/api/v1/marketing/tasks/upcoming', { token: tokens.accessToken }),
      ]);

      if (tasksRes.status === 'success' && tasksRes.data) {
        const list = Array.isArray(tasksRes.data) ? tasksRes.data : [];
        setTasks(list);
      }
      if (upcomingRes.status === 'success' && upcomingRes.data) {
        const list = Array.isArray(upcomingRes.data) ? upcomingRes.data : [];
        setUpcomingTasks(list);
      }
    } catch {
      // silent
    }
    if (background) {
      setRefreshing(false);
    } else {
      setLoading(false);
    }
  };

  // ── Initial load ──
  useEffect(() => {
    fetchTasks(false);
  }, [tokens?.accessToken, filterStatus, filterResponsible]);

  // ── Auto-refresh every 30s ──
  useEffect(() => {
    const interval = setInterval(() => fetchTasks(true), 30000);
    return () => clearInterval(interval);
  }, [tokens?.accessToken, filterStatus, filterResponsible]);

  // ── PATCH task ──
  const patchTask = async (taskId: string, body: Record<string, string>) => {
    if (!tokens?.accessToken) return;
    setPatchLoading(taskId);
    try {
      await api(`/api/v1/marketing/tasks/${taskId}`, {
        method: 'PATCH',
        token: tokens.accessToken,
        body,
      });
      fetchTasks(true);
    } catch {
      // silent
    }
    setPatchLoading(null);
  };

  // ── Status change ──
  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    patchTask(taskId, { status: newStatus });
  };

  // ── Date change ──
  const handleDateChange = (taskId: string, newDate: string) => {
    patchTask(taskId, { targetDate: newDate });
  };

  // ── Responsible blur save ──
  const handleResponsibleBlur = (taskId: string) => {
    setEditingResponsible(null);
    patchTask(taskId, { responsible: responsibleDraft });
  };

  // ── Collect unique responsibles for filter ──
  const allResponsibles = Array.from(
    new Set(tasks.map((t) => t.responsible).filter(Boolean) as string[]),
  ).sort();

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Gorev Takibi</h1>
        <p className="mt-1 text-sm text-slate-500">Pazarlama ve PO gorevleri</p>
      </div>

      {/* ── Upcoming Deadlines ── */}
      {upcomingTasks.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-3">
          <h2 className="text-sm font-bold text-amber-800">
            Yaklasan Tarihler ({upcomingTasks.length})
          </h2>
          <div className="space-y-2">
            {upcomingTasks.map((t) => {
              const days = t.targetDate ? daysUntil(t.targetDate) : null;
              const isOverdue = days !== null && days < 0;
              return (
                <div
                  key={t.id}
                  className="flex items-center gap-3 rounded-xl bg-white border border-amber-200 px-4 py-2.5"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{t.title}</p>
                    {t.responsible && (
                      <span className="text-xs text-slate-500">{t.responsible}</span>
                    )}
                  </div>
                  {t.targetDate && (
                    <span
                      className={`shrink-0 text-xs font-bold ${
                        isOverdue ? 'text-rose-600' : 'text-amber-700'
                      }`}
                    >
                      {isOverdue
                        ? `${Math.abs(days!)} gun gecikti`
                        : days === 0
                        ? 'Bugun'
                        : `${days} gun kaldi`}
                    </span>
                  )}
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor[t.status]}`}
                  >
                    {statusLabel[t.status]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Filter Bar ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status pills */}
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setFilterStatus(opt.key)}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                filterStatus === opt.key
                  ? 'border-blue-400 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Responsible filter */}
        {allResponsibles.length > 0 && (
          <select
            value={filterResponsible}
            onChange={(e) => setFilterResponsible(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="">Tum sorumlular</option>
            {allResponsibles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* ── Task List ── */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">Yukleniyor...</div>
      ) : tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-400">
          {filterStatus === 'ALL' ? 'Henuz gorev yok.' : 'Bu durumda gorev bulunamadi.'}
        </div>
      ) : (
        <div className="space-y-3">
          {refreshing && (
            <div className="text-right text-xs text-slate-400 animate-pulse">Guncelleniyor...</div>
          )}
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`rounded-2xl bg-white p-5 transition border ${getDeadlineBorder(task)}`}
            >
              <div className="flex flex-wrap items-start gap-3">
                {/* Left: Content */}
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${sourceColor[task.source]}`}
                    >
                      {task.source}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor[task.status]}`}
                    >
                      {statusLabel[task.status]}
                    </span>
                    {task.targetDate && (
                      <span className="text-xs text-slate-400">
                        {(() => {
                          const days = daysUntil(task.targetDate);
                          if (task.status === 'COMPLETED' || task.status === 'CANCELLED') return '';
                          if (days < 0) return `${Math.abs(days)} gun gecikti`;
                          if (days === 0) return 'Bugun son gun';
                          if (days <= 7) return `${days} gun kaldi`;
                          return '';
                        })()}
                      </span>
                    )}
                  </div>

                  {/* Title + description */}
                  <p className="text-sm font-bold text-slate-900">{task.title}</p>
                  {task.description && (
                    <p className="text-xs text-slate-500 leading-relaxed">{task.description}</p>
                  )}
                </div>

                {/* Right: Controls */}
                <div className="flex flex-col gap-2 shrink-0 min-w-[180px]">
                  {/* Status dropdown */}
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                    disabled={patchLoading === task.id}
                    className={`rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold focus:border-blue-500 focus:outline-none disabled:opacity-50 ${
                      task.status === 'COMPLETED'
                        ? 'text-emerald-700'
                        : task.status === 'IN_PROGRESS'
                        ? 'text-blue-700'
                        : task.status === 'CANCELLED'
                        ? 'text-rose-700'
                        : 'text-slate-700'
                    }`}
                  >
                    <option value="TODO">Yapilacak</option>
                    <option value="IN_PROGRESS">Devam Ediyor</option>
                    <option value="COMPLETED">Tamamlandi</option>
                    <option value="CANCELLED">Iptal</option>
                  </select>

                  {/* Responsible inline edit */}
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-400 shrink-0">Sorumlu:</span>
                    {editingResponsible === task.id ? (
                      <input
                        type="text"
                        value={responsibleDraft}
                        onChange={(e) => setResponsibleDraft(e.target.value)}
                        onBlur={() => handleResponsibleBlur(task.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleResponsibleBlur(task.id);
                        }}
                        autoFocus
                        className="flex-1 min-w-0 rounded-lg border border-blue-300 bg-white px-2 py-1 text-xs text-slate-900 focus:outline-none"
                      />
                    ) : (
                      <button
                        onClick={() => {
                          setEditingResponsible(task.id);
                          setResponsibleDraft(task.responsible || '');
                        }}
                        className="flex-1 min-w-0 truncate rounded-lg border border-transparent px-2 py-1 text-left text-xs text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      >
                        {task.responsible || 'Atanmadi'}
                      </button>
                    )}
                  </div>

                  {/* Target date picker */}
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-400 shrink-0">Hedef:</span>
                    <input
                      type="date"
                      value={task.targetDate ? task.targetDate.split('T')[0] : ''}
                      onChange={(e) => handleDateChange(task.id, e.target.value)}
                      disabled={patchLoading === task.id}
                      className="flex-1 min-w-0 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
