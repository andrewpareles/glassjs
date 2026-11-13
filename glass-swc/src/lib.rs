// https://claude.ai/chat/45ea8535-b44c-4f0f-a2e0-48e9b2a0c202

// #![allow(clippy::not_unsafe_ptr_arg_deref)]
// #![feature(box_patterns)]

// https://github.com/swc-project/plugins/pull/282
// TODO allow for components that are classes? (or just don't.... outdated anyway)

mod mut_fn_params_and_get_expr_for_access;
use mut_fn_params_and_get_expr_for_access::*;

use swc_ecma_utils::quote_ident;
// use serde_json::json;

use std::{collections::HashSet, panic};

use swc_common::{SourceMapper, DUMMY_SP};
use swc_core::{
    ecma::ast::Program,
    plugin::{metadata::TransformPluginMetadataContextKind, plugin_transform, proxies::TransformPluginProgramMetadata},
};
use swc_ecma_ast::*;
use swc_ecma_visit::{noop_visit_mut_type, VisitMut, VisitMutWith as EcmaVisitMutWith};

struct JsxSrc {
    cm: Box<dyn SourceMapper>, // the source map
    file_name: String,         // the string of the current file path

    current_component_path: Vec<String>, // A/B/C

    foreign_imports: HashSet<String>, // set of all the names of things imported from node_modules or a foreign place (the user doesn't own this code)

    __data_glass_caller_info_expr__: Option<Expr>,
    __data_glass_caller_key_expr__: Option<Expr>,
    __data_glass_caller_in_component_expr__: Option<Expr>,
}

fn expr_of_string(s: String) -> Expr {
    Expr::Lit(Lit::Str(Str {
        span: DUMMY_SP,
        value: s.into(),
        raw: None,
    }))
}
fn expr_of_number(n: f64) -> Expr {
    Expr::Lit(Lit::Num(Number {
        span: DUMMY_SP,
        value: n as f64,
        raw: None,
    }))
}

fn prop_of(key: &str, val: Expr) -> PropOrSpread {
    PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp {
        key: PropName::Str(Str {
            span: DUMMY_SP,
            value: key.into(),
            raw: None,
        }),
        value: Box::new(val),
    })))
}

fn attr_of_expr(attribute_name: &str, value: Expr) -> JSXAttr {
    JSXAttr {
        span: DUMMY_SP,
        name: JSXAttrName::Ident(quote_ident!(attribute_name)),
        value: Some(JSXAttrValue::JSXExprContainer(JSXExprContainer {
            expr: JSXExpr::Expr(Box::new(value)),
            span: DUMMY_SP,
        })),
    }
}

fn get_member_name(m: &JSXMemberExpr) -> String {
    match &m.obj {
        JSXObject::Ident(ident) => ident.sym.to_string(),
        JSXObject::JSXMemberExpr(e) => get_member_name(e), // don't worry about nested member expressions for now
    }
}

// JSON.stringify(expr)
fn stringify_expr(expr: Expr) -> Expr {
    Expr::Call(CallExpr {
        span: DUMMY_SP,
        callee: Callee::Expr(Box::new(Expr::Ident(quote_ident!("JSON.stringify")))),
        args: vec![ExprOrSpread { spread: None, expr: Box::new(expr) }],
        type_args: None,
    })
}

fn is_component_of(tag_name: String) -> bool {
    tag_name.chars().next().map_or(false, |c| c.is_uppercase())
}

fn is_in_node_modules(file_name: &String) -> bool {
    return file_name.contains("node_modules");
}

impl VisitMut for JsxSrc {
    // each visit fn here is a hook, if it's not specified then the noop makes it just visit the children with x.visit_mut_with()
    noop_visit_mut_type!(); // implement all the other visits as noops

    // go thru imports, getting the names of all the foreign imports
    fn visit_mut_import_decl(&mut self, n: &mut ImportDecl) {
        let from_str = n.src.value.to_string();

        // if external
        if !(from_str.starts_with('.') || from_str.starts_with('/') || from_str.starts_with("@/")) {
            for specifier in &n.specifiers {
                match specifier {
                    ImportSpecifier::Named(named) => {
                        // This handles both `import {X}` and `import {B as C}`
                        self.foreign_imports.insert(named.local.sym.to_string());
                    }
                    ImportSpecifier::Default(default) => {
                        // This handles `import X` and `import X as Y`
                        self.foreign_imports.insert(default.local.sym.to_string());
                    }
                    ImportSpecifier::Namespace(namespace) => {
                        // This handles `import * as X`
                        self.foreign_imports.insert(namespace.local.sym.to_string());
                    }
                }
            }
        }
        n.visit_mut_children_with(self);
    }

