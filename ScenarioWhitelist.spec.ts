// import { expect } from "chai";
// import { ethers } from "hardhat";

// import type {
//   CreateZKProofRequestProps,
//   ZeroKnowledgeProofRequest,
// } from "@nexeraprotocol/nexera-id-schemas";
// import { getNexeraIdPolygonIdIssuer } from "@nexeraprotocol/vc-issuer-polygon-id";

// import { deployScenarioWhitelist } from "../lib/deploy/deployScenarioWhitelist";
// import { ScenarioWhitelist } from "./typechain";
// import { TEST_USER_CREDENTIAL_SUBJECT } from "./test/nexera-utils/constants/idScanConstant";
// import { SIMPLE_TSF_COST } from "./test/nexera-utils/constants/testConstants";
// import { createChallenge } from "./test/nexera-utils/createChallenge";
// import { get2ZKPsForUserWhitelist } from "./test/nexera-utils/get2ZKPsForUserWhitelist";
// import { issueCredentialAndSaveToWallet } from "./test/nexera-utils/issueCredentialAndSaveToWallet";
// import { setupHolder } from "./test/nexera-utils/setup";
// import { setupScenario2Rules } from "./test/nexera-utils/setupScenario2Rules";
// import { prepareInputs } from "./test/nexera-utils/zkProofUtils";

// describe(`ScenarioWhitelist: ProofOfResidence and IDScan`, function () {
//   let scenarioWhitelist: ScenarioWhitelist;

//   beforeEach(async () => {
//     scenarioWhitelist = await deployScenarioWhitelist();
//   });
//   it(`Should post zk proof for ProofOfResidence and IDScan`, async () => {
//     // Set up Scenrario with 2 Rules
//     await setupScenario2Rules(scenarioWhitelist);

//     // Setup Issuer and wallet
//     const holder = await setupHolder();
//     const issuerNexera = getNexeraIdPolygonIdIssuer({
//       env: "dev",
//       username: process.env.TEST_VC_ISSUER_USERNAME!,
//       password: process.env.TEST_VC_ISSUER_PASSWORD!,
//     });

//     // Issue credential and save to wallet
//     await issueCredentialAndSaveToWallet(issuerNexera, holder, {
//       type: "ProofOfResidence",
//       credentialSubject: {
//         id: holder.did.string(),
//         journeyId: "789",
//         base64: "iVBORw0KGgoAAAANSUhEUgAAA",
//         name: "proofOfResidence.jpg",
//         documentType: "image/jpeg",
//         country: "GBR",
//       },
//     });
//     await issueCredentialAndSaveToWallet(issuerNexera, holder, {
//       type: "IDScan",
//       credentialSubject: {
//         id: holder.did.string(),
//         ...TEST_USER_CREDENTIAL_SUBJECT,
//       },
//     });

//     // Fetch Request from zk api (ProofOfResidence)
//     const result1 = await fetch("http://localhost:3013/api/zk-request", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         requestId: 1,
//         query: {
//           id: 1,
//           type: "ProofOfResidence",
//           attribute: "country",
//           value: "USA",
//           operator: "$ne",
//         },
//         onChainVerification: true,
//       } as CreateZKProofRequestProps),
//     });
//     expect(result1).to.be.not.undefined;
//     const apiZkProofRequestProofOfResidence =
//       (await result1.json()) as ZeroKnowledgeProofRequest;

//     // Fetch Request from zk api (IDScan)
//     const result2 = await fetch("http://localhost:3013/api/zk-request", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         requestId: 2,
//         query: {
//           id: 2,
//           type: "IDScan",
//           attribute: "age",
//           value: 18,
//           operator: "$gt",
//         },
//         onChainVerification: true,
//       } as CreateZKProofRequestProps),
//     });
//     expect(result2).to.be.not.undefined;
//     const apiZkProofRequestIDScan =
//       (await result2.json()) as ZeroKnowledgeProofRequest;

//     // Create challenge for the request
//     const { challenge, address } = await createChallenge();

//     // Create Proof for ProofOfResidence
//     const ZKPProofOfResidence = await holder.createZKProof({
//       zkProofReq: apiZkProofRequestProofOfResidence,
//       proofGenerationOptions: { challenge, skipRevocation: true },
//     });
//     const ZKPProofOfResidenceFormated = prepareInputs(
//       ZKPProofOfResidence.proof
//     );

