const hre = require('hardhat');

async function main() {
  const ZenAgentRegistry = await hre.ethers.getContractFactory('ZenAgentRegistry');
  const zen = await ZenAgentRegistry.deploy();
  await zen.waitForDeployment();

  const address = await zen.getAddress();
  console.log('ZenAgentRegistry deployed to:', address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
