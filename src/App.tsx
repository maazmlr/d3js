import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import DynamicD3Chart from "./Cart";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <p>yello</p>
      <DynamicD3Chart />
    </>
  );
}

export default App;
