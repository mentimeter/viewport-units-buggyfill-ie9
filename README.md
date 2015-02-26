# Viewport units buggyfill for IE9

IE9 only buggyfill for viewport units. It based on [Viewport Units Buggyfill](https://github.com/rodneyrehm/viewport-units-buggyfill) but removes everything not needed for IE9. In particular IE9 does not need cross origin stylesheets to be downloaded, so let's skip that. Hacks are also removed for now.

# Credits

Much cred to @rodneyrehm for creating the more general [Viewport Units Buggyfill](https://github.com/rodneyrehm/viewport-units-buggyfill).
