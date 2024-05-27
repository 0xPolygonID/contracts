import { ethers } from 'hardhat';

async function main() {
  const erc20verifierAddress = '0x87932cB2A245e729e285CA118fFcbA9d55dd8b54';

  const ERC20Verifier = await ethers.getContractFactory('ERC20SelectiveDisclosureVerifierWithAttestations');
  const erc20Verifier = await ERC20Verifier.attach(erc20verifierAddress);
  console.log(erc20Verifier, ' attached to:', await erc20Verifier.getAddress());

  const tx = await erc20Verifier.setPortalInfo('0xbDCAa137758fa3106b42b22872102A2605Cd64F0', '0x59a0acecb3a782c9035cb1d0e8d5661f6848ebcb4d44c212c891d0fbc06c081e');
  console.log(tx);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
