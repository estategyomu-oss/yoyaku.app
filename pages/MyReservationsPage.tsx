
import React, { useState, useEffect } from 'react';
import { User, Slot, Reservation } from '../types';
import { db } from '../lib/mock-db';

const MyReservationsPage: React.FC<{ user: User }> = ({ user }) => {
  const [reservations, setReservations] = useState<(Reservation & { slot: Slot })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyRes = async () => {
    setLoading(true);
    const data = await db.getMyReservations(user.company);
    setReservations(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchMyRes();
  }, []);

  const handleCancel = async (id: string) => {
    if (!confirm('本当にキャンセルしますか？')) return;
    try {
      await db.cancelReservation(user.id, id);
      fetchMyRes();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">自社の予約一覧</h2>
      
      {loading ? (
        <div>読み込み中...</div>
      ) : reservations.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <p className="text-slate-500">現在の予約はありません</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">日付</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">時間</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">アクション</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {reservations.map((res) => (
                <tr key={res.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{res.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{res.slot.startTime}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleCancel(res.id)}
                      className="text-red-600 hover:text-red-900 font-medium"
                    >
                      キャンセル
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyReservationsPage;
