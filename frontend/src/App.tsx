import HomePage from "./components/HomePage";
import { BrowserRouter as Router,Routes,Route } from "react-router-dom";

function App() {

  return (
      <Router>
      <Routes>
        <Route path="/" Component={HomePage}/>
      </Routes>
    </Router>
  )
}

export default App
