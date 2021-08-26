import { blockBd } from "../block-bd";
import { P2Pr } from "../p2pr";
import { prTh } from "../pr-transform/pr-transform-helper";
import { Pr2M } from "../pr2m";
import { Pr2MCommon } from "./pr2m-common";

export class Pow {
    constructor(
        private main: { convert(obj: P2Pr.Symbol): Pr2M.CResult },
        private prCommon: Pr2MCommon,
    ) {

    }


    convert(obj: P2Pr.Pow): Pr2M.CResult {
        const { symbols: args } = obj;
        if (args.length > 3) {
            throw new Error("Unsupported power with different than 2,3 arguments");
        }

        if (args[0].type == "GenericFunc") {
            return this.handlePowToGenericFunc(args);
        }

        let arg0Cr = this.main.convert(args[0]);
        let { blocks: base } = arg0Cr;

        if (!prTh.considerPresentAsSingleUnit(args[0], arg0Cr)) {
            base = blockBd.wrapBetweenBrackets(base).blocks;
        }

        const power = this.main.convert(args[1]).blocks;

        if (args[2]) {
            const index = this.main.convert(args[2]).blocks;
            const cBlock = blockBd.compositeBlock("\\power-index", ["powerValue", "indexValue"], [power, index]);
            return { blocks: base.concat([cBlock]), prUnit: "pow", };

        }
        return { blocks: base.concat([blockBd.compositeBlock("\\power-index", ["powerValue"], [power])]), prUnit: "pow", }
    }

    private handlePowToGenericFunc(powArgs: P2Pr.Symbol[]): Pr2M.CResult {
        const genericFunc = powArgs[0] as P2Pr.GenericFunc;
        const { name, args } = this.prCommon.buildGenericFunc(genericFunc);

        let powerBlock: CompositeBlockModel;
        const power = this.main.convert(powArgs[1]).blocks;
        if (powArgs[2]) {
            const index = this.main.convert(powArgs[2]).blocks;
            powerBlock = blockBd.compositeBlock("\\power-index", ["powerValue", "indexValue"], [power, index]);
        } else {
            powerBlock = blockBd.compositeBlock("\\power-index", ["powerValue"], [power]);
        }

        const rsBlocks = genericFunc.powerIndexAfter ? [...name, ...args, powerBlock] : [...name, powerBlock, ...args];

        return {
            blocks: rsBlocks,
            prUnit: "pow",
        }
    }
}