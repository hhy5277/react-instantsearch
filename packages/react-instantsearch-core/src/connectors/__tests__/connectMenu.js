import { SearchParameters } from 'algoliasearch-helper';
import connect from '../connectMenu';

jest.mock('../../core/createConnector', () => x => x);

let props;
let params;

describe('connectMenu', () => {
  describe('single index', () => {
    const contextValue = { mainTargetedIndex: 'index' };

    it('provides the correct props to the component', () => {
      const results = {
        getFacetValues: jest.fn(() => []),
        getFacetByName: () => true,
        hits: [],
      };

      props = connect.getProvidedProps(
        { attribute: 'ok', contextValue },
        {},
        {}
      );
      expect(props).toEqual({
        items: [],
        currentRefinement: null,
        isFromSearch: false,
        canRefine: false,
        searchForItems: undefined,
      });

      props = connect.getProvidedProps(
        { attribute: 'ok', contextValue },
        { menu: { ok: 'wat' } },
        { results }
      );
      expect(props).toEqual({
        items: [],
        currentRefinement: 'wat',
        isFromSearch: false,
        canRefine: false,
        searchForItems: undefined,
      });

      props = connect.getProvidedProps(
        { attribute: 'ok', contextValue },
        { menu: { ok: 'wat' } },
        { results }
      );
      expect(props).toEqual({
        items: [],
        currentRefinement: 'wat',
        isFromSearch: false,
        canRefine: false,
        searchForItems: undefined,
      });

      props = connect.getProvidedProps(
        { attribute: 'ok', defaultRefinement: 'wat', contextValue },
        {},
        { results }
      );
      expect(props).toEqual({
        items: [],
        currentRefinement: 'wat',
        isFromSearch: false,
        canRefine: false,
        searchForItems: undefined,
      });

      props = connect.getProvidedProps(
        { attribute: 'ok', contextValue },
        {},
        { results }
      );
      expect(props).toEqual({
        items: [],
        currentRefinement: null,
        isFromSearch: false,
        canRefine: false,
        searchForItems: undefined,
      });

      results.getFacetValues.mockClear();
      results.getFacetValues.mockImplementation(() => [
        {
          name: 'wat',
          isRefined: true,
          count: 20,
        },
        {
          name: 'oy',
          isRefined: false,
          count: 10,
        },
      ]);
      props = connect.getProvidedProps(
        { attribute: 'ok', contextValue },
        {},
        { results }
      );
      expect(props.items).toEqual([
        {
          value: 'wat',
          label: 'wat',
          isRefined: true,
          count: 20,
        },
        {
          value: 'oy',
          label: 'oy',
          isRefined: false,
          count: 10,
        },
      ]);

      props = connect.getProvidedProps(
        { attribute: 'ok', limit: 1, contextValue },
        {},
        { results }
      );
      expect(props.items).toEqual([
        {
          value: 'wat',
          label: 'wat',
          isRefined: true,
          count: 20,
        },
      ]);

      props = connect.getProvidedProps(
        {
          attribute: 'ok',
          showMore: true,
          limit: 0,
          showMoreLimit: 1,
          contextValue,
        },
        {},
        { results }
      );
      expect(props.items).toEqual([
        {
          value: 'wat',
          label: 'wat',
          isRefined: true,
          count: 20,
        },
      ]);

      props = connect.getProvidedProps(
        { attribute: 'ok', limit: 1, contextValue },
        {},
        { results },
        {},
        {
          query: 'query',
          ok: [
            {
              value: 'wat',
              count: 10,
              highlighted: 'wat',
              isRefined: false,
            },
          ],
        }
      );
      expect(props.items).toEqual([
        {
          value: 'wat',
          label: 'wat',
          isRefined: false,
          count: 10,
          _highlightResult: { label: { value: 'wat' } },
        },
      ]);

      props = connect.getProvidedProps(
        { attribute: 'ok', limit: 1, contextValue },
        {},
        { results },
        {},
        { query: '' }
      );
      expect(props.items).toEqual([
        {
          value: 'wat',
          label: 'wat',
          isRefined: true,
          count: 20,
        },
      ]);

      const transformItems = jest.fn(() => ['items']);
      props = connect.getProvidedProps(
        { attribute: 'ok', transformItems, contextValue },
        {},
        { results }
      );
      expect(transformItems.mock.calls[0][0]).toEqual([
        {
          value: 'wat',
          label: 'wat',
          isRefined: true,
          count: 20,
        },
        {
          value: 'oy',
          label: 'oy',
          isRefined: false,
          count: 10,
        },
      ]);
      expect(props.items).toEqual(['items']);
    });

    it('if an item is equal to the currentRefinement, its value should be an empty string', () => {
      const results = {
        getFacetValues: jest.fn(() => []),
        getFacetByName: () => true,
        hits: [],
      };
      results.getFacetValues.mockImplementation(() => [
        {
          name: 'wat',
          isRefined: true,
          count: 20,
        },
      ]);

      props = connect.getProvidedProps(
        { attribute: 'ok', contextValue },
        { menu: { ok: 'wat' } },
        { results }
      );

      expect(props.items).toEqual([
        {
          value: '',
          label: 'wat',
          isRefined: true,
          count: 20,
        },
      ]);
    });

    it("calling refine updates the widget's search state", () => {
      const nextState = connect.refine(
        { attribute: 'ok', contextValue },
        { otherKey: 'val', menu: { otherKey: 'val' } },
        'yep'
      );
      expect(nextState).toEqual({
        otherKey: 'val',
        page: 1,
        menu: { ok: 'yep', otherKey: 'val' },
      });
    });

    it("increases maxValuesPerFacet when it isn't big enough", () => {
      const initSP = new SearchParameters({ maxValuesPerFacet: 100 });

      params = connect.getSearchParameters(
        initSP,
        {
          limit: 101,
          contextValue,
        },
        {}
      );
      expect(params.maxValuesPerFacet).toBe(101);

      params = connect.getSearchParameters(
        initSP,
        {
          showMore: true,
          showMoreLimit: 101,
          contextValue,
        },
        {}
      );
      expect(params.maxValuesPerFacet).toBe(101);

      params = connect.getSearchParameters(
        initSP,
        {
          limit: 99,
          contextValue,
        },
        {}
      );
      expect(params.maxValuesPerFacet).toBe(100);

      params = connect.getSearchParameters(
        initSP,
        {
          showMore: true,
          showMoreLimit: 99,
          contextValue,
        },
        {}
      );
      expect(params.maxValuesPerFacet).toBe(100);
    });

    it('correctly applies its state to search parameters', () => {
      const initSP = new SearchParameters();

      params = connect.getSearchParameters(
        initSP,
        {
          attribute: 'ok',
          limit: 1,
          contextValue,
        },
        { menu: { ok: 'wat' } }
      );
      expect(params).toEqual(
        initSP
          .addDisjunctiveFacet('ok')
          .addDisjunctiveFacetRefinement('ok', 'wat')
          .setQueryParameter('maxValuesPerFacet', 1)
      );
    });

    it('registers its id in metadata', () => {
      const metadata = connect.getMetadata(
        { attribute: 'ok', contextValue },
        {}
      );
      expect(metadata).toEqual({ id: 'ok', index: 'index', items: [] });
    });

    it('registers its filter in metadata', () => {
      const metadata = connect.getMetadata(
        { attribute: 'wot', contextValue },
        { menu: { wot: 'wat' } }
      );
      expect(metadata).toEqual({
        id: 'wot',
        index: 'index',
        items: [
          {
            label: 'wot: wat',
            attribute: 'wot',
            currentRefinement: 'wat',
            // Ignore clear, we test it later
            value: metadata.items[0].value,
          },
        ],
      });
    });

    it('items value function should clear it from the search state', () => {
      const metadata = connect.getMetadata(
        { attribute: 'one', contextValue },
        { menu: { one: 'one', two: 'two' } }
      );

      const searchState = metadata.items[0].value({
        menu: { one: 'one', two: 'two' },
      });

      expect(searchState).toEqual({ page: 1, menu: { one: '', two: 'two' } });
    });

    it('should return the right searchState when clean up', () => {
      let searchState = connect.cleanUp(
        { attribute: 'name', contextValue },
        {
          menu: { name: 'searchState', name2: 'searchState' },
          another: { searchState: 'searchState' },
        }
      );
      expect(searchState).toEqual({
        menu: { name2: 'searchState' },
        another: { searchState: 'searchState' },
      });

      searchState = connect.cleanUp(
        { attribute: 'name2', contextValue },
        searchState
      );
      expect(searchState).toEqual({
        menu: {},
        another: { searchState: 'searchState' },
      });
    });

    it('calling searchForItems return the right searchForItems parameters with limit', () => {
      const parameters = connect.searchForFacetValues(
        { attribute: 'ok', limit: 15, showMoreLimit: 25, showMore: false },
        {},
        'yep'
      );

      expect(parameters).toEqual({
        facetName: 'ok',
        query: 'yep',
        maxFacetHits: 15,
      });
    });

    it('calling searchForItems return the right searchForItems parameters with showMoreLimit', () => {
      const parameters = connect.searchForFacetValues(
        { attribute: 'ok', limit: 15, showMoreLimit: 25, showMore: true },
        {},
        'yep'
      );

      expect(parameters).toEqual({
        facetName: 'ok',
        query: 'yep',
        maxFacetHits: 25,
      });
    });

    it('when search for facets values is activated order the item by isRefined first', () => {
      const results = {
        getFacetValues: jest.fn(() => []),
        getFacetByName: () => true,
        hits: [],
      };
      results.getFacetValues.mockClear();
      results.getFacetValues.mockImplementation(() => [
        {
          name: 'wat',
          isRefined: false,
          count: 20,
        },
        {
          name: 'oy',
          isRefined: true,
          count: 10,
        },
      ]);

      props = connect.getProvidedProps(
        { attribute: 'ok', searchable: true, contextValue },
        {},
        { results }
      );

      expect(props.items).toEqual([
        {
          value: 'oy',
          label: 'oy',
          isRefined: true,
          count: 10,
        },
        {
          value: 'wat',
          label: 'wat',
          isRefined: false,
          count: 20,
        },
      ]);
    });

    it('computes canRefine based on the length of the transformed items list', () => {
      const transformItems = () => [];
      const results = {
        getFacetValues: () => [
          { count: 1, id: 'test', isRefined: true, name: 'test' },
        ],
        getFacetByName: () => true,
        hits: [],
      };

      props = connect.getProvidedProps(
        { attribute: 'ok', transformItems, contextValue },
        {},
        { results }
      );

      expect(props.canRefine).toEqual(false);
    });
  });

  describe.skip('multi index', () => {
    let context = {
      context: {
        ais: { mainTargetedIndex: 'first' },
        multiIndexContext: { targetedIndex: 'first' },
      },
    };
    const getProvidedProps = connect.getProvidedProps.bind(context);
    const getSP = connect.getSearchParameters.bind(context);
    const getMetadata = connect.getMetadata.bind(context);
    const cleanUp = connect.cleanUp.bind(context);

    it('provides the correct props to the component', () => {
      const results = {
        first: {
          getFacetValues: jest.fn(() => []),
          getFacetByName: () => true,
        },
      };

      props = getProvidedProps({ attribute: 'ok' }, {}, {});
      expect(props).toEqual({
        items: [],
        currentRefinement: null,
        isFromSearch: false,
        canRefine: false,
        searchForItems: undefined,
      });

      props = getProvidedProps(
        { attribute: 'ok' },
        { indices: { first: { menu: { ok: 'wat' } } } },
        { results }
      );
      expect(props).toEqual({
        items: [],
        currentRefinement: 'wat',
        isFromSearch: false,
        canRefine: false,
        searchForItems: undefined,
      });

      props = getProvidedProps(
        { attribute: 'ok' },
        { indices: { first: { menu: { ok: 'wat' } } } },
        { results }
      );
      expect(props).toEqual({
        items: [],
        currentRefinement: 'wat',
        isFromSearch: false,
        canRefine: false,
        searchForItems: undefined,
      });

      props = getProvidedProps(
        { attribute: 'ok', defaultRefinement: 'wat' },
        {},
        { results }
      );
      expect(props).toEqual({
        items: [],
        currentRefinement: 'wat',
        isFromSearch: false,
        canRefine: false,
        searchForItems: undefined,
      });

      props = getProvidedProps({ attribute: 'ok' }, {}, { results });
      expect(props).toEqual({
        items: [],
        currentRefinement: null,
        isFromSearch: false,
        canRefine: false,
        searchForItems: undefined,
      });

      results.first.getFacetValues.mockClear();
      results.first.getFacetValues.mockImplementation(() => [
        {
          name: 'wat',
          isRefined: true,
          count: 20,
        },
        {
          name: 'oy',
          isRefined: false,
          count: 10,
        },
      ]);
      props = getProvidedProps({ attribute: 'ok' }, {}, { results });
      expect(props.items).toEqual([
        {
          value: 'wat',
          label: 'wat',
          isRefined: true,
          count: 20,
        },
        {
          value: 'oy',
          label: 'oy',
          isRefined: false,
          count: 10,
        },
      ]);

      props = getProvidedProps({ attribute: 'ok', limit: 1 }, {}, { results });
      expect(props.items).toEqual([
        {
          value: 'wat',
          label: 'wat',
          isRefined: true,
          count: 20,
        },
      ]);

      props = getProvidedProps(
        { attribute: 'ok', showMore: true, limit: 0, showMoreLimit: 1 },
        {},
        { results }
      );
      expect(props.items).toEqual([
        {
          value: 'wat',
          label: 'wat',
          isRefined: true,
          count: 20,
        },
      ]);

      props = getProvidedProps(
        { attribute: 'ok', limit: 1 },
        {},
        { results },
        {},
        {
          query: 'query',
          ok: [
            {
              value: 'wat',
              count: 10,
              highlighted: 'wat',
              isRefined: false,
            },
          ],
        }
      );
      expect(props.items).toEqual([
        {
          value: 'wat',
          label: 'wat',
          isRefined: false,
          count: 10,
          _highlightResult: { label: { value: 'wat' } },
        },
      ]);

      props = getProvidedProps(
        { attribute: 'ok', limit: 1 },
        {},
        { results },
        {},
        { query: '' }
      );
      expect(props.items).toEqual([
        {
          value: 'wat',
          label: 'wat',
          isRefined: true,
          count: 20,
        },
      ]);

      const transformItems = jest.fn(() => ['items']);
      props = getProvidedProps(
        { attribute: 'ok', transformItems },
        {},
        { results }
      );
      expect(transformItems.mock.calls[0][0]).toEqual([
        {
          value: 'wat',
          label: 'wat',
          isRefined: true,
          count: 20,
        },
        {
          value: 'oy',
          label: 'oy',
          isRefined: false,
          count: 10,
        },
      ]);
      expect(props.items).toEqual(['items']);
    });

    it('if an item is equal to the currentRefinement, its value should be an empty string', () => {
      const results = {
        first: {
          getFacetValues: jest.fn(() => []),
          getFacetByName: () => true,
        },
      };
      results.first.getFacetValues.mockImplementation(() => [
        {
          name: 'wat',
          isRefined: true,
          count: 20,
        },
      ]);

      props = getProvidedProps(
        { attribute: 'ok' },
        { indices: { first: { menu: { ok: 'wat' } } } },
        { results }
      );

      expect(props.items).toEqual([
        {
          value: '',
          label: 'wat',
          isRefined: true,
          count: 20,
        },
      ]);
    });

    it("calling refine updates the widget's search state", () => {
      let refine = connect.refine.bind(context);

      let nextState = refine(
        { attribute: 'ok' },
        {
          indices: {
            first: { otherKey: 'val', menu: { ok: 'wat', otherKey: 'val' } },
          },
        },
        'yep'
      );
      expect(nextState).toEqual({
        indices: {
          first: {
            page: 1,
            otherKey: 'val',
            menu: { ok: 'yep', otherKey: 'val' },
          },
        },
      });

      context = {
        context: {
          ais: { mainTargetedIndex: 'first' },
          multiIndexContext: { targetedIndex: 'second' },
        },
      };
      refine = connect.refine.bind(context);

      nextState = refine(
        { attribute: 'ok' },
        {
          indices: {
            first: { otherKey: 'val', menu: { ok: 'wat', otherKey: 'val' } },
          },
        },
        'yep'
      );
      expect(nextState).toEqual({
        indices: {
          first: { otherKey: 'val', menu: { ok: 'wat', otherKey: 'val' } },
          second: { page: 1, menu: { ok: 'yep' } },
        },
      });
    });
    it('correctly applies its state to search parameters', () => {
      const initSP = new SearchParameters();

      params = getSP(
        initSP,
        {
          attribute: 'ok',
          limit: 1,
        },
        { indices: { first: { menu: { ok: 'wat' } } } }
      );
      expect(params).toEqual(
        initSP
          .addDisjunctiveFacet('ok')
          .addDisjunctiveFacetRefinement('ok', 'wat')
          .setQueryParameter('maxValuesPerFacet', 1)
      );
    });

    it('registers its filter in metadata', () => {
      const metadata = getMetadata(
        { attribute: 'wot' },
        { indices: { first: { menu: { wot: 'wat' } } } }
      );
      expect(metadata).toEqual({
        id: 'wot',
        index: 'first',
        items: [
          {
            label: 'wot: wat',
            attribute: 'wot',
            currentRefinement: 'wat',
            // Ignore clear, we test it later
            value: metadata.items[0].value,
          },
        ],
      });
    });

    it('items value function should clear it from the search state', () => {
      const metadata = getMetadata(
        { attribute: 'one' },
        { indices: { first: { menu: { one: 'one', two: 'two' } } } }
      );

      const searchState = metadata.items[0].value({
        indices: { first: { menu: { one: 'one', two: 'two' } } },
      });

      expect(searchState).toEqual({
        indices: { first: { page: 1, menu: { one: '', two: 'two' } } },
      });
    });

    it('should return the right searchState when clean up', () => {
      let searchState = cleanUp(
        { attribute: 'name' },
        {
          indices: {
            first: {
              menu: { name: 'searchState', name2: 'searchState2' },
              another: { searchState: 'searchState' },
            },
          },
        }
      );
      expect(searchState).toEqual({
        indices: {
          first: {
            menu: { name2: 'searchState2' },
            another: { searchState: 'searchState' },
          },
        },
      });

      searchState = cleanUp({ attribute: 'name2' }, searchState);
      expect(searchState).toEqual({
        indices: {
          first: { another: { searchState: 'searchState' }, menu: {} },
        },
      });
    });
  });
});
