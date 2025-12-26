export function textToNumericCode(text: string): string {
    let hash = 0;
    const normalized = text.toLowerCase().trim();
    for (let i = 0; i < normalized.length; i++) {
        hash = ((hash << 5) - hash) + normalized.charCodeAt(i);
        hash = hash & hash;
    }
    const positive = Math.abs(hash);
    return positive.toString().padStart(9, '0').slice(0, 9);
}

export function formatDateToInt(dateString: string): string {
    return dateString.replace(/-/g, '');
}