'use client';

import { Role } from '@/types';
import { ShieldCheck, KeyRound } from 'lucide-react';

interface RoleListProps {
  roles: Role[];
  loading?: boolean;
}

export function RoleList({ roles }: RoleListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {roles.map((role) => {
        const isAdmin = role.name.toLowerCase() === 'admin';

        return (
          <div
            key={role.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl hover:border-slate-700 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                    isAdmin
                      ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {role.name}
                </span>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
                  ID: #{role.id}
                </span>
              </div>

              {role.description && (
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">{role.description}</p>
              )}

              {role.permissions && role.permissions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1">
                    <KeyRound className="w-3 h-3 text-blue-400" />
                    Assigned Permissions ({role.permissions.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {role.permissions.map((perm) => (
                      <span
                        key={perm.id}
                        className="text-[11px] font-mono text-slate-300 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg"
                      >
                        {perm.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface RoleFormProps {
  loading?: boolean;
  onSubmit: (data: { name: string; description?: string }) => Promise<void>;
  onCancel: () => void;
}

export function RoleForm({ loading, onSubmit, onCancel }: RoleFormProps) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await onSubmit({
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-slate-100">
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Role Name</label>
        <input
          type="text"
          name="name"
          required
          className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500 transition"
          disabled={loading}
          placeholder="e.g. Data Analyst"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description</label>
        <input
          type="text"
          name="description"
          className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500 transition"
          disabled={loading}
          placeholder="Role responsibilities and scope..."
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition"
        >
          {loading ? 'Creating...' : 'Create Role'}
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
