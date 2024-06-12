import { ethers } from 'hardhat';

async function main() {
  const veraxVerifierAddress = '0x91a3a28B401adDeBcb5Cd0b1364474fF6255F00b';

  const veraxVerifierFactory = await ethers.getContractFactory('VeraxZKPVerifier');
  const verax = await veraxVerifierFactory.attach(veraxVerifierAddress);
  console.log(verax, ' attached to:', await verax.getAddress());

  const requestId = 100002;
  const schemaId = '0x2bc6511034614a23bcbdfaa8055005b5ff2e416032dad968313a1caa980538e6';
  const schemaType = 0; // PoU

  const portalAddress = '0x5FfDa857bF7c63A70ac1ABAE67a3368f0eE7dC27';
  const tx = await verax.setPortalInfo(
    requestId,
    portalAddress,
    schemaId,
    schemaType
  );
  console.log(tx);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
