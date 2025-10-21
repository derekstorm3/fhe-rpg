import * as dotenv from "dotenv";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

dotenv.config();

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedQuiz = await deploy("EncryptedGameQuiz", {
    from: deployer,
    log: true,
  });

  const infuraKey = process.env.INFURA_API_KEY;
  if (!infuraKey) {
    console.warn("INFURA_API_KEY is not set. Sepolia deployment will fail without it.");
  }

  console.log(`EncryptedQuiz contract: ${deployedQuiz.address}`);
};
export default func;
func.id = "deploy_encryptedQuiz"; // id required to prevent reexecution
func.tags = ["EncryptedQuiz"];
