import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Home from "./pages/Home";
import NewStudyInteractive from "./pages/NewStudyInteractive";
import Pricing from "./pages/Pricing";
import Dashboard from "./pages/Dashboard";
import NewStudy from "./pages/NewStudy";
import StudyDetail from "./pages/StudyDetail";
import Interview from "./pages/Interview";
import AutoInterview from "./pages/AutoInterview";
import Report from "./pages/Report";
import DeepReport from "./pages/DeepReport";
import InterviewList from "./pages/InterviewList";
import CaseStudies from "./pages/CaseStudies";

function Router() {
  return (
    <Switch>
      {/* Public pages */}      <Route path={"/"} component={Home} />
      <Route path={"/studies/new"} component={NewStudyInteractive} />      <Route path="/pricing" component={Pricing} />
      <Route path="/case-studies" component={CaseStudies} />
      
      {/* Protected pages - Dashboard */}
      <Route path="/dashboard" component={Dashboard} />
      
      {/* Study management */}
      <Route path="/studies/new" component={NewStudy} />
      <Route path="/studies/:id" component={StudyDetail} />
      <Route path="/studies/:id/interview" component={Interview} />
      <Route path="/studies/:id/auto-interview" component={AutoInterview} />
      <Route path="/studies/:id/report" component={Report} />
      <Route path="/studies/:id/deep-report" component={DeepReport} />
      <Route path="/studies/:id/interviews" component={InterviewList} />
      
      {/* Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider
          defaultTheme="light"
          // switchable
        >
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}