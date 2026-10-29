# Asset provenance

## User supplied

- logo.png is a transparent raster rendering of the supplied Papa's Choice logo PDF. The original brand-logo-source.pdf is included unchanged.
- The product references supplied in the conversation were Nigerian Palm Oil 2L, Cocoyam Fufu Flour 681g and Pepper Soup Mix 200g.

## Generated artwork

food-concept.png is the approved homepage mockup from this conversation. The product photographs and hero are reused through SVG viewports in ProductImage.jsx. Only the product image regions are displayed; the mockup UI is not part of the live interface. Supply individual original product photographs for a production catalogue.

<<<<<<< HEAD
=======
## Added product catalogue

The supplied HTML attachment contains 70 product listings. All 70 are added alongside the original three products, with their primary photographs downloaded unchanged into apps/web/public/assets/products. Product names, source pages, original image URLs and local image paths are recorded in product-sources.json. Images are bundled, so the catalogue does not depend on the original website at runtime.

Descriptions are newly written from the product names and visible packaging. They do not add certification or nutritional claims. Pack sizes use visible labels where legible, otherwise the supplied image filename; unconfirmed sizes invite an enquiry. SKUs PC-004 through PC-073 are internal catalogue identifiers, not supplier barcodes. No new prices were supplied, so the added products use null and display “Price on enquiry”. Printed prices in source photographs are not treated as current wholesale prices.

Two source image mismatches are retained and disclosed in the affected product descriptions: the Epsom Salt Fine image shows a Sea Salt label, and the non price marked peanut butter image shows a price marked jar. Replace these source photographs when corrected product images are available. For Exotic Corn Dough and Flying Eagle Jasmine Rice, the displayed 2kg and 5kg pack labels take precedence over their misleading 1kg and 10kg image filenames. The Beans Flour photograph reads 1.5kg despite its 1kg filename.

>>>>>>> origin/fullprods
mission.png, quality.png and values.png are generated editorial illustrations for the About page. They do not document actual staff, premises or customers. They were created with the built-in image generation tool for this project.

The image briefs were: a shared African family meal for Mission; an editorial ingredient still life for Quality; and two people exchanging a carton at a neighbourhood shop for Values. All use natural light and warm colours without text or external branding.

## Partner logos

Seven initial entries are sourced from the existing Papa's Choice partners page, reviewed 28 October 2026: https://papachoice.co.uk/partners/. The directory is editable and can be expanded by your team. These are existing partner listings, not newly invented partnerships.

- Rajah: https://papachoice.co.uk/wp-content/uploads/2025/09/rajah-logo-150x150-1.png
- Dunn's River: https://papachoice.co.uk/wp-content/uploads/2025/09/dunns-river-logo-150x150-1.png
- Osupa: https://papachoice.co.uk/wp-content/uploads/2025/09/OSUPA_125555-1024x747.png
- Flying Eagle: https://papachoice.co.uk/wp-content/uploads/2025/09/Eagle-Rice-962x1024.png
- Lion: https://papachoice.co.uk/wp-content/uploads/2025/09/lion-logo.png
- Saxa: https://papachoice.co.uk/wp-content/uploads/2025/09/saxa-logo-1024x530.png
- Maggi: https://papachoice.co.uk/wp-content/uploads/2025/09/Maggi-Logo-1987-1024x576.png

Partner logos are bundled as downloaded. Replace or add logos under apps/web/public/assets/partners. Brand marks belong to their respective owners.

## Form source and copy

The registration field structure is based on https://papachoice.co.uk/register/. Company-specific guarantee wording is not reproduced as a binding agreement; submissions are clearly marked as a frontend demo.

The About narrative and contact details were supplied by the user. Mission, Quality and Values supporting copy is editable draft content. Prices are explicitly illustrative and must be replaced with verified figures.
