import { expect } from "chai";
import { testHelper as th } from "./test-helper";

/** Test from: https://github.com/sympy/sympy/blob/master/sympy/printing/tests/test_latex.py */
describe("1: Mul", () => {
    it("convert", async () => {
        expect(await th.run("x+10")).equal(`[x+10]`);
        expect(await th.run("x**2")).equal(`[x][💪,[2]]`);
        expect(await th.run("x**(1 + x)")).equal(`[x][💪,[x+1]]`);
        expect(await th.run("x**3 + x + 1 + x**2")).equal(`[x][💪,[3]][+x][💪,[2]][+x+1]`);
        expect(await th.run("2*x*y")).equal(`[2xy]`);
        expect(await th.run("3*x**2*y")).equal(`[3x][💪,[2]][y]`);
        expect(await th.run("1.5*3**x")).equal(`[1.5×3][💪,[x]]`);

        expect(await th.run("Mul(0, 1, evaluate=False)")).equal(`[0×1]`);
        expect(await th.run("Mul(1, 0, evaluate=False)")).equal(`[1×0]`);
        expect(await th.run("Mul(1, 1, evaluate=False)")).equal(`[1×1]`);
        expect(await th.run("Mul(-1, 1, evaluate=False)")).equal(`[-1×1]`);
        expect(await th.run("Mul(1, 1, 1, evaluate=False)")).equal(`[1×1×1]`);
        expect(await th.run("Mul(1, 2, evaluate=False)")).equal(`[1×2]`);
        expect(await th.run("Mul(1, S.Half, evaluate=False)")).equal(`[1×][frac,[1],[2]]`);
        expect(await th.run("Mul(1, 1, S.Half, evaluate=False)")).equal(`[1×1×][frac,[1],[2]]`);
        expect(await th.run("Mul(1, 1, 2, 3, x, evaluate=False)")).equal(`[1×1×2×3x]`);
        expect(await th.run("Mul(1, -1, evaluate=False)")).equal(`[1×]([-1])`);
        expect(await th.run("Mul(4, 3, 2, 1, 0, y, x, evaluate=False)")).equal(`[4×3×2×1×0yx]`);
        expect(await th.run("Mul(4, 3, 2, 1+z, 0, y, x, evaluate=False)")).equal(`[4×3×2]([z+1])[0yx]`);
        expect(await th.run("Mul(Rational(2, 3), Rational(5, 7), evaluate=False)")).equal(`[frac,[2],[3]][frac,[5],[7]]`);
    });
    
})

