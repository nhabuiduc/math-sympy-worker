import { P2Pr } from "../p2pr";
import { Pr2M } from "../pr2m";
import { GenericFunc } from "./generic-func";
import { Pr2MCommon } from "./pr2m-common";

export abstract class Pr2MItemBase {
    constructor(protected main: {
        c(obj: P2Pr.Symbol): Pr2M.CResult;
        m(ss: Symbol[]): BlockModel[][];
        ctx: Pr2M.ConvertContext;
        prCommon: Pr2MCommon;
        genericFunc: GenericFunc;
    }) {

    }

    protected c(s: Symbol): Pr2M.CResult {
        return this.main.c(s);
    }
    protected m(s: Symbol[]): BlockModel[][] {
        return this.main.m(s);
    }
}

type Symbol = P2Pr.Symbol;