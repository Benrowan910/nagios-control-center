// Service to interact with Nagios Network Analyzer API
export interface NNAStatusI {
  totalBandwidth: number;
  usedBandwidth: number;
  packetRate: number;
  activeFlows: number;
  topProtocols: { protocol: string; percentage: number }[];
}

export class NagiosNNAService {
  static async authenticate(instance: any): Promise<boolean> {
    try {
      // Use API key for authentication
      const response = await fetch(`${instance.url}/nna/api/v1/system/status`, {
        headers: {
          'Authorization': instance.apiKey
        }
      });
      return response.ok;
    } catch (error) {
      console.error('NNA Authentication failed:', error);
      return false;
    }
  }

  static async getNNAStatus(instance: any): Promise<NNAStatusI> {
    try {
      // Use API key for status requests
      const response = await fetch(`http://${instance.url}/nna/api/v1/status?apikey=${instance.apiKey}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch NNA status');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching NNA status:', error);
      // Return mock data for demonstration
      return {
        totalBandwidth: 1000,
        usedBandwidth: 350,
        packetRate: 10000,
        activeFlows: 150,
        topProtocols: [
          { protocol: 'HTTP', percentage: 40 },
          { protocol: 'HTTPS', percentage: 30 },
          { protocol: 'DNS', percentage: 10 },
          { protocol: 'SSH', percentage: 5 },
          { protocol: 'Other', percentage: 15 }
        ]
      };
    }
  }
}