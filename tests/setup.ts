
// var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var XMLHttpRequest = require("xhr2");
import { ServicePyodideLoader } from "@sympy-worker/pyodide-service/service-pyodide-loader";
import { CasEngineProcess } from "@sympy-worker/cas-engine-process";
import { defineAllSetupFuncs } from "@sympy-worker/python-code";

exports.mochaGlobalSetup = async function () {
    const loader = new ServicePyodideLoader();
    const pyodide = await loader.load(() => { }, 4893);
    console.log(pyodide.runRaw);
    const casEngineProcess = new CasEngineProcess(pyodide, { constantTextFuncs: [] })
    global.XMLHttpRequest = XMLHttpRequest;
    global.casEngineProcess = casEngineProcess;
    global.pyodide = pyodide;

    await casEngineProcess.processRaw(defineAllSetupFuncs, false);
    await casEngineProcess.processRaw(`
from sympy.tensor.array.expressions.array_expressions import ArraySymbol, ArrayElement
from sympy.tensor.toperators import PartialDerivative

from sympy import (
    Abs, Chi, Ci, CosineTransform, Dict, Ei, Eq, FallingFactorial,
    FiniteSet, Float, FourierTransform, Function, Indexed, IndexedBase, Integral,
    Interval, InverseCosineTransform, InverseFourierTransform, Derivative,
    InverseLaplaceTransform, InverseMellinTransform, InverseSineTransform,
    Lambda, LaplaceTransform, Limit, Matrix, Max, MellinTransform, Min, Mul,
    Order, Piecewise, Poly, ring, field, ZZ, Pow, Product, Range, Rational, Integer,
    RisingFactorial, rootof, RootSum, S, Shi, Si, SineTransform, Subs,
    Sum, Symbol, ImageSet, Tuple, Ynm, Znm, arg, asin, acsc, asinh, Mod,
    assoc_laguerre, assoc_legendre, beta, binomial, catalan, ceiling,
    chebyshevt, chebyshevu, conjugate, cot, coth, diff, dirichlet_eta, euler,
    exp, expint, factorial, factorial2, floor, gamma, gegenbauer, hermite,
    hyper, im, jacobi, laguerre, legendre, lerchphi, log, frac,
    meijerg, oo, polar_lift, polylog, re, root, sin, sqrt, symbols,
    uppergamma, zeta, subfactorial, totient, elliptic_k, elliptic_f,
    elliptic_e, elliptic_pi, cos, tan, Wild, true, false, Equivalent, Not,
    Contains, divisor_sigma, SeqPer, SeqFormula, MatrixSlice,
    SeqAdd, SeqMul, fourier_series, pi, ConditionSet, ComplexRegion, fps,
    AccumBounds, reduced_totient, primenu, primeomega, SingularityFunction,
    stieltjes, mathieuc, mathieus, mathieucprime, mathieusprime,
    UnevaluatedExpr, Quaternion, I, KroneckerProduct, LambertW)

from sympy.ntheory.factor_ import udivisor_sigma

from sympy.abc import mu, tau
from sympy.printing.latex import (latex, translate, greek_letters_set,
                                    tex_greek_dictionary, multiline_latex,
                                    latex_escape, LatexPrinter)
from sympy.tensor.array import (ImmutableDenseNDimArray,
                                ImmutableSparseNDimArray,
                                MutableSparseNDimArray,
                                MutableDenseNDimArray,
                                tensorproduct)
from sympy.testing.pytest import XFAIL, raises, _both_exp_pow
from sympy.functions import DiracDelta, Heaviside, KroneckerDelta, LeviCivita
from sympy.functions.combinatorial.numbers import bernoulli, bell, lucas, \\
    fibonacci, tribonacci
from sympy.logic import Implies
from sympy.logic.boolalg import And, Or, Xor
from sympy.physics.control.lti import TransferFunction, Series, Parallel, \\
    Feedback
from sympy.physics.quantum import Commutator, Operator
from sympy.physics.units import meter, gibibyte, microgram, second
from sympy.core.trace import Tr
from sympy.combinatorics.permutations import \\
    Cycle, Permutation, AppliedPermutation
from sympy.matrices.expressions.permutation import PermutationMatrix
from sympy import MatrixSymbol, ln
from sympy.vector import CoordSys3D, Cross, Curl, Dot, Divergence, Gradient, Laplacian
from sympy.sets.setexpr import SetExpr
from sympy.sets.sets import \\
    Union, Intersection, Complement, SymmetricDifference, ProductSet

import sympy as sym
    
`, false);
    await casEngineProcess.processRaw(`
x, y, z, t, w, a, b, c, s, p = symbols('x y z t w a b c s p')
k, m, n = symbols('k m n', integer=True)
    `, false);
    // this.server = await startSomeServer({port: process.env.TEST_PORT});
    // console.log(`server running on port ${this.server.port}`);
    console.log("mocha setup run!")
};