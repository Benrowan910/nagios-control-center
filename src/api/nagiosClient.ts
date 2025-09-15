interface XIInstance {
    id: string;
    name: string;
    url: string;
    apiKey: string;
}

export async function fetchHostStatus(instance: XIInstance) {
    const res = await fetch(`${instance.url}/nagiosxi/api/v1/objects/servicestatus`, {
        headers: {"Authorization": `Bearer ${instance.apiKey}` }

    });
    return res.json();
}

export async function fetchServiceStatus(instance: XIInstance) {
  const res = await fetch(`${instance.url}/nagiosxi/api/v1/objects/servicestatus`, {
    headers: { "Authorization": `Bearer ${instance.apiKey}` }
  });
  return res.json();
}