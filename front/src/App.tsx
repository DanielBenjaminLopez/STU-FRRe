import { Toaster } from "sileo";
import "sileo/styles.css";
import AppRoutes from "./Routes";

function App() {
  return (
    <>
      <Toaster
        position="top-center"
        theme="light"
        options={{
          fill: "#101828",
          duration: 2500,
        }}
      />
      <AppRoutes />
    </>
  );
}

export default App;
