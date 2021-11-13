const { task } = require("hardhat/config");

require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-gas-reporter");
require("hardhat-deploy");

const { time } = require("@openzeppelin/test-helpers");

require("dotenv").config();

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

task("increase-time", "Skips the local blockchain by X days")
  .addParam("d", "Days")
  .setAction(async (taskArgs, hre) => {
    const days = taskArgs.d;

    await time.increase(time.duration.days(days));
  });

task("newwallet", "Generate New Wallet", async (taskArgs, hre) => {
  const wallet = hre.ethers.Wallet.createRandom();
  console.log(wallet._signingKey());
  console.log(wallet);
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
      // gasPrice: 100000000000,
      // blockGasLimit: 30000000000,

      // maxFeePerGas: 50000000000,
      // maxPriorityFeePerGas: 2000000000,
    },
    hardhat: {
      // forking: {
      //   url: ALCHEMY_PROVIDER_MAINNET,
      //   blockNumber: 13341325, // to replace with pause block number
      // },
      // gasPrice: 100000000000,
      // blockGasLimit: 30000000000,
      initialBaseFeePerGas: 50000000000,
      maxFeePerGas: 50000000000,
      maxPriorityFeePerGas: 2000000000,

      mining: {
        auto: true,
        // interval: 0,
      },
    },
    mainnet: {
      url: process.env.INFURA_PROVIDER_MAINNET,
      chainId: 1,
      // maxFeePerGas: 100000000000,
      // maxPriorityFeePerGas: 3000000000,
      // mnemonic: process.env.MNEMONIC,
      accounts: [process.env.PRIVATE_KEY],
    },
    kovan: {
      url: process.env.INFURA_PROVIDER_KOVAN,
      chainId: 42,
      maxFeePerGas: 100000000000,
      maxPriorityFeePerGas: 2000000000,
      // mnemonic: process.env.MNEMONIC,
      accounts: [process.env.PRIVATE_KEY_TEST],
    },
    rinkeby: {
      url: process.env.INFURA_PROVIDER_RINKEBY,
      chainId: 4,
      maxFeePerGas: 80000000000,
      maxPriorityFeePerGas: 1000000000,
      // mnemonic: process.env.MNEMONIC,
      accounts: [process.env.PRIVATE_KEY_TEST],
    },
    matic: {
      url: process.env.INFURA_PROVIDER_MATIC,
      chainId: 137,
      gasPrice: 50000000000,
      // mnemonic: process.env.MNEMONIC,
      accounts: [process.env.PRIVATE_KEY_TEST],
    },
    mumbai: {
      url: process.env.INFURA_PROVIDER_MUMBAI,
      chainId: 80001,
      gasPrice: 5000000000,
      // maxFeePerGas: 100000000000,
      // maxPriorityFeePerGas: 2000000000,

      // mnemonic: process.env.MNEMONIC,
      accounts: [process.env.PRIVATE_KEY_TEST],
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.9",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
      1: process.env.DEPLOYER_MAINNET, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
      4: process.env.DEPLOYER_RINKEBY,
    },
    alice: {
      default: 0,
      4: process.env.ALICE,
    },
    bob: {
      default: 0,
      4: process.env.BOB,
    },
    cindy: {
      default: 0,
      4: process.env.CINDY,
    },
    admin: {
      default: 0,
    },
    treasury: {
      default: 0,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
    deploy: "./deploy",
  },
  mocha: {
    timeout: 2000000000,
  },
};
