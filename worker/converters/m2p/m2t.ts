import stringHelper from "@lib-shared/string-helper";
import { tabularKeyInfoHelper } from "@lib-shared/tabular-key-info-helper";



export class M2T {
    constructor(private constantTextFuncSet: Set<string>) {

    }
    parse(blocks: BlockModel[]): Token[] {
        const rs = blocks.reduce((prev, c) => prev.concat(this.parseBlock(c)), [] as Token[]);
        return rs;
    }

    parseText(text: string): Token[] {
        const uText = stringHelper.getUnistringUncached(text)
        let tokens: Token[] = [];
        const textLength = uText.length;
        for (let idx = 0; idx < textLength; idx++) {
            const c = uText.clusterAt(idx);
            if (c == ",") {
                this.addToken(tokens, { type: "coma-token" });
                continue;
            }
            if (c.match(/\s/)) {
                this.addToken(tokens, { type: "space-token" });
                continue;
            }

            if (c.match(/\d/)) {
                this.addToken(tokens, { type: "number-token", text: c });
                continue;
            }

            if (c == ".") {
                this.addToken(tokens, ".");
                continue;
            }

            if (c == "+" || c == "-" || c == "*" || c == "/" || c == "×") {
                this.addToken(tokens, { type: "op-token", op: c });
                continue;
            }

            if (c == "(" || c == "{" || c == "[") {
                this.addToken(tokens, { type: "bracket-token", state: "open", text: c });
                continue;
            }

            if (c == ")" || c == "}" || c == "]") {
                this.addToken(tokens, { type: "bracket-token", state: "close", text: c });
                continue;
            }

            this.addToken(tokens, { type: "text-token", text: c });
        }

        return tokens;
    }

    private parseBlock(block: BlockModel): Token[] {
        if (!block.type) {
            return this.parseTextBlock(block);
        }

        if (block.type == "single") {
            if (this.isOpenBlock(block)) {
                return [{ type: "bracket-token", state: "open", text: "(" }]
            }
            if (this.isCloseBlock(block)) {
                return [{ type: "bracket-token", state: "close", text: ")" }]
            }

            return [];
        }

        if (this.isComposite(block)) {
            if (this.isPowerOrIndex(block)) {
                return [{
                    type: "container-token",
                    groupType: "power-index",
                    power: this.getTokensFromElement(block, "powerValue"),
                    index: this.getTokensFromElement(block, "indexValue"),
                    indexRaw: block.elements.indexValue,
                }]
            }
            if (this.isFrac(block)) {
                return [{
                    type: "container-token",
                    groupType: "frac",
                    enumerator: this.getTokensFromElement(block, "value"),
                    denominator: this.getTokensFromElement(block, "sub1"),
                }]
            }
            if (this.isSqrt(block)) {
                return [{
                    type: "container-token",
                    groupType: "sqrt",
                    base: this.getTokensFromElement(block, "value"),
                    root: this.getTokensFromElement(block, "sub1"),
                }]
            }

            if (this.isMatrix(block)) {
                return [this.parseMatrix(block)];
            }

            const nameWithoutSlash = block.text.slice(1);
            if (this.constantTextFuncSet.has(nameWithoutSlash)) {
                return [{ type: "name-token", text: nameWithoutSlash }]
            }
        }

        return [];
    }

    private parseMatrix(block: TabularBlockModel): M2T.MatrixContainerToken {
        const cells = new Array<M2T.Tokens[]>(block.row);
        for (let rIdx = 0; rIdx < block.row; rIdx++) {
            const row = new Array<M2T.Tokens>(block.column);
            cells[rIdx] = row;
            for (let cIdx = 0; cIdx < block.column; cIdx++) {
                const key = tabularKeyInfoHelper.getKeyFromRowCol(rIdx, cIdx);
                row[cIdx] = { tokens: this.getTokensFromElement(block, key) }
            }
        }

        return { type: "container-token", groupType: "matrix", cells };
    }

    private isComposite(block: BlockModel): block is CompositeBlockModel {
        return block.type == "composite";
    }

