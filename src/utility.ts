import JSZip from 'jszip'
import KML from 'ol/format/KML'

// Load KMZ file: fetch, unzip, extract KML & base64 images, parse features
export const loadKmzFeatures = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(
      `Failed to load ${url.split('/').pop()}: ${response.statusText}`,
    )
  }
  const arrayBuffer = await response.arrayBuffer()
  const zip = await JSZip.loadAsync(arrayBuffer)

  // Find the main KML file in the zip
  const kmlFileName = Object.keys(zip.files).find((name) =>
    name.endsWith('.kml'),
  )
  if (!kmlFileName) {
    throw new Error('Invalid KMZ: No KML file found inside.')
  }

  let kmlText = await zip.files[kmlFileName].async('text')

  // Find and extract all image files from the zip
  const imageFiles = Object.keys(zip.files).filter(
    (name) =>
      name.endsWith('.png') ||
      name.endsWith('.jpg') ||
      name.endsWith('.jpeg') ||
      name.endsWith('.gif'),
  )

  const images: Record<string, string> = {}

  for (const imgName of imageFiles) {
    const base64Data = await zip.files[imgName].async('base64')
    const ext = imgName.split('.').pop() || 'png'
    const mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`
    images[imgName] = `data:${mimeType};base64,${base64Data}`
  }

  // Replace relative image references in the KML text with Base64 data URLs
  for (const [imgName, dataUrl] of Object.entries(images)) {
    kmlText = kmlText.replaceAll(imgName, dataUrl)
  }

  // Parse KML text to OpenLayers features
  const kmlFormat = new KML({
    extractStyles: true,
    showPointNames: false,
  })

  return kmlFormat.readFeatures(kmlText, {
    dataProjection: 'EPSG:4326',
    featureProjection: 'EPSG:3857',
  })
}
