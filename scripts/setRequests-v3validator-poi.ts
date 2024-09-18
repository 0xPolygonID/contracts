import { ethers } from 'hardhat';
import { packV3ValidatorParams } from '../test/utils/pack-utils';
import { Blockchain, DID, DidMethod, NetworkId } from '@iden3/js-iden3-core';
import { buildVerifierId, calculateQueryHashV3, coreSchemaFromStr } from '../test/utils/utils';
import { Merklizer, Path } from '@iden3/js-jsonld-merklization';
import { byteEncoder, calculateCoreSchemaHash } from '@0xpolygonid/js-sdk';
const Operators = {
  NOOP: 0, // No operation, skip query verification in circuit
  EQ: 1, // equal
  LT: 2, // less than
  GT: 3, // greater than
  IN: 4, // in
  NIN: 5, // not in
  NE: 6, // not equal
  SD: 16, // selective disclosure
  LTE: 7, // less than equal
  GTE: 8, // greater than equal
  BETWEEN: 9, // between
  NONBETWEEN: 10, // non between
  EXISTS: 11 // exists
};

export const QueryOperators = {
  $noop: Operators.NOOP,
  $eq: Operators.EQ,
  $lt: Operators.LT,
  $gt: Operators.GT,
  $in: Operators.IN,
  $nin: Operators.NIN,
  $ne: Operators.NE,
  $sd: Operators.SD,
  $between: Operators.BETWEEN,
  $nonbetween: Operators.NONBETWEEN,
  $exists: Operators.EXISTS,
  $lte: Operators.LTE,
  $gte: Operators.GTE
};

const KYC_EXCLUDED_COUNTRIES = {
  Afghanistan: 4,
  'American Samoa': 16,
  Anguilla: 660,
  'Antigua and Barbuda': 28,
  Belarus: 112,
  'Bosnia and Herzegovina': 70,
  'Central African Republic': 140,
  Cuba: 192,
  'DR Congo': 180,
  Ethiopia: 231,
  Fiji: 242,
  Guam: 316,
  'Hong Kong': 344,
  Iran: 364,
  Iraq: 368,
  Kosovo: 999,
  Lebanon: 422,
  Libya: 434,
  Mali: 466,
  Montenegro: 499,
  Myanmar: 104,
  Nicaragua: 558,
  'North Korea': 408,
  'North Macedonia': 807,
  Palau: 585,
  Panama: 591,
  Russia: 643,
  Samoa: 882,
  Serbia: 688,
  Somalia: 706,
  'South Sudan': 728,
  Sudan: 729,
  'Syrian Arab Republic': 760,
  Ukraine: 804,
  'US Virgin Islands': 850,
  Vanuatu: 548,
  Venezuela: 862,
  'Yemen, Rep': 887,
  'United Kingdom': 826,
  'United States': 840
};

