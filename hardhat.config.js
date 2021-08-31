const { task } = require("hardhat/config");

require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("dotenv").config();

require("hardhat-deploy");
const ALCHEMY_PROVIDER_MAINNET = process.env.ALCHEMY_PROVIDER_MAINNET;
const ALCHEMY_PROVIDER_KOVAN = process.env.ALCHEMY_PROVIDER_KOVAN;
const INFURA_PROVIDER_MAINNET = process.env.INFURA_PROVIDER_MAINNET;
const INFURA_PROVIDER_KOVAN = process.env.INFURA_PROVIDER_KOVAN;
const INFURA_PROVIDER_RINKEBY = process.env.INFURA_PROVIDER_RINKEBY;
const INFURA_PROVIDER_MATIC = process.env.INFURA_PROVIDER_MATIC;
const INFURA_PROVIDER_MUMBAI = process.env.INFURA_PROVIDER_MUMBAI;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const PRIVATE_KEY_TEST = process.env.PRIVATE_KEY_TEST;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const POLYGON_API_KEY = process.env.POLYGON_API_KEY;

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

task("balances", "Prints the list of accounts with their ETH balance")
  .addParam("n", "Network")
  .setAction(async (taskArgs, hre) => {
    const network = taskArgs.n;
    const provider = await hre.ethers.getDefaultProvider(network);
    const accounts = await hre.ethers.getSigners();

    for (const account of accounts) {
      console.log(
        account.address,
        ethers.utils.formatEther(await provider.getBalance(account.address)),
        "ETH"
      );
    }
  });

task("newwallet", "Generate New Wallet", async (taskArgs, hre) => {
  const wallet = hre.ethers.Wallet.createRandom();
  console.log(wallet._signingKey());
});

task("balance", "Get Address Balance")
  .addParam("address", "The account's address")
  .addParam("n", "Network")
  .setAction(async (taskArgs, hre) => {
    const address = taskArgs.address;
    const network = taskArgs.n;
    const provider = await hre.ethers.getDefaultProvider(network);
    console.log("Balance of", address, "@", network);
    console.log(
      ethers.utils.formatEther(await provider.getBalance(address)),
      "ETH"
    );
  });

task("newwallet", "Generate New Wallet", async (taskArgs, hre) => {
  const wallet = hre.ethers.Wallet.createRandom();
  console.log(wallet._signingKey());
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      saveDeployments: true,
    },
    hardhat: {
      // forking: {
      //   url: process.env.ALCHEMY_PROVIDER,
      //   blockNumber: 12802046,
      // },
      mining: {
        auto: true,
        // interval: 0,
      },
    },
    mainnet: {
      url: process.env.INFURA_PROVIDER_MAINNET,
      chainId: 1,
      gasPrice: "auto",
      // gasPrice: 20000000000,
      // mnemonic: process.env.MNEMONIC,
      accounts: [PRIVATE_KEY_TEST],
    },
    kovan: {
      url: INFURA_PROVIDER_KOVAN,
      chainId: 42,
      gasPrice: "auto",
      // mnemonic: process.env.MNEMONIC,
      accounts: [PRIVATE_KEY_TEST],
    },
    rinkeby: {
      url: INFURA_PROVIDER_RINKEBY,
      chainId: 4,
      gasPrice: "auto",
      // mnemonic: process.env.MNEMONIC,
      accounts: [PRIVATE_KEY_TEST],
    },
    matic: {
      url: INFURA_PROVIDER_MATIC,
      chainId: 137,
      gasPrice: 50000000000,
      // gasPrice: "auto",
      // mnemonic: process.env.MNEMONIC,
      accounts: [PRIVATE_KEY],
    },
    mumbai: {
      url: INFURA_PROVIDER_MUMBAI,
      chainId: 80001,
      gasPrice: 5000000000,
      // mnemonic: process.env.MNEMONIC,
      accounts: [PRIVATE_KEY],
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.4",
        settings: {
          optimizer: {
            enabled: true,
          },
        },
      },
    ],
  },
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
      1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
      4: 0,
    },
    adminAddress: {
      default: 0, // here this will by default take the second account as feeCollector (so in the test this will be a different account than the deployer)
      1: process.env.MAINNET_ADMIN, // on the mainnet the feeCollector could be a multi sig
      4: process.env.RINKEBY_ADMIN,
    },
    treasuryAddress: {
      default: 1,
      1: process.env.MAINNET_TREASURY, // on the mainnet the feeCollector could be a multi sig
      4: process.env.RINKEBY_TREASURY,
    },
    owner: {
      default: process.env.OWNER,
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
    // apiKey: POLYGON_API_KEY,
    // apiKey: process.env.POLYSCAN_API_KEY,
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
    deploy: "./deploy",
  },
  mocha: {
    timeout: 20000000,
  },
};
