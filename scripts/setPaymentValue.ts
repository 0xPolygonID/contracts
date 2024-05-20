import { DID } from '@iden3/js-iden3-core';
import { ethers } from 'hardhat';
import { byteEncoder, calculateCoreSchemaHash } from '@0xpolygonid/js-sdk';
import { Path } from '@iden3/js-jsonld-merklization';

const ldContextJSON = `{
    "@context": [
      {
        "@version": 1.1,
        "@protected": true,
        "id": "@id",
        "type": "@type",
        "AnimaProofOfIdentity": {
          "@id": "https://raw.githubusercontent.com/anima-protocol/claims-polygonid/main/schemas/json-ld/poi-v1.json-ld#AnimaProofOfIdentity",
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
            }
          }
        }
      }
    ]
}`;
async function main() {
  const contractAddress = '0x69f9c99D9C35A4d8aFE840b113AeE07969FBA4D8';
  const issuerDID = 'did:polygonid:polygon:amoy:2qYYQVy4BBAR45gf8cktZZmptMr3SGuTbDdgJP4zbV';
  const valueInEther = '0.001';
  const typeName = 'AnimaProofOfIdentity';
  const valueWei = ethers.parseUnits(valueInEther, 'ether');

  const paymentFactory = await ethers.getContractFactory('PayExample');
  const payment = await paymentFactory.attach(contractAddress);

  const issuerId = DID.idFromDID(DID.parse(issuerDID));

  const schemaId: string = await Path.getTypeIDFromContext(
    ldContextJSON,
    typeName
  );

  const schemaHash = calculateCoreSchemaHash(byteEncoder.encode(schemaId));
  const tx = await payment.setPaymentValue(issuerId.bigInt(), schemaHash.bigInt(), valueWei);
  console.log(tx.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
