import BleManager from 'react-native-ble-manager';

export default class Device {
	id = undefined;
	peripheralInfo = undefined;
	characteristics = undefined;
	connected = false;
	services = undefined;
	advertising = undefined;
	constructor({ id, connected, peripheralInfo, characteristics, services, advertising }) {
		this.id = id;
		this.connected = connected;
		this.peripheralInfo = peripheralInfo;
		this.characteristics = characteristics;
		this.services = services;
		this.advertising = advertising;
	}

	addNotificationListeners = (device, characteristics, current = 0) => {
		if (characteristics[current]) {
			const { service, characteristic, errorCallback = () => {} } = characteristics[current];
			return BleManager.startNotification(device, service, characteristic)
				.then(() => {
					console.log('Started notification service: ', service, '; characteristic: ', characteristic);
					if (current < characteristics.length) {
						return this.addNotificationListeners(device, characteristics, ++current);
					}
				})
				.catch((error) => {
					console.log('Notification error: ', error);
					console.log('Error notification on service: ', service, '; characteristic: ', characteristic);
					errorCallback(error);
				});
		}
	};

	subscribeAll = () => {
		this.addNotificationListeners(this.id, this.getFilteredCharacteristics());
	};
	setServices = (services) => {
		this.services = services;
	};
	getServices = () => {
		return this.services;
	};

	setCharacteristics = (characteristics) => {
		console.log('characteristics', characteristics);
		this.characteristics = characteristics;
	};

	getCharacteristics = () => {
		return this.characteristics;
	};
	getFilteredCharacteristics = () => {
		return this.characteristics.filter((elem) => {
			return this.services.includes(elem.service);
		});
	};
	setPeripheralInfo = (peripheralInfo) => {
		this.peripheralInfo = peripheralInfo;
	};
	getPeripheralInfo = () => {
		return this.peripheralInfo;
	};

	retrieveServices = async () => {
		await BleManager.retrieveServices(this.id)
			.then((peripheralInfo) => {
				this.setPeripheralInfo(peripheralInfo);
				this.setServices(peripheralInfo.advertising.serviceUUIDs);
				this.setCharacteristics(peripheralInfo.characteristics);
			})
			.catch((error) => {
				console.log('retrievsServices error', error);
			});
	};
	connect = async () => {
		await BleManager.connect(this.id).catch((error) => {
			console.log('Connection error', error);
		});
		this.connected = true;
	};
	disconnect = async () => {
		await BleManager.disconnect(this.id).catch((error) => {
			console.log('Disconnection error', error);
		});
		this.connected = false;
	};
}
