## ReactNative Expo Mobile App

run `npx create-expo-app@latest`

### start developing
run `npx expo start`

### android build
https://docs.expo.dev/build/setup/
```bash
$ npm install -g eas-cli
$ eas login
$ eas build -p android --profile preview
```
#### android production build 
```bash
$ eas init
$ eas build -p android
```
