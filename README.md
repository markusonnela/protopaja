# Protocamp
Code of summer camp's prototype

The objective of this project is to be able to connect to peripheral ble devices and collect data from them into a smartphone.

The framework used is React Native:
  https://github.com/facebook/react-native

And the bluetooth library is react-native-ble-manager:
  https://github.com/innoveit/react-native-ble-manager

## Running this App

In order to run this app, make sure to install all the node packages first
```
  npm install
```  
Once the packages are installed and all the requirements are met, plug a smartphone with USB debugger activated and run:
```
  npx react-native run-android
```  
Using a physical device is required since the project makes use of native bluetooth conectivity to scan for BLE devices.
