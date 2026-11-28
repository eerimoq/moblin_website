/* @refresh reload */
import { render } from "@solidjs/web";
import "./index.css";
import "./cards.css";
import Docs from "./pages/Docs";

render(() => <Docs />, document.getElementById("root")!);
