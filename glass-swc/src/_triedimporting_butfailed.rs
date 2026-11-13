
// // changes return X -> return <><GlassReactComponent/>{X}</>
// fn wrap_return_statement(body: &mut Option<BlockStmt>) {
//     // unwrap
//     if let Some(block) = body {
//         for stmt in &mut block.stmts {
//             // stmt is the return val (eg the X in return X)
//             if let Stmt::Return(ReturnStmt { arg: Some(expr), .. }) = stmt {
//                 let wrapped_expr = Box::new(Expr::JSXElement(Box::new(JSXElement {
//                     span: DUMMY_SP,
//                     opening: JSXOpeningElement {
//                         name: JSXElementName::Ident(quote_ident!("")),
//                         attrs: vec![],
//                         self_closing: false,
//                         type_args: None,
//                         span: DUMMY_SP,
//                     },
//                     closing: Some(JSXClosingElement {
//                         name: JSXElementName::Ident(quote_ident!("")),
//                         span: DUMMY_SP,
//                     }),
//                     children: vec![
//                         JSXElementChild::JSXElement(Box::new(JSXElement {
//                             span: DUMMY_SP,
//                             opening: JSXOpeningElement {
//                                 name: JSXElementName::Ident(quote_ident!("GlassReactComponent")),
//                                 attrs: vec![],
//                                 self_closing: true,
//                                 type_args: None,
//                                 span: DUMMY_SP,
//                             },
//                             closing: None,
//                             children: vec![],
//                         })),
//                         JSXElementChild::JSXExprContainer(JSXExprContainer {
//                             expr: JSXExpr::Expr(expr.clone()),
//                             span: DUMMY_SP,
//                         }),
//                     ],
//                 })));

//                 // set the return value to <><GlassReactComponent/>{old_children}</>
//                 *expr = wrapped_expr;
//             }
//         }
//     }
// }



//     // this fn visits imports of _app.ts or layout.ts, doing two things:
//     // 1. adding import GlassReactComponent from '@glassjs/react',
//     // 2. adding <GlassReactComponent/> to the default export
//     fn visit_mut_module(&mut self, module: &mut Module) {
//         // only apply this to _app and layout

//         let file_path = self.cm.lookup_char_pos(module.span.lo).file.name.to_string();
//         let import_here = file_path.contains("pages/_app.") || file_path.contains("app/layout.") || file_path.contains("pages\\_app.") || file_path.contains("app\\layout.");
//         if !import_here {
//             return;
//         }
//         // 1. Create the import declaration
//         let import_decl = ModuleItem::ModuleDecl(ModuleDecl::Import(ImportDecl {
//             span: DUMMY_SP,
//             specifiers: vec![ImportSpecifier::Default(ImportDefaultSpecifier {
//                 span: DUMMY_SP,
//                 local: quote_ident!("GlassReactComponent"),
//             })],
//             src: Box::new(Str {
//                 span: DUMMY_SP,
//                 value: "@glassjs/react".into(),
//                 raw: None,
//             }),
//             type_only: false,
//             // asserts: None,
//             with: None,
//             phase: ImportPhase::Evaluation,
//         }));

//         // Check if the first item is "use client", in which case add import to line 1, else line 0
//         let insert_index = if let Some(ModuleItem::Stmt(Stmt::Expr(ExprStmt { expr, .. }))) = module.body.first() {
//             if let Expr::Lit(Lit::Str(str)) = &**expr {
//                 if str.value == "use client" {
//                     1 // Insert after "use client"
//                 } else {
//                     0 // Insert at the beginning
//                 }
//             } else {
//                 0 // Insert at the beginning
//             }
//         } else {
//             0 // Insert at the beginning if the first item is not a statement
//         };

//         module.body.insert(insert_index, import_decl);

//         // 2. add <GlassReactComponent/> to the default export's return statement
//         // find default export and run wrap_return_statement on it
//         for item in &mut module.body {
//             match item {
//                 ModuleItem::ModuleDecl(ModuleDecl::ExportDefaultDecl(export)) => {
//                     if let DefaultDecl::Fn(fn_expr) = &mut export.decl {
//                         wrap_return_statement(&mut fn_expr.function.body);
//                     }
//                 }
//                 ModuleItem::ModuleDecl(ModuleDecl::ExportDefaultExpr(export)) => {
//                     if let Expr::Fn(fn_expr) = &mut *export.expr {
//                         wrap_return_statement(&mut fn_expr.function.body);
//                     }
//                 }
//                 _ => {}
//             }
//         }
//     }
