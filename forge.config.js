const path = require('path');
const fs = require('fs');
const package = require('./package.json');

if (process.env['WINDOWS_CODESIGN_FILE']) {
  const certPath = path.join(__dirname, 'win-certificate.pfx');
  const certExists = fs.existsSync(certPath);

  if (certExists) {
    process.env['WINDOWS_CODESIGN_FILE'] = certPath;
  }
}

module.exports = {
  packagerConfig: {
    asar: false,
    icon: path.resolve(__dirname, 'assets', 'icon'),
    appBundleId: 'com.felixrieseberg.macintoshjs',
    appCategoryType: 'public.app-category.developer-tools',
    win32metadata: {
      CompanyName: 'Felix Rieseberg',
      OriginalFilename: 'macintoshjs'
    },
    osxSign: {
      identity: 'Developer ID Application: Felix Rieseberg (LT94ZKYDCJ)',
      'hardened-runtime': true,
      'gatekeeper-assess': false,
      'entitlements': 'assets/entitlements.plist',
      'entitlements-inherit': 'assets/entitlements.plist',
      'signature-flags': 'library'
    },
    osxNotarize: {
      appBundleId: 'com.felixrieseberg.macintoshjs',
      appleId: process.env['APPLE_ID'],
      appleIdPassword: process.env['APPLE_ID_PASSWORD'],
      ascProvider: 'LT94ZKYDCJ'
    },
    ignore: [
      /\/github(\/?)/,
      /\/assets(\/?)/,
      /\/docs(\/?)/,
      /\/tools(\/?)/,
      /\/src\/basilisk\/user_files(\/?)/,
      /package-lock\.json/,
      /README\.md/,
      /CREDITS\.md/,
      /issue_template\.md/,
      /HELP\.md/,
      /win-certificate\.pfx/,
      /user_image_.*/
    ]
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      platforms: ['win32'],
      config: (arch) => {
        return {
          name: 'macintosh.js',
          authors: 'Felix Rieseberg',
          exe: 'macintosh.js.exe',
          noMsi: true,
          remoteReleases: '',
          setupExe: `macintoshjs-${package.version}-setup-${arch}.exe`,
          setupIcon: path.resolve(__dirname, 'assets', 'icon.ico'),
          certificateFile: process.env['WINDOWS_CODESIGN_FILE'],
          certificatePassword: process.env['WINDOWS_CODESIGN_PASSWORD'],
          loadingGif: './assets/loadingGif.gif',
        }
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'win32']
    },
    {
      name: '@electron-forge/maker-deb',
      platforms: ['linux'],
      options: {
        maintainer: 'Felix Rieseberg',
        homepage: 'https://github.com/felixrieseberg/macintosh.js',
        categories: [
          'Education',
        ],
        icon: path.resolve(__dirname, 'assets', 'icon.png')
      }
    },
    {
      name: '@electron-forge/maker-rpm',
      platforms: ['linux']
    }
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'felixrieseberg',
          name: 'macintosh.js'
        },
        draft: true,
        prerelease: true
      }
    }
  ]
};
