const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("SecureDocTransfer", function () {
  async function deployFixture() {
    const [owner, sender, recipient, unauthorized] = await ethers.getSigners();
    const Contract = await ethers.getContractFactory("SecureDocTransfer");
    const contract = await Contract.deploy();
    
    const sampleHash = ethers.id("QmTestIPFSHash123456789");
    
    return { contract, owner, sender, recipient, unauthorized, sampleHash };
  }

  describe("Send Document", function () {
    it("Should create document and emit event", async function () {
      const { contract, sender, recipient, sampleHash } = await loadFixture(deployFixture);
      
      await expect(contract.connect(sender).sendDocument(sampleHash, recipient.address, "medical"))
        .to.emit(contract, "DocumentSent")
        .withArgs(0, sender.address, recipient.address, sampleHash);
        
      const doc = await contract.connect(sender).getDocument(0);
      expect(doc.ipfsHash).to.equal(sampleHash);
      expect(doc.isReceived).to.be.false;
    });

    it("Should revert when sending to self", async function () {
      const { contract, sender, sampleHash } = await loadFixture(deployFixture);
      await expect(
        contract.connect(sender).sendDocument(sampleHash, sender.address, "legal")
      ).to.be.revertedWith("Cannot send to self");
    });
  });

  describe("Confirm Receipt", function () {
    it("Should allow recipient to confirm", async function () {
      const { contract, sender, recipient, sampleHash } = await loadFixture(deployFixture);
      await contract.connect(sender).sendDocument(sampleHash, recipient.address, "medical");
      
      await expect(contract.connect(recipient).confirmReceipt(0))
        .to.emit(contract, "ReceiptConfirmed");
        
      const doc = await contract.connect(recipient).getDocument(0);
      expect(doc.isReceived).to.be.true;
    });

    it("Should revert if non-recipient tries to confirm", async function () {
      const { contract, sender, recipient, unauthorized, sampleHash } = await loadFixture(deployFixture);
      await contract.connect(sender).sendDocument(sampleHash, recipient.address, "medical");
      
      await expect(
        contract.connect(unauthorized).confirmReceipt(0)
      ).to.be.revertedWith("Only recipient can confirm");
    });
  });

  describe("Access Control", function () {
    it("Should revert for unauthorized reader", async function () {
      const { contract, sender, recipient, unauthorized, sampleHash } = await loadFixture(deployFixture);
      await contract.connect(sender).sendDocument(sampleHash, recipient.address, "medical");
      
      await expect(
        contract.connect(unauthorized).getDocument(0)
      ).to.be.revertedWith("Access denied: not authorized");
    });
  });
});