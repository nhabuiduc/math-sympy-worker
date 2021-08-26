import { P2Pr } from "../p2pr";

class Symbol {
    parse(name: string): P2Pr.Symbol {
        const splitIdx = name.indexOf("|");
        if (splitIdx > 0) {
            return this.handleJsonIdx(name, splitIdx);
        }

        const rs = name.match(/^([a-zA-Z]+)([\d]+)$/);
        if (rs) {
            return this.handleNumberIdx(rs[1], rs[2]);
        }

        return { type: "Var", kind: "Leaf", name: this.nameMap(name) };

    }

    private handleNumberIdx(name: string, idx: string): P2Pr.Index {
        return {
            type: "Index",
            kind: "Container",
            symbols: [
                { type: "Var", kind: "Leaf", name: this.nameMap(name) },
                { type: "Var", kind: "Leaf", name: idx }
            ]
        }

    }

    private handleJsonIdx(name: string, splitIdx: number): P2Pr.Symbol {
        return {
            type: "Index",
            kind: "Container",
            symbols: [
                { type: "Var", kind: "Leaf", name: this.nameMap(name.substr(0, splitIdx)) },
                { type: "JsonData", kind: "Leaf", data: name.substr(splitIdx + 1) },
            ]
        }

    }

    private nameMap(n: string): string {
        return symbolNameMap[n] || n;
    }
}

const symbolNameMap: { [name: string]: string } = {
    "tau": "𝜏",
    "Tau": "T",
    "TAU": "𝜏",
    "taU": "𝜏",
}

export const symbol = new Symbol();