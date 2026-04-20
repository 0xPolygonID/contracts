import dotenv from 'dotenv';
import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import '@openzeppelin/hardhat-upgrades';
import '@nomicfoundation/hardhat-verify';
import 'hardhat-contract-sizer';

dotenv.config();

const DEFAULT_MNEMONIC = 'test test test test test test test test test test test junk';

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.8.27',
        settings: {
          optimizer: {
            enabled: true,
            runs: 100
          }
        }
      }
    ]
  },
  networks: {
    'ethereum-mainnet': {
      chainId: 1,
      url: `${process.env.ETHEREUM_MAINNET_RPC_URL}`,
      accounts: [`0x${process.env.PRIVATE_KEY}`]
    },
    'ethereum-sepolia': {
      chainId: 11155111,
      url: `${process.env.ETHEREUM_SEPOLIA_RPC_URL}`,
      accounts: [`0x${process.env.PRIVATE_KEY}`]
    },
    'polygon-mainnet': {
      chainId: 137,
      url: `${process.env.POLYGON_MAINNET_RPC_URL}`,
      accounts: [`0x${process.env.PRIVATE_KEY}`]
    },
    'polygon-amoy': {
      chainId: 80002,
      url: `${process.env.POLYGON_AMOY_RPC_URL}`,
      accounts: [`0x${process.env.PRIVATE_KEY}`]
    },
    'linea-sepolia': {
      chainId: 59141,
      url: `${process.env.LINEA_SEPOLIA_RPC_URL}`,
      accounts: [`0x${process.env.PRIVATE_KEY}`]
    },
    'linea-mainnet': {
      chainId: 59144,
      url: `${process.env.LINEA_MAINNET_RPC_URL}`,
      accounts: [`0x${process.env.PRIVATE_KEY}`]
    },
    // hardhat: {
    //   chainId: 11155111,
    //   forking: {
    //     url: `${process.env.ETHEREUM_SEPOLIA_RPC_URL}`
    //   },
    //   chains: {
    //     11155111: {
    //       hardforkHistory: {
    //         london: 100000
    //       }
    //     }
    //   },
    //   accounts: [
    //     {
    //       privateKey: process.env.PRIVATE_KEY as string,
    //       balance: '1000000000000000000000000'
    //     }
    //   ]
    // },
    localhost: {
      url: 'http://127.0.0.1:8545',
      timeout: 100000000
    }
  },
  etherscan: {
    apiKey: {
      'ethereum-mainnet': process.env.ETHERSCAN_API_KEY || '',
      'ethereum-sepolia': process.env.ETHERSCAN_API_KEY || '',
      'polygon-mainnet': process.env.ETHERSCAN_API_KEY || '',
      'polygon-amoy': process.env.ETHERSCAN_API_KEY || '',
      'linea-mainnet': process.env.ETHERSCAN_API_KEY || '',
      'linea-sepolia': process.env.ETHERSCAN_API_KEY || ''
    },
    customChains: [
      {
        network: 'ethereum-mainnet',
        chainId: 1,
        urls: {
          apiURL: 'https://api.etherscan.io/v2/api?chainid=1',
          browserURL: 'https://etherscan.io'
        }
      },
      {
        network: 'ethereum-sepolia',
        chainId: 11155111,
        urls: {
          apiURL: 'https://api.etherscan.io/v2/api?chainid=11155111',
          browserURL: 'https://sepolia.etherscan.io'
        }
      },
      {
        network: 'polygon-mainnet',
        chainId: 137,
        urls: {
          apiURL: 'https://api.etherscan.io/v2/api?chainid=137',
          browserURL: 'https://polygonscan.com'
        }
      },
      {
        network: 'polygon-amoy',
        chainId: 80002,
        urls: {
          apiURL: 'https://api.etherscan.io/v2/api?chainid=80002',
          browserURL: 'https://amoy.polygonscan.com'
        }
      },
      {
        network: 'linea-sepolia',
        chainId: 59141,
        urls: {
          apiURL: 'https://api.etherscan.io/v2/api?chainid=59141',
          browserURL: 'https://sepolia.lineascan.build'
        }
      },
      {
        network: 'linea',
        chainId: 59144,
        urls: {
          apiURL: 'https://api.etherscan.io/v2/api?chainid=59144',
          browserURL: 'https://lineascan.build'
        }
      }
    ]
  },
  gasReporter: {
    currency: 'USD',
    coinmarketcap: process.env.COINMARKETCAP_KEY,
    enabled: !!process.env.REPORT_GAS,
    token: 'MATIC'
  },
  contractSizer: {
    alphaSort: false,
    disambiguatePaths: false,
    runOnCompile: false,
    strict: false
  }
};

export default config;
