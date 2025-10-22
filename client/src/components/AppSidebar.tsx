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
  ArrowRight,
  TrendingUp,
  Activity,
  Zap,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import sidebarLogo from "@assets/image_1761141217552.png";

const menuItems = [
  {
    title: "Início",
    description: "Visão executiva completa",
    url: "/dashboard",
    icon: Home,
    color: "from-blue-500 to-indigo-500",
  },
  {
    title: "Cadastros",
    description: "Gestão da carteira",
    icon: FolderTree,
    color: "from-purple-500 to-violet-500",
    count: "127",
    items: [
      { title: "Clientes e Fornecedores", url: "/dashboard/clientes-fornecedores", icon: Users },
      { title: "Contas Bancárias", url: "/dashboard/contas-bancarias", icon: Landmark },
      { title: "Categorias", url: "/dashboard/categorias", icon: FolderTree },
      { title: "Formas de Pagamento", url: "/dashboard/formas-pagamento", icon: CreditCard },
    ],
  },
  {
    title: "Lançamentos",
    description: "Receitas e despesas",
    url: "/dashboard/lancamentos",
    icon: ArrowLeftRight,
    color: "from-green-500 to-emerald-500",
    badge: "12",
  },
  {
    title: "Metas",
    description: "Objetivos e indicadores",
    url: "/dashboard/metas",
    icon: Target,
    color: "from-orange-500 to-amber-500",
  },
  {
    title: "Documentos",
    description: "Boletos, DAS e guias",
    icon: FileText,
    color: "from-indigo-500 to-purple-500",
    count: "12",
    items: [
      { title: "Recibos", url: "/dashboard/recibos", icon: Receipt },
      { title: "Relatórios", url: "/dashboard/relatorios", icon: FileText },
      { title: "Análise", url: "/dashboard/analise", icon: BarChart3 },
    ],
  },
  {
    title: "Administração",
    description: "Configurações do sistema",
    icon: Settings,
    color: "from-gray-500 to-slate-600",
    items: [
      { title: "Parâmetros do Sistema", url: "/dashboard/parametros", icon: Settings },
      { title: "Exportação", url: "/dashboard/exportacao", icon: FileOutput },
      { title: "Importações", url: "/dashboard/importacoes", icon: FileInput },
      { title: "Usuários", url: "/dashboard/usuarios", icon: UserCog },
    ],
  },
  {
    title: "Central de Ajuda",
    description: "Suporte e tutoriais",
    url: "/dashboard/ajuda",
    icon: HelpCircle,
    color: "from-cyan-500 to-teal-500",
  },
  {
    title: "Notificações",
    description: "Alertas e avisos",
    url: "/dashboard/notificacoes",
    icon: Bell,
    color: "from-red-500 to-rose-500",
    badge: "23",
  },
];

const quickStats = [
  { label: "Receitas", value: "R$ 45k", icon: TrendingUp, color: "text-green-500" },
  { label: "Performance", value: "98%", icon: Activity, color: "text-blue-500" },
  { label: "Meta Mensal", value: "87%", icon: Zap, color: "text-orange-500" },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar className="border-r bg-gradient-to-b from-background to-muted/20">
      <SidebarHeader className="border-b bg-gradient-to-br from-primary/5 to-transparent p-5">
        <div className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-card to-muted/30 p-4 border shadow-sm hover-elevate cursor-pointer mb-5" data-testid="profile-card">
          <Avatar className="h-12 w-12 border-2 border-primary/20">
            <AvatarImage src="" alt="User" />
            <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-white font-semibold text-sm">
              JD
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="font-semibold text-sm truncate">João Silva</span>
            <span className="text-xs text-muted-foreground truncate">Analista Financeiro</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {quickStats.map((stat, index) => (
            <div
              key={index}
              className="flex flex-col items-center gap-2 rounded-xl bg-gradient-to-br from-muted/50 to-transparent p-3 border border-border/50 hover-elevate cursor-default"
              data-testid={`quick-stat-${index}`}
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${stat.color === 'text-green-500' ? 'from-green-500 to-emerald-600' : stat.color === 'text-blue-500' ? 'from-blue-500 to-indigo-600' : 'from-orange-500 to-amber-600'} shadow-sm`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
              <div className="flex flex-col items-center gap-0.5 w-full">
                <span className="text-sm font-bold truncate">{stat.value}</span>
                <span className="text-[10px] text-muted-foreground text-center truncate w-full">{stat.label}</span>
              </div>
            </div>
          ))}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-4 overflow-y-auto">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                
                if (item.items) {
                  return (
                    <Collapsible key={item.title} asChild defaultOpen={true}>
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            className="group/item h-auto py-3 px-3 hover-elevate"
                            data-testid={`button-menu-${item.title.toLowerCase()}`}
                          >
                            <div className="flex items-start gap-3 flex-1">
                              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${item.color} shadow-sm mt-0.5`}>
                                <Icon className="h-4 w-4 text-white" strokeWidth={2.5} />
                              </div>
                              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-semibold text-sm truncate">{item.title}</span>
                                  {item.count && (
                                    <span className="text-xs font-semibold text-muted-foreground shrink-0">{item.count}</span>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground truncate">{item.description}</span>
                              </div>
                              <ChevronDown className="h-4 w-4 shrink-0 mt-1 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                            </div>
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pb-1">
                          <SidebarMenuSub className="ml-11 mt-1 space-y-0.5 border-l-2 border-border/30 pl-3">
                            {item.items.map((subItem) => {
                              const SubIcon = subItem.icon;
                              return (
                                <SidebarMenuSubItem key={subItem.title}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={location === subItem.url}
                                    className="hover-elevate py-2"
                                  >
                                    <Link href={subItem.url}>
                                      <div
                                        className="flex items-center gap-2 w-full"
                                        data-testid={`link-submenu-${subItem.title.toLowerCase().replace(/\s+/g, '-')}`}
                                      >
                                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                        <span className="text-sm flex-1 truncate">{subItem.title}</span>
                                      </div>
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

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      className="group/item h-auto py-3 px-3 hover-elevate"
                    >
                      <Link href={item.url}>
                        <div
                          className="flex items-start gap-3 w-full"
                          data-testid={`link-menu-${item.title.toLowerCase()}`}
                        >
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${item.color} shadow-sm mt-0.5`}>
                            <Icon className="h-4 w-4 text-white" strokeWidth={2.5} />
                          </div>
                          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-sm truncate">{item.title}</span>
                              {item.badge && (
                                <Badge
                                  variant="secondary"
                                  className="h-5 min-w-5 px-1.5 text-xs font-semibold bg-primary text-primary-foreground shrink-0"
                                >
                                  {item.badge}
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground truncate">{item.description}</span>
                          </div>
                        </div>
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
