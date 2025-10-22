import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import NotFound from "@/pages/not-found";
import DashboardLayout from "@/layouts/DashboardLayout";

// Dashboard Pages
import Dashboard from "@/pages/Dashboard";
import Lancamentos from "@/pages/Lancamentos";
import Metas from "@/pages/Metas";
import ClientesFornecedores from "@/pages/ClientesFornecedores";
import ContasBancarias from "@/pages/ContasBancarias";
import Categorias from "@/pages/Categorias";
import FormasPagamento from "@/pages/FormasPagamento";
import Parametros from "@/pages/Parametros";
import Exportacao from "@/pages/Exportacao";
import Importacoes from "@/pages/Importacoes";
import Analise from "@/pages/Analise";
import Relatorios from "@/pages/Relatorios";
import Recibos from "@/pages/Recibos";
import Usuarios from "@/pages/Usuarios";
import Ajuda from "@/pages/Ajuda";
import Notificacoes from "@/pages/Notificacoes";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      
      {/* Dashboard Routes */}
      <Route path="/dashboard">
        <DashboardLayout>
          <Dashboard />
        </DashboardLayout>
      </Route>
      
      <Route path="/dashboard/lancamentos">
        <DashboardLayout>
          <Lancamentos />
        </DashboardLayout>
      </Route>
      
      <Route path="/dashboard/metas">
        <DashboardLayout>
          <Metas />
        </DashboardLayout>
      </Route>
      
      <Route path="/dashboard/clientes-fornecedores">
        <DashboardLayout>
          <ClientesFornecedores />
        </DashboardLayout>
      </Route>
      
      <Route path="/dashboard/contas-bancarias">
        <DashboardLayout>
          <ContasBancarias />
        </DashboardLayout>
      </Route>
      
      <Route path="/dashboard/categorias">
        <DashboardLayout>
          <Categorias />
        </DashboardLayout>
      </Route>
      
      <Route path="/dashboard/formas-pagamento">
        <DashboardLayout>
          <FormasPagamento />
        </DashboardLayout>
      </Route>
      
      <Route path="/dashboard/parametros">
        <DashboardLayout>
          <Parametros />
        </DashboardLayout>
      </Route>
      
      <Route path="/dashboard/exportacao">
        <DashboardLayout>
          <Exportacao />
        </DashboardLayout>
      </Route>
      
      <Route path="/dashboard/importacoes">
        <DashboardLayout>
          <Importacoes />
        </DashboardLayout>
      </Route>
      
      <Route path="/dashboard/analise">
        <DashboardLayout>
          <Analise />
        </DashboardLayout>
      </Route>
      
      <Route path="/dashboard/relatorios">
        <DashboardLayout>
          <Relatorios />
        </DashboardLayout>
      </Route>
      
      <Route path="/dashboard/recibos">
        <DashboardLayout>
          <Recibos />
        </DashboardLayout>
      </Route>
      
      <Route path="/dashboard/usuarios">
        <DashboardLayout>
          <Usuarios />
        </DashboardLayout>
      </Route>
      
      <Route path="/dashboard/ajuda">
        <DashboardLayout>
          <Ajuda />
        </DashboardLayout>
      </Route>
      
      <Route path="/dashboard/notificacoes">
        <DashboardLayout>
          <Notificacoes />
        </DashboardLayout>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
