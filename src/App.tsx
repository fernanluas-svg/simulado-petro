import { useEffect, useRef } from 'react';
import {
  HashRouter,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { useExamStore, type ExamView } from './store/useExamStore';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { ExamSetupScreen } from './pages/ExamSetupScreen';
import { ExamScreen } from './pages/ExamScreen';
import { ResultScreen } from './pages/ResultScreen';
import { ReviewScreen } from './pages/ReviewScreen';
import { HistoryScreen } from './pages/HistoryScreen';
import { QuestionBankScreen } from './pages/QuestionBankScreen';
import { SettingsScreen } from './pages/SettingsScreen';
import { Loader2 } from 'lucide-react';

const VIEW_TO_PATH: Record<ExamView, string> = {
  home: '/',
  setup: '/setup',
  exam: '/exam',
  result: '/result',
  review: '/review',
  history: '/history',
  bank: '/bank',
  settings: '/settings',
};

const PATH_TO_VIEW = new Map<string, ExamView>(
  Object.entries(VIEW_TO_PATH).map(([view, path]) => [path, view as ExamView]),
);

/**
 * Mantém o estado `view` e a URL sincronizados.
 * A URL passa a ser compartilhável e os botões voltar/avançar do navegador funcionam.
 */
function ViewUrlSync() {
  const view = useExamStore((state) => state.view);
  const setView = useExamStore((state) => state.setView);
  const location = useLocation();
  const navigate = useNavigate();
  const initialized = useRef(false);
  const lastView = useRef(view);
  const lastPath = useRef(location.pathname);

  useEffect(() => {
    const path = location.pathname;
    const viewChanged = view !== lastView.current;
    const pathChanged = path !== lastPath.current;
    lastView.current = view;
    lastPath.current = path;

    if (!initialized.current) {
      initialized.current = true;
      const mapped = PATH_TO_VIEW.get(path);
      if (!mapped) {
        setView('home');
        navigate('/', { replace: true });
      } else if (mapped !== view) {
        setView(mapped);
      }
      return;
    }

    if (viewChanged && !pathChanged) {
      const target = VIEW_TO_PATH[view];
      if (path !== target) navigate(target);
      return;
    }

    if (pathChanged && !viewChanged) {
      const mapped = PATH_TO_VIEW.get(path);
      if (!mapped) {
        setView('home');
        navigate('/', { replace: true });
      } else if (mapped !== view) {
        setView(mapped);
      }
      return;
    }

    if (viewChanged && pathChanged) {
      const target = VIEW_TO_PATH[view];
      if (path !== target) navigate(target);
    }
  }, [view, location.pathname, navigate, setView]);

  return null;
}

function AppShell() {
  const { initApp, isLoading, error, view } = useExamStore();

  useEffect(() => {
    void initApp();
  }, [initApp]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b132b] flex flex-col items-center justify-center gap-4 text-slate-100">
        <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
        <p className="text-sm font-medium">
          Carregando simulados e banco de questões Transpetro 2026...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0b132b] flex flex-col items-center justify-center gap-4 text-slate-100 p-4 text-center">
        <div className="bg-rose-500/20 border border-rose-500/40 p-6 rounded-2xl max-w-md space-y-3">
          <h2 className="text-lg font-bold text-rose-400">Erro ao carregar aplicação</h2>
          <p className="text-sm text-slate-300">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0b132b] text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
      <Navbar />
      <main className="flex-1 pb-16">
        {view === 'home' && <Home />}
        {view === 'setup' && <ExamSetupScreen />}
        {view === 'exam' && <ExamScreen />}
        {view === 'result' && <ResultScreen />}
        {view === 'review' && <ReviewScreen />}
        {view === 'history' && <HistoryScreen />}
        {view === 'bank' && <QuestionBankScreen />}
        {view === 'settings' && <SettingsScreen />}
      </main>
    </div>
  );
}

export function App() {
  return (
    <HashRouter>
      <ViewUrlSync />
      <AppShell />
    </HashRouter>
  );
}

export default App;