    // ###################################
    // ######### `VarDeclarator` #########
    // ###################################
    // capture the variable name for anonymous assignment, like let X = () => {...} in `ArrowExpr`
    fn visit_mut_var_declarator(&mut self, n: &mut VarDeclarator) {
        // set component_name = the variable name if the right hand side matches one of 2 things
        let (var_name, fn_params) = match (&n.name, &mut n.init) {
            (Pat::Ident(ref ident), Some(init)) => {
                let var_name = ident.sym.to_string();

                match &mut **init {
                    // function() {...}
                    Expr::Fn(f) => (Some(var_name), Some(FunctionParams::Param(&mut f.function.params))),

                    // () => {...}
                    Expr::Arrow(a) => (Some(var_name), Some(FunctionParams::Pat(&mut a.params))),

                    // forwardRef(...) | React.forwardRef(...)
                    Expr::Call(CallExpr {
                        callee: Callee::Expr(callee_expr),
                        args,
                        ..
                    }) => match &mut **callee_expr {
                        // if the callee is named forwardRef
                        Expr::Ident(ident) | Expr::Member(MemberExpr { prop: MemberProp::Ident(ident), .. }) if ident.sym == "forwardRef" => {
                            // the first arg should be a function
                            let arg0 = args.get_mut(0);
                            if let Some(ExprOrSpread { spread: _, expr, .. }) = arg0 {
                                match &mut **expr {
                                    // function() {...}
                                    Expr::Fn(f) => (Some(var_name), Some(FunctionParams::Param(&mut f.function.params))),

                                    // () => {...}
                                    Expr::Arrow(a) => (Some(var_name), Some(FunctionParams::Pat(&mut a.params))),

                                    _ => (None, None),
                                }
                            } else {
                                (None, None)
                            }
                        }
                        _ => (None, None),
                    },
                    _ => (None, None),
                }
            }
            _ => (None, None),
        };

        if var_name.is_none() {
            n.visit_mut_children_with(self);
            return;
        }

        // treat this like a component and update it
        let pa = self.__data_glass_caller_info_expr__.clone();
        let pk = self.__data_glass_caller_key_expr__.clone();
        let pc = self.__data_glass_caller_in_component_expr__.clone();

        // set component name
        if let Some(var_name) = var_name {
            self.current_component_path.push(var_name);
        }
        if let Some(mut params) = fn_params {
            // add caller-info, caller-key, and caller-in-component
            self.__data_glass_caller_info_expr__ = mut_function_params_and_get_expr_for_access(&mut params, "data-__glass_caller_info__", "__glass_caller_info__");
            self.__data_glass_caller_key_expr__ = mut_function_params_and_get_expr_for_access(&mut params, "data-__glass_caller_key__", "__glass_caller_key__");
            self.__data_glass_caller_in_component_expr__ = mut_function_params_and_get_expr_for_access(&mut params, "data-__glass_caller_in_component__", "__glass_caller_in_component__");
        }

        n.visit_mut_children_with(self);

        self.current_component_path.pop(); // reset on exit
        self.__data_glass_caller_info_expr__ = pa; // reset on exit
        self.__data_glass_caller_key_expr__ = pk; // reset on exit
        self.__data_glass_caller_in_component_expr__ = pc; // reset on exit
    }

    // ##################################
    // ######### `FunctionDecl` #########
    // ##################################
    // function X() { ... }
    // export function Y() { ... }
    // NOT export default function X() { ... }
    fn visit_mut_fn_decl(&mut self, f: &mut FnDecl) {
        let fn_name = f.ident.sym.to_string();

        let pa = self.__data_glass_caller_info_expr__.clone();
        let pk = self.__data_glass_caller_key_expr__.clone();
        let pc = self.__data_glass_caller_in_component_expr__.clone();

        // set component name
        self.current_component_path.push(fn_name);

        // add caller-info, caller-key, and caller-in-component
        let mut params = FunctionParams::Param(&mut f.function.params);
        self.__data_glass_caller_info_expr__ = mut_function_params_and_get_expr_for_access(&mut params, "data-__glass_caller_info__", "__glass_caller_info__");
        self.__data_glass_caller_key_expr__ = mut_function_params_and_get_expr_for_access(&mut params, "data-__glass_caller_key__", "__glass_caller_key__");
        self.__data_glass_caller_in_component_expr__ = mut_function_params_and_get_expr_for_access(&mut params, "data-__glass_caller_in_component__", "__glass_caller_in_component__");

        f.visit_mut_children_with(self);

        self.current_component_path.pop(); // reset on exit
        self.__data_glass_caller_info_expr__ = pa; // reset on exit
        self.__data_glass_caller_key_expr__ = pk; // reset on exit
        self.__data_glass_caller_in_component_expr__ = pc; // reset on exit
    }

