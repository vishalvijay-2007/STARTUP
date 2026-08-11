import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Footer from "./components/Footer";
import "./App.css";

function App() {
  return (
    <div className="app">
      <Navbar />

      <main>
        <Hero />

        <section className="features" id="features">
          <h2>Why Choose STARTUP?</h2>

          <div className="feature-grid">
            <div className="feature-card">
              <h3>Mentorship</h3>
              <p>
                Connect with experienced mentors and get
                valuable guidance for your startup.
              </p>
            </div>

            <div className="feature-card">
              <h3>Resources</h3>
              <p>
                Access useful resources to help your startup
                grow and succeed.
              </p>
            </div>

            <div className="feature-card">
              <h3>Community</h3>
              <p>
                Build connections with founders and other
                members of the startup community.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default App;