import React, { useState } from 'react';
import { store } from '../services/store';
import { User, Part } from '../types';
import { ArrowDownToLine, ArrowUpFromLine, Search, Package } from 'lucide-react';

export const Inventory: React.FC<{ user: User | null }> = ({ user }) => {
  const [view, setView] = useState<'STOCK' | 'IN' | 'OUT'>('STOCK');
  const [stockItems, setStockItems] = useState(store.getFreeStock());

  // Stock In Form
  const [inForm, setInForm] = useState({
    modelId: store.models[0].id,
    colorwayId: store.colorways[0].id,
    partId: store.parts[0].id,
    batchNo: '',
  });
  const [inSizes, setInSizes] = useState<{size: string, qty: number}[]>([{size: '7', qty: 0}]);

  const refresh = () => setStockItems(store.getFreeStock());

  const handleStockIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // Filter valid quantities
    const validItems = inSizes.filter(i => i.qty > 0);
    if (validItems.length === 0) return;

    store.stockIn(
      inForm.modelId, 
      inForm.colorwayId, 
      inForm.partId, 
      validItems, 
      inForm.batchNo || 'BATCH-'+Date.now(), 
      user.username
    );

    setView('STOCK');
    refresh();
  };

  const addSizeRow = () => {
    setInSizes([...inSizes, { size: '', qty: 0 }]);
  };

  const updateSizeRow = (idx: number, field: 'size'|'qty', val: string | number) => {
    const newSizes = [...inSizes];
    if (field === 'size') newSizes[idx].size = val as string;
    else newSizes[idx].qty = val as number;
    setInSizes(newSizes);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">库存管理</h1>
          <p className="text-slate-500">管理原材料库存及自动分配</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setView('IN')}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>入库</span>
          </button>
        </div>
      </div>

      {view === 'STOCK' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
             <h3 className="font-bold text-slate-700">公共库存 (Warehouse)</h3>
             <button onClick={refresh} className="text-sm text-blue-600 hover:underline">刷新</button>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase">
                <th className="px-6 py-3">型体</th>
                <th className="px-6 py-3">配色</th>
                <th className="px-6 py-3">部位</th>
                <th className="px-6 py-3">尺码</th>
                <th className="px-6 py-3">可用库存</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stockItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    暂无可用库存，所有物料均已分配或仓库为空。
                  </td>
                </tr>
              )}
              {stockItems.map(item => {
                const model = store.models.find(m => m.id === item.modelId);
                const color = store.colorways.find(c => c.id === item.colorwayId);
                const part = store.parts.find(p => p.id === item.partId);
                return (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-medium">{model?.code}</td>
                    <td className="px-6 py-3">{color?.name}</td>
                    <td className="px-6 py-3">
                      <span className="px-2 py-1 bg-slate-100 rounded text-xs font-mono">{part?.code}</span>
                    </td>
                    <td className="px-6 py-3 font-bold text-slate-700">{item.size}</td>
                    <td className="px-6 py-3 text-blue-600 font-bold">{item.quantity}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {view === 'IN' && (
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold mb-6 text-slate-900">入库录入</h2>
          <form onSubmit={handleStockIn} className="space-y-6">
             <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium mb-1">型体</label>
                  <select 
                    className="w-full border rounded-lg p-2"
                    value={inForm.modelId}
                    onChange={e => setInForm({...inForm, modelId: e.target.value})}
                  >
                    {store.models.map(m => <option key={m.id} value={m.id}>{m.code}</option>)}
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-medium mb-1">配色</label>
                  <select 
                    className="w-full border rounded-lg p-2"
                    value={inForm.colorwayId}
                    onChange={e => setInForm({...inForm, colorwayId: e.target.value})}
                  >
                    {store.colorways
                      .filter(c => c.modelId === inForm.modelId)
                      .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-medium mb-1">部位</label>
                  <select 
                    className="w-full border rounded-lg p-2"
                    value={inForm.partId}
                    onChange={e => setInForm({...inForm, partId: e.target.value})}
                  >
                    {store.parts.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-medium mb-1">批次号 / 供应商</label>
                  <input 
                     className="w-full border rounded-lg p-2"
                     placeholder="选填"
                     value={inForm.batchNo}
                     onChange={e => setInForm({...inForm, batchNo: e.target.value})}
                  />
               </div>
             </div>

             <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
               <h3 className="font-medium text-slate-700 mb-3">尺码与数量</h3>
               {inSizes.map((row, idx) => (
                 <div key={idx} className="flex gap-4 mb-2">
                   <input 
                      placeholder="尺码 (如 7)"
                      className="w-24 border rounded p-2"
                      value={row.size}
                      onChange={e => updateSizeRow(idx, 'size', e.target.value)}
                   />
                   <input 
                      type="number"
                      placeholder="数量"
                      className="w-32 border rounded p-2"
                      value={row.qty}
                      onChange={e => updateSizeRow(idx, 'qty', parseInt(e.target.value))}
                   />
                 </div>
               ))}
               <button type="button" onClick={addSizeRow} className="text-sm text-blue-600 hover:underline mt-2">+ 添加一行</button>
             </div>

             <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 flex gap-2">
               <Package className="w-5 h-5" />
               <p>系统将根据优先级和日期自动将这些物料分配给未满足的订单指令。</p>
             </div>

             <div className="flex gap-3">
               <button 
                type="submit" 
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700"
               >
                 确认入库
               </button>
               <button 
                type="button" 
                onClick={() => setView('STOCK')}
                className="px-6 py-2 border rounded-lg hover:bg-slate-50"
               >
                 取消
               </button>
             </div>
          </form>
        </div>
      )}
    </div>
  );
};