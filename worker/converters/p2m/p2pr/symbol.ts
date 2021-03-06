import { P2Pr } from "../p2pr";
import { NameParser } from "./name-parser";
export class Symbol {
    constructor(private nameParser: NameParser) {
    }

    parse(name: string, boldType?: P2Pr.BoldType): P2Pr.Symbol {
        return this.nameParser.parseSymbol(name, boldType);
    }
}

