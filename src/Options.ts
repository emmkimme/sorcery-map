import type * as minimist from 'minimist';
import type { SourceMapProps } from './SourceMap';

interface LoadOptions {
    content?: { [file: string]: string };
    sourcemaps?: { [file: string]: SourceMapProps };
    sourceRootResolution?: string; // base path of the relative sources path in the map
    verbose?: boolean;
}

interface SaveOptions {
    output: string;
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

export interface Options extends LoadOptions, SaveOptions {
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
        output: command.output || command.input,
        excludeContent: command.excludeContent,
        flatten: command.flatten,
        sourceRoot: command.sourceRoot,
    };
    return options;
}
