// utils/dashletRegistry.ts
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
    return this.dashlets.get(id);
  }

  getDashletsByType(type: string): DashletConfig[] {
    return Array.from(this.dashlets.values()).filter(d => d.type === type);
  }

  loadFromStorage() {
    const saved = JSON.parse(localStorage.getItem('dashletRegistry') || '{}');
    Object.values(saved).forEach((dashlet: any) => {
      this.dashlets.set(dashlet.id, dashlet);
    });
  }
}

export const dashletRegistry = new DashletRegistry();