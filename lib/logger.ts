import { getCloudflareContext } from '@opennextjs/cloudflare';

type MaybeError = unknown | Error;

function getErrorMessageAndStack(err: MaybeError): { message: string; stack: string | null } {
    try {
        if (!err) return { message: 'Unknown error', stack: null };
        if (err instanceof Error) {
            return { message: err.message, stack: err.stack ?? null };
        }
        if (typeof err === 'string') return { message: err, stack: null };
        return { message: JSON.stringify(err), stack: null };
    } catch {
        return { message: 'Unserializable error', stack: null };
    }
}

async function insertErrorLog(params: {
    method: string;
    url: string;
    status: number;
    userAgent: string | null;
    ip: string | null;
    referer: string | null;
    errorMessage: string | null;
    errorStack: string | null;
}) {
    const { env } = await getCloudflareContext();
    try {
        await env.DB
            .prepare(
                `INSERT INTO api_error_logs (created_at, method, url, status, user_agent, ip, referer, error_message, error_stack)
                 VALUES (datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?)`
            )
            .bind(
                params.method,
                params.url,
                params.status,
                params.userAgent,
                params.ip,
                params.referer,
                params.errorMessage,
                params.errorStack
            )
            .run();
    } catch (e) {
        // 避免日志写入失败影响业务流程
        const { message } = getErrorMessageAndStack(e);
        console.log('[log][api_error_logs][failed]', message);
    }
}

export async function log5xx(request: Request, status: number, error?: MaybeError) {
    try {
        const url = new URL(request.url);
        const method = request.method || 'GET';
        const headers = request.headers;
        const userAgent = headers.get('user-agent');
        const ip = headers.get('cf-connecting-ip') || headers.get('x-forwarded-for');
        const referer = headers.get('referer');

        const { message, stack } = getErrorMessageAndStack(error);

        // 控制台输出（按需求使用 console.log）
        console.log('[500+]', {
            method,
            path: url.pathname,
            status,
            userAgent,
            ip,
            referer,
            message,
        });

        await insertErrorLog({
            method,
            url: url.toString(),
            status,
            userAgent,
            ip,
            referer,
            errorMessage: message,
            errorStack: stack,
        });
    } catch (e) {
        const { message } = getErrorMessageAndStack(e);
        console.log('[log5xx][failed]', message);
    }
}

export function withApiLogging<TResponse extends Response | Record<string, unknown> = Response>(
    handler: (request: Request) => Promise<TResponse>
) {
    return async function wrapped(request: Request): Promise<TResponse> {
        try {
            const res = await handler(request);
            const status: number = (res && typeof res === 'object' && 'status' in res && typeof res.status === 'number') 
                ? res.status 
                : 200;
            if (status >= 500) {
                await log5xx(request, status);
            }
            return res;
        } catch (error) {
            await log5xx(request, 500, error);
            throw error;
        }
    };
}


