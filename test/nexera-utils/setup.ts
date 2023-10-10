import {
  core,
  getOrCreatePolygonIdIdentity,
} from "@nexeraprotocol/did-vc-holder";

import { POLYGON_ID_CONTRACT } from "./constants/contractAddresses";
import { RHS_URL } from "./constants/testConstants";
import { generateRandomKey } from "./keys";

export const setupHolder = async () => {
  const holder = await getOrCreatePolygonIdIdentity({
    rpcUrl: "https://polygon-mumbai.blockpi.network/v1/rpc/public",
    rhsUrl: RHS_URL,
    contractAddress: POLYGON_ID_CONTRACT,
    keyPair: generateRandomKey(),
    memory: true,
  });

  await holder.initCircuits({
    circuitsFolder: "./circuits_zk_verifier",
    memory: true,
    nodeEnv: true,
  });

  return holder;
};

export const setupIssuer = async () => {
  const { identityWallet, did, initCircuits } =
    await getOrCreatePolygonIdIdentity({
      rpcUrl: "https://polygon-mumbai.blockpi.network/v1/rpc/public",
      rhsUrl: RHS_URL,
      contractAddress: POLYGON_ID_CONTRACT,
      keyPair: generateRandomKey(),
      memory: true,
    });

  await initCircuits({
    circuitsFolder: "./circuits_zk_verifier",
    memory: true,
    nodeEnv: true,
  });

  return {
    identityWallet,
    did: core.DID.parse(did.string()),
  };
};
