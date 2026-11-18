import Features from "./components/Features";
import Footer from "./components/Footer";
import GetStarted from "./components/GetStarted";
import Hero from "./components/Hero";
import Nav from "./components/Nav";
import Streamers from "./components/Streamers";
import Support from "./components/Support";
import Videos from "./components/Videos";

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <GetStarted />
        <Features />
        <Streamers />
        <Videos />
        <Support />
      </main>
      <Footer />
    </>
  );
}
