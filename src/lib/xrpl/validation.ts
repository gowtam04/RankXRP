import { isValidClassicAddress, isValidXAddress } from 'xrpl';

export function isValidXrpAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }

  // Check for classic r-address format
  if (address.startsWith('r')) {
    return isValidClassicAddress(address);
  }

  // Check for X-address format
  if (address.startsWith('X') || address.startsWith('T')) {
    return isValidXAddress(address);
  }

  return false;
}
