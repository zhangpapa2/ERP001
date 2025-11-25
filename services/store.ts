import { 
  User, Role, Model, Colorway, Part, Order, OrderInstruction, 
  InstructionSize, StockItem, LogEntry, DashboardViewData, StockEntry, ProductionSchedule 
} from '../types';

// --- Seed Data ---
const SEED_USERS: User[] = [
  { id: 'u1', username: 'admin', name: '系统管理员', role: Role.ADMIN },
  { id: 'u2', username: 'planner', name: '生产排产员', role: Role.PLANNER },
  { id: 'u3', username: 'wh', name: '仓库主管', role: Role.WAREHOUSE },
  { id: 'u4', username: 'sales', name: '销售代表', role: Role.SALES },
];

const SEED_MODELS: Model[] = [
  { id: 'm1', code: 'ATM-C26227', description: '2025款专业跑鞋' },
  { id: 'm2', code: 'AW-L24302D', description: '休闲健步鞋 Lite' },
];

const SEED_COLORWAYS: Colorway[] = [
  { id: 'c1', modelId: 'm1', code: 'BLK/GLD', name: '黑/金' },
  { id: 'c2', modelId: 'm1', code: 'WHT/RED', name: '白/红' },
  { id: 'c3', modelId: 'm2', code: 'GRY/GRY', name: '全灰' },
];

const SEED_PARTS: Part[] = [
  { id: 'p1', code: 'IP', name: '射出中底 (IP)' },
  { id: 'p2', code: 'TPU', name: 'TPU 支撑片' },
  { id: 'p3', code: 'RB', name: '橡胶大底' },
  { id: 'p4', code: 'UPPER', name: '成品鞋面' },
];

class MockStore {
  users: User[] = SEED_USERS;
  models: Model[] = SEED_MODELS;
  colorways: Colorway[] = SEED_COLORWAYS;
  parts: Part[] = SEED_PARTS;
  orders: Order[] = [];
  instructions: OrderInstruction[] = [];
  instructionSizes: InstructionSize[] = [];
  stockItems: StockItem[] = []; // Represents FREE stock
  stockEntries: StockEntry[] = [];
  schedules: ProductionSchedule[] = [];
  logs: LogEntry[] = [];

  constructor() {
    this.load();
    if (this.orders.length === 0) this.seedDemoData();
  }

