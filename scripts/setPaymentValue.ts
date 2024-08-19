import { DID, DidMethod, registerDidMethodNetwork } from '@iden3/js-iden3-core';
import { ethers } from 'hardhat';
import { byteEncoder, calculateCoreSchemaHash } from '@0xpolygonid/js-sdk';
import { Path } from '@iden3/js-jsonld-merklization';

const ldContextJSONAnimaProofOfUniqueness = `{
  "@context": [
    {
      "@version": 1.1,
      "@protected": true,
      "id": "@id",
      "type": "@type",
      "AnimaProofOfUniqueness": {
        "@id": "https://raw.githubusercontent.com/anima-protocol/claims-polygonid/main/schemas/json-ld/pou-v1.json-ld#AnimaProofOfUniqueness",
        "@context": {
          "@version": 1.1,
          "@protected": true,
          "id": "@id",
          "type": "@type",
          "kyc-vocab": "https://github.com/anima-protocol/claims-polygonid/blob/main/credentials/pou.md#",
          "xsd": "http://www.w3.org/2001/XMLSchema#",
          "unique": {
            "@id": "kyc-vocab:unique",
            "@type": "xsd:boolean"
          },
          "user_hash": {
            "@id": "kyc-vocab:user_hash",
            "@type": "xsd:string"
          },
          "reputation_level": {
            "@id": "kyc-vocab:reputation_level",
            "@type": "xsd:integer"
          },
          "last_verification_timestamp": {
            "@id": "kyc-vocab:last_verification_timestamp",
            "@type": "xsd:integer"
          },
          "last_verification_date": {
            "@id": "kyc-vocab:last_verification_date",
            "@type": "xsd:integer"
          }
        }
      }
    }
  ]
}`;
const typeNameAnimaProofOfUniqueness = 'AnimaProofOfUniqueness';

const ldContextJSONAnimaProofOfLife = `{
  "@context": [
    {
      "@version": 1.1,
      "@protected": true,
      "id": "@id",
      "type": "@type",
      "AnimaProofOfLife": {
        "@id": "https://raw.githubusercontent.com/anima-protocol/claims-polygonid/main/schemas/json-ld/pol-v1.json-ld#AnimaProofOfLife",
        "@context": {
          "@version": 1.1,
          "@protected": true,
          "id": "@id",
          "type": "@type",
          "kyc-vocab": "https://github.com/anima-protocol/claims-polygonid/blob/main/credentials/pol.md#",
          "xsd": "http://www.w3.org/2001/XMLSchema#",
          "human": {
            "@id": "kyc-vocab:human",
            "@type": "xsd:boolean"
          }
        }
      }
    }
  ]
}`;
const typeNameAnimaProofOfLife= 'AnimaProofOfLife';

const pathToCredentialSubject = 'https://www.w3.org/2018/credentials#credentialSubject';

async function main() {
  const contractAddress = '0xE993B91d8FDeCb4bF87A4AD724b2e8284fc05820';
  const issuerDID = 'did:iden3:privado:main:2ScrbEuw9jLXMapW3DELXBbDco5EURzJZRN1tYj7L7';
  const valueInEther = '0.0003';
  const valueWei = ethers.parseUnits(valueInEther, 'ether');

  const paymentFactory = await ethers.getContractFactory('VCPayment');
  const payment = await paymentFactory.attach(contractAddress);

  registerDidMethodNetwork({
    method: DidMethod.Iden3,
    blockchain: "privado",
    chainId: 21000,
    network: "main",
    networkFlag: 0b1010_0000 | 0b0000_0001,
  });

  const issuerId = DID.idFromDID(DID.parse(issuerDID));

  const schemaId: string = await Path.getTypeIDFromContext(
    ldContextJSONAnimaProofOfUniqueness,
    typeNameAnimaProofOfUniqueness
  );

  console.log('schemaId', schemaId);
  const schemaHash = calculateCoreSchemaHash(byteEncoder.encode(schemaId));
  console.log('schemaHash', schemaHash.bigInt());
  console.log('issuerId', issuerId.bigInt());

  // const path = await Path.getContextPathKey(ldContextJSONAnimaProofOfUniqueness, typeNameAnimaProofOfUniqueness, 'human');
  // path.prepend([pathToCredentialSubject]);
  // const pathBigInt = await path.mtEntry();
  // console.log('claimPathKey', pathBigInt.toString());
  const tx = await payment.setPaymentValue(issuerId.bigInt(), schemaHash.bigInt(), valueWei);
  console.log(tx.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
