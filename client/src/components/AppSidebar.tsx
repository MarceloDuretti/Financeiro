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
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const menuItems = [
  {
    title: "Início",
    url: "/dashboard",
    icon: Home,
    color: "from-blue-500 to-indigo-500",
  },
  {
    title: "Cadastros",
    icon: FolderTree,
    color: "from-purple-500 to-violet-500",
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
    color: "from-green-500 to-emerald-500",
    badge: "12",
  },
  {
    title: "Metas",
    url: "/dashboard/metas",
    icon: Target,
    color: "from-orange-500 to-amber-500",
  },
  {
    title: "Administração",
    icon: Settings,
    color: "from-gray-500 to-slate-600",
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
    color: "from-cyan-500 to-teal-500",
  },
  {
    title: "Notificações",
    url: "/dashboard/notificacoes",
    icon: Bell,
    color: "from-red-500 to-rose-500",
    badge: "3",
  },
];

const quickStats = [
  { label: "Receitas", value: "R$ 45k", trend: "+12%", icon: TrendingUp, color: "text-green-500" },
  { label: "Performance", value: "98%", trend: "+5%", icon: Activity, color: "text-blue-500" },
  { label: "Meta Mensal", value: "87%", trend: "+8%", icon: Zap, color: "text-orange-500" },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar className="border-r bg-gradient-to-b from-background to-muted/20">
      <SidebarHeader className="border-b bg-gradient-to-br from-primary/5 to-transparent p-6">
        <Link href="/dashboard">
          <div className="flex items-center gap-3 group cursor-pointer" data-testid="link-dashboard-logo">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-600 shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
              <span className="text-xl font-bold text-white">F</span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-lg tracking-tight">FinControl</span>
              <span className="text-xs text-muted-foreground">Financial Suite</span>
            </div>
          </div>
        </Link>

        <div className="mt-6 flex items-center gap-3 rounded-xl bg-gradient-to-br from-card to-muted/30 p-4 border shadow-sm hover-elevate cursor-pointer" data-testid="profile-card">
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

        <div className="mt-4 grid grid-cols-3 gap-2">
          {quickStats.map((stat, index) => (
            <div
              key={index}
              className="flex flex-col items-center gap-1 rounded-lg bg-gradient-to-br from-muted/50 to-transparent p-2 border border-border/50"
              data-testid={`quick-stat-${index}`}
            >
              <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
              <span className="text-xs font-semibold">{stat.value}</span>
              <span className="text-[10px] text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4 overflow-y-auto">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                
                if (item.items) {
                  return (
                    <Collapsible key={item.title} asChild defaultOpen={false}>
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            className="group/item relative overflow-hidden"
                            data-testid={`button-menu-${item.title.toLowerCase()}`}
                          >
                            <div className={`absolute left-0 top-0 h-full w-1 bg-gradient-to-b ${item.color} opacity-0 group-hover/item:opacity-100 transition-opacity`} />
                            <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${item.color} shadow-sm`}>
                              <Icon className="h-4 w-4 text-white" strokeWidth={2.5} />
                            </div>
                            <span className="font-medium">{item.title}</span>
                            <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pb-2">
                          <SidebarMenuSub className="ml-6 mt-2 space-y-1 border-l-2 border-border/50 pl-4">
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
                                        className="flex items-center gap-2.5 w-full"
                                        data-testid={`link-submenu-${subItem.title.toLowerCase().replace(/\s+/g, '-')}`}
                                      >
                                        <SubIcon className="h-4 w-4 text-muted-foreground" />
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
                      className="group/item relative overflow-hidden"
                    >
                      <Link href={item.url}>
                        <div
                          className="flex items-center gap-3"
                          data-testid={`link-menu-${item.title.toLowerCase()}`}
                        >
                          <div className={`absolute left-0 top-0 h-full w-1 bg-gradient-to-b ${item.color} opacity-0 group-hover/item:opacity-100 transition-opacity`} />
                          <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${item.color} shadow-sm`}>
                            <Icon className="h-4 w-4 text-white" strokeWidth={2.5} />
                          </div>
                          <span className="font-medium flex-1">{item.title}</span>
                          {item.badge && (
                            <Badge
                              variant="secondary"
                              className="h-5 min-w-5 px-1.5 text-xs font-semibold bg-primary text-primary-foreground"
                            >
                              {item.badge}
                            </Badge>
                          )}
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

      <SidebarFooter className="border-t p-4 bg-gradient-to-br from-muted/30 to-transparent">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span>Sistema Online</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Última atualização: Há 2 minutos
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
