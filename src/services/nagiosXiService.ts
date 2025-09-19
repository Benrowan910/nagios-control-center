// Service to interact with Nagios XI API
export interface HostStatus {
  host_object_id: string;
  host_name: string;
  host_alias: string;
  display_name: string;
  address: string;
  current_state: string;
  output: string;
  last_check: string;
  [key: string]: any;
}

export interface ServiceStatus {
  host_name: string;
  service_description: string;
  current_state: number;
  plugin_output: string;
  last_check: string;
  [key: string]: any;
}

export interface SystemInfo {
  product: string;
  version: string;
  license: string;
  hosts_total: number;
  services_total: number;
  [key: string]: any;
}

export interface HostStatusResponse {
  recordcount: number;
  hoststatus: HostStatus[];
  [key: string]: any;
}

export interface ServiceStatusResponse {
  recordcount: number;
  servicestatus: ServiceStatus[];
  [key: string]: any;
}

export class NagiosXIService {
  private static async makeApiRequest(url: string): Promise<any> {
    try {
      console.log(`Making API request to: ${url}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API request failed with status ${response.status}:`, errorText);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        // If not JSON, try to parse as text first to see what we got
        const textResponse = await response.text();
        console.warn('API returned non-JSON response:', textResponse.substring(0, 200));
        throw new Error('API returned non-JSON response');
      }
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  static async authenticate(instance: any, username: string, password: string): Promise<boolean> {
    try {
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

  // Add this method to the NagiosXIService class
static async authenticateWithStoredCredentials(instance: any): Promise<boolean> {
  try {
    const credentialsKey = `credentials_${instance.id}`;
    const storedCredentials = sessionStorage.getItem(credentialsKey);
    
    if (storedCredentials) {
      // Simple decryption (for demo purposes)
      const credentials = JSON.parse(decodeURIComponent(atob(storedCredentials)));
      return await this.authenticate(instance, credentials.username, credentials.password);
    }
    
    return false;
  } catch (error) {
    console.error('Error using stored credentials:', error);
    return false;
  }
}

  static async getSystemInfo(instance: any): Promise<SystemInfo> {
    try {

            // Try to authenticate with stored credentials first
    const isAuthenticated = await this.authenticateWithStoredCredentials(instance);
    
    if (!isAuthenticated) {
    throw new Error('Not authenticated');
    }

      const url = `http://${instance.url}/nagiosxi/api/v1/system/info?apikey=${instance.apiKey}`;
      const data = await this.makeApiRequest(url);
      
      // Handle different possible response formats
      if (data.recordcount !== undefined && data.systeminfo !== undefined) {
        return data.systeminfo[0]; // If response is {recordcount: X, systeminfo: [...]}
      } else if (data.product !== undefined) {
        return data; // If response is directly the system info
      } else {
        throw new Error('Unexpected API response format for system info');
      }
    } catch (error) {
      console.error('Failed to get system info:', error);
      throw error;
    }
  }

  static async getHostStatus(instance: any, p0: { signal: AbortSignal; }): Promise<HostStatus[]> {
    try {

            // Try to authenticate with stored credentials first
    const isAuthenticated = await this.authenticateWithStoredCredentials(instance);
    
    if (!isAuthenticated) {
      throw new Error('Not authenticated');
    }

      const url = `http://${instance.url}/nagiosxi/api/v1/objects/hoststatus?apikey=${instance.apiKey}`;
      const data = await this.makeApiRequest(url);
      
      // Handle different possible response formats
      if (data.recordcount !== undefined && data.hoststatus !== undefined) {
        return data.hoststatus;
      } else if (Array.isArray(data)) {
        return data; // If response is directly an array
      } else {
        throw new Error('Unexpected API response format for host status');
      }
    } catch (error) {
      console.error('Failed to get host status:', error);
      throw error;
    }
  }

  static async getServiceStatus(instance: any): Promise<ServiceStatus[]> {
    try {

            // Try to authenticate with stored credentials first
    const isAuthenticated = await this.authenticateWithStoredCredentials(instance);
    
    if (!isAuthenticated) {
      throw new Error('Not authenticated');
    }
      const url = `http://${instance.url}/nagiosxi/api/v1/objects/servicestatus?apikey=${instance.apiKey}`;
      const data = await this.makeApiRequest(url);
      
      // Handle different possible response formats
      if (data.recordcount !== undefined && data.servicestatus !== undefined) {
        return data.servicestatus;
      } else if (Array.isArray(data)) {
        return data; // If response is directly an array
      } else {
        throw new Error('Unexpected API response format for service status');
      }
    } catch (error) {
      console.error('Failed to get service status:', error);
      throw error;
    }
  }

  // Test method to debug API responses
  static async testApiEndpoint(url: string): Promise<any> {
    try {
      console.log(`Testing API endpoint: ${url}`);
      const response = await fetch(url);
      const text = await response.text();
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      console.log('Response text (first 500 chars):', text.substring(0, 500));
      
      return {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        text: text
      };
    } catch (error) {
      console.error('API test failed:', error);
      throw error;
    }
  }

}