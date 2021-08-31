import { P2Pr } from "../p2pr";
import { prTh } from "../pr-transform/pr-transform-helper";

export class NameParser {
    constructor(private symbolLatexNames: { [key: string]: string }) {

    }

    parse(name: string, func: (name: string) => P2Pr.Symbol): P2Pr.Symbol {
        const splitIdx = name.indexOf("|");
        if (splitIdx > 0) {
            return this.handleJsonIdx(name, splitIdx, func);
        }

        let endWithNumberMatch = name.match(/^([a-zA-Z]+)([\d]+)$/);
        if (endWithNumberMatch) {
            endWithNumberMatch = endWithNumberMatch.map(c => this.nameMap(c));
            return this.handleNumberIdx(endWithNumberMatch[1], endWithNumberMatch[2], func);
        }

        let indexPowerMatch = name.match(/^([\w]+)_([\w]+)\^([\w]+)$/);
        if (indexPowerMatch) {
            indexPowerMatch = indexPowerMatch.map(c => this.nameMap(c));
            return prTh.pow(
                func(indexPowerMatch[1]),
                prTh.var(indexPowerMatch[3]),
                prTh.var(indexPowerMatch[2]),
            )
        }


        let powerIndexMatch = name.match(/^([\w]+)\^([\w]+)_([\w]+)$/);
        if (powerIndexMatch) {
            powerIndexMatch = powerIndexMatch.map(c => this.nameMap(c));
            return prTh.pow(
                func(powerIndexMatch[1]),
                prTh.var(powerIndexMatch[2]),
                prTh.var(powerIndexMatch[3]),
            )
        }

        let indexMatch = name.match(/^([\w]+)_([\w]+)$/);
        if (indexMatch) {
            indexMatch = indexMatch.map(c => this.nameMap(c));
            return prTh.index(func(indexMatch[1]), prTh.var(indexMatch[2]));
        }

        let powerMatch = name.match(/^([\w]+)\^([\w]+)$/);
        if (powerMatch) {
            powerMatch = powerMatch.map(c => this.nameMap(c));
            return prTh.pow(func(powerMatch[1]), prTh.var(powerMatch[2]));
        }


        return func(this.nameMap(name));
    }

    private handleNumberIdx(name: string, idx: string, func: (name: string) => P2Pr.Symbol): P2Pr.Index {
        return {
            type: "Index",
            kind: "Container",
            symbols: [
                func(this.nameMap(name)),
                { type: "Var", kind: "Leaf", name: idx }
            ]
        }

    }

    private handleJsonIdx(name: string, splitIdx: number, func: (name: string) => P2Pr.Symbol): P2Pr.Symbol {
        return {
            type: "Index",
            kind: "Container",
            symbols: [
                func(this.nameMap(name.substr(0, splitIdx))),
                { type: "JsonData", kind: "Leaf", data: name.substr(splitIdx + 1) },
            ]
        }

    }

    private nameMap(n: string): string {
        const latexName = n.startsWith("\\") ? n.substr(1) : n;

        return symbolNameMap[n] || this.symbolLatexNames[latexName] || n;
    }
}

const symbolNameMap: { [name: string]: string } = {
    "tau": "𝜏",
    "Tau": "T",
    "TAU": "𝜏",
    "taU": "𝜏",
}
