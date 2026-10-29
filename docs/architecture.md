# Architecture

The root package is an npm workspace coordinator. It delegates dev, build and preview to @papas-choice/web. Root tests run shared content tests followed by frontend interaction tests.

@papas-choice/web uses React, Vite and React Router hash routing. The route tree includes Home, About, Products, Partners, Careers, Register, Contact and the lazily loaded Admin page. Native dialog elements provide product enquiry details, career applications and information panels.

@papas-choice/content exports the defaults, schema validation and pure catalogue utilities. Defaults are plain JSON and contain the full editable public content model. Arrays cover products, categories, partners and the illustrated About sections. Schema version 1 is explicit. Validation rebuilds the object from known properties and rejects invalid colours, destinations, asset paths, duplicate identifiers and malformed values.

ContentProvider loads a valid browser override or falls back to defaults. Save validates then writes to localStorage before updating React state. If storage is unavailable or full, the editor shows an error; the bundled site still runs. Theme values become CSS custom properties.

No browser storage is used for registration or career data. The only application storage key is papas-choice-content-v1, containing public site content. No basket exists.

Animation uses CSS and IntersectionObserver. Reveal components fall back to visible content when IntersectionObserver is unavailable. About sections use large reveal transitions, image masks and progressive scroll-linked image movement where supported. Reduced motion removes all animation. The partner slider duplicates a noninteractive, aria-hidden visual row to create a seamless loop; only the first row is keyboard reachable.

base.css holds shared primitives and retained form/career styling. styles.css applies the Papa's Choice design, the new pages, editor, theme overrides and responsive adaptations.
