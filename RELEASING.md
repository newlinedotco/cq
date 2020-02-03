## Releasing Core

1. Run lerna to bump and publish on npm

```shell
npm login # if you aren't already logged in
lerna publish --git-remote github
```

This will automatically: 

- bump the versions
- git commit and push the tags
- push to npm

## Releasing a Canary

```shell
lerna publish --canary --preid treesitter --dist-tag treesitter --git-remote github --force-publish
```
