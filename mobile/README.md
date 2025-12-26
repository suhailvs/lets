# Local Exchange Trading System

run `npx create-expo-app@latest`

### start developing

run `npx expo start`
* open expo app and scan qr code, it will show our app


### android build

https://docs.expo.dev/build/setup/

```bash
$ npm install -g eas-cli
$ eas login
$ eas build -p android --profile preview
```

you can download the `apk` after some time at https://expo.dev/accounts/suhailvs/projects/stackcoinapp


### android production build 

```bash
$ eas init
$ eas build -p android
```
