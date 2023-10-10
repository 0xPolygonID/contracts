import {
  CreateZKProofRequestProps,
  OnChainZKP,
  ZeroKnowledgeProofRequest,
} from "@nexeraprotocol/nexera-id-schemas";
import { getNexeraIdPolygonIdIssuer } from "@nexeraprotocol/vc-issuer-polygon-id";

import { ScenarioWhitelist } from "../../types";
import { TEST_USER_CREDENTIAL_SUBJECT } from "./constants/idScanConstant";
import { SIMPLE_TSF_COST } from "./constants/testConstants";
import { createChallenge } from "./createChallenge";
import { issueCredentialAndSaveToWallet } from "./issueCredentialAndSaveToWallet";
import { setupHolder } from "./setup";
import { prepareInputs, prepareInputsForWhitelist } from "./zkProofUtils";

export const get2ZKPsForUserWhitelist = async () => {
  // Setup Issuer and wallet
  const holder = await setupHolder();
  const issuerNexera = getNexeraIdPolygonIdIssuer({
    env: "dev",
    username: process.env.TEST_VC_ISSUER_USERNAME!,
    password: process.env.TEST_VC_ISSUER_PASSWORD!,
  });

  // Issue credential and save to wallet
  await issueCredentialAndSaveToWallet(issuerNexera, holder, {
    type: "ProofOfResidence",
    credentialSubject: {
      id: holder.did.string(),
      journeyId: "789",
      base64: "iVBORw0KGgoAAAANSUhEUgAAA",
      name: "proofOfResidence.jpg",
      documentType: "image/jpeg",
      country: "GBR",
    },
  });
  await issueCredentialAndSaveToWallet(issuerNexera, holder, {
    type: "IDScan",
    credentialSubject: {
      id: holder.did.string(),
      ...TEST_USER_CREDENTIAL_SUBJECT,
    },
  });

  // Fetch Request from zk api (ProofOfResidence)
  const result1 = await fetch("http://localhost:3013/api/zk-request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requestId: 1,
      query: {
        id: 1,
        type: "ProofOfResidence",
        attribute: "country",
        value: "USA",
        operator: "$ne",
      },
      onChainVerification: true,
    } as CreateZKProofRequestProps),
  });
  const apiZkProofRequestProofOfResidence =
    (await result1.json()) as ZeroKnowledgeProofRequest;

  // Fetch Request from zk api (IDScan)
  const result2 = await fetch("http://localhost:3013/api/zk-request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requestId: 2,
      query: {
        id: 2,
        type: "IDScan",
        attribute: "age",
        value: 18,
        operator: "$gt",
      },
      onChainVerification: true,
    } as CreateZKProofRequestProps),
  });
  const apiZkProofRequestIDScan =
    (await result2.json()) as ZeroKnowledgeProofRequest;

  // Create challenge for the request
  const { challenge, address } = await createChallenge();

  // Create Proof for ProofOfResidence
  const zkpProofOfResidence = await holder.createZKProof({
    zkProofReq: apiZkProofRequestProofOfResidence,
    proofGenerationOptions: { challenge, skipRevocation: true },
  });

  const zkpProofOfResidenceOnChain: OnChainZKP = prepareInputsForWhitelist(
    zkpProofOfResidence.proof,
    zkpProofOfResidence.requestId,
  );

  // Create Proof for IDScan
  const zkpIDScan = await holder.createZKProof({
    zkProofReq: apiZkProofRequestIDScan,
    proofGenerationOptions: { challenge, skipRevocation: true },
  });
  const zkpIDScanOnChain: OnChainZKP = prepareInputsForWhitelist(
    zkpIDScan.proof,
    zkpIDScan.requestId,
  );

  return {
    zkpIDScanOnChain,
    zkpProofOfResidenceOnChain,
    address,
    zkpProofOfResidence,
    zkpIDScan,
  };
};
