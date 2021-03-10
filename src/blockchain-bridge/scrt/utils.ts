import { decode } from 'bech32';
import { ExecuteResult } from 'secretjs';
import { StdFee } from 'secretjs/types/types';
import { NETWORKS } from '../../pages/EthBridge';

const HRP = 'secret';

export const swapContractAddress = (network: NETWORKS): string => {
  switch (network) {
    case NETWORKS.ETH:
      return process.env.SCRT_SWAP_CONTRACT;
    case NETWORKS.BSC:
      return process.env.BSC_SCRT_SWAP_CONTRACT;
  }
}

export const getScrtAddress = (address: string): string => {
  try {
    const decoded = decode(address, 46);
    return decoded.prefix === HRP ? address : '';
  } catch {
    return '';
  }
};

export const validateBech32Address = (address: string): boolean => {
  return getScrtAddress(address) !== '';
};

export function extractValueFromLogs(txResult: ExecuteResult, key: string): string {
  return txResult?.logs[0]?.events?.find(e => e.type === 'wasm')?.attributes?.find(a => a.key === key)?.value;
}

// getAddress(address).bech32;
export function getFeeForExecute(gas: number): StdFee {
  return {
    amount: [{ amount: String(gas), denom: 'uscrt' }],
    gas: String(gas),
  };
}
