# constructs-3d-viewer

A static Three.js page that puts product cards into a dark 3D "void". Click a product in the list and it appears as a card (posters as slim frames, everything else as a slim box); drag it across the floor, scroll over it to resize it, orbit the camera, and save the arrangement as a PNG. No build step, no framework, no server code: `three` r170 is vendored in `vendor/`, the cards are drawn on a 2D canvas from your title and price (no invented artwork), and everything runs in the browser.

Live demo: https://megastretch23.github.io/constructs-3d-viewer/

## Quickstart

```
git clone https://github.com/MegaStretch23/constructs-3d-viewer
cd constructs-3d-viewer
python3 -m http.server 8080        # any static file server works; ES modules need http, not file://
# open http://localhost:8080
```

- **Click** a list entry to spawn it (the golden-angle spiral keeps repeats from overlapping).
- **Drag** a card to move it on the floor; drag empty space to orbit; **wheel over a card** to resize it (0.4x to 2.5x); **Delete** removes the selected card.
- **Save PNG** downloads the current view. **Clear** empties the void.
- **Load catalogue** reads your own JSON file in the browser (nothing is uploaded): `{"products": [{"id": "a1", "title": "My product", "price": 12, "kind": "poster|box"}]}`. `id`, `title` and a numeric `price` are required.

`npm test` (or `node test/spawn.test.mjs`) runs the placement and card-wrapping tests with plain Node, no dependencies.

## What is in the sample catalogue

`data/catalog.json` holds 28 real Etsy listings (14 posters, 14 boxed digital products) with the title, price and link as they were on 2026-11-13. Prices are a snapshot, not live. It is only sample data for the viewer; replace it with your own.

## Layout

| file | what |
|---|---|
| `index.html`, `style.css` | page and side panel |
| `js/main.js` | scene, picking, dragging, resize, PNG export |
| `js/spawn.js` | pure placement / clamp logic (tested) |
| `js/cards.js` | title + price card texture, line wrapping (tested) |
| `vendor/` | `three.module.min.js` and `OrbitControls.js` from three r170 (MIT, licence included) |

## Limits

- Cards show the title and price only; there is no product-image loading.
- Tested in headless Chromium (software WebGL): five cards spawned, no console errors. Not tested on touch devices or Safari.
- The PNG export includes the 3D view only, not the side panel.

## Other tools

I also run hosted data tools on Apify, for example the pay-per-event [SEC Form 4 insider cluster scanner](https://apify.com/johnveds15/sec-form4-insider-clusters). They do something different from this viewer; there is no paid version of constructs-3d-viewer.

MIT licensed.
