'use client'

import { useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type AreaMode = 'city' | 'radius' | 'cities' | 'online'

export type AreaValue = {
  mode: AreaMode
  /** Human-readable label stored in display_area */
  displayArea: string
  /** Representative lat for PostGIS point (null for online) */
  lat: number | null
  /** Representative lng */
  lng: number | null
  /** km, only for 'radius' mode */
  radiusKm?: number
  /** Precise street address shown to assigned tasker (generates Maps link) */
  address?: string
}

interface Props {
  value: AreaValue
  onChange: (v: AreaValue) => void
  /** Hide the "Online" mode when parent already handles remote type */
  hideOnline?: boolean
}

// ─── City data (50 major Indian cities) ──────────────────────────────────────

const CITIES: { name: string; state: string; lat: number; lng: number }[] = [
  { name: 'Mumbai',         state: 'MH', lat: 19.0760, lng: 72.8777 },
  { name: 'Delhi',          state: 'DL', lat: 28.7041, lng: 77.1025 },
  { name: 'Bengaluru',      state: 'KA', lat: 12.9716, lng: 77.5946 },
  { name: 'Hyderabad',      state: 'TG', lat: 17.3850, lng: 78.4867 },
  { name: 'Ahmedabad',      state: 'GJ', lat: 23.0225, lng: 72.5714 },
  { name: 'Chennai',        state: 'TN', lat: 13.0827, lng: 80.2707 },
  { name: 'Kolkata',        state: 'WB', lat: 22.5726, lng: 88.3639 },
  { name: 'Surat',          state: 'GJ', lat: 21.1702, lng: 72.8311 },
  { name: 'Pune',           state: 'MH', lat: 18.5204, lng: 73.8567 },
  { name: 'Jaipur',         state: 'RJ', lat: 26.9124, lng: 75.7873 },
  { name: 'Lucknow',        state: 'UP', lat: 26.8467, lng: 80.9462 },
  { name: 'Kanpur',         state: 'UP', lat: 26.4499, lng: 80.3319 },
  { name: 'Nagpur',         state: 'MH', lat: 21.1458, lng: 79.0882 },
  { name: 'Indore',         state: 'MP', lat: 22.7196, lng: 75.8577 },
  { name: 'Bhopal',         state: 'MP', lat: 23.2599, lng: 77.4126 },
  { name: 'Patna',          state: 'BR', lat: 25.5941, lng: 85.1376 },
  { name: 'Vadodara',       state: 'GJ', lat: 22.3072, lng: 73.1812 },
  { name: 'Ludhiana',       state: 'PB', lat: 30.9010, lng: 75.8573 },
  { name: 'Agra',           state: 'UP', lat: 27.1767, lng: 78.0081 },
  { name: 'Nashik',         state: 'MH', lat: 19.9975, lng: 73.7898 },
  { name: 'Varanasi',       state: 'UP', lat: 25.3176, lng: 82.9739 },
  { name: 'Meerut',         state: 'UP', lat: 28.9845, lng: 77.7064 },
  { name: 'Rajkot',         state: 'GJ', lat: 22.3039, lng: 70.8022 },
  { name: 'Kalyan',         state: 'MH', lat: 19.2403, lng: 73.1305 },
  { name: 'Vasai-Virar',    state: 'MH', lat: 19.3919, lng: 72.8397 },
  { name: 'Amritsar',       state: 'PB', lat: 31.6340, lng: 74.8723 },
  { name: 'Jabalpur',       state: 'MP', lat: 23.1815, lng: 79.9864 },
  { name: 'Prayagraj',      state: 'UP', lat: 25.4358, lng: 81.8463 },
  { name: 'Coimbatore',     state: 'TN', lat: 11.0168, lng: 76.9558 },
  { name: 'Kochi',          state: 'KL', lat: 9.9312,  lng: 76.2673 },
  { name: 'Thiruvananthapuram', state: 'KL', lat: 8.5241, lng: 76.9366 },
  { name: 'Visakhapatnam',  state: 'AP', lat: 17.6868, lng: 83.2185 },
  { name: 'Vijayawada',     state: 'AP', lat: 16.5062, lng: 80.6480 },
  { name: 'Madurai',        state: 'TN', lat: 9.9252,  lng: 78.1198 },
  { name: 'Gurgaon',        state: 'HR', lat: 28.4595, lng: 77.0266 },
  { name: 'Noida',          state: 'UP', lat: 28.5355, lng: 77.3910 },
  { name: 'Faridabad',      state: 'HR', lat: 28.4089, lng: 77.3178 },
  { name: 'Ghaziabad',      state: 'UP', lat: 28.6692, lng: 77.4538 },
  { name: 'Chandigarh',     state: 'CH', lat: 30.7333, lng: 76.7794 },
  { name: 'Raipur',         state: 'CG', lat: 21.2514, lng: 81.6296 },
  { name: 'Jodhpur',        state: 'RJ', lat: 26.2389, lng: 73.0243 },
  { name: 'Kota',           state: 'RJ', lat: 25.2138, lng: 75.8648 },
  { name: 'Dehradun',       state: 'UK', lat: 30.3165, lng: 78.0322 },
  { name: 'Ranchi',         state: 'JH', lat: 23.3441, lng: 85.3096 },
  { name: 'Guwahati',       state: 'AS', lat: 26.1445, lng: 91.7362 },
  { name: 'Bhubaneswar',    state: 'OD', lat: 20.2961, lng: 85.8245 },
  { name: 'Hubli',          state: 'KA', lat: 15.3647, lng: 75.1240 },
  { name: 'Mysuru',         state: 'KA', lat: 12.2958, lng: 76.6394 },
  { name: 'Tiruchirappalli', state: 'TN', lat: 10.7905, lng: 78.7047 },
  { name: 'Goa (Panaji)',   state: 'GA', lat: 15.4909, lng: 73.8278 },
] as const

const RADII = [5, 10, 20, 50, 100] as const

const MODES: { id: AreaMode; icon: string; label: string }[] = [
  { id: 'city',   icon: '🏙',  label: 'City' },
  { id: 'radius', icon: '🗺',  label: 'City + radius' },
  { id: 'cities', icon: '📍',  label: 'Multiple cities' },
  { id: 'online', icon: '💻',  label: 'Online' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function AreaPicker({ value, onChange, hideOnline = false }: Props) {
  const [citySearch, setCitySearch] = useState('')
  const [showCityList, setShowCityList] = useState(false)

  const modes = hideOnline ? MODES.filter(m => m.id !== 'online') : MODES

  function setMode(mode: AreaMode) {
    if (mode === 'online') {
      onChange({ mode, displayArea: 'Online / Remote', lat: null, lng: null })
    } else {
      onChange({ mode, displayArea: '', lat: null, lng: null, radiusKm: 10 })
    }
    setCitySearch('')
    setShowCityList(false)
  }

  function pickCity(city: typeof CITIES[number]) {
    if (value.mode === 'city') {
      onChange({ ...value, displayArea: `${city.name}, ${city.state}`, lat: city.lat, lng: city.lng })
    } else if (value.mode === 'radius') {
      const r = value.radiusKm ?? 10
      onChange({ ...value, displayArea: `Within ${r}km of ${city.name}`, lat: city.lat, lng: city.lng })
    } else if (value.mode === 'cities') {
      const existing = value.displayArea ? value.displayArea.split(', ') : []
      if (!existing.includes(city.name)) {
        const next = [...existing, city.name]
        onChange({ ...value, displayArea: next.join(', '), lat: city.lat, lng: city.lng })
      }
    }
    setCitySearch('')
    setShowCityList(false)
  }

  function removeCity(name: string) {
    const next = value.displayArea.split(', ').filter(c => c !== name)
    onChange({ ...value, displayArea: next.join(', ') })
  }

  function setRadius(r: number) {
    const cityPart = value.lat !== null
      ? CITIES.find(c => Math.abs(c.lat - (value.lat ?? 0)) < 0.01)?.name ?? ''
      : ''
    onChange({
      ...value,
      radiusKm: r,
      displayArea: cityPart ? `Within ${r}km of ${cityPart}` : '',
    })
  }

  const filteredCities = CITIES.filter(c =>
    c.name.toLowerCase().includes(citySearch.toLowerCase()) ||
    c.state.toLowerCase().includes(citySearch.toLowerCase())
  ).slice(0, 8)

  const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 text-sm'

  return (
    <div className="space-y-3">
      {/* Mode tabs */}
      <div className="flex gap-2 flex-wrap">
        {modes.map(m => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
              value.mode === m.id
                ? 'bg-amber-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* Online */}
      {value.mode === 'online' && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800 font-medium">
          💻 No location needed — this task can be done from anywhere.
        </div>
      )}

      {/* City (single) */}
      {value.mode === 'city' && (
        <div className="relative">
          <input
            type="text"
            className={inputClass}
            placeholder="Search city…"
            value={citySearch || value.displayArea}
            onFocus={() => { setCitySearch(''); setShowCityList(true) }}
            onChange={e => { setCitySearch(e.target.value); setShowCityList(true) }}
          />
          {showCityList && (
            <CityDropdown
              cities={filteredCities}
              onPick={pickCity}
              onClose={() => setShowCityList(false)}
            />
          )}
          {value.displayArea && !showCityList && (
            <p className="mt-1 text-xs text-gray-500">📍 {value.displayArea}</p>
          )}
        </div>
      )}

      {/* City + radius */}
      {value.mode === 'radius' && (
        <div className="space-y-2">
          <div className="relative">
            <input
              type="text"
              className={inputClass}
              placeholder="Pick a city…"
              value={citySearch || (value.lat ? CITIES.find(c => Math.abs(c.lat - (value.lat ?? 0)) < 0.01)?.name ?? '' : '')}
              onFocus={() => { setCitySearch(''); setShowCityList(true) }}
              onChange={e => { setCitySearch(e.target.value); setShowCityList(true) }}
            />
            {showCityList && (
              <CityDropdown
                cities={filteredCities}
                onPick={pickCity}
                onClose={() => setShowCityList(false)}
              />
            )}
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-gray-600">Radius</p>
            <div className="flex gap-2 flex-wrap">
              {RADII.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRadius(r)}
                  className={`rounded-full px-3 py-1 text-sm font-semibold transition-colors ${
                    value.radiusKm === r
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {r} km
                </button>
              ))}
            </div>
          </div>
          {value.displayArea && (
            <p className="text-xs text-gray-500">🗺 {value.displayArea}</p>
          )}
        </div>
      )}

      {/* Multiple cities */}
      {value.mode === 'cities' && (
        <div className="space-y-2">
          {value.displayArea && (
            <div className="flex flex-wrap gap-2">
              {value.displayArea.split(', ').filter(Boolean).map(city => (
                <span key={city} className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
                  {city}
                  <button
                    type="button"
                    onClick={() => removeCity(city)}
                    className="ml-0.5 text-amber-500 hover:text-amber-700"
                    aria-label={`Remove ${city}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="relative">
            <input
              type="text"
              className={inputClass}
              placeholder="Add a city…"
              value={citySearch}
              onFocus={() => setShowCityList(true)}
              onChange={e => { setCitySearch(e.target.value); setShowCityList(true) }}
            />
            {showCityList && (
              <CityDropdown
                cities={filteredCities}
                onPick={pickCity}
                onClose={() => setShowCityList(false)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Address input (precise, shown to assigned tasker) ───────────────────────

interface AddressInputProps {
  placeholder?: string
  onAddress: (address: string, lat: number | null, lng: number | null) => void
}

export function AddressInput({ placeholder = 'Exact address for Tasker (optional)', onAddress }: AddressInputProps) {
  const [value, setValue] = useState('')
  return (
    <div>
      <input
        type="text"
        value={value}
        onChange={e => { setValue(e.target.value); onAddress(e.target.value, null, null) }}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
      />
      <p className="mt-1 text-xs text-gray-400">Shared only with the assigned Tasker — includes Google Maps link</p>
    </div>
  )
}

// ─── City dropdown ────────────────────────────────────────────────────────────

function CityDropdown({
  cities,
  onPick,
  onClose,
}: {
  cities: readonly { name: string; state: string; lat: number; lng: number }[]
  onPick: (c: { name: string; state: string; lat: number; lng: number }) => void
  onClose: () => void
}) {
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-52 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
        {cities.length === 0 ? (
          <li className="px-4 py-3 text-sm text-gray-400">No cities found</li>
        ) : (
          cities.map(c => (
            <li key={c.name}>
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); onPick(c) }}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-amber-50"
              >
                <span className="font-medium text-gray-900">{c.name}</span>
                <span className="text-xs text-gray-400">{c.state}</span>
              </button>
            </li>
          ))
        )}
      </ul>
    </>
  )
}
