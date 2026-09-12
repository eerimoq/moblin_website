/** Prefix a path under public/ with the site's base URL. */
export const asset = (path: string) => import.meta.env.BASE_URL + path.replace(/^\//, "");
