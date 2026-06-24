import CustomToast from '#/components/CustomToast'
import { ErrorComponent } from '#/components/Error'
import { Header } from '#/components/Header'
import { LoadingComponent } from '#/components/Loading'
import { VideoPlayer } from '#/components/VideoController'
import {
  calculateHaversineDistance,
  compressImageToBlob,
  fetchImageGps,
  loadKmzFeatures,
} from '#/utility'
import ExifReader from 'exifreader'
import {
  Activity,
  Camera,
  ChevronLeft,
  ChevronRight,
  Compass,
  Database,
  Eye,
  EyeOff,
  FileText,
  Flame,
  Info,
  Layers,
  MapPin,
  Maximize2,
  MessageSquare,
  Minus,
  Moon,
  Play,
  Plus,
  Search,
  Sliders,
  Sun,
  Upload,
  Video,
  X,
} from 'lucide-react'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import Map from 'ol/Map'
import 'ol/ol.css'
import Overlay from 'ol/Overlay'
import { fromLonLat, toLonLat } from 'ol/proj'
import OSM from 'ol/source/OSM'
import VectorSource from 'ol/source/Vector'
import XYZ from 'ol/source/XYZ'
import { getLength } from 'ol/sphere'
import { Circle, Fill, Icon, Stroke, Style } from 'ol/style'
import View from 'ol/View'
import { useEffect, useMemo, useRef, useState } from 'react'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

// Interface for structured GIS feature properties

// Interface for structured GIS feature properties
interface ParsedFeature {
  id: string
  name: string
  type: 'tower' | 'feeder'
  properties: Record<string, string>
  coordinates: any
}

