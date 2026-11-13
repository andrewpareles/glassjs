
// `FunctionExpr` - a fn that does not declare a variable.
// These fns don't declare a variable even if they're named, they're just a fn expression.
// the myFunction isnt a part of the FunctionExprs below, and it turns out functionExpr should never update component_name
// const myFunction = function() { ... }                   <-- myFunction (fn_name.is_none())
// const myFunction = function X() { ... }                 <-- myFunction (current_component_name is not yet set here)
// const myFunction = forwardRef(function X() { ... })     <-- myFunction (self.in_foward_ref)
// export (default) function X() { ... }                   <-- X
// function X() { ... }                                    <-- X <-- THIS IS A FUNCTIONDECL!!
