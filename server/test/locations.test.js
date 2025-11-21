const request = require('supertest');
const { expect } = require('chai');
const app = require('../index');

describe('GET /api/locations', () => {
  // Wait for DB setup before running tests
  before(async () => {
    await app.locals.ready();
  });

  it('returns all locations when no query is provided', async () => {
    const res = await request(app).get('/api/locations');
    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array');
    expect(res.body.length).to.equal(12);
    // Verify sorted by name
    const names = res.body.map(r => r.name);
    expect(names).to.deep.equal([...names].sort());
    expect(names).to.include.members([
      'San Francisco, CA',
      'San Jose, CA',
      'New York, NY',
      'Toronto, ON'
    ]);
  });

  it('returns matching locations for a case-insensitive substring', async () => {
    const res = await request(app).get('/api/locations').query({ query: 'San' });
    expect(res.status).to.equal(200);
    const names = res.body.map(r => r.name);
    expect(names).to.include('San Francisco, CA');
    expect(names).to.include('San Jose, CA');
    expect(names.length).to.equal(2);
  });

  it('search is case-insensitive', async () => {
    const res = await request(app).get('/api/locations').query({ query: 'nEW' });
    expect(res.status).to.equal(200);
    const names = res.body.map(r => r.name);
    expect(names).to.include('New York, NY');
    expect(names.length).to.equal(1);
  });

  it('returns empty array for non-matching query', async () => {
    const res = await request(app).get('/api/locations').query({ query: 'XYZ123' });
    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array');
    expect(res.body).to.have.length(0);
  });
});
