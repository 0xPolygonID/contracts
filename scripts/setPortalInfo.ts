import { ethers } from 'hardhat';

async function main() {
  const veraxVerifierAddress = '0x04669EFfB55D3Ed7EEeC10b6E8227405AEA9B33a';

  const veraxVerifierFactory = await ethers.getContractFactory('VeraxZKPVerifier');
  const verax = await veraxVerifierFactory.attach(veraxVerifierAddress);
  console.log(verax, ' attached to:', await verax.getAddress());

  const tx = await verax.setPortalInfo(
    '0x0a5Fd0b1694F0A9926FAbf0b3f2f7226BB0793E9',
    '0x59a0acecb3a782c9035cb1d0e8d5661f6848ebcb4d44c212c891d0fbc06c081e'
  );
  console.log(tx);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
