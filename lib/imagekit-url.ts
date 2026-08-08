export function ikUrl(url?: string | null, opts = 'w-1200,q-80,f-auto') {
    if (!url || !url.includes('ik.imagekit.io')) return url ?? '';
    return `${url}?tr=${opts}`;
}