    private getTokensFromElement<T extends CompositeBlockModel>(block: T, name: string) {
        if (!block.elements[name]) {
            return [];
        }

        return this.parse(block.elements[name].lines[0].blocks);
    }

    private isOpenBlock(block: BlockModel) {
        if (block.text.length == 1) {
            switch (block.text) {
                case "(":
                case "{":
                case "[": {
                    return true;
                }
            }
            return false;
        }
        return block.text.startsWith("\\left");
    }

    private isCloseBlock(block: BlockModel) {
        if (block.text.length == 1) {
            switch (block.text) {
                case ")":
                case "}":
                case "]": {
                    return true;
                }
            }
            return false;
        }
        return block.text.startsWith("\\right");
    }


    private isSqrt(block: BlockModel) {
        return block.text == "\\sqrt";
    }

    private isMatrix(block: BlockModel): block is TabularBlockModel {
        return block.text == "\\pmatrix" || block.text == "\\matrix" || block.text == "\\bmatrix" ||
            block.text == "\\Bmatrix" || block.text == "\\vmatrix" || block.text == "\\Vmatrix" || block.text == "\\smallmatrix";
    }

    private isFrac(block: BlockModel) {
        return block.text == "\\frac" || block.text == "\\dfrac" || block.text == "\\tfrac" || block.text == "\\crac";
    }

    private isPowerOrIndex(block: BlockModel) {
        return block.text == "\\power-index" || block.text == "\\power" || block.text == "\\index";
    }

    private parseTextBlock(block: TextBlockModel): Token[] {
        return this.parseText(block.text);
    }


    private addToken(tokens: Token[], token: Token | ".") {

        const last = tokens[tokens.length - 1];
        if (token == ".") {
            if (last && last.type == "number-token" && last.text.indexOf(".") < 0) {
                last.text += ".";
                return;
            }

            throw new Error("Unexpected \".\" character");
        }

        if (tokens.length <= 0) {
            tokens.push(token);
            return;
        }

        if (!this.combineToken(last, token)) {
            tokens.push(token);
        }
    }

    private combineToken(to: Token, from: Token): boolean {
        if (to.type != from.type) {
            return false;
        }

        switch (to.type) {
            case "text-token": {
                to.text = to.text + (from as TextToken).text;
                return true;
            }
            case "number-token": {
                to.text = to.text + (from as NumberToken).text;
                return true;
            }
            case "op-token": {
                to.op = to.op + (from as M2T.OpToken).op;
                return true;
            }
            case "space-token": {
                return true;
            }
        }
    }
}

type Token = M2T.Token;
type TextToken = M2T.TextToken;
type NumberToken = M2T.NumberToken;

export namespace M2T {
    export type Token = TextToken | SpaceToken | NumberToken | OpToken | BracketToken | ContainerToken | NameToken | ComaToken | MatrixContainerToken;
    export interface Tokens {
        tokens: Token[];
    }

    export interface TextToken {
        type: "text-token";
        text: string;
    }

    export interface NameToken {
        type: "name-token";
        text: string;
    }


    export interface SpaceToken {
        type: "space-token";
    }

    export interface OpToken {
        type: "op-token";
        op: string;
    }

    export interface NumberToken {
        type: "number-token";
        text: string;
    }

    export interface BracketToken {
        type: "bracket-token";
        text: string;
        state: "open" | "close";
    }

    export interface ComaToken {
        type: "coma-token";
    }

    export type ContainerToken = PowerIndexContainerToken | FracContainerToken | SqrtContainerToken | MatrixContainerToken;

    export interface PowerIndexContainerToken {
        type: "container-token";
        groupType: "power-index";
        power: Token[];
        index: Token[];
        indexRaw: EditorModel;
    }

    export interface SqrtContainerToken {
        type: "container-token";
        groupType: "sqrt";
        base: Token[];
        root: Token[];
    }

    export interface FracContainerToken {
        type: "container-token";
        groupType: "frac";
        enumerator: Token[];
        denominator: Token[];
    }

    export interface MatrixContainerToken {
        type: "container-token";
        groupType: "matrix";
        cells: Tokens[][];
    }
}
