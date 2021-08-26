import { P2Pr } from "./p2pr";
import { Pr2M } from "./pr2m";
import type { PyodideNs } from "../../pyodide-models";
export class P2M {
    private p2Pr: P2Pr;
    private pr2m: Pr2M;

    constructor(constantTextFuncSet: Set<string>, symbolLatexNames: { [key: string]: string }) {
        this.p2Pr = new P2Pr(symbolLatexNames);
        this.pr2m = new Pr2M(constantTextFuncSet)
    }

    convert(data: PyodideNs.DummyPythonRunnerResult, ops?: P2Pr.TransformOptions): BlockModel[] {
        const pr = this.p2Pr.convert(data as any, ops);
        const md = this.pr2m.convert(pr);
        return md.blocks;
    }
}