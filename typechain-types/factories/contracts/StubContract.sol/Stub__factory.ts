/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../../common";
import type {
  Stub,
  StubInterface,
} from "../../../contracts/StubContract.sol/Stub";

const _abi = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
] as const;

const _bytecode =
  "0x6080604052348015600f57600080fd5b5043600181905550603f8060246000396000f3fe6080604052600080fdfea2646970667358221220773c3121e850f0a8d4cb431ef0a2c7beb827ea379a94af5a2c3647fe5a7a252264736f6c63430007000033";

type StubConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: StubConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class Stub__factory extends ContractFactory {
  constructor(...args: StubConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<Stub> {
    return super.deploy(overrides || {}) as Promise<Stub>;
  }
  override getDeployTransaction(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  override attach(address: string): Stub {
    return super.attach(address) as Stub;
  }
  override connect(signer: Signer): Stub__factory {
    return super.connect(signer) as Stub__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): StubInterface {
    return new utils.Interface(_abi) as StubInterface;
  }
  static connect(address: string, signerOrProvider: Signer | Provider): Stub {
    return new Contract(address, _abi, signerOrProvider) as Stub;
  }
}