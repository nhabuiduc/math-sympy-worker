import { CasEngineProcess } from "@sympy-worker/cas-engine-process";
import { P2Pr } from "@sympy-worker/converters/p2m/p2pr";
import { PyodideNs } from "@sympy-worker/pyodide-models";
declare const pyodide: PyodideNs.PythonRunner;


class TestHelper {
    private casEngineProcess = new CasEngineProcess(pyodide, {
        constantTextFuncs: constFuncs, symbolLatexNames: {
            "Alpha": "𝛢",
            "Gamma": "𝛤",
            "gamma": "𝛾",
            "lambda": "𝜆",
            "Lambda": "𝛬",
            "epsilon": "𝜖",
            "omega": "𝜔",
            "alpha": "𝛼",
            "beta": "𝛽",
            "zeta": "𝜁",
            "theta": "𝜃",
            "phi": "𝜙",
            "pi": "𝜋",
            "Pi": "𝛱",
            "delta": "𝛿",
            "mu": "𝜇",
            "rho": "𝜌",
            "Omega": "𝛺",
            "partial": "∂",
            "sigma": "𝜎",
            "nabla": "∇",
            "wedge": "∧",
            "otimes": "⊗",
            "circ": "∘",
        }
    });
    async prepare(statement: string): Promise<void> {
        await this.casEngineProcess.processRaw(statement, false);
    }

    async run(statement: string, ops?: P2Pr.TransformOptions) {
        const code = `
expr=${statement}
rootDic = ___mcSympyExprDump(expr)
json.dumps(rootDic)
`;

        const [, blocks] = await this.casEngineProcess.processRaw(code, true, {
            mul: { order: false }, /** the order algorithm will change frequently, we don't want to test fail all */
            add: { order: false }, /** the order algorithm will change frequently, we don't want to test fail all */
            ...ops,
        });
        let blocksText = "";
        if (blocks) {
            blocksText = this.blocksToText(blocks);
        }
        // if (log) {
        //     console.log(blocks);
        // }
        return blocksText
    }

    blocksToText(blocks: BlockModel[]): string {
        return blocks.map(b => {
            if (b.type == "single") {
                if (b.text.length == 1) {
                    return b.text;
                }
                if (b.text == "\\left\\angle") {
                    return "<"
                }
                if (b.text == "\\right\\angle") {
                    return ">"
                }
                if (b.text == "\\left\\lfloor") {
                    return "⌊"
                }
                if (b.text == "\\right\\rfloor") {
                    return "⌋"
                }
                if (b.text == "\\left\\lceil") {
                    return "⌈"
                }
                if (b.text == "\\right\\rceil") {
                    return "⌉"
                }
                if (b.text == "\\left|" || b.text == "\\right|") {
                    return "|"
                }
                if (b.text == "\\left{") {
                    return "{"
                }
                if (b.text == "\\right}") {
                    return "}"
                }


                return `[b,${b.text}${this.styleToText(b.style)}]`;
            }
            if (b.type == "composite") {
                const elements = Object.keys((b as CompositeBlockModel).elements)
                    .map(c => {
                        const lines = (b as CompositeBlockModel).elements[c].lines;
                        if (lines.length == 1) {
                            return this.blocksToText(lines[0].blocks)
                        } else {
                            return lines.map(l => this.blocksToText(l.blocks)).join("💔")
                        }
                    })

                if (b.text == "\\power-index" && elements.length == 1) {
                    if ((b as CompositeBlockModel).elements["indexValue"]) {
                        (b.text as any) = " ⛏️";
                    }
                }
                let prefix = "";
                if ((b as TabularBlockModel).row) {
                    prefix = "🏓";
                }
                if ((b as MatrixLikeBlockModel).bracket) {
                    prefix = `${(b as MatrixLikeBlockModel).bracket}${prefix}${this.rightBracketOf((b as MatrixLikeBlockModel).bracket)}`
                }

                return `[${prefix}${this.reduceFuncName(b.text.substr(1))},${elements.join(",")}${this.styleToText(b.style)}]`
            }
            if (b.style?.mathType == "\\text") {
                return `[📜,[${b.text}]]`;
            }
            return `[${b.text}${this.styleToText(b.style)}]`;
        }).join("");
    }

    private rightBracketOf(br: string) {
        switch (br) {
            case "(": return ")";
            case "[": return "]";
            case "{": return "}";
        }
        return "";
    }

    private styleToText(bs: BlockStyle): string {
        if (!bs) {
            return "";
        }

        return `,${Object.values(bs).map(vl => this.reduceStyleName(vl)).join("|")}`
    }

    private reduceStyleName(sn: string): string {
        switch (sn) {
            case "\\mathbf": return "bf"
        }
        if (sn.startsWith("\\")) {
            return sn.substr(1);
        }

        return sn;
    }

    private reduceFuncName(name: string): string {
        return commonFuncReducedMap[name] || name;
    }

}

const commonFuncReducedMap: { [k: string]: string } = {
    "power-index": "💪",
    "small-hat": "🎩",
    "operatorname": "⚙️",
    "text": "📜",
}

const constFuncs = [
    "sin",
    "dim",
    "cos",
    "tan",
    "sec",
    "cot",
    "csc",
    "arccos",
    "arccot",
    "arccsc",
    "arcsec",
    "arcsin",
    "arctan",
    "sinh",
    "cosh",
    "tanh",
    "sech",
    "coth",
    "csch",
    "arccosh",
    "arccoth",
    "arccsch",
    "arcsech",
    "arcsinh",
    "arctanh",
    "exp",
    "ln",
    "log",
    "min",
    "max",
    "sgn",
    "inf",
    "deg",
    "det",
    "ker",
    "hom",
    "arg",
    "Pr",
    "gcd",
    "lg",
    "mod",
    "bmod",
    "acos",
    "asin",
    "atan",
]

export const testHelper = new TestHelper();

