This README is for developers of glass (not normal users of it). Get in touch if you have any questions! andrew@useglass.ai.

## publishing the package

1. increment package.json's version number FIRST!!

To build the .wasm file, run these two commands (or `npm run build`): 
2. run `cargo build --target wasm32-wasi --release` - this generates the .wasm file using Rust
3. run `cp ./target/wasm32-wasi/release/glass_swc.wasm .` - this copies the wasm file to the root where package.json expects it

To publish the package to npm (the entry point of the package is the .wasm file), do this:
4. run `npm publish --access public`


## updating and versions

The @swc/core npm package used in the user's frontend needs to be compatible with the .wasm file generated here. 


There's something to do with making versions of @swc/core (npm, package.json) match versions of `swc_core` (cargo, Cargo.toml), [here](https://swc.rs/docs/plugin/selecting-swc-core), but it seems fine to use the latest version of swc_core (and I'm not sure if @swc/core is even used at all anywhere).

Just a helpful note, run `npm show @swc/core version` and `cargo search swc_core` to get the latest versions.

## versioning notes

^1.6.2 means 1.6.2 thru (excluding) 2.0.0

~1.6.2 means 1.6.2 thru (excluding) 1.7.0

1.6.x means 1.6.0 thru (excluding) 1.7.0