    // #################################
    // ######### `DefaultDecl` #########
    // #################################
    // export default function X() { ... }
    fn visit_mut_export_default_decl(&mut self, n: &mut ExportDefaultDecl) {
        let (fn_name, fn_params) = match &mut n.decl {
            DefaultDecl::Fn(f) => {
                if let Some(ident) = &f.ident {
                    (Some(ident.sym.to_string()), Some(FunctionParams::Param(&mut f.function.params)))
                } else {
                    (None, None)
                }
            }
            _ => {
                n.visit_mut_children_with(self);
                return;
            }
        };
        // treat this like a component and update it
        let pa = self.__data_glass_caller_info_expr__.clone();
        let pk = self.__data_glass_caller_key_expr__.clone();
        let pc = self.__data_glass_caller_in_component_expr__.clone();

        // set component name
        if let Some(fn_name) = fn_name {
            self.current_component_path.push(fn_name);
        }
        if let Some(mut params) = fn_params {
            // add caller-info, caller-key, and caller-in-component
            self.__data_glass_caller_info_expr__ = mut_function_params_and_get_expr_for_access(&mut params, "data-__glass_caller_info__", "__glass_caller_info__");
            self.__data_glass_caller_key_expr__ = mut_function_params_and_get_expr_for_access(&mut params, "data-__glass_caller_key__", "__glass_caller_key__");
            self.__data_glass_caller_in_component_expr__ = mut_function_params_and_get_expr_for_access(&mut params, "data-__glass_caller_in_component__", "__glass_caller_in_component__");
        }

        n.visit_mut_children_with(self);

        self.current_component_path.pop(); // reset on exit
        self.__data_glass_caller_info_expr__ = pa; // reset on exit
        self.__data_glass_caller_key_expr__ = pk; // reset on exit
        self.__data_glass_caller_in_component_expr__ = pc; // reset on exit
    }

