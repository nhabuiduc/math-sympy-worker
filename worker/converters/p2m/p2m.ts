import { P2Pr } from "./p2pr";
import { Pr2M } from "./pr2m";
import type { PyodideNs } from "../../pyodide-models";
export class P2M {
    private p2Pr: P2Pr;
    private pr2m: Pr2M;

    constructor(constantTextFuncSet: Set<string>, symbolLatexNames: { [key: string]: string }) {
        this.p2Pr = new P2Pr(symbolLatexNames);
        this.pr2m = new Pr2M(constantTextFuncSet, symbolLatexNames)
    }

    convert(data: PyodideNs.DummyPythonRunnerResult, ops?: P2Pr.TransformOptions): BlockModel[] {
        ops = this.mergeWithDefault(ops);
        const pr = this.p2Pr.convert(data as any, ops);
        const md = this.pr2m.convert(pr);
        return md.blocks;
    }

    private mergeWithDefault(ops?: P2Pr.TransformOptions): P2Pr.TransformOptions {
        ops = ops || {};
        const rs: P2Pr.TransformOptions = {};
        for (const key in this.defaultOps) {
            (rs as any)[key] = Object.assign({}, (this.defaultOps as any)[key], (ops as any)[key])
        }

        return rs;
    }

    private defaultOps: Required<P2Pr.TransformOptions> = {
        add: {
            flatten: true,
            order: true,
        },
        float: {
            decimalSeprator: "dot",
        },
        frac: {
            combineAdd: true,
            combineMul: true,
            combineLogFrac: true,
            combineNumAndDenoSamePow: true,
            extractMinus: true,
        },
        mul: {
            flatten: true,
            order: true,
        },
        pow: {
            halfToRootSquare: true,
            negativeIntegerToFrac: true,
            negativeOneToFrac: true,
            oneOfIntegerToPowOfRootSquare: true,
        },
        sqrt: {
            combineMul: true,
        }
    }
}