import { generator } from "@lib-shared/id-generator";
import objectHelper from "@lib-shared/object-helper";
import stringHelper from "@lib-shared/string-helper";
import { tabularKeyInfoHelper } from "@lib-shared/tabular-key-info-helper";
import { sympyToMcConstantFuncs } from "../mapping/generic-func-map";
import { P2Pr } from "./p2pr";
import { prTh } from "./pr-transform/pr-transform-helper";
import type { Pr2M } from "./pr2m";

class BlockBd {

    blocks(...blocks: BlockModel[]): BlockModel[] {
        return this.combineBlocks(blocks);
    }

    fracBlock(num: BlockModel[], den: BlockModel[]) {
        return this.compositeBlock("\\frac", ["value", "sub1"], [num, den]);
    }
    binomBlock(first: BlockModel[], second: BlockModel[]) {
        return this.tabular("\\binom", ["0_0", "1_0"], [first, second], "(");
    }

    powerBlock(text: string | BlockModel[], style?: BlockStyle): BlockModel {
        if (typeof text == "string") {
            return this.compositeBlock("\\power-index", ["powerValue"], [[this.textBlock(text)]], style);
        }

        return this.compositeBlock("\\power-index", ["powerValue"], [text], style);
    }

    indexBlock(blocksOrText: BlockModel[] | string, style?: BlockStyle): BlockModel {
        if (typeof blocksOrText == "string") {
            return this.compositeBlock("\\power-index", ["indexValue"], [[this.textBlock(blocksOrText)]], style);
        }

        return this.compositeBlock("\\power-index", ["indexValue"], [blocksOrText])
    }
    bracketBlock(bracket: BlockBd.SupportBracket): BlockModel {
        return { id: generator.nextId(), type: "single", text: bracket }
    }
    over(textOrBlocks: string | BlockModel[], name: P2Pr.OverSymbol["op"], style?: BlockStyle) {
        let latexName: "\\small-hat" | "\\overline" = "\\small-hat";
        switch (name) {
            case "hat": {
                latexName = "\\small-hat";
                break;
            }
            case "overline": {
                latexName = "\\overline";
                break;
            }
        }
        if (typeof textOrBlocks == "string") {
            return this.compositeBlock(latexName, ["value"], [[this.textBlock(textOrBlocks)]], style);
        }

        return this.compositeBlock(latexName, ["value"], [textOrBlocks], style);
    }

    normalText(text: string): BlockModel {
        return this.compositeBlock("\\text", ["textValue"], [[this.textBlock(text)]]);
    }

    style(obj: { bold?: P2Pr.BoldType }): BlockStyle {
        let style: BlockStyle = undefined;
        if (obj.bold == "blackboard") {
            style = { ...style, mathType: "\\mathbb" }
        } else if (obj.bold == "calligraphic") {
            style = { ...style, mathType: "\\mathcal" }
        }
        else if (obj.bold) {
            style = { ...style, mathType: "\\mathbf" }
        }
        return style;
    }

    // lines(blockModel)


    operatorFuncBlock(name: string, constantTextFuncSet: Set<string>, symbolLatexNames: { [key: string]: string }, forceOp: boolean): BlockModel {
        let mappedMcFuncName = sympyToMcConstantFuncs[name] || name;
        if (constantTextFuncSet.has(mappedMcFuncName)) {
            return this.opConstantBlock(name);
        }

        if (symbolLatexNames[mappedMcFuncName]) {
            mappedMcFuncName = symbolLatexNames[mappedMcFuncName];
        }

        if (stringHelper.length(mappedMcFuncName) == 1 && !forceOp) {
            return blockBd.textBlock(mappedMcFuncName);
        }

        return blockBd.operatorNameBlock(mappedMcFuncName)

    }

    operatorNameBlock(name: string) {
        return this.compositeBlock("\\operatorname", ["value"], [[this.textBlock(name)]]);
    }

    private opConstantBlock(name: string): CompositeBlockModel {
        const block: CompositeBlockModel = {
            id: generator.nextId(),
            type: "composite",
            text: `\\${name}`,
            elements: {
            }
        }
        return block;
    }

