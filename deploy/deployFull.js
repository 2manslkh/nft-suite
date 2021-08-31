const { ethers } = require("hardhat");

require("dotenv").config();

module.exports = async ({
  getNamedAccounts,
  deployments,
  getChainId,
  getUnnamedAccounts,
}) => {
  const { deploy } = deployments;
  const { deployer, adminAddress, treasuryAddress, owner } =
    await getNamedAccounts();
  const chainId = await getChainId();

  const MAX_CANDY_TOKENS = 4000000000;

  const cheekyCorgi = await deploy("CheekyCorgi", {
    from: deployer,
    args: [
      "CheekyCorgi",
      "CC",
      process.env.IPFS_GATEWAY,
      adminAddress,
      treasuryAddress,
      owner, // OWNER OF SMART CONTRACT, NEEDED TO CLAIM COLLECTION ON OPENSEA
    ],
  });

  const yieldToken = await deploy("YieldToken", {
    from: deployer,
    args: [cheekyCorgi.address, MAX_CANDY_TOKENS],
  });

  let cc = await ethers.getContract("CheekyCorgi", deployer);

  await (await cc.setYieldToken(yieldToken.address)).wait();
};

module.exports.tags = ["Full"];
