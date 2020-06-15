import * as entry from './index';
import * as interfaces from './interfaces/index';
import { GraphqlService, GraphqlQueryBuilder } from './services/index';

describe('Testing GraphQL Package entry point', () => {
  it('should have multiple index entries defined', () => {
    expect(entry).toBeTruthy();
    expect(interfaces).toBeTruthy();
    expect(GraphqlService).toBeTruthy();
    expect(GraphqlQueryBuilder).toBeTruthy();
  });

  it('should have 2x Services defined', () => {
    expect(typeof entry.GraphqlService).toBeTruthy();
    expect(typeof entry.GraphqlQueryBuilder).toBeTruthy();
  });
});
