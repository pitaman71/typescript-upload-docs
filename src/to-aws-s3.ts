import { Tasks } from 'typescript-code-instruments';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { readdir, readFile } from 'fs/promises';
import * as path from 'path';

const sourceDir = './docs';
const targetBucket = 'omniglot-public-docs';

// Recursive getFiles from
// https://stackoverflow.com/a/45130990/831465
function getFiles(dir: string): Promise<string | string[]> {
    return new Tasks.Instrument(`Listing ${dir}`).logs(console.log, () => true).promises(undefined, () => 
        readdir(dir, { withFileTypes: true })
    ).then((dirents) =>
        Promise.all(
            dirents.map((dirent) => {
                const res = path.resolve(dir, dirent.name);
                return dirent.isDirectory() ? getFiles(res) : res;
            })
        )
    ).then((files) => Array.prototype.concat(...files));
}

async function uploadDir(localPath: string, bucketName: string, prefix: string) {
    const s3 = new S3Client();
  
    const files = (await getFiles(localPath)) as string[];
    const uploads = files.map((filePath) => new Tasks.Instrument(`reading ${filePath}`).logs(console.log, () => true).promises(undefined, (task) => 
            readFile(filePath, 'utf-8'))
        .then((fileContents: string) => new Tasks.Instrument(`uploading ${filePath}`).logs(console.log, () => true).promises(undefined, (task) => 
            s3.send(new PutObjectCommand({
                Key: prefix + path.relative(localPath, filePath),
                Bucket: bucketName,
                Body: fileContents,
            }))
        )
    ));
    return Promise.all(uploads);
}
  
readFile('./package.json', 'utf-8').then(data => {
    const packageConfig = JSON.parse(data);
    const name = packageConfig.name;
    const version = packageConfig.version;
    uploadDir(sourceDir, targetBucket, `${name}/${version}/`)
});
