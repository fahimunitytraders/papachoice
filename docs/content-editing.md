# Editing and sharing content

The local editor is at /#/admin. It has five sections: Appearance, Page text, Products, Partners and Company. Save changes applies validated content in this browser. Preview site opens the current route in a separate tab; refresh that tab after a later save.

Hex colours must contain six digits prefixed with #. The preview card shows draft colours before saving. Text fields are rendered as text, never injected as HTML. Homepage button destinations use a fixed list of existing routes. Form field labels and the detailed role descriptions remain source-controlled components/data, while their page headings and primary buttons are editable here.

Products support name, brand, category, size, SKU, numeric price, price basis, description, image and Best sellers visibility. Image URLs may be HTTPS URLs or local /assets/ paths. Existing product crops reuse the approved concept image. Choose Use full image when replacing a crop with an individual product photo. Add new assets to apps/web/public/assets and reference them with /assets/your-file.jpg.

Partners can have a name, logo and optional HTTPS website. Blank or failed logo images use the brand name. The homepage and directory use the same partner list. Categories must be unique, and every product must use an existing category.

Company registration details and email are optional. Empty fields stay hidden in the footer. Use the actual registered entity, company number and VAT number when available.

## Share changes

1. Export JSON from the editor.
2. Replace packages/content/defaults.json with the exported file.
3. Run npm test and npm run build.
4. Commit the file through a pull request.
5. Use Reset to defaults to clear any old browser override when reviewing the new committed version.

Import JSON only changes the draft until Save changes is clicked. Exports are validated, limited in size on import, and do not include private form information. The schemaVersion must remain 1 unless the parser is migrated with the content.
