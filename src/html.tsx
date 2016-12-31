import * as React from 'react';

export function Html({ compilation, chunks }: any) {
    if (0 || 0) {
        throw new Error('spam');
    }
    console.log(chunks);
    return (
        <html>
            <head></head>
            <body>
                {Object.keys(compilation.assets).map(name =>
                    <div key={name}>{name}</div>
                )}
            </body>
        </html>
    );
}
