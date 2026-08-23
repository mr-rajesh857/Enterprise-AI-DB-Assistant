'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Role } from '@/types';
import { RoleList, RoleForm } from '@/components/RoleManagement';
import { ErrorAlert, SuccessAlert } from '@/components/Alert';
import { LoadingSpinner } from '@/components/Loading';
import { Plus, X, Shield } from 'lucide-react';

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const data = await apiClient.listRoles();
      setRoles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: { name: string; description?: string }) => {
    try {
      setFormLoading(true);
      await apiClient.createRole(data);
      setSuccess('Role created successfully');
      setShowForm(false);
      await loadRoles();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create role');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-lg shadow-purple-500/20 text-white">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Roles & Permissions</h1>
            <p className="text-xs text-slate-400 font-mono">Define user access levels and feature permission policies.</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-blue-600/20 text-xs font-semibold transition"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Create Role'}
        </button>
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError(null)} />}
      {success && <SuccessAlert message={success} onClose={() => setSuccess(null)} />}

      {/* Form Panel */}
      {showForm && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
          <h2 className="text-base font-semibold text-white">Create New Security Role</h2>
          <RoleForm loading={formLoading} onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* Role List */}
      <div>
        {loading ? (
          <div className="flex justify-center p-12">
            <LoadingSpinner />
          </div>
        ) : roles.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
            <p>No security roles defined.</p>
          </div>
        ) : (
          <RoleList roles={roles} loading={loading} />
        )}
      </div>
    </div>
  );
}
