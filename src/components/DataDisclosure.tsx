export default function DataDisclosure() {
  return (
    <aside
      aria-label="Fonte e compartilhamento de dados"
      className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300 backdrop-blur-md [overflow-wrap:anywhere]"
    >
      <p className="font-semibold text-white">
        Dados meteorológicos por{' '}
        <a className="underline" href="https://open-meteo.com/">
          Open-Meteo
        </a>
        {' · '}Localidades baseadas em{' '}
        <a className="underline" href="https://www.geonames.org/">
          GeoNames
        </a>
        {' · '}
        <a className="underline" href="https://creativecommons.org/licenses/by/4.0/">
          CC BY 4.0
        </a>
      </p>
      <p className="mt-2">
        Ao digitar pelo menos 3 letras ou enviar a busca, o nome pesquisado é enviado à Open-Meteo.
        Ao selecionar uma sugestão, as coordenadas dessa cidade são enviadas para consultar o clima.
      </p>
      <p className="mt-2">
        Dados adaptados para apresentação: rótulos traduzidos, campos validados e temperaturas
        convertidas quando selecionado °F. Condições calculadas por modelos meteorológicos; o
        horário de atualização do modelo é desconhecido.
      </p>
      <p className="mt-2">
        Segundo os{' '}
        <a className="underline" href="https://open-meteo.com/en/terms#privacy">
          termos e política de privacidade da Open-Meteo
        </a>
        , o serviço pode processar IP e manter logs, inclusive coordenadas, por até 90 dias. Este
        aplicativo não solicita geolocalização nem persiste preferências.
      </p>
      <p className="mt-2">
        Uso experimental de treinamento. A avaliação de privacidade e a comprovação de atualidade
        dos modelos (T-22) continuam como bloqueadores de lançamento, sem aprovação para produção.
      </p>
    </aside>
  );
}
