export default {
    log: (...message: unknown[]) => {
        console.log('[PROMETHEUS]'.magenta, ...message);
    },
    warn: (...message: unknown[]) => {
        console.warn('[PROMETHEUS]'.yellow, ...message);
    },
    error: (...message: unknown[]) => {
        console.error('[PROMETHEUS]'.red, ...message);
    },
};
