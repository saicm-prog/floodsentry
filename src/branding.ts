export const brandName = 'FloodSentry'

// Keep older stored text and model-written copy consistent with the current name.
export const normalizeBrandName = (value: string) => value.replace(/\bflood\s+sentry\b/gi, brandName)
