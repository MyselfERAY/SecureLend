'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';

interface AdminUser {
  id: string;
  fullName: string;
  tcknMasked: string;
  phone: string;
  email: string | null;
  roles: string[];
  kycStatus: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  contractCount: number;
  accountCount: number;
}

export default function AdminUsersPage() {
  const { tokens } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = async (p: number) => {
    if (!tokens?.accessToken) return;
    setLoading(true);
    const res = await api<{ users: AdminUser[]; total: number }>(`/api/v1/admin/users?page=${p}&limit=20`, { token: tokens.accessToken });
    if (res.status === 'success' && res.data) {
      setUsers(res.data.users);
      setTotal(res.data.total);
    }
    setLoading(false);
  };

  useEffect(() => { load(page); }, [tokens?.accessToken, page]);

  const roleLabel: Record<string, string> = { TENANT: 'Kiraci', LANDLORD: 'Ev Sahibi', ADMIN: 'Admin' };
  const kycLabel: Record<string, { text: string; cls: string }> = {
    PENDING: { text: 'Bekliyor', cls: 'bg-yellow-100 text-yellow-700' },
    COMPLETED: { text: 'Tamam', cls: 'bg-green-100 text-green-700' },
    REJECTED: { text: 'Red', cls: 'bg-red-100 text-red-700' },
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Kullanicilar</h1>
        <span className="text-sm text-gray-500">{total} kullanici</span>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Yukleniyor...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Ad Soyad</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Telefon</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">TCKN</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Roller</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">KYC</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Sozlesme</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Kayit</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{u.fullName}</div>
                      {!u.isActive && <span className="text-xs text-red-500">Pasif</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.phone}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{u.tcknMasked}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {u.roles.map((r) => (
                          <span key={r} className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                            r === 'ADMIN' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {roleLabel[r] || r}
                          </span>
                        ))}
                        {u.roles.length === 0 && <span className="text-xs text-gray-400">-</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${kycLabel[u.kycStatus]?.cls || 'bg-gray-100 text-gray-600'}`}>
                        {kycLabel[u.kycStatus]?.text || u.kycStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.contractCount}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(u.createdAt).toLocaleDateString('tr-TR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 py-3 border-t">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1 text-sm border rounded disabled:opacity-30">Onceki</button>
              <span className="px-3 py-1 text-sm text-gray-500">{page} / {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-3 py-1 text-sm border rounded disabled:opacity-30">Sonraki</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
