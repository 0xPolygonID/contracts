import { ethers } from 'hardhat';

async function main() {
  const veraxVerifierAddress = '0x975218461843300C46683e2F16B5FA781E7ef97f';

  const veraxVerifierFactory = await ethers.getContractFactory('VeraxZKPVerifier');
  const verax = await veraxVerifierFactory.attach(veraxVerifierAddress);
  console.log(verax, ' attached to:', await verax.getAddress());

  const requestId = 575757;
  const schemaId = '0x59a0acecb3a782c9035cb1d0e8d5661f6848ebcb4d44c212c891d0fbc06c081e';
  const schemaType = 1;

  const portalAddress = '0xe4Dd9A4FE93cd486e7A2b5a83461896eF5c4F01F';
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
