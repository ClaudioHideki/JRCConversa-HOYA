import { localizeVisualScreen } from '../../../jrcContactCenter/demo/localizeVisualScreen';

const metric = (label, value, detail, icon, tone = 'blue', trend = '') => ({
  label,
  value,
  detail,
  icon,
  tone,
  trend,
});

const action = (label, icon, tone = 'primary', routeName = null) => ({
  label,
  icon,
  tone,
  routeName,
});

export const crmFieldCatalog = {
  myDay: {
    key: 'myDay',
    eyebrow: 'CRM Field HOYA',
    title: 'Meu Dia',
    description:
      'Agenda, visitas, retornos e oportunidades organizados para a rotina de vendedor ou divulgador.',
    icon: 'i-lucide-sun',
    accent: 'blue',
    status: { label: 'Quinta, 15 de outubro', tone: 'blue' },
    metrics: [
      metric(
        'Visitas hoje',
        '6',
        '2 concluídas · 4 próximas',
        'i-lucide-map-pin-check',
        'blue'
      ),
      metric(
        'Retornos',
        '3',
        '1 prioritário',
        'i-lucide-phone-forwarded',
        'amber'
      ),
      metric(
        'Negócios',
        '8',
        'R$ 132 mil em aberto',
        'i-lucide-handshake',
        'violet'
      ),
      metric('Pendências', '2', 'Atrasadas', 'i-lucide-triangle-alert', 'ruby'),
    ],
    primary: {
      title: 'Agenda de hoje',
      subtitle: 'Roteiro e compromissos do colaborador',
      items: [
        {
          title: 'Ótica Premium',
          description: 'Visita comercial concluída',
          meta: '09:00',
          status: 'Concluída',
          tone: 'emerald',
          icon: 'i-lucide-check-circle-2',
        },
        {
          title: 'Ótica Visão Center',
          description: 'Apresentação Linha HOYA',
          meta: '10:30',
          status: 'Próxima visita',
          tone: 'blue',
          icon: 'i-lucide-map-pin',
        },
        {
          title: 'Centro Óptico Brasil',
          description: 'Follow-up de proposta',
          meta: '13:30',
          status: 'Agendada',
          tone: 'violet',
          icon: 'i-lucide-calendar-clock',
        },
        {
          title: 'Treinamento Linha Premium',
          description: 'Equipe de vendas da ótica',
          meta: '15:00',
          status: 'Divulgação',
          tone: 'amber',
          icon: 'i-lucide-presentation',
        },
      ],
    },
    secondary: {
      title: 'Próxima visita',
      items: [
        {
          title: 'Ótica Visão Center',
          description: 'Campinas/SP · 10:30',
          icon: 'i-lucide-building-2',
        },
        {
          title: 'Objetivo',
          description: 'Apresentar Linha HOYA e revisar pedidos',
          icon: 'i-lucide-target',
        },
        {
          title: 'Cliente 360°',
          description: '5 pedidos · 3 oportunidades',
          icon: 'i-lucide-orbit',
        },
      ],
    },
    actions: [
      action('Iniciar visita', 'i-lucide-play'),
      action('Abrir cliente', 'i-lucide-building-2', 'secondary'),
      action('Novo retorno', 'i-lucide-calendar-plus', 'secondary'),
    ],
  },
  calendar: {
    key: 'calendar',
    eyebrow: 'Planejamento de campo',
    title: 'Agenda e Calendário',
    description:
      'Visitas, retornos, treinamentos, tarefas e compromissos comerciais em uma agenda única.',
    icon: 'i-lucide-calendar-days',
    accent: 'violet',
    status: { label: 'Semana 42', tone: 'violet' },
    metrics: [
      metric(
        'Compromissos',
        '18',
        'Nesta semana',
        'i-lucide-calendar-check-2',
        'violet'
      ),
      metric(
        'Visitas',
        '11',
        '7 comerciais · 4 divulgação',
        'i-lucide-map-pin',
        'blue'
      ),
      metric('Retornos', '5', '2 hoje', 'i-lucide-phone-forwarded', 'teal'),
      metric(
        'Conflitos',
        '1',
        'Requer ajuste',
        'i-lucide-calendar-x-2',
        'amber'
      ),
    ],
    primary: {
      title: 'Calendário da semana',
      subtitle: 'Horários locais da operação HOYA',
      items: [
        {
          title: 'Segunda · Região Campinas',
          description: '3 visitas · 1 retorno',
          meta: '08:30–17:00',
          status: 'Concluído',
          tone: 'emerald',
          icon: 'i-lucide-calendar-check',
        },
        {
          title: 'Terça · Região Jundiaí',
          description: '2 visitas · treinamento',
          meta: '09:00–16:30',
          status: 'Concluído',
          tone: 'emerald',
          icon: 'i-lucide-calendar-check',
        },
        {
          title: 'Quarta · Remoto',
          description: 'Follow-ups e propostas',
          meta: '08:00–18:00',
          status: 'Concluído',
          tone: 'emerald',
          icon: 'i-lucide-laptop',
        },
        {
          title: 'Quinta · Campinas',
          description: '4 visitas · 2 retornos',
          meta: '09:00–17:30',
          status: 'Em andamento',
          tone: 'blue',
          icon: 'i-lucide-calendar-clock',
        },
        {
          title: 'Sexta · Gestão regional',
          description: 'Reunião e fechamento da semana',
          meta: '10:00–15:00',
          status: 'Planejado',
          tone: 'violet',
          icon: 'i-lucide-users-round',
        },
      ],
    },
    secondary: {
      title: 'Filtros rápidos',
      items: [
        {
          title: 'Visitas comerciais',
          description: 'Vendedor e oportunidades',
          icon: 'i-lucide-handshake',
        },
        {
          title: 'Ações de divulgação',
          description: 'Treinamentos e materiais',
          icon: 'i-lucide-megaphone',
        },
        {
          title: 'Tarefas e retornos',
          description: 'Prazos e responsáveis',
          icon: 'i-lucide-list-checks',
        },
      ],
    },
    actions: [
      action('Nova visita', 'i-lucide-map-pin-plus'),
      action('Nova tarefa', 'i-lucide-list-plus', 'secondary'),
    ],
  },
  map: {
    key: 'map',
    eyebrow: 'Território e rota',
    title: 'Mapa de Visitas',
    description:
      'Visualização regional da carteira, visitas planejadas e prioridades de relacionamento.',
    icon: 'i-lucide-map',
    accent: 'teal',
    status: { label: 'Sudeste · Campinas', tone: 'teal' },
    metrics: [
      metric(
        'Óticas na rota',
        '12',
        'Raio planejado de 48 km',
        'i-lucide-store',
        'blue'
      ),
      metric(
        'Visitas hoje',
        '6',
        '2 concluídas',
        'i-lucide-map-pin-check',
        'teal'
      ),
      metric(
        'Distância',
        '74 km',
        'Estimativa de deslocamento',
        'i-lucide-route',
        'violet'
      ),
      metric(
        'Prioridades',
        '3',
        'Relacionamento crítico',
        'i-lucide-siren',
        'ruby'
      ),
    ],
    primary: {
      title: 'Rota comercial',
      subtitle: 'Sequência sugerida respeitando janela e território',
      items: [
        {
          title: 'Ótica Premium',
          description: 'Centro · visita concluída',
          meta: '09:00',
          status: 'Concluída',
          tone: 'emerald',
          icon: 'i-lucide-map-pin-check',
        },
        {
          title: 'Ótica Visão Center',
          description: 'Cambuí · oportunidade ativa',
          meta: '10:30',
          status: 'Próxima',
          tone: 'blue',
          icon: 'i-lucide-navigation',
        },
        {
          title: 'Centro Óptico Brasil',
          description: 'Taquaral · proposta pendente',
          meta: '13:30',
          status: 'Planejada',
          tone: 'violet',
          icon: 'i-lucide-map-pin',
        },
        {
          title: 'Ótica Novo Olhar',
          description: 'Barão Geraldo · pedido recente',
          meta: '15:30',
          status: 'Planejada',
          tone: 'amber',
          icon: 'i-lucide-map-pin',
        },
      ],
    },
    secondary: {
      title: 'Legenda',
      items: [
        {
          title: 'Carteira autorizada',
          description: 'Somente clientes do território',
          icon: 'i-lucide-shield-check',
        },
        {
          title: 'Prioridade comercial',
          description: 'Baseada em atividade e oportunidade',
          icon: 'i-lucide-flame',
        },
        {
          title: 'Localização opcional',
          description: 'Consentimento e uso governado',
          icon: 'i-lucide-map-pin-check',
        },
      ],
    },
  },
  newVisit: {
    key: 'newVisit',
    eyebrow: 'Atividade de campo',
    title: 'Nova Visita / Check-in',
    description:
      'Registro de objetivo, localização opcional, participantes, notas e próximos passos.',
    icon: 'i-lucide-map-pin-plus',
    accent: 'blue',
    status: { label: 'Rascunho', tone: 'amber' },
    metrics: [
      metric(
        'Cliente',
        'Visão Center',
        'Carteira autorizada',
        'i-lucide-building-2',
        'blue'
      ),
      metric(
        'Horário',
        '10:30',
        'Janela confirmada',
        'i-lucide-clock-3',
        'teal'
      ),
      metric(
        'Objetivo',
        'Comercial',
        'Apresentação de linha',
        'i-lucide-target',
        'violet'
      ),
      metric(
        'Check-in',
        'Opcional',
        'Conforme consentimento',
        'i-lucide-map-pin-check',
        'amber'
      ),
    ],
    primary: {
      title: 'Dados da visita',
      subtitle: 'Formulário preparado para operação mobile',
      items: [
        {
          title: 'Cliente / Ótica',
          description: 'Ótica Visão Center · Campinas/SP',
          status: 'Selecionada',
          tone: 'emerald',
          icon: 'i-lucide-building-2',
        },
        {
          title: 'Objetivo',
          description: 'Apresentar Linha HOYA e revisar oportunidades',
          status: 'Definido',
          tone: 'blue',
          icon: 'i-lucide-target',
        },
        {
          title: 'Participantes',
          description: 'Carla Mendes e equipe comercial',
          status: '2 contatos',
          tone: 'violet',
          icon: 'i-lucide-users-round',
        },
        {
          title: 'Materiais',
          description: 'Catálogo Linha Premium · tabela técnica',
          status: 'Anexados',
          tone: 'teal',
          icon: 'i-lucide-paperclip',
        },
        {
          title: 'Próximos passos',
          description: 'Definir após relatório da visita',
          status: 'Pendente',
          tone: 'amber',
          icon: 'i-lucide-list-checks',
        },
      ],
    },
    secondary: {
      title: 'Check-in seguro',
      items: [
        {
          title: 'Permissão explícita',
          description: 'Localização somente quando autorizada',
          icon: 'i-lucide-shield-check',
        },
        {
          title: 'Horário registrado',
          description: 'Início e fim da atividade',
          icon: 'i-lucide-timer',
        },
        {
          title: 'Modo offline futuro',
          description: 'Sincronização segura e conflitos',
          icon: 'i-lucide-cloud-off',
        },
      ],
    },
    actions: [
      action('Iniciar visita', 'i-lucide-play'),
      action('Salvar rascunho', 'i-lucide-save', 'secondary'),
    ],
  },
  visitReport: {
    key: 'visitReport',
    eyebrow: 'Resultado de campo',
    title: 'Relatório de Visita',
    description:
      'Resumo da interação, materiais apresentados, oportunidades e próximos passos com revisão humana.',
    icon: 'i-lucide-clipboard-check',
    accent: 'teal',
    status: { label: 'Visita concluída', tone: 'emerald' },
    metrics: [
      metric('Duração', '01:12', '10:31–11:43', 'i-lucide-timer', 'teal'),
      metric(
        'Participantes',
        '4',
        'Equipe da ótica',
        'i-lucide-users-round',
        'blue'
      ),
      metric(
        'Oportunidades',
        '2',
        'R$ 32 mil estimados',
        'i-lucide-handshake',
        'violet'
      ),
      metric(
        'Retorno',
        '21/10',
        'Próximo passo acordado',
        'i-lucide-calendar-check-2',
        'amber'
      ),
    ],
    primary: {
      title: 'Resumo da visita',
      subtitle: 'Histórico preservado no Cliente 360°',
      items: [
        {
          title: 'Linha HOYA Premium',
          description: 'Apresentação técnica e comercial realizada',
          status: 'Concluído',
          tone: 'emerald',
          icon: 'i-lucide-presentation',
        },
        {
          title: 'Oportunidade · Upgrade de mix',
          description: 'Interesse em nova linha de lentes',
          status: 'Criada',
          tone: 'violet',
          icon: 'i-lucide-sparkles',
        },
        {
          title: 'Treinamento de equipe',
          description: 'Solicitado para próxima visita',
          status: 'Pendente',
          tone: 'amber',
          icon: 'i-lucide-graduation-cap',
        },
        {
          title: 'Materiais entregues',
          description: 'Catálogo e ficha técnica',
          status: 'Registrado',
          tone: 'blue',
          icon: 'i-lucide-files',
        },
        {
          title: 'Observações',
          description: 'Cliente prioriza prazo e suporte de montagem',
          status: 'Salvo',
          tone: 'teal',
          icon: 'i-lucide-notebook-pen',
        },
      ],
    },
    secondary: {
      title: 'Próximos passos',
      items: [
        {
          title: 'Enviar proposta',
          description: 'Até amanhã às 12:00',
          icon: 'i-lucide-file-signature',
        },
        {
          title: 'Agendar treinamento',
          description: '21/10 às 10:30',
          icon: 'i-lucide-calendar-plus',
        },
        {
          title: 'Atualizar oportunidade',
          description: 'Valor e probabilidade',
          icon: 'i-lucide-handshake',
        },
      ],
    },
    actions: [
      action('Salvar relatório', 'i-lucide-save'),
      action('Criar oportunidade', 'i-lucide-handshake', 'secondary'),
    ],
  },
  wallet: {
    key: 'wallet',
    eyebrow: 'Carteira e território',
    title: 'Minha Carteira',
    description:
      'Óticas autorizadas, segmentação, última interação, oportunidade e próxima ação.',
    icon: 'i-lucide-briefcase-business',
    accent: 'blue',
    status: { label: 'Sudeste · 84 óticas', tone: 'blue' },
    metrics: [
      metric(
        'Clientes',
        '84',
        '76 ativos · 8 em atenção',
        'i-lucide-store',
        'blue'
      ),
      metric(
        'Pipeline',
        'R$ 482 mil',
        '23 oportunidades',
        'i-lucide-chart-no-axes-combined',
        'violet'
      ),
      metric(
        'Sem contato',
        '7',
        'Mais de 30 dias',
        'i-lucide-user-round-x',
        'amber'
      ),
      metric('Prioridades', '12', 'Próximos 7 dias', 'i-lucide-flame', 'ruby'),
    ],
    primary: {
      title: 'Clientes da carteira',
      subtitle: 'Escopo explícito por colaborador e região',
      items: [
        {
          title: 'Ótica Visão Center',
          description: 'Campinas · última interação hoje',
          meta: 'R$ 32 mil',
          status: 'Oportunidade ativa',
          tone: 'violet',
          icon: 'i-lucide-store',
        },
        {
          title: 'Ótica Premium',
          description: 'Campinas · visita concluída',
          meta: 'R$ 18 mil',
          status: 'Proposta',
          tone: 'blue',
          icon: 'i-lucide-store',
        },
        {
          title: 'Centro Óptico Brasil',
          description: 'Jundiaí · 12 dias sem contato',
          meta: 'R$ 24 mil',
          status: 'Follow-up',
          tone: 'amber',
          icon: 'i-lucide-store',
        },
        {
          title: 'Ótica Novo Olhar',
          description: 'Valinhos · pedido recente',
          meta: 'R$ 9 mil',
          status: 'Relacionamento',
          tone: 'teal',
          icon: 'i-lucide-store',
        },
        {
          title: 'Ótica Prime Vision',
          description: 'Campinas · ocorrência aberta',
          meta: 'Alta prioridade',
          status: 'Atenção',
          tone: 'ruby',
          icon: 'i-lucide-store',
        },
      ],
    },
    secondary: {
      title: 'Segmentos',
      items: [
        {
          title: 'Premium',
          description: '18 óticas · alto potencial',
          icon: 'i-lucide-gem',
        },
        {
          title: 'Crescimento',
          description: '32 óticas · expansão de mix',
          icon: 'i-lucide-trending-up',
        },
        {
          title: 'Relacionamento',
          description: '34 óticas · manutenção',
          icon: 'i-lucide-heart-handshake',
        },
      ],
    },
  },
  customer360: {
    key: 'customer360',
    eyebrow: 'Cliente 360°',
    title: 'Cliente e Ótica 360°',
    description:
      'Pedidos, oportunidades, visitas, atendimentos, contatos e próximos passos em uma única ficha.',
    icon: 'i-lucide-orbit',
    accent: 'teal',
    status: { label: 'Cliente ativo', tone: 'emerald' },
    metrics: [
      metric('Pedidos', '5', '2 em andamento', 'i-lucide-package', 'teal'),
      metric(
        'Pipeline',
        'R$ 84.500',
        '3 oportunidades',
        'i-lucide-handshake',
        'violet'
      ),
      metric(
        'Atendimentos',
        '8',
        'SAC, voz e digital',
        'i-lucide-headphones',
        'blue'
      ),
      metric(
        'Próxima visita',
        '21/10',
        '10:30 · Carlos Silva',
        'i-lucide-calendar-check-2',
        'amber'
      ),
    ],
    primary: {
      title: 'Relacionamento unificado',
      subtitle: 'CRM Field e Contact Center compartilham o mesmo cadastro',
      items: [
        {
          title: 'Contato principal · Carla Mendes',
          description: 'Compras / Administrativo',
          status: 'Confirmado',
          tone: 'emerald',
          icon: 'i-lucide-user-round-check',
        },
        {
          title: 'Pedido #78456',
          description: 'Lentes progressivas · Em montagem',
          status: 'Em andamento',
          tone: 'teal',
          icon: 'i-lucide-package-cog',
        },
        {
          title: 'Visita Linha Premium',
          description: 'Apresentação realizada em 15/10',
          status: 'Concluída',
          tone: 'blue',
          icon: 'i-lucide-map-pin-check',
        },
        {
          title: 'Oportunidade Upgrade de Mix',
          description: 'R$ 32.000 · 65% de probabilidade',
          status: 'Negociação',
          tone: 'violet',
          icon: 'i-lucide-handshake',
        },
        {
          title: 'Atendimento SAC',
          description: 'Protocolo JRC-2026-1842',
          status: 'Finalizado',
          tone: 'amber',
          icon: 'i-lucide-headphones',
        },
      ],
    },
    secondary: {
      title: 'Ações rápidas',
      items: [
        {
          title: 'Nova visita',
          description: 'Agendar ou iniciar atividade',
          icon: 'i-lucide-map-pin-plus',
        },
        {
          title: 'Nova oportunidade',
          description: 'Vincular ao cliente existente',
          icon: 'i-lucide-handshake',
        },
        {
          title: 'Abrir Contact Center',
          description: 'Visualizar jornada de atendimento',
          icon: 'i-lucide-headphones',
        },
      ],
    },
    timeline: [
      {
        title: 'Ligação SAC concluída',
        description: 'Consulta do pedido #78456 e callback',
        time: 'Hoje · 10:18',
        status: 'Contact Center',
        tone: 'blue',
        icon: 'i-lucide-phone-call',
      },
      {
        title: 'Visita comercial concluída',
        description: 'Linha Premium apresentada',
        time: 'Hoje · 11:43',
        status: 'CRM Field',
        tone: 'teal',
        icon: 'i-lucide-map-pin-check',
      },
      {
        title: 'Oportunidade criada',
        description: 'Upgrade de mix · R$ 32.000',
        time: 'Hoje · 11:50',
        status: 'CRM',
        tone: 'violet',
        icon: 'i-lucide-handshake',
      },
      {
        title: 'Pedido atualizado',
        description: 'Status demonstrativo: em montagem',
        time: 'Ontem · 17:42',
        status: 'ERP',
        tone: 'amber',
        icon: 'i-lucide-package-check',
      },
    ],
    actions: [
      action(
        'Abrir Contact Center',
        'i-lucide-headphones',
        'primary',
        'jrc_contact_center_customer_360'
      ),
      action(
        'Abrir Cockpit',
        'i-lucide-phone-call',
        'secondary',
        'jrc_contact_center_cockpit'
      ),
    ],
  },
  opportunities: {
    key: 'opportunities',
    eyebrow: 'Pipeline Field',
    title: 'Oportunidades',
    description:
      'Negócios por cliente, território, etapa, probabilidade e próximo passo.',
    icon: 'i-lucide-handshake',
    accent: 'violet',
    status: { label: '23 oportunidades', tone: 'violet' },
    metrics: [
      metric(
        'Pipeline',
        'R$ 482 mil',
        '23 oportunidades abertas',
        'i-lucide-chart-no-axes-combined',
        'violet'
      ),
      metric(
        'Previsão',
        'R$ 214 mil',
        'Ponderada por probabilidade',
        'i-lucide-chart-spline',
        'blue'
      ),
      metric(
        'Ganhos no mês',
        'R$ 86 mil',
        '7 oportunidades',
        'i-lucide-trophy',
        'teal'
      ),
      metric(
        'Sem próximo passo',
        '3',
        'Requer ação',
        'i-lucide-triangle-alert',
        'amber'
      ),
    ],
    primary: {
      title: 'Pipeline por cliente',
      subtitle: 'Oportunidades comerciais da carteira autorizada',
      items: [
        {
          title: 'Upgrade de Mix · Visão Center',
          description: 'Negociação · 65% de probabilidade',
          meta: 'R$ 32.000',
          status: '21/10',
          tone: 'violet',
          icon: 'i-lucide-handshake',
        },
        {
          title: 'Linha Premium · Ótica Premium',
          description: 'Proposta enviada · 75%',
          meta: 'R$ 18.000',
          status: 'Aguardando cliente',
          tone: 'blue',
          icon: 'i-lucide-file-signature',
        },
        {
          title: 'Treinamento e lançamento · Novo Olhar',
          description: 'Qualificação · 40%',
          meta: 'R$ 12.500',
          status: 'Visita agendada',
          tone: 'teal',
          icon: 'i-lucide-sparkles',
        },
        {
          title: 'Expansão de carteira · Centro Óptico',
          description: 'Descoberta · 30%',
          meta: 'R$ 24.000',
          status: 'Follow-up',
          tone: 'amber',
          icon: 'i-lucide-target',
        },
      ],
    },
    secondary: {
      title: 'Próximos passos',
      items: [
        {
          title: '3 propostas para revisar',
          description: 'Vencem nesta semana',
          icon: 'i-lucide-file-clock',
        },
        {
          title: '5 follow-ups programados',
          description: 'Agenda integrada',
          icon: 'i-lucide-calendar-check-2',
        },
        {
          title: '2 oportunidades sem owner',
          description: 'Gestão regional',
          icon: 'i-lucide-user-round-x',
        },
      ],
    },
    chart: [34, 42, 39, 56, 61, 58, 69, 74, 81, 78, 89, 94],
  },
  orders: {
    key: 'orders',
    eyebrow: 'Pedidos e relacionamento',
    title: 'Pedidos e Entregas',
    description:
      'Referências ERP, situação publicável, histórico e vínculo com cliente e oportunidade.',
    icon: 'i-lucide-package-check',
    accent: 'teal',
    status: { label: 'ERP futuro', tone: 'violet' },
    metrics: [
      metric(
        'Pedidos ativos',
        '18',
        'Carteira autorizada',
        'i-lucide-package',
        'teal'
      ),
      metric(
        'Em montagem',
        '7',
        'Status demonstrativo',
        'i-lucide-package-cog',
        'blue'
      ),
      metric('Em transporte', '4', 'Acompanhamento', 'i-lucide-truck', 'amber'),
      metric(
        'Ocorrências',
        '2',
        'Relacionadas a pedidos',
        'i-lucide-file-warning',
        'ruby'
      ),
    ],
    primary: {
      title: 'Pedidos da carteira',
      subtitle: 'Pedido ERP não é pedido comercial JRC',
      items: [
        {
          title: '#78456 · Ótica Visão Center',
          description: 'Lentes progressivas HOYA',
          meta: '06/10',
          status: 'Em montagem',
          tone: 'blue',
          icon: 'i-lucide-package-cog',
        },
        {
          title: '#78321 · Ótica Premium',
          description: 'Lentes monofocais HOYA',
          meta: '28/09',
          status: 'Em transporte',
          tone: 'amber',
          icon: 'i-lucide-truck',
        },
        {
          title: '#78110 · Novo Olhar',
          description: 'Lentes ocupacionais HOYA',
          meta: '12/09',
          status: 'Entregue',
          tone: 'emerald',
          icon: 'i-lucide-package-check',
        },
        {
          title: '#78082 · Centro Óptico',
          description: 'Linha Premium',
          meta: '08/09',
          status: 'Ocorrência aberta',
          tone: 'ruby',
          icon: 'i-lucide-package-x',
        },
      ],
    },
    secondary: {
      title: 'Acompanhamento',
      items: [
        {
          title: 'Consultar status',
          description: 'Contrato ERP autenticado no futuro',
          icon: 'i-lucide-search',
        },
        {
          title: 'Abrir ocorrência',
          description: 'Vinculada ao mesmo cliente e pedido',
          icon: 'i-lucide-clipboard-plus',
        },
        {
          title: 'Agendar retorno',
          description: 'Minha Agenda',
          icon: 'i-lucide-calendar-plus',
        },
      ],
    },
  },
  tasks: {
    key: 'tasks',
    eyebrow: 'Execução comercial',
    title: 'Tarefas e Retornos',
    description:
      'Próximos passos, prazos, responsáveis e atividades relacionadas à carteira.',
    icon: 'i-lucide-list-checks',
    accent: 'amber',
    status: { label: '12 pendências', tone: 'amber' },
    metrics: [
      metric('Hoje', '5', '2 concluídas', 'i-lucide-calendar-check-2', 'blue'),
      metric(
        'Atrasadas',
        '2',
        'Requer atenção',
        'i-lucide-triangle-alert',
        'ruby'
      ),
      metric(
        'Próximos 7 dias',
        '12',
        'Visitas e retornos',
        'i-lucide-calendar-range',
        'violet'
      ),
      metric(
        'Concluídas',
        '84%',
        'No prazo no mês',
        'i-lucide-circle-check-big',
        'teal'
      ),
    ],
    primary: {
      title: 'Minha fila de trabalho',
      subtitle: 'Atividades por prioridade e prazo',
      items: [
        {
          title: 'Enviar proposta · Visão Center',
          description: 'Oportunidade Upgrade de Mix',
          meta: 'Hoje 12:00',
          status: 'Alta',
          tone: 'ruby',
          icon: 'i-lucide-file-signature',
        },
        {
          title: 'Retornar Ótica Premium',
          description: 'Confirmar recebimento da proposta',
          meta: 'Hoje 14:30',
          status: 'Média',
          tone: 'amber',
          icon: 'i-lucide-phone-forwarded',
        },
        {
          title: 'Agendar treinamento · Novo Olhar',
          description: 'Equipe comercial',
          meta: 'Amanhã',
          status: 'Planejada',
          tone: 'blue',
          icon: 'i-lucide-graduation-cap',
        },
        {
          title: 'Atualizar oportunidade · Centro Óptico',
          description: 'Valor e próximo passo',
          meta: 'Amanhã',
          status: 'CRM',
          tone: 'violet',
          icon: 'i-lucide-handshake',
        },
        {
          title: 'Revisar pedido #78082',
          description: 'Ocorrência vinculada',
          meta: '18/10',
          status: 'Atenção',
          tone: 'ruby',
          icon: 'i-lucide-package-search',
        },
      ],
    },
    secondary: {
      title: 'Organização',
      items: [
        {
          title: 'Por prioridade',
          description: 'Alta, média e normal',
          icon: 'i-lucide-list-filter',
        },
        {
          title: 'Por cliente',
          description: 'Timeline no Cliente 360°',
          icon: 'i-lucide-building-2',
        },
        {
          title: 'Por responsável',
          description: 'Escopo e transferência auditados',
          icon: 'i-lucide-user-cog',
        },
      ],
    },
  },
  promotion: {
    key: 'promotion',
    eyebrow: 'Divulgação HOYA',
    title: 'Ações de Divulgação',
    description:
      'Campanhas de campo, demonstrações, materiais, público e resultados por região.',
    icon: 'i-lucide-megaphone',
    accent: 'violet',
    status: { label: '4 ações ativas', tone: 'violet' },
    metrics: [
      metric(
        'Ações ativas',
        '4',
        '2 regionais · 2 nacionais',
        'i-lucide-megaphone',
        'violet'
      ),
      metric(
        'Óticas envolvidas',
        '38',
        'Carteiras autorizadas',
        'i-lucide-store',
        'blue'
      ),
      metric(
        'Participantes',
        '126',
        'Público registrado',
        'i-lucide-users-round',
        'teal'
      ),
      metric(
        'Conversão',
        '18%',
        'Oportunidades derivadas',
        'i-lucide-trending-up',
        'amber'
      ),
    ],
    primary: {
      title: 'Ações em andamento',
      subtitle: 'Atividades do perfil divulgador',
      items: [
        {
          title: 'Linha Premium HOYA',
          description: 'Campinas · 12 óticas',
          meta: '15–30/10',
          status: 'Em execução',
          tone: 'violet',
          icon: 'i-lucide-sparkles',
        },
        {
          title: 'Semana da Saúde Visual',
          description: 'Região Sudeste · 18 óticas',
          meta: '01–07/11',
          status: 'Planejada',
          tone: 'blue',
          icon: 'i-lucide-calendar-range',
        },
        {
          title: 'Treinamento Varilux',
          description: 'Jundiaí · 6 óticas',
          meta: '22/10',
          status: 'Inscrições abertas',
          tone: 'teal',
          icon: 'i-lucide-graduation-cap',
        },
        {
          title: 'Materiais PDV',
          description: 'Distribuição controlada',
          meta: 'Outubro',
          status: 'Acompanhamento',
          tone: 'amber',
          icon: 'i-lucide-box',
        },
      ],
    },
    secondary: {
      title: 'Resultados',
      items: [
        {
          title: 'Oportunidades geradas',
          description: '14 vinculadas ao CRM',
          icon: 'i-lucide-handshake',
        },
        {
          title: 'Materiais utilizados',
          description: 'Versão e lote registrados',
          icon: 'i-lucide-boxes',
        },
        {
          title: 'Feedback das óticas',
          description: 'Pesquisa pós-ação',
          icon: 'i-lucide-message-circle-heart',
        },
      ],
    },
  },
  training: {
    key: 'training',
    eyebrow: 'Capacitação da rede',
    title: 'Treinamentos',
    description:
      'Agenda, conteúdo, participantes, presença, avaliação e histórico por ótica.',
    icon: 'i-lucide-graduation-cap',
    accent: 'blue',
    status: { label: '3 próximos', tone: 'blue' },
    metrics: [
      metric(
        'Próximos',
        '3',
        'Nos próximos 15 dias',
        'i-lucide-calendar-clock',
        'blue'
      ),
      metric(
        'Participantes',
        '48',
        'Inscritos',
        'i-lucide-users-round',
        'teal'
      ),
      metric(
        'Concluídos',
        '12',
        'Neste trimestre',
        'i-lucide-circle-check-big',
        'violet'
      ),
      metric(
        'Avaliação',
        '4,8/5',
        'Média das respostas',
        'i-lucide-star',
        'amber'
      ),
    ],
    primary: {
      title: 'Agenda de treinamentos',
      subtitle: 'Conteúdo versionado e acesso por perfil',
      items: [
        {
          title: 'Linha Premium HOYA',
          description: 'Ótica Visão Center · presencial',
          meta: '21/10 10:30',
          status: 'Confirmado',
          tone: 'emerald',
          icon: 'i-lucide-presentation',
        },
        {
          title: 'Varilux · Atualização técnica',
          description: 'Região Campinas · híbrido',
          meta: '24/10 14:00',
          status: 'Inscrições abertas',
          tone: 'blue',
          icon: 'i-lucide-video',
        },
        {
          title: 'Atendimento consultivo',
          description: 'Equipe comercial · online',
          meta: '29/10 09:00',
          status: 'Planejado',
          tone: 'violet',
          icon: 'i-lucide-headset',
        },
        {
          title: 'Montagem e qualidade',
          description: 'COE São Paulo · presencial',
          meta: '04/11 08:30',
          status: 'Planejado',
          tone: 'amber',
          icon: 'i-lucide-settings-2',
        },
      ],
    },
    secondary: {
      title: 'Gestão do conteúdo',
      items: [
        {
          title: 'Materiais versionados',
          description: 'Apresentações e anexos',
          icon: 'i-lucide-files',
        },
        {
          title: 'Presença e certificado',
          description: 'Registro por participante',
          icon: 'i-lucide-badge-check',
        },
        {
          title: 'Pesquisa de avaliação',
          description: 'Regra pós-treinamento',
          icon: 'i-lucide-message-circle-heart',
        },
      ],
    },
  },
  catalog: {
    key: 'catalog',
    eyebrow: 'Conteúdo comercial',
    title: 'Catálogo e Materiais',
    description:
      'Produtos, linhas, materiais técnicos, apresentações e versões disponíveis por perfil.',
    icon: 'i-lucide-library-big',
    accent: 'teal',
    status: { label: 'Conteúdo versionado', tone: 'teal' },
    metrics: [
      metric(
        'Linhas',
        '8',
        'Portfólio demonstrativo',
        'i-lucide-boxes',
        'teal'
      ),
      metric(
        'Materiais',
        '42',
        'PDF, vídeo e apresentação',
        'i-lucide-files',
        'blue'
      ),
      metric('Atualizações', '5', 'Neste mês', 'i-lucide-refresh-cw', 'violet'),
      metric(
        'Favoritos',
        '12',
        'Acesso rápido do usuário',
        'i-lucide-star',
        'amber'
      ),
    ],
    primary: {
      title: 'Biblioteca HOYA',
      subtitle: 'Conteúdo organizado por linha, público e versão',
      items: [
        {
          title: 'Linha Premium HOYA',
          description: 'Catálogo, argumentos e ficha técnica',
          meta: 'v3.2',
          status: 'Atualizado',
          tone: 'emerald',
          icon: 'i-lucide-gem',
        },
        {
          title: 'Varilux',
          description: 'Apresentação e comparativo técnico',
          meta: 'v2.8',
          status: 'Atualizado',
          tone: 'blue',
          icon: 'i-lucide-glasses',
        },
        {
          title: 'Lentes ocupacionais',
          description: 'Material para treinamento',
          meta: 'v1.6',
          status: 'Disponível',
          tone: 'teal',
          icon: 'i-lucide-monitor-up',
        },
        {
          title: 'Materiais de PDV',
          description: 'Displays, folders e orientações',
          meta: 'Outubro',
          status: 'Controlado',
          tone: 'violet',
          icon: 'i-lucide-panels-top-left',
        },
      ],
    },
    secondary: {
      title: 'Acesso e uso',
      items: [
        {
          title: 'Versionamento',
          description: 'Histórico e vigência',
          icon: 'i-lucide-git-branch',
        },
        {
          title: 'Perfil autorizado',
          description: 'Conteúdo conforme função',
          icon: 'i-lucide-shield-check',
        },
        {
          title: 'Uso em visita',
          description: 'Vincular material à atividade',
          icon: 'i-lucide-paperclip',
        },
      ],
    },
  },
  phone: {
    key: 'phone',
    eyebrow: 'Telefonia corporativa',
    title: 'Telefonia Mobile',
    description:
      'Experiência de chamada corporativa integrada à carteira, histórico e política de privacidade.',
    icon: 'i-lucide-smartphone',
    accent: 'blue',
    status: { label: 'Integração futura', tone: 'violet' },
    metrics: [
      metric(
        'Ramal',
        '1410',
        'Identidade corporativa',
        'i-lucide-phone',
        'blue'
      ),
      metric(
        'Registro',
        'Disponível',
        'Exemplo visual',
        'i-lucide-signal-high',
        'teal'
      ),
      metric(
        'Chamadas hoje',
        '8',
        'Origem corporativa',
        'i-lucide-phone-call',
        'violet'
      ),
      metric(
        'Privacidade',
        'Política',
        'Celular nativo não presumido gravado',
        'i-lucide-shield-check',
        'amber'
      ),
    ],
    primary: {
      title: 'Ramal corporativo',
      subtitle: 'Chamadas vinculadas ao cliente e à atividade',
      items: [
        {
          title: 'Ótica Visão Center',
          description: 'Carla Mendes · retorno comercial',
          meta: '10:18',
          status: 'Concluída',
          tone: 'emerald',
          icon: 'i-lucide-phone-outgoing',
        },
        {
          title: 'Ótica Premium',
          description: 'Contato principal · proposta',
          meta: '09:42',
          status: 'Não atendida',
          tone: 'amber',
          icon: 'i-lucide-phone-missed',
        },
        {
          title: 'Centro Óptico Brasil',
          description: 'Follow-up de oportunidade',
          meta: 'Ontem',
          status: 'Concluída',
          tone: 'blue',
          icon: 'i-lucide-phone-call',
        },
        {
          title: 'Novo Olhar',
          description: 'Agendar treinamento',
          meta: 'Ontem',
          status: 'Callback',
          tone: 'violet',
          icon: 'i-lucide-calendar-clock',
        },
      ],
    },
    secondary: {
      title: 'Controles',
      items: [
        {
          title: 'Identidade de saída',
          description: 'Conforme política por área',
          icon: 'i-lucide-badge-check',
        },
        {
          title: 'Histórico CRM',
          description: 'Origem, direção e canal corretos',
          icon: 'i-lucide-history',
        },
        {
          title: 'Gravação',
          description: 'Somente quando homologada e autorizada',
          icon: 'i-lucide-mic-off',
        },
      ],
    },
  },
  nico: {
    key: 'nico',
    eyebrow: 'IA assistiva',
    title: 'Nico Field',
    description:
      'Sínteses, sugestões de visita e próximos passos sempre sob revisão humana.',
    icon: 'i-lucide-bot',
    accent: 'violet',
    status: { label: 'Copiloto assistido', tone: 'violet' },
    metrics: [
      metric(
        'Sugestões hoje',
        '8',
        'Revisadas pelo usuário',
        'i-lucide-sparkles',
        'violet'
      ),
      metric(
        'Resumos',
        '12',
        'Visitas e clientes',
        'i-lucide-file-text',
        'blue'
      ),
      metric(
        'Próximos passos',
        '5',
        'Pendentes de confirmação',
        'i-lucide-list-checks',
        'amber'
      ),
      metric(
        'Ações automáticas',
        '0',
        'Confirmação humana obrigatória',
        'i-lucide-shield-check',
        'teal'
      ),
    ],
    primary: {
      title: 'Sugestões para a carteira',
      subtitle: 'Contexto restrito ao escopo autorizado',
      items: [
        {
          title: 'Priorizar Ótica Visão Center',
          description: 'Pedido em andamento e oportunidade ativa',
          status: 'Revisar',
          tone: 'violet',
          icon: 'i-lucide-sparkles',
        },
        {
          title: 'Agendar retorno com Ótica Premium',
          description: 'Proposta sem resposta há 3 dias',
          status: 'Revisar',
          tone: 'amber',
          icon: 'i-lucide-calendar-plus',
        },
        {
          title: 'Preparar treinamento Novo Olhar',
          description: 'Equipe demonstrou interesse na Linha Premium',
          status: 'Revisar',
          tone: 'blue',
          icon: 'i-lucide-graduation-cap',
        },
        {
          title: 'Atualizar oportunidade Centro Óptico',
          description: 'Próximo passo não definido',
          status: 'Revisar',
          tone: 'ruby',
          icon: 'i-lucide-handshake',
        },
      ],
    },
    secondary: {
      title: 'Guardrails',
      items: [
        {
          title: 'Revisão humana',
          description: 'Nenhuma ação externa sem confirmação',
          icon: 'i-lucide-user-check',
        },
        {
          title: 'Dados protegidos',
          description: 'Somente contexto necessário',
          icon: 'i-lucide-shield-check',
        },
        {
          title: 'Custos controlados',
          description: 'Orçamento por operação',
          icon: 'i-lucide-gauge',
        },
      ],
    },
  },
  notifications: {
    key: 'notifications',
    eyebrow: 'Central de atenção',
    title: 'Notificações',
    description:
      'Alertas acionáveis de clientes, pedidos, oportunidades, tarefas e visitas.',
    icon: 'i-lucide-bell-ring',
    accent: 'amber',
    status: { label: '7 novas', tone: 'amber' },
    metrics: [
      metric(
        'Novas',
        '7',
        'Desde o último acesso',
        'i-lucide-bell-dot',
        'amber'
      ),
      metric('Prioritárias', '2', 'Ação até hoje', 'i-lucide-siren', 'ruby'),
      metric(
        'Comerciais',
        '3',
        'Oportunidades e propostas',
        'i-lucide-handshake',
        'violet'
      ),
      metric(
        'Operacionais',
        '2',
        'Pedido e atendimento',
        'i-lucide-package-search',
        'blue'
      ),
    ],
    primary: {
      title: 'Caixa de notificações',
      subtitle: 'Eventos com contexto e ação direta',
      items: [
        {
          title: 'Proposta sem resposta · Ótica Premium',
          description: 'Follow-up recomendado hoje',
          meta: '09:42',
          status: 'Prioridade alta',
          tone: 'ruby',
          icon: 'i-lucide-file-clock',
        },
        {
          title: 'Pedido #78456 atualizado',
          description: 'Status demonstrativo: em montagem',
          meta: '10:18',
          status: 'Pedido',
          tone: 'blue',
          icon: 'i-lucide-package-check',
        },
        {
          title: 'Visita em 30 minutos',
          description: 'Ótica Visão Center · Campinas',
          meta: '10:00',
          status: 'Agenda',
          tone: 'teal',
          icon: 'i-lucide-calendar-clock',
        },
        {
          title: 'Oportunidade sem próximo passo',
          description: 'Centro Óptico Brasil',
          meta: 'Ontem',
          status: 'CRM',
          tone: 'violet',
          icon: 'i-lucide-handshake',
        },
        {
          title: 'Treinamento confirmado',
          description: 'Linha Premium · 21/10',
          meta: 'Ontem',
          status: 'Divulgação',
          tone: 'amber',
          icon: 'i-lucide-graduation-cap',
        },
      ],
    },
    secondary: {
      title: 'Preferências',
      items: [
        {
          title: 'Por canal',
          description: 'App, e-mail e central',
          icon: 'i-lucide-settings-2',
        },
        {
          title: 'Por prioridade',
          description: 'Somente alertas relevantes',
          icon: 'i-lucide-filter',
        },
        {
          title: 'Horário silencioso',
          description: 'Conforme perfil e região',
          icon: 'i-lucide-moon-star',
        },
      ],
    },
  },
  regional: {
    key: 'regional',
    eyebrow: 'Gestão comercial',
    title: 'Gestão Regional',
    description:
      'Carteiras, territórios, equipe, visitas, pipeline e cobertura por região.',
    icon: 'i-lucide-map-pinned',
    accent: 'blue',
    status: { label: 'Região Sudeste', tone: 'blue' },
    metrics: [
      metric(
        'Colaboradores',
        '12',
        '8 vendedores · 4 divulgadores',
        'i-lucide-users-round',
        'blue'
      ),
      metric('Óticas', '284', 'Carteiras atribuídas', 'i-lucide-store', 'teal'),
      metric(
        'Pipeline',
        'R$ 1,8 mi',
        '87 oportunidades',
        'i-lucide-chart-no-axes-combined',
        'violet'
      ),
      metric(
        'Cobertura',
        '92%',
        'Visitas planejadas no mês',
        'i-lucide-map',
        'amber'
      ),
    ],
    primary: {
      title: 'Equipe e territórios',
      subtitle: 'Visibilidade conforme escopo regional',
      items: [
        {
          title: 'Campinas · Carlos Silva',
          description: '84 óticas · R$ 482 mil de pipeline',
          meta: '6 visitas hoje',
          status: 'No alvo',
          tone: 'emerald',
          icon: 'i-lucide-user-round-check',
        },
        {
          title: 'Jundiaí · Marina Costa',
          description: '62 óticas · R$ 368 mil de pipeline',
          meta: '4 visitas hoje',
          status: 'No alvo',
          tone: 'emerald',
          icon: 'i-lucide-user-round-check',
        },
        {
          title: 'São Paulo Capital · Paulo Ribeiro',
          description: '96 óticas · R$ 712 mil de pipeline',
          meta: '8 visitas hoje',
          status: 'Atenção',
          tone: 'amber',
          icon: 'i-lucide-user-round-cog',
        },
        {
          title: 'Vale do Paraíba · Ana Souza',
          description: '42 óticas · R$ 248 mil de pipeline',
          meta: '3 visitas hoje',
          status: 'No alvo',
          tone: 'blue',
          icon: 'i-lucide-user-round-check',
        },
      ],
    },
    secondary: {
      title: 'Gestão',
      items: [
        {
          title: 'Transferir carteira',
          description: 'Histórico e tarefas preservados',
          icon: 'i-lucide-arrow-left-right',
        },
        {
          title: 'Revisar cobertura',
          description: 'Clientes sem contato e prioridades',
          icon: 'i-lucide-map-pinned',
        },
        {
          title: 'Acompanhar metas',
          description: 'Região, equipe e colaborador',
          icon: 'i-lucide-target',
        },
      ],
    },
    chart: [35, 48, 54, 62, 68, 74, 71, 83, 79, 88, 92, 95],
  },
  reports: {
    key: 'reports',
    eyebrow: 'Inteligência Field',
    title: 'Relatórios Field',
    description:
      'Visitas, cobertura, carteira, pipeline, atividades e resultados por região e colaborador.',
    icon: 'i-lucide-chart-no-axes-combined',
    accent: 'teal',
    status: { label: 'Visão gerencial', tone: 'teal' },
    metrics: [
      metric(
        'Visitas',
        '426',
        'No período selecionado',
        'i-lucide-map-pin-check',
        'teal',
        '+8%'
      ),
      metric(
        'Cobertura',
        '92%',
        'Clientes planejados visitados',
        'i-lucide-map',
        'blue',
        '+3%'
      ),
      metric(
        'Pipeline',
        'R$ 1,8 mi',
        '87 oportunidades abertas',
        'i-lucide-handshake',
        'violet',
        '+12%'
      ),
      metric(
        'Conversão',
        '24%',
        'Oportunidades ganhas',
        'i-lucide-trending-up',
        'amber',
        '+2,1%'
      ),
    ],
    primary: {
      title: 'Indicadores de campo',
      subtitle: 'Filtros por período, região, carteira, colaborador e perfil',
      items: [
        {
          title: 'Visitas e cobertura',
          description: 'Planejado, realizado, cancelado e reagendado',
          status: 'Disponível',
          tone: 'emerald',
          icon: 'i-lucide-map-pin-check',
        },
        {
          title: 'Carteira e relacionamento',
          description: 'Último contato, próximos passos e risco',
          status: 'Disponível',
          tone: 'blue',
          icon: 'i-lucide-briefcase-business',
        },
        {
          title: 'Pipeline e conversão',
          description: 'Etapa, valor, probabilidade e ciclo',
          status: 'Disponível',
          tone: 'violet',
          icon: 'i-lucide-chart-spline',
        },
        {
          title: 'Divulgação e treinamentos',
          description: 'Ações, participantes e resultados',
          status: 'Disponível',
          tone: 'teal',
          icon: 'i-lucide-megaphone',
        },
        {
          title: 'Telefonia e atividades',
          description: 'Chamadas, retornos e tarefas vinculadas',
          status: 'Integração futura',
          tone: 'amber',
          icon: 'i-lucide-phone-call',
        },
      ],
    },
    secondary: {
      title: 'Exportação e gestão',
      items: [
        {
          title: 'CSV / PDF',
          description: 'Mesmo escopo do usuário',
          icon: 'i-lucide-file-down',
        },
        {
          title: 'Agendamento',
          description: 'Relatório recorrente',
          icon: 'i-lucide-calendar-clock',
        },
        {
          title: 'Drilldown',
          description: 'Região → colaborador → cliente',
          icon: 'i-lucide-search',
        },
      ],
    },
    chart: [28, 42, 48, 57, 64, 61, 72, 78, 83, 88, 92, 96],
  },
};

export const crmFieldScreen = (key, t) =>
  localizeVisualScreen(crmFieldCatalog[key] || crmFieldCatalog.myDay, t);
