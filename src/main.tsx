import ReactDOM from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import { NavigationProgress } from '@mantine/nprogress';

import App from "./App";
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/nprogress/styles.css';
ReactDOM.createRoot(document.getElementById("root")!).render(
  <MantineProvider>
    <NavigationProgress />
    <App />
  </MantineProvider>
);