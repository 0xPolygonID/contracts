import { ethers } from 'hardhat';
import fs from 'fs';
import path from 'path';

const pathOutputCSV = path.join(__dirname, './VCPayment-events.csv');
async function main() {
  const contractAddress = '0x69f9c99D9C35A4d8aFE840b113AeE07969FBA4D8';
  const paymentFactory = await ethers.getContractFactory('VCPayment');
  const paymentVC = await paymentFactory.attach(contractAddress);

  const events = await paymentVC.queryFilter('Payment');
  const rows = events.map(i => { 
    const args = (i as any).args; 
    return [
        args[0], // issuer id
        args[1].hash, // payment id hash
        args[2] // schema hash
    ];
  });

  let csvContent = '';
  rows.forEach((r) => {
    csvContent += r.join(",") + "\r\n"; 
  });

  fs.writeFileSync(pathOutputCSV, csvContent);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
