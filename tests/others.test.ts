import { defineSympyExprDumpFunc } from "@sympy-worker/python-code";
import { expect } from "chai";
import { testHelper as th } from "./test-helper";

/** Test from: https://github.com/sympy/sympy/blob/master/sympy/printing/tests/test_latex.py */
describe("Others", () => {
    it.only("symbol with multiple characters", async () => {
        // await th.prepare(defineSympyExprDumpFunc);
        await th.prepare(`
x_star = Symbol('x^*')
f = Function('f')`);

        expect(await th.run("x_star**2")).equal(`([x^*])[pow,[2]]`);
        expect(await th.run("Derivative(f(x_star), x_star,2)")).equal(`[frac,[d][pow,[2]],[d]([x^*])[pow,[2]]][f]([x^*])`);

        expect(await th.run("2*Integral(x, x)/3")).equal(`[frac,[d][pow,[2]],[d]([x^*])[pow,[2]]][f]([x^*])`);


    })
});