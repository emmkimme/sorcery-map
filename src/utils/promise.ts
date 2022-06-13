export interface SerialFunc<T> {
    ( ...args: any[] ): Promise<T>;
}

export function Serial<T> ( funcs: SerialFunc<T>[]): Promise<T[]> {
    return funcs.reduce( ( promise, func ) =>
        promise.then( results => func().then( result => {
            results.push( result );
            return results;
        }) ), Promise.resolve([]) );
}
