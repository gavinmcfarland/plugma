import reactLogo from './assets/react.svg';
import Icon from './components/Icon';

const App = () => {
  return (
    <div className="container">
      <div className="banner">
        <Icon svg="plugma" size={38} />
        <Icon svg="plus" size={24} />
        <img src={reactLogo} width="44" height="44" alt="React logo" />
      </div>

      <a href="https://plugma.dev/docs" target="_blank" rel="noopener noreferrer" className="button">
        Read the docs
      </a>
    </div>
  );
};

export default App;
