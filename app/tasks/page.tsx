"use client";

import { useMemo, useState, useEffect } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { useTasks, type Task } from "@/lib/useTasks";
import { getWorkspaceProfile, loadWorkspaceCustomers } from "@/lib/workspace";

type Priority = Task["priority"];
type Status = Task["status"];
type ViewMode = "List" | "Kanban";

export default function TasksPage() {
  const [view, setView] = useState<ViewMode>("List");
  const [priorityFilter, setPriorityFilter] = useState<"All" | Priority>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | Status>("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tasks, setTasks] = useTasks();
  const [detailTask, setDetailTask] = useState<Task | null>(null);

  // Real customers from Supabase
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    async function loadCustomers() {
      const profile = await getWorkspaceProfile();
      if (!profile) return;
      const data = await loadWorkspaceCustomers(profile);
      setCustomers(
        data
          .map((customer) => ({ id: customer.id, name: customer.name }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
    }
    loadCustomers();
  }, []);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      const pOk = priorityFilter === "All" || t.priority === priorityFilter;
      const sOk = statusFilter === "All" || t.status === statusFilter;
      return pOk && sOk;
    });
  }, [tasks, priorityFilter, statusFilter]);

  const kanban = useMemo(() => {
    const cols: Record<Status, Task[]> = { Open: [], "In Progress": [], Done: [] };
    for (const t of filtered) cols[t.status].push(t);
    return cols;
  }, [filtered]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white">
      <div className="mx-auto max-w-6xl space-y-6 px-1 py-2 sm:px-3 sm:py-6">
        <header className="rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Tasks</h1>
              <p className="mt-1 text-sm text-gray-600">Manage customer actions and follow-ups</p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
              <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
                <ToggleButton active={view === "List"} label="List" onClick={() => setView("List")} />
                <ToggleButton active={view === "Kanban"} label="Kanban" onClick={() => setView("Kanban")} />
              </div>
              <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                  <path d="M10.75 3.5a.75.75 0 0 0-1.5 0v5.75H3.5a.75.75 0 0 0 0 1.5h5.75v5.75a.75.75 0 0 0 1.5 0v-5.75h5.75a.75.75 0 0 0 0-1.5h-5.75V3.5Z" />
                </svg>
                Create task
              </Button>
            </div>
          </div>
        </header>

        <Card>
          <CardBody>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <div className="text-sm font-semibold text-gray-900">Filters</div>
                <span className="text-xs text-gray-500">{filtered.length} task{filtered.length === 1 ? "" : "s"}</span>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                  <label className="text-xs font-semibold text-gray-700">Priority</label>
                  <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as typeof priorityFilter)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 shadow-sm outline-none focus:border-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/15 sm:w-52">
                    <option value="All">All</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                  <label className="text-xs font-semibold text-gray-700">Status</label>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 shadow-sm outline-none focus:border-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/15 sm:w-56">
                    <option value="All">All</option>
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {view === "List" ? (
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm shadow-gray-900/5">
            <div className="max-h-[620px] overflow-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="sticky top-0 z-10 bg-gray-50/80 text-xs font-semibold tracking-wide text-gray-600 backdrop-blur">
                  <tr>
                    <th scope="col" className="px-5 py-3.5">Task Title</th>
                    <th scope="col" className="px-5 py-3.5">Customer</th>
                    <th scope="col" className="px-5 py-3.5">Priority</th>
                    <th scope="col" className="px-5 py-3.5">Due Date</th>
                    <th scope="col" className="px-5 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((t) => (
                    <tr key={t.id} className="cursor-pointer transition-colors hover:bg-gray-50/80" onClick={() => setDetailTask(t)}>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900">{t.title}</div>
                        <div className="mt-0.5 text-xs text-gray-500">{t.id}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm font-semibold text-gray-900">{t.customerName}</div>
                        <div className="mt-0.5 text-xs text-gray-500">{t.customerId}</div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={t.priority === "High" ? "danger" : t.priority === "Medium" ? "warning" : "neutral"}>{t.priority}</Badge>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-gray-700">{t.dueDate}</td>
                      <td className="px-5 py-4">
                        <Badge tone={t.status === "Done" ? "success" : t.status === "In Progress" ? "warning" : "neutral"}>{t.status}</Badge>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td className="px-5 py-10 text-center text-sm text-gray-600" colSpan={5}>
                        {tasks.length === 0 ? "No tasks yet. Create your first task above." : "No tasks match your filters."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <KanbanColumn title="Open" tasks={kanban["Open"]} onSelect={setDetailTask} />
            <KanbanColumn title="In Progress" tasks={kanban["In Progress"]} onSelect={setDetailTask} />
            <KanbanColumn title="Done" tasks={kanban["Done"]} onSelect={setDetailTask} />
          </section>
        )}
      </div>

      {isModalOpen && (
        <CreateTaskModal
          customers={customers}
          onClose={() => setIsModalOpen(false)}
          onCreate={(draft) => {
            const next: Task = {
              id: `TASK-${Math.floor(3000 + Math.random() * 900)}`,
              title: draft.title,
              description: draft.description,
              customerId: draft.customerId,
              customerName: draft.customerName,
              priority: draft.priority,
              dueDate: draft.dueDate,
              status: "Open",
            };
            setTasks((prev) => [next, ...prev]);
            setIsModalOpen(false);
          }}
        />
      )}

      {detailTask && <TaskDetailModal task={detailTask} onClose={() => setDetailTask(null)} />}
    </div>
  );
}

function ToggleButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`rounded-lg px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-indigo-600/15 ${active ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20" : "text-gray-700 hover:bg-gray-50"}`} aria-pressed={active}>
      {label}
    </button>
  );
}

function KanbanColumn({ title, tasks, onSelect }: { title: Status; tasks: Task[]; onSelect: (task: Task) => void }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm shadow-gray-900/5 sm:p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-900">{title}</div>
        <div className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700 ring-1 ring-inset ring-gray-200">{tasks.length}</div>
      </div>
      <div className="mt-4 space-y-3">
        {tasks.map((t) => (
          <div key={t.id} className="cursor-pointer rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md hover:shadow-gray-900/10" onClick={() => onSelect(t)}>
            <div className="text-sm font-semibold text-gray-900">{t.title}</div>
            <div className="mt-1 text-xs text-gray-600">{t.customerName} · Due {t.dueDate}</div>
            <div className="mt-3 flex items-center gap-2">
              <Badge tone={t.priority === "High" ? "danger" : t.priority === "Medium" ? "warning" : "neutral"}>{t.priority}</Badge>
              <Badge tone={t.status === "Done" ? "success" : t.status === "In Progress" ? "warning" : "neutral"}>{t.status}</Badge>
            </div>
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-600">No tasks</div>
        )}
      </div>
    </div>
  );
}

function CreateTaskModal({
  customers,
  onClose,
  onCreate,
}: {
  customers: { id: string; name: string }[];
  onClose: () => void;
  onCreate: (draft: { title: string; description: string; customerId: string; customerName: string; priority: Priority; dueDate: string }) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0]);

  const customerName = customers.find((c) => c.id === customerId)?.name ?? customerId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Create task" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-lg shadow-gray-900/15">
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 p-4 sm:p-5">
          <div>
            <div className="text-sm font-semibold text-gray-900">Create task</div>
            <div className="mt-0.5 text-xs text-gray-600">Add a new follow-up task for a customer.</div>
          </div>
          <button className="grid h-9 w-9 place-items-center rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:outline-none" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path fillRule="evenodd" d="M4.22 4.22a.75.75 0 0 1 1.06 0L10 8.94l4.72-4.72a.75.75 0 1 1 1.06 1.06L11.06 10l4.72 4.72a.75.75 0 1 1-1.06 1.06L10 11.06l-4.72 4.72a.75.75 0 1 1-1.06-1.06L8.94 10 4.22 5.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>
          </button>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">Task name</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Follow up on onboarding" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/15" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add details for this follow-up…" rows={3} className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/15" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Customer</label>
              {customers.length === 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                  No customers yet. Upload a CSV first.
                </div>
              ) : (
                <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 shadow-sm outline-none focus:border-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/15">
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 shadow-sm outline-none focus:border-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/15">
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">Due date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 shadow-sm outline-none focus:border-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/15" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-200 p-4 sm:p-5">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => onCreate({ title: title.trim() || "Untitled task", description: description.trim(), customerId, customerName, priority, dueDate })} disabled={customers.length === 0}>
            Create task
          </Button>
        </div>
      </div>
    </div>
  );
}

function TaskDetailModal({ task, onClose }: { task: Task; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-lg shadow-slate-900/15">
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 p-4 sm:p-5">
          <div>
            <div className="text-sm font-semibold text-gray-900">Task details</div>
            <div className="mt-0.5 text-xs text-gray-600">{task.id}</div>
          </div>
          <button className="grid h-9 w-9 place-items-center rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:outline-none" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path fillRule="evenodd" d="M4.22 4.22a.75.75 0 0 1 1.06 0L10 8.94l4.72-4.72a.75.75 0 1 1 1.06 1.06L11.06 10l4.72 4.72a.75.75 0 1 1-1.06 1.06L10 11.06l-4.72 4.72a.75.75 0 1 1-1.06-1.06L8.94 10 4.22 5.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>
          </button>
        </div>
        <div className="space-y-4 p-4 sm:p-5">
          <div>
            <div className="text-sm font-semibold text-gray-900">{task.title}</div>
            <div className="mt-1 text-sm text-gray-700">{task.description?.trim().length ? task.description : "No description provided."}</div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Customer</div>
              <div className="mt-1 text-sm font-semibold text-gray-900">{task.customerName}</div>
              <div className="mt-0.5 text-xs text-gray-500">{task.customerId}</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Due date</div>
              <div className="mt-1 text-sm font-semibold text-gray-900">{task.dueDate}</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={task.status === "Done" ? "success" : task.status === "In Progress" ? "warning" : "neutral"}>{task.status}</Badge>
            <Badge tone={task.priority === "High" ? "danger" : task.priority === "Medium" ? "warning" : "neutral"}>{task.priority}</Badge>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-gray-200 p-4 sm:p-5">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