    // ################################
    // ######### `JSXElement` #########
    // ################################
    // <div>, <MyComponent>, etc
    // visit jsx elements, adding attribs
    fn visit_mut_jsx_element(&mut self, e: &mut JSXElement) {
        let (member_name, tag_name) = match &e.opening.name {
            // member_name = the first thing in A.B.C, tag_name = the last thing
            JSXElementName::Ident(i) => (None, &i.sym),
            JSXElementName::JSXMemberExpr(i) => (Some(get_member_name(&i)), &i.prop.sym),
            JSXElementName::JSXNamespacedName(i) => (None, &i.name.sym), // not used by React, just here for safety
        };

        // Don't add any attribs to React.Fragment (actual fragments like <></> are treated separately from jsx_elements so we don't need to check them, but we do need to check React.Fragment and Fragment if it's imported from React)
        if tag_name == "Fragment" {
            e.visit_mut_children_with(self);
            return;
        }

        // sourcemap location
        let lo_loc = self.cm.lookup_char_pos(e.span.lo);
        let hi_loc = self.cm.lookup_char_pos(e.span.hi);
        let file_name = self.file_name.clone(); // lo_loc.file.name.to_string();

        let is_component = is_component_of(tag_name.to_string()); // first letter of tag name is capitalized

        // look at imports and see if the varname equals an import
        let is_foreign_component = if let Some(member_name) = member_name {
            self.foreign_imports.contains(&member_name) // <A.B /> check imports against A
        } else {
            self.foreign_imports.contains(&tag_name.to_string()) // <A /> check imports against A
        };

        let mut stmts = Vec::new();

        // <div> and <Box> (foreign cPT like Mantine) get every relevant attribute set to their HTML element
        if !is_component || is_foreign_component {
            // __data_glass_caller_info__: use the var that was passed to this component
            if let Some(expr) = &self.__data_glass_caller_info_expr__ {
                stmts.push(("data-__glass_caller_info__", expr.clone()));
            }
            //data-__glass_caller_key__: use the var that was passed to this component
            if let Some(expr) = &self.__data_glass_caller_key_expr__ {
                stmts.push(("data-__glass_caller_key__", expr.clone()));
            }
            if let Some(expr) = &self.__data_glass_caller_in_component_expr__ {
                stmts.push(("data-__glass_caller_in_component__", expr.clone()));
            }

            // glass_info: set based on file_name and locs
            stmts.push((
                "data-glass_info",
                stringify_expr(Expr::Object(ObjectLit {
                    span: DUMMY_SP,
                    props: vec![
                        prop_of("start_line", expr_of_number(lo_loc.line as f64)),
                        prop_of("end_line", expr_of_number(hi_loc.line as f64)),
                        prop_of("start_col", expr_of_number(lo_loc.col.0 as f64)),
                        prop_of("end_col", expr_of_number(hi_loc.col.0 as f64)),
                        prop_of("file_name", expr_of_string(file_name)),
                    ],
                })),
            ));

            // data-glass_in_component: the path of components down to this element
            let component_path = self.current_component_path.join("/");
            if !component_path.is_empty() {
                stmts.push(("data-glass_in_component", expr_of_string(component_path.clone().into())));
            }

            // set the attributes
            for st in stmts {
                e.opening.attrs.push(JSXAttrOrSpread::JSXAttr(attr_of_expr(st.0, st.1)));
            }
        }
        // <MyComponent>
        // pass in __data_glass_caller_info__ and data-__glass_caller_key__ to be used by the children of the instance
        else {
            // __data_glass_caller_info__: pass in the current info to the component as caller-info
            stmts.push((
                "data-__glass_caller_info__",
                stringify_expr(Expr::Object(ObjectLit {
                    span: DUMMY_SP,
                    props: vec![
                        prop_of("start_line", expr_of_number(lo_loc.line as f64)),
                        prop_of("end_line", expr_of_number(hi_loc.line as f64)),
                        prop_of("start_col", expr_of_number(lo_loc.col.0 as f64)),
                        prop_of("end_col", expr_of_number(hi_loc.col.0 as f64)),
                        prop_of("file_name", expr_of_string(file_name)),
                    ],
                })),
            ));

            // data-__glass_caller_key__: pass in the current key (computed below, if it exists) to the component
            for attr_or_spread in &e.opening.attrs {
                match attr_or_spread {
                    JSXAttrOrSpread::JSXAttr(JSXAttr {
                        name: JSXAttrName::Ident(ident),
                        value: Some(attr_val),
                        ..
                    }) if ident.sym == "key" => {
                        match attr_val {
                            JSXAttrValue::Lit(lit) => {
                                stmts.push(("data-__glass_caller_key__", Expr::Lit(lit.clone())));
                                break;
                            }
                            // TODO for JSXExpr, eventually we want to not recompute the expr twice bc the user might have key={generator.next()} or something, for now we assume key is pure
                            JSXAttrValue::JSXExprContainer(JSXExprContainer { expr: JSXExpr::Expr(ref e), .. }) => {
                                stmts.push(("data-__glass_caller_key__", *e.clone()));
                                break;
                            }
                            _ => {}
                        };
                    }
                    _ => (),
                }
            }

            // data-__glass_caller_in_component__: pass in the current component path to the component
            let component_path = self.current_component_path.join("/");
            if !component_path.is_empty() {
                stmts.push(("data-__glass_caller_in_component__", expr_of_string(component_path.clone().into())));
            }

            // add each statement to the JSX expression, passing it to its children divs
            for st in stmts {
                e.opening.attrs.push(JSXAttrOrSpread::JSXAttr(attr_of_expr(st.0, st.1)));
            }
        }

        // visit children
        e.visit_mut_children_with(self);
    }
}

fn swc_debug_jsx_plugin(mut program: Program, data: TransformPluginProgramMetadata) -> Program {
    // read process.env.NODE_ENV
    let is_dev = match data.get_context(&TransformPluginMetadataContextKind::Env) {
        Some(env) => env == "development",
        None => false,
    };

    // return early if not dev mode (swc should only run in dev mode)
    if !is_dev {
        return program;
    }

    // return early if in node_modules
    let file_name = data.get_context(&TransformPluginMetadataContextKind::Filename).unwrap_or_default();
    if is_in_node_modules(&file_name) {
        return program;
    }

    // get sourcemap
    let cm = data.source_map;

    let init_self = &mut JsxSrc {
        cm: Box::new(cm),
        file_name: file_name.clone(),
        current_component_path: Vec::new(),
        foreign_imports: HashSet::new(),
        __data_glass_caller_info_expr__: None,
        __data_glass_caller_key_expr__: None,
        __data_glass_caller_in_component_expr__: None,
    };
    program.visit_mut_with(init_self);

    program
}

// try-catched plugin
#[plugin_transform]
fn swc_glass(program: Program, data: TransformPluginProgramMetadata) -> Program {
    let result = panic::catch_unwind(|| swc_debug_jsx_plugin(program, data));

    match result {
        Ok(r) => r,
        Err(e) => {
            println!("Glass SWC plugin encountered an error: {:?}", e);
            panic!("Glass SWC plugin failed");
        }
    }
}
