import {
  transaction,
  CallData,
  hash,
  stark,
  typedData,
  RPC,
  ETransactionVersion2,
  ETransactionVersion3,
} from "starknet";

export class RawSigner {
  // Override in subclass
  async signRaw(_messageHash: string): Promise<[string, string]> {
    throw new Error("signRaw method must be implemented by subclass");
  }

  async getPubKey(): Promise<string> {
    throw new Error("This signer allows multiple public keys");
  }

  async signMessage(
    typed: any,
    accountAddress: string,
  ): Promise<[string, string]> {
    const messageHash = typedData.getMessageHash(typed, accountAddress);
    return this.signRaw(messageHash);
  }

  async signTransaction(
    transactions: any,
    details: any,
  ): Promise<[string, string]> {
    const compiledCalldata = transaction.getExecuteCalldata(
      transactions,
      details.cairoVersion,
    );
    let msgHash: string;
    if (Object.values(ETransactionVersion2).includes(details.version)) {
      msgHash = hash.calculateInvokeTransactionHash({
        ...details,
        senderAddress: details.walletAddress,
        compiledCalldata,
        version: details.version,
      });
    } else if (Object.values(ETransactionVersion3).includes(details.version)) {
      msgHash = hash.calculateInvokeTransactionHash({
        ...details,
        senderAddress: details.walletAddress,
        compiledCalldata,
        version: details.version,
        nonceDataAvailabilityMode: stark.intDAM(
          details.nonceDataAvailabilityMode,
        ),
        feeDataAvailabilityMode: stark.intDAM(details.feeDataAvailabilityMode),
      });
    } else {
      throw new Error("unsupported signTransaction version");
    }
    return this.signRaw(msgHash);
  }

  async signDeployAccountTransaction(details: any): Promise<[string, string]> {
    const compiledConstructorCalldata = CallData.compile(
      details.constructorCalldata,
    );
    let msgHash: string;
    if (Object.values(ETransactionVersion2).includes(details.version)) {
      msgHash = hash.calculateDeployAccountTransactionHash({
        ...details,
        salt: details.addressSalt,
        constructorCalldata: compiledConstructorCalldata,
        version: details.version,
      });
    } else if (Object.values(ETransactionVersion3).includes(details.version)) {
      msgHash = hash.calculateDeployAccountTransactionHash({
        ...details,
        salt: details.addressSalt,
        compiledConstructorCalldata,
        version: details.version,
        nonceDataAvailabilityMode: stark.intDAM(
          details.nonceDataAvailabilityMode,
        ),
        feeDataAvailabilityMode: stark.intDAM(details.feeDataAvailabilityMode),
      });
    } else {
      throw new Error(
        `unsupported signDeployAccountTransaction version: ${details.version}`,
      );
    }
    return this.signRaw(msgHash);
  }

  async signDeclareTransaction(details: any): Promise<[string, string]> {
    let msgHash: string;
    if (Object.values(ETransactionVersion2).includes(details.version)) {
      msgHash = hash.calculateDeclareTransactionHash({
        ...details,
        version: details.version,
      });
    } else if (Object.values(ETransactionVersion3).includes(details.version)) {
      msgHash = hash.calculateDeclareTransactionHash({
        ...details,
        version: details.version,
        nonceDataAvailabilityMode: stark.intDAM(
          details.nonceDataAvailabilityMode,
        ),
        feeDataAvailabilityMode: stark.intDAM(details.feeDataAvailabilityMode),
      });
    } else {
      throw new Error("unsupported signDeclareTransaction version");
    }
    return this.signRaw(msgHash);
  }
}
