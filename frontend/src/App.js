import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import LiveDashboard from "./pages/LiveDashboard";
import UsageHistory from "./pages/UsageHistory";
import SmartControl from "./pages/SmartControl";
import Invoices from "./pages/Invoices";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<LiveDashboard />} />
          <Route path="/analytics" element={<UsageHistory />} />
          <Route path="/devices" element={<SmartControl />} />
          <Route path="/billing" element={<Invoices />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
