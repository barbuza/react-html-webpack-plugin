import * as React from 'react';
import { flatMap, endsWith } from 'lodash';
import { Chunks } from './chunk';

function filterJavascripts(files: string[]) {
    return files.filter(x => endsWith(x, '.js'));
}

export function Html({ chunks }: { chunks: Chunks }) {
    return (
        <html>
            <head></head>
            <body>
                {flatMap(Object.keys(chunks), name =>
                    filterJavascripts(chunks[name].files).map(filename =>
                        <script key={filename} src={filename}/>
                    )
                )}
            </body>
        </html>
    );
}
