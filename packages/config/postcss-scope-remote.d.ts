import type { Plugin } from 'postcss';

export declare function scopeRemoteUtilities(options: { remote: string; include: RegExp }): Plugin;
export declare const REMOTE_SCOPE_ATTRIBUTE: 'data-nexo-remote';
