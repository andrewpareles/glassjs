## Setup

If you're using Nextjs, disregard glass-babel (this project) and use glass_swc instead.


In order for glass to work, you need to add add the plugin `glass-babel.` to your babel config. If you're using Nextjs simply add a `.babelrc` file in the main folder (add `.babelrc` in the same place as `next.config.js`, etc):

```
# .babelrc
{
    "presets": ["next/babel"],
    "plugins": ["./app/glass-babel"] # this should be the path to glass-babel.js, without the .js at the end
} 
```

