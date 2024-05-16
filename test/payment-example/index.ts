import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('Payment example', function () {
  let payment: any;

  beforeEach(async () => {
    const payExample = await ethers.getContractFactory('PayExample');
    payment = await payExample.deploy();
  });

  it('Example of few payments and check:', async () => {
    const session = 'session';
    const issuerDid = 'issuer-did';
    await payment.pay(session, issuerDid, {
      value: 1000
    });

    const sessionData1 = await payment.Payments(session);
    const value1 = BigInt(sessionData1[1]).toString();
    expect(value1).to.be.eq('1000');

    await payment.pay(session, issuerDid, {
      value: 1200
    });
    const sessionData2 = await payment.Payments(session);
    const value2 = BigInt(sessionData2[1]).toString();
    expect(value2).to.be.eq('2200');

    const sessionDataUnknown = await payment.Payments('unknown-session');
    const valueUnknown = BigInt(sessionDataUnknown[1]).toString();
    expect(valueUnknown).to.be.eq('0');


    const balanceContract = await payment.getBalanceContract();
    const balance = BigInt(balanceContract).toString();
    expect(balance).to.be.eq('2200');
  });
});
