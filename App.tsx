
import React, { useState, useCallback, useEffect } from 'react';
import { WillData, WizardStep, MaritalStatus } from './types.ts';
import { stripe } from './services/stripeService.ts';
import LandingPage from './components/LandingPage.tsx';
import EligibilityCheck from './components/EligibilityCheck.tsx';
import PersonalInfo from './components/PersonalInfo.tsx';
import ExecutorsStep from './components/ExecutorsStep.tsx';
import ChildrenStep from './components/ChildrenStep.tsx';
import BeneficiariesStep from './components/BeneficiariesStep.tsx';
import ResiduaryStep from './components/ResiduaryStep.tsx';
import ReviewStep from './components/ReviewStep.tsx';
import DonationStep from './components/DonationStep.tsx';
import WitnessStep from './components/WitnessStep.tsx';
import SignatureStep from './components/SignatureStep.tsx';
import CompletionStep from './components/CompletionStep.tsx';
import Navbar from './components/Navbar.tsx';
import ProgressBar from './components/ProgressBar.tsx';

import HelpCenter from './components/HelpCenter.tsx';
import LegalityInfo from './components/LegalityInfo.tsx';
import TermsAndPrivacy from './components/TermsAndPrivacy.tsx';
import PremiumTier from './components/PremiumTier.tsx';
import DonationDashboard from './components/DonationDashboard.tsx';
import AdminGate from './components/AdminGate.tsx';
import Storefront from './components/Storefront.tsx';

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

// Robust Error Boundary to capture runtime crashes
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Critical Application Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
          <div className="max-w-md space-y-6 bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto text-2xl">
                <i className="fa-solid fa-bug"></i>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Application Error</h1>
            <p className="text-slate-500 text-sm">We encountered an unexpected issue. This has been logged for our engineering team.</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-slate-900 text-white px-6 py-4 rounded-xl font-bold hover:bg-black transition shadow-lg"
            >
              Refresh Application
            </button>
          </div>
        </div>
      );
    }

    // Explicitly cast 'this' to any to avoid "Property 'props' does not exist on type 'ErrorBoundary'" in some TS environments
    return (this as any).props.children; 
  }
}

type AppView = 'wizard' | 'help' | 'legality' | 'terms' | 'premium' | 'dashboard' | 'store';

const initialWillData: WillData = {
  testator: {
    fullName: '',
    address: '',
    dob: '',
    maritalStatus: MaritalStatus.SINGLE,
  },
  executors: [],
  hasChildren: false,
  children: [],
  guardians: [],
  beneficiaries: [],
  residuaryBeneficiary: '',
  witnesses: [],
  donationAmount: 0,
  isPremium: false,
  acceptedTerms: false,
  generationDate: new Date().toLocaleDateString('en-GB'),
};

