import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase as supabaseClient } from '../../services/auth/supabaseClient'
import { useWebsiteEffects } from '../../hooks/useWebsiteEffects'
import { DEFAULT_SEASONAL_CONFIG, parseSeasonalConfig, resolveActiveSeason, type SeasonalConfig } from '../../design/seasons'
import { DEFAULT_FESTIVAL_CONFIG, detectCountry, parseFestivalConfig, resolveActiveFestival, type FestivalConfig } from '../../design/festivals'
import { SeasonalLayer } from './SeasonalLayer'
import { FestivalLayer } from './FestivalLayer'

/** Re-evaluate the calendar this often so an app left open across midnight still flips season / festival. */
const RECHECK_MS = 30 * 60 * 1000

/**
 * Applies the website admin's Seasonal Themes and Festival Themes to this app. Both are configured once on the website
 * (design_global_settings, row "global"); the database keeps them mutually exclusive, so at most one layer draws.
 * Changes reach every open app live. Decoration only: it never blocks the app, and it follows Settings > Appearance > Website effects.
 */
export function SeasonFestivalProvider({ children }: { children: ReactNode }) {
  const { enabled: effectsOn } = useWebsiteEffects()
  const [seasonal, setSeasonal] = useState<SeasonalConfig>(DEFAULT_SEASONAL_CONFIG)
  const [festival, setFestival] = useState<FestivalConfig>(DEFAULT_FESTIVAL_CONFIG)
  const [now, setNow] = useState(() => new Date())
  // On-device (time zone / language); nothing leaves the device.
  const [country] = useState(() => detectCountry())

  useEffect(() => {
    const supabase = supabaseClient as SupabaseClient | null
    if (!supabase) return
    let active = true
    const load = async () => {
      try {
        const { data, error } = await supabase.from('design_global_settings').select('seasonal_config, festival_config').eq('id', 'global').maybeSingle()
        if (!active || error || !data) return
        setSeasonal(parseSeasonalConfig(data.seasonal_config))
        setFestival(parseFestivalConfig(data.festival_config))
      } catch {
        // Keep the last good settings: decoration must never break the app.
      }
    }
    void load()
    const channel = supabase
      .channel('app-season-festival')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'design_global_settings' }, () => void load())
      .subscribe()
    return () => {
      active = false
      void supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    const tick = () => setNow(new Date())
    const id = window.setInterval(tick, RECHECK_MS)
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [])

  const season = useMemo(() => (seasonal.enabled ? resolveActiveSeason(seasonal, now, country) : null), [seasonal, now, country])
  const fest = useMemo(() => (festival.enabled ? resolveActiveFestival(festival, country, now) : null), [festival, country, now])
  // Festivals and Seasons are exclusive; if a stale read ever shows both, the festival wins.
  const shownSeason = effectsOn && !fest ? season : null
  const shownFestival = effectsOn ? fest : null

  useEffect(() => {
    const root = document.documentElement
    if (shownSeason) {
      root.setAttribute('data-season', shownSeason)
      root.setAttribute('data-season-anim', seasonal.animations ? 'on' : 'off')
    } else {
      root.removeAttribute('data-season')
      root.removeAttribute('data-season-anim')
    }
    if (shownFestival) root.setAttribute('data-festival', shownFestival.key)
    else root.removeAttribute('data-festival')
    return () => {
      root.removeAttribute('data-season')
      root.removeAttribute('data-season-anim')
      root.removeAttribute('data-festival')
    }
  }, [shownSeason, shownFestival, seasonal.animations])

  return (
    <>
      {shownSeason && <SeasonalLayer season={shownSeason} animated={seasonal.animations} intensity={seasonal.intensity} speed={seasonal.speed} />}
      {shownFestival && <FestivalLayer scene={shownFestival.def.scene} animated={festival.animations} intensity={festival.intensity} speed={festival.speed} />}
      {children}
    </>
  )
}
