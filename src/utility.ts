import ExifReader from 'exifreader'
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

// Fetch image from S3, extract GPS tags from EXIF, and return coordinates
export const fetchImageGps = async (url: string) => {
  try {
    // Attempt to fetch only the first 128KB (EXIF header) to optimize bandwidth
    let response = await fetch(url, {
      headers: {
        Range: 'bytes=0-131072',
      },
    })

    let arrayBuffer: ArrayBuffer
    if (response.status === 206 || response.ok) {
      arrayBuffer = await response.arrayBuffer()
    } else {
      // Fallback to full download if range request fails or isn't supported
      response = await fetch(url)
      arrayBuffer = await response.arrayBuffer()
    }

    const tags = ExifReader.load(arrayBuffer)
    const lat = tags['GPSLatitude']?.description
    const lng = tags['GPSLongitude']?.description

    if (lat !== undefined && lng !== undefined) {
      return {
        lat: Number(lat),
        lng: Number(lng),
        success: true,
      }
    }

    return {
      success: false,
      error: 'No GPS tags found in image metadata.',
    }
  } catch (err: any) {
    console.warn('EXIF partial fetch failed. Retrying full image fetch...', err)
    try {
      // Full download fallback
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      const tags = ExifReader.load(arrayBuffer)
      const lat = tags['GPSLatitude']?.description
      const lng = tags['GPSLongitude']?.description

      if (lat !== undefined && lng !== undefined) {
        return {
          lat: Number(lat),
          lng: Number(lng),
          success: true,
        }
      }

      return {
        success: false,
        error: 'No GPS coordinates found in image.',
      }
    } catch (fallbackErr: any) {
      return {
        success: false,
        error: fallbackErr.message || 'Failed to fetch and parse image.',
      }
    }
  }
}

// Calculate geodesic distance between two points in meters using Haversine formula
export const calculateHaversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371e3 // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180
  const phi2 = (lat2 * Math.PI) / 180
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

export const compressImageToBlob = (
  file: File,
  maxWidth = 400,
  maxHeight = 400,
  quality = 0.7,
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(img.src)
      const canvas = document.createElement('canvas')
      let width = img.width
      let height = img.height

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height)
          height = maxHeight
        }
      }

      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Canvas toBlob failed'))
          }
        },
        'image/jpeg',
        quality,
      )
    }
    img.onerror = (err) => reject(err)
  })
}
