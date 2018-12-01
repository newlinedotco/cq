1. Run lerna to bump and publish on npm

```
npm login # if you aren't already logged in
lerna publish --git-remote github
```

This will automatically: 

- bump the versions
- git commit and push the tags
- push to npm
