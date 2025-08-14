import { FEATURES, getFeature } from '../config/features';

/**
 * Hook to check if a feature is enabled
 * @param featureName - The feature to check
 * @returns boolean indicating if feature is enabled
 */
export function useFeatureFlag(featureName: keyof typeof FEATURES): boolean {
  return getFeature(featureName);
}

/**
 * Hook to check if V2 is enabled overall
 * @returns object with V2 status and helper methods
 */
export function useV2() {
  const isEnabled = Object.values(FEATURES).some(flag => flag === true);
  
  return {
    isV2: isEnabled,
    isV1: !isEnabled,
    hasFeature: (feature: keyof typeof FEATURES) => getFeature(feature),
    features: FEATURES,
  };
}