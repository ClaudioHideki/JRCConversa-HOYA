# JRCConversa HOYA

Projeto independente iniciado com o código completo do JRC Conversas no commit `e8e70d14246e18dc8f84e354f66a4b1ff548e7ad`.
As funcionalidades, traduções, migrations, flags padrão e licenças da base foram preservadas.
Esta importação não inclui histórico Git anterior, bancos, uploads, volumes, credenciais ou configurações de servidores.

## Imagem

O workflow `build-ghcr.yml` publica o componente `app` exclusivamente em
`ghcr.io/claudiohideki/jrcconversa-hoya:sha-<SHA completo HOYA>`.
Componentes adicionais, quando explicitamente publicados, usam pacotes `jrcconversa-hoya-<componente>`.
Fornecer `source_sha` final e `base_sha` da importação `f22a5e6866ecc0ac7bdad24e94cb711607429f62`. Tags SHA existentes não são sobrescritas.
Dockerfile, bases fixadas e dependências são as mesmas da versão de origem.
O workflow nativo usa PostgreSQL e credenciais descartáveis, nunca bancos reais.

## Instalação futura

Configurar domínio, PostgreSQL, Redis e armazenamento próprios do HOYA. Criar segredos próprios em canal seguro.
Consultar `.env.example` como modelo; nunca copiar `.env`, banco, contas ou usuários do LAB/Grupo JRC.
Definir projeto/serviço, tenant, acesso e backup/restore antes de qualquer deploy.
Revisar migrations pendentes e o init `db:chatwoot_prepare`, que pode preparar schema/seed ou executar migrate.
As flags de módulos conservam os padrões do produto; não há habilitação automática de aprovações nem enforcement.
Rollback deve identificar imagem anterior e procedimento de restauração do HOYA; não usar imagens/bancos de outros ambientes por suposição.

Esta entrega cria o repositório e a candidata. Não faz deploy nem rebranding da interface.
