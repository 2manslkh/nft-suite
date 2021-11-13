const { ethers } = require("hardhat");

require("dotenv").config();

module.exports = async ({
  getNamedAccounts,
  deployments,
  getChainId,
  getUnnamedAccounts,
}) => {
  const { deploy } = deployments;
  const { deployer, admin, treasury, owner } = await getNamedAccounts();
  const chainId = await getChainId();

  const cheekyCorgi = await deploy("CheekyCorgi", {
    from: deployer,
    args: [
      "CheekyCorgi",
      "CC",
      process.env.IPFS_GATEWAY,
      admin,
      treasury,
      owner, // OWNER OF SMART CONTRACT, NEEDED TO CLAIM COLLECTION ON OPENSEA
    ],
  });
};

module.exports.tags = ["Full"];
