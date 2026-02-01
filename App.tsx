import React, { useState, useMemo, useEffect } from 'react';
import { Users, AlertTriangle, Download, CheckCircle2, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Edit2, Save, Trash2 } from 'lucide-react';

// --- ヘルパー関数 ---
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const formatYM = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export default function AdvancedShiftManager() {
  // --- 状態管理 ---
  const [currentDate, setCurrentDate] = useState(new Date()); // 表示中の月
  const [staffList, setStaffList] = useState(() => {
    const saved = localStorage.getItem('shift_staff_list');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: '田中' }, { id: '2', name: '佐藤' }, { id: '3', name: '鈴木' }
    ];
  });
  
  const [allShifts, setAllShifts] = useState(() => {
    const saved = localStorage.getItem('shift_data_v2');
    return saved ? JSON.parse(saved) : {};
  });

  const [editingStaffId, setEditingStaffId] = useState(null);
  const [tempStaffName, setTempStaffName] = useState("");

  // データ保存（LocalStorage: ブラウザに1年分以上の保存が可能）
  useEffect(() => {
    localStorage.setItem('shift_staff_list', JSON.stringify(staffList));
    localStorage.setItem('shift_data_v2', JSON.stringify(allShifts));
  }, [staffList, allShifts]);

  // --- 定数 ---
  const ymKey = formatYM(currentDate);
  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const minStaffPerDay = 3;

  // --- ロジック ---
  const currentMonthShifts = useMemo(() => {
    const monthData = allShifts[ymKey] || {};
    // 新規月の場合、全スタッフを「出勤(WORK)」で初期化
    staffList.forEach(staff => {
      if (!monthData[staff.id]) {
        monthData[staff.id] = Array(daysInMonth).fill('WORK');
      }
    });
    return monthData;
  }, [allShifts, ymKey, staffList, daysInMonth]);

  const toggleShift = (staffId, dayIdx) => {
    const monthData = { ...currentMonthShifts };
    const currentStatus = monthData[staffId][dayIdx];
    const nextStatus = currentStatus === 'WORK' ? 'OFF' : currentStatus === 'OFF' ? 'REQUEST' : 'WORK';
    
    monthData[staffId] = [...monthData[staffId]];
    monthData[staffId][dayIdx] = nextStatus;

    setAllShifts({ ...allShifts, [ymKey]: monthData });
  };

  const changeMonth = (offset) => {
    const next = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 2); // 翌々月まで作成可能
    
    if (offset > 0 && next > maxDate) {
      alert("シフト作成は翌々月まで可能です。");
      return;
    }
    setCurrentDate(next);
  };

  // スタッフ編集
  const startEdit = (staff) => {
    setEditingStaffId(staff.id);
    setTempStaffName(staff.name);
  };

  const saveStaffName = () => {
    setStaffList(staffList.map(s => s.id === editingStaffId ? { ...s, name: tempStaffName } : s));
    setEditingStaffId(null);
  };

  const addStaff = () => {
    const newId = Date.now().toString();
    setStaffList([...staffList, { id: newId, name: `新規スタッフ` }]);
  };

  const removeStaff = (id) => {
    if(confirm("このスタッフを削除しますか？過去のデータも表示されなくなります。")) {
      setStaffList(staffList.filter(s => s.id !== id));
    }
  };

  // 統計計算
  const stats = useMemo(() => {
    const dailyCount = Array(daysInMonth).fill(0);
    const staffTotal = {};
    staffList.forEach(staff => {
      staffTotal[staff.id] = 0;
      (currentMonthShifts[staff.id] || []).forEach((status, i) => {
        if (status === 'WORK') { dailyCount[i]++; staffTotal[staff.id]++; }
      });
    });
    return { dailyCount, staffTotal };
  }, [currentMonthShifts, staffList, daysInMonth]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ヘッダー & 月選択 */}
        <header className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-sm border gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ChevronLeft /></button>
            <h1 className="text-2xl font-black text-indigo-700">{currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月</h1>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ChevronRight /></button>
          </div>
          <div className="flex gap-2">
            <button onClick={addStaff} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-500 shadow-md transition-all">
              スタッフ追加
            </button>
          </div>
        </header>

        {/* メインテーブル */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b">
                  <th className="p-4 text-left border-r sticky left-0 bg-slate-50 z-10 w-48">スタッフ名</th>
                  {Array.from({length: daysInMonth}).map((_, i) => (
                    <th key={i} className={`p-2 min-w-[40px] text-center border-r ${stats.dailyCount[i] < minStaffPerDay ? 'bg-red-50 text-red-600' : ''}`}>
                      {i + 1}
                    </th>
                  ))}
                  <th className="p-4 text-center bg-indigo-50 text-indigo-700 font-bold">合計</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map(staff => (
                  <tr key={staff.id} className="border-b hover:bg-slate-50">
                    <td className="p-3 border-r sticky left-0 bg-white z-10 flex items-center justify-between gap-2 group shadow-[2px_0_5px_rgba(0,0,0,0.01)]">
                      {editingStaffId === staff.id ? (
                        <div className="flex items-center gap-1">
                          <input 
                            value={tempStaffName} 
                            onChange={(e) => setTempStaffName(e.target.value)}
                            className="w-24 border rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          <button onClick={saveStaffName} className="text-emerald-600"><Save size={16}/></button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <span className="font-bold">{staff.name}</span>
                          <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                            <button onClick={() => startEdit(staff)} className="text-slate-400 hover:text-indigo-600"><Edit2 size={14}/></button>
                            <button onClick={() => removeStaff(staff.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
                          </div>
                        </div>
                      )}
                    </td>
                    {(currentMonthShifts[staff.id] || []).map((status, i) => (
                      <td key={i} className="p-1 border-r text-center">
                        <button
                          onClick={() => toggleShift(staff.id, i)}
                          className={`w-8 h-8 rounded-md text-[10px] font-bold transition-all ${
                            status === 'WORK' ? 'bg-blue-500 text-white' : status === 'OFF' ? 'bg-gray-100 text-gray-400' : 'bg-red-100 text-red-600'
                          }`}
                        >
                          {status === 'WORK' ? '出' : status === 'OFF' ? 'ー' : '希'}
                        </button>
                      </td>
                    ))}
                    <td className="p-4 text-center font-black text-indigo-600 bg-indigo-50/30">
                      {stats.staffTotal[staff.id]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-4 bg-indigo-50 rounded-xl text-xs text-indigo-700 flex items-start gap-2">
          <div className="mt-0.5 font-bold">[保存について]</div>
          <p>データはブラウザ（LocalStorage）に自動保存されます。1年分以上のデータを保持可能です。翌々月までのシフトを事前に計画できます。</p>
        </div>
      </div>
    </div>
  );
}