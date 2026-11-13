use swc_common::DUMMY_SP;
use swc_ecma_ast::*;

pub enum FunctionParams<'a> {
    Pat(&'a mut Vec<Pat>),
    Param(&'a mut Vec<Param>),
}

// changes function's params ({ propname: varname }) or (a), and returns an expr that lets you access access the variable (expr is varname or a.varname)
pub fn mut_function_params_and_get_expr_for_access(params: &mut FunctionParams, _prop_name_: &str, _var_name_: &str) -> Option<Expr> {
    let new_object_value = || Ident::new(_var_name_.into(), DUMMY_SP);

    // returns a new object [{ "_prop_name_": _var_name_ }]
    let new_object_props = || {
        vec![ObjectPatProp::KeyValue(KeyValuePatProp {
            // key "_prop_name_"
            key: PropName::Str(Str {
                span: DUMMY_SP,
                value: _prop_name_.into(),
                raw: None,
            }),
            // value _var_name_
            value: Box::new(Pat::Ident(BindingIdent {
                id: new_object_value(),
                type_ann: None,
            })),
        })]
    };

    // new empty pattern of { "_prop_name_": _var_name_,  } = {}
    let new_object_pat = || {
        Pat::Assign(AssignPat {
            span: DUMMY_SP,
            // { "_prop_name_": _var_name_,  }
            left: Box::new(Pat::Object(ObjectPat {
                span: DUMMY_SP,
                props: new_object_props(),
                optional: false,
                type_ann: None,
            })),
            // = {}
            right: Box::new(Expr::Object(ObjectLit { span: DUMMY_SP, props: vec![] })),
        })
    };

    // modifies the params, returning the expression that lets you access _var_name_
    let update_first_param = |mut param: &mut Pat| {
        // (left:{a, b, c, ... } = right:...) should get treated as {a, b, c, ... }
        if let Pat::Assign(AssignPat { left, right: _, .. }) = param {
            param = &mut *left; // doesnt modify anything, just changes pointer
        }

        match param {
            // ({a, b, c, ... }) --convert--> ({ "_prop_name_": _var_name_, a, b, c, ... }), and return _var_name_
            Pat::Object(obj) => {
                let mut new_props = new_object_props();
                new_props.extend(obj.props.iter().cloned());

                *param = Pat::Object(ObjectPat {
                    span: obj.span,
                    props: new_props,
                    optional: obj.optional,
                    type_ann: obj.type_ann.clone(),
                });
                Some(Expr::Ident(new_object_value()))
            }

            // (a, ...) --keep--> (a, ...), and return (typeof a === 'object' && a !== null) ? a["_prop_name_"] : undefined
            Pat::Ident(ident) => Some(Expr::Cond(CondExpr {
                span: DUMMY_SP,
                // typeof a === 'object' && a !== null
                test: Box::new(Expr::Bin(BinExpr {
                    span: DUMMY_SP,
                    op: BinaryOp::LogicalAnd,
                    // typeof a === 'object'
                    left: Box::new(Expr::Bin(BinExpr {
                        span: DUMMY_SP,
                        op: BinaryOp::EqEqEq,
                        left: Box::new(Expr::Unary(UnaryExpr {
                            span: DUMMY_SP,
                            op: UnaryOp::TypeOf,
                            arg: Box::new(Expr::Ident(ident.id.clone())),
                        })),
                        right: Box::new(Expr::Lit(Lit::Str(Str {
                            span: DUMMY_SP,
                            value: "object".into(),
                            raw: None,
                        }))),
                    })),
                    // a !== null
                    right: Box::new(Expr::Bin(BinExpr {
                        span: DUMMY_SP,
                        op: BinaryOp::NotEqEq,
                        left: Box::new(Expr::Ident(ident.id.clone())),
                        right: Box::new(Expr::Lit(Lit::Null(Null { span: DUMMY_SP }))),
                    })),
                })),
                // a["_prop_name_"]
                cons: Box::new(Expr::Member(MemberExpr {
                    span: DUMMY_SP,
                    obj: Box::new(Expr::Ident(ident.id.clone())),
                    prop: MemberProp::Computed(ComputedPropName {
                        span: DUMMY_SP,
                        expr: Box::new(Expr::Lit(Lit::Str(Str {
                            span: DUMMY_SP,
                            value: _prop_name_.into(),
                            raw: None,
                        }))),
                    }),
                })),
                alt: Box::new(Expr::Ident(Ident::new("undefined".into(), DUMMY_SP))),
            })),

            // do nothing to other things like arrays ([1,2,3]), etc
            _ => None,
        }
    };

    let update_params = |params: &mut Vec<Param>| {
        if params.is_empty() {
            // println!("   -adding param (fn)");
            // add first param
            // () --convert--> ({ "_prop_name_": _var_name_, } = {}), and return _var_name_,
            // the = {} is needed in case it's not a JSX component and then gets no input. It'll try defining the variables and cause an error
            params.push(Param {
                span: DUMMY_SP,
                decorators: vec![],
                pat: new_object_pat(),
            });
            Some(Expr::Ident(new_object_value()))
        } else {
            // println!("   -updating first param (fn)");
            // update first param
            update_first_param(&mut params[0].pat)
        }
    };

    let update_pat_params = |params: &mut Vec<Pat>| {
        if params.is_empty() {
            // println!("   -adding param (arrow)");
            // add first param
            // () --convert--> ({ "data-glass-caller-info": data_glass_caller_info,  }), and return data_glass_caller_info
            params.push(new_object_pat());
            Some(Expr::Ident(new_object_value()))
        } else {
            // println!("   -updating first param (arrow)");
            // update first param
            update_first_param(&mut params[0])
        }
    };

    match params {
        FunctionParams::Param(params) => update_params(params),
        FunctionParams::Pat(params) => update_pat_params(params),
    }
}
