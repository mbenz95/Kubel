# Kubel

Forked from https://github.com/electron-react-boilerplate

## How to build

### Dev

`npm install` initially  
`npm run start` for developing  
Should auto reload automatically, probably

### Release

`npm run release` for releasing.  
See publish config in package.json (using s3)  
Config must be found automatically, somehow.  
Easiest is to have ~/.aws/credentials file defining the access keys that can upload to the specified id:

```
[default]
aws_access_key_id = YOUR_ACCESS_KEY
aws_secret_access_key = YOUR_SECRET_KEY
```

Update changelog by changing CHANGELOG.md and running `npm run uploadChangelog` which uploads the file to a S3 bucket.  
Config is hardcoded in `uploadChangelog.js` (using same credential file as release, probably)

Don't forget to update the version in:

```
./CHANGELOG.md
./release/app/package.json
./release/app/package-lock.json
```

## Common Questions:

1. Warum sind Leute an ihrem eigenen Kot interessiert?  
   A: Nico ist schuld.
