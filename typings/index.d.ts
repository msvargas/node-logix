import { DataType } from "python-struct";
import { Socket as SocketDgram} from "dgram"

declare module "python-struct" {
  export function unpackFrom(
    format: string,
    data: Buffer,
    checkBounds: boolean | undefined,
    position: number
  ): Array<DataType>;
}
