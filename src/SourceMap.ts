export interface SourceMap {
	version: 3;

	file: string;
	sources: string[];
	sourcesContent: string[]; 
	names: string[];
	mappings: string;
	sourceRoot: string;

	toString(): string;
	toUrl(): string;
}
