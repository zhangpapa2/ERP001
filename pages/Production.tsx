import React, { useState } from 'react';
import { store } from '../services/store';
import { User, ProductionSchedule } from '../types';
import { CalendarCheck, Factory, Search, Filter, CheckCircle2, Clock, CalendarDays, ArrowRightCircle } from 'lucide-react';

export const Production: React.FC<{ user: User | null }> = ({ user }) => {
  const [schedules, setSchedules] = useState<ProductionSchedule[]>(store.schedules);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PLANNED' | 'CONFIRMED' | 'COMPLETED'>('ALL');
  const [searchText, setSearchText] = useState('');
  
  const refresh = () => {
    setSchedules([...store.schedules]);
  };

  // Simplified list of instructions ready for scheduling
  const readyInstructions = store.instructions.filter(i => 
    i.status === 'MATERIAL_READY' || i.status === 'SCHEDULED'
  );

  const handleQuickSchedule = (instId: string) => {
    if (!user) return;
    // Demo: Schedule for tomorrow on Line A
    const date = new Date();
    date.setDate(date.getDate() + 1);
    const dateStr = date.toISOString().split('T')[0];
    
    // Default quantity 100 for demo
    store.createSchedule('Line A', instId, dateStr, 100, user.username);
    refresh();
  };

  const handleUpdateStatus = (id: string, newStatus: 'CONFIRMED' | 'COMPLETED') => {
    const s = store.schedules.find(item => item.id === id);
    if (s) {
      s.status = newStatus;
      if(user) store.log(user.username, 'UPDATE_SCHEDULE', `Updated schedule ${id} to ${newStatus}`);
      refresh();
    }
  };

  const filteredSchedules = schedules.filter(s => {
    // Status Filter
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
    
    // Text Search (Instruction No or Line)
    const inst = store.instructions.find(i => i.id === s.instructionId);
    const searchLower = searchText.toLowerCase();
    const matchInst = inst?.instructionNo.toLowerCase().includes(searchLower);
    const matchLine = s.lineId.toLowerCase().includes(searchLower);
    
    return !searchText || matchInst || matchLine;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNED': return 'bg-blue-100 text-blue-700';
      case 'CONFIRMED': return 'bg-purple-100 text-purple-700';
      case 'COMPLETED': return 'bg-green-100 text-green-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PLANNED': return '计划中';
      case 'CONFIRMED': return '已确认';
      case 'COMPLETED': return '已完成';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
       <div>
          <h1 className="text-2xl font-bold text-slate-900">生产排产</h1>
          <p className="text-slate-500">安排生产线计划与追踪产出</p>
        </div>

        {/* Top Section: Overview & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ready to Schedule */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-indigo-600" />
              待排产指令 (物料已齐套)
            </h3>
            {readyInstructions.length === 0 ? (
              <p className="text-slate-400 text-sm py-4 text-center border-2 border-dashed border-slate-100 rounded-lg">
                暂无物料齐套的待排产指令。请先在库存模块进行入库与分配。
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2">
                {readyInstructions.map(inst => {
                  const order = store.orders.find(o => o.id === inst.orderId);
                  const model = store.models.find(m => m.id === order?.modelId);
                  const isAlreadyScheduled = schedules.some(s => s.instructionId === inst.id && s.status !== 'COMPLETED');

                  return (
                    <div key={inst.id} className="p-3 border rounded-lg bg-slate-50 hover:bg-white hover:shadow-sm transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-bold text-slate-700 flex items-center gap-2">
                            {inst.instructionNo}
                            {isAlreadyScheduled && <span className="text-[10px] bg-blue-100 text-blue-600 px-1 rounded">已排</span>}
                          </div>
                          <div className="text-xs text-slate-500">{model?.code} | {inst.lotNo}</div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                         <span className="text-xs text-slate-400">优先级: {inst.priority}</span>
                         <button 
                           onClick={() => handleQuickSchedule(inst.id)}
                           className="px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 flex items-center gap-1"
                         >
                           <CalendarDays className="w-3 h-3" />
                           快速排产
                         </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Line Status */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Factory className="w-5 h-5 text-green-600" />
              生产线实时状态
            </h3>
            <div className="space-y-4">
              {['Line A', 'Line B', 'Line C'].map(line => (
                <div key={line} className="flex items-center gap-4 p-3 border border-slate-100 rounded-lg bg-slate-50/50">
                  <div className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center font-bold text-slate-500 text-sm shadow-sm">
                    {line.split(' ')[1]}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900 text-sm">{line}</h4>
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                      运行正常
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Schedule View */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
           <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
             <h2 className="font-bold text-slate-800 flex items-center gap-2">
               <Clock className="w-5 h-5 text-slate-500" />
               详细生产计划表
             </h2>
             
             <div className="flex flex-col sm:flex-row gap-3">
               <div className="relative">
                 <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                 <input 
                   placeholder="搜索指令号或产线..."
                   className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-64"
                   value={searchText}
                   onChange={e => setSearchText(e.target.value)}
                 />
               </div>
               
               <div className="flex bg-slate-100 p-1 rounded-lg">
                 {(['ALL', 'PLANNED', 'CONFIRMED', 'COMPLETED'] as const).map(status => (
                   <button
                     key={status}
                     onClick={() => setStatusFilter(status)}
                     className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                       statusFilter === status 
                         ? 'bg-white text-slate-900 shadow-sm' 
                         : 'text-slate-500 hover:text-slate-700'
                     }`}
                   >
                     {status === 'ALL' ? '全部' : getStatusLabel(status)}
                   </button>
                 ))}
               </div>
             </div>
           </div>

           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
               <thead>
                 <tr className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                   <th className="px-6 py-3">排产日期</th>
                   <th className="px-6 py-3">生产线</th>
                   <th className="px-6 py-3">指令信息</th>
                   <th className="px-6 py-3 text-right">计划数量</th>
                   <th className="px-6 py-3">状态</th>
                   <th className="px-6 py-3 text-right">操作</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {filteredSchedules.length === 0 ? (
                   <tr>
                     <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                       没有找到符合条件的生产计划。
                     </td>
                   </tr>
                 ) : (
                   filteredSchedules.map(schedule => {
                     const inst = store.instructions.find(i => i.id === schedule.instructionId);
                     const order = store.orders.find(o => o.id === inst?.orderId);
                     const model = store.models.find(m => m.id === order?.modelId);
                     
                     return (
                       <tr key={schedule.id} className="hover:bg-slate-50">
                         <td className="px-6 py-4 font-mono text-slate-600">
                           {schedule.date}
                         </td>
                         <td className="px-6 py-4">
                           <span className="font-medium text-slate-800">{schedule.lineId}</span>
                         </td>
                         <td className="px-6 py-4">
                           <div className="font-medium text-blue-600">{inst?.instructionNo}</div>
                           <div className="text-xs text-slate-500">{model?.code} - {inst?.lotNo}</div>
                         </td>
                         <td className="px-6 py-4 text-right font-medium text-slate-700">
                           {schedule.quantity}
                         </td>
                         <td className="px-6 py-4">
                           <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(schedule.status)}`}>
                             {getStatusLabel(schedule.status)}
                           </span>
                         </td>
                         <td className="px-6 py-4 text-right">
                           <div className="flex items-center justify-end gap-2">
                             {schedule.status === 'PLANNED' && (
                               <button 
                                 onClick={() => handleUpdateStatus(schedule.id, 'CONFIRMED')}
                                 className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded border border-purple-200 hover:bg-purple-100 flex items-center gap-1"
                               >
                                 <CheckCircle2 className="w-3 h-3" />
                                 确认
                               </button>
                             )}
                             {schedule.status === 'CONFIRMED' && (
                               <button 
                                 onClick={() => handleUpdateStatus(schedule.id, 'COMPLETED')}
                                 className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded border border-green-200 hover:bg-green-100 flex items-center gap-1"
                               >
                                 <ArrowRightCircle className="w-3 h-3" />
                                 完工
                               </button>
                             )}
                             {schedule.status === 'COMPLETED' && (
                               <span className="text-xs text-slate-400">已归档</span>
                             )}
                           </div>
                         </td>
                       </tr>
                     );
                   })
                 )}
               </tbody>
             </table>
           </div>
        </div>
    </div>
  );
};