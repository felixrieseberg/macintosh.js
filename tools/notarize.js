const { notarize } = require('electron-notarize');
const path = require('path');

const buildOutput = path.resolve(
  __dirname,
  '..',
  'out',
  'macintosh.js-darwin-x64',
  'macintosh.js.app'
);

module.exports = function () {
  if (process.platform !== 'darwin') {
    console.log('Not a Mac; skipping notarization');
    return;
  }

  console.log('Notarizing...');

  return notarize({
    appBundleId: 'com.felixrieseberg.macintoshjs',
    appPath: buildOutput,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_ID_PASSWORD,
    ascProvider: 'LT94ZKYDCJ'
  }).catch((e) => {
    console.error(e);
    throw e;
  });
}
