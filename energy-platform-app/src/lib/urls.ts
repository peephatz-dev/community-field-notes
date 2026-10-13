export const BASE_PATH = process.env.NODE_ENV === 'production' ? '/community-field-notes/energy-platform' : '';
export const platformUrl = (path: string) => `${BASE_PATH}${path === '/' ? '/' : `/${path.replace(/^\/+|\/+$/g, '')}/`}`;
