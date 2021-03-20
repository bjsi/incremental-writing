## Obsidian Plugin Template

This templates includes a barebone directory structure for an Obsidian Plugin. Bundling is based on [Rollup.js](https://rollupjs.org/).

**NOTE:** This is not the official template. You can find [the official sample plugin here](https://github.com/obsidianmd/obsidian-sample-plugin). This is a plugin template I customized with a nicer (for me) directory structure and some additional tool (like featuring automatic releases with Github's Actions).

## How to use it

You can click on the "Use this template" button above.

### Enable Github's Actions

After you created a new repository, remember to rename the `RENAME.github` to `.github` to enable the GitHub's Actions. Then go in `.github/workflows/release.yml` and change `PLUGIN_NAME` on line 10.

## How to compile the plugin

First, install the dependencies with

```bash
npm i
```

Then, you can compile the plugin with:

```bash
npm run build
```

This will create a `main.js` file in the project root. That is the entry point of your plugin.
