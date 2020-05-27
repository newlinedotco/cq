# cq-treesitter-engine

Provides tree-sitter parsing capabilities to cq.

## Status

Beta. See TODOs

## TODOs

- Get comments selection working - see `commentRange`
- Tree-sitter requires Node 10, so that's inconvenient 

## Guide to Debugging

Often you'll find that if you aren't picking up the tokens you want, you probably have a missing type in `findNodesWithIdentifier`.

Also, hop into `cq/src/index.js` and look for `matchingNodes` to see what's matching. (Search for `KEY`)

Check if your token needs to be added.