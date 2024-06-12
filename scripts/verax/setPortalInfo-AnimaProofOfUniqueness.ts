import { ethers } from 'hardhat';

async function main() {
  const veraxVerifierAddress = '0x975218461843300C46683e2F16B5FA781E7ef97f';

  const veraxVerifierFactory = await ethers.getContractFactory('VeraxZKPVerifier');
  const verax = await veraxVerifierFactory.attach(veraxVerifierAddress);
  console.log(verax, ' attached to:', await verax.getAddress());

  const requestId = 100002;
  const schemaId = '0x2bc6511034614a23bcbdfaa8055005b5ff2e416032dad968313a1caa980538e6';
  const schemaType = 0; // PoU

  const portalAddress = '0x52dEA76F098a5897757F49f639f93A39fC435AE2';
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
