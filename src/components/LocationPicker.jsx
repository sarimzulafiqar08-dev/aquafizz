import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Crosshair, MapPin } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { DELIVERY_RADIUS_KM, isInDeliveryArea, SHOP_LOCATION } from '../lib/hyderabad'
import { hasLocation } from '../lib/validation'
import { Spinner } from './Feedback'

// Inline-SVG pin avoids Leaflet's default image paths, which break in bundled builds.
const PIN = L.divIcon({
  className: '',
  iconSize: [32, 42],
  iconAnchor: [16, 40],
  html: '<svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg"><path d="M16 1C8 1 1.5 7.3 1.5 15.2 1.5 26 16 41 16 41s14.5-15 14.5-25.8C30.5 7.3 24 1 16 1z" fill="#000" stroke="#fff" stroke-width="2"/><circle cx="16" cy="15" r="5.5" fill="#fff"/></svg>',
})

const SHOP = [SHOP_LOCATION.lat, SHOP_LOCATION.lng]
// Map view that fits the whole delivery circle (1° latitude ≈ 111 km).
const PAD = DELIVERY_RADIUS_KM / 111
const ZONE_BOUNDS = [
  [SHOP_LOCATION.lat - PAD, SHOP_LOCATION.lng - PAD / Math.cos((SHOP_LOCATION.lat * Math.PI) / 180)],
  [SHOP_LOCATION.lat + PAD, SHOP_LOCATION.lng + PAD / Math.cos((SHOP_LOCATION.lat * Math.PI) / 180)],
]

function ClickToMove({ onPick }) {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) })
  return null
}

/** Moves the map when `target` ({ lat, lng, zoom }) changes, e.g. an area was chosen. */
function FlyTo({ target }) {
  const map = useMap()
  useEffect(() => {
    if (hasLocation(target)) map.flyTo([target.lat, target.lng], target.zoom ?? Math.max(map.getZoom(), 16), { duration: 0.7 })
  }, [map, target])
  return null
}

/**
 * Map of Hyderabad for pinning a delivery location; the circle is the delivery area.
 * `value` = { lat, lng } or null. `focus` = { lat, lng, zoom } to move the map (e.g. the chosen area).
 * `readOnly` shows the delivery area without a pin (admin settings).
 */
export default function LocationPicker({ value, onChange, focus, readOnly = false, height = 'h-72' }) {
  const [locating, setLocating] = useState(false)
  const [geoError, setGeoError] = useState('')
  const [flyTarget, setFlyTarget] = useState(null)
  // Only the first render decides the initial view: the saved pin, else the whole delivery area.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initial = useMemo(() => (hasLocation(value) ? { center: [value.lat, value.lng], zoom: 16 } : { bounds: ZONE_BOUNDS }), [])

  useEffect(() => {
    if (hasLocation(focus)) setFlyTarget(focus)
  }, [focus])

  const inside = isInDeliveryArea(value)

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
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Circle
            center={SHOP}
            radius={DELIVERY_RADIUS_KM * 1000}
            interactive={false}
            pathOptions={{ color: '#138f96', weight: 2, fillColor: '#138f96', fillOpacity: 0.06 }}
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
        <p className="text-xs text-slate-500">
          The circle is the delivery area: {DELIVERY_RADIUS_KM} km around the shop in Hyderabad.
        </p>
      ) : !hasLocation(value) ? (
        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5" /> Choose your area, then tap the map or use your location to pin your exact address. Drag the pin to adjust.
        </p>
      ) : inside ? (
        <p className="text-xs font-medium text-emerald-700">✓ Pin is inside our Hyderabad delivery area — we deliver here.</p>
      ) : (
        <p className="text-xs font-medium text-red-600">This pin is outside our delivery area. We deliver within Hyderabad only.</p>
      )}
    </div>
  )
}