const AppContent: React.FC = () => {
  const [view, setView] = useState<AppView>('wizard');
  const [step, setStep] = useState<WizardStep>(WizardStep.LANDING);
  const [data, setData] = useState<WillData>(initialWillData);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [activeStoreId, setActiveStoreId] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Graceful loader removal
    const loader = document.getElementById('app-loader');
    if (loader) {
      loader.style.opacity = '0';
      // Slight delay to ensure React render has painted
      setTimeout(() => {
         if (loader && loader.parentNode) loader.parentNode.removeChild(loader);
      }, 500);
    }

    // PWA Install Prompt Handler
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Deep Linking Handling
    const urlParams = new URLSearchParams(window.location.search);
    const storeId = urlParams.get('store');
    if (storeId) {
      setActiveStoreId(storeId);
      setView('store');
    }

    const paymentStatus = urlParams.get('payment');
    const isSuccess = paymentStatus === 'success' || urlParams.get('success') === 'true';
    
    if (isSuccess) {
      setIsVerifyingPayment(true);
      const savedData = localStorage.getItem('pending_will_data');
      
      const timer = setTimeout(() => {
        if (savedData) {
          try {
            const parsedData = JSON.parse(savedData);
            setData({ ...parsedData, isPremium: true });
            stripe.recordTransaction(parsedData.donationAmount, parsedData.testator.fullName);
            setStep(WizardStep.WITNESS); 
            // Cleanup to prevent re-triggering
            localStorage.removeItem('pending_will_data');
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
          } catch (e) {
            console.error("Failed to restore session data", e);
          }
        }
        setIsVerifyingPayment(false);
      }, 2000);

      return () => clearTimeout(timer);
    }

    return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view, step]);

  const updateData = useCallback((updates: Partial<WillData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const navigateToWizard = () => {
    setView('wizard');
    setStep(WizardStep.LANDING);
    setActiveStoreId(null);
  };

  const renderWizard = () => {
    switch (step) {
      case WizardStep.LANDING:
        return <LandingPage onStart={() => setStep(WizardStep.ELIGIBILITY)} onPremium={() => setView('premium')} onInstall={deferredPrompt ? handleInstallApp : undefined} />;
      case WizardStep.ELIGIBILITY: return <EligibilityCheck onNext={nextStep} />;
      case WizardStep.PERSONAL_INFO: return <PersonalInfo data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />;
      case WizardStep.EXECUTORS: return <ExecutorsStep data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />;
      case WizardStep.CHILDREN: return <ChildrenStep data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />;
      case WizardStep.BENEFICIARIES: return <BeneficiariesStep data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />;
      case WizardStep.RESIDUARY: return <ResiduaryStep data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />;
      case WizardStep.REVIEW: return <ReviewStep data={data} onNext={nextStep} onBack={prevStep} />;
      case WizardStep.DONATION: return <DonationStep data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />;
      case WizardStep.WITNESS: return <WitnessStep data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />;
      case WizardStep.SIGNATURE: return <SignatureStep data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />;
      case WizardStep.COMPLETION: return <CompletionStep data={data} updateData={updateData} />;
      default: return <LandingPage onStart={() => setStep(WizardStep.ELIGIBILITY)} onPremium={() => setView('premium')} />;
    }
  };

  const renderMain = () => {
    if (isVerifyingPayment) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-12 text-center animate-fade-in">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-blue-600/10 rounded-full"></div>
            <div className="absolute inset-0 w-24 h-24 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-blue-600 text-3xl">
               <i className="fa-solid fa-shield-check"></i>
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900">Payment Verified</h2>
            <p className="text-slate-500 text-base md:text-lg">Your legal session is active. Rebuilding document...</p>
          </div>
        </div>
      );
    }

    if (view === 'help') return <HelpCenter onBack={navigateToWizard} />;
    if (view === 'legality') return <LegalityInfo onBack={navigateToWizard} />;
    if (view === 'terms') return <TermsAndPrivacy onBack={navigateToWizard} />;
    if (view === 'premium') return <PremiumTier onBack={navigateToWizard} onStart={() => { setView('wizard'); setStep(WizardStep.ELIGIBILITY); }} />;
    if (view === 'dashboard') {
      if (!isAdminAuthenticated) return <AdminGate onAuthenticated={() => setIsAdminAuthenticated(true)} onBack={navigateToWizard} />;
      return <DonationDashboard onBack={navigateToWizard} onLogout={() => setIsAdminAuthenticated(false)} />;
    }
    if (view === 'store' && activeStoreId) {
      return <Storefront accountId={activeStoreId} onBack={navigateToWizard} />;
    }
    return renderWizard();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 overflow-x-hidden">
      <Navbar onHome={navigateToWizard} onHelp={() => setView('help')} onLegality={() => setView('legality')} onDashboard={() => setView('dashboard')} isAdminAuthenticated={isAdminAuthenticated} />
      
      {view === 'wizard' && step !== WizardStep.LANDING && step !== WizardStep.COMPLETION && !isVerifyingPayment && (
        <ProgressBar currentStep={step} totalSteps={11} />
      )}

      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 max-w-5xl w-full">
        {renderMain()}
      </main>

      <footer className="bg-slate-900 text-white py-16 md:py-20 px-6 mt-auto">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 text-center md:text-left">
            <div className="col-span-1 md:col-span-2 space-y-6">
              <h4 className="text-3xl font-bold flex items-center gap-2 justify-center md:justify-start">
                <i className="fa-solid fa-feather-pointed text-blue-500"></i>
                UK Free Will
              </h4>
              <p className="text-slate-400 text-sm max-w-md font-light mx-auto md:mx-0">
                Solicitor-grade documentation for England & Wales. Part of the <strong>ukfreewill.co.uk</strong> legal network.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-slate-500">Legal</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><button onClick={() => setView('terms')} className="hover:text-blue-400">Terms & Privacy</button></li>
                <li><button onClick={() => setView('legality')} className="hover:text-blue-400">Legality Guide</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-slate-500">Platform</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><button onClick={() => setView('dashboard')} className="hover:text-blue-400">Partner Admin</button></li>
                <li><button onClick={() => setView('premium')} className="hover:text-blue-400">Premium Perks</button></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
};

export default App;
