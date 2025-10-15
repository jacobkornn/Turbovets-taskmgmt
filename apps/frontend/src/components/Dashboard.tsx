import { useEffect, useMemo, useState } from 'react';
import { useToken } from '../context/TokenContext';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';

type Task = {
  id: number;
  title: string;
  status: 'To Do' | 'In Progress' | 'Done';
  assignedTo?: { id?: number; username: string };
};

type User = {
  id: number;
  username: string;
  role: string;
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

  // Normalize admin check
  const isPrivileged = ['admin', 'owner'].includes((user?.role ?? '').toLowerCase());

  // Shared style for all selects
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

  // Data state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterUser, setFilterUser] = useState<string>('');
  const [drafts, setDrafts] = useState<Draft[]>([]);

  // Edit mode state
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [editingStatus, setEditingStatus] = useState<Task['status']>('To Do');
  const [editingAssignedToId, setEditingAssignedToId] = useState<number>();

  // Load tasks & users
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [tRes, uRes] = await Promise.all([
          fetch('http://localhost:3000/api/tasks', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('http://localhost:3000/api/users', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        const tJson = await tRes.json();
        const uJson = await uRes.json();
        if (Array.isArray(tJson)) {
          setTasks([...tJson].sort((a, b) => b.id - a.id));
        }
        if (Array.isArray(uJson)) {
          setUsers(uJson);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [token]);
    // Filters
  const filteredTasks = useMemo(() => {
    let list = tasks;
    if (filterStatus) {
      list = list.filter(t => t.status === filterStatus);
    }
    if (filterUser) {
      list = list.filter(t => t.assignedTo?.username === filterUser);
    }
    return list;
  }, [tasks, filterStatus, filterUser]);

  // Draft helpers
  const addDraft = () => {
    setDrafts(prev => [
      { id: cryptoRandomId(), title: '', status: 'To Do', assignedToId: undefined },
      ...prev,
    ]);
  };
  const updateDraft = (id: string, patch: Partial<Draft>) =>
    setDrafts(prev => prev.map(d => (d.id === id ? { ...d, ...patch } : d)));

  // Save drafts
  const saveAllDrafts = async () => {
    if (!token) return;
    const toSave = drafts.filter(d => d.title.trim());
    for (const d of toSave) {
      const p: any = { title: d.title.trim(), status: d.status };
      if (isPrivileged && d.assignedToId) p.assignedTo = d.assignedToId;
      await fetch('http://localhost:3000/api/tasks', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      });
    }
    // reload tasks
    const res = await fetch('http://localhost:3000/api/tasks', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const arr = await res.json();
    if (Array.isArray(arr)) setTasks(arr.sort((a, b) => b.id - a.id));
    setDrafts([]);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/');
  };

  // Show Save only if any draft has text
  const showSaveButton = drafts.some(d => d.title.trim().length > 0);

  // Inline edit handlers
  const handleEditChange = (id: number, value: string) => {
    setEditingTitle(value);
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, title: value } : t)));
  };

  const canEditStatus = (task: Task) => {
    const isOwner = task.assignedTo?.id === user?.id;
    return isPrivileged || isOwner;
  };

  const handleEditBlur = async (task: Task) => {
    setEditingTaskId(null);
    if (!token) return;
    await fetch(`http://localhost:3000/api/tasks/${task.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editingTitle,
        status: canEditStatus(task) ? editingStatus : task.status,
        ...(isPrivileged && editingAssignedToId != null
          ? { assignedToId: editingAssignedToId }
          : {}),
      }),
    });
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
              onClick={saveAllDrafts}
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

{/* Board */}
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
                onChange={e => updateDraft(draft.id, { title: e.target.value })}
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
                setEditingTaskId(task.id);
                setEditingTitle(task.title);
                setEditingStatus(task.status);
                setEditingAssignedToId(task.assignedTo?.id);
              }}
            >
              {editingTaskId === task.id ? (
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
                  tabIndex={0}
                  onBlur={(e) => {
                    // Only blur when focus leaves the entire edit block
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
                      onChange={e => setEditingStatus(e.target.value as Task['status'])}
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
                </div>
              ) : (
                <>
                  <h4 style={{ marginBottom: '0.4rem', fontSize: '1rem' }}>
                    {task.title}
                  </h4>
                  <p>Status: {task.status}</p>
                  <p>Assigned to: {task.assignedTo?.username ?? 'Unassigned'}</p>
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