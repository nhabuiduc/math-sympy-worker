import { P2Pr } from "../p2pr";
import { NameParser } from "./name-parser";

export abstract class P2PrItemBase {
    constructor(
        protected main: {
            m(args: P2Pr.PBasic[]): Symbol[],
            c(obj: P2Pr.PBasic): Symbol,
            nameParser: NameParser
        },) {
    }

    m(args: P2Pr.PBasic[]): Symbol[] {
        return this.main.m(args);
    }
    c(obj: P2Pr.PBasic): Symbol {
        return this.main.c(obj);
    }

}

type Symbol = P2Pr.Symbol;