import { expect } from "chai";
import { ethers } from "hardhat";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";

describe("CreditLinePool", function () {
  let creditLinePool;
  let admin;
  let psp;
  let otherAccount;

  const CREDIT_LIMIT = ethers.parseUnits("500000", 6); // 500k USDC
  const DURATION = 90; // 90 days
  const UTILIZED_BIPS = 5; // 5 bps/day
  const UNUTILIZED_BIPS = 1; // 1 bps/day

  beforeEach(async function () {
    [admin, psp, otherAccount] = await ethers.getSigners();

    const CreditLinePool = await ethers.getContractFactory("CreditLinePool");
    creditLinePool = await CreditLinePool.deploy(
      psp.address,
      CREDIT_LIMIT,
      DURATION,
      UTILIZED_BIPS,
      UNUTILIZED_BIPS
    );
  });

  describe("Deployment", function () {
    it("Should set the correct admin", async function () {
      expect(await creditLinePool.admin()).to.equal(admin.address);
    });

    it("Should set the correct PSP", async function () {
      expect(await creditLinePool.psp()).to.equal(psp.address);
    });

    it("Should set the correct credit limit", async function () {
      expect(await creditLinePool.creditLimit()).to.equal(CREDIT_LIMIT);
    });

    it("Should initialize with zero utilized amount", async function () {
      expect(await creditLinePool.utilizedAmount()).to.equal(0);
    });

    it("Should be active after deployment", async function () {
      expect(await creditLinePool.isActive()).to.equal(true);
    });
  });

  describe("Drawdown", function () {
    it("Should allow PSP to drawdown within credit limit", async function () {
      const drawdownAmount = ethers.parseUnits("100000", 6); // 100k

      await expect(
        creditLinePool.connect(psp).drawdown(drawdownAmount, "ORDER-001")
      )
        .to.emit(creditLinePool, "Drawdown")
        .withArgs(psp.address, drawdownAmount, anyValue, "ORDER-001");

      expect(await creditLinePool.utilizedAmount()).to.equal(drawdownAmount);
    });

    it("Should reject drawdown exceeding credit limit", async function () {
      const drawdownAmount = ethers.parseUnits("600000", 6); // 600k (exceeds 500k limit)

      await expect(
        creditLinePool.connect(psp).drawdown(drawdownAmount, "ORDER-001")
      ).to.be.revertedWith("Exceeds credit limit");
    });

    it("Should reject drawdown from non-PSP address", async function () {
      const drawdownAmount = ethers.parseUnits("100000", 6);

      await expect(
        creditLinePool.connect(otherAccount).drawdown(drawdownAmount, "ORDER-001")
      ).to.be.revertedWith("Only PSP can call this function");
    });
  });

  describe("Repayment", function () {
    beforeEach(async function () {
      const drawdownAmount = ethers.parseUnits("100000", 6);
      await creditLinePool.connect(psp).drawdown(drawdownAmount, "ORDER-001");
    });

    it("Should allow PSP to repay borrowed amount", async function () {
      const repayAmount = ethers.parseUnits("50000", 6);

      await expect(
        creditLinePool.connect(psp).repay(repayAmount)
      ).to.emit(creditLinePool, "Repayment");

      expect(await creditLinePool.utilizedAmount()).to.equal(
        ethers.parseUnits("50000", 6)
      );
    });

    it("Should reject repayment exceeding utilized amount", async function () {
      const repayAmount = ethers.parseUnits("150000", 6);

      await expect(
        creditLinePool.connect(psp).repay(repayAmount)
      ).to.be.revertedWith("Repayment exceeds utilized amount");
    });
  });

  describe("Interest Calculation", function () {
    it("Should calculate interest correctly", async function () {
      const amount = ethers.parseUnits("100000", 6);
      
      // Fast forward 10 days
      await ethers.provider.send("evm_increaseTime", [10 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      const interest = await creditLinePool.calculateInterest(amount);
      
      // Expected: 100000 * 5 (bps) * 10 (days) / 10000 = 5000
      const expectedInterest = (amount * BigInt(UTILIZED_BIPS) * BigInt(10)) / BigInt(10000);
      expect(interest).to.equal(expectedInterest);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow admin to pause credit line", async function () {
      await creditLinePool.connect(admin).pauseCreditLine();
      expect(await creditLinePool.isActive()).to.equal(false);
    });

    it("Should allow admin to reactivate credit line", async function () {
      await creditLinePool.connect(admin).pauseCreditLine();
      await creditLinePool.connect(admin).reactivateCreditLine();
      expect(await creditLinePool.isActive()).to.equal(true);
    });

    it("Should reject non-admin pause attempt", async function () {
      await expect(
        creditLinePool.connect(psp).pauseCreditLine()
      ).to.be.revertedWith("Only admin can call this function");
    });
  });

  describe("Pool Status", function () {
    it("Should return correct pool status", async function () {
      const status = await creditLinePool.getPoolStatus();
      
      expect(status[0]).to.equal(psp.address); // PSP address
      expect(status[1]).to.equal(CREDIT_LIMIT); // Credit limit
      expect(status[2]).to.equal(0); // Utilized amount
      expect(status[3]).to.equal(CREDIT_LIMIT); // Remaining credit
      expect(status[4]).to.equal(true); // Is active
    });
  });
});
