import { useEffect, useMemo, useState } from 'react';
import { useToken } from '../context/TokenContext';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';

type Task = {
  id: number;
  title: string;
  status: 'To Do' | 'In Progress' | 'Done';
  assignedTo?: { id?: number; username: string };
  organization?: { id: number; name: string };
};

type User = {
  id: number;
  username: string;
  role: string;
  organization?: { id: number; name: string };
};

type Draft = {
  id: string;
  title: string;
  status: Task['status'];
  assignedToId?: number;
};

const STATUSES: Task['status'][] = ['To Do', 'In Progress', 'Done'];

export default function Dashboard() {
  const { token } = useToken();
  const { user } = useUser();
  const navigate = useNavigate();

  const isPrivileged = ['admin', 'owner'].includes((user?.role ?? '').toLowerCase());

  const selectStyle = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    borderRadius: '12px',
    border: '1px solid #ccc',
    backgroundColor: 'white',
    fontSize: '0.95rem',
    fontFamily: 'inherit' as const,
    marginBottom: '0.6rem',
  };

  // State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<{ id: number; name: string }[]>([]);
  const [filterOrg, setFilterOrg] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterUser, setFilterUser] = useState<string>('');
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [stagedEdits, setStagedEdits] = useState<Record<number, Partial<Task>>>({});
  const [stagedDeletes, setStagedDeletes] = useState<Set<number>>(new Set());

  // Editing state
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [editingStatus, setEditingStatus] = useState<Task['status']>('To Do');
  const [editingAssignedToId, setEditingAssignedToId] = useState<number>();

  // Load tasks, users, and orgs
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [tRes, uRes, oRes] = await Promise.all([
          fetch('http://localhost:3000/api/tasks', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('http://localhost:3000/api/users', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('http://localhost:3000/api/organizations', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        const [tJson, uJson, oJson] = await Promise.all([
          tRes.json(),
          uRes.json(),
          oRes.json(),
        ]);
        if (Array.isArray(tJson)) setTasks([...tJson].sort((a, b) => b.id - a.id));
        if (Array.isArray(uJson)) setUsers(uJson);
        if (Array.isArray(oJson)) setOrganizations(oJson);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [token]);

  // Apply filters
  const filteredTasks = useMemo(() => {
    let list = tasks;
    if (filterOrg && filterOrg !== 'all') {
      list = list.filter(t => t.organization?.name === filterOrg);
    }
    if (filterStatus) {
      list = list.filter(t => t.status === filterStatus);
    }
    if (filterUser) {
      list = list.filter(t => t.assignedTo?.username === filterUser);
    }

    // Viewers only see their own org
    if (!isPrivileged && user?.organization?.name) {
      list = list.filter(t => t.organization?.name === user.organization?.name);
    }

    // Hide locally removed tasks
    return list.filter(t => !stagedDeletes.has(t.id));
  }, [tasks, filterOrg, filterStatus, filterUser, user, isPrivileged, stagedDeletes]);

  // Draft helpers
  const addDraft = () => {
    setDrafts(prev => [
      { id: cryptoRandomId(), title: '', status: 'To Do', assignedToId: undefined },
      ...prev,
    ]);
  };

  const updateDraft = (id: string, patch: Partial<Draft>) =>
    setDrafts(prev => prev.map(d => (d.id === id ? { ...d, ...patch } : d)));

  // Handle edit blur (stage edits only)
  const handleEditBlur = (task: Task) => {
    setEditingTaskId(null);
    setStagedEdits(prev => ({
      ...prev,
      [task.id]: {
        title: editingTitle,
        status: canEditStatus(task) ? editingStatus : task.status,
        ...(isPrivileged && editingAssignedToId != null
          ? { assignedToId: editingAssignedToId }
          : {}),
      },
    }));
  };

  // Handle local task removal
  const handleRemoveTask = (taskId: number) => {
    setStagedDeletes(prev => new Set([...prev, taskId]));
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  // Save all drafts + edits + deletions
  const saveAllChanges = async () => {
    if (!token) return;

    // 1️⃣ Save drafts
    const toSaveDrafts = drafts.filter(d => d.title.trim());
    for (const d of toSaveDrafts) {
      const payload: any = { title: d.title.trim(), status: d.status };
      if (isPrivileged && d.assignedToId) payload.assignedTo = d.assignedToId;
      await fetch('http://localhost:3000/api/tasks', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    // 2️⃣ Save staged edits
    const taskIds = Object.keys(stagedEdits);
    for (const id of taskIds) {
      const edit = stagedEdits[Number(id)];
      await fetch(`http://localhost:3000/api/tasks/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(edit),
      });
    }

    // 3️⃣ Commit staged deletions
    for (const id of stagedDeletes) {
      await fetch(`http://localhost:3000/api/tasks/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    }

    // 4️⃣ Reload tasks
    const res = await fetch('http://localhost:3000/api/tasks', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const arr = await res.json();
    if (Array.isArray(arr)) setTasks(arr.sort((a, b) => b.id - a.id));

    // 5️⃣ Reset staging
    setDrafts([]);
    setStagedEdits({});
    setStagedDeletes(new Set());
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/');
  };

  const showSaveButton = useMemo(() => {
    const hasValidDrafts = drafts.some(d => d.title.trim().length > 0);
    const hasEdits = Object.keys(stagedEdits).length > 0;
    const hasDeletes = stagedDeletes.size > 0;
    return hasValidDrafts || hasEdits || hasDeletes;
  }, [drafts, stagedEdits, stagedDeletes]);

  const handleEditChange = (id: number, value: string) => {
    setEditingTitle(value);
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, title: value } : t)));
  };

  const canEditStatus = (task: Task) => {
    const isOwner = task.assignedTo?.id === user?.id;
    return isPrivileged || isOwner;
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#f9f9f9',
        padding: '2rem',
        boxSizing: 'border-box',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {/* Organization Filter */}
          <select
            value={
              !isPrivileged ? user?.organization?.name ?? '' : filterOrg || 'all'
            }
            onChange={e => isPrivileged && setFilterOrg(e.target.value)}
            disabled={!isPrivileged}
            style={{
              ...selectStyle,
              color: !isPrivileged ? '#666' : 'inherit',
              cursor: !isPrivileged ? 'not-allowed' : 'pointer',
              opacity: !isPrivileged ? 0.7 : 1,
            }}
          >
            {isPrivileged ? (
              <>
                <option value="all">All Organizations</option>
                {organizations.map(o => (
                  <option key={o.id} value={o.name}>
                    {o.name}
                  </option>
                ))}
              </>
            ) : (
              <option value={user?.organization?.name}>
                {user?.organization?.name ?? 'No Organization'}
              </option>
            )}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={selectStyle}
          >
            <option value="">All Statuses</option>
            {STATUSES.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* User Filter */}
          <select
            value={filterUser}
            onChange={e => setFilterUser(e.target.value)}
            style={selectStyle}
          >
            <option value="">All Users</option>
            {users.map(u => (
              <option key={u.id} value={u.username}>
                {u.username}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {showSaveButton && (
            <button
              onClick={saveAllChanges}
              style={{
                height: '2.5rem',
                padding: '0 1rem',
                borderRadius: '12px',
                backgroundColor: '#007aff',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Save
            </button>
          )}
          <button onClick={addDraft} style={{ height: '2.5rem', width: '2.5rem' }}>
            +
          </button>
          <button
            onClick={handleLogout}
            style={{
              height: '2.5rem',
              padding: '0 1rem',
              backgroundColor: '#f2f2f7',
              color: '#333',
              border: '1px solid #ccc',
              borderRadius: '12px',
              fontSize: '1rem',
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Task Board */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1.5rem',
        }}
      >
        {STATUSES.map(status => (
          <div key={status}>
            <h3
              style={{
                textAlign: 'center',
                marginBottom: '0.75rem',
                fontSize: '1.15rem',
                fontWeight: 600,
              }}
            >
              {status}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Drafts */}
              {drafts
                .filter(d => d.status === status)
                .map(draft => (
                  <div
                    key={draft.id}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '16px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                      padding: '0.9rem',
                    }}
                  >
                    <input
                      value={draft.title}
                      onChange={e =>
                        updateDraft(draft.id, { title: e.target.value })
                      }
                      placeholder="Enter task title..."
                      style={{ ...selectStyle, backgroundColor: '#f2f2f7' }}
                    />
                    <select
                      value={draft.status}
                      onChange={e =>
                        updateDraft(draft.id, { status: e.target.value as Draft['status'] })
                      }
                      style={selectStyle}
                    >
                      {STATUSES.map(s => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    {isPrivileged && (
                      <select
                        value={draft.assignedToId ?? ''}
                        onChange={e =>
                          updateDraft(draft.id, {
                            assignedToId: e.target.value ? +e.target.value : undefined,
                          })
                        }
                        style={selectStyle}
                      >
                        <option value="">Unassigned</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>
                            {u.username}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}

              {/* Existing Tasks */}
              {filteredTasks
                .filter(t => t.status === status)
                .map(task => (
                  <div
                    key={task.id}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '16px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                      padding: '0.9rem',
                    }}
                    onDoubleClick={() => {
                      const isOwner = task.assignedTo?.id === user?.id;
                      const canEdit = isPrivileged || isOwner;
                      if (!canEdit) return;

                      setEditingTaskId(task.id);
                      setEditingTitle(task.title);
                      setEditingStatus(task.status);
                      setEditingAssignedToId(task.assignedTo?.id);
                    }}
                  >
                    {editingTaskId === task.id ? (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                        }}
                        tabIndex={0}
                        onBlur={(e) => {
                          const next = e.relatedTarget;
                          if (!next || !e.currentTarget.contains(next as Node)) {
                            handleEditBlur(task);
                          }
                        }}
                      >
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={e => handleEditChange(task.id, e.target.value)}
                          autoFocus
                          style={{ ...selectStyle, backgroundColor: '#f2f2f7' }}
                        />
                        {isPrivileged || task.assignedTo?.id === user?.id ? (
                          <select
                            value={editingStatus}
                            onChange={e =>
                              setEditingStatus(e.target.value as Task['status'])
                            }
                            style={selectStyle}
                          >
                            {STATUSES.map(s => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p>Status: {task.status}</p>
                        )}
                        {isPrivileged ? (
                          <select
                            value={editingAssignedToId ?? ''}
                            onChange={e =>
                              setEditingAssignedToId(
                                e.target.value ? +e.target.value : undefined,
                              )
                            }
                            style={selectStyle}
                          >
                            <option value="">Unassigned</option>
                            {users.map(u => (
                              <option key={u.id} value={u.id}>
                                {u.username}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p>Assigned to: {task.assignedTo?.username ?? 'Unassigned'}</p>
                        )}

                        {/* Remove Task button */}
                        <button
                          onClick={() => handleRemoveTask(task.id)}
                          style={{
                            marginTop: '0.5rem',
                            backgroundColor: '#fff5f5',
                            color: '#d90429',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '0.5rem',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s ease',
                          }}
                          onMouseOver={e =>
                            (e.currentTarget.style.backgroundColor = '#ffeaea')
                          }
                          onMouseOut={e =>
                            (e.currentTarget.style.backgroundColor = '#fff5f5')
                          }
                        >
                          Remove Task
                        </button>
                      </div>
                    ) : (
                      <>
                        <h4 style={{ marginBottom: '0.4rem', fontSize: '1rem' }}>
                          {task.title}
                        </h4>
                        <p>Status: {task.status}</p>
                        <p>Assigned to: {task.assignedTo?.username ?? 'Unassigned'}</p>
                        <p>Organization: {task.organization?.name ?? '—'}</p>
                      </>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Utility for draft IDs
function cryptoRandomId() {
  return crypto.randomUUID?.() ?? 'd_' + Math.random().toString(36).slice(2);
}
