export default function Notificacoes() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Notificações</h1>
        <p className="text-muted-foreground">
          Acompanhe alertas e avisos importantes
        </p>
      </div>
      <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed">
        <p className="text-muted-foreground">Conteúdo em desenvolvimento</p>
      </div>
    </div>
  );
}
