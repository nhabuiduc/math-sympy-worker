import { defineSympyExprDumpFunc } from "@sympy-worker/python-code";
import { expect } from "chai";
import { testHelper as th } from "./test-helper";

/** Test from: https://github.com/sympy/sympy/blob/master/sympy/printing/tests/test_latex.py */
describe("3: Others", () => {
    before(async () => {
        await th.prepare(`
        x_star = Symbol('x^*')
        f = Function('f')`);

        await th.prepare(defineSympyExprDumpFunc);
    });

    it("symbol with multiple characters", async () => {
        expect(await th.run("x_star**2")).equal(`([x^*])[💪,[2]]`);
        expect(await th.run("Derivative(f(x_star), x_star,2)")).equal(`[frac,[d][💪,[2]],[d]([x^*])[💪,[2]]][f]([x^*])`);

        expect(await th.run("2*Integral(x, x)/3")).equal(`[frac,[2][int,][x dx],[3]]`);
    });

    it("sqrt, rational", async () => {

        expect(await th.run("sqrt(x)")).equal(`[sqrt,[x]]`);
        expect(await th.run("x**Rational(1, 3)")).equal(`[sqrt,[x],[3]]`);
        expect(await th.run("sqrt(x)**3")).equal(`[x][💪,[frac,[3],[2]]]`);
        expect(await th.run("x**Rational(3, 4)")).equal(`[x][💪,[frac,[3],[4]]]`);
        expect(await th.run("(x + 1)**Rational(3, 4)")).equal(`([1+x])[💪,[frac,[3],[4]]]`);
    });

    it("tini float value", async () => {
        expect(await th.run("1.5e20*x")).equal(`[1.5×10][💪,[20]][x]`);
    });

    it("sin", async () => {
        expect(await th.run("1/sin(x)")).equal(`[frac,[1],[sin,]([x])]`);
        expect(await th.run("sin(x)**-1")).equal(`[frac,[1],[sin,]([x])]`);
        expect(await th.run("sin(x)**Rational(3, 2)")).equal(`[sin,][💪,[frac,[3],[2]]]([x])`);
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
        expect(await th.run("Pow(Rational(1, 3), -2, evaluate=False)")).equal(`[frac,[1],([frac,[1],[3]])[💪,[2]]]`);
        expect(await th.run("Pow(Integer(1)/100, -1, evaluate=False)")).equal(`[frac,[1],[frac,[1],[100]]]`);
    });

    it("Builtins", async () => {
        expect(await th.run("True")).equal(`[text,[True]]`);
        expect(await th.run("False")).equal(`[text,[False]]`);
        expect(await th.run("None")).equal(`[text,[None]]`);
        expect(await th.run("true")).equal(`[text,[True]]`);
        expect(await th.run("false")).equal(`[text,[False]]`);
    });

    it("SingularityFunction", async () => {
        expect(await th.run("SingularityFunction(x, 4, 5)")).equal(`<[-4+x]>[💪,[5]]`);
        expect(await th.run("SingularityFunction(x, -3, 4)")).equal(`<[3+x]>[💪,[4]]`);
        expect(await th.run("SingularityFunction(x, 0, 4)")).equal(`<[x]>[💪,[4]]`);
        expect(await th.run("SingularityFunction(x, a, n)")).equal(`<[x-a]>[💪,[n]]`);
        expect(await th.run("SingularityFunction(x, 4, -2)")).equal(`<[-4+x]>[💪,[-2]]`);
        expect(await th.run("SingularityFunction(x, 4, -1)")).equal(`<[-4+x]>[💪,[-1]]`);
        expect(await th.run("SingularityFunction(x, 4, 5)**3")).equal(`(<[-4+x]>[💪,[5]])[💪,[3]]`);
        expect(await th.run("SingularityFunction(x, -3, 4)**3")).equal(`(<[3+x]>[💪,[4]])[💪,[3]]`);
        expect(await th.run("SingularityFunction(x, 0, 4)**3")).equal(`(<[x]>[💪,[4]])[💪,[3]]`);
        expect(await th.run("SingularityFunction(x, a, n)**3")).equal(`(<[x-a]>[💪,[n]])[💪,[3]]`);
        expect(await th.run("SingularityFunction(x, 4, -2)**3")).equal(`(<[-4+x]>[💪,[-2]])[💪,[3]]`);
        expect(await th.run("(SingularityFunction(x, 4, -1)**3)**3")).equal(`(<[-4+x]>[💪,[-1]])[💪,[9]]`);
    })

    it("cycle", async () => {
        expect(await th.run("Cycle(1, 2, 4)")).equal(`([1;2;4])`);
        expect(await th.run("Cycle(1, 2)(4, 5, 6)")).equal(`([1;2])([4;5;6])`);
        expect(await th.run("Cycle()")).equal(`()`);
    });

    it("permutation", async () => {
        expect(await th.run("Permutation(1, 2, 4)")).equal(`([1;2;4])`);
        expect(await th.run("Permutation(1, 2)(4, 5, 6)")).equal(`([1;2])([4;5;6])`);
        expect(await th.run("Permutation()")).equal(`()`);
        expect(await th.run("Permutation(2, 4)*Permutation(5)")).equal(`([2;4])([5])`);
        expect(await th.run("Permutation(5)")).equal(`([5])`);
    });

    it("Float", async () => {
        expect(await th.run("Float(1.0e100)")).equal(`[1.0×10][💪,[100]]`);
        expect(await th.run("Float(1.0e-100)")).equal(`[1.0×10][💪,[-100]]`);
        expect(await th.run("Float('10000.0')")).equal(`[10000.0]`);
        expect(await th.run("Float('0.099999')")).equal(`[0.099999]`);
    });

    it("Vector Expressions", async () => {
        await th.prepare(`A = CoordSys3D('A')`);
        expect(await th.run("Cross(A.i, A.j*A.x*3+A.k)")).equal(`[🎩,[i],bf][⛏️,[A,bf]][×]([🎩,[k],bf][⛏️,[A,bf]][+3][x,bf][⛏️,[A,bf]][🎩,[j],bf][⛏️,[A,bf]])`);
        expect(await th.run("Cross(A.i, A.j)")).equal(`[🎩,[i],bf][⛏️,[A,bf]][×][🎩,[j],bf][⛏️,[A,bf]]`);
        expect(await th.run("x*Cross(A.i, A.j)")).equal(`[x]([🎩,[i],bf][⛏️,[A,bf]][×][🎩,[j],bf][⛏️,[A,bf]])`);
        expect(await th.run("Cross(x*A.i, A.j)")).equal(`[-]([🎩,[j],bf][⛏️,[A,bf]][×]([x][🎩,[i],bf][⛏️,[A,bf]]))`);

        expect(await th.run("Curl(3*A.x*A.j)")).equal(`[∇×]([3][x,bf][⛏️,[A,bf]][🎩,[j],bf][⛏️,[A,bf]])`);
        expect(await th.run("Curl(3*A.x*A.j+A.i)")).equal(`[∇×]([🎩,[i],bf][⛏️,[A,bf]][+3][x,bf][⛏️,[A,bf]][🎩,[j],bf][⛏️,[A,bf]])`);
        expect(await th.run("Curl(3*x*A.x*A.j)")).equal(`[∇×]([3x][x,bf][⛏️,[A,bf]][🎩,[j],bf][⛏️,[A,bf]])`);
        expect(await th.run("x*Curl(3*A.x*A.j)")).equal(`[x]([∇×]([3][x,bf][⛏️,[A,bf]][🎩,[j],bf][⛏️,[A,bf]]))`);

        expect(await th.run("Divergence(3*A.x*A.j+A.i)")).equal(`[∇⋅]([🎩,[i],bf][⛏️,[A,bf]][+3][x,bf][⛏️,[A,bf]][🎩,[j],bf][⛏️,[A,bf]])`);
        expect(await th.run("Divergence(3*A.x*A.j)")).equal(`[∇⋅]([3][x,bf][⛏️,[A,bf]][🎩,[j],bf][⛏️,[A,bf]])`);
        expect(await th.run("x*Divergence(3*A.x*A.j)")).equal(`[x]([∇⋅]([3][x,bf][⛏️,[A,bf]][🎩,[j],bf][⛏️,[A,bf]]))`);

        expect(await th.run("Dot(A.i, A.j*A.x*3+A.k)")).equal(`[🎩,[i],bf][⛏️,[A,bf]][⋅]([🎩,[k],bf][⛏️,[A,bf]][+3][x,bf][⛏️,[A,bf]][🎩,[j],bf][⛏️,[A,bf]])`);
        expect(await th.run("Dot(A.i, A.j)")).equal(`[🎩,[i],bf][⛏️,[A,bf]][⋅][🎩,[j],bf][⛏️,[A,bf]]`);
        expect(await th.run("Dot(x*A.i, A.j)")).equal(`[🎩,[j],bf][⛏️,[A,bf]][⋅]([x][🎩,[i],bf][⛏️,[A,bf]])`);
        expect(await th.run("x*Dot(A.i, A.j)")).equal(`[x]([🎩,[i],bf][⛏️,[A,bf]][⋅][🎩,[j],bf][⛏️,[A,bf]])`);

        expect(await th.run("Gradient(A.x)")).equal(`[∇][x,bf][⛏️,[A,bf]]`);
        expect(await th.run("Gradient(A.x + 3*A.y)")).equal(`[∇]([3][y,bf][⛏️,[A,bf]][+][x,bf][⛏️,[A,bf]])`);
        expect(await th.run("x*Gradient(A.x)")).equal(`[x]([∇][x,bf][⛏️,[A,bf]])`);
        expect(await th.run("Gradient(x*A.x)")).equal(`[∇]([x][x,bf][⛏️,[A,bf]])`);

        expect(await th.run("Laplacian(A.x)")).equal(`[▵][x,bf][⛏️,[A,bf]]`);
        expect(await th.run("Laplacian(A.x + 3*A.y)")).equal(`[▵]([3][y,bf][⛏️,[A,bf]][+][x,bf][⛏️,[A,bf]])`);
        expect(await th.run("x*Laplacian(A.x)")).equal(`[x]([▵][x,bf][⛏️,[A,bf]])`);
        expect(await th.run("Laplacian(x*A.x)")).equal(`[▵]([x][x,bf][⛏️,[A,bf]])`);
    });


    it("Symbols", async () => {
        await th.prepare(`
Gamma, lmbda, rho = symbols('Gamma, lambda, rho')
tau, Tau, TAU, taU = symbols('tau, Tau, TAU, taU')
        `);

        expect(await th.run("tau")).equal(`[𝜏]`);
        expect(await th.run("Tau")).equal(`[T]`);
        expect(await th.run("TAU")).equal(`[𝜏]`);
        expect(await th.run("taU")).equal(`[𝜏]`);

        expect(await th.run("Gamma + lmbda")).equal(`[𝛤+𝜆]`);
        expect(await th.run("Gamma * lmbda")).equal(`[𝛤𝜆]`);
        expect(await th.run("Symbol('q1')")).equal(`[q][⛏️,[1]]`);
        expect(await th.run("Symbol('q21')")).equal(`[q][⛏️,[21]]`);
        expect(await th.run("Symbol('epsilon0')")).equal(`[𝜖][⛏️,[0]]`);
        expect(await th.run("Symbol('omega1')")).equal(`[𝜔][⛏️,[1]]`);
        expect(await th.run("Symbol('91')")).equal(`[91]`);
        expect(await th.run("Symbol('alpha_new')")).equal(`[𝛼][⛏️,[new]]`);
        expect(await th.run("Symbol('C^orig')")).equal(`[C][💪,[orig]]`);
        expect(await th.run("Symbol('x^alpha')")).equal(`[x][💪,[𝛼]]`);
        expect(await th.run("Symbol('beta^alpha')")).equal(`[𝛽][💪,[𝛼]]`);
        expect(await th.run("Symbol('e^Alpha')")).equal(`[e][💪,[𝛢]]`);
        expect(await th.run("Symbol('omega_alpha^beta')")).equal(`[𝜔][💪,[𝛽],[𝛼]]`);
        expect(await th.run("Symbol('omega') ** Symbol('beta')")).equal(`[𝜔][💪,[𝛽]]`);
    })

    it.only("functions", async () => {
        expect(await th.run("exp(x)")).equal(`[e][💪,[x]]`);
        expect(await th.run("exp(1) + exp(2)")).equal(`[e+e][💪,[2]]`);

        await th.prepare(`f = Function('f')`);

        expect(await th.run("f(x)")).equal(`[f]([x])`);
        expect(await th.run("f")).equal(`[f]`);

        await th.prepare(`g = Function('g')`);
        expect(await th.run("g(x, y)")).equal(`[g]([x, y])`);
        expect(await th.run("g")).equal(`[g]`);
        
        await th.prepare(`  h = Function('h')`);
        expect(await th.run("h(x, y, z)")).equal(`[h]([x, y, z])`);
        
        await th.prepare(` Li = Function('Li')`);
        expect(await th.run("Li")).equal(`[operatorname,[Li]]`);
        expect(await th.run("Li(x)")).equal(`[operatorname,[Li]]([x])`);
        
        await th.prepare(` mybeta = Function('beta')`);
        expect(await th.run("mybeta(x, y, z)")).equal(`[𝛽]([x, y, z])`);
        expect(await th.run("beta(x, y)")).equal(`[operatorname,[B]]([x, y])`);
        expect(await th.run("beta(x, y)**2")).equal(`[operatorname,[B]][💪,[2]]([x, y])`);
        expect(await th.run("mybeta(x)")).equal(`[𝛽]([x])`);
        expect(await th.run("mybeta")).equal(`[𝛽]`);
        
        await th.prepare(`g = Function('gamma')`);
        expect(await th.run("g(x, y, z)")).equal(`[𝛾]([x, y, z])`);
        expect(await th.run("g(x)")).equal(`[𝛾]([x])`);
        expect(await th.run("g")).equal(`[𝛾]`);
        
        await th.prepare(`a1 = Function('a_1')`);
        expect(await th.run("a1")).equal(`[a][⛏️,[1]]`);
        expect(await th.run("a1(x)")).equal(`[a][⛏️,[1]]([x])`);
        
        await th.prepare(`omega1 = Function('omega1')`);
        expect(await th.run("omega1")).equal(`[𝜔][⛏️,[1]]`);
        expect(await th.run("omega1(x)")).equal(`[𝜔][⛏️,[1]]([x])`);

        expect(await th.run("sin(x)")).equal(`[sin,]([x])`);
        expect(await th.run("sin(2*x**2)")).equal(`[sin,]([2x][💪,[2]])`);
        expect(await th.run("sin(x**2)")).equal(`[sin,]([x][💪,[2]])`);

        expect(await th.run("asin(x)**2")).equal(`[asin,][💪,[2]]([x])`);
        expect(await th.run("acsc(x)")).equal(`[acsc,]([x])`);
        expect(await th.run("asinh(x)")).equal(`[asinh,]([x])`);

        expect(await th.run("factorial(k)")).equal(`[k!]`);
        expect(await th.run("factorial(-k)")).equal(`([-k])[!]`);
        expect(await th.run("factorial(k)**2")).equal(`[k!][💪,[2]]`);

        expect(await th.run("subfactorial(k)")).equal(`[!k]`);
        expect(await th.run("subfactorial(-k)")).equal(`[!]([-k])`);
        expect(await th.run("subfactorial(k)**2")).equal(`([!k])[💪,[2]]`);
        
        expect(await th.run("factorial2(k)")).equal(`[k!!]`);
        expect(await th.run("factorial2(-k)")).equal(`([-k])[!!]`);
        expect(await th.run("factorial2(k)**2")).equal(`[k!!][💪,[2]]`);

        expect(await th.run("binomial(2, k)")).equal(`[(🏓)binom,[2],[k]]`);
        expect(await th.run("binomial(2, k)**2")).equal(`[(🏓)binom,[2],[k]][💪,[2]]`);


    })

});