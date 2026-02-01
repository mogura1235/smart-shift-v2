import React, { useState, useMemo } from 'react';
import { Users, AlertTriangle, Download, CheckCircle2, Calendar as CalendarIcon, Info } from 'lucide-react';

// --- データ定義 & ロジック ---

const STAFF_MEMBERS = ['田中', '佐藤', '鈴木', '高橋', '伊藤', '渡辺'];
const DAYS_IN_MONTH = 31; // 1ヶ月分
const MIN_STAFF_PER_DAY = 3; // 最低必要人数（科学的根拠に基づく設定）

const STATUS = {
  OFF: { label: '休み', color: 'bg-gray-100 text-gray-400', code: 'ー' },
  WORK: { label: '出勤', color: 'bg-blue-500 text-white', code: '出' },
  REQUEST: { label: '希望休', color: 'bg-red-100 text-red-600', code: '希' },
};

export default function ShiftManager() {
  // 初期データの生成 (全スタッフ31日分)
  const [shifts, setShifts] = useState(() => {
    const initial = {};
    STAFF_MEMBERS.forEach(staff => {
      initial[staff] = Array(DAYS_IN_MONTH).fill('WORK');
    });
    return initial;
  });

  // セルクリック時のステータス切り替えロジック
  const toggleShift = (staff, dayIdx) => {
    const current = shifts[staff][dayIdx];
    const next = current === 'WORK' ? 'OFF' : current === 'OFF' ? 'REQUEST' : 'WORK';
    setShifts({ ...shifts, [staff]: shifts[staff].map((s, i) => i === dayIdx ? next : s) });
  };

  // 統計計算 (メモ化による最適化)
  const stats = useMemo(() => {
    const dailyCount = Array(DAYS_IN_MONTH).fill(0);
    const staffTotal = {};

    STAFF_MEMBERS.forEach(staff => {
      staffTotal[staff] = 0;
      shifts[staff].forEach((status, dayIdx) => {
        if (status === 'WORK') {
          dailyCount[dayIdx]++;
          staffTotal[staff]++;
        }
      });
    });

    return { dailyCount, staffTotal };
  }, [shifts]);

  // CSVダウンロード機能
  const exportCSV = () => {
    let csv = 'スタッフ名,' + Array.from({length: DAYS_IN_MONTH}, (_, i) => `${i + 1}日`).join(',') + '\n';
    STAFF_MEMBERS.forEach(staff => {
      csv += `${staff},${shifts[staff].map(s => STATUS[s].label).join(',')}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'shift_schedule.csv';
    link.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ヘッダー */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border gap-4">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2 text-indigo-700">
              <CalendarIcon /> SMART SHIFT MANAGER
            </h1>
            <p className="text-slate-500 text-sm">クリックでシフト調整・充足度と公平性を自動解析</p>
          </div>
          <button 
            onClick={exportCSV}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-200"
          >
            <Download size={18} /> CSV出力
          </button>
        </header>

        {/* 統計パネル */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
              <Users size={14}/> スタッフ数
            </h3>
            <p className="text-2xl font-black">{STAFF_MEMBERS.length} 名</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
              <AlertTriangle size={14} className="text-amber-500"/> 要注意日（不足）
            </h3>
            <p className="text-2xl font-black text-red-500">
              {stats.dailyCount.filter(count => count < MIN_STAFF_PER_DAY).length} 日
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
              <Info size={14} className="text-indigo-500"/> 設定
            </h3>
            <p className="text-sm font-medium">1日の最低必要人数: <span className="font-bold">{MIN_STAFF_PER_DAY}名</span></p>
          </div>
        </div>

        {/* シフト管理テーブル */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b">
                  <th className="p-4 text-left border-r sticky left-0 bg-slate-50 z-10 w-32">スタッフ</th>
                  {Array.from({length: DAYS_IN_MONTH}).map((_, i) => (
                    <th key={i} className={`p-2 min-w-[40px] text-center border-r ${stats.dailyCount[i] < MIN_STAFF_PER_DAY ? 'bg-red-50 text-red-600' : ''}`}>
                      {i + 1}
                    </th>
                  ))}
                  <th className="p-4 text-center bg-indigo-50 text-indigo-700 font-bold">合計</th>
                </tr>
              </thead>
              <tbody>
                {STAFF_MEMBERS.map(staff => (
                  <tr key={staff} className="border-b hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold border-r sticky left-0 bg-white z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                      {staff}
                    </td>
                    {shifts[staff].map((status, i) => (
                      <td key={i} className="p-1 border-r text-center">
                        <button
                          onClick={() => toggleShift(staff, i)}
                          className={`w-8 h-8 rounded-md text-[10px] font-bold transition-all transform active:scale-90 ${STATUS[status].color}`}
                          title={STATUS[status].label}
                        >
                          {STATUS[status].code}
                        </button>
                      </td>
                    ))}
                    <td className="p-4 text-center font-black text-indigo-600 bg-indigo-50/30">
                      {stats.staffTotal[staff]}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold">
                  <td className="p-4 border-r sticky left-0 bg-slate-100">日計(人)</td>
                  {stats.dailyCount.map((count, i) => (
                    <td key={i} className={`p-2 text-center border-r ${count < MIN_STAFF_PER_DAY ? 'text-red-600 bg-red-100' : 'text-slate-600'}`}>
                      {count}
                    </td>
                  ))}
                  <td className="bg-slate-200"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* 公平性スコア可視化 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <CheckCircle2 className="text-emerald-500" /> 勤務公平性スコア（月間出勤日数）
          </h2>
          <div className="space-y-4">
            {STAFF_MEMBERS.map(staff => {
              const total = stats.staffTotal[staff];
              const percentage = (total / DAYS_IN_MONTH) * 100;
              return (
                <div key={staff} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-bold">{staff}</span>
                    <span className="text-slate-500">{total} 日 / {DAYS_IN_MONTH} 日</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 transition-all duration-500" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}