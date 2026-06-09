const IPFS_API = 'http://127.0.0.1:5001/api/v0';

export async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${IPFS_API}/add`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) throw new Error('IPFS upload failed');
  const result = await response.json();
  return result.Hash;
}

export function getIpfsUrl(hash) {
  return `http://127.0.0.1:8080/ipfs/${hash}`;
}