// OUTDATED!!!

use swc_common::DUMMY_SP;
use swc_ecma_ast::*;
use swc_ecma_utils::quote_ident;

/*
ref={(r) => {
        if (typeof r === 'object' && r !== null) {
            r["attr1"] = expr1;
            r["attr2"] = expr2;
            ...
        }

        let old_expr = expr; // THE ORIGINAL EXPRESSION
        if (typeof old_expr === 'function')
            old_expr(r);
        else if (typeof old_expr === 'object' && old_expr !== null)
            old_expr.current = r;
    }
}
*/

// written by GPT

pub fn mut_ref_attrib(e: &mut JSXElement, stmts: Vec<(&str, Expr)>) {
    let ref_attr = e.opening.attrs.iter_mut().find_map(|attr| {
        if let JSXAttrOrSpread::JSXAttr(jsx_attr) = attr {
            match &jsx_attr.name {
                JSXAttrName::Ident(ident) if ident.sym == *"ref" => Some(jsx_attr),
                _ => None,
            }
        } else {
            None
        }
    });

    // if the element has ref={...}, update the value
    if let Some(ref_attr) = ref_attr {
        if let Some(JSXAttrValue::JSXExprContainer(JSXExprContainer { expr: JSXExpr::Expr(old_expr), .. })) = &ref_attr.value {
            let new_expr = create_new_ref_expr(old_expr, stmts);
            ref_attr.value = Some(JSXAttrValue::JSXExprContainer(JSXExprContainer {
                span: DUMMY_SP,
                expr: JSXExpr::Expr(Box::new(new_expr)),
            }));
        }
    }
    // add ref={...}
    else {
        let window_check = Expr::Bin(BinExpr {
            span: DUMMY_SP,
            op: BinaryOp::NotEqEq,
            left: Box::new(Expr::Unary(UnaryExpr {
                span: DUMMY_SP,
                op: UnaryOp::TypeOf,
                arg: Box::new(Expr::Ident(Ident::new("window".into(), DUMMY_SP))),
            })),
            right: Box::new(Expr::Lit(Lit::Str(Str {
                span: DUMMY_SP,
                value: "undefined".into(),
                raw: None,
            }))),
        });

        let ref_function = create_new_ref_expr(
            &Expr::Ident(Ident {
                span: DUMMY_SP,
                sym: "undefined".into(),
                optional: false,
            }),
            stmts,
        );

        let conditional_ref = Expr::Cond(CondExpr {
            span: DUMMY_SP,
            test: Box::new(window_check),
            cons: Box::new(ref_function),
            alt: Box::new(Expr::Ident(Ident::new("undefined".into(), DUMMY_SP))),
        });

        e.opening.attrs.push(JSXAttrOrSpread::JSXAttr(JSXAttr {
            span: DUMMY_SP,
            name: JSXAttrName::Ident(quote_ident!("ref")),
            value: Some(JSXAttrValue::JSXExprContainer(JSXExprContainer {
                span: DUMMY_SP,
                expr: JSXExpr::Expr(Box::new(conditional_ref)),
            })),
        }))
    };
}

