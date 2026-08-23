'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { User, UserCreate, UserUpdate, Role } from '@/types';
import { UserList, UserForm } from '@/components/UserManagement';
import { ErrorAlert, SuccessAlert } from '@/components/Alert';
import { LoadingSpinner } from '@/components/Loading';
import { Plus, X } from 'lucide-react';

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
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">Users Management</h1>
        <button
          onClick={() => {
            setEditingUser(null);
            setShowForm(!showForm);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showForm ? 'Cancel' : 'Add User'}
        </button>
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError(null)} />}
      {success && <SuccessAlert message={success} onClose={() => setSuccess(null)} />}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingUser ? 'Edit User' : 'Create New User'}
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

      {/* User List */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-8 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No users found. Create one to get started.</p>
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
