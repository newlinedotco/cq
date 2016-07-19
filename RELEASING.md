1. Update the `package.json` with the new version. We follow SemVer:

```
"version": "<major>.<minor>.<patch>",
```

2. Make a commit with this version bump:

```
git commit -m 'Release 3.0.0'
```

3. Tag it:

```
git tag -a v3.0.0 -m 'Release 3.0.0'
```

4. Push the commit:

```
git push origin master
```

5. Push the tag:

```
git push origin v3.0.0
```

6. Release on npm:

```
npm login # if you aren't already logged in
npm publish
```
