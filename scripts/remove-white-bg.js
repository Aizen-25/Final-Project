/**
 * Remove near-white background pixels from an image and save as PNG with transparency.
 * Usage: node scripts/remove-white-bg.js input.png output.png
 * Requires: npm i sharp
 */
const sharp = require('sharp')
const path = require('path')

const [,, inputPath, outputPath] = process.argv
if (!inputPath || !outputPath) {
  console.error('Usage: node scripts/remove-white-bg.js input.png output.png')
  process.exit(1)
}

const fuzz = 250 // threshold (0-255) for whiteness detection; adjust if needed

(async () => {
  try {
    const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    const { width, height, channels } = info
    // Modify alpha channel for near-white pixels
    for (let i = 0; i < data.length; i += channels) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      // consider pixel white if all channels above fuzz threshold
      if (r >= fuzz && g >= fuzz && b >= fuzz) {
        data[i + 3] = 0
      }
    }
    await sharp(data, { raw: { width, height, channels } }).png().toFile(outputPath)
    console.log('Wrote', outputPath)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
})()
