import './App.sass';

//ROUTER

import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

//Screens
import { DashboardScreen } from "./screens/dashboard";

function App() {
  return (
    <div className="AppContainer">
      <div className="App">
          <BrowserRouter>
            <Routes>
              <Route index element={<DashboardScreen />} />
            </Routes>
          </BrowserRouter>
      </div>
    </div>
  );
}

export default App;
