import App from './App.marko';
var result = App.renderSync({});

// Find the div with the ID "app"
const appElement = document.getElementById('app');

result.appendTo(appElement);
