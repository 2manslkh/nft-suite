const { ethers } = require("hardhat");

require("dotenv").config();

module.exports = async ({
  getNamedAccounts,
  deployments,
  getChainId,
  getUnnamedAccounts,
}) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  const MAX_CANDY_TOKENS = 4000000000;

  const yieldToken = await deploy("YieldToken", {
    from: deployer,
    args: [cheekyCorgi.address, MAX_CANDY_TOKENS],
  });

  let cc = await ethers.getContract("CheekyCorgi", deployer);

  await (await cc.setYieldToken(yieldToken.address)).wait();
};

module.exports.tags = ["Full"];
