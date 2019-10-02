import { DataType } from "python-struct";
import { Socket as SocketDgram, RemoteInfo} from "dgram"
import LGXDevice from "../src/lgxDevice";

declare module "python-struct" {
  export function unpackFrom(
    format: string,
    data: Buffer,
    checkBounds: boolean | undefined,
    position: number
  ): Array<DataType>;
}

