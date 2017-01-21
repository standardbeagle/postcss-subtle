import postcss from 'postcss';
import valueParser from 'postcss-value-parser';
import request from 'request';
import JSZip from 'jszip';
import fs from 'fs';
import urljoin from 'url-join';
import kefir from 'kefir';

/**
 * Reduces an array of stream data chunks to a buffer by copying each chunk into the buffer and incrementing a position counter.
 * @returns {function()}
 */
const buffReduce = () => {
    let position = 0;
    return (buffer, chunk) => {
        chunk.copy(buffer, position);
        position += chunk.length;
        return buffer;
    }
};

/**
 * Downloads a file and returns a stream of a buffer containing the entire file contents.
 * @param url
 */
const downloadBuffer = url => kefir
    .fromEvents(request.get(url), 'response')
    .flatMap(response => {
        return kefir.stream(emitter => {
            const list = [];
            response.on('data', chunk => {
                list.push(chunk);
            });
            response.on('end', () => {
                emitter.value(list);
                emitter.end();
            })
        }).map(list => {
            const len = list.reduce((count, chunk) => count + chunk.length, 0);
            return list.reduce(buffReduce(), new Buffer(len));
        });
    });

/**
 * The postcss walk callback has a special requirement to return true to get the next result.
 * @param walkFunc
 * @returns {*}
 */
const walkStream = walkFunc => {
    return kefir.stream(emitter => {
        walkFunc(result => {
            emitter.value(result);
            return true;
        });
    });
};

/**
 * This postcss plugin takes a string in the form of background: subtle('name') and downloads and references the file "http://subtlepatterns2015.subtlepatterns.netdna-cdn.com/patterns/{name}.zip"
 * The two parameters are
 * @param options - localPath: the output folder for the image in the local file system
 * 									serverPath: the location of the base folder for the image on the destination server
 * @type {Plugin<T>}
 */
var subtle = postcss.plugin('postcss-subtle', function(options) {
    var longEmTest = /subtle/gi;

    const localPath = options && options.localPath || '';
    const serverPath = options && options.serverPath || '';

    return function (style, result) {
        walkStream(style.walkDecls.bind(style))
            .filter(decl => longEmTest.test(decl.value))
            .flatMap(decl => {
                const parsed = valueParser(decl.value);

                return walkStream(parsed.walk.bind(parsed))
                    .filter(node => node.type === 'function' && node.value === 'subtle')
                    .flatMap(node => {
                        const pattern_name = node.nodes[0].value;
                        const download_url = 'https://subtlepatterns.com/patterns/' + pattern_name + '.zip';
												const site_url = urljoin(serverPath, pattern_name + '.png');
												const local_file_path = urljoin(localPath, pattern_name + '.png');

                        //Convert the node from a function call to a url reference with output file path.
                        node.value = 'url';
                        node.nodes[0].value = site_url;
                        //Once the nodes are updated, setting the decl value to the updated parser value is required for output.
                        decl.value = parsed.toString();

												//Only download file if the local image isn't found.
                        return kefir
                            .fromNodeCallback(cb => fs.stat(local_file_path, cb))
                            .flatMapErrors(() => downloadBuffer(download_url)
                                .flatMap(buffer => kefir.fromPromise(JSZip.loadAsync(buffer)))
                                .map(zip => zip.file(/png$/i))
                                .flatten()
                                .filter(file => (file.name.indexOf('MACOSX') < 0))
                                .take(1)
                                .flatMap(file => kefir.fromEvents(file.nodeStream().pipe(fs.createWriteStream(local_file_path)), 'finish')));
                    });
            }).onError(x => console.err('postcss-subtle error', x));
    };
});

// Make PostCSS aware of this plugin.
postcss().use(subtle);

export {subtle as default};
