/* @refresh reload */
import { render } from "@solidjs/web";
import "./index.css";
import ChatBot from "./pages/ChatBot";

render(() => <ChatBot />, document.getElementById("root")!);
