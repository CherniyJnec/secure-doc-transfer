import { useState } from 'react';
import { BrowserProvider } from 'ethers';
import { config } from './services/contract';
import SendDocument from './components/SendDocument';
import DocumentsList from './components/DocumentsList';

function App() {
  const [account, setAccount] = useState(null);
  const [networkOk, setNetworkOk] = useState(false);
  const [loading, setLoading] = useState(false);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('MetaMask не установлен!');
      return;
    }
    
    setLoading(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const network = await provider.getNetwork();
      
      setAccount(accounts[0]);
      setNetworkOk(Number(network.chainId) === config.chainId);
    } catch (err) {
      alert('Ошибка подключения: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-800 mb-2">
          🔒 Secure Doc Transfer
        </h1>
        <p className="text-gray-500 mb-8">Блокчейн-система защищенной передачи документов</p>
        
        {!account ? (
          <div className="bg-white p-8 rounded-xl shadow-md text-center">
            <p className="mb-4 text-gray-600">Для работы подключите Web3-кошелек</p>
            <button 
              onClick={connectWallet}
              disabled={loading}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? 'Подключение...' : '🦊 Подключить MetaMask'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Статус подключения */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-lg shadow border-l-4 border-blue-500">
                <p className="text-xs text-gray-500 uppercase">Аккаунт</p>
                <p className="font-mono text-xs mt-1 break-all">{account}</p>
              </div>
              <div className={`p-4 rounded-lg shadow ${networkOk ? 'bg-green-50 border-l-4 border-green-500' : 'bg-red-50 border-l-4 border-red-500'}`}>
                <p className={`text-sm font-medium ${networkOk ? 'text-green-800' : 'text-red-800'}`}>
                  {networkOk ? '✅ Hardhat Local' : '❌ Неверная сеть'}
                </p>
              </div>
            </div>

            {/* Форма отправки */}
            {networkOk && <SendDocument account={account} />}
            
            {networkOk && <DocumentsList account={account} />}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;