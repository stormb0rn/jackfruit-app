import { AppRegistry } from 'react-native';
import App from './App.jsx';

// Register the app
AppRegistry.registerComponent('Jackfruit', () => App);

// Run the app
AppRegistry.runApplication('Jackfruit', {
  rootTag: document.getElementById('root'),
});
