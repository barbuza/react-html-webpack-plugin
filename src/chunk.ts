export interface Chunk {
    files: string[];
    hash: string;
    id: number;
    extraAsync: boolean;
}

export interface Chunks {
    [name: string]: Chunk;
}
