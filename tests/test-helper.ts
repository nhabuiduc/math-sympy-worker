import { CasEngineProcess } from "@sympy-worker/cas-engine-process";
import { PyodideNs } from "@sympy-worker/pyodide-models";
declare const pyodide: PyodideNs.PythonRunner;


class TestHelper {
    private casEngineProcess = new CasEngineProcess(pyodide, { constantTextFuncs: constFuncs })
    async prepare(statement: string): Promise<void> {
        this.casEngineProcess.processRaw(statement, false);
    }

    async run(statement: string) {
        const code = `
expr=${statement}
rootDic = ___mcSympyExprDump(expr)
json.dumps(rootDic)
`;
        const [, blocks] = await this.casEngineProcess.processRaw(code, true);
        let blocksText = "";
        if (blocks) {
            blocksText = this.blocksToText(blocks);
        }
        return blocksText
    }

    blocksToText(blocks: BlockModel[]): string {
        return blocks.map(b => {
            if (b.type == "single") {
                if(b.text.length == 1) {
                    return b.text;
                }
                return `[b,${b.text}${this.styleToText(b.style)}]`;
            }
            if (b.type == "composite") {
                const elements = Object.keys((b as CompositeBlockModel).elements)
                    .map(c => this.blocksToText((b as CompositeBlockModel).elements[c].lines[0].blocks))
                    .join(",");
                return `[${this.reduceFuncName(b.text.substr(1))},${elements}${this.styleToText(b.style)}]`
            }
            return `[${b.text}${this.styleToText(b.style)}]`;
        }).join("");
    }

    private styleToText(bs: BlockStyle): string {
        if (!bs) {
            return "";
        }

        return `,${Object.keys(bs).map(k => bs[k]).join("|")}`
    }

    private reduceFuncName(name: string): string {
        return commonFuncReducedMap[name] || name;
    }

}

const commonFuncReducedMap = {
    "power-index": "pow"
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