    matrixFromTexts(texts: string[][] | BlockModel[][][], bracket: "(" | "[" | undefined, matrixName: "\\matrix" | "\\cases" = "\\matrix"): MatrixLikeBlockModel {
        const matrixBlock = this.compositeBlock(matrixName, [], []) as MatrixLikeBlockModel;
        matrixBlock.bracket = bracket;
        matrixBlock.row = texts.length;
        matrixBlock.column = texts[0].length;

        for (let rIdx = 0; rIdx < matrixBlock.row; rIdx++) {
            for (let cIdx = 0; cIdx < matrixBlock.column; cIdx++) {
                const cellKey = tabularKeyInfoHelper.getKeyFromRowCol(rIdx, cIdx);
                const val = texts[rIdx][cIdx];
                const editor = this.editorFrom(typeof val == "string" ? [blockBd.textBlock(val)] : val);
                (matrixBlock.elements[cellKey] as EditorModel) = editor;
            }
        }
        return matrixBlock
    }

    tabular(name: "\\binom", elementNames: (`${number}_${number}`)[], innerBlocks: BlockModel[][], bracket?: P2Pr.SupportBracket) {
        const cblock = this.compositeBlock(name as any, elementNames as any, innerBlocks) as TabularBlockModel;
        let maxRow = 0;
        let maxCol = 0;
        elementNames.forEach(key => {
            const { row, column } = tabularKeyInfoHelper.getTabularCellIndexFromKey(key);
            maxRow = Math.max(maxRow, row);
            maxCol = Math.max(maxCol, column);
        });
        cblock.row = maxRow + 1;
        cblock.column = maxCol + 1;
        if (bracket) {
            (cblock as MatrixLikeBlockModel).bracket = bracket;
        }

        return cblock;
    }



    compositeBlock(
        name: `\\${"i" | "ii" | "iii" | "iii"}nt` | "\\sum" | "\\prod" | "\\lim",
        elementNames?: ("from" | "to")[],
        innerBlocks?: BlockModel[][],
        style?: BlockStyle): CompositeBlockModel;


    compositeBlock(
        name: "\\power-index" | "\\frac" | "\\sqrt" | "\\matrix" | "\\array" | "\\text" | "\\small-tilde" | "\\small-hat" | "\\middle|" |
            "\\operatorname" | "\\overline" | "\\rightarrow" | "\\bmod" | "\\prescript" | "\\cases",
        elementNames?: ("powerValue" | "indexValue" | "value" | "sub1" | "textValue")[],
        innerBlocks?: BlockModel[][],
        style?: BlockStyle): CompositeBlockModel;

    compositeBlock(
        name: string,
        elementNames: (string)[] = [],
        innerBlocks: BlockModel[][] = [],
        style?: BlockStyle): CompositeBlockModel {
        const block: CompositeBlockModel = {
            id: generator.nextId(),
            type: "composite",
            text: name,
            elements: {
            },
            style
        }

        for (let idx = 0; idx < elementNames.length; idx++) {
            const name = elementNames[idx];
            (block.elements[name] as EditorModel) = this.editorFrom(innerBlocks[idx]);

        }

        return block;
    }

    editorFrom(blocks: BlockModel[]): EditorModel {
        return { id: generator.nextId(), lines: [{ id: generator.nextId(), blocks }] };
    }
    editorFromLines(blocks: BlockModel[][]): EditorModel {

        return {
            id: generator.nextId(),
            lines: blocks.map(bb => {
                return { id: generator.nextId(), blocks: bb }
            })
        };
    }

    textBlock(text: string, style?: BlockStyle): BlockModel {
        return {
            id: generator.nextId(),
            text: text,
            style,
        }
    }

    flattenBlocks(blocks: BlockModel[][]): BlockModel[] {
        return blocks.reduce((prev, cur) => this.combine2Blockss(prev, cur), [] as BlockModel[])
    }

