import { describe, expect, it } from 'vitest';
import { FEATURE_FLAGS } from 'dashboard/featureFlags';
import { routes } from './routes';

const children = routes[0].children.filter(route => route.name);

describe('JRC Contact Center F0 interface', () => {
  it('keeps the module behind its dedicated account feature flag', () => {
    expect(FEATURE_FLAGS.JRC_CONTACT_CENTER).toBe('jrc_contact_center');
    expect(routes[0].meta.featureFlag).toBe('jrc_contact_center');
  });

  it('registers the operational F0 screens without Service Desk routes', () => {
    expect(children.map(route => route.name)).toEqual([
      'jrc_contact_center_cockpit',
      'jrc_contact_center_supervisor',
      'jrc_contact_center_control_desk',
      'jrc_contact_center_occurrences',
      'jrc_contact_center_reports',
      'jrc_contact_center_settings',
    ]);
    expect(children.some(route => route.name.includes('service_desk'))).toBe(
      false
    );
  });
});
