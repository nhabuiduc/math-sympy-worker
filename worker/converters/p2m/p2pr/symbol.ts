import { P2Pr } from "../p2pr";
import { NameParser } from "./name-parser";
export class Symbol {
    constructor(private nameParser: NameParser) {
    }

    parse(name: string): P2Pr.Symbol {
        return this.nameParser.parse(name, (cn) => ({ type: "Var", kind: "Leaf", name: cn }))
    }
}

