/* @refresh reload */
import { render } from "solid-js/web";
import "./index.css";
import NotFound from "./pages/NotFound";

const path = location.pathname.slice(import.meta.env.BASE_URL.length);

if (/^(twitch|kick|dashboard|device|account|admin|page|terms)(\/|$)/.test(path)) {
  location.replace(`https://cloud.moblin.app/${path}${location.search}${location.hash}`);
} else {
  render(() => <NotFound />, document.getElementById("root")!);
}
