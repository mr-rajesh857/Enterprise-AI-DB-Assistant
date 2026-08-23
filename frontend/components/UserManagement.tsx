'use client';

import { User, UserCreate, UserUpdate } from '@/types';
import { Edit2, Trash2, CheckCircle2, XCircle, Shield, Database } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useState } from 'react';

interface UserListProps {
  users: User[];
  loading?: boolean;
  onEdit: (user: User) => void;
  onDelete: (userId: number) => void;
  roles: Array<{ id: number; name: string }>;
}

export function UserList({ users, loading, onEdit, onDelete }: UserListProps) {
  return (
    <div className="w-full overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono uppercase text-[11px] tracking-wider select-none">
              <th className="px-6 py-4 font-semibold">User</th>
              <th className="px-6 py-4 font-semibold">Email</th>
              <th className="px-6 py-4 font-semibold">Role</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Allowed Tables</th>
              <th className="px-6 py-4 font-semibold">Created</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-slate-300">
            {users.map((user) => {
              const roleName = typeof user.role === 'string' ? user.role : user.role?.name || 'User';
              const isAdmin = roleName.toLowerCase() === 'admin';

              return (
                <tr key={user.id} className="hover:bg-slate-800/40 transition-colors duration-150">
                  <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
                      {user.full_name.charAt(0).toUpperCase()}
                    </div>
                    <span>{user.full_name}</span>
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-400">{user.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${
                        isAdmin
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}
                    >
                      <Shield className="w-3 h-3" />
                      {roleName}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                        user.is_active
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}
                    >
                      {user.is_active ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-rose-400" />
                          Inactive
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.allowed_tables ? (
                      <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-1 rounded-lg text-[11px] font-mono">
                        <Database className="w-3 h-3 text-blue-400" />
                        {user.allowed_tables.split(',').length} tables
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500 font-mono italic">All tables (Full Access)</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-400 font-mono text-[11px]">
                    {formatDate(user.created_at || new Date().toISOString())}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => onEdit(user)}
                      className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition"
                      title="Edit user"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(user.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                      title="Delete user"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface UserFormProps {
  user?: User;
  roles: Array<{ id: number; name: string }>;
  availableTables?: string[];
  loading?: boolean;
  onSubmit: (data: UserCreate | UserUpdate) => Promise<void>;
  onCancel: () => void;
}

export function UserForm({ user, roles, availableTables = [], loading, onSubmit, onCancel }: UserFormProps) {
  const [showTables, setShowTables] = useState(false);
  const [formData, setFormData] = useState({
    email: user?.email || '',
    password: '',
    full_name: user?.full_name || '',
    role_id: user?.role
      ? roles.find((r) => r.name === (typeof user.role === 'string' ? user.role : user.role?.name))?.id || roles[0]?.id
      : roles[0]?.id,
    is_active: user?.is_active !== false,
    allowed_tables: user?.allowed_tables || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(
      user
        ? {
            full_name: formData.full_name,
            is_active: formData.is_active,
            role_id: formData.role_id,
            allowed_tables: formData.allowed_tables || undefined,
          }
        : formData
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-slate-100">
      {!user && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500 transition"
              disabled={loading}
              placeholder="user@enterprise.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500 transition"
              disabled={loading}
              placeholder="••••••••"
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
        <input
          type="text"
          required
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500 transition"
          disabled={loading}
          placeholder="John Doe"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">User Role</label>
          <select
            value={formData.role_id}
            onChange={(e) => setFormData({ ...formData, role_id: parseInt(e.target.value) })}
            className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500 transition"
            disabled={loading}
          >
            {roles.map((role) => (
              <option key={role.id} value={role.id} className="bg-slate-900 text-white">
                {role.name}
              </option>
            ))}
          </select>
        </div>

        {user && (
          <div className="flex items-center pt-5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-blue-500"
                disabled={loading}
              />
              <span className="text-xs font-semibold text-slate-300">Account Active Status</span>
            </label>
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Allowed Tables (RBAC Scope)</label>
        <div
          className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs cursor-pointer flex justify-between items-center hover:border-slate-700 transition"
          onClick={() => setShowTables(!showTables)}
        >
          <span className="text-slate-300 font-mono">
            {formData.allowed_tables
              ? `${formData.allowed_tables.split(',').filter(Boolean).length} tables restricted`
              : 'All tables (Full Access)'}
          </span>
          <span className="text-slate-500 text-xs">{showTables ? '▲' : '▼'}</span>
        </div>

        {showTables && (
          <div className="mt-2 border border-slate-800 rounded-xl p-3 bg-slate-950 max-h-48 overflow-y-auto space-y-2">
            {availableTables.length === 0 ? (
              <p className="text-xs text-slate-500">No tables available</p>
            ) : (
              availableTables.map((table) => {
                const selected = formData.allowed_tables ? formData.allowed_tables.split(',').filter(Boolean) : [];
                const isSelected = selected.includes(table);

                return (
                  <label key={table} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-slate-900 rounded-lg">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        let newSelected;
                        if (e.target.checked) {
                          newSelected = [...selected, table];
                        } else {
                          newSelected = selected.filter((t) => t !== table);
                        }
                        setFormData({ ...formData, allowed_tables: newSelected.join(',') });
                      }}
                      className="rounded border-slate-800 bg-slate-900 text-blue-600 focus:ring-blue-500 h-4 w-4"
                      disabled={loading}
                    />
                    <span className="text-xs text-slate-300 font-mono select-none">{table}</span>
                  </label>
                );
              })
            )}
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition"
        >
          {loading ? 'Saving...' : 'Save User'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
