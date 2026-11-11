import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Crosshair, MapPin } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, Polygon, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { BOUNDARY_ATTRIBUTION, isInSindh, SINDH_BOUNDS, SINDH_RING } from '../lib/sindh'
import { hasLocation } from '../lib/validation'
import { Spinner } from './Feedback'

// Inline-SVG pin avoids Leaflet's default image paths, which break in bundled builds.
const PIN = L.divIcon({
  className: '',
  iconSize: [32, 42],
  iconAnchor: [16, 40],
  html: '<svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg"><path d="M16 1C8 1 1.5 7.3 1.5 15.2 1.5 26 16 41 16 41s14.5-15 14.5-25.8C30.5 7.3 24 1 16 1z" fill="#000" stroke="#fff" stroke-width="2"/><circle cx="16" cy="15" r="5.5" fill="#fff"/></svg>',
})

const SINDH_LATLNGS = SINDH_RING.map(([lng, lat]) => [lat, lng])

function ClickToMove({ onPick }) {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) })
  return null
}

/** Moves the map when `target` ({ lat, lng, zoom }) changes, e.g. a district was chosen. */
function FlyTo({ target }) {
  const map = useMap()
  useEffect(() => {
    if (hasLocation(target)) map.flyTo([target.lat, target.lng], target.zoom ?? Math.max(map.getZoom(), 16), { duration: 0.7 })
  }, [map, target])
  return null
}

/**
 * Map of Sindh for pinning a delivery location.
 * `value` = { lat, lng } or null. `focus` = { lat, lng, zoom } to move the map (e.g. the chosen district).
 * `readOnly` shows the delivery area without a pin (admin settings).
 */
export default function LocationPicker({ value, onChange, focus, readOnly = false, height = 'h-72' }) {
  const [locating, setLocating] = useState(false)
  const [geoError, setGeoError] = useState('')
  const [flyTarget, setFlyTarget] = useState(null)
  // Only the first render decides the initial view: the saved pin, else all of Sindh.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initial = useMemo(() => (hasLocation(value) ? { center: [value.lat, value.lng], zoom: 16 } : { bounds: SINDH_BOUNDS }), [])

  useEffect(() => {
    if (hasLocation(focus)) setFlyTarget(focus)
  }, [focus])

  const inside = isInSindh(value)

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Your browser does not support location. Tap the map instead.')
      return
    }
    setLocating(true)
    setGeoError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        onChange(next)
        setFlyTarget({ ...next, zoom: 16 })
        setLocating(false)
      },
      (err) => {
        setGeoError(err.code === 1 ? 'Location permission denied. Tap the map to drop your pin.' : 'Could not get your location. Tap the map instead.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  return (
    <div className="grid gap-2">
      <div className={`relative isolate overflow-hidden rounded-3xl border border-slate-100 ${height}`}>
        <MapContainer
          {...initial}
          boundsOptions={{ padding: [12, 12] }}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution={`&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · ${BOUNDARY_ATTRIBUTION}`}
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Polygon
            positions={SINDH_LATLNGS}
            interactive={false}
            pathOptions={{ color: '#00c2d1', weight: 2, fillColor: '#00c2d1', fillOpacity: 0.06 }}
          />
          {!readOnly && hasLocation(value) ? (
            <Marker
              position={[value.lat, value.lng]}
              icon={PIN}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const p = e.target.getLatLng()
                  onChange({ lat: p.lat, lng: p.lng })
                },
              }}
            />
          ) : null}
          {readOnly ? null : <ClickToMove onPick={onChange} />}
          <FlyTo target={flyTarget} />
        </MapContainer>
        {readOnly ? null : (
          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            className="absolute right-3 bottom-3 z-[500] inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-semibold shadow-md disabled:opacity-70"
          >
            {locating ? <Spinner className="h-3.5 w-3.5" /> : <Crosshair className="h-3.5 w-3.5" />}
            Use my location
          </button>
        )}
      </div>
      {geoError ? <p className="text-xs text-red-600">{geoError}</p> : null}
      {readOnly ? (
        <p className="text-xs text-slate-500">The outlined area is Sindh. Customers can pin any location inside it.</p>
      ) : !hasLocation(value) ? (
        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5" /> Choose your district, then tap the map or use your location to pin your exact address. Drag the pin to adjust.
        </p>
      ) : inside ? (
        <p className="text-xs font-medium text-emerald-700">✓ Pin is inside Sindh — we deliver here.</p>
      ) : (
        <p className="text-xs font-medium text-red-600">This pin is outside Sindh. We only deliver within Sindh.</p>
      )}
    </div>
  )
}