export default function MapComponent() {
  const mapRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  // React state for GIS data & UI controls
  const [loading, setLoading] = useState(true)
  const [loadingStatus, setLoadingStatus] = useState('Initializing Map...')
  const [error, setError] = useState<string | null>(null)

  const [towers, setTowers] = useState<ParsedFeature[]>([])
  const [feeders, setFeeders] = useState<ParsedFeature[]>([])
  const [totalFeederLength, setTotalFeederLength] = useState<number>(0)

  const [showTowers, setShowTowers] = useState(true)
  const [showFeeders, setShowFeeders] = useState(true)
  const [towerOpacity, setTowerOpacity] = useState(1)
  const [feederOpacity, setFeederOpacity] = useState(1)
  const [basemap, setBasemap] = useState<
    'dark' | 'light' | 'osm' | 'satellite'
  >('dark')

  const [selectedFeature, setSelectedFeature] = useState<ParsedFeature | null>(
    null,
  )
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(
    null,
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [tooltipText, setTooltipText] = useState('')

  const [photoUrls, setPhotoUrls] = useState<
    { url: string; thumbnailUrl?: string }[]
  >([])
  const [photos, setPhotos] = useState<
    {
      url: string
      thumbnailUrl?: string
      name: string
      lat: number
      lng: number
      towerId: string | null
      distance: number | null
      type: 'rgb' | 'thermal'
    }[]
  >([])
  const [lightboxPhoto, setLightboxPhoto] = useState<any | null>(null)
  const [activeImgTab, setActiveImgTab] = useState<'rgb' | 'thermal'>('rgb')
  const [towerReports, setTowerReports] = useState<any[]>([])
  const [fetchingReports, setFetchingReports] = useState<boolean>(false)
  const [uploadingReport, setUploadingReport] = useState<
    'thermal' | 'findings' | null
  >(null)
  const [imageLoading, setImageLoading] = useState<boolean>(false)

  // Sidebar toggle state
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Span video state
  const [activeDetailTab, setActiveDetailTab] = useState<
    'info' | 'videos' | 'tower-shorts' | 'remarks'
  >('info')
  const [activeVideoTab, setActiveVideoTab] = useState<'rgb' | 'thermal'>('rgb')
  const [selectedSpan, setSelectedSpan] = useState<{
    fromId: string
    toId: string
  } | null>(null)
  const [spanVideo, setSpanVideo] = useState<{
    url: string
    thumbnailUrl?: string
    filename: string
    createdAt: string
  } | null>(null)
  const [fetchingVideo, setFetchingVideo] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)

  // Tower short video state
  const [activeTowerVideoTab, setActiveTowerVideoTab] = useState<
    'rgb' | 'thermal'
  >('rgb')
  const [towerVideo, setTowerVideo] = useState<{
    url: string
    thumbnailUrl?: string
    filename: string
    createdAt: string
  } | null>(null)
  const [fetchingTowerVideo, setFetchingTowerVideo] = useState(false)
  const [uploadingTowerVideo, setUploadingTowerVideo] = useState(false)

  // Tower remarks state
  const [remarks, setRemarks] = useState<any[]>([])
  const [newRemarkText, setNewRemarkText] = useState('')
  const [fetchingRemarks, setFetchingRemarks] = useState(false)
  const [submittingRemark, setSubmittingRemark] = useState(false)

  // Map reference holders for OpenLayers objects
  const mapInstanceRef = useRef<Map | null>(null)
  const towerLayerRef = useRef<VectorLayer<VectorSource> | null>(null)
  const feederLayerRef = useRef<VectorLayer<VectorSource> | null>(null)
  const photoLayerRef = useRef<VectorLayer<VectorSource> | null>(null)
  const tooltipOverlayRef = useRef<Overlay | null>(null)

  // Define basemap layers
  const basemapsRef = useRef<Record<string, TileLayer<any>>>({
    osm: new TileLayer({
      source: new OSM(),
      visible: false,
    }),
    dark: new TileLayer({
      source: new XYZ({
        url: 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        attributions: '© OpenStreetMap contributors © CARTO',
      }),
      visible: true,
    }),
    light: new TileLayer({
      source: new XYZ({
        url: 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        attributions: '© OpenStreetMap contributors © CARTO',
      }),
      visible: false,
    }),
    satellite: new TileLayer({
      source: new XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attributions: 'Tiles © Esri',
      }),
      visible: false,
    }),
  })

  // Parse key-value properties from KML's CDATA HTML Description
  const parseKmlDescription = (
    descriptionHtml: string,
  ): Record<string, string> => {
    const properties: Record<string, string> = {}
    if (!descriptionHtml) return properties

    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(descriptionHtml, 'text/html')
      const rows = doc.querySelectorAll('tr')
      rows.forEach((row) => {
        const cells = row.querySelectorAll('td')
        if (cells.length === 2) {
          const key = cells[0].textContent?.trim() || ''
          const val = cells[1].textContent?.trim() || ''
          if (key && key !== val) {
            properties[key] = val
            if (key.toLowerCase().includes('twrnum')) {
              properties['twrnum'] = val
            }
            if (key.toLowerCase().includes('feedername')) {
              properties['feedername'] = val
            }
          }
        }
      })
    } catch (e) {
      // Regex fallback if DOMParser is unavailable
      const rowRegex = /<tr>\s*<td>([^<]+)<\/td>\s*<td>([^<]*)<\/td>\s*<\/tr>/gi
      let match
      while ((match = rowRegex.exec(descriptionHtml)) !== null) {
        const key = match[1].trim()
        const val = match[2].trim()
        properties[key] = val
        if (key.toLowerCase().includes('twrnum')) {
          properties['twrnum'] = val
        }
        if (key.toLowerCase().includes('feedername')) {
          properties['feedername'] = val
        }
      }
    }
    return properties
  }

  // Effect to initialize the map
  useEffect(() => {
    if (!mapRef.current) return

    // 1. Create OpenLayers Map
    const map = new Map({
      target: mapRef.current,
      layers: [
        basemapsRef.current.osm,
        basemapsRef.current.dark,
        basemapsRef.current.light,
        basemapsRef.current.satellite,
      ],
      view: new View({
        center: [9541000, 2306000], // Centered near Odisha, India (EPSG:3857)
        zoom: 11,
      }),
      controls: [], // We'll add standard/custom controls manually or style them
    })

    mapInstanceRef.current = map

    // 2. Set up Tooltip Overlay
    if (tooltipRef.current) {
      const overlay = new Overlay({
        element: tooltipRef.current,
        offset: [15, -15],
        positioning: 'bottom-left',
        stopEvent: false,
      })
      map.addOverlay(overlay)
      tooltipOverlayRef.current = overlay
    }

    // 3. Create Vector Layers for Feeders & Towers
    const feederSource = new VectorSource()
    const feederLayer = new VectorLayer({
      source: feederSource,
      style: (featureLike) => {
        const feature = featureLike
        const fId = feature.get('id')
        const name = feature.get('name') || ''
        const isSelected = fId === selectedFeatureIdRef.current

        let strokeColor = '#06b6d4' // Default Cyan
        if (name.includes('CKT-1')) strokeColor = '#3b82f6' // Circuit 1 Blue
        if (name.includes('CKT-2')) strokeColor = '#a855f7' // Circuit 2 Purple

        if (isSelected) {
          return [
            new Style({
              stroke: new Stroke({
                color: '#ffffff',
                width: 7,
              }),
              zIndex: 10,
            }),
            new Style({
              stroke: new Stroke({
                color: '#f43f5e', // Vibrant Rose Highlight
                width: 4,
              }),
              zIndex: 11,
            }),
          ]
        }

        return new Style({
          stroke: new Stroke({
            color: strokeColor,
            width: 3.5,
          }),
          zIndex: 2,
        })
      },
    })

    const towerSource = new VectorSource()
    const towerLayer = new VectorLayer({
      source: towerSource,
      style: (featureLike) => {
        const feature = featureLike as Feature
        const fId = feature.get('id')
        const isSelected = fId === selectedFeatureIdRef.current

        // Check if KML icon is parsed and set
        let iconSrc = ''
        const featureStyle = feature.getStyle()
        if (featureStyle) {
          const styles =
            typeof featureStyle === 'function'
              ? featureStyle(feature, 1)
              : featureStyle
          const styleObj = Array.isArray(styles) ? styles[0] : styles
          if (styleObj && typeof styleObj.getImage === 'function') {
            const img = styleObj.getImage() as any
            if (img && typeof img.getSrc === 'function') {
              iconSrc = img.getSrc() || ''
            }
          }
        }

        const styles: Style[] = []

        if (isSelected) {
          // Add a glowing halo behind selected tower
          styles.push(
            new Style({
              image: new Circle({
                radius: 12,
                fill: new Fill({
                  color: 'rgba(244, 63, 94, 0.4)',
                }),
                stroke: new Stroke({
                  color: '#f43f5e',
                  width: 2,
                }),
              }),
              zIndex: 19,
            }),
          )
        }

        if (iconSrc) {
          styles.push(
            new Style({
              image: new Icon({
                src: iconSrc,
                scale: isSelected ? 0.65 : 0.45, // Scale up standard icon slightly for visibility
              }),
              zIndex: 20,
            }),
          )
        } else {
          // Fallback: A nice glowing dot
          styles.push(
            new Style({
              image: new Circle({
                radius: isSelected ? 8 : 5,
                fill: new Fill({
                  color: isSelected ? '#f43f5e' : '#fbbf24',
                }),
                stroke: new Stroke({
                  color: '#ffffff',
                  width: 1.5,
                }),
              }),
              zIndex: 20,
            }),
          )
        }

        return styles
      },
    })

    const photoSource = new VectorSource()
    const photoLayer = new VectorLayer({
      source: photoSource,
      style: new Style({
        image: new Icon({
          src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="%230ea5e9" stroke="%23ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>',
          scale: 0.9,
        }),
      }),
      zIndex: 30,
    })

    map.addLayer(feederLayer)
    map.addLayer(towerLayer)
    map.addLayer(photoLayer)

    feederLayerRef.current = feederLayer
    towerLayerRef.current = towerLayer
    photoLayerRef.current = photoLayer

    // 4. Map Event Listeners
    // Hover event for pointer changes & tooltip
    map.on('pointermove', (evt) => {
      if (evt.dragging) {
        tooltipOverlayRef.current?.setPosition(undefined)
        return
      }

      const pixel = map.getEventPixel(evt.originalEvent)
      const feature = map.forEachFeatureAtPixel(pixel, (feat) => feat, {
        layerFilter: (lyr) =>
          lyr === feederLayer || lyr === towerLayer || lyr === photoLayer,
      })

      if (feature) {
        map.getTargetElement().style.cursor = 'pointer'
        const name = feature.get('name') || 'Feature'
        const fType = feature.get('type')
        const type =
          fType === 'tower' ? 'Tower' : fType === 'photo' ? 'Photo' : 'Feeder'
        setTooltipText(`${type}: ${name}`)
        tooltipOverlayRef.current?.setPosition(evt.coordinate)
      } else {
        map.getTargetElement().style.cursor = ''
        tooltipOverlayRef.current?.setPosition(undefined)
      }
    })

    // Cleanup
    return () => {
      map.setTarget(undefined)
    }
  }, [])

  // Keep a mutable ref of the selected ID for the style function closures
  const selectedFeatureIdRef = useRef<string | null>(null)
  useEffect(() => {
    selectedFeatureIdRef.current = selectedFeatureId
    // Trigger redraw of vector layers to apply selection style
    feederLayerRef.current?.changed()
    towerLayerRef.current?.changed()
  }, [selectedFeatureId])

  // Effect to load KMZ files on mount
  useEffect(() => {
    const loadGisData = async () => {
      try {
        setLoading(true)
        setLoadingStatus('Downloading Feeder KMZ...')
        const feederFeatures = await loadKmzFeatures(
          '/KML/FEEDER_220kV%20Mendhasal%20-%20Bidanasi%20DC%20Line.kmz',
        )

        setLoadingStatus('Downloading Tower KMZ...')
        const towerFeatures = await loadKmzFeatures(
          '/KML/TWR_220kV%20Mendhasal%20-%20Bidanasi%20DC%20Line.kmz',
        )

        setLoadingStatus('Parsing data structures...')

        const processedFeeders = feederFeatures.map((feat, index) => {
          const name = feat.get('name') || ''
          const desc = feat.get('description') || ''
          const props = parseKmlDescription(desc)
          const fName = props.feedername || name || `Feeder ${index + 1}`
          const id = fName

          feat.set('id', id)
          feat.set('type', 'feeder')
          feat.set('name', fName)

          // Calculate feeder line length
          const geom = feat.getGeometry()
          let length = 0
          if (geom) {
            length = getLength(geom)
          }

          return {
            id,
            name: fName,
            type: 'feeder' as const,
            properties: {
              ...props,
              'Calculated Length': `${(length / 1000).toFixed(2)} km`,
            },
            coordinates: geom ? (geom as any).getCoordinates() : null,
          }
        })

        const processedTowers = towerFeatures.map((feat, index) => {
          const name = feat.get('name') || ''
          const desc = feat.get('description') || ''
          const props = parseKmlDescription(desc)
          const tName = props.twrnum || name || `Tower ${index + 1}`
          const id = tName

          feat.set('id', id)
          feat.set('type', 'tower')
          feat.set('name', tName)

          const geom = feat.getGeometry()

          return {
            id,
            name: tName,
            type: 'tower' as const,
            properties: props,
            coordinates: geom ? (geom as any).getCoordinates() : null,
          }
        })

        // Add features to vector layers
        feederLayerRef.current?.getSource()?.addFeatures(feederFeatures)
        towerLayerRef.current?.getSource()?.addFeatures(towerFeatures)

        // Calculate total length of all feeders
        let totalLen = 0
        feederFeatures.forEach((feat) => {
          const geom = feat.getGeometry()
          if (geom) {
            totalLen += getLength(geom)
          }
        })

        setFeeders(processedFeeders)
        setTowers(processedTowers)
        setTotalFeederLength(totalLen / 1000)

        // Zoom to the extent of all loaded data
        const map = mapInstanceRef.current
        if (map) {
          const feederExtent = feederLayerRef.current?.getSource()?.getExtent()
          const towerExtent = towerLayerRef.current?.getSource()?.getExtent()

          if (feederExtent && towerExtent) {
            // Merge extents
            const combinedExtent = [
              Math.min(feederExtent[0], towerExtent[0]),
              Math.min(feederExtent[1], towerExtent[1]),
              Math.max(feederExtent[2], towerExtent[2]),
              Math.max(feederExtent[3], towerExtent[3]),
            ]
            map.getView().fit(combinedExtent, {
              padding: [50, 50, 50, 50],
              duration: 1200,
            })
          }
        }

        // Add Click Listener to Map
        map?.on('singleclick', (evt) => {
          const pixel = map.getEventPixel(evt.originalEvent)
          const feature = map.forEachFeatureAtPixel(pixel, (feat) => feat, {
            layerFilter: (lyr) =>
              lyr === feederLayerRef.current ||
              lyr === towerLayerRef.current ||
              lyr === photoLayerRef.current,
          })

          if (feature) {
            const fType = feature.get('type')
            if (fType === 'photo') {
              const photoData = feature.get('photo')
              if (photoData.towerId) {
                const tower = processedTowers.find(
                  (t) => t.id === photoData.towerId,
                )
                if (tower) {
                  setSelectedFeature(tower)
                  setSelectedFeatureId(tower.id)
                }
              } else {
                setLightboxPhoto(photoData)
              }
              return
            }

            const id = feature.get('id')
            const type = feature.get('type') as 'tower' | 'feeder'

            // Look up processed features
            const collection =
              type === 'tower' ? processedTowers : processedFeeders
            const match = collection.find((item) => item.id === id)

            if (match) {
              setSelectedFeature(match)
              setSelectedFeatureId(id)
            }
          } else {
            setSelectedFeature(null)
            setSelectedFeatureId(null)
          }
        })

        setLoading(false)
      } catch (err: any) {
        console.error('Error loading GIS Data:', err)
        setError(err.message || 'An error occurred while loading KMZ files.')
        setLoading(false)
      }
    }

    loadGisData()
  }, [])

  // Fetch existing images from NestJS database on mount
  useEffect(() => {
    const fetchExistingImages = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/s3/db-images`, {
          credentials: 'include',
        })
        if (response.ok) {
          const dbImages = await response.json()
          setPhotoUrls((prev) => {
            const newUrls = [...prev]
            dbImages.forEach((img: any) => {
              if (!newUrls.some((u) => u.url === img.url)) {
                newUrls.push({ url: img.url, thumbnailUrl: img.thumbnailUrl })
              }
            })
            return newUrls
          })
        }
      } catch (err) {
        console.error('Failed to fetch existing images:', err)
      }
    }

    fetchExistingImages()
  }, [])

  // Load photo metadata and associate with towers within 50m buffer
  useEffect(() => {
    if (towers.length === 0) return
    const loadPhotosMetadata = async () => {
      const loadedPhotos: typeof photos = []

      for (const item of photoUrls) {
        try {
          const metadata = await fetchImageGps(item.url)
          if (metadata.success && metadata.lat && metadata.lng) {
            let closestTower: ParsedFeature | null = null
            let minDistance = Infinity

            for (const t of towers) {
              const [twrLng, twrLat] = toLonLat(t.coordinates)
              const dist = calculateHaversineDistance(
                metadata.lat!,
                metadata.lng!,
                twrLat,
                twrLng,
              )
              if (dist < minDistance) {
                minDistance = dist
                closestTower = t
              }
            }

            const isWithinBuffer = minDistance <= 50
            const filename = item.url.split('/').pop() || ''
            const type =
              item.url.includes('/thermal/') || filename.includes('thermal-')
                ? 'thermal'
                : 'rgb'
            const cleanName = filename
              .replace(/^[a-z0-9]{6}-/, '')
              .replace(/^(rgb-|thermal-)/, '')

            loadedPhotos.push({
              url: item.url,
              thumbnailUrl: item.thumbnailUrl,
              name: cleanName,
              lat: metadata.lat!,
              lng: metadata.lng!,
              towerId: isWithinBuffer && closestTower ? closestTower.id : null,
              distance: isWithinBuffer ? minDistance : null,
              type,
            })
          }
        } catch (err) {
          console.error('Failed to load metadata for photo:', item.url, err)
        }
      }

      setPhotos(loadedPhotos)
    }

    loadPhotosMetadata()
  }, [towers, photoUrls])

  // Handle folder upload for RGB and Thermal images
  const handleFolderUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'rgb' | 'thermal',
  ) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setLoading(true)
    setLoadingStatus(`Preparing folder upload for ${files.length} items...`)

    let uploadedCount = 0
    let errorCount = 0

    // Filter to image files
    const imageFiles = Array.from(files).filter((file) =>
      /\.(jpe?g|png|gif|webp)$/i.test(file.name),
    )

    if (imageFiles.length === 0) {
      CustomToast({
        type: 'failure',
        headline: 'Not Found',
        description: 'No valid image files found in the selected folder.',
      })

      setLoading(false)
      return
    }

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i]
      setLoadingStatus(
        `Uploading ${type.toUpperCase()} image ${i + 1} of ${imageFiles.length}: ${file.name}...`,
      )

      try {
        const prefixedName = `${type}-${file.name}`

        // 1. Fetch presigned URL from backend
        const res = await fetch(
          `${API_BASE_URL}/s3/presigned-url?filename=${encodeURIComponent(
            prefixedName,
          )}&filetype=${encodeURIComponent(file.type)}&folder=${encodeURIComponent(type)}`,
          {
            credentials: 'include',
          },
        )

        if (!res.ok) {
          throw new Error(`Failed to get presigned URL for ${file.name}`)
        }

        const { presignedUrl, thumbPresignedUrl, imageUrl, thumbnailUrl } =
          await res.json()

        // 2. Upload file directly to S3 via PUT
        const uploadRes = await fetch(presignedUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type,
          },
          body: file,
        })

        if (!uploadRes.ok) {
          throw new Error(`Failed to upload ${file.name} to S3`)
        }

        // 2.5 Generate and upload thumbnail
        try {
          const thumbBlob = await compressImageToBlob(file)
          const uploadThumbRes = await fetch(thumbPresignedUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': 'image/jpeg',
            },
            body: thumbBlob,
          })
          if (!uploadThumbRes.ok) {
            console.warn(`Failed to upload thumbnail for ${file.name} to S3`)
          }
        } catch (thumbErr) {
          console.warn(
            `Could not generate or upload thumbnail for ${file.name}:`,
            thumbErr,
          )
        }

        // 3. Extract GPS coordinates locally using ExifReader
        let lat: number | null = null
        let lng: number | null = null

        try {
          const arrayBuffer = await file.arrayBuffer()
          const tags = ExifReader.load(arrayBuffer)
          if (tags.GPSLatitude && tags.GPSLongitude) {
            const parsedLat = parseFloat(String(tags.GPSLatitude.description))
            const parsedLng = parseFloat(String(tags.GPSLongitude.description))
            if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
              const latRef = tags.GPSLatitudeRef?.value
                ? String(tags.GPSLatitudeRef.value)[0]
                : undefined
              const lngRef = tags.GPSLongitudeRef?.value
                ? String(tags.GPSLongitudeRef.value)[0]
                : undefined

              let finalLat = parsedLat
              let finalLng = parsedLng

              if (latRef === 'S' && finalLat > 0) finalLat = -finalLat
              if (lngRef === 'W' && finalLng > 0) finalLng = -finalLng

              lat = finalLat
              lng = finalLng
            }
          }
        } catch (exifErr) {
          console.warn(
            `No EXIF tags or failed to parse for ${file.name}:`,
            exifErr,
          )
        }

        // 4. Calculate closest tower
        let towerId: string | null = null
        let distance: number | null = null

        if (lat !== null && lng !== null) {
          let minDistance = Infinity
          let closestTower = null

          for (const t of towers) {
            const [twrLng, twrLat] = toLonLat(t.coordinates)
            const dist = calculateHaversineDistance(lat, lng, twrLat, twrLng)
            if (dist < minDistance) {
              minDistance = dist
              closestTower = t
            }
          }

          if (minDistance <= 50 && closestTower) {
            towerId = closestTower.id
            distance = minDistance
          }
        }

        // Add to our reactive photos state
        const newPhoto = {
          url: imageUrl,
          thumbnailUrl,
          name: file.name,
          lat: lat || 0,
          lng: lng || 0,
          towerId,
          distance,
          type,
        }

        setPhotos((prev) => [...prev, newPhoto])
        uploadedCount++
      } catch (err) {
        console.error(`Error uploading ${file.name}:`, err)
        errorCount++
      }
    }

    setLoading(false)

    CustomToast({
      type: 'success',
      headline: 'Folder uploaded successfully!',
      description: `Folder upload completed.\nSuccessfully uploaded: ${uploadedCount}\nErrors: ${errorCount}`,
    })

    e.target.value = ''
  }

  const fetchReports = async (towerId: string) => {
    setFetchingReports(true)
    try {
      const res = await fetch(
        `${API_BASE_URL}/s3/reports/${encodeURIComponent(towerId)}`,
        {
          credentials: 'include',
        },
      )
      if (res.ok) {
        const data = await res.json()
        setTowerReports(data)
      } else {
        setTowerReports([])
      }
    } catch (err) {
      console.error('Error fetching reports:', err)
      setTowerReports([])
    } finally {
      setFetchingReports(false)
    }
  }

  const handleReportUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    towerId: string,
    reportType: 'thermal' | 'findings',
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      CustomToast({
        type: 'failure',
        headline: 'Unsupported Format',
        description: 'Only .pdf formats are allowed.',
      })
      e.target.value = ''
      return
    }

    setUploadingReport(reportType)
    try {
      const res = await fetch(
        `${API_BASE_URL}/s3/report-presigned-url?filename=${encodeURIComponent(
          file.name,
        )}&filetype=${encodeURIComponent(file.type)}&towerId=${encodeURIComponent(
          towerId,
        )}&type=${encodeURIComponent(reportType)}`,
        {
          credentials: 'include',
        },
      )

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(
          errData.message || `Failed to get presigned URL for report`,
        )
      }

      const { presignedUrl } = await res.json()

      const uploadRes = await fetch(presignedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      })

      if (!uploadRes.ok) {
        throw new Error(`Failed to upload report to S3`)
      }

      await fetchReports(towerId)

      CustomToast({
        type: 'success',
        headline: 'Report uploaded successfully!',
        description: `${reportType === 'thermal' ? 'Thermal' : 'Findings'} report uploaded successfully!`,
      })
    } catch (err: any) {
      console.error('Error uploading report:', err)

      CustomToast({
        type: 'failure',
        headline: 'Error!',
        description: err.message || 'Error uploading report',
      })
    } finally {
      setUploadingReport(null)
      e.target.value = ''
    }
  }

  useEffect(() => {
    if (selectedFeature && selectedFeature.type === 'tower') {
      fetchReports(selectedFeature.id)
    } else {
      setTowerReports([])
    }
  }, [selectedFeature])

  // Reset detail tab and span when selection changes
  useEffect(() => {
    setActiveDetailTab('info')
    setActiveVideoTab('rgb')
    setActiveTowerVideoTab('rgb')
    setSelectedSpan(null)
    setSpanVideo(null)
    setTowerVideo(null)
    setRemarks([])
    setNewRemarkText('')
  }, [selectedFeature])

  // Get adjacent towers for the current selection
  const getAdjacentTowers = (
    towerId: string,
  ): { prev: ParsedFeature | null; next: ParsedFeature | null } => {
    if (towers.length === 0) return { prev: null, next: null }

    const sorted = [...towers].sort((a, b) => {
      // Try to extract numeric parts for natural ordering
      const numA = parseInt(a.name.replace(/\D/g, ''), 10)
      const numB = parseInt(b.name.replace(/\D/g, ''), 10)
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB
      return a.name.localeCompare(b.name)
    })

    const idx = sorted.findIndex((t) => t.id === towerId)
    if (idx === -1) return { prev: null, next: null }

    return {
      prev: idx > 0 ? sorted[idx - 1] : null,
      next: idx < sorted.length - 1 ? sorted[idx + 1] : null,
    }
  }

  // Fetch span video
  const fetchSpanVideos = async (
    fromId: string,
    toId: string,
    type: string,
  ) => {
    setFetchingVideo(true)
    setSpanVideo(null)
    try {
      const res = await fetch(
        `${API_BASE_URL}/s3/videos/${encodeURIComponent(fromId)}/${encodeURIComponent(toId)}/${encodeURIComponent(type)}`,
        { credentials: 'include' },
      )
      if (res.ok) {
        const data = await res.json()
        setSpanVideo(data)
      } else {
        setSpanVideo(null)
      }
    } catch (err) {
      console.error('Error fetching span video:', err)
      setSpanVideo(null)
    } finally {
      setFetchingVideo(false)
    }
  }

  // Generate a thumbnail from a video file using canvas
  const generateVideoThumbnail = (videoFile: File): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.muted = true
      video.playsInline = true

      video.onloadeddata = () => {
        // Seek to 1 second or 10% of the video
        video.currentTime = Math.min(1, video.duration * 0.1)
      }

      video.onseeked = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 320
        canvas.height = Math.round((video.videoHeight / video.videoWidth) * 320)
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(video.src)
              resolve(blob)
            },
            'image/jpeg',
            0.7,
          )
        } else {
          URL.revokeObjectURL(video.src)
          resolve(null)
        }
      }

      video.onerror = () => {
        URL.revokeObjectURL(video.src)
        resolve(null)
      }

      video.src = URL.createObjectURL(videoFile)
    })
  }

  // Handle video upload for a span
  const handleVideoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fromId: string,
    toId: string,
    type: string,
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime']
    if (!allowedTypes.includes(file.type)) {
      CustomToast({
        type: 'failure',
        headline: 'Unsupported Format',
        description: 'Only .mp4, .webm, and .mov formats are allowed.',
      })
      e.target.value = ''
      return
    }

    setUploadingVideo(true)
    try {
      // 1. Get presigned URL
      const res = await fetch(
        `${API_BASE_URL}/s3/video-presigned-url?filename=${encodeURIComponent(
          file.name,
        )}&filetype=${encodeURIComponent(
          file.type,
        )}&towerFromId=${encodeURIComponent(
          fromId,
        )}&towerToId=${encodeURIComponent(toId)}&type=${encodeURIComponent(type)}`,
        { credentials: 'include' },
      )

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(
          errData.message || 'Failed to get presigned URL for video',
        )
      }

      const { presignedUrl, thumbPresignedUrl } = await res.json()

      // 2. Upload video to S3
      const uploadRes = await fetch(presignedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })

      if (!uploadRes.ok) throw new Error('Failed to upload video to S3')

      // 3. Generate and upload thumbnail
      try {
        const thumbBlob = await generateVideoThumbnail(file)
        if (thumbBlob) {
          await fetch(thumbPresignedUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'image/jpeg' },
            body: thumbBlob,
          })
        }
      } catch (thumbErr) {
        console.warn('Could not generate video thumbnail:', thumbErr)
      }

      // 4. Refresh the span video
      await fetchSpanVideos(fromId, toId, type)
      CustomToast({
        type: 'success',
        headline: 'Video uploaded successfully!',
        description: '',
      })
    } catch (err: any) {
      console.error('Error uploading video:', err)
      CustomToast({
        type: 'failure',
        headline: 'Error!',
        description: err.message || 'Error uploading video',
      })
    } finally {
      setUploadingVideo(false)
      e.target.value = ''
    }
  }

  // Fetch span video when selectedSpan or activeVideoTab changes
  useEffect(() => {
    if (selectedSpan) {
      fetchSpanVideos(selectedSpan.fromId, selectedSpan.toId, activeVideoTab)
    } else {
      setSpanVideo(null)
    }
  }, [selectedSpan, activeVideoTab])

  // Fetch tower short video
  const fetchTowerVideo = async (towerId: string, type: string) => {
    setFetchingTowerVideo(true)
    setTowerVideo(null)
    try {
      const res = await fetch(
        `${API_BASE_URL}/s3/tower-videos/${encodeURIComponent(towerId)}/${encodeURIComponent(type)}`,
        { credentials: 'include' },
      )
      if (res.ok) {
        const data = await res.json()
        setTowerVideo(data)
      } else {
        setTowerVideo(null)
      }
    } catch (err) {
      console.error('Error fetching tower video:', err)
      setTowerVideo(null)
    } finally {
      setFetchingTowerVideo(false)
    }
  }

  // Handle tower short video upload
  const handleTowerVideoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    towerId: string,
    type: string,
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime']
    if (!allowedTypes.includes(file.type)) {
      CustomToast({
        type: 'failure',
        headline: 'Unsupported Format',
        description: 'Only .mp4, .webm, and .mov formats are allowed.',
      })
      e.target.value = ''
      return
    }

    setUploadingTowerVideo(true)
    try {
      const res = await fetch(
        `${API_BASE_URL}/s3/tower-video-presigned-url?filename=${encodeURIComponent(
          file.name,
        )}&filetype=${encodeURIComponent(
          file.type,
        )}&towerId=${encodeURIComponent(
          towerId,
        )}&type=${encodeURIComponent(type)}`,
        { credentials: 'include' },
      )

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(
          errData.message || 'Failed to get presigned URL for tower video',
        )
      }

      const { presignedUrl, thumbPresignedUrl } = await res.json()

      const uploadRes = await fetch(presignedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })

      if (!uploadRes.ok) throw new Error('Failed to upload video to S3')

      try {
        const thumbBlob = await generateVideoThumbnail(file)
        if (thumbBlob) {
          await fetch(thumbPresignedUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'image/jpeg' },
            body: thumbBlob,
          })
        }
      } catch (thumbErr) {
        console.warn('Could not generate video thumbnail:', thumbErr)
      }

      await fetchTowerVideo(towerId, type)
      CustomToast({
        type: 'success',
        headline: 'Tower video uploaded successfully!',
        description: '',
      })
    } catch (err: any) {
      console.error('Error uploading tower video:', err)
      CustomToast({
        type: 'failure',
        headline: 'Error!',
        description: err.message || 'Error uploading tower video',
      })
    } finally {
      setUploadingTowerVideo(false)
      e.target.value = ''
    }
  }

  // Fetch tower video when selected tower or tab changes
  useEffect(() => {
    if (
      selectedFeature &&
      selectedFeature.type === 'tower' &&
      activeDetailTab === 'tower-shorts'
    ) {
      fetchTowerVideo(selectedFeature.id, activeTowerVideoTab)
    } else {
      setTowerVideo(null)
    }
  }, [selectedFeature, activeTowerVideoTab, activeDetailTab])

  // Fetch remarks for tower
  const fetchRemarks = async (towerId: string) => {
    setFetchingRemarks(true)
    try {
      const res = await fetch(
        `${API_BASE_URL}/s3/remarks/${encodeURIComponent(towerId)}`,
        { credentials: 'include' },
      )
      if (res.ok) {
        const data = await res.json()
        setRemarks(data)
      } else {
        setRemarks([])
      }
    } catch (err) {
      console.error('Error fetching remarks:', err)
      setRemarks([])
    } finally {
      setFetchingRemarks(false)
    }
  }

  // Add remark for tower
  const handleCreateRemark = async (towerId: string) => {
    if (!newRemarkText.trim()) return

    setSubmittingRemark(true)
    try {
      const res = await fetch(`${API_BASE_URL}/s3/remarks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          towerId,
          text: newRemarkText.trim(),
        }),
        credentials: 'include',
      })

      if (res.ok) {
        setNewRemarkText('')
        await fetchRemarks(towerId)
        CustomToast({
          type: 'success',
          headline: 'Remark added successfully',
          description: '',
        })
      } else {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || 'Failed to submit remark')
      }
    } catch (err: any) {
      console.error('Error creating remark:', err)
      CustomToast({
        type: 'failure',
        headline: 'Error!',
        description: err.message || 'Error submitting remark',
      })
    } finally {
      setSubmittingRemark(false)
    }
  }

  // Fetch remarks when selected tower or tab changes
  useEffect(() => {
    if (
      selectedFeature &&
      selectedFeature.type === 'tower' &&
      activeDetailTab === 'remarks'
    ) {
      fetchRemarks(selectedFeature.id)
    }
  }, [selectedFeature, activeDetailTab])

  useEffect(() => {
    if (lightboxPhoto) {
      setImageLoading(true)
    }
  }, [lightboxPhoto])

  // Update map size when sidebar visibility changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      const timer = setTimeout(() => {
        mapInstanceRef.current?.updateSize()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [sidebarOpen])

  // Sync photos to the map's photoLayer
  useEffect(() => {
    const source = photoLayerRef.current?.getSource()
    if (!source) return

    source.clear()

    const seenTowers = new Set<string>()

    photos.forEach((photo) => {
      if (photo.towerId) {
        if (seenTowers.has(photo.towerId)) {
          return
        }
        seenTowers.add(photo.towerId)
      }

      const geom = new Point(fromLonLat([photo.lng, photo.lat]))
      const feature = new Feature({
        geometry: geom,
      })
      feature.set('id', photo.name)
      feature.set('name', photo.name)
      feature.set('type', 'photo')
      feature.set('photo', photo)
      source.addFeature(feature)
    })
  }, [photos])

  // Update basemap visibility
  useEffect(() => {
    Object.entries(basemapsRef.current).forEach(([key, layer]) => {
      layer.setVisible(key === basemap)
    })
  }, [basemap])

  // Update layer controls
  useEffect(() => {
    if (towerLayerRef.current) {
      towerLayerRef.current.setVisible(showTowers)
      towerLayerRef.current.setOpacity(towerOpacity)
    }
  }, [showTowers, towerOpacity])

  useEffect(() => {
    if (feederLayerRef.current) {
      feederLayerRef.current.setVisible(showFeeders)
      feederLayerRef.current.setOpacity(feederOpacity)
    }
  }, [showFeeders, feederOpacity])

  // Zoom In map
  const handleZoomIn = () => {
    const map = mapInstanceRef.current
    if (map) {
      const view = map.getView()
      const zoom = view.getZoom()
      if (zoom !== undefined) {
        view.animate({ zoom: zoom + 1, duration: 250 })
      }
    }
  }

  // Zoom Out map
  const handleZoomOut = () => {
    const map = mapInstanceRef.current
    if (map) {
      const view = map.getView()
      const zoom = view.getZoom()
      if (zoom !== undefined) {
        view.animate({ zoom: zoom - 1, duration: 250 })
      }
    }
  }

  // Reset View to original coordinates/zoom
  const handleResetView = () => {
    const map = mapInstanceRef.current
    if (map) {
      const view = map.getView()
      view.animate({
        center: [9541000, 2306000],
        zoom: 11,
        duration: 500,
      })
    }
  }

  // Center/Zoom onto a feature
  const zoomToFeature = (feat: ParsedFeature) => {
    const map = mapInstanceRef.current
    if (!map || !feat.coordinates) return

    const view = map.getView()

    if (feat.type === 'tower') {
      // coordinates is [x, y]
      view.animate({
        center: feat.coordinates,
        zoom: 17,
        duration: 1000,
      })
    } else {
      // Feeder line string coordinates
      // Find feature in source and fit its extent
      const source = feederLayerRef.current?.getSource()
      const olFeat = source?.getFeatures().find((f) => f.get('id') === feat.id)
      const extent = olFeat?.getGeometry()?.getExtent()

      if (extent) {
        view.fit(extent, {
          padding: [80, 80, 80, 80],
          duration: 1000,
        })
      }
    }

    setSelectedFeature(feat)
    setSelectedFeatureId(feat.id)
  }

  // Filter search queries
  const filteredSearchList = useMemo(() => {
    if (!searchQuery.trim()) return []
    const query = searchQuery.toLowerCase()

    const matchingTowers = towers
      .filter((t) => t.name.toLowerCase().includes(query))
      .slice(0, 5)
    const matchingFeeders = feeders
      .filter((f) => f.name.toLowerCase().includes(query))
      .slice(0, 5)

    return [...matchingTowers, ...matchingFeeders]
  }, [searchQuery, towers, feeders])

  // Photos matched to selected tower
  const towerPhotos = useMemo(() => {
    if (!selectedFeature || selectedFeature.type !== 'tower') return []
    return photos.filter((p) => p.towerId === selectedFeature.id)
  }, [selectedFeature, photos])

  const rgbPhotos = useMemo(() => {
    return towerPhotos.filter((p) => p.type === 'rgb')
  }, [towerPhotos])

  const thermalPhotos = useMemo(() => {
    return towerPhotos.filter((p) => p.type === 'thermal')
  }, [towerPhotos])

  // Reset image tab to 'rgb' when selection changes
  useEffect(() => {
    setActiveImgTab('rgb')
  }, [selectedFeature])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* 1. Glassmorphic Sidebar */}
      <div
        className={`transition-all duration-300 ${sidebarOpen ? 'w-96 border-r border-slate-800' : 'w-0 border-r-0'} flex flex-col bg-slate-900 h-full shadow-2xl z-10 overflow-hidden shrink-0`}
      >
        {/* Header */}
        <Header onCollapse={() => setSidebarOpen(false)} />

        {/* Scrollable Contents */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
          {/* A. Search Panel */}
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search towers (e.g. GANTRY)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {filteredSearchList.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-950/95 border border-slate-800 rounded-xl shadow-2xl z-50 divide-y divide-slate-800/60 overflow-hidden backdrop-blur-lg">
                {filteredSearchList.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      zoomToFeature(item)
                      setSearchQuery('')
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs text-slate-300 hover:bg-slate-900 flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      {item.type === 'tower' ? (
                        <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      ) : (
                        <Activity className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                      )}
                      <span className="font-medium truncate max-w-[200px]">
                        {item.name}
                      </span>
                    </div>
                    <ChevronRight className="h-3 w-3 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* B. Overview Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950 border border-slate-800/70 p-3.5 rounded-xl flex flex-col justify-between relative overflow-hidden group hover:border-slate-700 transition-colors">
              <div className="absolute right-2 top-2 h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Activity className="h-4 w-4 text-blue-400" />
              </div>
              <span className="text-xs text-slate-400 font-medium mb-2">
                Total Feeders
              </span>
              <span className="text-2xl font-bold text-white tracking-tight">
                {feeders.length}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 font-semibold">
                {totalFeederLength.toFixed(1)} km Total Line
              </span>
            </div>
            <div className="bg-slate-950 border border-slate-800/70 p-3.5 rounded-xl flex flex-col justify-between relative overflow-hidden group hover:border-slate-700 transition-colors">
              <div className="absolute right-2 top-2 h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-amber-400" />
              </div>
              <span className="text-xs text-slate-400 font-medium mb-2">
                Total Towers
              </span>
              <span className="text-2xl font-bold text-white tracking-tight">
                {towers.length}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 font-semibold">
                Point Markers
              </span>
            </div>
          </div>

          {/* D. Layer Controls */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
              <Sliders className="h-4 w-4 text-cyan-400" />
              <span>Layer Controls</span>
            </div>

            <div className="space-y-3 bg-slate-950 border border-slate-850 p-4 rounded-2xl">
              {/* Feeder Layer Toggle */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => setShowFeeders(!showFeeders)}
                      className={`h-5 w-5 rounded flex items-center justify-center transition-colors ${
                        showFeeders
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {showFeeders ? (
                        <Eye className="h-3.5 w-3.5" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <span className="text-xs font-semibold text-slate-200">
                      220kV Feeder Line
                    </span>
                  </div>
                  <span className="h-2 w-8 rounded bg-gradient-to-r from-blue-500 to-purple-500" />
                </div>
                {showFeeders && (
                  <div className="pl-7 space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Opacity</span>
                      <span>{Math.round(feederOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={feederOpacity}
                      onChange={(e) =>
                        setFeederOpacity(parseFloat(e.target.value))
                      }
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                )}
              </div>

              <div className="h-px bg-slate-800/50" />

              {/* Tower Layer Toggle */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => setShowTowers(!showTowers)}
                      className={`h-5 w-5 rounded flex items-center justify-center transition-colors ${
                        showTowers
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {showTowers ? (
                        <Eye className="h-3.5 w-3.5" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <span className="text-xs font-semibold text-slate-200">
                      220kV Towers
                    </span>
                  </div>
                  <span className="h-3.5 w-3.5 rounded-full bg-amber-400 border border-white/40" />
                </div>
                {showTowers && (
                  <div className="pl-7 space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Opacity</span>
                      <span>{Math.round(towerOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={towerOpacity}
                      onChange={(e) =>
                        setTowerOpacity(parseFloat(e.target.value))
                      }
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* D2. Photo Manager */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
              <Camera className="h-4 w-4 text-cyan-400" />
              <span>Inspection Image Uploader</span>
            </div>

            <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl space-y-4">
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                Select an entire folder of inspection images. EXIF GPS tags are
                extracted locally and uploaded directly to S3.
              </p>

              {/* Upload Folders Layout */}
              <div className="grid grid-cols-2 gap-2">
                {/* RGB Folder Upload Button */}
                <label className="flex flex-col items-center justify-center border border-dashed border-cyan-500/20 hover:border-cyan-500/50 bg-cyan-950/10 hover:bg-cyan-950/20 rounded-xl p-3.5 cursor-pointer text-center group transition-all">
                  <Camera className="h-5 w-5 text-cyan-400 group-hover:scale-110 transition-transform mb-1.5" />
                  <span className="text-[10px] font-bold text-slate-200">
                    Upload RGB
                  </span>
                  <span className="text-[8px] text-slate-500 mt-0.5">
                    Folder
                  </span>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFolderUpload(e, 'rgb')}
                    {...({
                      webkitdirectory: 'true',
                      directory: 'true',
                    } as any)}
                  />
                </label>

                {/* Thermal Folder Upload Button */}
                <label className="flex flex-col items-center justify-center border border-dashed border-orange-500/20 hover:border-orange-500/50 bg-orange-950/10 hover:bg-orange-950/20 rounded-xl p-3.5 cursor-pointer text-center group transition-all">
                  <Flame className="h-5 w-5 text-orange-400 group-hover:scale-110 transition-transform mb-1.5" />
                  <span className="text-[10px] font-bold text-slate-200">
                    Upload Thermal
                  </span>
                  <span className="text-[8px] text-slate-500 mt-0.5">
                    Folder
                  </span>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFolderUpload(e, 'thermal')}
                    {...({
                      webkitdirectory: 'true',
                      directory: 'true',
                    } as any)}
                  />
                </label>
              </div>

              {/* Linked / Uploaded Media List */}
              {photos.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-900/60 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 pr-1">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Linked Media ({photos.length})
                  </div>
                  {photos.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-[10px] py-1.5 border-b border-slate-900/40"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        {p.type === 'thermal' ? (
                          <span className="text-[8px] font-bold uppercase px-1 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/25 shrink-0">
                            Thermal
                          </span>
                        ) : (
                          <span className="text-[8px] font-bold uppercase px-1 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 shrink-0">
                            RGB
                          </span>
                        )}
                        <span
                          className="text-slate-300 font-semibold truncate max-w-[100px]"
                          title={p.name}
                        >
                          {p.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {p.towerId ? (
                          <button
                            onClick={() => {
                              const tower = towers.find(
                                (t) => t.id === p.towerId,
                              )
                              if (tower) zoomToFeature(tower)
                            }}
                            className="text-amber-400 font-bold bg-amber-500/10 px-1 py-0.5 rounded border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                          >
                            {p.towerId} ({p.distance?.toFixed(0)}m)
                          </button>
                        ) : (
                          <span className="text-slate-500 font-bold bg-slate-800 px-1 py-0.5 rounded">
                            Unlinked
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* E. Selection Info Placeholder */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
              <Info className="h-4 w-4 text-cyan-400" />
              <span>Feature Details</span>
            </div>
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl text-center text-xs text-slate-400 leading-relaxed animate-pulse">
              Click on a tower or feeder line on the map to open the Feature
              Details modal.
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 text-slate-500 text-[10px] text-center font-medium">
          WebGIS Engine &copy; 2026. Made with OpenLayers & React.
        </div>
      </div>

      {/* 2. Map Panel */}
      <div className="flex-1 h-full relative bg-slate-950">
        <div ref={mapRef} className="w-full h-full" />

        {/* Map Header Overlay */}
        <div className="absolute top-5 left-5 pointer-events-none z-10 flex gap-2.5">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              title="Show Control Panel"
              className="bg-slate-900/90 backdrop-blur-md border border-slate-800/80 p-2 rounded-xl shadow-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all active:scale-95 pointer-events-auto flex items-center justify-center cursor-pointer"
            >
              <ChevronRight className="h-4.5 w-4.5" />
            </button>
          )}
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/40 px-4 py-2 rounded-2xl flex items-center gap-2.5 shadow-xl pointer-events-auto">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-semibold text-slate-200">
              220kV Mendhasal - Bidanasi DC Line
            </span>
          </div>
        </div>

        {/* Map Controls Floating Navigation */}
        <div className="absolute top-5 right-5 z-10 flex items-center gap-3 bg-slate-900/90 backdrop-blur-md border border-slate-800/80 p-1.5 rounded-2xl shadow-2xl pointer-events-auto">
          {/* Navigation Controls: Zoom & Fit */}
          <div className="flex items-center gap-1 px-1">
            <button
              onClick={handleZoomIn}
              title="Zoom In"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={handleZoomOut}
              title="Zoom Out"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all active:scale-95"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              onClick={handleResetView}
              title="Reset View"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all active:scale-95"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>

          <div className="w-px h-6 bg-slate-800" />

          {/* Basemaps Toggles */}
          <div className="flex items-center gap-1 px-1">
            {[
              {
                id: 'dark',
                label: 'Dark',
                icon: <Moon className="h-3.5 w-3.5" />,
              },
              {
                id: 'light',
                label: 'Light',
                icon: <Sun className="h-3.5 w-3.5" />,
              },
              {
                id: 'osm',
                label: 'OSM',
                icon: <Layers className="h-3.5 w-3.5" />,
              },
              {
                id: 'satellite',
                label: 'Satellite',
                icon: <Compass className="h-3.5 w-3.5" />,
              },
            ].map((b) => (
              <button
                key={b.id}
                onClick={() => setBasemap(b.id as any)}
                title={`Switch to ${b.label} basemap`}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  basemap === b.id
                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-md shadow-cyan-500/5'
                    : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {b.icon}
                <span className="hidden sm:inline">{b.label}</span>
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-slate-800" />

          {/* Layer Visibility Toggles */}
          <div className="flex items-center gap-1 px-1">
            {/* <button
              onClick={() => setShowFeeders(!showFeeders)}
              title="Toggle 220kV Feeder Lines"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                showFeeders
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                  : 'bg-transparent border-transparent text-slate-500 hover:text-slate-400 hover:bg-slate-800/50'
              }`}
            >
              {showFeeders ? (
                <Eye className="h-3.5 w-3.5" />
              ) : (
                <EyeOff className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">Feeders</span>
            </button> */}
            <button
              onClick={() => setShowTowers(!showTowers)}
              title="Toggle Transmission Towers"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                showTowers
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                  : 'bg-transparent border-transparent text-slate-500 hover:text-slate-400 hover:bg-slate-800/50'
              }`}
            >
              {showTowers ? (
                <Eye className="h-3.5 w-3.5" />
              ) : (
                <EyeOff className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">Towers</span>
            </button>
          </div>
        </div>

        {/* 3. In-Map Overlay Tooltip */}
        <div
          ref={tooltipRef}
          className="absolute bg-slate-900/90 backdrop-blur-md border border-slate-800 text-white text-xs px-3 py-1.5 rounded-lg shadow-2xl pointer-events-none whitespace-nowrap z-50 font-semibold"
          style={{ display: tooltipText ? 'block' : 'none' }}
        >
          {tooltipText}
        </div>

        {/* 4. Loader Overlay */}
        {loading && <LoadingComponent loadingStatus={loadingStatus} />}

        {/* 5. Error Overlay */}
        {error && <ErrorComponent error={error} />}

        {/* 5.5 Feature Details Modal */}
        {selectedFeature && (
          <div className="fixed inset-0 z-45 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-850 rounded-3xl w-full max-w-4xl h-[720px] flex flex-col overflow-hidden shadow-2xl relative">
              {/* Close Button */}
              <button
                onClick={() => {
                  setSelectedFeature(null)
                  setSelectedFeatureId(null)
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-950/50 p-2 rounded-full border border-slate-800 hover:border-slate-700 transition-all z-10 animate-pulse"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Top Tab Bar (only for towers) */}
              {selectedFeature.type === 'tower' && (
                <div className="flex border-b border-slate-800 shrink-0">
                  <button
                    onClick={() => setActiveDetailTab('info')}
                    className={`flex items-center gap-2 px-6 py-3 text-xs font-bold transition-all border-b-2 ${
                      activeDetailTab === 'info'
                        ? 'border-cyan-500 text-cyan-400 bg-slate-950/30'
                        : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-950/20'
                    }`}
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <span>Info & Photos</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveDetailTab('videos')
                      // Auto-select first span
                      if (!selectedSpan) {
                        const adj = getAdjacentTowers(selectedFeature.id)
                        if (adj.next) {
                          setSelectedSpan({
                            fromId: selectedFeature.id,
                            toId: adj.next.id,
                          })
                        } else if (adj.prev) {
                          setSelectedSpan({
                            fromId: adj.prev.id,
                            toId: selectedFeature.id,
                          })
                        }
                      }
                    }}
                    className={`flex items-center gap-2 px-6 py-3 text-xs font-bold transition-all border-b-2 ${
                      activeDetailTab === 'videos'
                        ? 'border-violet-500 text-violet-400 bg-slate-950/30'
                        : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-950/20'
                    }`}
                  >
                    <Video className="h-3.5 w-3.5" />
                    <span>Span Videos</span>
                  </button>
                  <button
                    onClick={() => setActiveDetailTab('tower-shorts')}
                    className={`flex items-center gap-2 px-6 py-3 text-xs font-bold transition-all border-b-2 ${
                      activeDetailTab === 'tower-shorts'
                        ? 'border-fuchsia-500 text-fuchsia-400 bg-slate-950/30'
                        : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-950/20'
                    }`}
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>Tower Videos</span>
                  </button>
                  <button
                    onClick={() => setActiveDetailTab('remarks')}
                    className={`flex items-center gap-2 px-6 py-3 text-xs font-bold transition-all border-b-2 ${
                      activeDetailTab === 'remarks'
                        ? 'border-emerald-500 text-emerald-400 bg-slate-950/30'
                        : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-950/20'
                    }`}
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Remarks Log</span>
                  </button>
                </div>
              )}

              {/* Tab Content */}
              {activeDetailTab === 'info' ||
              selectedFeature.type !== 'tower' ? (
                /* ===== INFO & PHOTOS TAB ===== */
                <div className="flex flex-1 min-h-0 divide-x divide-slate-800">
                  {/* Left Side: Feature Properties & Tab Selection */}
                  <div className="w-2/5 p-6 flex flex-col justify-between h-full bg-slate-900/50">
                    <div className="space-y-5">
                      {/* Header */}
                      <div>
                        <span
                          className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                            selectedFeature.type === 'tower'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          }`}
                        >
                          {selectedFeature.type === 'tower'
                            ? 'Tower'
                            : 'Feeder Line'}
                        </span>
                        <h3 className="font-bold text-lg text-white leading-snug break-words mt-2">
                          {selectedFeature.name}
                        </h3>
                      </div>

                      {/* Properties List */}
                      <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                        {Object.entries(selectedFeature.properties)
                          .filter(([key]) => {
                            const lowerKey = key.toLowerCase()
                            return (
                              !lowerKey.includes('feedername') &&
                              !lowerKey.includes('twrnum')
                            )
                          })
                          .map(([key, val]) => (
                            <div
                              key={key}
                              className="grid grid-cols-2 gap-2 py-1.5 border-b border-slate-800/60 text-xs"
                            >
                              <span className="text-slate-400 font-medium capitalize">
                                {key}
                              </span>
                              <span className="text-slate-200 font-semibold text-right break-words">
                                {val || 'N/A'}
                              </span>
                            </div>
                          ))}
                      </div>

                      {/* Image Tab Buttons (Only for towers) */}
                      {selectedFeature.type === 'tower' && (
                        <div className="space-y-2 pt-2">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                            Select Image Category
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setActiveImgTab('rgb')}
                              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                                activeImgTab === 'rgb'
                                  ? 'bg-cyan-500/15 border-cyan-500 text-cyan-400 shadow-md shadow-cyan-500/5'
                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                              }`}
                            >
                              <Camera className="h-4 w-4" />
                              <span>RGB ({rgbPhotos.length})</span>
                            </button>
                            <button
                              onClick={() => setActiveImgTab('thermal')}
                              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                                activeImgTab === 'thermal'
                                  ? 'bg-orange-500/15 border-orange-500 text-orange-400 shadow-md shadow-orange-500/5'
                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                              }`}
                            >
                              <Flame className="h-4 w-4" />
                              <span>Thermal ({thermalPhotos.length})</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Tower Reports (Only for towers) */}
                      {selectedFeature.type === 'tower' && (
                        <div className="space-y-2 pt-2 border-t border-slate-800/60">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                            Tower Reports (PDF)
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            {/* Thermal Report */}
                            {(() => {
                              const report = towerReports.find(
                                (r) => r.type === 'thermal',
                              )
                              return (
                                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-805 flex flex-col justify-between h-20">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <FileText className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-[10px] font-semibold text-slate-200 truncate">
                                        Thermal
                                      </span>
                                      <span className="text-[8px] text-slate-500 truncate">
                                        {report ? 'Available' : 'Missing'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex gap-1 mt-1.5">
                                    {report && (
                                      <a
                                        href={report.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex-1 text-center py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg text-[9px] font-bold border border-cyan-500/20 transition-colors"
                                      >
                                        View
                                      </a>
                                    )}
                                    <label className="flex-1 text-center py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[9px] font-bold border border-slate-700 cursor-pointer transition-colors flex items-center justify-center gap-1">
                                      {uploadingReport === 'thermal' ? (
                                        '...'
                                      ) : (
                                        <>
                                          <Upload className="h-2.5 w-2.5" />
                                          <span>
                                            {report ? 'Update' : 'Upload'}
                                          </span>
                                        </>
                                      )}
                                      <input
                                        type="file"
                                        accept=".pdf"
                                        className="hidden"
                                        disabled={uploadingReport !== null}
                                        onChange={(e) =>
                                          handleReportUpload(
                                            e,
                                            selectedFeature.id,
                                            'thermal',
                                          )
                                        }
                                      />
                                    </label>
                                  </div>
                                </div>
                              )
                            })()}

                            {/* Findings Report */}
                            {(() => {
                              const report = towerReports.find(
                                (r) => r.type === 'findings',
                              )
                              return (
                                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-805 flex flex-col justify-between h-20">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <FileText className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-[10px] font-semibold text-slate-200 truncate">
                                        Findings
                                      </span>
                                      <span className="text-[8px] text-slate-500 truncate">
                                        {report ? 'Available' : 'Missing'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex gap-1 mt-1.5">
                                    {report && (
                                      <a
                                        href={report.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex-1 text-center py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg text-[9px] font-bold border border-cyan-500/20 transition-colors"
                                      >
                                        View
                                      </a>
                                    )}
                                    <label className="flex-1 text-center py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[9px] font-bold border border-slate-700 cursor-pointer transition-colors flex items-center justify-center gap-1">
                                      {uploadingReport === 'findings' ? (
                                        '...'
                                      ) : (
                                        <>
                                          <Upload className="h-2.5 w-2.5" />
                                          <span>
                                            {report ? 'Update' : 'Upload'}
                                          </span>
                                        </>
                                      )}
                                      <input
                                        type="file"
                                        accept=".pdf"
                                        className="hidden"
                                        disabled={uploadingReport !== null}
                                        onChange={(e) =>
                                          handleReportUpload(
                                            e,
                                            selectedFeature.id,
                                            'findings',
                                          )
                                        }
                                      />
                                    </label>
                                  </div>
                                </div>
                              )
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Tab Contents (Images) */}
                  <div className="w-3/5 p-6 flex flex-col h-full bg-slate-950/20">
                    {selectedFeature.type === 'tower' ? (
                      <div className="flex flex-col h-full">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                          {activeImgTab === 'rgb' ? (
                            <>
                              <Camera className="h-4 w-4 text-cyan-400" />
                              <span>
                                RGB Inspection Photos ({rgbPhotos.length})
                              </span>
                            </>
                          ) : (
                            <>
                              <Flame className="h-4 w-4 text-orange-400" />
                              <span>
                                Thermal Inspection Photos (
                                {thermalPhotos.length})
                              </span>
                            </>
                          )}
                        </h4>

                        <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                          {activeImgTab === 'rgb' ? (
                            rgbPhotos.length > 0 ? (
                              <div className="grid grid-cols-3 gap-3">
                                {rgbPhotos.map((photo, i) => (
                                  <button
                                    key={i}
                                    onClick={() => setLightboxPhoto(photo)}
                                    className="group relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 hover:border-cyan-500 transition-all shadow-inner focus:outline-none"
                                  >
                                    <img
                                      src={photo.thumbnailUrl || photo.url}
                                      alt={photo.name}
                                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-cyan-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <Eye className="h-5 w-5 text-white" />
                                    </div>
                                    {photo.distance !== null && (
                                      <span className="absolute bottom-1 right-1 text-[8px] bg-slate-900/85 px-1 py-0.5 rounded text-cyan-400 font-bold border border-slate-850">
                                        {photo.distance.toFixed(0)}m
                                      </span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-8">
                                <Camera className="h-8 w-8 text-slate-700 mb-2" />
                                <span>No RGB photos uploaded.</span>
                              </div>
                            )
                          ) : thermalPhotos.length > 0 ? (
                            <div className="grid grid-cols-3 gap-3">
                              {thermalPhotos.map((photo, i) => (
                                <button
                                  key={i}
                                  onClick={() => setLightboxPhoto(photo)}
                                  className="group relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 hover:border-orange-500 transition-all shadow-inner focus:outline-none"
                                >
                                  <img
                                    src={photo.thumbnailUrl || photo.url}
                                    alt={photo.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                  />
                                  <div className="absolute inset-0 bg-orange-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Eye className="h-5 w-5 text-white" />
                                  </div>
                                  {photo.distance !== null && (
                                    <span className="absolute bottom-1 right-1 text-[8px] bg-slate-900/85 px-1 py-0.5 rounded text-orange-400 font-bold border border-slate-850">
                                      {photo.distance.toFixed(0)}m
                                    </span>
                                  )}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-8">
                              <Flame className="h-8 w-8 text-slate-700 mb-2" />
                              <span>No Thermal photos uploaded.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                        <Database className="h-10 w-10 text-slate-800 mb-2" />
                        <span>This feature has no inspection media.</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : activeDetailTab === 'videos' ? (
                /* ===== SPAN VIDEOS TAB ===== */
                <div className="flex-1 flex flex-col min-h-0 p-6 space-y-5">
                  {/* Span Selector */}
                  {(() => {
                    const adj = getAdjacentTowers(selectedFeature.id)
                    return (
                      <div className="space-y-2.5 shrink-0">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Select Tower Span
                        </span>
                        <div className="flex gap-2">
                          {adj.prev && (
                            <button
                              onClick={() =>
                                setSelectedSpan({
                                  fromId: adj.prev!.id,
                                  toId: selectedFeature.id,
                                })
                              }
                              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                                selectedSpan?.fromId === adj.prev.id &&
                                selectedSpan?.toId === selectedFeature.id
                                  ? 'bg-violet-500/15 border-violet-500 text-violet-400 shadow-md shadow-violet-500/5'
                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                              }`}
                            >
                              <ChevronLeft className="h-3.5 w-3.5" />
                              <span>
                                {adj.prev.name} → {selectedFeature.name}
                              </span>
                            </button>
                          )}
                          {adj.next && (
                            <button
                              onClick={() =>
                                setSelectedSpan({
                                  fromId: selectedFeature.id,
                                  toId: adj.next!.id,
                                })
                              }
                              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                                selectedSpan?.fromId === selectedFeature.id &&
                                selectedSpan?.toId === adj.next.id
                                  ? 'bg-violet-500/15 border-violet-500 text-violet-400 shadow-md shadow-violet-500/5'
                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                              }`}
                            >
                              <span>
                                {selectedFeature.name} → {adj.next.name}
                              </span>
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {!adj.prev && !adj.next && (
                            <div className="text-xs text-slate-500 italic">
                              No adjacent towers found for span selection.
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })()}

                  {/* Video Type Toggle */}
                  {selectedSpan && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => setActiveVideoTab('rgb')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                          activeVideoTab === 'rgb'
                            ? 'bg-cyan-500/15 border-cyan-500 text-cyan-400 shadow-md shadow-cyan-500/5'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <Camera className="h-4 w-4" />
                        <span>RGB Video</span>
                      </button>
                      <button
                        onClick={() => setActiveVideoTab('thermal')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                          activeVideoTab === 'thermal'
                            ? 'bg-orange-500/15 border-orange-500 text-orange-400 shadow-md shadow-orange-500/5'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <Flame className="h-4 w-4" />
                        <span>Thermal Video</span>
                      </button>
                    </div>
                  )}

                  {/* Video Content Area */}
                  {selectedSpan ? (
                    <div className="flex-1 flex flex-col min-h-0 space-y-4">
                      {/* Video Player or Placeholder */}
                      {fetchingVideo ? (
                        <div className="flex-1 flex flex-col items-center justify-center">
                          <div className="h-8 w-8 border-3 border-violet-500/20 border-t-violet-500 rounded-full animate-spin mb-3" />
                          <span className="text-xs text-slate-400 font-medium animate-pulse">
                            Loading span video...
                          </span>
                        </div>
                      ) : spanVideo ? (
                        <div className="flex-1 flex flex-col min-h-0">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                              <Play className="h-3.5 w-3.5 text-violet-400" />
                              <span>{spanVideo.filename}</span>
                            </h4>
                            <span className="text-[9px] text-slate-500 font-medium">
                              {new Date(
                                spanVideo.createdAt,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex-1 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 min-h-0">
                            <VideoPlayer src={spanVideo.url} />
                          </div>
                          {/* Replace existing video */}
                          <div className="flex items-center gap-3 mt-3 shrink-0">
                            <label className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 cursor-pointer transition-all">
                              {uploadingVideo ? (
                                <span className="animate-pulse">
                                  Uploading...
                                </span>
                              ) : (
                                <>
                                  <Upload className="h-3.5 w-3.5" />
                                  <span>Replace Video</span>
                                </>
                              )}
                              <input
                                type="file"
                                accept=".mp4,.webm,.mov"
                                className="hidden"
                                disabled={uploadingVideo}
                                onChange={(e) =>
                                  handleVideoUpload(
                                    e,
                                    selectedSpan.fromId,
                                    selectedSpan.toId,
                                    activeVideoTab,
                                  )
                                }
                              />
                            </label>
                            <span className="text-[9px] text-slate-500">
                              Only MP4, WebM, MOV
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                          <Video className="h-12 w-12 text-slate-700 mb-3" />
                          <span className="text-sm font-semibold text-slate-400 mb-1">
                            No {activeVideoTab === 'rgb' ? 'RGB' : 'Thermal'}{' '}
                            video for this span
                          </span>
                          <span className="text-xs text-slate-500 mb-5">
                            Upload a{' '}
                            {activeVideoTab === 'rgb' ? 'RGB' : 'Thermal'} drone
                            flyover video
                          </span>
                          <label className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 active:scale-[0.98]">
                            {uploadingVideo ? (
                              <span className="animate-pulse">
                                Uploading...
                              </span>
                            ) : (
                              <>
                                <Upload className="h-4 w-4" />
                                <span>
                                  Upload{' '}
                                  {activeVideoTab === 'rgb' ? 'RGB' : 'Thermal'}{' '}
                                  Video
                                </span>
                              </>
                            )}
                            <input
                              type="file"
                              accept=".mp4,.webm,.mov"
                              className="hidden"
                              disabled={uploadingVideo}
                              onChange={(e) =>
                                handleVideoUpload(
                                  e,
                                  selectedSpan.fromId,
                                  selectedSpan.toId,
                                  activeVideoTab,
                                )
                              }
                            />
                          </label>
                          <span className="text-[9px] text-slate-600 mt-2">
                            Only MP4, WebM, MOV
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs">
                      <Video className="h-10 w-10 text-slate-700 mb-2" />
                      <span>
                        Select a tower span above to view or upload videos.
                      </span>
                    </div>
                  )}
                </div>
              ) : activeDetailTab === 'tower-shorts' ? (
                /* ===== TOWER VIDEOS TAB ===== */
                <div className="flex-1 flex flex-col min-h-0 p-6 space-y-5">
                  {/* Video Type Toggle */}
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setActiveTowerVideoTab('rgb')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        activeTowerVideoTab === 'rgb'
                          ? 'bg-cyan-500/15 border-cyan-500 text-cyan-400 shadow-md shadow-cyan-500/5'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <Camera className="h-4 w-4" />
                      <span>RGB Video</span>
                    </button>
                    <button
                      onClick={() => setActiveTowerVideoTab('thermal')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        activeTowerVideoTab === 'thermal'
                          ? 'bg-orange-500/15 border-orange-500 text-orange-400 shadow-md shadow-orange-500/5'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <Flame className="h-4 w-4" />
                      <span>Thermal Video</span>
                    </button>
                  </div>

                  {/* Video Content Area */}
                  <div className="flex-1 flex flex-col min-h-0 space-y-4">
                    {fetchingTowerVideo ? (
                      <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="h-8 w-8 border-3 border-fuchsia-500/20 border-t-fuchsia-500 rounded-full animate-spin mb-3" />
                        <span className="text-xs text-slate-400 font-medium animate-pulse">
                          Loading tower video...
                        </span>
                      </div>
                    ) : towerVideo ? (
                      <div className="flex-1 flex flex-col min-h-0">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <Play className="h-3.5 w-3.5 text-fuchsia-400" />
                            <span>{towerVideo.filename}</span>
                          </h4>
                          <span className="text-[9px] text-slate-500 font-medium">
                            {new Date(
                              towerVideo.createdAt,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex-1 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 min-h-0">
                          <VideoPlayer
                            src={towerVideo.url}
                            poster={towerVideo.thumbnailUrl || undefined}
                          />
                        </div>
                        {/* Replace existing video */}
                        <div className="flex items-center gap-3 mt-3 shrink-0">
                          <label className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 cursor-pointer transition-all">
                            {uploadingTowerVideo ? (
                              <span className="animate-pulse">
                                Uploading...
                              </span>
                            ) : (
                              <>
                                <Upload className="h-3.5 w-3.5" />
                                <span>Replace Video</span>
                              </>
                            )}
                            <input
                              type="file"
                              accept=".mp4,.webm,.mov"
                              className="hidden"
                              disabled={uploadingTowerVideo}
                              onChange={(e) =>
                                handleTowerVideoUpload(
                                  e,
                                  selectedFeature.id,
                                  activeTowerVideoTab,
                                )
                              }
                            />
                          </label>
                          <span className="text-[9px] text-slate-500">
                            Only MP4, WebM, MOV
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                        <Video className="h-12 w-12 text-slate-700 mb-3" />
                        <span className="text-sm font-semibold text-slate-400 mb-1">
                          No {activeTowerVideoTab === 'rgb' ? 'RGB' : 'Thermal'}{' '}
                          video for this tower
                        </span>
                        <span className="text-xs text-slate-500 mb-5">
                          Upload a{' '}
                          {activeTowerVideoTab === 'rgb' ? 'RGB' : 'Thermal'}{' '}
                          drone short video
                        </span>
                        <label className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-fuchsia-600 to-pink-500 hover:from-fuchsia-700 hover:to-pink-600 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-lg shadow-fuchsia-500/20 hover:shadow-fuchsia-500/30 active:scale-[0.98]">
                          {uploadingTowerVideo ? (
                            <span className="animate-pulse">Uploading...</span>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" />
                              <span>
                                Upload{' '}
                                {activeTowerVideoTab === 'rgb'
                                  ? 'RGB'
                                  : 'Thermal'}{' '}
                                Video
                              </span>
                            </>
                          )}
                          <input
                            type="file"
                            accept=".mp4,.webm,.mov"
                            className="hidden"
                            disabled={uploadingTowerVideo}
                            onChange={(e) =>
                              handleTowerVideoUpload(
                                e,
                                selectedFeature.id,
                                activeTowerVideoTab,
                              )
                            }
                          />
                        </label>
                        <span className="text-[9px] text-slate-600 mt-2">
                          Only MP4, WebM, MOV
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* ===== REMARKS TAB ===== */
                <div className="flex-1 flex flex-col min-h-0 p-6 space-y-5">
                  {/* Header/Title */}
                  <div className="shrink-0 flex items-center justify-between border-b border-slate-800 pb-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-emerald-400" />
                      <span>Remarks Log ({remarks.length})</span>
                    </h4>
                  </div>

                  {/* Remarks List */}
                  <div className="flex-1 overflow-y-auto min-h-0 space-y-3.5 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                    {fetchingRemarks ? (
                      <div className="h-full flex flex-col items-center justify-center">
                        <div className="h-8 w-8 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-3" />
                        <span className="text-xs text-slate-400 font-medium animate-pulse">
                          Loading remarks...
                        </span>
                      </div>
                    ) : remarks.length > 0 ? (
                      remarks.map((remark) => (
                        <div
                          key={remark.id}
                          className="bg-slate-950/60 border border-slate-850 p-4 rounded-2xl space-y-2 relative group hover:border-slate-800 transition-all"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-200">
                              @{remark.user?.username || 'user'}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {new Date(remark.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {remark.text}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-8">
                        <MessageSquare className="h-8 w-8 text-slate-800 mb-2" />
                        <span>No remarks logged for this tower yet.</span>
                      </div>
                    )}
                  </div>

                  {/* New Remark Input Form */}
                  <div className="shrink-0 pt-3 border-t border-slate-800">
                    <div className="flex gap-2">
                      <textarea
                        value={newRemarkText}
                        onChange={(e) => setNewRemarkText(e.target.value)}
                        placeholder="Add a remark or maintenance log..."
                        disabled={submittingRemark}
                        className="flex-1 min-h-[44px] max-h-[120px] bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none transition-all resize-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleCreateRemark(selectedFeature.id)
                          }
                        }}
                      />
                      <button
                        onClick={() => handleCreateRemark(selectedFeature.id)}
                        disabled={submittingRemark || !newRemarkText.trim()}
                        className="shrink-0 flex items-center justify-center h-11 w-11 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white disabled:text-slate-500 rounded-xl transition-all shadow-lg shadow-emerald-600/10 hover:shadow-emerald-500/20 active:scale-[0.97]"
                      >
                        {submittingRemark ? (
                          <div className="h-4 w-4 border-2 border-slate-500/20 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Play className="h-4 w-4 rotate-0 translate-x-0.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 6. Lightbox Photo Album Overlay */}
        {lightboxPhoto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md transition-opacity duration-300">
            {/* Close button */}
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white bg-slate-900/60 p-2.5 rounded-full border border-slate-800 hover:border-slate-700 transition-all z-10"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="max-w-4xl w-full flex flex-col md:flex-row gap-6 p-6 bg-slate-900/90 border border-slate-800 rounded-3xl relative shadow-2xl mx-4 backdrop-blur-md">
              {/* Image Container */}
              <div className="flex-1 bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center relative min-h-[300px] max-h-[70vh] border border-slate-850">
                {imageLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm z-10">
                    <div className="h-10 w-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-3"></div>
                    <span className="text-xs text-slate-400 font-medium animate-pulse">
                      Loading original high-res image...
                    </span>
                  </div>
                )}
                <img
                  src={lightboxPhoto.url}
                  alt={lightboxPhoto.name}
                  onLoad={() => setImageLoading(false)}
                  className="max-w-full max-h-[70vh] object-contain"
                />
              </div>

              {/* Sidebar Details in Lightbox */}
              <div className="w-full md:w-80 flex flex-col justify-between py-2 space-y-6">
                <div className="space-y-4">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    Inspection Photo
                  </span>
                  <h3 className="text-white font-bold text-base leading-snug break-words">
                    {lightboxPhoto.name}
                  </h3>

                  <div className="space-y-2.5 pt-2">
                    <div className="grid grid-cols-2 py-1 border-b border-slate-850 text-xs">
                      <span className="text-slate-400 font-medium">
                        GPS Latitude
                      </span>
                      <span className="text-slate-200 font-semibold text-right">
                        {lightboxPhoto.lat.toFixed(6)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 py-1 border-b border-slate-850 text-xs">
                      <span className="text-slate-400 font-medium">
                        GPS Longitude
                      </span>
                      <span className="text-slate-200 font-semibold text-right">
                        {lightboxPhoto.lng.toFixed(6)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 py-1 border-b border-slate-850 text-xs">
                      <span className="text-slate-400 font-medium">
                        Linked Tower
                      </span>
                      <span className="text-amber-400 font-bold text-right">
                        {lightboxPhoto.towerId || 'None (Outside Buffer)'}
                      </span>
                    </div>
                    {lightboxPhoto.distance !== null && (
                      <div className="grid grid-cols-2 py-1 border-b border-slate-850 text-xs">
                        <span className="text-slate-400 font-medium">
                          Offset Distance
                        </span>
                        <span className="text-emerald-400 font-bold text-right">
                          {lightboxPhoto.distance.toFixed(2)} meters
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <a
                    href={lightboxPhoto.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl py-2.5 text-xs font-semibold transition-all text-center"
                  >
                    Open Original Image
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
