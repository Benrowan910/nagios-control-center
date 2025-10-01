export interface DashletConfig {
  id: string;
  name: string;
  type: 'xi' | 'nna' | 'ls';
  code: string;
  defaultSize: { w: number; h: number };
}

class DashletRegistry {
  private dashlets: Map<string, DashletConfig> = new Map();

  register(dashlet: DashletConfig) {
    this.dashlets.set(dashlet.id, dashlet);
    // Save to localStorage
    const saved = JSON.parse(localStorage.getItem('dashletRegistry') || '{}');
    saved[dashlet.id] = dashlet;
    localStorage.setItem('dashletRegistry', JSON.stringify(saved));
  }

  getDashlet(id: string): DashletConfig | undefined {
    // First check memory
    if (this.dashlets.has(id)) {
      return this.dashlets.get(id);
    }
    
    // Then check localStorage
    const saved = JSON.parse(localStorage.getItem('dashletRegistry') || '{}');
    return saved[id];
  }

  getDashletsByType(type: string): DashletConfig[] {
    // Check both memory and localStorage
    const memoryDashlets = Array.from(this.dashlets.values()).filter(d => d.type === type);
    const saved = JSON.parse(localStorage.getItem('dashletRegistry') || '{}');
    const savedDashlets = Object.values(saved).filter((d: any) => d.type === type);
    
    return [...memoryDashlets, ...savedDashlets] as DashletConfig[];
  }

  getAllDashlets(): DashletConfig[] {
    // Get all dashlets from both memory and localStorage
    const memoryDashlets = Array.from(this.dashlets.values());
    const saved = JSON.parse(localStorage.getItem('dashletRegistry') || '{}');
    const savedDashlets = Object.values(saved) as DashletConfig[];
    
    return [...memoryDashlets, ...savedDashlets];
  }

  deleteDashlet(id: string): boolean {
    // Remove from memory
    const memorySuccess = this.dashlets.delete(id);
    
    // Remove from localStorage
    const saved = JSON.parse(localStorage.getItem('dashletRegistry') || '{}');
    const localStorageSuccess = delete saved[id];
    localStorage.setItem('dashletRegistry', JSON.stringify(saved));
    
    return memorySuccess || localStorageSuccess;
  }

  updateDashlet(id: string, updates: Partial<DashletConfig>): DashletConfig | undefined {
    const existing = this.getDashlet(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.register(updated);
    return updated;
  }

  loadFromStorage() {
    const saved = JSON.parse(localStorage.getItem('dashletRegistry') || '{}');
    Object.entries(saved).forEach(([id, dashlet]: [string, any]) => {
      this.dashlets.set(id, dashlet);
    });
  }
}

export const dashletRegistry = new DashletRegistry();