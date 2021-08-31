import { P2Pr } from "../p2pr";
import { NameParser } from "./name-parser";

export abstract class P2PrItemBase {
    constructor(
        protected main: {
            m(args: P2Pr.PBasic[]): Symbol[], c(obj: P2Pr.PBasic): Symbol,
            nameParser: NameParser
        },) {

    }
}

type Symbol = P2Pr.Symbol;