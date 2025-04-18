import { TodoList } from './components/TodoList';

function App() {
  return (
    <div className="app">
      <header>
        <h1>My Todo App</h1>
      </header>
      <main>
        <TodoList />
      </main>
    </div>
  );
}

export default App; 