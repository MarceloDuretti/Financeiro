import {
  Home,
  Users,
  Landmark,
  FolderTree,
  CreditCard,
  ArrowLeftRight,
  Target,
  Settings,
  FileOutput,
  FileInput,
  BarChart3,
  FileText,
  Receipt,
  UserCog,
  HelpCircle,
  Bell,
  ChevronDown,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const menuItems = [
  {
    title: "Início",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Cadastros",
    icon: FolderTree,
    items: [
      { title: "Clientes e Fornecedores", url: "/dashboard/clientes-fornecedores", icon: Users },
      { title: "Contas Bancárias", url: "/dashboard/contas-bancarias", icon: Landmark },
      { title: "Categorias", url: "/dashboard/categorias", icon: FolderTree },
      { title: "Formas de Pagamento", url: "/dashboard/formas-pagamento", icon: CreditCard },
    ],
  },
  {
    title: "Lançamentos",
    url: "/dashboard/lancamentos",
    icon: ArrowLeftRight,
  },
  {
    title: "Metas",
    url: "/dashboard/metas",
    icon: Target,
  },
  {
    title: "Administração",
    icon: Settings,
    items: [
      { title: "Parâmetros do Sistema", url: "/dashboard/parametros", icon: Settings },
      { title: "Exportação", url: "/dashboard/exportacao", icon: FileOutput },
      { title: "Importações", url: "/dashboard/importacoes", icon: FileInput },
      { title: "Análise", url: "/dashboard/analise", icon: BarChart3 },
      { title: "Relatórios", url: "/dashboard/relatorios", icon: FileText },
      { title: "Recibos", url: "/dashboard/recibos", icon: Receipt },
      { title: "Usuários", url: "/dashboard/usuarios", icon: UserCog },
    ],
  },
  {
    title: "Central de Ajuda",
    url: "/dashboard/ajuda",
    icon: HelpCircle,
  },
  {
    title: "Notificações",
    url: "/dashboard/notificacoes",
    icon: Bell,
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <Link href="/dashboard">
          <a className="flex items-center gap-2" data-testid="link-dashboard-logo">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <span className="text-lg font-semibold text-primary-foreground">F</span>
            </div>
            <span className="font-medium text-lg">FinControl</span>
          </a>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon;
                
                // Item com submenu
                if (item.items) {
                  return (
                    <Collapsible key={item.title} asChild defaultOpen={false}>
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            data-testid={`button-menu-${item.title.toLowerCase()}`}
                          >
                            <Icon className="h-4 w-4" />
                            <span>{item.title}</span>
                            <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items.map((subItem) => {
                              const SubIcon = subItem.icon;
                              return (
                                <SidebarMenuSubItem key={subItem.title}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={location === subItem.url}
                                  >
                                    <Link href={subItem.url}>
                                      <a data-testid={`link-submenu-${subItem.title.toLowerCase().replace(/\s+/g, '-')}`}>
                                        <SubIcon className="h-4 w-4" />
                                        <span>{subItem.title}</span>
                                      </a>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                // Item simples
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={location === item.url}>
                      <Link href={item.url}>
                        <a data-testid={`link-menu-${item.title.toLowerCase()}`}>
                          <Icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </a>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
