/* @refresh reload */
import { render } from "solid-js/web";
import "./index.css";
import ChatBot from "./pages/ChatBot";

render(() => <ChatBot />, document.getElementById("root")!);
