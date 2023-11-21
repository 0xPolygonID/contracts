import fs from 'fs';
import path from 'path';
import { NonMerklizedOnchainIdentityDeployHelper } from '../test/helpers/NonMerklizedOnchainIdentityDeployHelper';
import { deployPoseidons } from '../test/utils/deploy-poseidons.util';
import { StateDeployHelper } from '../test/helpers/StateDeployHelper';
import { ethers } from 'hardhat';
const pathOutputJson = path.join(__dirname, './deploy_output.json');

async function main() {
  // const stateAddress = '0x624ce98D2d27b20b8f8d521723Df8fC4db71D79D'; // current iden3 state smart contract on main
  const stateAddress = '0x134b1be34911e39a8397ec6289782989729807a4'; // current iden3 state smart contract on mumbai

  const claimMetadata = {
    jsonldSchemaURL:
      'https://gist.githubusercontent.com/ilya-korotya/ac20f870943abd4805fe882ae8f3dccd/raw/1d9969a6d0454280c8d5e79b959faf9b3978b497/balance.jsonld',
    jsonldSchemaHash: BigInt('134825296953649542485291823871789853562'),
    jsonSchemaURL:
      'https://gist.githubusercontent.com/ilya-korotya/26ba81feb4da2f49f4b473661b80e8e3/raw/32113f4725088f32f31a6b06b4abdc94bc4b2d17/balance.json',
    credentialType: 'Balance'
  };

  const owner = (await ethers.getSigners())[0];
  const [poseidon2Elements, poseidon3Elements, poseidon4Elements] = await deployPoseidons(
    owner,
    [2, 3, 4]
  );
  const stDeployHelper = await StateDeployHelper.initialize(owner, true);
  const smtLib = await stDeployHelper.deploySmtLib(
    poseidon2Elements.address,
    poseidon3Elements.address
  );

  const nonMerklizedOnchaiDeployer = await NonMerklizedOnchainIdentityDeployHelper.initialize(
    [owner],
    true
  );
  const contracts = await nonMerklizedOnchaiDeployer.deployIdentity(
    smtLib,
    poseidon3Elements,
    poseidon4Elements,
    // claim metadata
    stateAddress,
    claimMetadata.jsonldSchemaURL,
    claimMetadata.jsonldSchemaHash,
    claimMetadata.jsonSchemaURL,
    claimMetadata.credentialType
  );

  const identity = contracts.identity;

  const outputJson = {
    state: stateAddress,
    smtLib: smtLib.address,
    identity: identity.address,
    poseidon2: poseidon2Elements.address,
    poseidon3: poseidon3Elements.address,
    poseidon4: poseidon4Elements.address,
    network: process.env.HARDHAT_NETWORK
  };
  fs.writeFileSync(pathOutputJson, JSON.stringify(outputJson, null, 1));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
