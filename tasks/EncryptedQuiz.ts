import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

const CONTRACT_NAME = "EncryptedQuiz";

task("task:address", "Prints the EncryptedQuiz address").setAction(async function (_taskArguments: TaskArguments, hre) {
  const { deployments } = hre;
  const deployment = await deployments.get(CONTRACT_NAME);
  console.log(`${CONTRACT_NAME} address is ${deployment.address}`);
});

task("task:score", "Decrypts the caller score")
  .addOptionalParam("address", "Optionally specify the EncryptedQuiz contract address")
  .addOptionalParam("player", "Optionally specify player address (defaults to signer[0])")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const deployment = taskArguments.address ? { address: taskArguments.address } : await deployments.get(CONTRACT_NAME);
    const signers = await ethers.getSigners();
    const playerAddress = taskArguments.player ? String(taskArguments.player) : signers[0].address;

    const quizContract = await ethers.getContractAt(CONTRACT_NAME, deployment.address);
    const encryptedScore = await quizContract.getEncryptedScore(playerAddress);

    if (encryptedScore === ethers.ZeroHash) {
      console.log(`Encrypted score: ${encryptedScore}`);
      console.log("Score: 0");
      return;
    }

    const playerSigner = signers.find((signer) => signer.address.toLowerCase() === playerAddress.toLowerCase());
    if (!playerSigner) {
      throw new Error(`Signer for ${playerAddress} not available to decrypt`);
    }

    const clearScore = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedScore,
      deployment.address,
      playerSigner,
    );

    console.log(`Encrypted score: ${encryptedScore}`);
    console.log(`Score: ${clearScore}`);
  });

task("task:result", "Decrypts the answer result for a question")
  .addParam("question", "Question id")
  .addOptionalParam("address", "Optionally specify the EncryptedQuiz contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const questionId = parseInt(taskArguments.question);
    if (!Number.isInteger(questionId)) {
      throw new Error("--question must be an integer");
    }

    await fhevm.initializeCLIApi();

    const deployment = taskArguments.address ? { address: taskArguments.address } : await deployments.get(CONTRACT_NAME);
    const signers = await ethers.getSigners();
    const caller = signers[0];

    const quizContract = await ethers.getContractAt(CONTRACT_NAME, deployment.address);
    const encryptedResult = await quizContract.getEncryptedResult(caller.address, questionId);

    if (encryptedResult === ethers.ZeroHash) {
      console.log(`Encrypted result: ${encryptedResult}`);
      console.log("Result: unanswered");
      return;
    }

    const clearResult = await fhevm.userDecryptEbool(encryptedResult, deployment.address, caller);
    console.log(`Encrypted result: ${encryptedResult}`);
    console.log(`Result: ${clearResult ? "correct" : "incorrect"}`);
  });

task("task:answer", "Submit an encrypted answer")
  .addParam("question", "Question id")
  .addParam("option", "Option index (0 or 1)")
  .addOptionalParam("address", "Optionally specify the EncryptedQuiz contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const questionId = parseInt(taskArguments.question);
    const optionIndex = parseInt(taskArguments.option);

    if (!Number.isInteger(questionId)) {
      throw new Error("--question must be an integer");
    }
    if (optionIndex !== 0 && optionIndex !== 1) {
      throw new Error("--option must be 0 or 1");
    }

    await fhevm.initializeCLIApi();

    const deployment = taskArguments.address ? { address: taskArguments.address } : await deployments.get(CONTRACT_NAME);
    const signers = await ethers.getSigners();
    const caller = signers[0];

    const quizContract = await ethers.getContractAt(CONTRACT_NAME, deployment.address);

    const encryptedOption = await fhevm
      .createEncryptedInput(deployment.address, caller.address)
      .add32(optionIndex)
      .encrypt();

    const tx = await quizContract
      .connect(caller)
      .submitAnswer(questionId, encryptedOption.handles[0], encryptedOption.inputProof);

    console.log(`Waiting for tx: ${tx.hash}...`);
    const receipt = await tx.wait();
    console.log(`tx: ${tx.hash} status=${receipt?.status}`);

    console.log(`Submitted answer ${optionIndex} for question ${questionId}`);
  });
