import { useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../auth/supabaseClient'
import { useAuth } from '../auth/AuthContext'
import { DEFAULT_MORPHISM_ID, isMorphismId, type MorphismId } from '../../design/presets'

/** Must match the product id used by the website's design system (src/data/products.ts). */
const APP_ID = 'browser'
const GLOBAL_ROW_ID = 'global'

/**
 * Resolves the PlourX design/morphism style for PlourX Browser and writes it to
 * <html data-design-style>. Same precedence and tables as the website:
 * user override -> admin app default -> global default -> PlourX Original.
 */
export function DesignStyleProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const userId = session?.user?.id ?? null
  const [designStyle, setDesignStyle] = useState<MorphismId>(DEFAULT_MORPHISM_ID)

  useEffect(() => {
    let active = true

    async function resolve() {
      try {
        const [globalRes, adminRes, userRes] = await Promise.all([
          supabase.from('design_global_settings').select('design_style').eq('id', GLOBAL_ROW_ID).maybeSingle(),
          supabase
            .from('design_admin_app_settings')
            .select('design_style, use_global_default')
            .eq('app_id', APP_ID)
            .maybeSingle(),
          userId
            ? supabase
                .from('design_user_app_preferences')
                .select('design_style')
                .eq('user_id', userId)
                .eq('app_id', APP_ID)
                .maybeSingle()
            : Promise.resolve({ data: null }),
        ])

        let next: MorphismId = DEFAULT_MORPHISM_ID
        if (isMorphismId(globalRes.data?.design_style)) next = globalRes.data.design_style
        if (adminRes.data && !adminRes.data.use_global_default && isMorphismId(adminRes.data.design_style)) {
          next = adminRes.data.design_style
        }
        if (isMorphismId(userRes.data?.design_style)) next = userRes.data.design_style
        if (active) setDesignStyle(next)
      } catch {
        // Never break PlourX Browser over a design lookup — keep the current style.
      }
    }

    void resolve()

    const channel = supabase
      .channel('browser-design-style')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'design_global_settings' }, () => void resolve())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'design_admin_app_settings' }, () => void resolve())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'design_user_app_preferences' }, () => void resolve())
      .subscribe()

    return () => {
      active = false
      void supabase.removeChannel(channel)
    }
  }, [userId])

  useEffect(() => {
    document.documentElement.dataset.designStyle = designStyle
  }, [designStyle])

  return <>{children}</>
}
