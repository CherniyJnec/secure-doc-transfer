// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SecureDocTransfer
 * @dev Контракт для защищенной передачи конфиденциальных документов.
 * Хранит только метаданные и IPFS CID. Реализует контроль доступа и подтверждение получения.
 */
contract SecureDocTransfer is ReentrancyGuard, Ownable {
    
    struct Document {
        string ipfsCid;        // ✅ ИЗМЕНЕНО: string вместо bytes32
        address sender;
        address recipient;
        uint256 timestamp;
        bool isReceived;
        string docType;
    }

    Document[] private _documents;
    mapping(address => uint256[]) private _senderDocs;
    mapping(address => uint256[]) private _recipientDocs;

    event DocumentSent(
        uint256 indexed docId, 
        address indexed sender, 
        address indexed recipient, 
        string ipfsCid         // ✅ ИЗМЕНЕНО: string вместо bytes32
    );
    
    event ReceiptConfirmed(
        uint256 indexed docId, 
        address indexed recipient, 
        uint256 timestamp
    );

    modifier onlyAuthorized(uint256 _docId) {
        require(_docId < _documents.length, "Document does not exist");
        Document storage doc = _documents[_docId];
        require(
            msg.sender == doc.sender || msg.sender == doc.recipient || msg.sender == owner(),
            "Access denied: not authorized"
        );
        _;
    }

    modifier onlyRecipient(uint256 _docId) {
        require(_docId < _documents.length, "Document does not exist");
        require(msg.sender == _documents[_docId].recipient, "Only recipient can confirm");
        _;
    }

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Отправка нового документа
     * @param _ipfsCid CID файла в IPFS (строка)
     * @param _recipient Адрес получателя
     * @param _docType Тип документа
     */
    function sendDocument(
        string memory _ipfsCid, 
        address _recipient, 
        string memory _docType
    ) external nonReentrant returns (uint256) {
        require(_recipient != address(0), "Invalid recipient");
        require(_recipient != msg.sender, "Cannot send to self");
        require(bytes(_ipfsCid).length > 0, "IPFS CID required"); // ✅ ИСПРАВЛЕНО: проверка для string

        uint256 docId = _documents.length;
        
        _documents.push(Document({
            ipfsCid: _ipfsCid,      // ✅ ИСПРАВЛЕНО: ipfsCid вместо ipfsHash
            sender: msg.sender,
            recipient: _recipient,
            timestamp: block.timestamp,
            isReceived: false,
            docType: _docType
        }));

        _senderDocs[msg.sender].push(docId);
        _recipientDocs[_recipient].push(docId);

        emit DocumentSent(docId, msg.sender, _recipient, _ipfsCid); // ✅ ИСПРАВЛЕНО
        return docId;
    }

    function confirmReceipt(uint256 _docId) 
        external 
        onlyRecipient(_docId) 
        nonReentrant 
    {
        Document storage doc = _documents[_docId];
        require(!doc.isReceived, "Already confirmed");
        
        doc.isReceived = true;
        emit ReceiptConfirmed(_docId, msg.sender, block.timestamp);
    }

    function getDocument(uint256 _docId) 
        external 
        view 
        onlyAuthorized(_docId) 
        returns (Document memory) 
    {
        return _documents[_docId];
    }

    function getMyDocumentIds() external view returns (uint256[] memory sent, uint256[] memory received) {
        return (_senderDocs[msg.sender], _recipientDocs[msg.sender]);
    }

    function getTotalDocuments() external view returns (uint256) {
        return _documents.length;
    }
}