const poiLd = `{
  "@context": [
    {
      "@version": 1.1,
      "@protected": true,
      "id": "@id",
      "type": "@type",
      "AnimaProofOfIdentity": {
        "@id": "https://raw.githubusercontent.com/anima-protocol/claims-polygonid/main/schemas/json-ld/poi-v2.json-ld#AnimaProofOfIdentity",
        "@context": {
          "@version": 1.1,
          "@protected": true,
          "id": "@id",
          "type": "@type",
          "kyc-vocab": "https://github.com/anima-protocol/claims-polygonid/blob/main/credentials/poi.md#",
          "xsd": "http://www.w3.org/2001/XMLSchema#",
          "firstname": {
            "@id": "kyc-vocab:firstname",
            "@type": "xsd:string"
          },
          "lastname": {
            "@id": "kyc-vocab:lastname",
            "@type": "xsd:string"
          },
          "date_of_birth_str": {
            "@id": "kyc-vocab:date_of_birth_str",
            "@type": "xsd:string"
          },
          "date_of_birth": {
            "@id": "kyc-vocab:date_of_birth",
            "@type": "xsd:integer"
          },
          "nationality": {
            "@id": "kyc-vocab:nationality",
            "@type": "xsd:string"
          },
          "document_country": {
            "@id": "kyc-vocab:document_country",
            "@type": "xsd:string"
          },
          "document_type": {
            "@id": "kyc-vocab:document_type",
            "@type": "xsd:string"
          },
          "document_number": {
            "@id": "kyc-vocab:document_number",
            "@type": "xsd:string"
          },
          "document_expiration_str": {
            "@id": "kyc-vocab:document_expiration_str",
            "@type": "xsd:string"
          },
          "document_expiration": {
            "@id": "kyc-vocab:document_expiration",
            "@type": "xsd:integer"
          },
          "kyc_validated": {
            "@id": "kyc-vocab:kyc_validated",
            "@type": "xsd:boolean"
          },
          "kyc_aml_validated": {
            "@id": "kyc-vocab:kyc_aml_validated",
            "@type": "xsd:boolean"
          },
          "document_country_code": {
            "@id": "kyc-vocab:document_country_code",
            "@type": "xsd:integer"
          }
        }
      }
    }
  ]
}`;
async function main() {
  const validatorAddressV3 = '0xB752Eec418f178ac8B48f15962B55c37F8D4748d';
  const erc20verifierAddress = '0xdE9eBC446d69EF9a876a377e3E3cEe91d08fE2A0';
  const excludedCountryCodes = Object.values(KYC_EXCLUDED_COUNTRIES).sort((a, b) => a - b);

  const UniversalVerifierFactory = await ethers.getContractFactory('UniversalVerifier');
  const universalVerifier = await UniversalVerifierFactory.attach(erc20verifierAddress); // current mtp validator address on mumbai
  console.log(universalVerifier, ' attached to:', await universalVerifier.getAddress());

  const schemaClaimPathKeyCountry =
    '3575516182025082671176914081873706243384371786539686535181502956761345737729';
  const schema = '171923472036017675847233769422329359923';

  const verifierId = buildVerifierId(await universalVerifier.getAddress(), {
    blockchain: Blockchain.Polygon,
    networkId: NetworkId.Amoy,
    method: DidMethod.Iden3
  });

  const requestId = 34;
  const countryNIN = {
    requestId,
    schema: schema,
    claimPathKey: schemaClaimPathKeyCountry,
    operator: Operators.NIN,
    value: excludedCountryCodes,
    slotIndex: 0,
    queryHash: '',
    circuitIds: ['credentialAtomicQueryV3OnChain-beta.1'],
    // allowedIssuers: ['did:iden3:privado:main:2ScrbEuw9jLXMapW3DELXBbDco5EURzJZRN1tYj7L7'],
    allowedIssuers: ['did:iden3:privado:main:2SdUfDwHK3koyaH5WzhvPhpcjFfdem2xD625aymTNc'],
    skipClaimRevocationCheck: false,
    verifierID: verifierId.bigInt(),
    nullifierSessionID: requestId,
    groupID: 0,
    proofType: 0
  };

  countryNIN.queryHash = calculateQueryHashV3(
    countryNIN.value.map((i) => BigInt(i)),
    coreSchemaFromStr(schema),
    countryNIN.slotIndex,
    countryNIN.operator,
    countryNIN.claimPathKey,
    countryNIN.value.length,
    1, // merklized
    countryNIN.skipClaimRevocationCheck ? 0 : 1,
    countryNIN.verifierID.toString(),
    countryNIN.nullifierSessionID
  ).toString();

  const dataV3EmailSD = packV3ValidatorParams(countryNIN);

  const invokeRequestMetadataEmailSd = {
    id: '7f38a193-0918-4a48-9fac-36adfdb8b543',
    typ: 'application/iden3comm-plain-json',
    type: 'https://iden3-communication.io/proofs/1.0/contract-invoke-request',
    thid: '7f38a193-0918-4a48-9fac-36adfdb8b543',
    from: DID.parseFromId(verifierId).string(),
    body: {
      reason: 'for PoI testing',
      transaction_data: {
        contract_address: await universalVerifier.getAddress(),
        method_id: 'b68967e2',
        chain_id: 2442,
        network: 'zkevm_cardona'
      },
      scope: [
        {
          id: countryNIN.requestId,
          circuitId: countryNIN.circuitIds[0],
          query: {
            allowedIssuers: !countryNIN.allowedIssuers.length ? ['*'] : countryNIN.allowedIssuers,
            context:
              'https://raw.githubusercontent.com/anima-protocol/claims-polygonid/main/schemas/json-ld/poi-v2.json-ld',
            credentialSubject: {
              document_country_code: {
                $nin: excludedCountryCodes
              }
            },
            type: 'AnimaProofOfIdentity'
          }
        }
      ]
    }
  };

  await universalVerifier.setZKPRequest(requestId, {
    metadata: JSON.stringify(invokeRequestMetadataEmailSd),
    validator: validatorAddressV3,
    data: dataV3EmailSD
  });

  console.log(JSON.stringify(invokeRequestMetadataEmailSd, null, '\t'));
  console.log(`Request ID: ${requestId} is set`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
