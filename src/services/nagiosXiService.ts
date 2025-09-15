// Service to interact with Nagios XI API
export interface HostStatus {
  host_name: string;
  current_state: number; // 0=UP, 1=DOWN, 2=UNREACHABLE
  plugin_output: string;
  last_check: string;
}

export interface ServiceStatus {
  host_name: string;
  service_description: string;
  current_state: number; // 0=OK, 1=WARNING, 2=CRITICAL, 3=UNKNOWN
  plugin_output: string;
  last_check: string;
}

export interface SystemInfo {
  product: string;
  version: string;
  license: string;
  hosts_total: number;
  services_total: number;
}

export class NagiosXIService {
  static async authenticate(instance: any, username: string, password: string): Promise<boolean> {
    try {
      // This would be the actual authentication endpoint for Nagios XI
      const response = await fetch(`${instance.url}/nagiosxi/api/v1/system/status`, {
        headers: {
          'Authorization': 'Basic ' + btoa(username + ':' + password)
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error('Authentication failed:', error);
      return false;
    }
  }

  static async getSystemInfo(instance: any): Promise<SystemInfo> {
    try {
      // This would be the actual API endpoint for system info
      const response = await fetch(`${instance.url}/nagiosxi/api/v1/system/info`, {
        headers: {
          'Authorization': 'Basic ' + btoa(instance.username + ':' + instance.password)
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch system info');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get system info:', error);
      throw error;
    }
  }

  static async getHostStatus(instance: any): Promise<HostStatus[]> {
    try {
      // This would be the actual API endpoint for host status
      const response = await fetch(`${instance.url}/nagiosxi/api/v1/objects/hoststatus`, {
        headers: {
          'Authorization': 'Basic ' + btoa(instance.username + ':' + instance.password)
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch host status');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get host status:', error);
      throw error;
    }
  }

  static async getServiceStatus(instance: any): Promise<ServiceStatus[]> {
    try {
      // This would be the actual API endpoint for service status
      const response = await fetch(`${instance.url}/nagiosxi/api/v1/objects/servicestatus`, {
        headers: {
          'Authorization': 'Basic ' + btoa(instance.username + ':' + instance.password)
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch service status');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get service status:', error);
      throw error;
    }
  }
}