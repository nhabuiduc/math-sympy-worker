import { generator } from "@lib-shared/id-generator";
import objectHelper from "@lib-shared/object-helper";
import stringHelper from "@lib-shared/string-helper";
import { tabularKeyInfoHelper } from "@lib-shared/tabular-key-info-helper";
import { sympyToMcConstantFuncs } from "../mapping/generic-func-map";
import { P2Pr } from "./p2pr";
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
        // const compositeBlock: CompositeBlockModel = {
        //     id: generator.nextId(),
        //     type: "composite",
        //     text: "\\power-index",
        //     elements: {
        //         indexValue: {
        //             id: generator.nextId(),
        //             lines: blocksOrText,
        //         }
        //     },
        //     style
        // }
        // return compositeBlock;
    }
    bracketBlock(bracket: BlockBd.SupportBracket): BlockModel {
        return { id: generator.nextId(), type: "single", text: bracket }
    }
    hat(text: string, style?: BlockStyle) {
        return this.compositeBlock("\\small-hat", ["value"], [[this.textBlock(text)]], style);
    }

    normalText(text: string): BlockModel {
        return this.compositeBlock("\\text", ["textValue"], [[this.textBlock(text)]]);
    }



    operatorFuncBlock(name: string, constantTextFuncSet: Set<string>, symbolLatexNames: { [key: string]: string }): BlockModel {
        let mappedMcFuncName = sympyToMcConstantFuncs[name] || name;
        if (constantTextFuncSet.has(mappedMcFuncName)) {
            return this.opConstantBlock(name);
        }

        if (symbolLatexNames[mappedMcFuncName]) {
            mappedMcFuncName = symbolLatexNames[mappedMcFuncName];
        }

        if (stringHelper.length(mappedMcFuncName) == 1) {
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

    matrixFromTexts(texts: string[][], bracket: "(" | "["): MatrixLikeBlockModel {
        const matrixBlock = this.compositeBlock("\\matrix", [], []) as MatrixLikeBlockModel;
        matrixBlock.bracket = bracket;
        matrixBlock.row = texts.length;
        matrixBlock.column = texts[0].length;

        for (let rIdx = 0; rIdx < matrixBlock.row; rIdx++) {
            for (let cIdx = 0; cIdx < matrixBlock.column; cIdx++) {
                const cellKey = tabularKeyInfoHelper.getKeyFromRowCol(rIdx, cIdx);
                const editor = this.editorFrom([this.textBlock(texts[rIdx][cIdx])]);
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
        name: "\\power-index" | "\\frac" | "\\sqrt" | "\\matrix" | "\\text" | "\\small-tilde" | "\\small-hat" | "\\middle|" |
            "\\operatorname" | `\\${"i" | "ii" | "iii" | "iii"}nt` | "\\overline" | "\\rightarrow",
        elementNames: ("powerValue" | "indexValue" | "value" | "sub1" | "textValue")[] = [],
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

    argumentBlocks(blockss: BlockModel[][], join: string, bracketType: "(" | "[" = "("): Pr2M.CResult {
        return this.wrapBetweenBrackets(this.joinBlocks(blockss, join), bracketType);
    }

    wrapBracketIfOp(rs: Pr2M.CResult): BlockModel[] {
        return (rs.prUnit == "op") ? this.wrapBetweenBrackets(rs.blocks).blocks : rs.blocks;
    }

    /**Fix to have deepclone block */
    joinBlocks(blockss: BlockModel[][], textOrBlock?: string | (() => BlockModel)) {
        let rs: BlockModel[] = [];
        for (let idx = 0; idx < blockss.length; idx++) {
            let blocks = blockss[idx];

            if (idx <= 0 || !textOrBlock) {
                rs = this.combine2Blockss(rs, blocks);
            } else {
                rs = this.combineMultipleBlocks(rs, typeof textOrBlock == "string" ? [this.textBlock(textOrBlock)] : [textOrBlock()], blocks);
            }

        }

        return rs;
    }

    wrapBetweenBrackets(blocks: BlockModel[], bracketType: P2Pr.SupportBracket = "("): Pr2M.CResult {
        const latexLeft = this.leftLatexBracketName(bracketType);
        const latexRight = this.rightLatexBracketName(bracketType);
        return {
            blocks: [blockBd.bracketBlock(latexLeft)].concat(blocks).concat([blockBd.bracketBlock(latexRight)]),
            prUnit: "bracket",
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
        }
    }
}

export const blockBd = new BlockBd();

export namespace BlockBd {
    export type SupportLeftBracket = "(" | "[" | "\\left\\angle" | "\\left\\lfloor" | "\\left\\lceil" | "\\left|";
    export type SupportRightBracket = ")" | "]" | "\\right\\angle" | "\\right\\rfloor" | "\\right\\rceil" | "\\right|";
    export type SupportBracket = SupportLeftBracket | SupportRightBracket;
}