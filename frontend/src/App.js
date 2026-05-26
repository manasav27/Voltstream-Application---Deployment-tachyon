import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ExplorePage from "./pages/ExplorePage";
import IntroPage from "./pages/IntroPage";
import LiveDashboard from "./pages/LiveDashboard";
import UsageHistory from "./pages/UsageHistory";
import SmartControl from "./pages/SmartControl";
import Invoices from "./pages/Invoices";
import Notfound from "./pages/Notfound";

class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Page failed to render", error, info);
  }

  render() {
    if (this.state.hasError) {
      return <Notfound isError />;
    }

    return this.props.children;
  }
}

function App() {
  return (
    <Router>
      <Layout>
        <PageErrorBoundary>
          <Routes>
            <Route path="/" element={<IntroPage />} />
            <Route path="/live" element={<LiveDashboard />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/analytics" element={<UsageHistory />} />
            <Route path="/devices" element={<SmartControl />} />
            <Route path="/billing" element={<Invoices />} />
            <Route path="*" element={<Notfound />} />
          </Routes>
        </PageErrorBoundary>
      </Layout>
    </Router>
  );
}

export default App;
