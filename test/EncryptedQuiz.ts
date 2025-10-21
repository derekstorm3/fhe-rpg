import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { EncryptedQuiz, EncryptedQuiz__factory } from "../types";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("EncryptedQuiz")) as EncryptedQuiz__factory;
  const quizContract = (await factory.deploy()) as EncryptedQuiz;
  const quizAddress = await quizContract.getAddress();

  return { quizContract, quizAddress };
}

describe("EncryptedQuiz", function () {
  let signers: Signers;
  let quizContract: EncryptedQuiz;
  let quizAddress: string;

  before(async function () {
    const availableSigners = await ethers.getSigners();
    signers = { deployer: availableSigners[0], alice: availableSigners[1], bob: availableSigners[2] };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn("EncryptedQuiz tests require the FHEVM mock provider");
      this.skip();
    }

    ({ quizContract, quizAddress } = await deployFixture());
  });

  it("initial state has zero score", async function () {
    const encryptedScore = await quizContract.getEncryptedScore(signers.alice.address);
    expect(encryptedScore).to.eq(ethers.ZeroHash);

    const answered = await quizContract.hasAnswered(signers.alice.address, 0);
    expect(answered).to.eq(false);
  });

  it("awards encrypted points for a correct answer", async function () {
    const encryptedOption = await fhevm
      .createEncryptedInput(quizAddress, signers.alice.address)
      .add32(0)
      .encrypt();

    const tx = await quizContract
      .connect(signers.alice)
      .submitAnswer(0, encryptedOption.handles[0], encryptedOption.inputProof);
    await tx.wait();

    const encryptedScore = await quizContract.getEncryptedScore(signers.alice.address);
    const clearScore = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedScore,
      quizAddress,
      signers.alice,
    );
    expect(clearScore).to.eq(50);

    const encryptedResult = await quizContract.getEncryptedResult(signers.alice.address, 0);
    const clearResult = await fhevm.userDecryptEbool(encryptedResult, quizAddress, signers.alice);
    expect(clearResult).to.eq(true);

    const alreadyAnswered = await quizContract.hasAnswered(signers.alice.address, 0);
    expect(alreadyAnswered).to.eq(true);
  });

  it("does not increase score for wrong answers", async function () {
    const encryptedOption = await fhevm
      .createEncryptedInput(quizAddress, signers.alice.address)
      .add32(0)
      .encrypt();

    await quizContract.connect(signers.alice).submitAnswer(0, encryptedOption.handles[0], encryptedOption.inputProof);

    const incorrectOption = await fhevm
      .createEncryptedInput(quizAddress, signers.alice.address)
      .add32(0)
      .encrypt();

    const tx = await quizContract
      .connect(signers.alice)
      .submitAnswer(1, incorrectOption.handles[0], incorrectOption.inputProof);
    await tx.wait();

    const encryptedScore = await quizContract.getEncryptedScore(signers.alice.address);
    const clearScore = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedScore,
      quizAddress,
      signers.alice,
    );
    expect(clearScore).to.eq(50);

    const encryptedResult = await quizContract.getEncryptedResult(signers.alice.address, 1);
    const clearResult = await fhevm.userDecryptEbool(encryptedResult, quizAddress, signers.alice);
    expect(clearResult).to.eq(false);
  });

  it("prevents answering the same question twice", async function () {
    const encryptedOption = await fhevm
      .createEncryptedInput(quizAddress, signers.alice.address)
      .add32(0)
      .encrypt();

    await quizContract.connect(signers.alice).submitAnswer(0, encryptedOption.handles[0], encryptedOption.inputProof);

    await expect(
      quizContract.connect(signers.alice).submitAnswer(0, encryptedOption.handles[0], encryptedOption.inputProof),
    ).to.be.revertedWith("Question already answered");
  });
});
