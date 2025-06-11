const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying PictureNFT with account:", deployer.address);

  const PictureNFT = await hre.ethers.getContractFactory("PictureNFT");
  const pictureNFT = await PictureNFT.deploy(deployer.address);

  await pictureNFT.waitForDeployment();

  console.log(" PictureNFT deployed at:", await pictureNFT.getAddress());
}

main()
  .then(() => console.log(" Done"))
  .catch((err) => console.error(" Error:", err));