fn create_new_ref_expr(old_expr: &Expr, stmts: Vec<(&str, Expr)>) -> Expr {
    let param = Ident::new("r".into(), DUMMY_SP);

    let body_stmts = vec![
        Stmt::If(IfStmt {
            span: DUMMY_SP,
            test: Box::new(Expr::Bin(BinExpr {
                span: DUMMY_SP,
                op: BinaryOp::LogicalAnd,
                left: Box::new(Expr::Bin(BinExpr {
                    span: DUMMY_SP,
                    op: BinaryOp::EqEqEq,
                    left: Box::new(Expr::Unary(UnaryExpr {
                        span: DUMMY_SP,
                        op: UnaryOp::TypeOf,
                        arg: Box::new(Expr::Ident(param.clone())),
                    })),
                    right: Box::new(Expr::Lit(Lit::Str("object".into()))),
                })),
                right: Box::new(Expr::Bin(BinExpr {
                    span: DUMMY_SP,
                    op: BinaryOp::NotEqEq,
                    left: Box::new(Expr::Ident(param.clone())),
                    right: Box::new(Expr::Lit(Lit::Null(Null { span: DUMMY_SP }))),
                })),
            })),
            cons: Box::new(Stmt::Block(BlockStmt {
                span: DUMMY_SP,
                stmts: stmts
                    .iter()
                    .map(|(attr, expr)| {
                        Stmt::Expr(ExprStmt {
                            span: DUMMY_SP,
                            expr: Box::new(Expr::Assign(AssignExpr {
                                span: DUMMY_SP,
                                op: AssignOp::Assign,
                                left: AssignTarget::Simple(SimpleAssignTarget::Member(MemberExpr {
                                    span: DUMMY_SP,
                                    obj: Box::new(Expr::Ident(param.clone())),
                                    prop: MemberProp::Computed(ComputedPropName {
                                        span: DUMMY_SP,
                                        expr: Box::new(Expr::Lit(Lit::Str((*attr).into()))),
                                    }),
                                })),
                                right: Box::new((*expr).clone()),
                            })),
                        })
                    })
                    .collect(),
            })),
            alt: None,
        }),
        Stmt::Decl(Decl::Var(Box::new(VarDecl {
            span: DUMMY_SP,
            kind: VarDeclKind::Let,
            declare: false,
            decls: vec![VarDeclarator {
                span: DUMMY_SP,
                name: Pat::Ident(BindingIdent::from(Ident::new("old_expr".into(), DUMMY_SP))),
                init: Some(Box::new(old_expr.clone())),
                definite: false,
            }],
        }))),
        Stmt::If(IfStmt {
            span: DUMMY_SP,
            test: Box::new(Expr::Bin(BinExpr {
                span: DUMMY_SP,
                op: BinaryOp::EqEqEq,
                left: Box::new(Expr::Unary(UnaryExpr {
                    span: DUMMY_SP,
                    op: UnaryOp::TypeOf,
                    arg: Box::new(Expr::Ident(Ident::new("old_expr".into(), DUMMY_SP))),
                })),
                right: Box::new(Expr::Lit(Lit::Str("function".into()))),
            })),
            cons: Box::new(Stmt::Expr(ExprStmt {
                span: DUMMY_SP,
                expr: Box::new(Expr::Call(CallExpr {
                    span: DUMMY_SP,
                    callee: Callee::Expr(Box::new(Expr::Ident(Ident::new("old_expr".into(), DUMMY_SP)))),
                    args: vec![ExprOrSpread {
                        spread: None,
                        expr: Box::new(Expr::Ident(param.clone())),
                    }],
                    type_args: None,
                })),
            })),
            alt: Some(Box::new(Stmt::If(IfStmt {
                span: DUMMY_SP,
                test: Box::new(Expr::Bin(BinExpr {
                    span: DUMMY_SP,
                    op: BinaryOp::LogicalAnd,
                    left: Box::new(Expr::Bin(BinExpr {
                        span: DUMMY_SP,
                        op: BinaryOp::EqEqEq,
                        left: Box::new(Expr::Unary(UnaryExpr {
                            span: DUMMY_SP,
                            op: UnaryOp::TypeOf,
                            arg: Box::new(Expr::Ident(Ident::new("old_expr".into(), DUMMY_SP))),
                        })),
                        right: Box::new(Expr::Lit(Lit::Str("object".into()))),
                    })),
                    right: Box::new(Expr::Bin(BinExpr {
                        span: DUMMY_SP,
                        op: BinaryOp::NotEqEq,
                        left: Box::new(Expr::Ident(Ident::new("old_expr".into(), DUMMY_SP))),
                        right: Box::new(Expr::Lit(Lit::Null(Null { span: DUMMY_SP }))),
                    })),
                })),
                cons: Box::new(Stmt::Expr(ExprStmt {
                    span: DUMMY_SP,
                    expr: Box::new(Expr::Assign(AssignExpr {
                        span: DUMMY_SP,
                        op: AssignOp::Assign,
                        left: AssignTarget::Simple(SimpleAssignTarget::Member(MemberExpr {
                            span: DUMMY_SP,
                            obj: Box::new(Expr::Ident(Ident::new("old_expr".into(), DUMMY_SP))),
                            prop: MemberProp::Ident(Ident::new("current".into(), DUMMY_SP)),
                        })),
                        right: Box::new(Expr::Ident(param.clone())),
                    })),
                })),
                alt: None,
            }))),
        }),
    ];

    Expr::Arrow(ArrowExpr {
        span: DUMMY_SP,
        params: vec![Pat::Ident(BindingIdent::from(param.clone()))],
        body: Box::new(BlockStmtOrExpr::BlockStmt(BlockStmt { span: DUMMY_SP, stmts: body_stmts })),
        is_async: false,
        is_generator: false,
        return_type: None,
        type_params: None,
    })
}
