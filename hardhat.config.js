require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");

module.exports = {
  solidity: "0.8.19",
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
  network: {
    mumbai: {
      url: "https://rpc-mumbai.maticvigil.com",
    },
  },
};
