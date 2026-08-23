import clsx from 'clsx';

export function cn(...classes: (string | undefined | false)[]): string {
  return clsx(...classes);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'success':
      return 'text-green-600 bg-green-50';
    case 'error':
      return 'text-red-600 bg-red-50';
    case 'blocked':
      return 'text-yellow-600 bg-yellow-50';
    case 'processing':
      return 'text-blue-600 bg-blue-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

export function getRoleColor(role: string): string {
  switch (role) {
    case 'admin':
      return 'bg-red-100 text-red-800';
    case 'analyst':
      return 'bg-blue-100 text-blue-800';
    case 'viewer':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
