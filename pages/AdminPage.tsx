
import React, { useState } from 'react';
import { User, Role } from '../types';
import { db } from '../lib/mock-db';

const AdminPage: React.FC<{ user: User }> = ({ user }) => {
  const [date, setDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!date) return;
    setIsGenerating(true);
    setResult(null);
    try {
      const count = await db.generateSlots(date);
      setResult(`${date} に対して ${count} 個の新しい枠を生成しました。`);
    } catch (err) {
      setResult('生成に失敗しました。');
    }
    setIsGenerating(false);
  };

  if (user.role !== Role.ADMIN) {
    return <div className="p-8 text-red-600">このページにアクセスする権限がありません。</div>;
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">管理者ツール</h2>
        <p className="text-slate-500">予約枠の管理と生成を行います</p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">新規枠生成</h3>
        <p className="text-sm text-slate-500 mb-6">
          指定した日付の 08:00 から 18:00 まで、30分刻みの枠（全20枠）を一括生成します。
          既に存在する枠はスキップされます。
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="date"
            className="flex-1 border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button
            onClick={handleGenerate}
            disabled={!date || isGenerating}
            className={`px-6 py-2 rounded-lg font-bold text-white transition-colors ${
              !date || isGenerating ? 'bg-slate-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isGenerating ? '生成中...' : '枠を生成する'}
          </button>
        </div>

        {result && (
          <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg text-sm">
            {result}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
