import { DEFAULT_MORPHISM_ID, isMorphismId, type MorphismId } from './presets';

export type DesignSource = 'user' | 'admin-app' | 'global' | 'fallback';

export interface AdminAppSetting {
  designStyle: MorphismId;
  useGlobalDefault: boolean;
}

export interface ResolveDesignStyleInput {
  userOverride?: MorphismId | null;
  adminAppSetting?: AdminAppSetting | null;
  globalDesignStyle?: MorphismId | null;
}

export interface ResolvedDesignStyle {
  designStyle: MorphismId;
  source: DesignSource;
}

/**
 * User App Override → Admin App Default → Global Admin Default → PlourX Original.
 * Never throws — any unrecognized/corrupt style id is coerced to the fallback
 * so a bad row or a missing migration can never leave the UI visually broken.
 */
export function resolveDesignStyle({
  userOverride,
  adminAppSetting,
  globalDesignStyle,
}: ResolveDesignStyleInput): ResolvedDesignStyle {
  if (isMorphismId(userOverride)) {
    return { designStyle: userOverride, source: 'user' };
  }

  if (adminAppSetting && !adminAppSetting.useGlobalDefault && isMorphismId(adminAppSetting.designStyle)) {
    return { designStyle: adminAppSetting.designStyle, source: 'admin-app' };
  }

  if (isMorphismId(globalDesignStyle)) {
    return { designStyle: globalDesignStyle, source: 'global' };
  }

  return { designStyle: DEFAULT_MORPHISM_ID, source: 'fallback' };
}
