require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Переопределяем задачу компиляции для работы без интернета
const { TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD } = require("hardhat/builtin-tasks/task-names");
const solc = require("solc");

subtask(TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD, async ({ solcVersion }, hre, runSuper) => {
  if (solcVersion === "0.8.20") {
    // Возвращаем локальный solcjs напрямую, минуя скачивание
    return {
      compilerPath: require.resolve("solc/soljson.js"),
      isSolcJs: true,
      version: "0.8.20",
      longVersion: "0.8.20+commit.a1b79de6"
    };
  }
  return runSuper();
});

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
    },
  },
  networks: {
    hardhat: { chainId: 31337 },
    localhost: { url: "http://127.0.0.1:8545" }
  }
};