    combineMultipleBlocks(...blocks: BlockModel[][]): BlockModel[] {
        return blocks.reduce((prev, cur) => this.combine2Blockss(prev, cur), [] as BlockModel[])
    }
    combine2Blockss(b1: BlockModel[], b2: BlockModel[]): BlockModel[] {
        if (b1.length <= 0) {
            return b2;
        }
        if (b2.length <= 0) {
            return b1;
        }

        const all = b1.concat(b2);

        return this.combineBlocks(all);
    }

    combineBlocks(all: BlockModel[]): BlockModel[] {
        let last: Writeable<BlockModel> = all[0];
        const rs: Writeable<BlockModel>[] = [last];
        for (let idx = 1; idx < all.length; idx++) {
            const cur = all[idx];
            if (!last.type && !cur.type && objectHelper.objectMemberEquals(last.style, cur.style)) {
                last.text = last.text + cur.text;
                continue;
            }

            last = cur;
            rs.push(last);
        }

        return rs;
    }


    wrapBracketIfNotUnitInOpCtx(s: Symbol, rs: Pr2M.CResult, ops?: { wrapEvenShortHand?: boolean, excludeSign?: boolean }): Pr2M.CResult {
        if (prTh.considerPresentAsSingleUnitInOpCtx(s, rs, ops)) {
            return rs;
        }

        return this.wrapBetweenBrackets(rs.blocks);
    }

    joinBlocks(blockss: BlockModel[][], textOrBlock?: string | (() => BlockModel | BlockModel[])) {
        let rs: BlockModel[] = [];
        for (let idx = 0; idx < blockss.length; idx++) {
            let blocks = blockss[idx];

            if (idx <= 0 || !textOrBlock) {
                rs = this.combine2Blockss(rs, blocks);
            } else {
                rs = this.combineMultipleBlocks(rs, this.resolveJoinBlocks(textOrBlock), blocks);
            }

        }

        return rs;
    }

    private resolveJoinBlocks(textOrBlock?: string | (() => BlockModel | BlockModel[])): BlockModel[] {
        if (typeof textOrBlock == "string") {
            return [this.textBlock(textOrBlock)];
        }
        const rs = textOrBlock();
        if (rs instanceof Array) {
            return rs;
        }
        return [rs];
    }

    wrapBetweenBrackets(blocks: BlockModel[], bracketType: P2Pr.SupportBracket = "(", rightBracketType?: P2Pr.SupportBracket): Pr2M.CResult {
        const latexLeft = this.leftLatexBracketName(bracketType);
        const latexRight = this.rightLatexBracketName(rightBracketType || bracketType);
        return {
            blocks: [blockBd.bracketBlock(latexLeft)].concat(blocks).concat([blockBd.bracketBlock(latexRight)]),
            prBracket: bracketType,
        }
    }

    private leftLatexBracketName(bracketType: P2Pr.SupportBracket): BlockBd.SupportLeftBracket {
        switch (bracketType) {
            case "(":
            case "[":
                return bracketType;
            case "<": return "\\left\\angle";
            case "floor": return "\\left\\lfloor";
            case "ceil": return "\\left\\lceil";
            case "|": return "\\left|";
            case "{": return "\\left{";
        }
    }
    private rightLatexBracketName(bracketType: P2Pr.SupportBracket): BlockBd.SupportRightBracket {
        switch (bracketType) {
            case "(": return ")";
            case "[": return "]";
            case "<": return "\\right\\angle";
            case "floor": return "\\right\\rfloor";
            case "ceil": return "\\right\\rceil";
            case "|": return "\\right|";
            case "{": return "\\right}";
        }
    }
}

export const blockBd = new BlockBd();

export namespace BlockBd {
    export type SupportLeftBracket = "(" | "[" | "\\left\\angle" | "\\left\\lfloor" | "\\left\\lceil" | "\\left|" | "\\left." | "\\left{";
    export type SupportRightBracket = ")" | "]" | "\\right\\angle" | "\\right\\rfloor" | "\\right\\rceil" | "\\right|" | "\\right." | "\\right}";
    export type SupportBracket = SupportLeftBracket | SupportRightBracket;
}
type Symbol = P2Pr.Symbol;