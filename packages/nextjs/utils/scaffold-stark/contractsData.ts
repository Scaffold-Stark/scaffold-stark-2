import scaffoldConfig from "~~/scaffold.config";
import { contracts } from "~~/utils/scaffold-stark/contract";

export function getAllContracts() {
  const contractsData = contracts?.[scaffoldConfig.targetNetworks[0].network];
  return contractsData ? contractsData : {};
}

function bigIntToHex(bigInt: bigint) {
  return bigInt.toString(16);
}

function hexToUtf8(hexStr: string) {
  let bytes = [];
  for (let i = 0; i < hexStr.length; i += 2) {
    bytes.push(parseInt(hexStr.substring(i, i + 2), 16));
  }
  try {
    return new TextDecoder("utf-8").decode(new Uint8Array(bytes));
  } catch (e) {
    console.error("Failed to decode:", e);
    return "";
  }
}

export function decodeBigIntArrayToText(byteArray: string[]) {
  return byteArray
    .map((bigInt) => bigIntToHex(BigInt(bigInt))) // Convert each BigInt to hexadecimal
    .map((hex) => hexToUtf8(hex)) // Decode each hexadecimal to text
    .join(""); // Join all texts into a single string
}
