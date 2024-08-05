import { Hex } from '@iden3/js-crypto';
import { DID, SchemaHash } from '@iden3/js-iden3-core';
import { ethers } from 'hardhat';
import { VCPaymentV2, VCPaymentV2__factory } from '../../typechain-types';
import { expect } from 'chai';

describe.only('Payment example V2', () => {
  let payment: VCPaymentV2;
  const issuerId1 = DID.idFromDID(
    DID.parse('did:polygonid:polygon:amoy:2qQ68JkRcf3ymy9wtzKyY3Dajst9c6cHCDZyx7NrTz')
  );
  const issuerId2 = DID.idFromDID(
    DID.parse('did:polygonid:polygon:amoy:2qZ1qniEoXvAPCqm7GwUSQWsRYFip124ddXU3fTg61')
  );
  const schemaHash1 = new SchemaHash(Hex.decodeString('ce6bb12c96bfd1544c02c289c6b4b987'));
  const schemaHash2 = new SchemaHash(Hex.decodeString('ce6bb12c96bfd1544c02c289c6b4b988'));
  const schemaHash3 = new SchemaHash(Hex.decodeString('ce6bb12c96bfd1544c02c289c6b4b998'));

  let issuer1Signer, issuer2Signer, owner, userSigner;

  beforeEach(async () => {
    const ownerPartPercent = 5;
    const signers = await ethers.getSigners();
    issuer1Signer = signers[1];
    issuer2Signer = signers[2];
    userSigner = signers[5];
    owner = signers[0];

    payment = await new VCPaymentV2__factory(owner).deploy(ownerPartPercent);

    await payment.setPaymentValue(
      issuerId1.bigInt(),
      schemaHash1.bigInt(),
      10000,
      issuer1Signer.address
    );
    await payment.setPaymentValue(
      issuerId1.bigInt(),
      schemaHash2.bigInt(),
      20000,
      issuer1Signer.address
    );
    await payment.setPaymentValue(
      issuerId2.bigInt(),
      schemaHash3.bigInt(),
      30000,
      issuer2Signer.address
    );
  });

  it('Payment and issuer/owner withdraw:', async () => {
    const paymentFromUser = payment.connect(userSigner);

    // pay 4 times to issuer 1 in total 50000 (5% to owner) => issuerBalance = 47500
    await paymentFromUser.pay('payment-id-1', issuerId1.bigInt(), schemaHash1.bigInt(), {
      value: 10000
    });

    await paymentFromUser.pay('payment-id-2', issuerId1.bigInt(), schemaHash1.bigInt(), {
      value: 10000
    });

    await paymentFromUser.pay('payment-id-3', issuerId1.bigInt(), schemaHash1.bigInt(), {
      value: 10000
    });

    await paymentFromUser.pay('payment-id-4', issuerId1.bigInt(), schemaHash2.bigInt(), {
      value: 20000
    });

    // isser 2, should not have affect on issuer 1 withdraw
    await paymentFromUser.pay('payment-id-1', issuerId2.bigInt(), schemaHash3.bigInt(), {
      value: 30000
    });

    const issuer1BalanceInContract = await payment.connect(issuer1Signer).getMyBalance();
    expect(issuer1BalanceInContract).to.be.eq(47500);
    await payment.connect(issuer1Signer).issuerWithdraw();
    // issuer 1 balance should be 0
    const issuer1BalanceAfterWithdrow = await payment.connect(issuer1Signer).getMyBalance();
    expect(issuer1BalanceAfterWithdrow).to.be.eq(0);

    // issuer 2 balance should not change
    expect(await payment.connect(issuer2Signer).getMyBalance()).to.be.eq(28500);
  });
});
