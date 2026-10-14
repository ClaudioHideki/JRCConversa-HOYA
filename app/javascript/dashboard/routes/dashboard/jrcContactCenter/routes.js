import { frontendURL } from 'dashboard/helper/URLHelper';
import { FEATURE_FLAGS } from 'dashboard/featureFlags';

const baseMeta = {
  featureFlag: FEATURE_FLAGS.JRC_CONTACT_CENTER,
  permissions: ['administrator', 'agent', 'jrc_contact_center_view'],
};

export const routes = [
  {
    path: frontendURL('accounts/:accountId/contact-center'),
    component: () => import('./ContactCenterLayout.vue'),
    meta: baseMeta,
    children: [
      { path: '', redirect: { name: 'jrc_contact_center_cockpit' } },
      {
        path: 'operacao',
        name: 'jrc_contact_center_cockpit',
        component: () => import('./views/AgentCockpit.vue'),
        meta: baseMeta,
      },
      {
        path: 'supervisor',
        name: 'jrc_contact_center_supervisor',
        component: () => import('./views/SupervisorPage.vue'),
        meta: {
          ...baseMeta,
          permissions: ['administrator', 'jrc_contact_center_supervise'],
        },
      },
      {
        path: 'control-desk',
        name: 'jrc_contact_center_control_desk',
        component: () => import('./views/ControlDeskPage.vue'),
        meta: {
          ...baseMeta,
          permissions: [
            'administrator',
            'jrc_contact_center_supervise',
            'jrc_contact_center_configure',
          ],
        },
      },
      {
        path: 'ocorrencias',
        name: 'jrc_contact_center_occurrences',
        component: () => import('./views/OccurrencesPage.vue'),
        meta: baseMeta,
      },
      {
        path: 'relatorios',
        name: 'jrc_contact_center_reports',
        component: () => import('./views/ReportsPage.vue'),
        meta: {
          ...baseMeta,
          permissions: [
            'administrator',
            'jrc_contact_center_reports',
            'jrc_contact_center_supervise',
          ],
        },
      },
      {
        path: 'configuracoes',
        name: 'jrc_contact_center_settings',
        component: () => import('./views/SettingsPage.vue'),
        meta: {
          ...baseMeta,
          permissions: ['administrator', 'jrc_contact_center_configure'],
        },
      },
    ],
  },
];
