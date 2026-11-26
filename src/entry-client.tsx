import { hydrateRoot } from "react-dom/client";
import { App } from "./App";
import type { RouteId } from "./routes";

const el = document.getElementById("root")!;
hydrateRoot(el, <App route={el.dataset.route as RouteId} />);
