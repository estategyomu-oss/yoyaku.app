
import React, { useState, useEffect } from 'react';
import { User, Reservation } from '../types';
import { db } from '../lib/mock-db';
import Notification from '../components/Notification';
import ConfirmDialog from '../components/ConfirmDialog';

interface MyReservationsPageProps {
  user: User;
  onReschedule: (res: Reservation & { slot: { startTime: string } }) => void;
}

const MyReservationsPage: React.FC<MyReservationsPageProps> = ({ user, onReschedule }) => {
  const [reservations, setReservations] = useState<(Reservation & { slot: { id: string, date: string, startTime: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Modal state
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  const fetchMyRes = async () => {
    setLoading(true);
    try {
      const data = await db.getMyReservations(user.company);
      setReservations(data);
    } catch (err: any) {
      console.error("Failed to fetch reservations", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRes();
  }, [user.company]);

  const openCancelConfirm = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmCancelId(id);
  };

  const handleCancel = async () => {
    if (!confirmCancelId) return;
    
    const id = confirmCancelId;
    setConfirmCancelId(null);
    setIsProcessing(id);
    
    try {
      await db.cancelReservation(user.id, id);
      setNotification({ type: 'success', text: '予約を正常にキャンセルしました' });
      await fetchMyRes();
    } catch (err: any) {
      console.error("Cancel failed", err);
      setNotification({ type: 'error', text: err.message || 'キャンセルに失敗しました' });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleRescheduleClick = (e: React.MouseEvent, res: any) => {
    e.preventDefault();
    e.stopPropagation();
    onReschedule(res);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {notification && (
        <Notification 
          message={notification.text} 
          type={notification.type} 
          onClose={() => setNotification(null)} 
        />
      )}

      <ConfirmDialog
        isOpen={!!confirmCancelId}
        title="予約のキャンセル"
        message="この予約をキャンセルしてもよろしいですか？この操作は取り消せません。"
        confirmText="予約をキャンセルする"
        cancelText="戻る"
        onConfirm={handleCancel}
        onCancel={() => setConfirmCancelId(null)}
      />

      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">自社の予約一覧</h2>
        <p className="text-slate-500 mt-1">現在確定している予約状況を確認・管理できます</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium">予約情報を取得中...</p>
        </div>
      ) : reservations.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200 shadow-inner">
          <div className="mb-4 text-slate-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-slate-500 text-lg font-medium">現在、有効な予約はありません</p>
          <p className="text-slate-400 text-sm mt-1">「予約枠」タブから時間枠を選択して予約してください</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reservations.map((res) => (
            <div 
              key={res.id} 
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center space-x-6">
                <div className="bg-indigo-50 text-indigo-700 p-3 rounded-xl flex flex-col items-center min-w-[110px]">
                  <span className="text-[10px] uppercase font-bold tracking-widest opacity-70">日付</span>
                  <span className="text-sm font-bold">{res.date}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">時間枠</span>
                  <span className="text-xl font-black text-slate-800">{res.slot.startTime}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 sm:border-l border-slate-100 sm:pl-6">
                <button
                  onClick={(e) => handleRescheduleClick(e, res)}
                  disabled={!!isProcessing}
                  className="px-6 py-2.5 text-sm font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-xl transition-all border border-amber-100 flex items-center space-x-2 disabled:opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  <span>変更</span>
                </button>
                <button
                  onClick={(e) => openCancelConfirm(e, res.id)}
                  disabled={!!isProcessing}
                  className={`px-6 py-2.5 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all border border-red-100 flex items-center space-x-2 disabled:opacity-50 ${isProcessing === res.id ? 'animate-pulse' : ''}`}
                >
                  {isProcessing === res.id ? (
                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span>キャンセル</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyReservationsPage;
