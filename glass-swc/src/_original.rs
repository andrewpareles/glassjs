// #![allow(clippy::not_unsafe_ptr_arg_deref)]
// #![feature(box_patterns)]

// https://github.com/swc-project/plugins/pull/282

use swc_core::{
    ecma::{ast::Program, visit::VisitMutWith},
    plugin::{plugin_transform, proxies::TransformPluginProgramMetadata},
};

use swc_common::{SourceMapper, DUMMY_SP};
use swc_ecma_ast::*;
use swc_ecma_utils::quote_ident;
use swc_ecma_visit::{noop_visit_mut_type, VisitMut};

struct JsxSrc {
    cm: Box<dyn SourceMapper>,
}

impl VisitMut for JsxSrc {
    noop_visit_mut_type!(); // implement all the other visits as noops

    fn visit_mut_jsx_element(&mut self, e: &mut JSXElement) {
        if e.span == DUMMY_SP {
            return;
        }

        // sourcemap location
        let lo_loc = self.cm.lookup_char_pos(e.span.lo);
        let hi_loc = self.cm.lookup_char_pos(e.span.hi);
        let file_name = lo_loc.file.name.to_string();

        let glass_info_value = format!(
            r#""{{"start":{{"line":{},"column":{}}},"end":{{"line":{},"column":{}}},"filename":"{}"}}""#,
            lo_loc.line, lo_loc.col.0, hi_loc.line, hi_loc.col.0, file_name
        );

        let new_attr = JSXAttr {
            name: JSXAttrName::Ident(quote_ident!("data-glass-info")),
            value: Some(JSXAttrValue::Lit(glass_info_value.into())),
            span: DUMMY_SP,
        };

        e.opening.attrs.push(JSXAttrOrSpread::JSXAttr(new_attr));

        e.visit_mut_children_with(self);
    }
}

#[plugin_transform]
fn swc_debug_jsx_plugin(mut program: Program, data: TransformPluginProgramMetadata) -> Program {
    let cm = data.source_map;

    program.visit_mut_with(&mut JsxSrc { cm: Box::new(cm) });

    program
}
