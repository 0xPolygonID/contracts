import { byteEncoder, createSchemaHash } from "@0xpolygonid/js-sdk";
import {
  getDocumentLoader,
  Merklizer,
  Path,
} from "@iden3/js-jsonld-merklization";

import {
  CredentialType,
  getCredentialSchemaLocation,
} from "@nexeraprotocol/nexera-id-schemas";

// // you can run https://go.dev/play/p/rnrRbxXTRY6 to get schema hash and claimPathKey using YOUR schema
// // Note: use script in ./go-script-example.md
// const schemaBigInt = "74977327600848231385663280181476307657";

// // merklized path to field in the W3C credential according to JSONLD  schema e.g. birthday in the KYCAgeCredential under the url "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld"
// const schemaClaimPathKey =
//   "20376033832371109177683048456014525905119173674985843915445634726167450989630";

const pathToCredentialSubject =
  "https://www.w3.org/2018/credentials#credentialSubject";

// this function generates the necessary inputs to setRequest on the whitelist contract
// to setup the conditions under which a proof is valid
export async function generateRequestData(
  credentialType: CredentialType,
  fieldName: string,
  fieldValue: string | number
) {
  const url = getCredentialSchemaLocation({
    credentialType,
    type: "jsonld",
    env: "dev",
  });
  const opts = { ipfsGatewayURL: "https://ipfs.io" }; // can be your IFPS gateway if your work with ipfs schemas or empty object
  const ldCtx = (await getDocumentLoader(opts)(url)).document;
  const ldJSONStr = JSON.stringify(ldCtx);
  const typeId = await Path.getTypeIDFromContext(ldJSONStr, credentialType);
  const schemaHash = createSchemaHash(byteEncoder.encode(typeId));

  // you can use custom IPFS
  const path = await Path.getContextPathKey(
    ldJSONStr,
    credentialType,
    fieldName,
    opts
  );
  path.prepend([pathToCredentialSubject]);
  const pathBigInt = await path.mtEntry();

  //console.log("path", pathBigInt.toString());

  const fieldInfo = {
    pathToField: `${credentialType}.${fieldName}`,
    value: fieldValue,
  };

  const datatype = await Path.newTypeFromContext(
    ldJSONStr,
    fieldInfo.pathToField
  );
  const hashedValue = await Merklizer.hashValue(datatype, fieldInfo.value);

  return {
    schemaHash: schemaHash.bigInt().toString(),
    schemaClaimPathKey: pathBigInt.toString(),
    formatedValue:
      datatype == "http://www.w3.org/2001/XMLSchema#string"
        ? hashedValue
        : fieldValue,
  };
}
