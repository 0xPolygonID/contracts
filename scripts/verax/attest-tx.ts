import { ethers } from 'hardhat';

async function main() {
  const portalAddr = '0x780d6cEA92B8BA2a76939bEc4f00771dBC4D79C3';
  const portal = await ethers.getContractAt('IPortal', portalAddr);

  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  const encodetSubject = abiCoder.encode(
    ['uint256'],
    ['21947821518962939314223753062600516493439826064799158636175370094818183170']
  );

  const encodetData = abiCoder.encode(
    ['uint64', 'uint256'],
    ['100', '123']
  );

  console.log(encodetData);
  await portal.attest({
        schemaId: '0x59a0acecb3a782c9035cb1d0e8d5661f6848ebcb4d44c212c891d0fbc06c081e', 
        expirationDate: 1747986521,
        subject: encodetSubject,
        attestationData: encodetData
    }, ['0x00']);

    const attestationRegistryAddress = await portal.attestationRegistry();
    console.log(attestationRegistryAddress);
    const attestationRegistry = await ethers.getContractAt('AttestationRegistry', attestationRegistryAddress);
    const count = await attestationRegistry.getAttestationIdCounter();
    console.log(count);
  
    attestationRegistry.on('AttestationRegistered', async (attestationId) => {
      console.log(attestationId, 'attestation registered!');
  
      const attestation = await attestationRegistry.getAttestation(attestationId);
      const abiCoder = ethers.AbiCoder.defaultAbiCoder();
      const decoded = 
          abiCoder.decode(
          ['(uint64 requestId, uint256 nullifierSessionID)'],
          attestation.attestationData
          );
      console.log(decoded);
    });
  
  
    const delay = ms => new Promise(res => setTimeout(res, ms));
    await delay(5000);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
