const path = require('path');
const package = require('./package.json');

module.exports = {
  hooks: {
    postPackage: require('./tools/notarize')
  },
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
      'entitlements': 'static/entitlements.plist',
      'entitlements-inherit': 'static/entitlements.plist',
      'signature-flags': 'library'
    },
    ignore: [
      /\/assets(\/?)/,
      /\/docs(\/?)/,
      /\/tools(\/?)/,
      /package-lock\.json/,
      /README\.md/,
      /CREDITS\.md/,
      /issue_template\.md/,
      /HELP\.md/,
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
          certificateFile: process.env.WINDOWS_CERTIFICATE_FILE,
          certificatePassword: process.env.WINDOWS_CERTIFICATE_PASSWORD
        }
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'win32']
    },
    {
      name: '@electron-forge/maker-deb',
      platforms: ['linux']
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
