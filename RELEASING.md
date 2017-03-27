1. Update the `lerna.json` with the new version. We follow SemVer:

```
"version": "<major>.<minor>.<patch>",
```

2. Release on npm:

```
npm login # if you aren't already logged in
lerna publish
```

This will automatically: 

- bump the versions
- git commit and push the tags
- push to npm
