'use client';

import { Role } from '@/types';
import { getRoleColor } from '@/lib/utils';

interface RoleListProps {
  roles: Role[];
  loading?: boolean;
}

export function RoleList({ roles, loading }: RoleListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {roles.map((role) => (
        <div key={role.id} className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className={`text-lg font-semibold mb-2 px-3 py-1 rounded-full inline-block ${getRoleColor(role.name)}`}>
            {role.name}
          </h3>
          {role.description && (
            <p className="text-gray-600 text-sm mb-4">{role.description}</p>
          )}
          {role.permissions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2 uppercase">Permissions</p>
              <div className="space-y-1">
                {role.permissions.map((perm) => (
                  <div key={perm.id} className="text-xs text-gray-900 bg-gray-100 px-2 py-1 rounded">
                    {perm.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
        <input
          type="text"
          name="name"
          required
          className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <input
          type="text"
          name="description"
          className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium"
        >
          {loading ? 'Creating...' : 'Create Role'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
