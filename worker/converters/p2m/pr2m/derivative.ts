import { blockBd } from "../block-bd";
import type { P2Pr } from "../p2pr";

export class Derivative {
    constructor(private main: { convert(obj: P2Pr.Symbol): BlockModel[] }) {

    }

    convert(derivative: P2Pr.Derivative): BlockModel[] {
        const exprBlocks = this.main.convert(derivative.symbols[0]);
        let variableBlocks: BlockModel[] = [];
        const dLetter = derivative.partial ? "∂" : "d";
        let allVar = 0;
        for (let idx = 1; idx < derivative.symbols.length; idx++) {
            const tuple = (derivative.symbols[idx] as P2Pr.Tuple);
            const symbolBlocks = this.main.convert(tuple.symbols[0]);
            const symbolCount = Derivative.parseIntegerConstant(tuple.symbols[1]);
            variableBlocks = blockBd.combineMultipleBlocks(variableBlocks, [blockBd.textBlock(dLetter)], symbolBlocks);
            if (symbolCount > 1) {
                variableBlocks = blockBd.combine2Blocks(variableBlocks, [blockBd.powerBlock(symbolCount.toString())]);
            }
            allVar += symbolCount;
        }

        let enumeratorBlocks: BlockModel[] = [blockBd.textBlock(dLetter)];
        if (allVar > 1) {
            enumeratorBlocks = blockBd.combine2Blocks(enumeratorBlocks, [blockBd.powerBlock(allVar.toString())]);
        }

        return blockBd.wrapBetweenBrackets([
            blockBd.fracBlock(enumeratorBlocks, variableBlocks),
            ...exprBlocks
        ])

    }

    static parseIntegerConstant(s: P2Pr.Symbol): number {
        switch (s.type) {
            case "One": return 1;
            case "Zero": return 0;
            case "Integer": return s.value;
        }

        throw new Error("Unsupported symbol for parsing integer");
    }
}



// export const derivative = new Derivative();