import React, {Component} from 'react';
import {Alert} from 'react-native';
import MSSQL from 'react-native-mssql';

const config = {
  server: '82.130.38.95', //ip address of the mssql database
  username: 'sa', //username to login to the database
  password: 'admintest', //password to login to the database
  database: 'Proto', //the name of the database to connect to
  port: 1433, //OPTIONAL, port of the database on the server
  timeout: 5, //OPTIONAL, login timeout for the server
};
export default class SqlManager extends Component {
  constructor() {
    super();
    this.state = {
      isConnected: false,
    };
  }

  connectSql = async () => {
    console.log('Connecting');
    MSSQL.connect(config)
      .then((result) => {
        console.log('Login success:\n ' + result);
        return true;
      })
      .catch((error) => {
        console.log('Login fail:\n ' + error);
        return false;
      });
  };

  disconnectSql = async () => {
    MSSQL.close()
      .then((result) => {
        console.log(result);
        return false;
      })
      .catch((error) => {
        console.log(error);
        return true;
      });
  };
}
