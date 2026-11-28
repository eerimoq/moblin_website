/* @refresh reload */
import { render } from "@solidjs/web";
import "./index.css";
import "./cards.css";
import Cards from "./pages/Cards";

render(() => <Cards />, document.getElementById("root")!);
