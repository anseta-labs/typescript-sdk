# Releasing

Publishing is automated, but cutting a release is deliberate: nothing publishes
until a version tag is pushed by hand.

## Cutting a release

```bash
node scripts/changelog.mjs release 0.2.0   # renames Unreleased, dates it
pnpm pkg set version=0.2.0
git commit -am "chore: release 0.2.0"
git push

git tag v0.2.0
git push origin v0.2.0          # this is what triggers publishing
```

Most of the Unreleased section writes itself: the regeneration workflow appends
what changed in the spec, grouped under Added, Changed and Removed. Add
anything it cannot see (a Node version floor, a fix in `scripts/`) by hand
before releasing. `changelog.mjs release` refuses to run on an empty section,
and the release workflow refuses to publish a version the CHANGELOG does not
describe.

Order matters. The tag points at a commit, and the commit it points at must
already contain the new version, because that is the tree CI checks out and
builds. Tagging before the bump gets caught by the first guard below.

`git push` does not push tags. The second push is not optional.

## What happens next

`.github/workflows/release.yml` subscribes to `push` on tags matching `v*`. On a
matching tag it:

1. Checks the tag matches `package.json`'s version
2. Checks that version is not already on npm
3. Runs `typecheck`, `typecheck:examples`, `build`
4. Publishes to npm
5. Creates a GitHub Release, with notes taken from the CHANGELOG entry

Steps 1 to 3 are ordered so that everything cheap and reversible happens before
step 4. Publishing is a one-way door: a version that reaches npm can never be
replaced, and unpublishing burns the number permanently rather than freeing it.

## Version numbers

The version describes **this package's TypeScript surface**, not the API's. They
move for different reasons: regenerating from a changed spec, bumping the
generator, raising the Node floor, or fixing something in `scripts/`.

The regeneration workflow reports whether a spec change removes operations,
schemas or enum values, or adds a required parameter. Any of those break code
written against the previous release and call for a major bump. New operations
or schemas are a minor. Everything else is a patch.

## Authentication

There is no npm token. Publishing uses npm Trusted Publishing: the job asks
GitHub for a short-lived signed token describing which repository, workflow and
ref it is running as, and npm checks those claims against the trusted publisher
configured on the package. Nothing is stored, so there is nothing to rotate or
leak.

Two things this depends on, both easy to break:

- `permissions: id-token: write` in the workflow. Without it the job cannot
  request a token at all.
- The workflow filename registered on npm must match the file that runs. It is
  currently `release.yml`. Renaming the file without updating the npm
  configuration makes publishing fail with a mismatch.

## When a guard fails

**`tag v0.2.0 does not match package.json version 0.1.0`** — the tag was created
before the version bump, or on the wrong commit. Delete the tag locally and on
the remote, fix the version, and tag again.

**`@anseta/typescript-sdk@0.2.0 is already published`** — that version exists.
Pick the next one. This check exists so the failure arrives before the build
rather than as a registry rejection after it.

**typecheck or build fails** — nothing was published. `typecheck:examples` is the
one that usually catches real problems, because the examples call real method
names, so a rename in regenerated code fails there.

## Relationship to regeneration

`regenerate.yml` opens a pull request when the deployed spec changes. It does not
publish and does not touch the version. Merging one of those pull requests
changes `src/` on `main` and nothing more. Releasing is always the separate,
manual act above.
