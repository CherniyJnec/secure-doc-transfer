const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying SecureDocTransfer...");
  
  const Contract = await hre.ethers.getContractFactory("SecureDocTransfer");
  const contract = await Contract.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`✅ Contract deployed to: ${address}`);

  // Сохраняем адрес для фронтенда (product-ready паттерн)
  const frontendDir = path.join(__dirname, "../frontend/src");
  if (!fs.existsSync(frontendDir)) {
    fs.mkdirSync(frontendDir, { recursive: true });
  }
  
  // Жестко задаем chainId для локальной сети, чтобы он не терялся
  const config = {
    contractAddress: address,
    network: hre.network.name,
    chainId: hre.network.config.chainId || 31337 
  };
  
  fs.writeFileSync(
    path.join(frontendDir, "contract-config.json"),
    JSON.stringify(config, null, 2)
  );
  console.log("📄 Config saved to frontend/src/contract-config.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});