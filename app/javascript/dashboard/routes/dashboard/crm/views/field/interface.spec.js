import { describe, expect, it } from 'vitest';
import crmRoutes from '../../crm.routes';
import { crmFieldCatalog } from './crmFieldCatalog';

const crmRoot = crmRoutes.routes[0];
const fieldRoot = crmRoot.children.find(route => route.path === 'field');
const fieldRoutes = fieldRoot.children.filter(route => route.name);

const expectedScreens = [
  'crm_field_my_day',
  'crm_field_calendar',
  'crm_field_map',
  'crm_field_new_visit',
  'crm_field_visit_report',
  'crm_field_wallet',
  'crm_field_customer_360',
  'crm_field_opportunities',
  'crm_field_orders',
  'crm_field_tasks',
  'crm_field_promotion',
  'crm_field_training',
  'crm_field_catalog',
  'crm_field_phone',
  'crm_field_nico',
  'crm_field_notifications',
  'crm_field_regional',
  'crm_field_reports',
];

describe('CRM Field HOYA visual experience', () => {
  it('registers all 18 screens from the approved catalog', () => {
    expect(fieldRoutes.map(route => route.name)).toEqual(expectedScreens);
    expect(Object.keys(crmFieldCatalog)).toHaveLength(18);
  });

  it('keeps the Customer 360 bridge available in both experiences', () => {
    expect(crmFieldCatalog.customer360.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          routeName: 'jrc_contact_center_customer_360',
        }),
      ])
    );
  });
});
