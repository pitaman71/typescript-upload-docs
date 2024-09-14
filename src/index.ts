#!ts-node
import { readFile } from 'fs/promises';
import { uploadDir as toAwsS3 } from './to-aws-s3';

const sourceDir = './docs';
const targetBucket = 'omniglot-public-docs';

readFile('./package.json', 'utf-8').then(data => {
    const packageConfig = JSON.parse(data);
    const name = packageConfig.name;
    const version = packageConfig.version;
    toAwsS3(sourceDir, targetBucket, `${name}/${version}/`)
});
