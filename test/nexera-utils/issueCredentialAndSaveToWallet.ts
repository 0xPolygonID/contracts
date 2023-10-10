import { VcHolder } from "@nexeraprotocol/did-vc-holder/src/types";
import {
  CredentialDiscrUnion,
  NexeraIssuer,
} from "@nexeraprotocol/vc-issuer-polygon-id";

export const issueCredentialAndSaveToWallet = async (
  issuerNexera: NexeraIssuer,
  holder: VcHolder,
  credential: CredentialDiscrUnion,
) => {
  const credentialNexeraId = await issuerNexera.createVerifiableCredential({
    credential,
    verificationMode: "sandbox",
    expiration: new Date("2024-06-29"),
  });
  const credentialNexera = await issuerNexera.getCredentialQRCode({
    id: credentialNexeraId,
    verificationMode: "sandbox",
  });
  const cred = await holder.handleCredentialOffer({
    credentialQrOffer: credentialNexera,
  });

  await holder.credentialWallet.saveAll(cred);
};
