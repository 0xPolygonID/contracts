import { Hex } from '@iden3/js-crypto';
import { DID, SchemaHash } from '@iden3/js-iden3-core';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { VCPayment, VCPayment__factory } from '../../typechain-types';

describe('Payment example', function () {
  let payment: VCPayment;
  const issuerId1 = DID.idFromDID(
    DID.parse('did:polygonid:polygon:amoy:2qQ68JkRcf3ymy9wtzKyY3Dajst9c6cHCDZyx7NrTz')
  );
  const issuerId2 = DID.idFromDID(
    DID.parse('did:polygonid:polygon:amoy:2qZ1qniEoXvAPCqm7GwUSQWsRYFip124ddXU3fTg61')
  );
  const schemaHash1 = new SchemaHash(Hex.decodeString('ce6bb12c96bfd1544c02c289c6b4b987'));
  const schemaHash2 = new SchemaHash(Hex.decodeString('ce6bb12c96bfd1544c02c289c6b4b988'));
  const schemaHash3 = new SchemaHash(Hex.decodeString('ce6bb12c96bfd1544c02c289c6b4b998'));

  beforeEach(async () => {
    const signers = await ethers.getSigners();
    const owner = signers[0];
    payment = await new VCPayment__factory(owner).deploy();

    await payment.setPaymentValue(issuerId1.bigInt(), schemaHash1.bigInt(), 10000);
    await payment.setPaymentValue(issuerId1.bigInt(), schemaHash2.bigInt(), 20000);
    await payment.setPaymentValue(issuerId2.bigInt(), schemaHash3.bigInt(), 30000);
  });

  it('Example of few payments and withdraw:', async () => {
    await payment.pay('payment-id-1', issuerId1.bigInt(), schemaHash1.bigInt(), {
      value: 10000
    });

    const isPayment1Done = await payment.isPaymentDone('payment-id-1', issuerId1.bigInt());
    expect(isPayment1Done).to.be.eq(true);

    await payment.pay('payment-id-2', issuerId1.bigInt(), schemaHash2.bigInt(), {
      value: 20000
    });

    const isPayment2Done = await payment.isPaymentDone('payment-id-2', issuerId1.bigInt());
    expect(isPayment2Done).to.be.eq(true);

    const isPayment3Done = await payment.isPaymentDone('payment-id-3', issuerId1.bigInt());
    expect(isPayment3Done).to.be.eq(false);

    const balance = await ethers.provider.getBalance(payment.getAddress());
    expect(balance).to.be.eq(30000);

    await payment.withdraw();
    const balanceAfterWithdraw = await ethers.provider.getBalance(payment.getAddress());
    expect(balanceAfterWithdraw).to.be.eq(0);

    await expect(payment.withdraw()).to.be.revertedWithCustomError(payment, 'WithdrawError');
  });

  it('Payment value not found', async () => {
    await expect(
      payment.pay('payment-id-1', issuerId2.bigInt(), schemaHash2.bigInt(), {
        value: 10000
      })
    ).to.be.revertedWithCustomError(payment, 'PaymentError');
  });

  it('Pay twice', async () => {
    await payment.pay('payment-id-1', issuerId1.bigInt(), schemaHash1.bigInt(), {
      value: 10000
    });

    await expect(
      payment.pay('payment-id-1', issuerId1.bigInt(), schemaHash1.bigInt(), {
        value: 10000
      })
    ).to.be.revertedWithCustomError(payment, 'PaymentError');
  });

  it('Pay with invalid value', async () => {
    await expect(
      payment.pay('payment-id-1', issuerId1.bigInt(), schemaHash2.bigInt(), {
        value: 10000
      })
    ).to.be.revertedWithCustomError(payment, 'PaymentError');
  });

  it('Check events', async () => {
    const tx1 = await payment.pay('payment-id-1', issuerId2.bigInt(), schemaHash3.bigInt(), {
      value: 30000
    });
    const tx2 = await payment.pay('payment-id-1-1', issuerId1.bigInt(), schemaHash1.bigInt(), {
      value: 10000
    });
    const tx3 = await payment.pay('payment-id-2', issuerId2.bigInt(), schemaHash3.bigInt(), {
      value: 30000
    });

    const block1 = await tx1.getBlock();
    const block2 = await tx2.getBlock();
    const block3 = await tx3.getBlock();

    await expect(tx1)
      .to.emit(payment, 'Payment')
      .withArgs(issuerId2.bigInt(), 'payment-id-1', schemaHash3.bigInt(), block1?.timestamp);

    await expect(tx2)
      .to.emit(payment, 'Payment')
      .withArgs(issuerId1.bigInt(), 'payment-id-1-1', schemaHash1.bigInt(), block2?.timestamp);

    await expect(tx3)
      .to.emit(payment, 'Payment')
      .withArgs(issuerId2.bigInt(), 'payment-id-2', schemaHash3.bigInt(), block3?.timestamp);
  });
});
