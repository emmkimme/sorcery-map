import type { Writable } from 'stream';

import type * as minimist from 'minimist';
import { writable } from 'is-stream';

import type { SourceMapProps } from './SourceMap';

interface InputOptions {
    content?: { [file: string]: string };
    sourcemaps?: { [file: string]: SourceMapProps };
    sourceRootResolution?: string; // base path of the relative sources path in the map
    sourceMappingURLResolution?: string;
    verbose?: boolean;
}

interface OutputOptions {
    inline?: boolean;        // deprecated: sourceMappingURL === 'inline'
    absolutePath?: boolean;  // deprecated: sourceMappingURL === '[absolute-path]'
    sourceMappingURL?: 'inline' | '[absolute-path]' | '[base-path]';
    sourceMappingURLTemplate?: 'inline' | '[absolute-path]' | '[base-path]' | string;
    sourcePathTemplate?: '[absolute-path]' | '[relative-path]' | string;
    sourceRootBase?: string;
    sourceRoot?: string;
    excludeContent?: boolean;
    flatten?: 'full' | 'existing' | false
}

export interface Options extends InputOptions, OutputOptions {
}

/** @internal */
export function resolveOptions ( ...raw_options: Options[]): Options {
    const options = Object.assign({}, ...raw_options );

    options.flatten = options.flatten || 'full';

    options.sourceRootBase = options.sourceRootBase || options.base;
    options.sourcePathTemplate = options.sourcePathTemplate || '[relative-path]';

    const inline = ( options.inline === true );
    const absolutePath = ( options.absolutePath === true );
    const sourceMappingURL = inline ? 'inline' : absolutePath ? '[absolute-path]' : options.sourceMappingURL || '[base-path]';
    options.sourceMappingURLTemplate = options.sourceMappingURLTemplate || sourceMappingURL;

    return options;
}

/** @internal */
export function parseCommandLine ( command: minimist.ParsedArgs ): Options {
    const options: Options = { 
        inline: command.datauri,
        excludeContent: command.excludeContent,
        flatten: command.flatten,
        sourceRoot: command.sourceRoot,
    };
    command.output = command.output || command.input;
    return options;
}

/** @internal */
export function normalizeOuputOptions ( destOrStreamOrOptions?: string | Writable | Options, write_options?: Options ): { options: Options, map_output?: string | Writable } {
    let options: Options;
    let map_output: string | Writable;
    if ( typeof destOrStreamOrOptions === 'string' ) {
        options = Object.assign({}, write_options );
        map_output = destOrStreamOrOptions.replace( /\.map$/, '' );
    }
    else if ( typeof destOrStreamOrOptions === 'object' ) {
        if ( writable( destOrStreamOrOptions ) ) {
            options = Object.assign({}, write_options );

            map_output = destOrStreamOrOptions;
        }
        else {
            options = Object.assign({}, destOrStreamOrOptions );
        }
    }
    else {
        options = Object.assign({}, write_options );
    }
    return { options, map_output };
}