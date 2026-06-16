import 'ol/ol.css'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import OSM from 'ol/source/OSM'
import XYZ from 'ol/source/XYZ'
import VectorSource from 'ol/source/Vector'
import KML from 'ol/format/KML'
import Overlay from 'ol/Overlay'
import Feature from 'ol/Feature'
import { Style, Stroke, Fill, Circle, Icon } from 'ol/style'
import { getLength } from 'ol/sphere'
import { useEffect, useRef, useState, useMemo } from 'react'
import JSZip from 'jszip'
import {
  Layers,
  Search,
  Info,
  Map as MapIcon,
  Sliders,
  Activity,
  ChevronRight,
  X,
  Navigation,
  Loader2,
  Database,
  MapPin,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Compass
} from 'lucide-react'

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
  const [basemap, setBasemap] = useState<'dark' | 'light' | 'osm' | 'satellite'>('dark')

  const [selectedFeature, setSelectedFeature] = useState<ParsedFeature | null>(null)
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [tooltipText, setTooltipText] = useState('')

  // Map reference holders for OpenLayers objects
  const mapInstanceRef = useRef<Map | null>(null)
  const towerLayerRef = useRef<VectorLayer<VectorSource> | null>(null)
  const feederLayerRef = useRef<VectorLayer<VectorSource> | null>(null)
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
  const parseKmlDescription = (descriptionHtml: string): Record<string, string> => {
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
          if (key && key !== val && !key.toLowerCase().includes('feedername') && !key.toLowerCase().includes('twrnum')) {
            properties[key] = val
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
      }
    }
    return properties
  }

  // Load KMZ file: fetch, unzip, extract KML & base64 images, parse features
  const loadKmzFeatures = async (url: string) => {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to load ${url.split('/').pop()}: ${response.statusText}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    const zip = await JSZip.loadAsync(arrayBuffer)

    // Find the main KML file in the zip
    const kmlFileName = Object.keys(zip.files).find((name) => name.endsWith('.kml'))
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
        name.endsWith('.gif')
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
        const feature = featureLike as Feature
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
          const styles = typeof featureStyle === 'function' ? featureStyle(feature, 1) : featureStyle
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
            })
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
            })
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
            })
          )
        }

        return styles
      },
    })

    map.addLayer(feederLayer)
    map.addLayer(towerLayer)

    feederLayerRef.current = feederLayer
    towerLayerRef.current = towerLayer

    // 4. Map Event Listeners
    // Hover event for pointer changes & tooltip
    map.on('pointermove', (evt) => {
      if (evt.dragging) {
        tooltipOverlayRef.current?.setPosition(undefined)
        return
      }

      const pixel = map.getEventPixel(evt.originalEvent)
      const feature = map.forEachFeatureAtPixel(pixel, (feat) => feat, {
        layerFilter: (lyr) => lyr === feederLayer || lyr === towerLayer,
      })

      if (feature) {
        map.getTargetElement().style.cursor = 'pointer'
        const name = feature.get('name') || 'Feature'
        const type = feature.get('type') === 'tower' ? 'Tower' : 'Feeder'
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
          '/KML/FEEDER_220kV%20Mendhasal%20-%20Bidanasi%20DC%20Line.kmz'
        )

        setLoadingStatus('Downloading Tower KMZ...')
        const towerFeatures = await loadKmzFeatures(
          '/KML/TWR_220kV%20Mendhasal%20-%20Bidanasi%20DC%20Line.kmz'
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
            layerFilter: (lyr) => lyr === feederLayerRef.current || lyr === towerLayerRef.current,
          })

          if (feature) {
            const id = feature.get('id')
            const type = feature.get('type') as 'tower' | 'feeder'

            // Look up processed features
            const collection = type === 'tower' ? processedTowers : processedFeeders
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

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* 1. Glassmorphic Sidebar */}
      <div className="w-96 flex flex-col bg-slate-900 border-r border-slate-800 h-full shadow-2xl z-10 overflow-hidden shrink-0">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Compass className="h-5 w-5 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
                WebGIS Client
              </h1>
              <p className="text-xs text-slate-400 font-medium">Transmission Line Viewer</p>
            </div>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Live
          </span>
        </div>

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
                      <span className="font-medium truncate max-w-[200px]">{item.name}</span>
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
              <span className="text-xs text-slate-400 font-medium mb-2">Total Feeders</span>
              <span className="text-2xl font-bold text-white tracking-tight">{feeders.length}</span>
              <span className="text-[10px] text-slate-500 mt-1 font-semibold">
                {totalFeederLength.toFixed(1)} km Total Line
              </span>
            </div>
            <div className="bg-slate-950 border border-slate-800/70 p-3.5 rounded-xl flex flex-col justify-between relative overflow-hidden group hover:border-slate-700 transition-colors">
              <div className="absolute right-2 top-2 h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-amber-400" />
              </div>
              <span className="text-xs text-slate-400 font-medium mb-2">Total Towers</span>
              <span className="text-2xl font-bold text-white tracking-tight">{towers.length}</span>
              <span className="text-[10px] text-slate-500 mt-1 font-semibold">Point Markers</span>
            </div>
          </div>

          {/* C. Basemaps Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
              <MapIcon className="h-4 w-4 text-cyan-400" />
              <span>Basemaps</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'dark', label: 'Dark Matter', icon: <Moon className="h-3.5 w-3.5" /> },
                { id: 'light', label: 'Light Matter', icon: <Sun className="h-3.5 w-3.5" /> },
                { id: 'osm', label: 'OpenStreetMap', icon: <Layers className="h-3.5 w-3.5" /> },
                { id: 'satellite', label: 'Satellite', icon: <Compass className="h-3.5 w-3.5" /> }
              ].map((b) => (
                <button
                  key={b.id}
                  onClick={() => setBasemap(b.id as any)}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-medium border transition-all ${
                    basemap === b.id
                      ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-md shadow-cyan-500/5'
                      : 'bg-slate-950 border-slate-800/70 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {b.icon}
                  <span>{b.label}</span>
                </button>
              ))}
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
                        showFeeders ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {showFeeders ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                    <span className="text-xs font-semibold text-slate-200">220kV Feeder Line</span>
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
                      onChange={(e) => setFeederOpacity(parseFloat(e.target.value))}
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
                        showTowers ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {showTowers ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                    <span className="text-xs font-semibold text-slate-200">220kV Towers</span>
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
                      onChange={(e) => setTowerOpacity(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* E. Selection Properties Panel */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
                <Info className="h-4 w-4 text-cyan-400" />
                <span>Feature Details</span>
              </div>
              {selectedFeature && (
                <button
                  onClick={() => {
                    setSelectedFeature(null)
                    setSelectedFeatureId(null)
                  }}
                  className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 font-semibold"
                >
                  Clear
                </button>
              )}
            </div>

            {selectedFeature ? (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-xl relative overflow-hidden">
                {/* Visual Accent */}
                <div
                  className={`absolute top-0 left-0 bottom-0 w-1 ${
                    selectedFeature.type === 'tower' ? 'bg-amber-400' : 'bg-blue-500'
                  }`}
                />

                <div className="pl-2.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    {selectedFeature.type === 'tower' ? (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Tower
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        Feeder Line
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-white leading-snug break-words">
                    {selectedFeature.name}
                  </h3>
                </div>

                {/* Properties Table */}
                <div className="pl-2.5 max-h-60 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
                  {Object.entries(selectedFeature.properties).map(([key, val]) => (
                    <div key={key} className="grid grid-cols-2 gap-2 py-1 border-b border-slate-900/60 text-xs">
                      <span className="text-slate-400 font-medium capitalize">{key}</span>
                      <span className="text-slate-200 font-semibold text-right break-words">{val || 'N/A'}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="pl-2.5 pt-1.5 flex gap-2">
                  <button
                    onClick={() => zoomToFeature(selectedFeature)}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl py-2 px-3 text-xs font-semibold transition-all shadow-md shadow-cyan-500/10"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    <span>Zoom to Extent</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center">
                <Database className="h-8 w-8 text-slate-600 mb-3" />
                <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-[200px]">
                  Click on any tower or feeder line on the map to view its attributes.
                </p>
              </div>
            )}
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
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/40 px-4 py-2 rounded-2xl flex items-center gap-2.5 shadow-xl pointer-events-auto">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-semibold text-slate-200">
              220kV Mendhasal - Bidanasi DC Line
            </span>
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
        {loading && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center z-50 transition-opacity duration-300">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm text-center space-y-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
                </div>
              </div>
              <div>
                <h3 className="text-white font-bold text-base">Loading WebGIS Data</h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">{loadingStatus}</p>
              </div>
            </div>
          </div>
        )}

        {/* 5. Error Overlay */}
        {error && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center z-50">
            <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-red-500/25 flex items-center justify-center text-red-400">
                <X className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-red-400 font-bold text-base">Data Loading Failed</h3>
                <p className="text-xs text-slate-400 mt-1 font-medium leading-relaxed">{error}</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
              >
                Reload Application
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
