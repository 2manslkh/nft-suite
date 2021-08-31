const { expect } = require("chai");
const { ethers, getNamedAccounts, deployments } = require("hardhat");
const {
  BN, // Big Number support
  constants, // Common constants, like the zero address and largest integers
  expectEvent, // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
  time,
} = require("@openzeppelin/test-helpers");
const { hexStripZeros } = require("@ethersproject/bytes");

require("dotenv").config();

const IPFS_GATEWAY = process.env.IPFS_GATEWAY;
const LAUNCH_PRICE = ethers.utils.parseEther("0.048");
const PRESALE_PRICE = ethers.utils.parseEther("0.03");
const WRONG_PRICE = ethers.utils.parseEther("0.02");
const LAUNCH_TIME = 1630425600;
const MAX_QUANTITY = 10;
const MAX_SUPPLY = 100;
const PRESALE_LIMIT = 8;

describe("CheekyCorgi", function () {
  let owner, treasury, tester;
  let cheekyCorgi;
  let YieldToken;

  before(async function () {
    // Get Signers
    [owner, treasury, tester] = await ethers.getSigners();
    await deployments.fixture(["Full"]);
    provider = await ethers.getDefaultProvider("http://localhost:8545");
    cheekyCorgi = await ethers.getContract("CheekyCorgi", tester);
  });

  describe("Minting before sales start", async function () {
    before(async function () {
      await deployments.fixture(["Full"]);
    });

    it("Should not mint new Corgi as public sale is not open yet", async function () {
      await expectRevert(
        cheekyCorgi.mint(1, {
          value: LAUNCH_PRICE.mul(1),
        }),
        "CheekyCorgi: Public Sale opens on 1st Sept 2021 00:00 UTC"
      );
    });
  });

  describe("Minting", async function () {
    before(async function () {
      await deployments.fixture(["Full"]);
      let latest = await time.latest();

      if (latest < LAUNCH_TIME) {
        await time.increaseTo(LAUNCH_TIME);
      }
    });

    it("Should mint new Corgi", async function () {
      const quantity = 1;
      const balanceBefore = await cheekyCorgi.balanceOf(tester.address);

      await (
        await cheekyCorgi.mint(quantity, {
          value: LAUNCH_PRICE.mul(quantity),
        })
      ).wait();

      const balanceAfter = await cheekyCorgi.balanceOf(tester.address);

      expect(balanceAfter.sub(balanceBefore)).to.equal(quantity);
    });

    it("Should mint 5 new Corgis", async function () {
      const quantity = 5;
      const balanceBefore = await cheekyCorgi.balanceOf(tester.address);

      await (
        await cheekyCorgi.mint(quantity, {
          value: LAUNCH_PRICE.mul(quantity),
        })
      ).wait();

      const balanceAfter = await cheekyCorgi.balanceOf(tester.address);

      expect(balanceAfter.sub(balanceBefore)).to.equal(quantity);
    });

    it("Total Supply should be 6", async function () {
      let totalSupply = await cheekyCorgi.totalSupply();
      expect(totalSupply).to.equal(6);
    });

    it("Total ETH Collected", async function () {
      const balance = await provider.getBalance(cheekyCorgi.address);
      console.log("🚀 | balance", ethers.utils.formatEther(balance));
      expect(balance).to.equal(LAUNCH_PRICE.mul(6));
    });
    it("Should Not Withdraw ETH to treasury with invalid account", async function () {
      await expectRevert(
        cheekyCorgi.withdrawToTreasury(),
        "CheekyCorgi: OnlyTreasury"
      );
    });
    it("Should Withdraw ETH to treasury", async function () {
      const balanceBefore = await provider.getBalance(treasury.address);
      const balance = await provider.getBalance(cheekyCorgi.address);
      let tx = await cheekyCorgi.connect(treasury).withdrawToTreasury();
      // console.log(tx);
      let r = await tx.wait();
      // console.log("🚀 | r", r);

      let gasFees = r.cumulativeGasUsed.mul(r.effectiveGasPrice);
      console.log("🚀 | gasFees", ethers.utils.formatEther(gasFees), "ETH");

      const balanceAfter = await provider.getBalance(treasury.address);

      console.log("🚀 | balance", ethers.utils.formatEther(balanceAfter));
      expect(balanceAfter.sub(balanceBefore)).to.equal(balance.sub(gasFees));
    });
  });

  describe("Wrong Minting", async function () {
    before(async function () {
      await deployments.fixture(["Full"]);
    });

    it("Should not mint new Corgi due to incorrect ETH", async function () {
      await expectRevert(
        cheekyCorgi.mint(1, {
          value: WRONG_PRICE.mul(1),
        }),
        "CheekyCorgi: ETH Value incorrect (Quantity * LAUNCH_PRICE)"
      );
    });

    it(`Should not mint more than ${MAX_QUANTITY} Corgis`, async function () {
      await expectRevert(
        cheekyCorgi.mint(MAX_QUANTITY + 1, {
          value: LAUNCH_PRICE.mul(MAX_QUANTITY + 1),
        }),
        "CheekyCorgi: Quantity must be less than MAX_QUANTITY = 10"
      );
    });

    it(`Should not mint more than max supply ${MAX_SUPPLY}`, async function () {
      for (let i = 0; i < 10; i++) {
        await (
          await cheekyCorgi.mint(MAX_QUANTITY, {
            value: LAUNCH_PRICE.mul(MAX_QUANTITY),
          })
        ).wait();
      }

      await expectRevert(
        cheekyCorgi.mint(1, {
          value: LAUNCH_PRICE.mul(1),
        }),
        "CheekyCorgi: Quantity must be lesser than MAX_SUPPLY = 6900"
      );
    });
  });

  describe("URI", async function () {
    before(async function () {
      await deployments.fixture(["Full"]);
    });
    it("Should display correct URI", async function () {
      await (
        await cheekyCorgi.mint(1, {
          value: LAUNCH_PRICE.mul(1),
        })
      ).wait();

      const uri = await cheekyCorgi.tokenURI(1);

      expect(uri).to.equal(process.env.IPFS_GATEWAY + 1);
    });

    it("Should update to correct URI", async function () {
      const newBaseURI = "https://ipfs.new/ipfs/";

      await expectRevert(
        cheekyCorgi.updateBaseURI(newBaseURI),
        "CheekyCorgi: OnlyAdmin"
      );

      await (await cheekyCorgi.connect(owner).updateBaseURI(newBaseURI)).wait();

      await (
        await cheekyCorgi.mint(1, {
          value: LAUNCH_PRICE.mul(1),
        })
      ).wait();

      const uri = await cheekyCorgi.tokenURI(1);

      expect(uri).to.equal(`${newBaseURI}1`);
    });
  });

  describe("YieldToken", async function () {
    before(async function () {
      await deployments.fixture(["Full"]);

      YieldToken = await ethers.getContract("YieldToken", tester);

      (
        await cheekyCorgi.connect(owner).setYieldToken(YieldToken.address)
      ).wait();

      console.log("YieldToken", YieldToken.address);
      await (
        await cheekyCorgi.mint(1, {
          value: LAUNCH_PRICE.mul(1),
        })
      ).wait();
    });

    it("Should Grant user some CANDY Tokens", async function () {
      const candyBalance = await YieldToken.getTotalClaimable(tester.address);
      console.log(
        "🚀 | candyBalance",
        ethers.utils.formatEther(candyBalance),
        "CANDY"
      );
      expect(candyBalance).to.equal(ethers.utils.parseEther("300"));
    });

    it("Should Grant user BASE_RATE CANDY Tokens after 1 day", async function () {
      await time.increase(time.duration.days(1));

      const candyBalance = await YieldToken.getTotalClaimable(tester.address);
      console.log(
        "🚀 | candyBalance",
        ethers.utils.formatEther(candyBalance),
        "CANDY"
      );
      expect(candyBalance).to.equal(ethers.utils.parseEther("310"));
    });
  });
});