  private load() {
    const data = localStorage.getItem('seno_erp_db_v2');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        Object.assign(this, parsed);
      } catch (e) {
        console.error("Failed to load DB", e);
      }
    }
  }

  private save() {
    localStorage.setItem('seno_erp_db_v2', JSON.stringify(this));
  }

  log(username: string, action: string, details: string) {
    this.logs.unshift({
      id: Math.random().toString(36),
      timestamp: new Date().toISOString(),
      user: username,
      action,
      details
    });
    this.save();
  }

  private seedDemoData() {
    const user = 'system';
    const oId = 'ord-1';
    
    // Create Order
    this.orders.push({
      id: oId,
      orderNo: 'BZ2509300073',
      customer: 'Seno Sports Int.',
      modelId: 'm1',
      colorwayId: 'c1',
      dueDate: new Date(Date.now() + 86400000 * 14).toISOString(),
      status: 'IN_PROGRESS',
      totalPairs: 1200
    });

    // Create Instruction
    const instId = 'inst-1';
    this.instructions.push({
      id: instId,
      orderId: oId,
      instructionNo: 'AB17930',
      lotNo: '112627713-1',
      priority: 1,
      status: 'PENDING'
    });

    // Create Sizes
    ['7', '8', '9', '10', '11'].forEach((size, idx) => {
      this.instructionSizes.push({
        id: `is-${instId}-${size}`,
        instructionId: instId,
        size: size,
        quantity: 240, // 1200 total / 5 sizes
        allocatedParts: {}, 
        scheduledPairs: 0,
        producedPairs: 0,
        shippedPairs: 0
      });
    });

    this.log(user, 'INIT', 'System initialized with seed data');
    this.save();
  }

  // --- BUSINESS LOGIC ---

  // 1. Stock In with Auto-Allocation
  stockIn(
    modelId: string, 
    colorwayId: string, 
    partId: string, 
    items: { size: string, qty: number }[], 
    batchNo: string,
    user: string
  ) {
    const timestamp = new Date().toISOString();

    items.forEach(({ size, qty }) => {
      let remainingQty = qty;

      // Log the incoming Stock
      this.stockEntries.push({
        id: Math.random().toString(36),
        timestamp,
        type: 'IN',
        modelId, colorwayId, partId, size, quantity: qty,
        batchNo, user
      });

      // Find relevant instructions to allocate to
      // 1. Find Orders for this Model/Color
      const orderIds = this.orders
        .filter(o => o.modelId === modelId && o.colorwayId === colorwayId && o.status !== 'COMPLETED')
        .map(o => o.id);

      // 2. Find Instructions for these orders, sorted by priority/date
      const targetInstructions = this.instructions
        .filter(i => orderIds.includes(i.orderId) && i.status !== 'SHIPPED')
        .sort((a, b) => a.priority - b.priority);

      // 3. Allocate greedily
      for (const inst of targetInstructions) {
        if (remainingQty <= 0) break;

        const sizeRec = this.instructionSizes.find(s => s.instructionId === inst.id && s.size === size);
        if (sizeRec) {
          const currentAllocated = sizeRec.allocatedParts[partId] || 0;
          const needed = sizeRec.quantity - currentAllocated;

          if (needed > 0) {
            const toAlloc = Math.min(remainingQty, needed);
            
            // Update allocation
            sizeRec.allocatedParts = {
              ...sizeRec.allocatedParts,
              [partId]: currentAllocated + toAlloc
            };
            
            remainingQty -= toAlloc;

            // Log allocation
            this.stockEntries.push({
              id: Math.random().toString(36),
              timestamp,
              type: 'ALLOCATE',
              modelId, colorwayId, partId, size, quantity: toAlloc,
              referenceId: inst.instructionNo,
              user
            });

            // Update Instruction Status if needed
            // (Simple check: if some parts allocated, it's in progress)
            if (inst.status === 'PENDING') inst.status = 'MATERIAL_READY';
          }
        }
      }

      // 4. If any remaining, add to Free Stock
      if (remainingQty > 0) {
        const stockItem = this.stockItems.find(
          s => s.modelId === modelId && s.colorwayId === colorwayId && s.partId === partId && s.size === size
        );

        if (stockItem) {
          stockItem.quantity += remainingQty;
        } else {
          this.stockItems.push({
            id: Math.random().toString(36),
            modelId, colorwayId, partId, size, quantity: remainingQty
          });
        }
      }
    });

    this.save();
  }

  // 2. Dashboard Data Aggregation
  getDashboardData(statusFilter: 'ACTIVE' | 'COMPLETED' = 'ACTIVE'): DashboardViewData[] {
    const map = new Map<string, DashboardViewData>();

    // Filter orders
    const relevantOrders = this.orders.filter(o => {
      if (statusFilter === 'ACTIVE') return o.status !== 'COMPLETED';
      return o.status === 'COMPLETED';
    });

    relevantOrders.forEach(order => {
      const model = this.models.find(m => m.id === order.modelId);
      const color = this.colorways.find(c => c.id === order.colorwayId);
      if (!model || !color) return;

      const key = `${model.id}-${color.id}`;
      if (!map.has(key)) {
        map.set(key, {
          model,
          colorway: color,
          totalOrders: 0,
          totalPairs: 0,
          progress: 0,
          instructions: []
        });
      }

      const entry = map.get(key)!;
      entry.totalOrders++;
      entry.totalPairs += order.totalPairs;

      const insts = this.instructions.filter(i => i.orderId === order.id);
      
      insts.forEach(inst => {
        const sizes = this.instructionSizes.filter(s => s.instructionId === inst.id);
        
        // Calculate "Material Readiness" -> Min % of all parts
        // For each size, calculate how many "sets" are ready
        let totalSetsReady = 0;
        let totalShipped = 0;
        const totalQty = sizes.reduce((sum, s) => sum + s.quantity, 0);

        sizes.forEach(s => {
          // A set is ready if we have 1 of each required part.
          // For simplicity, we assume ALL parts in SEED_PARTS are required for the model.
          // In a real app, Model -> requiredParts relation exists.
          const requiredPartIds = this.parts.map(p => p.id);
          const availableSets = requiredPartIds.reduce((min, pId) => {
            return Math.min(min, s.allocatedParts[pId] || 0);
          }, Number.MAX_SAFE_INTEGER);
          
          totalSetsReady += (availableSets === Number.MAX_SAFE_INTEGER ? 0 : availableSets);
          totalShipped += s.shippedPairs;
        });

        entry.instructions.push({
          id: inst.id,
          instructionNo: inst.instructionNo,
          lotNo: inst.lotNo,
          status: inst.status,
          totalPairs: totalQty,
          materialReady: totalQty > 0 ? (totalSetsReady / totalQty) * 100 : 0,
          shipped: totalQty > 0 ? (totalShipped / totalQty) * 100 : 0,
          details: sizes
        });
      });
    });

    const result = Array.from(map.values());
    
    // Aggregate overall progress based on Shipped for now
    result.forEach(r => {
      const totalShipped = r.instructions.reduce((acc, i) => acc + (i.shipped / 100 * i.totalPairs), 0);
      r.progress = r.totalPairs > 0 ? (totalShipped / r.totalPairs) * 100 : 0;
    });

    return result;
  }

  // 3. Import Order from "Excel" (Tab separated string)
  importOrderFromText(text: string, user: string): { success: number, fail: number } {
    // Expected Format: Instruction | Lot | Customer | ModelCode | ColorCode | Date | SizeBreakdown...
    // This is a simplified parser.
    // We assume the user pastes rows.
    
    const lines = text.trim().split('\n');
    let success = 0;
    
    // Simple heuristic: Try to find Model/Color first
    // In a real app, we'd use a wizard. Here we just try to parse a specific format or default.
    // Format: OrderNo [tab] ModelCode [tab] ColorCode [tab] InstNo [tab] Size7 [tab] Size8 ...
    
    lines.forEach(line => {
      const cols = line.split('\t');
      if (cols.length < 4) return;

      const [orderNo, modelCode, colorCode, instNo, ...sizes] = cols;

      // Find IDs
      const model = this.models.find(m => m.code === modelCode) || this.models[0];
      const color = this.colorways.find(c => c.code === colorCode) || this.colorways[0];

      // Create Order if not exists
      let order = this.orders.find(o => o.orderNo === orderNo);
      if (!order) {
        order = {
          id: Math.random().toString(36),
          orderNo: orderNo,
          customer: 'Imported',
          modelId: model.id,
          colorwayId: color.id,
          dueDate: new Date().toISOString(),
          status: 'IN_PROGRESS',
          totalPairs: 0
        };
        this.orders.push(order);
      }

      // Create Instruction
      const instId = Math.random().toString(36);
      this.instructions.push({
        id: instId,
        orderId: order.id,
        instructionNo: instNo,
        lotNo: 'L-' + instNo,
        priority: 2,
        status: 'PENDING'
      });

      // Mock Sizes parsing (assuming columns 4,5,6,7 correspond to 7,8,9,10)
      const sizeKeys = ['7', '8', '9', '10', '11'];
      let lineTotal = 0;
      sizeKeys.forEach((key, idx) => {
        const qty = parseInt(sizes[idx] || '0');
        if (qty > 0) {
          this.instructionSizes.push({
            id: Math.random().toString(36),
            instructionId: instId,
            size: key,
            quantity: qty,
            allocatedParts: {},
            scheduledPairs: 0,
            producedPairs: 0,
            shippedPairs: 0
          });
          lineTotal += qty;
        }
      });
      
      order.totalPairs += lineTotal;
      success++;
    });

    this.save();
    return { success, fail: lines.length - success };
  }

  // 4. Create Order manually
  createOrder(
    orderData: { customer: string, orderNo: string, modelId: string, colorwayId: string, dueDate: string },
    insts: { no: string, lot: string, sizes: { size: string, qty: number }[] }[],
    user: string
  ) {
    const oId = Math.random().toString(36);
    let totalPairs = 0;

    insts.forEach(i => {
      const instId = Math.random().toString(36);
      this.instructions.push({
        id: instId,
        orderId: oId,
        instructionNo: i.no,
        lotNo: i.lot,
        priority: 2,
        status: 'PENDING'
      });
      
      let instTotal = 0;
      i.sizes.forEach(s => {
        this.instructionSizes.push({
          id: Math.random().toString(36),
          instructionId: instId,
          size: s.size,
          quantity: s.qty,
          allocatedParts: {},
          scheduledPairs: 0,
          producedPairs: 0,
          shippedPairs: 0
        });
        instTotal += s.qty;
      });
      totalPairs += instTotal;
    });

    this.orders.push({
      id: oId,
      orderNo: orderData.orderNo,
      customer: orderData.customer,
      modelId: orderData.modelId,
      colorwayId: orderData.colorwayId,
      dueDate: orderData.dueDate,
      status: 'IN_PROGRESS',
      totalPairs: totalPairs
    });

    this.log(user, 'CREATE', `Created Order ${orderData.orderNo}`);
    this.save();
  }

  // 5. Production Scheduling
  createSchedule(lineId: string, instructionId: string, date: string, qty: number, user: string) {
    this.schedules.push({
      id: Math.random().toString(36),
      lineId, instructionId, date, quantity: qty, status: 'PLANNED'
    });
    
    const inst = this.instructions.find(i => i.id === instructionId);
    if (inst) inst.status = 'SCHEDULED';
    
    this.log(user, 'SCHEDULE', `Scheduled ${qty} pairs for ${inst?.instructionNo} on ${lineId}`);
    this.save();
  }

  getFreeStock(): StockItem[] {
    return this.stockItems.filter(i => i.quantity > 0);
  }
}

export const store = new MockStore();