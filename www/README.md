This README is very old and outdated:

## Glass design decisions

## Design example

file1.tsx
```tsx
import { B, C } from 'file2'

const A = () => {
    return <div>
        <div>
            <B />
            <C />
        </div>
    </div>
}
```


file2.tsx
```tsx
import { D } from 'file3'

const B = () => {
    return <div>
        <D />
    </div>
}

const C = () => {
    return <div>

    </div>
}
```


## Design decisions

- Files are just metadata - all files could be combined into 1 big file, it would make no difference
    - can just feed GPT all the relevant files with unique line identifiers for each
    - assuming it all fits in context window, not sure there's a good alternative

- GPT output is slow/expensive
    - feed it line numbers like `1:`, `2:` at the beginning of each line
    - make it output the *changes*, not re-write the whole new file
    - for each file, output `string of 55: new, 56: new, 101: new, 102: new, ...`
    - but what about if it adds/deletes lines????
    - have it output a JSON of "here are the line numbers, here's the new code that goes there"
  
- changes should only happen to the user's own file system
    - e.g. `import @mantine/core/Box` and then `<Box />` shouldn't pass the node_module file, this import should be ignored 

