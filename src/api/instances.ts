export interface XIInstance {
    id: string;
    name: string;
    url: string;
    apiKey: string;
}

export const INSTANCES: XIInstance[] = [
    {
        id: "1",
        name: "Nagios XI - Data Center A",
        url: "http://xi1.example.com",
        apiKey: "demo-key-1",
    },
    {
        id: "2",
        name: "Nagios XI - Data Center B",
        url: "http://xi2.example.com",
        apiKey: "demo-key-2",
    },
];