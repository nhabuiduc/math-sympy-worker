import { expect } from "chai";
import { testHelper as th } from "./test-helper";

/** Test from: https://github.com/sympy/sympy/blob/master/sympy/printing/tests/test_latex.py */
describe("2: Frac", () => {
    it("convert", async () => {
        expect(await th.run("1/x")).equal(`[frac,[1],[x]]`);
        expect(await th.run("-S(3)/2")).equal(`[-][frac,[3],[2]]`);
        expect(await th.run("1/x**2")).equal(`[frac,[1],[x][💪,[2]]]`);
        expect(await th.run("1/(x + y)/2")).equal(`[frac,[1],[2]([x+y])]`);
        expect(await th.run("x/2")).equal(`[frac,[x],[2]]`);
        expect(await th.run("(x + y)/(2*x)")).equal(`[frac,[x+y],[2x]]`);
        expect(await th.run("(x + y)/x")).equal(`[frac,[x+y],[x]]`);
        expect(await th.run("(2*sqrt(2)*x)/3")).equal(`[frac,[2x][sqrt,[2]],[3]]`);
        expect(await th.run("binomial(x, y)")).equal(`[(🏓)binom,[x],[y]]`);
    })
});