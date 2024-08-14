import { VeraxSdk } from "@verax-attestation-registry/verax-sdk";


async function main() {
  const veraxSdk = new VeraxSdk(VeraxSdk.DEFAULT_LINEA_MAINNET);
  const attestations: { attestationData: `0x${string}`; subject: `0x${string}` }[] = [];
  let i = 0;
  while (true) {
    const attestationsBatch = (await veraxSdk.attestation.findBy(100, i * 100, {
      schemaId: '0x021fa993b2ac55b95340608478282821b89398de6fa14073b4d44a3564a8c79d' // PoU schema in LINEA MAIN
    })) as { attestationData: `0x${string}`; subject: `0x${string}` }[];
    attestations.push(...attestationsBatch);
    console.log(attestations.length);
    i++;
    if (attestationsBatch.length < 100) {
      break;
    }
  }

  let repLvl1Count = 0;
  let repVl2Count = 0;
  for (let i = 0; i < attestations.length; i++) {
    const decoded = veraxSdk.utils.decode(
      '(uint64 requestId, uint256 nullifierSessionID, uint256 reputationLevel)',
      attestations[i].attestationData as `0x${string}`
    ) as unknown as { requestId: number; nullifierSessionID: string; reputationLevel: bigint }[];
    const reputationLvlStr = decoded[0].reputationLevel.toString();
    if (reputationLvlStr == '1') {
      repLvl1Count++;
    } else if (reputationLvlStr == '2') {
      repVl2Count++;
    } else {
      throw new Error('Invalid reputation level');
    }
  }

  console.log('Reputation level 1 count:', repLvl1Count);
  console.log('Reputation level 2 count:', repVl2Count);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
