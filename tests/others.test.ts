import { defineSympyExprDumpFunc } from "@sympy-worker/python-code";
import { expect } from "chai";
import { testHelper as th } from "./test-helper";

/** Test from: https://github.com/sympy/sympy/blob/master/sympy/printing/tests/test_latex.py */
describe.only("3: Others", () => {
    before(async () => {
        await th.prepare(`
        x_star = Symbol('x^*')
        f = Function('f')`);
        await th.prepare(`
x, y, z, t, w, a, b, c, s, p = symbols('x y z t w a b c s p')
k, m, n = symbols('k m n', integer=True)
`)

        await th.prepare(defineSympyExprDumpFunc);
    });

    it("symbol with multiple characters", async () => {
        expect(await th.run("x_star**2")).equal(`([x^*])[💪,[2]]`);
        expect(await th.run("Derivative(f(x_star), x_star,2)")).equal(`[frac,[d][💪,[2]],[d]([x^*])[💪,[2]]][f]([x^*])`);

        expect(await th.run("2*Integral(x, x)/3")).equal(`[frac,[2][int,][x dx],[3]]`);
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

        expect(await th.run("~x")).equal(`[¬x]`);
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
        expect(await th.run("True")).equal(`[📜,[True]]`);
        expect(await th.run("False")).equal(`[📜,[False]]`);
        expect(await th.run("None")).equal(`[📜,[None]]`);
        expect(await th.run("true")).equal(`[📜,[True]]`);
        expect(await th.run("false")).equal(`[📜,[False]]`);
    });

    it("SingularityFunction", async () => {
        expect(await th.run("SingularityFunction(x, 4, 5)")).equal(`<[-4+x]>[💪,[5]]`);
        expect(await th.run("SingularityFunction(x, -3, 4)")).equal(`<[3+x]>[💪,[4]]`);
        expect(await th.run("SingularityFunction(x, 0, 4)")).equal(`<[x]>[💪,[4]]`);
        expect(await th.run("SingularityFunction(x, a, n)")).equal(`<[x-a]>[💪,[n]]`);
        expect(await th.run("SingularityFunction(x, 4, -2)")).equal(`[frac,[1],<[-4+x]>[💪,[2]]]`);
        expect(await th.run("SingularityFunction(x, 4, -1)")).equal(`[frac,[1],<[-4+x]>]`);
        expect(await th.run("SingularityFunction(x, 4, 5)**3")).equal(`(<[-4+x]>[💪,[5]])[💪,[3]]`);
        expect(await th.run("SingularityFunction(x, -3, 4)**3")).equal(`(<[3+x]>[💪,[4]])[💪,[3]]`);
        expect(await th.run("SingularityFunction(x, 0, 4)**3")).equal(`(<[x]>[💪,[4]])[💪,[3]]`);
        expect(await th.run("SingularityFunction(x, a, n)**3")).equal(`(<[x-a]>[💪,[n]])[💪,[3]]`);
        expect(await th.run("SingularityFunction(x, 4, -2)**3")).equal(`([frac,[1],<[-4+x]>[💪,[2]]])[💪,[3]]`);
        expect(await th.run("(SingularityFunction(x, 4, -1)**3)**3")).equal(`([frac,[1],<[-4+x]>])[💪,[9]]`);
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

        expect(await th.run("Cross(x*A.i, A.j)")).equal(`[-]([🎩,[j],bf][⛏️,[A,bf]][×]([x][🎩,[i],bf][⛏️,[A,bf]]))`);//

        expect(await th.run("Curl(3*A.x*A.j)")).equal(`[∇×]([3][x,bf][⛏️,[A,bf]][🎩,[j],bf][⛏️,[A,bf]])`);
        expect(await th.run("Curl(3*A.x*A.j+A.i)")).equal(`[∇×]([🎩,[i],bf][⛏️,[A,bf]][+3][x,bf][⛏️,[A,bf]][🎩,[j],bf][⛏️,[A,bf]])`);
        expect(await th.run("Curl(3*x*A.x*A.j)")).equal(`[∇×]([3x][x,bf][⛏️,[A,bf]][🎩,[j],bf][⛏️,[A,bf]])`);
        expect(await th.run("x*Curl(3*A.x*A.j)")).equal(`[x]([∇×]([3][x,bf][⛏️,[A,bf]][🎩,[j],bf][⛏️,[A,bf]]))`);

        expect(await th.run("Divergence(3*A.x*A.j+A.i)")).equal(`[∇⋅]([🎩,[i],bf][⛏️,[A,bf]][+3][x,bf][⛏️,[A,bf]][🎩,[j],bf][⛏️,[A,bf]])`);
        expect(await th.run("Divergence(3*A.x*A.j)")).equal(`[∇⋅]([3][x,bf][⛏️,[A,bf]][🎩,[j],bf][⛏️,[A,bf]])`);//
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
        expect(await th.run("g(x, y)")).equal(`[g]([x,y])`);
        expect(await th.run("g")).equal(`[g]`);

        await th.prepare(`  h = Function('h')`);
        expect(await th.run("h(x, y, z)")).equal(`[h]([x,y,z])`);

        await th.prepare(` Li = Function('Li')`);
        expect(await th.run("Li")).equal(`[⚙️,[Li]]`);
        expect(await th.run("Li(x)")).equal(`[⚙️,[Li]]([x])`);

        await th.prepare(` mybeta = Function('beta')`);
        expect(await th.run("mybeta(x, y, z)")).equal(`[𝛽]([x,y,z])`);
        expect(await th.run("beta(x, y)")).equal(`[⚙️,[B]]([x,y])`);
        expect(await th.run("beta(x, y)**2")).equal(`[⚙️,[B]][💪,[2]]([x,y])`);
        expect(await th.run("mybeta(x)")).equal(`[𝛽]([x])`);
        expect(await th.run("mybeta")).equal(`[𝛽]`);

        await th.prepare(`g = Function('gamma')`);
        expect(await th.run("g(x, y, z)")).equal(`[𝛾]([x,y,z])`);
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

        expect(await th.run("FallingFactorial(3, k)")).equal(`([3])[⛏️,[k]]`);
        expect(await th.run("RisingFactorial(3, k)")).equal(`[3][💪,([k])]`);

        expect(await th.run("floor(x)")).equal(`⌊[x]⌋`);
        expect(await th.run("ceiling(x)")).equal(`⌈[x]⌉`);
        expect(await th.run("frac(x)")).equal(`[⚙️,[frac]]([x])`);
        expect(await th.run("floor(x)**2")).equal(`⌊[x]⌋[💪,[2]]`);
        expect(await th.run("ceiling(x)**2")).equal(`⌈[x]⌉[💪,[2]]`);
        expect(await th.run("frac(x)**2")).equal(`[⚙️,[frac]][💪,[2]]([x])`);

        expect(await th.run("Min(x, 2, x**3)")).equal(`[min,]([2,x,x][💪,[3]])`);
        expect(await th.run("Min(x, y)**2")).equal(`[min,]([x,y])[💪,[2]]`);
        expect(await th.run("Max(x, 2, x**3)")).equal(`[max,]([2,x,x][💪,[3]])`);
        expect(await th.run("Max(x, y)**2")).equal(`[max,]([x,y])[💪,[2]]`);
        expect(await th.run("Abs(x)")).equal(`|[x]|`);
        expect(await th.run("Abs(x)**2")).equal(`|[x]|[💪,[2]]`);
        expect(await th.run("re(x)")).equal(`[⚙️,[re]]([x])`);
        expect(await th.run("re(x + y)")).equal(`[⚙️,[re]]([x])[+][⚙️,[re]]([y])`);
        expect(await th.run("im(x)")).equal(`[⚙️,[im]]([x])`);
        expect(await th.run("conjugate(x)")).equal(`[overline,[x]]`);
        expect(await th.run("conjugate(x)**2")).equal(`[overline,[x]][💪,[2]]`);
        expect(await th.run("gamma(x)")).equal(`[𝛤]([x])`);
        await th.prepare(`w = Wild('w')`);
        expect(await th.run("gamma(w)")).equal(`[𝛤]([w])`);
        expect(await th.run("Order(x)")).equal(`[O]([x])`);
        expect(await th.run("Order(x)")).equal(`[O]([x])`);
        expect(await th.run("Order(x, (x, 0))")).equal(`[O]([x])`);
        expect(await th.run("Order(x, (x, oo))")).equal(`[O]([x;x][rightarrow,][∞])`);
        expect(await th.run("Order(x - y, (x, y))")).equal(`[O]([x-y;x][rightarrow,][y])`);
        expect(await th.run("Order(x, x, y)")).equal(`[O]([x;]([x,y])[rightarrow,]([0,0]))`);
        expect(await th.run("Order(x, (x, oo), (y, oo))")).equal(`[O]([x;]([x,y])[rightarrow,]([∞,∞]))`);
        expect(await th.run("lowergamma(x, y)")).equal(`[𝛾]([x,y])`);
        expect(await th.run("lowergamma(x, y)**2")).equal(`[𝛾][💪,[2]]([x,y])`);
        expect(await th.run("uppergamma(x, y)")).equal(`[𝛤]([x,y])`);
        expect(await th.run("uppergamma(x, y)**2")).equal(`[𝛤][💪,[2]]([x,y])`);

        expect(await th.run("cot(x)")).equal(`[cot,]([x])`);
        expect(await th.run("coth(x)")).equal(`[coth,]([x])`);
        expect(await th.run("re(x)")).equal(`[⚙️,[re]]([x])`);
        expect(await th.run("im(x)")).equal(`[⚙️,[im]]([x])`);
        expect(await th.run("root(x, y)")).equal(`[x][💪,[frac,[1],[y]]]`);
        expect(await th.run("arg(x)")).equal(`[arg,]([x])`);

        expect(await th.run("zeta(x)")).equal(`[𝜁]([x])`);
        expect(await th.run("zeta(x)**2")).equal(`[𝜁][💪,[2]]([x])`);
        expect(await th.run("zeta(x, y)")).equal(`[𝜁]([x,y])`);
        expect(await th.run("zeta(x, y)**2")).equal(`[𝜁][💪,[2]]([x,y])`);
        expect(await th.run("dirichlet_eta(x)")).equal(`[𝜂]([x])`);
        expect(await th.run("dirichlet_eta(x)**2")).equal(`[𝜂][💪,[2]]([x])`);
        expect(await th.run("polylog(x, y)")).equal(`[⚙️,[Li]][⛏️,[x]]([y])`);
        expect(await th.run("polylog(x, y)**2")).equal(`[⚙️,[Li]][💪,[2],[x]]([y])`);
        expect(await th.run("lerchphi(x, y, n)")).equal(`[𝛷]([x,y,n])`);
        expect(await th.run("lerchphi(x, y, n)**2")).equal(`[𝛷][💪,[2]]([x,y,n])`);
        expect(await th.run("stieltjes(x)")).equal(`[𝛾][⛏️,[x]]`);
        expect(await th.run("stieltjes(x)**2")).equal(`[𝛾][💪,[2],[x]]`);
        expect(await th.run("stieltjes(x, y)")).equal(`[𝛾][⛏️,[x]]([y])`);
        expect(await th.run("stieltjes(x, y)**2")).equal(`[𝛾][⛏️,[x]]([y])[💪,[2]]`);

        expect(await th.run("elliptic_k(z)")).equal(`[K]([z])`);
        expect(await th.run("elliptic_k(z)**2")).equal(`[K][💪,[2]]([z])`);
        expect(await th.run("elliptic_f(x, y)")).equal(`[F]([x][middle|,][y])`);
        expect(await th.run("elliptic_f(x, y)**2")).equal(`[F][💪,[2]]([x][middle|,][y])`);
        expect(await th.run("elliptic_e(x, y)")).equal(`[E]([x][middle|,][y])`);
        expect(await th.run("elliptic_e(x, y)**2")).equal(`[E][💪,[2]]([x][middle|,][y])`);
        expect(await th.run("elliptic_e(z)")).equal(`[E]([z])`);
        expect(await th.run("elliptic_e(z)**2")).equal(`[E][💪,[2]]([z])`);
        expect(await th.run("elliptic_pi(x, y, z)")).equal(`[𝛱]([x;y][middle|,][z])`);
        expect(await th.run("elliptic_pi(x, y, z)**2")).equal(`[𝛱][💪,[2]]([x;y][middle|,][z])`);
        expect(await th.run("elliptic_pi(x, y)")).equal(`[𝛱]([x][middle|,][y])`);
        expect(await th.run("elliptic_pi(x, y)**2")).equal(`[𝛱][💪,[2]]([x][middle|,][y])`);

        expect(await th.run("Ei(x)")).equal(`[⚙️,[Ei]]([x])`);
        expect(await th.run("Ei(x)**2")).equal(`[⚙️,[Ei]][💪,[2]]([x])`);
        expect(await th.run("expint(x, y)")).equal(`[E][⛏️,[x]]([y])`);
        expect(await th.run("expint(x, y)**2")).equal(`[E][💪,[2],[x]]([y])`);
        expect(await th.run("Shi(x)**2")).equal(`[⚙️,[Shi]][💪,[2]]([x])`);
        expect(await th.run("Si(x)**2")).equal(`[⚙️,[Si]][💪,[2]]([x])`);
        expect(await th.run("Ci(x)**2")).equal(`[⚙️,[Ci]][💪,[2]]([x])`);
        expect(await th.run("Chi(x)**2")).equal(`[⚙️,[Chi]][💪,[2]]([x])`);
        expect(await th.run("Chi(x)")).equal(`[⚙️,[Chi]]([x])`);
        expect(await th.run("jacobi(n, a, b, x)")).equal(`[P][💪,([a,b]),[n]]([x])`);
        expect(await th.run("jacobi(n, a, b, x)**2")).equal(`[P][💪,([a,b]),[n]]([x])[💪,[2]]`);
        expect(await th.run("gegenbauer(n, a, x)")).equal(`[C][💪,([a]),[n]]([x])`);
        expect(await th.run("gegenbauer(n, a, x)**2")).equal(`[C][💪,([a]),[n]]([x])[💪,[2]]`);
        expect(await th.run("chebyshevt(n, x)")).equal(`[T][⛏️,[n]]([x])`);
        expect(await th.run("chebyshevt(n, x)**2")).equal(`([T][⛏️,[n]]([x]))[💪,[2]]`);
        expect(await th.run("chebyshevu(n, x)")).equal(`[U][⛏️,[n]]([x])`);
        expect(await th.run("chebyshevu(n, x)**2")).equal(`([U][⛏️,[n]]([x]))[💪,[2]]`);
        expect(await th.run("legendre(n, x)")).equal(`[P][⛏️,[n]]([x])`);
        expect(await th.run("legendre(n, x)**2")).equal(`([P][⛏️,[n]]([x]))[💪,[2]]`);
        expect(await th.run("assoc_legendre(n, a, x)")).equal(`[P][💪,([a]),[n]]([x])`);
        expect(await th.run("assoc_legendre(n, a, x)**2")).equal(`([P][💪,([a]),[n]]([x]))[💪,[2]]`);
        expect(await th.run("laguerre(n, x)")).equal(`[L][⛏️,[n]]([x])`);
        expect(await th.run("laguerre(n, x)**2")).equal(`([L][⛏️,[n]]([x]))[💪,[2]]`);
        expect(await th.run("assoc_laguerre(n, a, x)")).equal(`[L][💪,([a]),[n]]([x])`);
        expect(await th.run("assoc_laguerre(n, a, x)**2")).equal(`([L][💪,([a]),[n]]([x]))[💪,[2]]`);
        expect(await th.run("hermite(n, x)")).equal(`[H][⛏️,[n]]([x])`);
        expect(await th.run("hermite(n, x)**2")).equal(`([H][⛏️,[n]]([x]))[💪,[2]]`);

        await th.prepare(` 
theta = Symbol("theta", real=True)
phi = Symbol("phi", real=True)`)

        expect(await th.run("Ynm(n, m, theta, phi)")).equal(`[Y][💪,[m],[n]]([𝜃,𝜙])`);
        expect(await th.run("Ynm(n, m, theta, phi)**3")).equal(`([Y][💪,[m],[n]]([𝜃,𝜙]))[💪,[3]]`);
        expect(await th.run("Znm(n, m, theta, phi)")).equal(`[Z][💪,[m],[n]]([𝜃,𝜙])`);
        expect(await th.run("Znm(n, m, theta, phi)**3")).equal(`([Z][💪,[m],[n]]([𝜃,𝜙]))[💪,[3]]`);

        expect(await th.run("polar_lift(0)")).equal(`[⚙️,[polar_lift]]([0])`);
        expect(await th.run("polar_lift(0)**3")).equal(`[⚙️,[polar_lift]][💪,[3]]([0])`);
        expect(await th.run("totient(n)")).equal(`[𝜙]([n])`);
        expect(await th.run("totient(n) ** 2")).equal(`([𝜙]([n]))[💪,[2]]`);

        expect(await th.run("reduced_totient(n)")).equal(`[𝜆]([n])`);
        expect(await th.run("reduced_totient(n) ** 2")).equal(`([𝜆]([n]))[💪,[2]]`);

        expect(await th.run("divisor_sigma(x)")).equal(`[𝜎]([x])`);
        expect(await th.run("divisor_sigma(x)**2")).equal(`[𝜎][💪,[2]]([x])`);
        expect(await th.run("divisor_sigma(x, y)")).equal(`[𝜎][⛏️,[y]]([x])`);
        expect(await th.run("divisor_sigma(x, y)**2")).equal(`[𝜎][💪,[2],[y]]([x])`);
        expect(await th.run("udivisor_sigma(x)")).equal(`[𝜎][💪,[*]]([x])`);
        expect(await th.run("udivisor_sigma(x)**2")).equal(`([𝜎][💪,[*]]([x]))[💪,[2]]`);
        expect(await th.run("udivisor_sigma(x, y)")).equal(`[𝜎][💪,[*],[y]]([x])`);
        expect(await th.run("udivisor_sigma(x, y)**2")).equal(`([𝜎][💪,[*],[y]]([x]))[💪,[2]]`);

        expect(await th.run("primenu(n)")).equal(`[𝜈]([n])`);
        expect(await th.run("primenu(n) ** 2")).equal(`([𝜈]([n]))[💪,[2]]`);

        expect(await th.run("primeomega(n)")).equal(`[𝛺]([n])`);
        expect(await th.run("primeomega(n) ** 2")).equal(`([𝛺]([n]))[💪,[2]]`);

        expect(await th.run("LambertW(n)")).equal(`[W]([n])`);
        expect(await th.run("LambertW(n, -1)")).equal(`[W][⛏️,[-1]]([n])`);
        expect(await th.run("LambertW(n, k)")).equal(`[W][⛏️,[k]]([n])`);
        expect(await th.run("LambertW(n) * LambertW(n)")).equal(`[W][💪,[2]]([n])`);
        expect(await th.run("Pow(LambertW(n), 2)")).equal(`[W][💪,[2]]([n])`);
        expect(await th.run("LambertW(n)**k")).equal(`[W][💪,[k]]([n])`);
        expect(await th.run("LambertW(n, k)**p")).equal(`[W][💪,[p],[k]]([n])`);

        expect(await th.run("Mod(x, 7)")).equal(`[x][bmod,][7]`);
        expect(await th.run("Mod(x + 1, 7)")).equal(`([1+x])[bmod,][7]`);
        expect(await th.run("Mod(2 * x, 7)")).equal(`[2x][bmod,][7]`);
        expect(await th.run("Mod(x, 7) + 1")).equal(`[1+]([x][bmod,][7])`);
        expect(await th.run("2 * Mod(x, 7)")).equal(`[2]([x][bmod,][7])`);
        expect(await th.run("Mod(Mul(2,1/2,evaluate=False), 7,evaluate=False)")).equal(`([2×0.5])[bmod,][7]`);

        await th.prepare(`fjlkd = Function('fjlkd')`);
        expect(await th.run("fjlkd(x)")).equal(`[⚙️,[fjlkd]]([x])`);
        expect(await th.run("fjlkd")).equal(`[⚙️,[fjlkd]]`);


    })

    it("subclass different name", async () => {
        await th.prepare(`    
class mygamma(gamma):
    pass`);

        expect(await th.run("mygamma")).equal(`[⚙️,[mygamma]]`);
        expect(await th.run("mygamma(x)")).equal(`[⚙️,[mygamma]]([x])`);
    })

    it("hyper", async () => {
        await th.prepare(`
from sympy import pi
from sympy.abc import x, z`);



        expect(await th.run(`meijerg(Tuple(pi, pi, x), Tuple(1),
(0, 1), Tuple(1, 2, 3/pi), z)`)).equal(`[C][💪,[2,3],[4,5]]([🏓matrix,[𝜋,𝜋,x],[1],[0,1],[1,2,][frac,[3],[𝜋]]][middle|,][z])`);

        expect(await th.run(`meijerg(Tuple(), Tuple(1), (0,), Tuple(), z)`)).equal(`[C][💪,[1,0],[1,1]]([🏓matrix,,[1],[0],][middle|,][z])`);
        expect(await th.run(`hyper((x, 2), (3,), z)`)).equal(`[prescript,[2]][F][⛏️,[1]]([🏓matrix,[x,2],[3]][middle|,][z])`);
        expect(await th.run(`hyper(Tuple(), Tuple(1), z)`)).equal(`[prescript,[0]][F][⛏️,[1]]([🏓matrix,,[1]][middle|,][z])`);

    });

    it("bessel", async () => {
        await th.prepare(`from sympy.functions.special.bessel import (besselj, bessely, besseli,
            besselk, hankel1, hankel2,
            jn, yn, hn1, hn2)
from sympy.abc import z`);

        expect(await th.run(`besselj(n, z**2)**k`)).equal(`[J][💪,[k],[n]]([z][💪,[2]])`);
        expect(await th.run(`bessely(n, z)`)).equal(`[Y][⛏️,[n]]([z])`);
        expect(await th.run(`besseli(n, z)`)).equal(`[I][⛏️,[n]]([z])`);
        expect(await th.run(`besselk(n, z)`)).equal(`[K][⛏️,[n]]([z])`);
        expect(await th.run(`hankel1(n, z**2)**2`)).equal(`([H][💪,[(1)],[n]]([z][💪,[2]]))[💪,[2]]`);
        expect(await th.run(`hankel2(n, z)`)).equal(`[H][💪,[(2)],[n]]([z])`);
        expect(await th.run(`jn(n, z)`)).equal(`[j][⛏️,[n]]([z])`);
        expect(await th.run(`yn(n, z)`)).equal(`[y][⛏️,[n]]([z])`);
        expect(await th.run(`hn1(n, z)`)).equal(`[h][💪,[(1)],[n]]([z])`);
        expect(await th.run(`hn2(n, z)`)).equal(`[h][💪,[(2)],[n]]([z])`);
    });

    it("fresnel", async () => {

        await th.prepare(`    
from sympy.functions.special.error_functions import (fresnels, fresnelc)
from sympy.abc import z`);

        expect(await th.run(`fresnels(z)`)).equal(`[S]([z])`);
        expect(await th.run(`fresnelc(z)`)).equal(`[C]([z])`);
        expect(await th.run(`fresnels(z)**2`)).equal(`[S][💪,[2]]([z])`);
        expect(await th.run(`fresnelc(z)**2`)).equal(`[C][💪,[2]]([z])`);
    });

    it("brackets", async () => {
        expect(await th.run(`(-1)**x`)).equal(`([-1])[💪,[x]]`);

    });

    it("indexed", async () => {

        await th.prepare(`  
Psi_symbol = Symbol('Psi_0', complex=True, real=False)
Psi_indexed = IndexedBase(Symbol('Psi', complex=True, real=False))`);

        expect(await th.run(`Psi_symbol * conjugate(Psi_symbol)`)).equal(`[Psi][⛏️,[0]][overline,[Psi][⛏️,[0]]]`);
        expect(await th.run(`Psi_indexed[0] * conjugate(Psi_indexed[0])`)).equal(`[Psi][⛏️,[0]][overline,[Psi][⛏️,[0]]]`);
        expect(await th.run(`Indexed('x1', Symbol('i'))`)).equal(`[x][⛏️,[1]][⛏️,[i]]`);
        expect(await th.run(`IndexedBase('gamma')`)).equal(`[𝛾]`);
        expect(await th.run(`IndexedBase('a b')`)).equal(`[a b]`);
        expect(await th.run(`IndexedBase('a_b')`)).equal(`[a][⛏️,[b]]`);

    })

    it.skip("derivatives", async () => {

        expect(await th.run(`diff(x**3, x, evaluate=False)`)).equal(`[frac,[d],[dx]][x][💪,[3]]`);
        expect(await th.run(`diff(sin(x) + x**2, x, evaluate=False)`)).equal(`[frac,[d],[dx]]([x][💪,[2]][+][sin,]([x]))`);
        expect(await th.run(`diff(diff(sin(x) + x**2, x, evaluate=False), evaluate=False)`)).equal(`[frac,[d][💪,[2]],[dx][💪,[2]]]([x][💪,[2]][+][sin,]([x]))`);
        expect(await th.run(`diff(diff(diff(sin(x) + x**2, x, evaluate=False), evaluate=False), evaluate=False)`))
            .equal(`[frac,[d][💪,[3]],[dx][💪,[3]]]([x][💪,[2]][+][sin,]([x]))`);

        expect(await th.run(`diff(sin(x * y), x, evaluate=False)`)).equal(`[frac,[∂],[∂x]][sin,]([xy])`);
        expect(await th.run(`diff(sin(x * y) + x**2, x, evaluate=False)`)).equal(`[frac,[∂],[∂x]]([x][💪,[2]][+][sin,]([xy]))`);
        expect(await th.run(`diff(diff(sin(x*y) + x**2, x, evaluate=False), x, evaluate=False)`)).equal(`[frac,[∂][💪,[2]],[∂x][💪,[2]]]([x][💪,[2]][+][sin,]([xy]))`);
        expect(await th.run(`diff(diff(diff(sin(x*y) + x**2, x, evaluate=False), x, evaluate=False), x, evaluate=False)`)).equal(`[frac,[∂][💪,[3]],[∂x][💪,[3]]]([x][💪,[2]][+][sin,]([xy]))`);

        await th.prepare(`f = Function("f")`);
        expect(await th.run(`diff(diff(f(x, y), x, evaluate=False), y, evaluate=False)`)).equal(`[frac,[∂][💪,[2]],[∂y∂x]][f]([x,y])`);
        expect(await th.run(`diff(diff(diff(f(x, y), x, evaluate=False), x, evaluate=False), y, evaluate=False)`)).equal(`[frac,[∂][💪,[3]],[∂y∂x][💪,[2]]][f]([x,y])`);

        expect(await th.run(`diff(-diff(y**2,x,evaluate=False),x,evaluate=False)`)).equal(`[frac,[d],[dx]][-][frac,[d],[dx]][y][💪,[2]]`);
        expect(await th.run(`diff(diff(-diff(diff(y,x,evaluate=False),x,evaluate=False),x,evaluate=False),x,evaluate=False)`)).equal(`[frac,[d][💪,[2]],[dx][💪,[2]]][-][frac,[d][💪,[2]],[dx][💪,[2]]][y]`);

        expect(await th.run(`diff(Integral(exp(-x*y), (x, 0, oo)), y, evaluate=False)`)).equal(`[frac,[d],[dy]][int,[0],[∞]][e][💪,[-xy]][ dx]`);
        expect(await th.run(`diff(x, x, evaluate=False)**2`)).equal(`([frac,[d],[dx]][x])[💪,[2]]`);
        expect(await th.run(`diff(f(x), x)**2`)).equal(`([frac,[d],[dx]][f]([x]))[💪,[2]]`);
        expect(await th.run(`diff(f(x), (x, n))`)).equal(`[frac,[d][💪,[n]],[dx][💪,[n]]][f]([x])`);


        await th.prepare(`
x1 = Symbol('x1')
x2 = Symbol('x2')
`);

        expect(await th.run(`diff(f(x1, x2), x1)`)).equal(`[frac,[∂],[∂x][⛏️,[1]]][f]([x][⛏️,[1]][,x][⛏️,[2]])`);

        await th.prepare(` n1 = Symbol('n1')`);
        expect(await th.run(`diff(f(x), (x, n1))`)).equal(`[frac,[d][💪,[n][⛏️,[1]]],[dx][💪,[n][⛏️,[1]]]][f]([x])`);

        await th.prepare(` n2 = Symbol('n2')`);
        expect(await th.run(`diff(f(x), (x, Max(n1, n2)))`)).equal(`[frac,[d][💪,[max,]([n][⛏️,[1]][,n][⛏️,[2]])],[dx][💪,[max,]([n][⛏️,[1]][,n][⛏️,[2]])]][f]([x])`);
    });

    it("subs", async () => {
        expect(await th.run(`Subs(x*y, (x, y), (1, 2))`)).equal(`[b,\\left.][xy]|[⛏️,[x=1]💔[y=2]]`);
    });

    it("integrals", async () => {

        expect(await th.run(`Integral(log(x), x)`)).equal(`[int,][log,]([x])[ dx]`);
        expect(await th.run(`Integral(x**2, (x, 0, 1))`)).equal(`[int,[0],[1]][x][💪,[2]][ dx]`);
        expect(await th.run(`Integral(x**2, (x, 10, 20))`)).equal(`[int,[10],[20]][x][💪,[2]][ dx]`);
        expect(await th.run(`Integral(y*x**2, (x, 0, 1), y)`)).equal(`[int,][int,[0],[1]][yx][💪,[2]][ dx dy]`);
        expect(await th.run(`Integral(x, (x, 0))`)).equal(`[int,[0]][x dx]`);
        expect(await th.run(`Integral(x*y, x, y)`)).equal(`[iint,][xy dx dy]`);
        expect(await th.run(`Integral(x*y*z, x, y, z)`)).equal(`[iiint,][xyz dx dy dz]`);
        expect(await th.run(`Integral(x*y*z*t, x, y, z, t)`)).equal(`[int,][int,][int,][int,][txyz dx dy dz dt]`);
        expect(await th.run(`Integral(x, x, x, x, x, x, x)`)).equal(`[int,][int,][int,][int,][int,][int,][x dx dx dx dx dx dx]`);
        expect(await th.run(`Integral(x, x, y, (z, 0, 1))`)).equal(`[int,[0],[1]][int,][int,][x dx dy dz]`);

        expect(await th.run(`Integral(-Integral(y**2,x),x)`)).equal(`[int,][-][int,][y][💪,[2]][ dx dx]`);
        expect(await th.run(`Integral(-Integral(-Integral(y,x),x),x)`)).equal(`[int,][-][int,][-][int,][y dx dx dx]`);

        expect(await th.run(`Integral(z, z)**2`)).equal(`([int,][z dz])[💪,[2]]`);
        expect(await th.run(`Integral(x + z, z)`)).equal(`[int,]([x+z])[ dz]`);
        expect(await th.run(`Integral(x+z/2, z)`)).equal(`[int,]([x+][frac,[z],[2]])[ dz]`);
        expect(await th.run(`Integral(x**y, z)`)).equal(`[int,][x][💪,[y]][ dz]`);

    })

    it("sets", async () => {

        expect(await th.run(`set([x*y, x**2])`)).equal(`{[x][💪,[2]][,xy]}`);
        expect(await th.run(`frozenset([x*y, x**2])`)).equal(`{[x][💪,[2]][,xy]}`);
        expect(await th.run(`set(range(1, 6))`)).equal(`{[1,2,3,4,5]}`);

        await th.prepare(`s = FiniteSet`);
        expect(await th.run(`s(*[x*y, x**2])`)).equal(`{[x][💪,[2]][,xy]}`);
        expect(await th.run(`s(*range(1, 6))`)).equal(`{[1,2,3,4,5]}`);
    })

    it("SetExpr", async () => {
        await th.prepare(`
iv = Interval(1, 3)
se = SetExpr(iv)`);

        expect(await th.run(`se`)).equal(`[⚙️,[SetExpr]]([[1,3]])`);
        expect(await th.run(`Interval(1, x)`)).equal(`[[1,x]]`);
        expect(await th.run(`Interval(x, x)`)).equal(`{[x]}`);
    });

    it("Range", async () => {
        expect(await th.run(`Range(1, 51)`)).equal(`{[1,2,…,50]}`);
        expect(await th.run(`Range(1, 4)`)).equal(`{[1,2,3]}`);
        expect(await th.run(`Range(0, 3, 1)`)).equal(`{[0,1,2]}`);
        expect(await th.run(`Range(0, 30, 1)`)).equal(`{[0,1,…,29]}`);
        expect(await th.run(`Range(30, 1, -1)`)).equal(`{[30,29,…,2]}`);
        expect(await th.run(`Range(0, oo, 2)`)).equal(`{[0,2,…]}`);
        expect(await th.run(`Range(oo, -2, -2)`)).equal(`{[…,2,0]}`);
        expect(await th.run(`Range(-2, -oo, -1)`)).equal(`{[-2,-3,…]}`);
        expect(await th.run(`Range(-oo, oo)`)).equal(`{[…,-1,0,1,…]}`);
        expect(await th.run(`Range(oo, -oo, -1)`)).equal(`{[…,1,0,-1,…]}`);

        await th.prepare(`  a, b, c = symbols('a:c')`);
        expect(await th.run(`Range(a, b, c)`)).equal(`[⚙️,[Range]]([a,b,c])`);
        expect(await th.run(`Range(a, 10, 1)`)).equal(`[⚙️,[Range]]([a,10,1])`);
        expect(await th.run(`Range(0, b, 1)`)).equal(`[⚙️,[Range]]([0,b,1])`);
        expect(await th.run(`Range(0, 10, c)`)).equal(`[⚙️,[Range]]([0,10,c])`);


    })

    it("sequences", async () => {
        expect(await th.run(`SeqFormula(a**2, (0, oo))`)).equal(`[[0,1,4,9,…]]`);
        expect(await th.run(`SeqPer((1, 2))`)).equal(`[[1,2,1,2,…]]`);
        expect(await th.run(`SeqFormula(a**2, (0, 2))`)).equal(`[[0,1,4]]`);
        expect(await th.run(`SeqPer((1, 2), (0, 2))`)).equal(`[[1,2,1]]`);
        expect(await th.run(`SeqFormula(a**2, (-oo, 0))`)).equal(`[[…,9,4,1,0]]`);
        expect(await th.run(`SeqPer((1, 2), (-oo, 0))`)).equal(`[[…,2,1,2,1]]`);

        th.prepare(`
s1 = SeqFormula(a**2, (0, oo))
s2 = SeqPer((1, 2))
s3 = SeqFormula(a**2, (0, 2))
s4 = SeqPer((1, 2), (0, 2))
s5 = SeqFormula(a**2, (-oo, 0))
s6 = SeqPer((1, 2), (-oo, 0))
b = Symbol('b')
        `);

        expect(await th.run(`SeqAdd(s1, s2)`)).equal(`[[1,3,5,11,…]]`);
        expect(await th.run(`SeqAdd(s3, s4)`)).equal(`[[1,3,5]]`);
        expect(await th.run(`SeqAdd(s5, s6)`)).equal(`[[…,11,5,3,1]]`);
        expect(await th.run(`SeqMul(s1, s2)`)).equal(`[[0,2,4,18,…]]`);
        expect(await th.run(`SeqMul(s3, s4)`)).equal(`[[0,2,4]]`);
        expect(await th.run(`SeqMul(s5, s6)`)).equal(`[[…,18,4,2,0]]`);
        expect(await th.run(`SeqFormula(a**2, (a, 0, x))`)).equal(`{[a][💪,[2]]}[💪,[x],[a=0]]`);
        expect(await th.run(`SeqFormula(b*a**2, (a, 0, 2))`)).equal(`[[0,b,4b]]`);
    });

    it.skip("FourierSeries", async () => {
        expect(await th.run(`fourier_series(x, (x, -pi, pi))`)).equal(`[-][sin,]([2x])[+2][sin,]([x])[+][frac,[2][sin,]([3x]),[3]][+…]`);

    })

    it("FormalPowerSeries", async () => {
        expect(await th.run(`fps(log(1 + x))`)).equal(`[sum,[k=1],[∞]][-][frac,([-1])[💪,[-k]][x][💪,[k]],[k]]`);

    })

    it("intervals", async () => {
        await th.prepare(`a = Symbol('a', real=True)`);
        expect(await th.run(`Interval(0, 0)`)).equal(`{[0]}`);
        expect(await th.run(`Interval(0, a)`)).equal(`[[0,a]]`);
        expect(await th.run(`Interval(0, a, False, False)`)).equal(`[[0,a]]`);
        expect(await th.run(`Interval(0, a, True, False)`)).equal(`([0,a]]`);
        expect(await th.run(`Interval(0, a, False, True)`)).equal(`[[0,a])`);
        expect(await th.run(`Interval(0, a, True, True)`)).equal(`([0,a])`);

    });

    it("AccumuBounds", async () => {
        await th.prepare(`a = Symbol('a', real=True)`);
        expect(await th.run(`AccumBounds(0, 1)`)).equal(`<[0,1]>`);
        expect(await th.run(`AccumBounds(0, a)`)).equal(`<[0,a]>`);
        expect(await th.run(`AccumBounds(a + 1, a + 2)`)).equal(`<[1+a,2+a]>`);
    });

    it("emptyset", async () => {
        expect(await th.run(`S.EmptySet`)).equal(`[∅]`);
    })

    it("universalset", async () => {
        expect(await th.run(`S.UniversalSet`)).equal(`[U,mathbb]`);
    })

    it.skip("commutator", async () => {
        await th.prepare(` 
A = Operator('A')
B = Operator('B')
comm = Commutator(B, A)
`)
        expect(await th.run(`comm.doit()`)).equal(`[-]([AB-BA])`);
    })

    it("union", async () => {
        expect(await th.run(`Union(Interval(0, 1), Interval(2, 3))`)).equal(`[[0,1]][∪][[2,3]]`);
        expect(await th.run(`Union(Interval(1, 1), Interval(2, 2), Interval(3, 4))`)).equal(`{[1,2]}[∪][[3,4]]`);

    });

    it("intersection", async () => {
        expect(await th.run(`Intersection(Interval(0, 1), Interval(x, y))`)).equal(`[[0,1]][∩][[x,y]]`);

    });

    it("symmetric_difference", async () => {
        expect(await th.run(`SymmetricDifference(Interval(2, 5), Interval(4, 7),evaluate=False)`)).equal(`[[2,5]][▵][[4,7]]`);
    })

    it("Complement", async () => {
        expect(await th.run(`Complement(S.Reals, S.Naturals)`)).equal(`[R,mathbb][⧵][N,mathbb]`);
    })
    it("productset", async () => {

        await th.prepare(`
line = Interval(0, 1)
bigline = Interval(0, 10)
fset = FiniteSet(1, 2, 3)
        `)
        expect(await th.run(`line**2`)).equal(`[[0,1]][💪,[2]]`);
        expect(await th.run(`line**10`)).equal(`[[0,1]][💪,[10]]`);
        expect(await th.run(`(line * bigline * fset).flatten()`)).equal(`[[0,1]][×][[0,10]][×]{[1,2,3]}`);
    });

    it("set_operators_parenthesis", async () => {

        await th.prepare(`
a, b, c, d = symbols('a:d')
A = FiniteSet(a)
B = FiniteSet(b)
C = FiniteSet(c)
D = FiniteSet(d)

U1 = Union(A, B, evaluate=False)
U2 = Union(C, D, evaluate=False)
I1 = Intersection(A, B, evaluate=False)
I2 = Intersection(C, D, evaluate=False)
C1 = Complement(A, B, evaluate=False)
C2 = Complement(C, D, evaluate=False)
D1 = SymmetricDifference(A, B, evaluate=False)
D2 = SymmetricDifference(C, D, evaluate=False)
# XXX ProductSet does not support evaluate keyword
P1 = ProductSet(A, B)
P2 = ProductSet(C, D)
        `);
        expect(await th.run(`Intersection(A, U2, evaluate=False)`)).equal(`{[a]}[∩]({[c]}[∪]{[d]})`);
        expect(await th.run(`Intersection(U1, U2, evaluate=False)`)).equal(`({[a]}[∪]{[b]})[∩]({[c]}[∪]{[d]})`);
        expect(await th.run(`Intersection(C1, C2, evaluate=False)`)).equal(`({[a]}[⧵]{[b]})[∩]({[c]}[⧵]{[d]})`);
        expect(await th.run(`Intersection(D1, D2, evaluate=False)`)).equal(`({[a]}[▵]{[b]})[∩]({[c]}[▵]{[d]})`);
        expect(await th.run(`Intersection(P1, P2, evaluate=False)`)).equal(`({[a]}[×]{[b]})[∩]({[c]}[×]{[d]})`);
        expect(await th.run(`Union(A, I2, evaluate=False)`)).equal(`{[a]}[∪]({[c]}[∩]{[d]})`);
        expect(await th.run(`Union(I1, I2, evaluate=False)`)).equal(`({[a]}[∩]{[b]})[∪]({[c]}[∩]{[d]})`);
        expect(await th.run(`Union(C1, C2, evaluate=False)`)).equal(`({[a]}[⧵]{[b]})[∪]({[c]}[⧵]{[d]})`);
        expect(await th.run(`Union(D1, D2, evaluate=False)`)).equal(`({[a]}[▵]{[b]})[∪]({[c]}[▵]{[d]})`);
        expect(await th.run(`Union(P1, P2, evaluate=False)`)).equal(`({[a]}[×]{[b]})[∪]({[c]}[×]{[d]})`);
        expect(await th.run(`Complement(A, C2, evaluate=False)`)).equal(`{[a]}[⧵]({[c]}[⧵]{[d]})`);
        expect(await th.run(`Complement(U1, U2, evaluate=False)`)).equal(`({[a]}[∪]{[b]})[⧵]({[c]}[∪]{[d]})`);
        expect(await th.run(`Complement(I1, I2, evaluate=False)`)).equal(`({[a]}[∩]{[b]})[⧵]({[c]}[∩]{[d]})`);
        expect(await th.run(`Complement(D1, D2, evaluate=False)`)).equal(`({[a]}[▵]{[b]})[⧵]({[c]}[▵]{[d]})`);
        expect(await th.run(`Complement(P1, P2, evaluate=False)`)).equal(`({[a]}[×]{[b]})[⧵]({[c]}[×]{[d]})`);
        expect(await th.run(`SymmetricDifference(A, D2, evaluate=False)`)).equal(`{[a]}[▵]({[c]}[▵]{[d]})`);
        expect(await th.run(`SymmetricDifference(U1, U2, evaluate=False)`)).equal(`({[a]}[∪]{[b]})[▵]({[c]}[∪]{[d]})`);
        expect(await th.run(`SymmetricDifference(I1, I2, evaluate=False)`)).equal(`({[a]}[∩]{[b]})[▵]({[c]}[∩]{[d]})`);
        expect(await th.run(`SymmetricDifference(C1, C2, evaluate=False)`)).equal(`({[a]}[⧵]{[b]})[▵]({[c]}[⧵]{[d]})`);
        expect(await th.run(`SymmetricDifference(P1, P2, evaluate=False)`)).equal(`({[a]}[×]{[b]})[▵]({[c]}[×]{[d]})`);

        expect(await th.run(`ProductSet(A, P2).flatten()`)).equal(`{[a]}[×]{[c]}[×]{[d]}`);
        expect(await th.run(`ProductSet(U1, U2)`)).equal(`({[a]}[∪]{[b]})[×]({[c]}[∪]{[d]})`);
        expect(await th.run(`ProductSet(I1, I2)`)).equal(`({[a]}[∩]{[b]})[×]({[c]}[∩]{[d]})`);
        expect(await th.run(`ProductSet(C1, C2)`)).equal(`({[a]}[⧵]{[b]})[×]({[c]}[⧵]{[d]})`);
        expect(await th.run(`ProductSet(D1, D2)`)).equal(`({[a]}[▵]{[b]})[×]({[c]}[▵]{[d]})`);

    });

    it.skip("Complexes", async () => {
        expect(await th.run(`S.Complexes`)).equal(`[C,mathbb]`);
    });

    it("Naturals", async () => {
        expect(await th.run(`S.Naturals`)).equal(`[N,mathbb]`);
    });
    it("Naturals0", async () => {
        expect(await th.run(`S.Naturals0`)).equal(`[N,mathbb][⛏️,[0]]`);
    });
    it("Integers", async () => {
        expect(await th.run(`S.Integers`)).equal(`[Z,mathbb]`);
    });

    it("ImageSet", async () => {
        await th.prepare(` x = Symbol('x')`)
        expect(await th.run(`ImageSet(Lambda(x, x**2), S.Naturals)`)).equal(`{[x][💪,[2]][ ][middle|,][ x∈][N,mathbb]}`);
        expect(await th.run(`ImageSet(Lambda(((x, y),), x + y), ProductSet({1, 2, 3}, {3, 4}))`)).equal(`{[x+y ][middle|,][ ]([x,y])[∈]{[1,2,3]}[×]{[3,4]}}`);
    });

    it("ConditionSet", async () => {
        await th.prepare(` x = Symbol('x')`)
        expect(await th.run(`ConditionSet(x, Eq(x**2, 1), S.Reals)`)).equal(`{[x ][middle|,][ x∈][R,mathbb][∧x][💪,[2]][=1]}`);
        expect(await th.run(`ConditionSet(x, Eq(x**2, 1), S.UniversalSet)`)).equal(`{[x ][middle|,][ x][💪,[2]][=1]}`);

    })
    it.skip("ComplexRegion", async () => {
        expect(await th.run(`ComplexRegion(Interval(3, 5)*Interval(4, 6))`)).equal(`{[iy+x ][middle|,][ x,y∈][[3,5]][×][[4,6]]}`);
        expect(await th.run(`ComplexRegion(Interval(0, 1)*Interval(0, 2*pi), polar=True)`)).equal(`{([i][sin,]([𝜃])[+][cos,]([𝜃]))[r ][middle|,][ r,𝜃∈][[0,1]][×][[0,2𝜋])}`);

    })

    it("Contains", async () => {
        expect(await th.run(`Contains(x, S.Naturals)`)).equal(`[x∈][N,mathbb]`);
    })

    it("sum", async () => {
        expect(await th.run(`Sum(x*y**2, (x, -2, 2), (y, -5, 5))`)).equal(`[sum,[-2≤x≤2]💔[-5≤y≤5]][xy][💪,[2]]`);
        expect(await th.run(`Sum(x**2, (x, -2, 2))`)).equal(`[sum,[x=-2],[2]][x][💪,[2]]`);
        expect(await th.run(`Sum(x**2 + y, (x, -2, 2))`)).equal(`[sum,[x=-2],[2]]([y+x][💪,[2]])`);
        expect(await th.run(`Sum(x**2 + y, (x, -2, 2))**2`)).equal(`([sum,[x=-2],[2]]([y+x][💪,[2]]))[💪,[2]]`);
    });

    it("product", async () => {
        expect(await th.run(`Product(x*y**2, (x, -2, 2), (y, -5, 5))`)).equal(`[prod,[-2≤x≤2]💔[-5≤y≤5]][xy][💪,[2]]`);
        expect(await th.run(`Product(x**2, (x, -2, 2))`)).equal(`[prod,[x=-2],[2]][x][💪,[2]]`);
        expect(await th.run(`Product(x**2 + y, (x, -2, 2))`)).equal(`[prod,[x=-2],[2]]([y+x][💪,[2]])`);
        expect(await th.run(`Product(x, (x, -2, 2))**2`)).equal(`([prod,[x=-2],[2]][x])[💪,[2]]`);

    });

    it("limits", async () => {
        await th.prepare(`f = Function('f')`);
        expect(await th.run(`Limit(x, x, oo)`)).equal(`[lim,[x][rightarrow,][∞]][x]`);
        expect(await th.run(`Limit(f(x), x, 0)`)).equal(`[lim,[x][rightarrow,][0][💪,[+]]][f]([x])`);
        expect(await th.run(`Limit(f(x), x, 0, "-")`)).equal(`[lim,[x][rightarrow,][0][💪,[-]]][f]([x])`);
        expect(await th.run(`Limit(f(x), x, 0)**2`)).equal(`([lim,[x][rightarrow,][0][💪,[+]]][f]([x]))[💪,[2]]`);
        expect(await th.run(`Limit(f(x), x, 0, dir='+-')`)).equal(`[lim,[x][rightarrow,][0]][f]([x])`);
    });

    it("log", async () => {
        await th.prepare(`y = symbols('y')`);
        expect(await th.run(`log(x)`)).equal(`[log,]([x])`);
        expect(await th.run(`ln(x)`)).equal(`[log,]([x])`);
        expect(await th.run(`log(x)+log(y)`)).equal(`[log,]([x])[+][log,]([y])`);
        expect(await th.run(`pow(log(x), x)`)).equal(`[log,]([x])[💪,[x]]`);

    })
    it("sympy issue 3568", async () => {
        await th.prepare(` 
beta = Symbol(r'\\beta')
y1111 = beta + x
        `);

        expect(await th.run(`y1111`)).equal(`[𝛽+x]`);
    })

    it("Rational", async () => {
        expect(await th.run(`(2*tau)**Rational(7, 2)`)).equal(`[8][sqrt,[2]][𝜏][💪,[frac,[7],[2]]]`);
        expect(await th.run(`[2/x, y]`)).equal(`[[frac,[2],[x]][,y]]`);

    })


    it("dict", async () => {
        expect(await th.run(`{Rational(1): 1, x**2: 2, x: 3, x**3: 4}`)).equal(`{[1:1,x][💪,[2]][:2,x:3,x][💪,[3]][:4]}`);
        expect(await th.run(`Dict({Rational(1): 1, x**2: 2, x: 3, x**3: 4})`)).equal(`{[x][💪,[3]][:4,x:3,1:1,x][💪,[2]][:2]}`);

    })

    it("list", async () => {
        expect(await th.run(`[Symbol('omega1'), Symbol('a'), Symbol('alpha')]`)).equal(`[[𝜔][⛏️,[1]][,a,𝛼]]`);
    })

    it.skip("Rational2", async () => {
        expect(await th.run(`-Rational(1, 2)`)).equal(`[-][frac,[1],[2]]`);
        expect(await th.run(`Rational(-1, 2)`)).equal(`[-][frac,[1],[2]]`);
        expect(await th.run(`Rational(1, -2)`)).equal(`[-][frac,[1],[2]]`);
        expect(await th.run(`-Rational(-1, 2)`)).equal(`[frac,[1],[2]]`);
        expect(await th.run(`-Rational(1, 2)*x`)).equal(`[-][frac,[x],[2]]`);
        expect(await th.run(`-Rational(1, 2)*x + Rational(-2, 3)*y`)).equal(`[-][frac,[2y],[3]][-][frac,[x],[2]]`);

    })

    it("inverse", async () => {
        expect(await th.run(`1/x`)).equal(`[frac,[1],[x]]`);
        expect(await th.run(`1/(x + y)`)).equal(`[frac,[1],[x+y]]`);
    });

    it("DiracDelta", async () => {
        expect(await th.run(`DiracDelta(x)`)).equal(`[𝛿]([x])`);
        expect(await th.run(`DiracDelta(x)**2`)).equal(`[𝛿]([x])[💪,[2]]`);
        expect(await th.run(`DiracDelta(x, 0)`)).equal(`[𝛿]([x])`);
        expect(await th.run(`DiracDelta(x, 5)`)).equal(`[𝛿][💪,([5])]([x])`);
        expect(await th.run(`DiracDelta(x, 5)**2`)).equal(`([𝛿][💪,([5])]([x]))[💪,[2]]`);

    })

    it("Heaviside", async () => {
        expect(await th.run(`Heaviside(x)`)).equal(`[𝜃]([x])`);
        expect(await th.run(`Heaviside(x)**2`)).equal(`([𝜃]([x]))[💪,[2]]`);
    })

    it("KroneckerDelta", async () => {

        expect(await th.run(`KroneckerDelta(x, y)`)).equal(`[𝛿][⛏️,[xy]]`);
        expect(await th.run(`KroneckerDelta(x, y + 1)`)).equal(`[𝛿][⛏️,[x,1+y]]`);
        expect(await th.run(`KroneckerDelta(x + 1, y)`)).equal(`[𝛿][⛏️,[y,1+x]]`);
        expect(await th.run(`Pow(KroneckerDelta(x, y), 2, evaluate=False)`)).equal(`([𝛿][⛏️,[xy]])[💪,[2]]`);
    })

    it("LeviCivita", async () => {
        expect(await th.run(`LeviCivita(x, y, z)`)).equal(`[𝜀][⛏️,[xyz]]`);
        expect(await th.run(`LeviCivita(x, y, z)**2`)).equal(`([𝜀][⛏️,[xyz]])[💪,[2]]`);
        expect(await th.run(`LeviCivita(x, y, z + 1)`)).equal(`[𝜀][⛏️,[x,y,1+z]]`);
        expect(await th.run(`LeviCivita(x, y + 1, z)`)).equal(`[𝜀][⛏️,[x,1+y,z]]`);
        expect(await th.run(`LeviCivita(x + 1, y, z)`)).equal(`[𝜀][⛏️,[1+x,y,z]]`);
    })

    it("mathieu", async () => {
        expect(await th.run(`mathieuc(x, y, z)`)).equal(`[C]([x,y,z])`);
        expect(await th.run(`mathieus(x, y, z)`)).equal(`[S]([x,y,z])`);
        expect(await th.run(`mathieuc(x, y, z)**2`)).equal(`[C]([x,y,z])[💪,[2]]`);
        expect(await th.run(`mathieus(x, y, z)**2`)).equal(`[S]([x,y,z])[💪,[2]]`);
        expect(await th.run(`mathieucprime(x, y, z)`)).equal(`[C][💪,[′]]([x,y,z])`);
        expect(await th.run(`mathieusprime(x, y, z)`)).equal(`[S][💪,[′]]([x,y,z])`);
        expect(await th.run(`mathieucprime(x, y, z)**2`)).equal(`[C][💪,[′]]([x,y,z])[💪,[2]]`);
        expect(await th.run(`mathieusprime(x, y, z)**2`)).equal(`[S][💪,[′]]([x,y,z])[💪,[2]]`);
    })
    it("Piecewise", async () => {
        expect(await th.run(`Piecewise((x, x < 1), (x**2, True))`)).equal(`[🏓cases,[x],[📜,[for]][ x<1],[x][💪,[2]],[📜,[otherwise]][ ]]`);
        expect(await th.run(`Piecewise((x, x < 0), (0, x >= 0))`)).equal(`[🏓cases,[x],[📜,[for]][ x<0],[0],[📜,[otherwise]][ ]]`);

        await th.prepare(`
A, B = symbols("A B", commutative=False)
p = Piecewise((A**2, Eq(A, B)), (A*B, True))
        `);
        // expect(await th.run(`p`)).equal(`[🏓cases,[A][💪,[2]],[📜,[for]][ A=B],[AB],[📜,[otherwise]][ ]]`);
        // expect(await th.run(`A*p`)).equal(`[🏓cases,[A][💪,[2]],[📜,[for]][ A=B],[AB],[📜,[otherwise]][ ]]`);

    })

});