//     // Check address is not previously whitelisted
//     const isWhitelistedBefore = await scenarioWhitelist.isWhitelisted(address);
//     expect(isWhitelistedBefore).to.be.false;

//     // submit proof
//     const resp = await scenarioWhitelist.submitZKPResponse(
//       ZKPProofOfResidence.proof.id.toString(),
//       ZKPProofOfResidenceFormated.inputs,
//       ZKPProofOfResidenceFormated.pi_a,
//       ZKPProofOfResidenceFormated.pi_b,
//       ZKPProofOfResidenceFormated.pi_c
//     );
//     const rcp = await resp.wait();
//     console.log(
//       `ProofOfResidence gas used : ${rcp?.gasUsed}, which is ${
//         rcp && rcp.gasUsed / SIMPLE_TSF_COST
//       } times the cost of a simple tsf`
//     );

//     // test that user is whitelisted for rule 1 but not scenario
//     const isWhitelistedNow = await scenarioWhitelist.isWhitelisted(address);
//     expect(isWhitelistedNow).to.be.false;
//     const ruleWhitelist1 = await scenarioWhitelist.ruleIdsToWhitelist(
//       1,
//       address
//     );
//     expect(ruleWhitelist1).to.be.true;

//     // Whitelisting user should not succeed before rule 2 is whitelisted
//     await scenarioWhitelist.finalizeWhitelistScenario(address);
//     const isWhitelistedBeforeRule2 = await scenarioWhitelist.isWhitelisted(
//       address
//     );
//     expect(isWhitelistedBeforeRule2).to.be.false;

//     // Create Proof for IDScan
//     const ZKPIDScan = await holder.createZKProof({
//       zkProofReq: apiZkProofRequestIDScan,
//       proofGenerationOptions: { challenge, skipRevocation: true },
//     });
//     const ZKPIDScanFormated = prepareInputs(ZKPIDScan.proof);

//     // submit proof for IDScan
//     const respIDScan = await scenarioWhitelist.submitZKPResponse(
//       ZKPIDScan.proof.id.toString(),
//       ZKPIDScanFormated.inputs,
//       ZKPIDScanFormated.pi_a,
//       ZKPIDScanFormated.pi_b,
//       ZKPIDScanFormated.pi_c
//     );
//     const rcpIDScan = await respIDScan.wait();
//     console.log(
//       `IDScan gas used : ${rcpIDScan?.gasUsed}, which is ${
//         rcp && rcp.gasUsed / SIMPLE_TSF_COST
//       } times the cost of a simple tsf`
//     );

//     // test that user is whitelisted for rule 1 and rule 2 but not scenario
//     const isWhitelistedNow2 = await scenarioWhitelist.isWhitelisted(address);
//     expect(isWhitelistedNow2).to.be.false;
//     const ruleWhitelist2 = await scenarioWhitelist.ruleIdsToWhitelist(
//       2,
//       address
//     );
//     expect(ruleWhitelist2).to.be.true;

//     // Whitelist user, now that both rules are confirmed
//     await scenarioWhitelist.finalizeWhitelistScenario(address);
//     const isWhitelistedAfter = await scenarioWhitelist.isWhitelisted(address);
//     expect(isWhitelistedAfter).to.be.true;
//   });
//   it(`Should post zk proof for ProofOfResidence and IDScan using whitelistScenario (one call)`, async () => {
//     // Set up Scenrario with 2 Rules
//     await setupScenario2Rules(scenarioWhitelist);

//     // get the two ZKPs
//     const { zkpIDScanOnChain, zkpProofOfResidenceOnChain, address } =
//       await get2ZKPsForUserWhitelist();

//     // use whitelistScenario one call
//     await scenarioWhitelist.whitelistScenario([
//       zkpProofOfResidenceOnChain,
//       zkpIDScanOnChain,
//     ]);

//     // Check that user is whitelisted
//     const isWhitelistedAfter = await scenarioWhitelist.isWhitelisted(address);
//     expect(isWhitelistedAfter).to.be.true;
//   });
// });
