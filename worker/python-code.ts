export const defineSympyExprDumpFunc = `

class __McHdl:
    def hdl_str(self, expr):
        return {'func': 'Str','text': expr}

    def hdl_tuple(self, expr):
        return {'func': 'Tuple', 'args':  self.argsMap(expr) }

    def hdl_Tuple(self, expr):
        return {'func': 'Tuple', 'args':  self.argsMap(expr) }

    def hdl_list(self, expr):
        return {'func': 'List', 'args': self.argsMap(expr)}

    def hdl_UndefinedFunction(self, expr):
        return {'func': 'UndefinedFunction', 'name': str(expr), 'args': []}
    
    def hdl_Add(self, expr):
        return {'func': 'Add', 'args': self.argsMap(expr.args)}

    def hdl_Mul(self, expr):
        return {'func': 'Mul', 'args': self.argsMap(expr.args)}
    
    def hdl_MatrixBase(self, expr):
        l = []
        for i in range(expr.rows):
            for j in range(expr.cols):
                l.append(self.hdlAll(expr[i, j]))

        return {'func':'Matrix','args':l, 'row':expr.rows, 'col':expr.cols}
    
    def hdl_Max(self, expr):
        return self.hdlGenericFunc('max',expr.args)

    def hdl_Min(self, expr):
        return self.hdlGenericFunc('min',expr.args)
    
    def hdl_Symbol(self, expr):
        return {'func':'Symbol', 'name':expr.name }

    def hdl_MatrixSymbol(self, expr):
        return {'func':'MatrixSymbol', 'name':expr.name }

    def hdl_RandomSymbol(self, expr):
        return {'func':'Symbol', 'name':expr.name }
    
    def hdl_Poly(self, expr):
        return {'func': 'Poly','args': [self.hdlAll(expr.domain)]+ self.argsMap(expr.args) }

    def hdl_Integer(self, expr):
        return {'func':'Integer', 'value':str(expr.p) }

    def hdl_int(self, expr):
        return {'func':'Integer', 'value':str(expr) }
        
    
    def hdl_Dummy(self, expr):
        return {'func':'Dummy', 'name':expr.name }

    def hdl_Str(self, expr):
        return {'func':'Str', 'text':expr.name }

    def hdl_NumberSymbol(self, expr):
        return {'func':'NumberSymbol', 'name':str(expr) }

    def hdl_Rational(self, expr):
        return {'func':'Rational', 'p':expr.p, 'q': expr.q}

    def hdl_Float(self, expr):
        import mpmath.libmp as mlib
        from mpmath.libmp import prec_to_dps
        dps = prec_to_dps(expr._prec)
        str_real = mlib.to_str(expr._mpf_, dps, strip_zeros=True, min_fixed=None, max_fixed=None)
        return {'func':'Float', 'value':str_real }

    def hdl_float(self, expr):
        return self.hdl_Float(Float(expr))

    def hdl_CoordSys3D(self, expr):
        return {'func':'CoordSys3D', 'variableNames':expr._variable_names, 'vectorNames':expr._vector_names, 'args':  self.argsMap(expr.args) }

    def hdl_Derivative(self, expr):
        from sympy.printing.conventions import requires_partial
        return {'func':'Derivative', 'partial':requires_partial(expr), 'args':  self.argsMap(expr.args) }

    def hdl_Relational(self, expr):
        return {'func': 'Relational', 'relOp': expr.rel_op, 'args':  self.argsMap(expr.args)  } 

    def hdl_FiniteField(self, expr):
        return {'func': 'FiniteField', 'mod': self.hdlAll(expr.mod) } 

    def hdl_IntegerRing(self, expr):
        return {'func': 'DisplayedDomain', 'name': 'Z' } 

    def hdl_RationalField(self, expr):
        return {'func': 'DisplayedDomain', 'name': 'Q' } 

    def hdl_RealField(self, expr):
        return {'func': 'DisplayedDomain', 'name': 'R' } 

    def hdl_ComplexField(self, expr):
        return {'func': 'DisplayedDomain', 'name': 'C' } 

    def hdl_bool(self, expr):    
        if expr:
            return {'func': 'BooleanTrue' } 
        else: 
            return {'func': 'BooleanFalse' } 

    def hdl_SingularityFunction(self, expr):
        return {'func': 'SingularityFunction', 'args': [self.hdlAll(expr.args[0] - expr.args[1]), self.hdlAll(expr.args[2])] }     

    def hdl_Cycle(self, expr):
        from sympy.combinatorics.permutations import Permutation
        if expr.size == 0:
            return { 'func': 'Cycle', 'perm' : [] }

        expr = Permutation(expr)
        expr_perm = expr.cyclic_form
        siz = expr.size
        if expr.array_form[-1] == siz - 1:
            expr_perm = expr_perm + [[siz - 1]]

        return { 'func': 'Cycle', 'perm' : expr_perm }

    def hdl_Permutation(self, expr):
        return self.hdl_Cycle(expr)

    def hdl_Exp1(self, expr):
        return { 'func': 'Exp1' }

    def hdl_genfunc_meijerg(self,expr):
        return { 
            'func': 'GenericFunc',
            'name': 'meijerg',
            'args':[
                self.hdlAll(len(expr.ap)),
                self.hdlAll(len(expr.bq)),
                self.hdlAll(len(expr.bm)),
                self.hdlAll(len(expr.an)),
                self.hdlAll(expr.an),
                self.hdlAll(expr.aother),
                self.hdlAll(expr.bm),
                self.hdlAll(expr.bother),
                self.hdlAll(expr.argument)

            ]            
         }

    def hdl_genfunc_hyper(self,expr):
        return { 
        'func': 'GenericFunc',
        'name': 'hyper',
        'args':[
            self.hdlAll(len(expr.ap)),
            self.hdlAll(len(expr.bq)),            
            self.hdlAll(expr.ap),
            self.hdlAll(expr.bq),
            self.hdlAll(expr.argument)
        ]            
    }

    def hdl_set(self,expr):
        return { 'func': 'Set', 'args': self.argsMap(expr) }

    hdl_frozenset = hdl_set

    def hdl_Range(self,s):
        dots = Symbol('dots')
        if s.has(Symbol):
            return self.hdlGenericFunc('Range', s.args)

        if s.start.is_infinite and s.stop.is_infinite:
            if s.step.is_positive:
                printset = dots, -1, 0, 1, dots
            else:
                printset = dots, 1, 0, -1, dots
        elif s.start.is_infinite:
            printset = dots, s[-1] - s.step, s[-1]
        elif s.stop.is_infinite:
            it = iter(s)
            printset = next(it), next(it), dots
        elif len(s) > 4:
            it = iter(s)
            printset = next(it), next(it), dots, s[-1]
        else:
            printset = tuple(s)
        
        return {'func':'Range', 'args': self.argsMap(printset)}

    def hdl_SeqFormula(self,s):
        dots = Symbol('dots')
        if len(s.start.free_symbols) > 0 or len(s.stop.free_symbols) > 0:
            return {
                'func':'SeqFormula', 'args': self.argsMap((
                s.formula,
                s.variables[0],
                s.start,
                s.stop
            )), 'freeSymbol': True}

            
        if s.start is S.NegativeInfinity:
            stop = s.stop
            printset = (dots, s.coeff(stop - 3), s.coeff(stop - 2),
                        s.coeff(stop - 1), s.coeff(stop))
        elif s.stop is S.Infinity or s.length > 4:
            printset = s[:4]
            printset.append(dots)
        else:
            printset = tuple(s)

        return {'func':'SeqFormula', 'args': self.argsMap(printset)}

    hdl_SeqPer = hdl_SeqFormula
    hdl_SeqAdd = hdl_SeqFormula
    hdl_SeqMul = hdl_SeqFormula

    def hdl_FourierSeries(self, s):
        return {'func':'FourierSeries', 'args':[self.hdlAll(s.truncate())]}

    def hdl_FormalPowerSeries(self, s):
        return self.hdlAll(s.infinite)

    def hdl_ProductSet(self, p):
        return {'func':'ProductSet', 'hasVariety': has_variety(p.sets), 'args': self.argsMap(p.args)}

    def hdl_ComplexRegion(self, p):
        return {'func':'ComplexRegion',  'args': self.argsMap([p.expr, p.variables, p.sets])}
    
    
    def hdl_Dict(self, d):
        return { 'func':'GenericFunc', 'name':'dict',  'args': self.argsMap(d.args) }

    def hdl_KroneckerDelta(self, d):
        return { 'func':'KroneckerDelta',  'args': self.argsMap(d.args), 'isArgsAtom': d.args[0].is_Atom and d.args[1].is_Atom }

    def hdl_LeviCivita(self, d):
        return { 'func':'LeviCivita',  'args': self.argsMap(d.args), 'isArgsAtom': all(x.is_Atom for x in d.args) }

    def hdl_Complexes(self, d):
        return { 'func':'Complexes',  'args': [] }

    def hdl_Naturals(self, d):
        return { 'func':'Naturals',  'args': [] }

    def hdl_Naturals0(self, d):
        return { 'func':'Naturals0',  'args': [] }

    def hdl_Integers(self, d):
        return { 'func':'Integers',  'args': [] }

    def hdl_NDimArray(self, d):
        from sympy.tensor.array import NDimArray
        def expandAll(arr):
            rs=[]
            for item in arr:
                if isinstance(item, NDimArray):
                   rs= rs + expandAll(item)
                else:
                    rs.append(item)
            return rs
        
        args = expandAll(d)  
        return { 'func':'NDimArray',  'args': [self.hdlAll(tuple(args))] + [self.hdlAll(d.shape)] }

    def hdl_PolynomialRing(self, d):
        return {'func': 'PolynomialRing', 'args':self.argsMap([d.domain, d.symbols]) }

    def hdl_FractionField(self, d):
        return {'func': 'FractionField', 'args':self.argsMap([d.domain, d.symbols]) }

    def hdl_PolyRing(self,d):
        return {'func': 'PolyRing', 'args':self.argsMap([d.domain, d.symbols, d.ngens, d.zero_monom]) }

    def hdl_PolyElement(self,d):
        return {'func': 'PolyElement', 'args':self.argsMap([d.ring, d.terms()]) }

    def hdl_FracElement(self,d):
        return {'func': 'FracElement', 'args':self.argsMap([d.numer, d.denom]) }

    def hdl_PythonRational(self,d):
        return {'func': 'PythonRational', 'args':self.argsMap([d.numerator, d.denominator]) }

    def hdl_RootSum(self,d):
        return {'func': 'RootSum', 'args': self.argsMap([d.expr]) if d.fun is  S.IdentityFunction  else self.argsMap([d.expr, d.fun]) }
    
    def hdl_MellinTransform(self,d):
        return {'func':'UnifiedTransform', 'name':'M',  'args': self.argsMap(d.args)}
    def hdl_InverseMellinTransform(self,d):
        return {'func':'UnifiedTransform','name':'M', 'args': self.argsMap(d.args), 'inversed':True }
    def hdl_LaplaceTransform(self,d):
        return {'func':'UnifiedTransform','name':'L', 'args': self.argsMap(d.args)}
    def hdl_InverseLaplaceTransform(self,d):
        return {'func':'UnifiedTransform','name':'L', 'args': self.argsMap(d.args), 'inversed':True }
    def hdl_FourierTransform(self,d):
        return {'func':'UnifiedTransform','name':'F', 'args': self.argsMap(d.args)}
    def hdl_InverseFourierTransform(self,d):
        return {'func':'UnifiedTransform','name':'F', 'args': self.argsMap(d.args), 'inversed':True }
    def hdl_SineTransform(self,d):
        return {'func':'UnifiedTransform','name':'SIN', 'args': self.argsMap(d.args)}
    def hdl_InverseSineTransform(self,d):
        return {'func':'UnifiedTransform','name':'SIN', 'args': self.argsMap(d.args), 'inversed':True }
    def hdl_CosineTransform(self,d):
        return {'func':'UnifiedTransform','name':'COS', 'args': self.argsMap(d.args)}
    def hdl_InverseCosineTransform(self,d):
        return {'func':'UnifiedTransform','name':'COS', 'args': self.argsMap(d.args), 'inversed':True } 

    def hdl_PolynomialRingBase(self,d):
        return {'func':'PolynomialRingBase', 'args': self.argsMap([d.domain,d.symbols]), 'inversed': not d.is_Poly } 

    def hdl_Morphism(self,d):
        return {'func':'Morphism', 'args': self.argsMap([d.domain,d.codomain]) } 

    def hdl_NamedMorphism(self,d):
        from sympy import Symbol
        return {'func':'NamedMorphism', 'args': self.argsMap([Symbol(d.name), d.domain,d.codomain]) } 

    def hdl_IdentityMorphism(self,d):
        from sympy import Symbol
        return {'func':'NamedMorphism', 'args': self.argsMap([Symbol('id'), d.domain,d.codomain]) } 

    def hdl_CompositeMorphism(self,d):
        from sympy import Symbol
        return {'func':'CompositeMorphism', 'args': self.argsMap([[Symbol(component.name) for component in d.components], d.domain,d.codomain]) } 

    def hdl_Category(self,d):
        from sympy import Symbol
        return {'func':'Category', 'args': self.argsMap([Symbol(d.name)]) } 

    def hdl_Diagram(self,d):
        if not d.premises:
            return {'func':'EmptySet'}
        args = [d.premises]
        if d.conclusions:
            args.append(d.conclusions)
        return {'func':'Diagram', 'args': self.argsMap(args) } 

    def hdl__Object(self,d):
        return this.hdlAll(Symbol(d.name))

    def hdl_DiagramGrid(self,d):
        args=[]
        for i in range(d.height):
            for j in range(d.width):
               args.append(d[i,j])
        return {'func':'DiagramGrid', 'args': self.argsMap(args), 'row': d.height, 'col': d.width } 

    def hdl_FreeModule(self,d):
        return {'func':'FreeModule', 'args': self.argsMap([d.ring,d.rank]), } 

    def hdl_DMP(self,p):
        try:
            if p.ring is not None:
                # TODO incorporate order
                # return self._print(p.ring.to_sympy(p))
                return {'func':'DMP', 'args': self.argsMap([p.ring.to_sympy(p)]), } 
        except SympifyError:
            pass
        #return self._print(repr(p))
        return {'func':'DMP', 'args': self.argsMap([repr(p)]), } 
       
    def hdl_DMF(self,p):
        return hdl_DMP(p)

    def hdl_FreeModuleElement(self,d):
        return {'func':'FreeModuleElement', 'args': self.argsMap(d), } 

    def hdl_SubModule(self,d):
        return {'func':'SubModule', 'args': self.argsMap([d.gens]), } 

    def hdl_ModuleImplementedIdeal(self,d):
        return {'func':'SubModule', 'args': self.argsMap([[x for [x] in d._module.gens]]), } 

    def hdl_QuotientRing(self,d):
        return {'func':'Frac', 'args': self.argsMap([d.ring,d.base_ideal]) } 

    def hdl_QuotientRingElement(self,d):
        return {'func':'Add', 'args': self.argsMap([d.data,d.ring.base_ideal]) } 

    def hdl_QuotientModuleElement(self,d):
        return {'func':'Add', 'args': self.argsMap([d.data,d.module.killed_module]) } 

    def hdl_QuotientModule(self,d):
        return {'func':'Frac', 'args': self.argsMap([d.base,d.killed_module]) } 

    def hdl_MatrixHomomorphism(self,h):
        return {'func':'MatrixHomomorphism', 'args': self.argsMap([h._sympy_matrix(),h.domain,h.codomain]) } 

    def hdl_MatPow(self,h):
        return {'func':'Pow', 'args': self.argsMap(h.args) } 

    def hdl_ArraySymbol(self,h):
        from sympy import Symbol
        return self.hdlAll(h.name)

            
    def hdl_MatrixSlice(self,d):
        def myslice(x, dim):
            x = list(x)
            if x[2] == 1:
                del x[2]
            if x[0] == 0:
                x[0] = None
            if x[1] == dim:
                x[1] = None
            return x
        return {'func': 'MatrixSlice', 'args':self.argsMap([d.parent, myslice(d.rowslice, d.parent.rows), myslice(expr.colslice, expr.parent.cols)]) }
        
    def hdl_NoneType(self,d):
        return {'func':'NoneType'}

    def hdl_RandomDomain(self,d):
        subType=''
        args=[]
        if hasattr(d, 'as_boolean'):
            subType = 'boolean'
            args=self.argsMap([d.as_boolean()])
        elif hasattr(d, 'set'):
            subType = 'set'
            args=self.argsMap([d.symbols,d.set])
        elif hasattr(d, 'symbols'):
            subType = 'symbols'
            args=self.argsMap([d.symbols])

        return {'func':'RandomDomain', 'subType':subType, 'args': args}

    def hdl_Quantity(self,d):
        from sympy import Symbol
        if d._latex_repr:
            return {'func':'Quantity', 'args': self.argsMap(d.args), 'latex': d._latex_repr }

        return {'func':'Quantity', 'args': self.argsMap(d.args) }

    def hdl_Manifold(self,d):
        from sympy import Symbol
        return {'func':'Manifold', 'args': [self.hdlAll(Symbol(d.name.name))] }

    def hdl_Patch(self,d):
        from sympy import Symbol
        return {'func':'Patch', 'args': self.argsMap([Symbol(d.name.name),d.manifold]) }

    def hdl_CoordSystem(self,d):
        from sympy import Symbol
        return {'func':'CoordSystem', 'args': self.argsMap([Symbol(d.name.name),Symbol(d.patch.name.name),d.manifold]) }

    def hdl_BaseScalarField(self,d):
        from sympy import Symbol
        string = d._coord_sys.symbols[d._index].name
        return {'func':'BaseScalarField', 'args': self.argsMap([Symbol(string)]) }

    def hdl_BaseVectorField(self,field):
        from sympy import Symbol
        string = field._coord_sys.symbols[field._index].name
        return {'func':'BaseVectorField', 'args': self.argsMap([Symbol(string)]) }

    def hdl_Differential(self,diff):
        from sympy import Symbol
        field = diff._form_field
        if hasattr(field, '_coord_sys'):
            string = field._coord_sys.symbols[field._index].name
            return {'func':'Differential', 'args': self.argsMap([Symbol(string)]), 'coordSys':True }

        return {'func':'Differential', 'args': self.argsMap([field]) }

    def hdl_TensorIndex(self,d):    
        return {'func':'TensorIndex', 'isUp': True if d.is_up else False, 'args': self.argsMap([d.args[0]]) }

    def hdl_TensorElement(self,expr):
        name = expr.expr.args[0].args[0]
        indices = expr.expr.get_indices()
        index_map = expr.index_map
        newIdxMap = []
        for idx in indices:
            newIdxMap.append(index_map[idx] if (idx in index_map) else  None )

        return {'func':'TensorElement', 'args': self.argsMap([name, indices,newIdxMap]) }

    def hdl_Tensor(self,expr):
        name = expr.args[0].args[0]
        indices = expr.get_indices()
        return {'func':'Tensor', 'args': self.argsMap([name, indices]) }

    def hdl_TensMul(self,expr):
        return {'func':'Mul', 'args': self.argsMap(expr.args) }

    def hdl_TensAdd(self,expr):
        return {'func':'Add', 'args': self.argsMap(expr.args) }

    def hdl_PartialDerivative(self,expr):
        return {'func':'PartialDerivative', 'args': self.argsMap([expr.expr,expr.variables]) }

    def hdl_Feedback(self,expr):
        from sympy.physics.control import TransferFunction, Parallel, Series

        num, tf = expr.num, TransferFunction(1, 1, expr.num.var)
        num_arg_list = list(num.args) if isinstance(num, Series) else [num]
        den_arg_list = list(expr.den.args) if isinstance(expr.den, Series) else [expr.den]

        if isinstance(num, Series) and isinstance(expr.den, Series):
            den = Parallel(tf, Series(*num_arg_list, *den_arg_list))
        elif isinstance(num, Series) and isinstance(expr.den, TransferFunction):
            if expr.den == tf:
                den = Parallel(tf, Series(*num_arg_list))
            else:
                den = Parallel(tf, Series(*num_arg_list, expr.den))
        elif isinstance(num, TransferFunction) and isinstance(expr.den, Series):
            if num == tf:
                den = Parallel(tf, Series(*den_arg_list))
            else:
                den = Parallel(tf, Series(num, *den_arg_list))
        else:
            if num == tf:
                den = Parallel(tf, *den_arg_list)
            elif expr.den == tf:
                den = Parallel(tf, *num_arg_list)
            else:
                den = Parallel(tf, Series(*num_arg_list, *den_arg_list))

        return {'func':'Frac', 'args': self.argsMap([num, den]) }
    
    def hdl_TransferFunction(self,expr):
        return {'func':'Frac', 'args': self.argsMap([expr.num, expr.den]) }

    def hdl_Parallel(self,expr):
        return {'func':'Add', 'args': self.argsMap(expr.args) }


    def hdlGenericFunc(self, name, args):
        dic = {}
        dic['func'] = 'GenericFunc' 
        dic['name'] = name
        dic['args']=self.argsMap(args)
        return dic    


    def hdlOthers(self, expr):
        dic = { 'func':'GenericFunc', 'args':[] }        

        if hasattr(expr.__class__,'__class__') and expr.__class__.__class__.__name__ == 'UndefinedFunction':
            return { 'func': 'UndefinedFunction', 'name': expr.__class__.__name__, 'args': self.argsMap(expr.args) }
        
        if expr.__class__.__name__ == 'FunctionClass':            
            dic['name']= expr.__name__
        elif hasattr(expr, 'func'):
            funcName = expr.func.__name__
            if funcName[0].islower():
                dic['name']= funcName
            else:
                dic['func']= funcName
        else:
            dic['name']= expr.__class__.__name__

        if 'name' in dic and  hasattr(self, 'hdl_genfunc_' + dic['name']) :                
            found = getattr(self, 'hdl_genfunc_' + dic['name'])(expr)
            return found

        if hasattr(self, 'hdl_' + dic['func']) :                
            found = getattr(self, 'hdl_' + dic['func'])(expr)
            return found
        
        
        if hasattr(expr, 'args') and hasattr(expr.args,'__iter__'):
            dic['args'] = self.argsMap(expr.args)

        return dic

    def hdlAll(self, expr):
        if expr.__class__.__name__ == 'dict':
            return self.hdlDict(expr)
        
        result = self.callIfExistsInHierarchy(expr)
        if result == None:
            return self.hdlOthers(expr)
        else:
            return result

    def callIfExistsInHierarchy(self, expr):
        import inspect
        found = None
        #print(expr.__class__.__name__)

        if hasattr(self, 'hdl_' + expr.__class__.__name__) :
            found = getattr(self, 'hdl_' + expr.__class__.__name__)(expr)
        else:
            for base_class in inspect.getmro(expr.__class__):
            
                bclassname = base_class.__name__
                #print(bclassname)
                if hasattr(self, 'hdl_' + bclassname) :                
                    found = getattr(self, 'hdl_' + bclassname)(expr)
                    break

        return found

    def argsMap(self, args):
        return list(map(self.hdlAll,args))

    def hdlDict(self, d):
        items = []

        for key in d.keys():
            val = d[key]
            items.append(Tuple(key,val))
        
        return { 'func':'GenericFunc', 'name':'dict',  'args': self.argsMap(items) }
    
def ___mcSympyExprDump(expr):
    # print(expr.func)
    # print()
    # print(expr.args)

    dic = __McHdl().hdlAll(expr)
    
            
    #print(dic)
    return dic
`

export const defineAllSetupFuncs = `
from sympy import *
from sympy import core
from sympy.functions.elementary import trigonometric 
from sympy.functions.elementary import hyperbolic 
from sympy.functions.elementary import exponential 
from sympy.functions.elementary import miscellaneous
from sympy import S

from sympy.printing.str import sstr
import json
import math

${defineSympyExprDumpFunc}
`;

