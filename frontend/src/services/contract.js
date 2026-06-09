import { ethers } from 'ethers';
import config from '../contract-config.json';

// Упрощенный ABI для подключения (полный добавим позже)
const CONTRACT_ABI = [
  "function sendDocument(string memory _ipfsCid, address _recipient, string memory _docType) external returns (uint256)",
  "function confirmReceipt(uint256 _docId) external",
  "function getDocument(uint256 _docId) external view returns (tuple(string,address,address,uint256,bool,string))",
  "function getMyDocumentIds() external view returns (uint256[] sent, uint256[] received)",
  "event DocumentSent(uint256 indexed docId, address indexed sender, address indexed recipient, string ipfsCid)",
  "event ReceiptConfirmed(uint256 indexed docId, address indexed recipient, uint256 timestamp)"
];

export function getContract(signerOrProvider) {
  return new ethers.Contract(config.contractAddress, CONTRACT_ABI, signerOrProvider);
}

export { config };