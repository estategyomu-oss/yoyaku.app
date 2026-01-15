
import React, { useState, useEffect } from 'react';
import { User, Slot, Role } from '../types';
import { db } from '../lib/mock-db';

const SlotsPage: React.FC<{ user: User }> = ({ user }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchSlots = async () => {
    setLoading(true);
    const data = await db.getSlots(date);
    setSlots(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSlots();
  }, [date]);

  const handleBook = async (slotId: string) => {
    try {
      await db.createReservation(user.id, slotId);
      setMessage({ type: 'success', text: '予約が完了しました' });
      fetchSlots();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">予約枠一覧</h2>
          <p className="text-slate-500">日付を選択して空き状況を確認してください</p>
        </div>
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-slate-700">日付:</label>
          <input
            type="date"
            className="border border-slate-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-400 italic">読み込み中...</div>
      ) : slots.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-slate-200">
          <p className="text-slate-500">この日の予約枠はまだ生成されていません</p>
          {user.role === Role.ADMIN && (
            <p className="text-xs text-slate-400 mt-2">管理者ページから枠を生成してください</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {slots.map((slot) => (
            <div
              key={slot.id}
              className={`p-4 rounded-xl border transition-all ${
                slot.isReserved
                  ? 'bg-slate-50 border-slate-200 opacity-75'
                  : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-lg font-bold text-slate-800">{slot.startTime}</span>
                {slot.isReserved ? (
                  <span className="text-[10px] px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full font-bold uppercase">
                    Reserved
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-bold uppercase">
                    Available
                  </span>
                )}
              </div>
              
              {slot.isReserved ? (
                <div className="mt-4">
                  <p className="text-xs text-slate-400">予約会社:</p>
                  <p className="text-sm font-semibold text-slate-700">{slot.reservedByCompany}</p>
                </div>
              ) : (
                <button
                  onClick={() => handleBook(slot.id)}
                  disabled={user.role === Role.ADMIN}
                  className={`mt-4 w-full py-2 text-sm font-bold rounded-lg transition-colors ${
                    user.role === Role.ADMIN 
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  予約する
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SlotsPage;
