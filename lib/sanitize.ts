export function sanitizeHtml(input: string): string {
    if (!input) return '';
    let html = String(input);
    
    // Remove script/style/iframe/object embeds and their content
    html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    html = html.replace(/<\/?(iframe|object|embed)[^>]*>/gi, '');
    
    // Drop event handlers like onclick=, onerror=, etc.
    html = html.replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, '');
    
    // Sanitize img src to allow only http(s) and data:image
    html = html.replace(/(<img\b[^>]*\bsrc\s*=\s*)(["'])([^"'>]+)\2/gi, (m, p1, q, url) => {
        const safe = /^https?:\/\//i.test(url) || /^data:image\//i.test(url) ? url : '';
        return `${p1}${q}${safe}${q}`;
    });
    
    // Remove javascript: protocols in any href/src
    html = html.replace(/(href|src)\s*=\s*(["'])\s*javascript:[^"'>]*\2/gi, '$1=$2$2');
    
    return html;
}





