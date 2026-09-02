import Community from "./components/Community";
import Ecosystem from "./components/Ecosystem";
import Features from "./components/Features";
import Footer from "./components/Footer";
import GetStarted from "./components/GetStarted";
import Hero from "./components/Hero";
import Nav from "./components/Nav";

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <GetStarted />
        <Features />
        <Ecosystem />
        <Community />
      </main>
      <Footer />
    </>
  );
}
