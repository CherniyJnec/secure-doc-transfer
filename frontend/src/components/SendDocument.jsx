import { useState } from 'react';
import { BrowserProvider } from 'ethers';
import { getContract } from '../services/contract';
import { uploadFile } from '../services/ipfs';

export default function SendDocument({ account }) {
  const [file, setFile] = useState(null);
  const [recipient, setRecipient] = useState('');
  const [docType, setDocType] = useState('medical');
  const [status, setStatus] = useState('idle'); // idle | uploading | sending | success | error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !recipient) return;

    try {
      // 1. Загрузка в IPFS
      setStatus('uploading');
      setMessage('Загрузка файла в IPFS...');
      const ipfsHash = await uploadFile(file);

      // 2. Отправка в блокчейн
      setStatus('sending');
      setMessage('Подписание транзакции в MetaMask...');
      
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = getContract(signer);
      
      // Передаём оригинальный CID напрямую
      const tx = await contract.sendDocument(ipfsHash, recipient, docType);
      setMessage('Транзакция отправлена. Ожидание подтверждения...');
      await tx.wait();

      setStatus('success');
      setMessage(`✅ Документ отправлен! IPFS: ${ipfsHash.slice(0, 10)}...`);
      
      // Сброс формы через 3 секунды
      setTimeout(() => {
        setFile(null);
        setRecipient('');
        setStatus('idle');
        setMessage('');
      }, 3000);

    } catch (err) {
      setStatus('error');
      setMessage(`❌ Ошибка: ${err.reason || err.message}`);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-xl font-bold text-gray-800 mb-4">📤 Отправить документ</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Файл</label>
          <input 
            type="file" 
            onChange={(e) => setFile(e.target.files[0])}
            required
            className="w-full border border-gray-300 rounded-lg p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Адрес получателя</label>
          <input 
            type="text" 
            placeholder="0x..."
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg p-2 font-mono text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Тип документа</label>
          <select 
            value={docType} 
            onChange={(e) => setDocType(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2"
          >
            <option value="medical">Медицинский</option>
            <option value="legal">Юридический</option>
            <option value="financial">Финансовый</option>
            <option value="custom">Другой</option>
          </select>
        </div>

        <button 
          type="submit" 
          disabled={status === 'uploading' || status === 'sending'}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {status === 'uploading' ? '⏳ Загрузка в IPFS...' : 
           status === 'sending' ? '⏳ Подписание транзакции...' : 
           'Отправить документ'}
        </button>

        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            status === 'error' ? 'bg-red-50 text-red-700' : 
            status === 'success' ? 'bg-green-50 text-green-700' : 
            'bg-blue-50 text-blue-700'
          }`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
}