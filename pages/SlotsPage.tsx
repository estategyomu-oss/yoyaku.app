
import React, { useState, useEffect } from 'react';
import { User, Slot, Role, Reservation } from '../types';
import { db } from '../lib/mock-db';
import Notification from '../components/Notification';
import ConfirmDialog from '../components/ConfirmDialog';

interface SlotsPageProps {
  user: User;
  reschedulingItem?: (Reservation & { slot: { startTime: string } }) | null;
  onCancelRescheduling?: () => void;
  onCompleteRescheduling?: () => void;
}

const SlotsPage: React.FC<SlotsPageProps> = ({ 
  user, 
  reschedulingItem, 
  onCancelRescheduling,
  onCompleteRescheduling 
}) => {
  const [date, setDate] = useState(reschedulingItem ? reschedulingItem.date : new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Modal state
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const data = await db.getSlots(date);
      setSlots(data);
    } catch (err: any) {
      console.error("Fetch slots error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [date]);

  const handleBook = async (slotId: string) => {
    setIsProcessing(slotId);
    try {
      await db.createReservation(user.id, slotId);
      setNotification({ type: 'success', text: '予約が正常に完了しました' });
      await fetchSlots();
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || '予約に失敗しました' });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleMove = async (slotId: string) => {
    if (!reschedulingItem) return;
    setIsProcessing(slotId);
    try {
      await db.moveReservation(user.id, reschedulingItem.id, slotId);
      setNotification({ type: 'success', text: '予約の時間を変更しました' });
      if (onCompleteRescheduling) onCompleteRescheduling();
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || '変更に失敗しました' });
    } finally {
      setIsProcessing(null);
    }
  };

  const openCancelConfirm = (e: React.MouseEvent, resId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmCancelId(resId);
  };

  const handleCancel = async () => {
    if (!confirmCancelId) return;
    
    const resId = confirmCancelId;
    setConfirmCancelId(null);
    setIsProcessing(resId);
    
    try {
      await db.cancelReservation(user.id, resId);
      setNotification({ type: 'success', text: '予約をキャンセルしました' });
      await fetchSlots();
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'キャンセルに失敗しました' });
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
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
        message="この予約をキャンセルしてもよろしいですか？"
        confirmText="キャンセルを確定する"
        cancelText="戻る"
        onConfirm={handleCancel}
        onCancel={() => setConfirmCancelId(null)}
      />

      {/* Rescheduling Mode Banner */}
      {reschedulingItem && (
        <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-2xl shadow-sm animate-in slide-in-from-top-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="bg-amber-100 p-3 rounded-xl text-amber-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-amber-900">予約変更モード</h3>
                <p className="text-amber-700 text-sm">
                  現在の予約: <span className="font-bold">{reschedulingItem.date} {reschedulingItem.slot.startTime}</span> を移動する新しい枠を選んでください
                </p>
              </div>
            </div>
            <button 
              onClick={onCancelRescheduling}
              className="px-6 py-2 bg-white border border-amber-300 text-amber-700 font-bold rounded-xl hover:bg-amber-100 transition-colors"
            >
              中止
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {reschedulingItem ? '移動先の時間枠を選択' : '予約枠一覧'}
          </h2>
          <p className="text-slate-500 text-sm mt-1">1枠につき最大2社まで予約が可能です</p>
        </div>
        <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
          <label className="text-sm font-semibold text-slate-700 ml-2">日付選択:</label>
          <input
            type="date"
            className="border-none bg-transparent rounded-md px-3 py-1 outline-none focus:ring-0 text-slate-900 font-medium cursor-pointer"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium">読み込み中...</p>
        </div>
      ) : slots.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200 shadow-inner">
          <p className="text-slate-400 text-lg">この日の予約枠はまだ設定されていません</p>
          {user.role === Role.admin && (
            <p className="text-sm text-indigo-500 mt-2 font-medium">管理者メニューから予約枠を生成してください</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {slots.map((slot) => {
            const isCurrentResSlot = reschedulingItem?.slotId === slot.id;
            const isProcessingSlot = isProcessing === slot.id;

            return (
              <div
                key={slot.id}
                className={`relative flex flex-col p-5 rounded-2xl border-2 transition-all duration-300 ${
                  isCurrentResSlot
                    ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-200'
                    : slot.isFull
                    ? 'bg-slate-50 border-slate-100'
                    : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xl hover:-translate-y-1'
                }`}
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl font-black text-slate-800 tracking-tighter">{slot.startTime}</span>
                  <div className={`text-[11px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                    slot.isFull 
                      ? 'bg-slate-200 text-slate-600' 
                      : slot.reservedCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {slot.isFull ? '満員' : `${slot.reservedCount}/${slot.maxCapacity} 予約済み`}
                  </div>
                </div>
                
                <div className="flex-1 space-y-3">
                  {slot.reservations.length > 0 ? (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">予約中の会社</p>
                      <div className="flex flex-col gap-1.5">
                        {slot.reservations.map((res) => (
                          <div key={res.id} className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${res.company === user.company ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                            <span className="truncate max-w-[100px]">{res.company}</span>
                            {!reschedulingItem && (res.company === user.company || user.role === Role.admin) && (
                              <button 
                                onClick={(e) => openCancelConfirm(e, res.id)}
                                disabled={!!isProcessing}
                                className="ml-2 text-red-500 hover:text-red-700 hover:bg-red-100 p-1 rounded-md transition-colors disabled:opacity-50"
                              >
                                {isProcessing === res.id ? (
                                  <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">空き枠</p>
                  )}
                </div>

                <div className="mt-6">
                  {isCurrentResSlot ? (
                    <div className="w-full py-2.5 text-center text-xs font-bold rounded-xl bg-amber-100 text-amber-700 border border-amber-200">
                      現在の予約
                    </div>
                  ) : slot.isFull ? (
                    <button
                      disabled
                      className="w-full py-2.5 text-sm font-bold rounded-xl bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                    >
                      満員
                    </button>
                  ) : (
                    <button
                      onClick={() => reschedulingItem ? handleMove(slot.id) : handleBook(slot.id)}
                      disabled={user.role === Role.admin || !!isProcessing}
                      className={`w-full py-2.5 text-sm font-bold rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center space-x-2 ${
                        user.role === Role.admin 
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : reschedulingItem 
                            ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-amber-200' 
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-200'
                      } disabled:opacity-75`}
                    >
                      {isProcessingSlot && (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      )}
                      <span>{reschedulingItem ? 'ここへ移動' : '予約する'}</span>
                    </button>
                  )}
                </div>
                
                {slot.reservedCount === 1 && !slot.isFull && !isCurrentResSlot && (
                  <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm animate-bounce">
                    あと1台!
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SlotsPage;
