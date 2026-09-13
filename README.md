# Microcosmos

**A field guide to the invisible.** Explore microscopic life in an interactive 3D atlas.

[Explore Microcosmos](https://microcosmos.vercel.app)

## The collection

Meet nine microscopic organisms: a tardigrade, bdelloid rotifer, Daphnia, centric diatom, Micrasterias desmid, Euglena, Paramecium, Volvox and Stentor. Orbit each specimen, zoom into its structures, switch between color and microscope views, and compare representative real-world sizes.

- Nine curated specimens with ecology, movement, feeding, microscope tips and scientific reading.
- Interactive structure markers and independently rotatable comparison views.
- Searchable gallery and a visual identification quiz.
- Cinema view for distraction-free exploration and recording.
- Shareable specimen links, such as `?specimen=diatom`.
- Responsive interface, keyboard navigation, and accessible dialogs.
- Runs entirely in the browser; visitors need no account or API key.

## Run locally

Requires Node.js 22 or newer.

```sh
npm ci
npm run dev
```

```sh
npm run build
npm run preview
```

Deploy the resulting `dist/` directory to any static host. Vite's `base` option can be set for deployment under a subdirectory.

## Controls

Drag to orbit; scroll or use the zoom buttons to change magnification. Left/right arrows select the previous/next specimen. Escape closes dialogs or leaves cinema view. Each dialog traps keyboard focus and returns it to its trigger when closed.

## Add a specimen

1. Add an optimized GLB to `public/models/` and a reference thumbnail to `public/specimens/`.
2. Add its metadata, reading link, representative size, and approximate structure points to `src/data/specimens.ts`.
3. Check orientation and marker positions in the viewer. Models are centered and normalized to fit their viewport.
4. Document asset provenance and test the production build.

## Scientific context

These are AI-generated educational illustrations, not scans or research-grade reconstructions. Shapes, colors and details are simplified, and structure markers indicate approximate regions. Surface mode is a monochrome rendering style, not electron microscopy. Models are enlarged independently; only the comparison bars represent relative lengths. Size varies with species, age and conditions.

## Credits

Adapted from [cclank/cell-architecture-studio](https://github.com/cclank/cell-architecture-studio), under MIT. Inspired by Dilum Sanjaya and The Bugged Dev. Built with React, Three.js, React Three Fiber and Drei. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Contribute

Scientific corrections, accessible interaction improvements, and well-documented specimen contributions are welcome. Open an issue with a source or a pull request describing the change and how you checked it.

## License

Code: [MIT](LICENSE). Asset provenance and any separate asset terms are documented alongside the models.
