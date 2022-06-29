import { writable } from 'is-stream';
import type * as minimist from 'minimist';
import type { Writable } from 'stream';

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
    sourceMappingURL?: 'inline' | '[absolute-path]';
    sourceMappingURLTemplate?: 'inline' | 'none' | '[absolute-path]' | '[relative-path]' | '[resource-path]' | string;
    sourceMappingURLBase?: string;
    sourcePathTemplate?: '[absolute-path]' | '[relative-path]' | '[resource-path]' | string;
    sourceRootBase?: string;
    sourceRoot?: string;
    excludeContent?: boolean;
    flatten?: 'full' | 'existing' | false
}

export interface Options extends InputOptions, OutputOptions {
}

/** @internal */
export function mergeOptions ( ...raw_options: Options[]): Options {
    const options = Object.assign({}, ...raw_options );

    options.flatten = options.flatten || 'full';

    options.sourceRootBase = options.sourceRootBase || options.base;
    options.sourcePathTemplate = options.sourcePathTemplate || '[relative-path]';

    const inline = ( options.inline === true );
    const absolutePath = ( options.absolutePath === true );
    const sourceMappingURL = inline ? 'inline' : absolutePath ? '[absolute-path]' : options.sourceMappingURL || '[relative-path]';
    options.sourceMappingURLTemplate = options.sourceMappingURLTemplate || sourceMappingURL;

    return options;
}

/** @internal */
export function parseSorceryCommandLine ( command: minimist.ParsedArgs ): Options {
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
export function parseExorcistCommandLine ( command: minimist.ParsedArgs ): Options {
    const options: Options = {
        sourceMappingURLTemplate: command.url,
        sourceRootBase: command.base,
        sourcePathTemplate: command.base ? '[relative-path]' : '[absolute-path]',
        // errorOnMissing
    };
    if ( command.root != null ) {
        options.sourceRoot = command.root;
    }

    return options;
}

/** @internal */
export function parseWriteOptions ( contentFileOrOptions?: string | Options, write_options?: Options ): { output?: string, options: Options } {
    let options: Options;
    let output: string;
    if ( typeof contentFileOrOptions === 'string' ) {
        options = Object.assign({}, write_options );
        output = contentFileOrOptions;
    }
    if ( typeof contentFileOrOptions === 'object' ) {
        options = Object.assign({}, contentFileOrOptions );
    }
    return { options, output };
}

export function parseTransformOptions ( mapFileOrStreamOrOptions?: string | Writable | Options, transform_options?: Options ): { output?: string | Writable, options: Options } {
    let options: Options;
    let output: string | Writable;
    if ( typeof mapFileOrStreamOrOptions === 'string' ) {
        options = Object.assign({}, transform_options );
        output = mapFileOrStreamOrOptions;
    }
    if ( typeof mapFileOrStreamOrOptions === 'object' ) {
        if ( writable( mapFileOrStreamOrOptions ) ) {
            options = Object.assign({}, transform_options );
            output = mapFileOrStreamOrOptions;
        }
        else {
            options = Object.assign({}, options );
        }
    }
    return { options, output };
}

