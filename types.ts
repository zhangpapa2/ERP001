// Data Models based on the requirements

export enum Role {
  ADMIN = 'ADMIN',
  PLANNER = 'PLANNER',
  WAREHOUSE = 'WAREHOUSE',
  SALES = 'SALES'
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
}

export interface Model {
  id: string;
  code: string; // e.g., ATM-C26227
  description: string;
}

export interface Colorway {
  id: string;
  modelId: string;
  code: string; // e.g., Black/Gold
  name: string;
}

export interface Part {
  id: string;
  code: string; // e.g., IP, TPU, RB
  name: string;
}

// An order represents a high-level customer request
export interface Order {
  id: string;
  orderNo: string;
  customer: string;
  modelId: string;
  colorwayId: string;
  dueDate: string; // ISO Date
  status: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED';
  totalPairs: number;
}

// An instruction is a specific production batch within an order (The "Line Item")
export interface OrderInstruction {
  id: string;
  orderId: string;
  instructionNo: string; // The unique key for production
  lotNo: string;
  priority: number;
  status: 'PENDING' | 'MATERIAL_READY' | 'SCHEDULED' | 'PRODUCTION' | 'PARTIAL_SHIPPED' | 'SHIPPED';
}

// Breakdown of sizes within an instruction
export interface InstructionSize {
  id: string;
  instructionId: string;
  size: string;
  quantity: number; // Required quantity
  
  // Track how many of each part have been allocated to this specific size slot
  // Key: partId, Value: quantity
  allocatedParts: Record<string, number>; 
  
  scheduledPairs: number; // How many are scheduled for production
  producedPairs: number; // How many finished goods produced
  shippedPairs: number; // How many shipped
}

// Inventory Item (Unallocated / Free Stock)
export interface StockItem {
  id: string;
  modelId: string;
  colorwayId: string;
  partId: string;
  size: string;
  quantity: number; // Current Free Stock
  location?: string;
}

// Ledger for all stock movements
export interface StockEntry {
  id: string;
  timestamp: string;
  type: 'IN' | 'OUT' | 'ALLOCATE' | 'PRODUCE' | 'SHIP';
  modelId: string;
  colorwayId: string;
  partId?: string; // Optional if it's a finished good movement
  size: string;
  quantity: number;
  referenceId?: string; // Instruction ID or Order ID
  batchNo?: string;
  user: string;
}

// Production Schedule Plan
export interface ProductionSchedule {
  id: string;
  lineId: string; // e.g., "Line A"
  instructionId: string;
  date: string;
  quantity: number;
  status: 'PLANNED' | 'CONFIRMED' | 'COMPLETED';
}

export interface LogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

// Combined Type for Dashboard View
export interface DashboardViewData {
  model: Model;
  colorway: Colorway;
  totalOrders: number;
  totalPairs: number;
  progress: number; // %
  instructions: {
    id: string;
    instructionNo: string;
    lotNo: string;
    status: string;
    totalPairs: number;
    materialReady: number; // % of sets ready
    shipped: number;
    details: InstructionSize[];
  }[];
}