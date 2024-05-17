import { Hex } from '@iden3/js-crypto';
import { DID, SchemaHash } from '@iden3/js-iden3-core';
import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('Payment example', function () {
  let payment: any;
  const issuerId1 = DID.idFromDID(DID.parse('did:polygonid:polygon:amoy:2qQ68JkRcf3ymy9wtzKyY3Dajst9c6cHCDZyx7NrTz'));
  const issuerId2 = DID.idFromDID(DID.parse('did:polygonid:polygon:amoy:2qZ1qniEoXvAPCqm7GwUSQWsRYFip124ddXU3fTg61'));
  const schemaHash1 = new SchemaHash(Hex.decodeString('ce6bb12c96bfd1544c02c289c6b4b987'));
  const schemaHash2 = new SchemaHash(Hex.decodeString('ce6bb12c96bfd1544c02c289c6b4b988'));
  const schemaHash3 = new SchemaHash(Hex.decodeString('ce6bb12c96bfd1544c02c289c6b4b998'));

  beforeEach(async () => {
    const payExample = await ethers.getContractFactory('PayExample');
    payment = await payExample.deploy();

    await payment.setPaymentValue(issuerId1.bigInt(), schemaHash1.bigInt(), 10000);
    await payment.setPaymentValue(issuerId1.bigInt(), schemaHash2.bigInt(), 20000);
    await payment.setPaymentValue(issuerId2.bigInt(), schemaHash3.bigInt(), 30000);
  });

  it('Example of few payments and withdraw:', async () => {
    await payment.pay('payment-id-1', issuerId1.bigInt(), schemaHash1.bigInt(), {
      value: 10000
    });

    await payment.pay('payment-id-2', issuerId1.bigInt(), schemaHash2.bigInt(), {
      value: 20000
    });

    const balanceContract = await payment.getContractBalance();
    const balance = BigInt(balanceContract).toString();
    expect(balance).to.be.eq('30000');

    await payment.withdraw(30000);
    const balanceAfterWithdrawRes = await payment.getContractBalance();
    const balanceAfterWithdraw = BigInt(balanceAfterWithdrawRes);
    expect(balanceAfterWithdraw).to.be.eq(BigInt(0));
  });

  it('Payment value not found', async () => {
    await expect(
      payment.pay('payment-id-1', issuerId2.bigInt(), schemaHash2.bigInt(), {
        value: 10000
      })
    ).to.be.revertedWith(
      'Payment value not found for this issuer and schema'
    );
  });

  it('Pay with invalid value', async () => {
    await expect(
      payment.pay('payment-id-1', issuerId1.bigInt(), schemaHash2.bigInt(), {
        value: 10000
      })
    ).to.be.revertedWith(
      'Invalid value'
    );
  });

  it('Check events', async () => {
    await payment.pay('payment-id-1', issuerId2.bigInt(), schemaHash3.bigInt(), {
      value: 30000
    });
    await payment.pay('payment-id-1-1', issuerId1.bigInt(), schemaHash1.bigInt(), {
      value: 10000
    });
    await payment.pay('payment-id-2', issuerId2.bigInt(), schemaHash3.bigInt(), {
      value: 30000
    });

    const filter = payment.filters.Payment();
    const payments = await payment.queryFilter(filter);
    const secondPaymentArgs = payments[1].args;
    expect(secondPaymentArgs[0]).to.be.eq(issuerId1.bigInt());
    expect(secondPaymentArgs[1]).to.be.eq('payment-id-1-1');
    expect(secondPaymentArgs[2]).to.be.eq(schemaHash1.bigInt());
  });
});
