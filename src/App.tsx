
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import { TradingDashboard } from "./components/TradingDashboard";
import AssetDatabase from "./pages/AssetDatabase";
import UnusualVolume from "./pages/UnusualVolume";
import ArkhamIntelligence from "./pages/ArkhamIntelligence";
import Dashboard from "./pages/Dashboard";
import AIPinnacle from "./pages/AIPinnacle";
import AIAnalytics from "./pages/AIAnalytics";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/liquidations" element={<TradingDashboard />} />
          <Route path="/unusual-volume" element={<UnusualVolume />} />
          <Route path="/arkham" element={<ArkhamIntelligence />} />
          <Route path="/database" element={<AssetDatabase />} />
          <Route path="/aipinnacle" element={<AIPinnacle />} />
          <Route path="/ai-analytics" element={<AIAnalytics />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
