'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { User, UserCreate, UserUpdate, Role } from '@/types';
import { UserList, UserForm } from '@/components/UserManagement';
import { ErrorAlert, SuccessAlert } from '@/components/Alert';
import { LoadingSpinner } from '@/components/Loading';
import { Plus, X, Users as UsersIcon } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    loadUsers();
    loadRoles();
    loadTables();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await apiClient.listUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const data = await apiClient.listRoles();
      setRoles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roles');
    }
  };

  const loadTables = async () => {
    try {
      const data = await apiClient.getTables();
      setAvailableTables(data.tables);
    } catch (err) {
      console.error('Failed to load tables', err);
    }
  };

  const handleCreate = async (data: UserCreate) => {
    try {
      setFormLoading(true);
      await apiClient.createUser(data);
      setSuccess('User created successfully');
      setShowForm(false);
      setEditingUser(null);
      await loadUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to create user');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (data: UserUpdate) => {
    if (!editingUser) return;
    try {
      setFormLoading(true);
      await apiClient.updateUser(editingUser.id, data);
      setSuccess('User updated successfully');
      setShowForm(false);
      setEditingUser(null);
      await loadUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to update user');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await apiClient.deleteUser(userId);
      setSuccess('User deleted successfully');
      await loadUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to delete user');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20 text-white">
            <UsersIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Users & RBAC Management</h1>
            <p className="text-xs text-slate-400 font-mono">Manage accounts, role assignments, and database table permissions.</p>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            setShowForm(!showForm);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-blue-600/20 text-xs font-semibold transition"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add New User'}
        </button>
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError(null)} />}
      {success && <SuccessAlert message={success} onClose={() => setSuccess(null)} />}

      {/* Form Drawer / Panel */}
      {showForm && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
          <h2 className="text-base font-semibold text-white">
            {editingUser ? `Edit User: ${editingUser.full_name}` : 'Create New User Account'}
          </h2>
          <UserForm
            user={editingUser || undefined}
            roles={roles}
            availableTables={availableTables}
            loading={formLoading}
            onSubmit={(editingUser ? handleUpdate : handleCreate) as any}
            onCancel={() => {
              setShowForm(false);
              setEditingUser(null);
            }}
          />
        </div>
      )}

      {/* User List Table */}
      <div>
        {loading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
            <p>No user accounts found. Click "Add New User" to create one.</p>
          </div>
        ) : (
          <UserList
            users={users}
            roles={roles}
            onEdit={(user) => {
              setEditingUser(user);
              setShowForm(true);
            }}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}
