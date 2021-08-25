import { defineSympyExprDumpFunc } from "@sympy-worker/python-code";
import { expect } from "chai";
import { testHelper as th } from "./test-helper";

/** Test from: https://github.com/sympy/sympy/blob/master/sympy/printing/tests/test_latex.py */
describe("3: Others", () => {
    before(async () => {
        await th.prepare(`
        x_star = Symbol('x^*')
        f = Function('f')`);

        // await th.prepare(defineSympyExprDumpFunc);
    });

    it("symbol with multiple characters", async () => {


        expect(await th.run("x_star**2")).equal(`([x^*])[pow,[2]]`);
        expect(await th.run("Derivative(f(x_star), x_star,2)")).equal(`[frac,[d][pow,[2]],[d]([x^*])[pow,[2]]][f]([x^*])`);

        expect(await th.run("2*Integral(x, x)/3")).equal(`[frac,[2][int,][x dx],[3]]`);
    });

    it("sqrt, rational", async () => {

        expect(await th.run("sqrt(x)")).equal(`[sqrt,[x]]`);
        expect(await th.run("x**Rational(1, 3)")).equal(`[sqrt,[x],[3]]`);
        expect(await th.run("sqrt(x)**3")).equal(`[x][pow,[frac,[3],[2]]]`);
        expect(await th.run("x**Rational(3, 4)")).equal(`[x][pow,[frac,[3],[4]]]`);
        expect(await th.run("(x + 1)**Rational(3, 4)")).equal(`([x+1])[pow,[frac,[3],[4]]]`);
    });

    it("tini float value", async () => {
        expect(await th.run("1.5e20*x")).equal(`[1.5×10][pow,[20]][x]`);
    });

    it("sin", async () => {
        expect(await th.run("1/sin(x)")).equal(`[frac,[1],[sin,]([x])]`);
        expect(await th.run("sin(x)**-1")).equal(`[frac,[1],[sin,]([x])]`);
        expect(await th.run("sin(x)**Rational(3, 2)")).equal(`[sin,][pow,[frac,[3],[2]]]([x])`);
    });

    it("discrete", async () => {

        expect(await th.run("~x")).equal(`[¬][x]`);
        expect(await th.run("x & y")).equal(`[x∧y]`);
        expect(await th.run("x & y & z")).equal(`[x∧y∧z]`);
        expect(await th.run("x | y")).equal(`[x∨y]`);
        expect(await th.run("x | y | z")).equal(`[x∨y∨z]`);
        expect(await th.run("(x & y) | z")).equal(`[z∨]([x∧y])`);
        expect(await th.run("Implies(x, y)")).equal(`[x⇒y]`);
        expect(await th.run("~(x >> ~y)")).equal(`[¬]([x⇒¬y])`);
        expect(await th.run("Implies(Or(x,y), z)")).equal(`([x∨y])[⇒z]`);
        expect(await th.run("Implies(z, Or(x,y))")).equal(`[z⇒]([x∨y])`);
        expect(await th.run("~(x & y)")).equal(`[¬]([x∧y])`);
    })

    it("Pow", async () => {
        expect(await th.run("Pow(Rational(1, 3), -1, evaluate=False)")).equal(`[frac,[1],[frac,[1],[3]]]`);
        expect(await th.run("Pow(Rational(1, 3), -2, evaluate=False)")).equal(`[frac,[1],([frac,[1],[3]])[pow,[2]]]`);
        expect(await th.run("Pow(Integer(1)/100, -1, evaluate=False)")).equal(`[frac,[1],[frac,[1],[100]]]`);
    });

    it("Builtins", async () => {
        expect(await th.run("True")).equal(`[text,[True]]`);
        expect(await th.run("False")).equal(`[text,[False]]`);
        expect(await th.run("None")).equal(`[text,[None]]`);
        expect(await th.run("true")).equal(`[text,[True]]`);
        expect(await th.run("false")).equal(`[text,[False]]`);
    });
    
    it.only("SingularityFunction", async () => {
        expect(await th.run("SingularityFunction(x, 4, 5)")).equal(`<[x-4]>[pow,[5]]`);
        expect(await th.run("SingularityFunction(x, -3, 4)")).equal(`<[x+3]>[pow,[4]]`);
        expect(await th.run("SingularityFunction(x, 0, 4)")).equal(`<[x]>[pow,[4]]`);
        expect(await th.run("SingularityFunction(x, a, n)")).equal(`<[x]>[pow,[4]]`);
        
    })

});