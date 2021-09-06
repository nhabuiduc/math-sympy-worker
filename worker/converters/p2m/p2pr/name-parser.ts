import { P2Pr } from "../p2pr";
import { prTh } from "../pr-transform/pr-transform-helper";

export class NameParser {
    constructor(private symbolLatexNames: { [key: string]: string }) {

    }

    parseSymbol(name: string, boldType?: P2Pr.BoldType): P2Pr.Symbol {
        return this.innerParse(name, n => this.matchModifier(n, boldType), n => this.matchModifier(n, boldType), boldType)
    }

    private matchModifier(name: string, boldType?: P2Pr.BoldType): Symbol {
        if (!name) {
            return prTh.empty();
        }

        for (const [key, vl] of this.modifierMap) {

            if (name.length > key.length && name.toLowerCase().endsWith(key)) {
                return vl(this.matchModifier(name.substr(0, name.length - key.length)));
            }
        }

        return this.parse(name, (n) => prTh.var(n), boldType)
    }

    innerParse(
        name: string,
        baseFunc: (name: string) => P2Pr.Symbol,
        powIdxFunc: (name: string) => P2Pr.Symbol,
        boldType?: P2Pr.BoldType): P2Pr.Symbol {
        const splitIdx = name.indexOf("|");
        if (splitIdx > 0) {
            return this.handleJsonIdx(name, splitIdx, baseFunc);
        }

        let endWithNumberMatch = name.match(/^([^\d\_\^]+)([\d]+)$/);
        if (endWithNumberMatch) {
            endWithNumberMatch = endWithNumberMatch.map(c => this.nameMap(c));
            return prTh.index(baseFunc(endWithNumberMatch[1]), prTh.var(endWithNumberMatch[2]))
        }

        let indexPowerMatch = name.match(/^([^\_\^]+)_([^\_\^]+)(\^|\_\_)(.+)$/);
        if (indexPowerMatch) {
            indexPowerMatch = indexPowerMatch.map(c => this.nameMap(c));
            return prTh.pow(
                baseFunc(indexPowerMatch[1]),
                powIdxFunc(indexPowerMatch[4]),
                powIdxFunc(indexPowerMatch[2]),
            )
        }


        let powerIndexMatch = name.match(/^([^\_\^]+)(\^|\_\_)([^\_\^]+)\_(.+)$/);
        if (powerIndexMatch) {
            powerIndexMatch = powerIndexMatch.map(c => this.nameMap(c));
            return prTh.pow(
                baseFunc(powerIndexMatch[1]),
                powIdxFunc(powerIndexMatch[3]),
                powIdxFunc(powerIndexMatch[4]),
            )
        }

        let indexMatch = name.match(/^([^\_\^]+)\_(.+)$/);
        if (indexMatch) {
            indexMatch = indexMatch.map(c => this.nameMap(c));
            return prTh.index(baseFunc(indexMatch[1]), powIdxFunc(indexMatch[2]));
        }

        let powerMatch = name.match(/^([^\_\^]+)(\^|\_\_)(.+)$/);
        if (powerMatch) {
            powerMatch = powerMatch.map(c => this.nameMap(c));
            return prTh.pow(baseFunc(powerMatch[1]), powIdxFunc(powerMatch[3]));
        }


        return baseFunc(this.nameMap(name));
    }

    parse(name: string, func: (name: string) => P2Pr.Symbol, boldType?: P2Pr.BoldType): P2Pr.Symbol {
        return this.innerParse(name, func, (s) => prTh.var(s, { bold: boldType }));
    }


    // private handleNumberIdx(name: string, idx: string, func: (name: string) => P2Pr.Symbol, boldType: P2Pr.BoldType): P2Pr.Index {
    //     return prTh.index(
    //         func(this.nameMap(name)),
    //         prTh.var(idx, { bold: boldType })
    //     )

    // }

    private handleJsonIdx(name: string, splitIdx: number, func: (name: string) => P2Pr.Symbol): P2Pr.Symbol {
        return prTh.index(
            func(this.nameMap(name.substr(0, splitIdx))),
            { type: "JsonData", kind: "Leaf", data: name.substr(splitIdx + 1) }
        )

    }

    private nameMap(n: string): string {
        /**special cases */
        if (n == "lamda") {
            n = "lambda";
        }
        else if (n == "Lamda") {
            n = "Lambda";
        }
        const latexName = n.startsWith("\\") ? n.substr(1) : n;

        return symbolNameMap[n] || this.symbolLatexNames[latexName] || n;
    }

    private modifierMap = new Map<string, (s: Symbol) => Symbol>([
        ["mathring", (s: Symbol) => prTh.over("ring", s)],
        ["check", (s: Symbol) => prTh.over("check", s)],
        ["breve", (s: Symbol) => prTh.over("breve", s)],
        ["acute", (s: Symbol) => prTh.over("acute", s)],
        ["grave", (s: Symbol) => prTh.over("grave", s)],
        ["tilde", (s: Symbol) => prTh.over("small-tilde", s)],
        ["prime", (s: Symbol) => prTh.varList([s, prTh.var("'")], { visualInfo: "asShorthandMul" })],
        ["ddddot", (s: Symbol) => prTh.over("ddddot", s)],
        ["dddot", (s: Symbol) => prTh.over("dddot", s)],
        ["ddot", (s: Symbol) => prTh.over("ddot", s)],
        ["bold", (s: Symbol) => prTh.applyBold(s, true)],
        ["norm", (s: Symbol) => prTh.varList([s], { bracket: "|" })],
        ["avg", (s: Symbol) => prTh.varList([s], { bracket: "<" })],
        ["hat", (s: Symbol) => prTh.over("small-hat", s)],
        ["dot", (s: Symbol) => prTh.over("dot", s)],
        ["bar", (s: Symbol) => prTh.over("overline", s)],
        ["vec", (s: Symbol) => prTh.over("overrightarrow", s)],
        ["abs", (s: Symbol) => prTh.varList([s], { bracket: "|" })],
        ["mag", (s: Symbol) => prTh.varList([s], { bracket: "|" })],
        ["prm", (s: Symbol) => prTh.varList([s, prTh.var("'")], { visualInfo: "asShorthandMul" })],
        ["bm", (s: Symbol) => prTh.applyBold(s, "boldsymbol")],
    ])
}

const symbolNameMap: { [name: string]: string } = {
    "tau": "𝜏",
    "Tau": "T",
    "TAU": "𝜏",
    "taU": "𝜏",
    "hslash": "ℏ",
    "wp": "℘",
    "ell": "ℓ",
    "mho": "℧",
    "gimel": "ℷ",
    "beth": "ℶ",
    "aleph": "ℵ",
    "eth": "ð",
    "daleth": "ℸ",
    "hbar": "ℏ",
    "Alpha": "A",
    "Beta": "B",
    "Epsilon": "E",
    "Zeta": "Z",
    "Eta": "H",
    "Iota": "I",
    "Kappa": "I",
    "Mu": "M",
    "Nu": "N",
    "Omicron": "O",
    "Rho": "P",
    "Upsilon": "Y",
    "Chi": "X",
}
type Symbol = P2Pr.Symbol;