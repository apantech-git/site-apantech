import { renderToString } from "react-dom/server";
import { App } from "./App";
import type { RouteId } from "./routes";

export { ROTAS } from "./routes";
export { empresa } from "./config";
export const render = (route: RouteId) => renderToString(<App route={route} />);
