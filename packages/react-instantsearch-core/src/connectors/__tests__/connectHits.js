import connect from '../connectHits';

jest.mock('../../core/createConnector', () => x => x);

const { getSearchParameters } = connect;

describe('connectHits', () => {
  describe('single index', () => {
    const contextValue = { mainTargetedIndex: 'index' };

    it('provides the current hits to the component', () => {
      const hits = [{}];
      const props = connect.getProvidedProps({ contextValue }, null, {
        results: { hits },
      });
      expect(props).toEqual({ hits });
    });

    it("doesn't render when no hits are available", () => {
      const props = connect.getProvidedProps({ contextValue }, null, {
        results: null,
      });
      expect(props).toEqual({ hits: [] });
    });

    it('should return the searchParameters unchanged', () => {
      const searchParameters = getSearchParameters({ hitsPerPage: 10 });
      expect(searchParameters).toEqual({ hitsPerPage: 10 });
    });
  });

  describe('multi index', () => {
    const contextValue = { mainTargetedIndex: 'first' };
    const indexContextValue = { targetedIndex: 'second' };

    it('provides the current hits to the component', () => {
      const hits = [{}];
      const props = connect.getProvidedProps(
        { contextValue, indexContextValue },
        null,
        {
          results: { second: { hits } },
        }
      );
      expect(props).toEqual({ hits });
    });

    it("doesn't render when no hits are available", () => {
      const props = connect.getProvidedProps(
        { contextValue, indexContextValue },
        null,
        { results: { second: null } }
      );
      expect(props).toEqual({ hits: [] });
    });

    it('should return the searchParameters unchanged', () => {
      const searchParameters = getSearchParameters({ hitsPerPage: 10 });
      expect(searchParameters).toEqual({ hitsPerPage: 10 });
    });
  });
});
