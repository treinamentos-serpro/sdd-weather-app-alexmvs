export default function DataDisclosure() {
  return (
    <aside
      aria-label="Fonte e compartilhamento de dados"
      className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300 backdrop-blur-md [overflow-wrap:anywhere]"
    >
      <p className="font-semibold text-white">Demonstração com dados fictícios</p>
      <p className="mt-2">
        A busca usa apenas dados locais. O nome digitado e as coordenadas selecionadas não são
        enviados à Open-Meteo nem a outra API de clima.
      </p>
      <p className="mt-2">
        Na futura integração, o nome pesquisado e as coordenadas da cidade serão enviados à
        Open-Meteo. A atribuição e o aviso definitivos dependem da validação dos termos do provedor
        (T-22), ainda pendente.
      </p>
      <p className="mt-2">
        Os dados são exemplos fixos, não observações meteorológicas reais. Nenhuma preferência é
        persistida.
      </p>
    </aside>
  );
}
