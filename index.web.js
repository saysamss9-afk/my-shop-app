import './src/firebase-config'; // MUST BE FIRST
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Generate and inject required styles for react-native-web
const style = document.createElement('style');
style.type = 'text/css';
const cssText = `
  html, body, #app-root {
    height: 100%;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
  }
  #app-root {
    flex: 1;
  }
`;
if (style.styleSheet) {
  style.styleSheet.cssText = cssText;
} else {
  style.appendChild(document.createTextNode(cssText));
}
document.head.appendChild(style);

AppRegistry.registerComponent(appName, () => App);
AppRegistry.runApplication(appName, {
  initialProps: {},
  rootTag: document.getElementById('app-root'),
});
