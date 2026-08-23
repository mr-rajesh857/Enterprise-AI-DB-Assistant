'use client';

import { User, UserCreate, UserUpdate } from '@/types';
import { Edit2, Trash2 } from 'lucide-react';
import { formatDate, getRoleColor } from '@/lib/utils';
import { useState } from 'react';

interface UserListProps {
  users: User[];
  loading?: boolean;
  onEdit: (user: User) => void;
  onDelete: (userId: number) => void;
  roles: Array<{ id: number; name: string }>;
}

export function UserList({ users, loading, onEdit, onDelete, roles }: UserListProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tables</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Created</th>
            <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm text-gray-900">{user.full_name}</td>
              <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
              <td className="px-6 py-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(typeof user.role === 'string' ? user.role : user.role?.name || '')}`}>
                  {typeof user.role === 'string' ? user.role : user.role?.name}
                </span>
              </td>
              <td className="px-6 py-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    user.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {user.allowed_tables ? (
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {user.allowed_tables.split(',').length} tables
                  </span>
                ) : (
                  <span className="text-xs text-gray-500">All tables</span>
                )}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {formatDate(user.created_at || new Date().toISOString())}
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => onEdit(user)}
                  className="inline-flex items-center gap-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition"
                  title="Edit user"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(user.id)}
                  className="inline-flex items-center gap-1 px-3 py-1 text-red-600 hover:bg-red-50 rounded transition"
                  title="Delete user"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
    role_id: user?.role ? roles.find((r) => r.name === (typeof user.role === 'string' ? user.role : user.role?.name))?.id || roles[0].id : roles[0].id,
    is_active: user?.is_active !== false,
    allowed_tables: user?.allowed_tables || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(user ? {
      full_name: formData.full_name,
      is_active: formData.is_active,
      role_id: formData.role_id,
      allowed_tables: formData.allowed_tables || undefined,
    } : formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!user && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>
        </>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
        <input
          type="text"
          required
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
        <select
          value={formData.role_id}
          onChange={(e) => setFormData({ ...formData, role_id: parseInt(e.target.value) })}
          className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        >
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
      </div>

      {user && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Active</label>
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="h-4 w-4 border-gray-300 rounded"
            disabled={loading}
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Allowed Tables
        </label>
        <div 
          className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer flex justify-between items-center"
          onClick={() => setShowTables(!showTables)}
        >
          <span>
            {formData.allowed_tables
              ? `${formData.allowed_tables.split(',').filter(Boolean).length} selected`
              : 'All tables (default)'}
          </span>
          <span className="text-gray-500 text-xs">{showTables ? '▲' : '▼'}</span>
        </div>
        
        {showTables && (
          <div className="mt-2 border border-gray-200 rounded-lg p-3 bg-gray-50 max-h-48 overflow-y-auto space-y-2">
            {availableTables.length === 0 ? (
              <p className="text-sm text-gray-500">No tables available</p>
            ) : (
              availableTables.map(table => {
                const selected = formData.allowed_tables ? formData.allowed_tables.split(',').filter(Boolean) : [];
                const isSelected = selected.includes(table);
                
                return (
                  <label key={table} className="flex items-center space-x-2 cursor-pointer p-1 hover:bg-gray-100 rounded">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        let newSelected;
                        if (e.target.checked) {
                          newSelected = [...selected, table];
                        } else {
                          newSelected = selected.filter(t => t !== table);
                        }
                        setFormData({ ...formData, allowed_tables: newSelected.join(',') });
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                      disabled={loading}
                    />
                    <span className="text-sm text-gray-700 select-none">{table}</span>
                  </label>
                );
              })
            )}
          </div>
        )}
        <p className="text-xs text-gray-500 mt-1">Select specific tables or leave empty for all tables.</p>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium"
        >
          {loading ? 'Saving...' : 'Save'}
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
