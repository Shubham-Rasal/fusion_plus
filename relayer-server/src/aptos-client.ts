import { AptosAccount, AptosClient, TxnBuilderTypes, BCS } from "aptos";
import { ethers } from "ethers";

export class AptosRelayerClient {
  private client: AptosClient;
  private account: AptosAccount;

  constructor(privateKey: string, address: string, nodeUrl: string = "https://fullnode.mainnet.aptoslabs.com/v1") {
    this.client = new AptosClient(nodeUrl);
    this.account = AptosAccount.fromAptosAccountObject({
      privateKeyHex: privateKey,
      address: address,
    });
  }

  async initializeSwapLedger() {
    const SRC_COIN_TYPE = "0xb56bbecb1105320f538c98931eb637eb216e977bc4c6b83504c43663f4e6b923::fusion_token::FusionToken";

    const payload = {
      type: "entry_function_payload",
      function: "0xb56bbecb1105320f538c98931eb637eb216e977bc4c6b83504c43663f4e6b923::fusion_swap::initialize_swap_ledger",
      type_arguments: [SRC_COIN_TYPE],
      arguments: [],
    };
    
    return await this.signAndSubmit(payload);
  }

  async announceOrder(srcAmount: number, minDstAmount: number, expiresInSecs: number, secretHash: string) {
    const SRC_COIN_TYPE = "0xb56bbecb1105320f538c98931eb637eb216e977bc4c6b83504c43663f4e6b923::fusion_token::FusionToken";
    const secretHashBytes = this.hexToUint8Array(secretHash);

    const payload = {
      type: "entry_function_payload",
      function: "0xb56bbecb1105320f538c98931eb637eb216e977bc4c6b83504c43663f4e6b923::fusion_swap::announce_order",
      type_arguments: [SRC_COIN_TYPE],
      arguments: [
        srcAmount.toString(),
        minDstAmount.toString(),
        expiresInSecs.toString(),
        secretHashBytes,
      ],
    };

    return await this.signAndSubmit(payload);
  }

  async fundDstEscrow(dstAmount: number, expirationDurationSecs: number, secretHash: string) {
    const SRC_COIN_TYPE = "0xb56bbecb1105320f538c98931eb637eb216e977bc4c6b83504c43663f4e6b923::fusion_token::FusionToken";
    const secretHashBytes = this.hexToUint8Array(secretHash);

    const payload = {
      type: "entry_function_payload",
      function: "0xb56bbecb1105320f538c98931eb637eb216e977bc4c6b83504c43663f4e6b923::fusion_swap::fund_dst_escrow",
      type_arguments: [SRC_COIN_TYPE],
      arguments: [
        dstAmount.toString(),
        expirationDurationSecs.toString(),
        secretHashBytes,
      ],
    };

    return await this.signAndSubmit(payload);
  }

  async claimFunds(orderId: number, secret: string) {
    const SRC_COIN_TYPE = "0xb56bbecb1105320f538c98931eb637eb216e977bc4c6b83504c43663f4e6b923::fusion_token::FusionToken";
    const secretBytes = ethers.toUtf8Bytes(secret);

    const payload = {
      type: "entry_function_payload",
      function: "0xb56bbecb1105320f538c98931eb637eb216e977bc4c6b83504c43663f4e6b923::fusion_swap::claim_funds",
      type_arguments: [SRC_COIN_TYPE],
      arguments: [orderId.toString(), secretBytes],
    };

    return await this.signAndSubmit(payload);
  }

  async cancelSwap(orderId: number) {
    const SRC_COIN_TYPE = "0xb56bbecb1105320f538c98931eb637eb216e977bc4c6b83504c43663f4e6b923::fusion_token::FusionToken";

    const payload = {
      type: "entry_function_payload",
      function: "0xb56bbecb1105320f538c98931eb637eb216e977bc4c6b83504c43663f4e6b923::fusion_swap::cancel_swap",
      type_arguments: [SRC_COIN_TYPE],
      arguments: [orderId.toString()],
    };

    return await this.signAndSubmit(payload);
  }

  async getCurrentOrderId(): Promise<number> {
    const payload = {
      type: "entry_function_payload",
      function: "0xb56bbecb1105320f538c98931eb637eb216e977bc4c6b83504c43663f4e6b923::fusion_swap::get_current_order_id",
      type_arguments: [],
      arguments: [],
    };
    
    // Use view function to get the current order ID
    const response = await this.client.view(payload);
    return Number(response[0]);
  }

  private async signAndSubmit(payload: any) {
    const rawTxn = await this.client.generateTransaction(this.account.address(), payload);
    const bcsTxn = AptosClient.generateBCSTransaction(this.account, rawTxn);
    const pending = await this.client.submitSignedBCSTransaction(bcsTxn);
    await this.client.waitForTransaction(pending.hash);
    
    return {
      hash: pending.hash,
      explorerUrl: `https://explorer.aptoslabs.com/txn/${pending.hash}?network=mainnet`
    };
  }

  private hexToUint8Array(hex: string): Uint8Array {
    if (hex.startsWith("0x")) {
      hex = hex.substring(2);
    }
    if (hex.length % 2 !== 0) {
      throw new Error("Hex string must have an even number of characters for byte conversion.");
    }
    const byteArray = new Uint8Array(hex.length / 2);
    for (let i = 0; i < byteArray.length; i++) {
      byteArray[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
    }
    return byteArray;
  }
} 