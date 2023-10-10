import type { IDScanCredentialSubject } from "@nexeraprotocol/nexera-id-schemas";
import { CredentialStatusType } from "@nexeraprotocol/vc-verifier-polygon-id";

export const TEST_USER_CREDENTIAL_SUBJECT: Omit<IDScanCredentialSubject, "id"> =
  {
    entryDate: "2023-06-29",
    age: 25,
    addressLine1: "123 Main St",
    addressLine2: "Apt 1",
    birthDate: "2023-06-29",
    birthPlace: "New York, NY",
    citizenship: "USA",
    documentCategory: "Drivers License",
    documentName: "John Doe",
    documentSide: "Front",
    documentType: "Drivers License",
    entryTime: "123123",
    firstName: "John",
    gender: "Male",
    faceMatchScore: "qwe",
    fullName: "John Doe",
    highLevelResult: "Passed",
    highLevelResultDetails: {
      accumulativeLivenessResult: "Passed",
      documentBlockingPolicy: "Passed",
      documentExpiry: "Passed",
      documentSupport: "Passed",
      documentValidation: "Passed",
      faceMatchValidation: "Passed",
      documentOverallValidation: "Passed",
    },
    lastName: "Doe",
    middleName: "Middle",
    journeyId: "1234",
    qualityCheckDetails: [
      {
        id: "1234",
        title: "1234",
        state: 1,
        description: "1234",
      },
    ],
    validationDetails: [
      {
        name: "1234",
        description: "1234",
        result: 2,
      },
    ],
  };

// this is what is used to create the credential
export const testIdScanRequest = (id: string) => {
  return {
    credentialSchema: `https://raw.githubusercontent.com/NexeraProtocol/vc-schemas/kris-test/examples/idscan-new5/idscan.json`,
    type: "IDScan",
    expiration: 1924984800,
    credentialSubject: {
      id: id,
      ...TEST_USER_CREDENTIAL_SUBJECT,
    },
    revocationOpts: {
      type: CredentialStatusType.Iden3ReverseSparseMerkleTreeProof,
      id: "https://rhs-staging.polygonid.me",
    },
  };
};
