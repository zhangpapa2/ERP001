import React, { useEffect, useState } from 'react';
import { store } from '../services/store';
import { DashboardViewData } from '../types';
import { ChevronDown, ChevronRight, Package, Truck, Layers, CheckCircle } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'COMPLETED'>('ACTIVE');
  const [data, setData] = useState<DashboardViewData[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = () => setData(store.getDashboardData(activeTab));
    load();
    const interval = setInterval(load, 2000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const toggleExpand = (key: string) => {
    const newSet = new Set(expandedKeys);
    if (newSet.has(key)) newSet.delete(key);
    else newSet.add(key);
    setExpandedKeys(newSet);
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      'PENDING': '待处理',
      'MATERIAL_READY': '物料齐套',
      'SCHEDULED': '已排产',
      'PRODUCTION': '生产中',
      'PARTIAL_SHIPPED': '部分出货',
      'SHIPPED': '已出货'
    };
    return map[status] || status;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">生产进度看板</h1>
          <p className="text-slate-500">实时追踪订单状态与生产进度</p>
        </div>
        <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'ACTIVE' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            进行中
          </button>
          <button
            onClick={() => setActiveTab('COMPLETED')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            已完结
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {data.length === 0 && (
           <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
             <Layers className="w-12 h-12 text-slate-300 mx-auto mb-4" />
             <p className="text-slate-500">暂无{activeTab === 'ACTIVE' ? '进行中' : '已完结'}订单</p>
           </div>
        )}

        {data.map((group) => {
          const groupKey = `${group.model.id}-${group.colorway.id}`;
          const isExpanded = expandedKeys.has(groupKey);

          return (
            <div key={groupKey} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Header Card */}
              <div 
                className="p-5 flex flex-col md:flex-row md:items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => toggleExpand(groupKey)}
              >
                <div className="flex items-center gap-3 min-w-[200px]">
                  {isExpanded ? <ChevronDown className="text-slate-400" /> : <ChevronRight className="text-slate-400" />}
                  <div>
                    <h3 className="font-bold text-slate-900">{group.model.code}</h3>
                    <p className="text-sm text-slate-500">{group.colorway.name}</p>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">总双数</p>
                      <p className="font-semibold text-slate-900">{group.totalPairs.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">订单数</p>
                      <p className="font-semibold text-slate-900">{group.totalOrders}</p>
                    </div>
                  </div>
                  <div className="col-span-2 md:col-span-2">
                     <p className="text-xs text-slate-500 mb-1 flex justify-between">
                        <span>总进度</span>
                        <span>{Math.round(group.progress)}%</span>
                     </p>
                     <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                          style={{width: `${group.progress}%`}}
                        />
                     </div>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-3">
                  {group.instructions.map(inst => (
                    <div key={inst.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3">
                           <span className="font-mono bg-slate-100 px-2 py-1 rounded text-slate-700 font-medium">
                             {inst.instructionNo}
                           </span>
                           <span className="text-sm text-slate-500">货号: {inst.lotNo}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs font-bold rounded uppercase ${
                            inst.status === 'SHIPPED' ? 'bg-green-100 text-green-700' : 
                            inst.status === 'MATERIAL_READY' ? 'bg-indigo-100 text-indigo-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {getStatusLabel(inst.status)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div>
                           <div className="flex justify-between text-xs mb-1">
                             <span className="text-slate-500">物料齐套率</span>
                             <span className="font-medium text-slate-700">{Math.round(inst.materialReady)}%</span>
                           </div>
                           <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500" style={{width: `${inst.materialReady}%`}} />
                           </div>
                        </div>
                        <div>
                           <div className="flex justify-between text-xs mb-1">
                             <span className="text-slate-500">出货进度</span>
                             <span className="font-medium text-slate-700">{Math.round(inst.shipped)}%</span>
                           </div>
                           <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500" style={{width: `${inst.shipped}%`}} />
                           </div>
                        </div>
                      </div>

                      {/* Size Breakdown Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead>
                            <tr className="text-xs text-slate-500 border-b border-slate-100">
                              <th className="pb-2 font-normal">尺码</th>
                              <th className="pb-2 font-normal">需求数量</th>
                              <th className="pb-2 font-normal">齐套数</th>
                              <th className="pb-2 font-normal">已出货</th>
                            </tr>
                          </thead>
                          <tbody>
                            {inst.details.map(size => {
                              // Calc simplified sets ready
                              const minParts = Object.values(size.allocatedParts).length > 0 
                                ? Math.min(...(Object.values(size.allocatedParts) as number[])) 
                                : 0;
                              
                              return (
                                <tr key={size.id} className="border-b border-slate-50 last:border-0">
                                  <td className="py-2 font-medium text-slate-700">{size.size}</td>
                                  <td className="py-2 text-slate-600">{size.quantity}</td>
                                  <td className="py-2 text-indigo-600 font-medium">{minParts}</td>
                                  <td className="py-2 text-green-600">{size.shippedPairs}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};