// Service to interact with Nagios Log Server API
export interface LogServerStatusI {
  totalLogs: number;
  criticalAlerts: number;
  storageUsed: number;
  storageTotal: number;
  logSources: number;
  ingestionRate: number;
  recentAlerts: { message: string; level: string; timestamp: string }[];
  topSearches: { query: string; count: number }[];
}

export interface LogSourceI {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'error';
  logCount: number;
  lastUpdated: string;
}

export class NagiosLogServerService {
  static async authenticate(instance: any): Promise<boolean> {
    try {
      const response = await fetch(`${instance.url}/logserver/api/v1/system/status`, {
        headers: {
          'Authorization': `Bearer ${instance.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      return response.ok;
    } catch (error) {
      console.error('Log Server Authentication failed:', error);
      return false;
    }
  }

  static async getLogServerStatus(instance: any): Promise<LogServerStatusI> {
    try {
      const response = await fetch(`${instance.url}/logserver/api/v1/status`, {
        headers: {
          'Authorization': `Bearer ${instance.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch Log Server status');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching Log Server status:', error);
      // Return mock data for demonstration
      return {
        totalLogs: 1250000,
        criticalAlerts: 23,
        storageUsed: 45,
        storageTotal: 100,
        logSources: 8,
        ingestionRate: 1250,
        recentAlerts: [
          { message: 'High error rate detected on web-server-01', level: 'critical', timestamp: '2024-01-15T10:30:00Z' },
          { message: 'Failed login attempts from suspicious IP', level: 'warning', timestamp: '2024-01-15T10:25:00Z' },
          { message: 'Database connection pool exhausted', level: 'critical', timestamp: '2024-01-15T10:15:00Z' }
        ],
        topSearches: [
          { query: 'error OR failed', count: 245 },
          { query: 'status:500', count: 167 },
          { query: 'login failed', count: 89 }
        ]
      };
    }
  }

  static async getLogSources(instance: any): Promise<LogSourceI[]> {
    try {
      const response = await fetch(`${instance.url}/logserver/api/v1/sources`, {
        headers: {
          'Authorization': `Bearer ${instance.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch log sources');
      }
      
      const data = await response.json();
      return data.sources;
    } catch (error) {
      console.error('Error fetching log sources:', error);
      // Return mock data
      return [
        { id: '1', name: 'web-server-01', type: 'syslog', status: 'active', logCount: 450000, lastUpdated: '2024-01-15T10:30:00Z' },
        { id: '2', name: 'database-01', type: 'file', status: 'active', logCount: 320000, lastUpdated: '2024-01-15T10:29:00Z' },
        { id: '3', name: 'application-01', type: 'api', status: 'active', logCount: 280000, lastUpdated: '2024-01-15T10:28:00Z' },
        { id: '4', name: 'firewall-01', type: 'syslog', status: 'inactive', logCount: 150000, lastUpdated: '2024-01-15T09:45:00Z' }
      ];
    }
  }

  static async searchLogs(instance: any, query: string, limit: number = 50): Promise<any[]> {
    try {
      const response = await fetch(`${instance.url}/logserver/api/v1/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${instance.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query, limit })
      });
      
      if (!response.ok) {
        throw new Error('Failed to search logs');
      }
      
      const data = await response.json();
      return data.results;
    } catch (error) {
      console.error('Error searching logs:', error);
      return [];
    }
  }
}