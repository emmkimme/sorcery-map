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
    sourceMappingURLTemplate?: 'inline' | 'none' | '[absolute-path]' | '[relative-path]' | '[resource-path]' | string;
    sourceMappingURLBase?: string;
    sourcePathTemplate?: '[absolute-path]' | '[relative-path]' | '[resource-path]' | string;
    sourcePathBase?: string;
    sourceRoot?: string;
    excludeContent?: boolean;
    flatten?: 'full' | 'existing' | false
}

interface DeprecatedOtions {
    inline? : boolean;
    absolutePath?: boolean;
    base?: string;
}


export interface Options extends InputOptions, OutputOptions, DeprecatedOtions {
}

/** @internal */
export function mergeOptions ( ...raw_options: Options[]): Options {
    const options = Object.assign({}, ...raw_options ) as Options;

    options.flatten = options.flatten || 'full';

    // backward compatbility
    options.sourcePathBase = options.sourcePathBase || options.base;
    options.sourcePathTemplate = options.sourcePathTemplate || '[relative-path]';

    // backward compatbility
    const inline = ( options.inline === true );
    const absolutePath = ( options.absolutePath === true );
    options.sourceMappingURLTemplate = options.sourceMappingURLTemplate || (inline ? 'inline' : absolutePath ? '[absolute-path]' : '[relative-path]');

    return options;
}

/** @internal */
export function parseSorceryCommandLine ( command: minimist.ParsedArgs ): Options {
    const options: Options = {
        sourceMappingURLTemplate: command.datauri ? 'inline' : command.absolutePath ? '[absolute-path]' : undefined,
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
        sourcePathBase: command.base,
        sourcePathTemplate: command.base ? '[relative-path]' : '[absolute-path]',
        sourceRoot: command.root
        // errorOnMissing
    };
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
            options = Object.assign({}, mapFileOrStreamOrOptions );
        }
    }
    return { options, output };
}

