import { _l } from "@sympy-worker/light-lodash";
import { P2Pr } from "../p2pr";
import { prTh } from "../pr-transform/pr-transform-helper";
import { P2PrItemBase } from "./p2pr-item-base";

export class NDimArray extends P2PrItemBase {
    convert(obj: P2Pr.PF<"NDimArray">): Symbol {
        const allSs = this.m(obj.args) as P2Pr.VarList[];
        const dimSymbols = allSs[1].symbols as P2Pr.Var[];
        if (dimSymbols.length == 0) {
            return allSs[0].symbols[0];
        }

        const dims = dimSymbols.map(c => prTh.extractIntegerValue(c))
        const items = allSs[0].symbols;
        if (dims.length == 2 && dims[0] == 1) {
            return prTh.matrix([[this.toMatrix(items, 1, dims[1], [])]], "[")
        }
        if (dims.length % 2 == 1) {
            dims.unshift(1);
        }

        const [nextRow, nextCol, ...rest] = dims;
        return this.toMatrix(items, nextRow, nextCol, rest);
    }

    private toMatrix(items: Symbol[], row: number, col: number, remains: number[]): P2Pr.Matrix {
        const chunkSize = Math.floor(items.length / (row * col));

        if (remains.length <= 0 || chunkSize == 1) {
            return prTh.matrix({
                ss: items,
                row, col
            }, "[")
        }

        const [nextRow, nextCol, ...rest] = remains;
        return prTh.matrix({
            ss: _l.chunk(items, chunkSize).map(c => this.toMatrix(c, nextRow, nextCol, rest)),
            row: row, col: col,
        }, "[")
    }
}

type Symbol = P2Pr.Symbol;