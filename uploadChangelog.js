/* eslint-disable func-names */
/* eslint-disable no-console */
const fs = require('fs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

(async function () {
  const filename = 'CHANGELOG.md';
  const fileContent = fs.readFileSync(filename, 'utf-8');

  const client = new S3Client({ region: 'eu-central-1' });
  const params = {
    Bucket: 'kubel-releases',
    Key: filename,
    Body: fileContent,
    ACL: 'public-read',
  };
  const command = new PutObjectCommand(params);
  try {
    const data = await client.send(command);
    console.log('SUCCESS: ', data);
  } catch (error) {
    console.log('ERROR: ', error);
  }
})();
