import { environment } from './environment.prod';
/* src/environments/environment.prod.spec.ts */

describe('Environment (prod build-time check)', () => {

  it('should hit the live API in production', () => {
    expect(environment.production).toBeTrue();
    expect(environment.apiUrl).toContain('creadors.tv');
  });

});
