import React, { useState } from 'react';
import { store } from '../services/store';
import { User } from '../types';
import { Plus, FileSpreadsheet, Search, Save, X } from 'lucide-react';

export const Orders: React.FC<{ user: User | null }> = ({ user }) => {
  const [orders, setOrders] = useState(store.orders);
  const [view, setView] = useState<'LIST' | 'CREATE' | 'IMPORT'>('LIST');

  // Create Form State
  const [newOrder, setNewOrder] = useState({
    customer: '',
    orderNo: '',
    modelId: store.models[0].id,
    colorwayId: store.colorways[0].id,
    dueDate: '',
  });

  // Import State
  const [importText, setImportText] = useState('');
  const [importResult, setImportResult] = useState<{success: number, fail: number} | null>(null);

  const refresh = () => setOrders([...store.orders]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // Simple creation for demo
    const dummySizes = [
      { size: '7', qty: 10 },
      { size: '8', qty: 20 },
      { size: '9', qty: 20 },
      { size: '10', qty: 10 }
    ];
    
    store.createOrder(newOrder, [{
      no: 'NEW-INST-' + Math.floor(Math.random()*1000),
      lot: 'LOT-' + Math.floor(Math.random()*1000),
      sizes: dummySizes
    }], user.username);

    setView('LIST');
    refresh();
  };

  const handleImport = () => {
    if (!user) return;
    const res = store.importOrderFromText(importText, user.username);
    setImportResult(res);
    refresh();
    setTimeout(() => {
        setView('LIST');
        setImportResult(null);
        setImportText('');
    }, 2000);
  };

  const getStatusLabel = (status: string) => {
      const map: Record<string, string> = {
          'IN_PROGRESS': '进行中',
          'COMPLETED': '已完结',
          'PLANNING': '计划中'
      };
      return map[status] || status;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">订单管理</h1>
          <p className="text-slate-500">管理客户订单与生产指令</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setView('IMPORT')}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel 导入</span>
          </button>
          <button 
            onClick={() => setView('CREATE')}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>新建订单</span>
          </button>
        </div>
      </div>

      {view === 'LIST' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">订单号</th>
                <th className="px-6 py-4">客户</th>
                <th className="px-6 py-4">型体</th>
                <th className="px-6 py-4">交期</th>
                <th className="px-6 py-4 text-right">总双数</th>
                <th className="px-6 py-4">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map(order => {
                 const model = store.models.find(m => m.id === order.modelId);
                 const color = store.colorways.find(c => c.id === order.colorwayId);
                 return (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{order.orderNo}</td>
                    <td className="px-6 py-4 text-slate-600">{order.customer}</td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="font-medium">{model?.code}</div>
                      <div className="text-xs text-slate-400">{color?.code}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(order.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-slate-700">{order.totalPairs}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}
                      `}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                  </tr>
                 );
              })}
            </tbody>
          </table>
        </div>
      )}

      {view === 'CREATE' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-900">新建订单</h2>
            <button onClick={() => setView('LIST')}><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">订单号</label>
                <input 
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newOrder.orderNo}
                  onChange={e => setNewOrder({...newOrder, orderNo: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">客户</label>
                <input 
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newOrder.customer}
                  onChange={e => setNewOrder({...newOrder, customer: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">型体</label>
                <select 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newOrder.modelId}
                  onChange={e => setNewOrder({...newOrder, modelId: e.target.value})}
                >
                  {store.models.map(m => <option key={m.id} value={m.id}>{m.code}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">配色</label>
                <select 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newOrder.colorwayId}
                  onChange={e => setNewOrder({...newOrder, colorwayId: e.target.value})}
                >
                   {store.colorways
                    .filter(c => c.modelId === newOrder.modelId)
                    .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg text-sm text-yellow-800">
               注意：此为演示表单，将自动创建包含 7/8/9/10 码的模拟指令。
            </div>

            <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
              创建订单
            </button>
          </form>
        </div>
      )}

      {view === 'IMPORT' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-900">导入订单</h2>
            <button onClick={() => setView('LIST')}><X className="w-5 h-5 text-slate-400" /></button>
          </div>

          {!importResult ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                请粘贴 Excel 数据。格式要求（Tab 分隔）：<br/>
                <code className="bg-slate-100 px-2 py-1 rounded">订单号 | 型体代码 | 配色代码 | 指令号 | 7码数量 | 8码数量...</code>
              </p>
              <textarea 
                className="w-full h-64 p-4 border border-slate-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="请在此粘贴内容..."
                value={importText}
                onChange={e => setImportText(e.target.value)}
              />
              <button 
                onClick={handleImport}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>执行导入</span>
              </button>
            </div>
          ) : (
            <div className="text-center py-12">
               <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Save className="w-8 h-8 text-green-600" />
               </div>
               <h3 className="text-xl font-bold text-slate-800">导入完成</h3>
               <p className="text-slate-600 mt-2">
                 成功导入 {importResult.success} 行。<br/>
                 失败: {importResult.fail} 行。
               </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};