import { useState, useEffect } from 'react';
import { BrowserProvider } from 'ethers';
import { getContract } from '../services/contract';
import { getIpfsUrl } from '../services/ipfs';

export default function DocumentsList({ account }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDocuments = async () => {
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = getContract(signer);

      // Получаем ID документов пользователя
      const [sentIds, receivedIds] = await contract.getMyDocumentIds();
      
      // Загружаем метаданные каждого документа
      const allIds = [...sentIds, ...receivedIds];
      const uniqueIds = [...new Set(allIds.map(id => Number(id)))];
      
      /*const documents = await Promise.all(
        uniqueIds.map(async (id) => {
          try {
            const doc = await contract.getDocument(id);
            return {
              id,
              ipfsHash: doc[0],
              sender: doc[1],
              recipient: doc[2],
              timestamp: new Date(Number(doc[3]) * 1000).toLocaleString(),
              isReceived: doc[4],
              docType: doc[5],
              isSender: doc[1].toLowerCase() === account.toLowerCase()
            };
          } catch {
            return null; // Пропускаем документы без доступа
          }
        })
      );*/
      const documents = [];
        for (const id of uniqueIds) {
            try {
                const doc = await contract.getDocument(id);
                console.log(`Doc ${id} loaded:`, doc); // 👈 СМОТРИ В КОНСОЛЬ
                documents.push({
                id: Number(id),
                ipfsHash: doc[0],
                sender: doc[1],
                recipient: doc[2],
                timestamp: new Date(Number(doc[3]) * 1000).toLocaleString(),
                isReceived: doc[4],
                docType: doc[5],
                isSender: doc[1].toLowerCase() === account.toLowerCase()
                });
            } catch (err) {
                console.error(`❌ Error loading doc ${id}:`, err); // 👈 ВИДИМ ОШИБКУ
            }
        }

      setDocs(documents.filter(Boolean).sort((a, b) => b.id - a.id));
    } catch (err) {
      console.error('Ошибка загрузки документов:', err);
    } finally {
      setLoading(false);
    }
  };

  const confirmReceipt = async (docId) => {
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = getContract(signer);
      
      const tx = await contract.confirmReceipt(docId);
      await tx.wait();
      
      // Обновляем список после подтверждения
      loadDocuments();
    } catch (err) {
      alert('Ошибка подтверждения: ' + (err.reason || err.message));
    }
  };

  useEffect(() => {
    if (account) loadDocuments();
  }, [account]);

  if (loading) return <div className="text-center py-8 text-gray-500">Загрузка документов...</div>;

  return (
    <div className="bg-white p-6 rounded-xl shadow-md mt-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">📋 Мои документы</h2>
      
      {docs.length === 0 ? (
        <p className="text-gray-500 text-center py-4">Документов пока нет</p>
      ) : (
        <div className="space-y-3">
          {docs.map((doc) => (
            <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full mb-1">
                    {doc.docType}
                  </span>
                  <p className="text-sm text-gray-500">ID: {doc.id} • {doc.timestamp}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  doc.isReceived 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {doc.isReceived ? '✅ Получено' : '⏳ Ожидает'}
                </span>
              </div>
              
              <div className="flex justify-between items-center mt-3">
                <a 
                  href={getIpfsUrl(doc.ipfsHash)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  📥 Скачать файл из IPFS
                </a>
                
                {!doc.isReceived && !doc.isSender && (
                  <button 
                    onClick={() => confirmReceipt(doc.id)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm transition-colors"
                  >
                    Подтвердить получение
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}