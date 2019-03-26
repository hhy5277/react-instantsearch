import { isEqual } from 'lodash';
import React, { Component, ReactType } from 'react';
import { shallowEqual, getDisplayName, removeEmptyKey } from './utils';
import {
  InstantSearchConsumer,
  InstantSearchContext,
  IndexConsumer,
  IndexContext,
} from './context';

function needlessUsageWarning(connectorDesc: ConnectorDescription) {
  if (process.env.NODE_ENV === 'development') {
    const onlyGetProvidedPropsUsage = !Object.keys(connectorDesc).find(
      key =>
        ['getMetadata', 'getSearchParameters', 'refine', 'cleanUp'].indexOf(
          key
        ) > -1
    );

    if (
      onlyGetProvidedPropsUsage &&
      connectorDesc.displayName.substr(0, 7) !== 'Algolia'
    ) {
      // tslint:disable-next-line no-console
      console.warn(
        'react-instantsearch: it seems that you are using the `createConnector` api ' +
          'only to access the `searchState` and the `searchResults` through `getProvidedProps`.' +
          'We are now provided a dedicated API' +
          ' the `connectStateResults` connector that you should use instead. The `createConnector` API will be ' +
          'soon deprecated and will break in future next major versions.' +
          '\n\n' +
          'See more at https://www.algolia.com/doc/api-reference/widgets/state-results/react/' +
          '\n' +
          'and https://www.algolia.com/doc/guides/building-search-ui/going-further/conditional-display/react/'
      );
    }
  }
}
// @TODO: which are optional here, all?
type ConnectorDescription = {
  displayName: string;
  /**
   * a function to filter the local state
   */
  refine?: (...args: any[]) => any;
  /**
   * function transforming the local state to a SearchParameters
   */
  getSearchParameters?: (...args: any[]) => any;
  /**
   * metadata of the widget (for current refinements)
   */
  getMetadata?: (...args: any[]) => any;
  /**
   * hook after the state has changed
   */
  transitionState?: (...args: any[]) => any;
  /**
   * transform the state into props passed to the wrapped component.
   * Receives (props, widgetStates, searchState, metadata) and returns the local state.
   */
  getProvidedProps: (...args: any[]) => any;
  /**
   * Receives props and return the id that will be used to identify the widget
   */
  getId?: (...args: any[]) => string;
  /**
   * hook when the widget will unmount. Receives (props, searchState) and return a cleaned state.
   */
  cleanUp?: (...args: any[]) => any;
  searchForFacetValues?: (...args: any[]) => any;
  shouldComponentUpdate?: (...args: any[]) => boolean;
  /**
   * PropTypes forwarded to the wrapped component.
   */
  propTypes?: {}; // I can't find a definition for a propTypes object
  defaultProps?: {};
};

type ConnectorProps = {
  contextValue: InstantSearchContext;
  indexContextValue: IndexContext;
};

type ConnectorState = {
  providedProps: {};
};

/**
 * Connectors are the HOC used to transform React components
 * into InstantSearch widgets.
 * In order to simplify the construction of such connectors
 * `createConnector` takes a description and transform it into
 * a connector.
 * @param {ConnectorDescription} connectorDesc the description of the connector
 * @return {Connector} a function that wraps a component into
 * an instantsearch connected one.
 */
export function createConnectorWithoutContext(
  connectorDesc: ConnectorDescription
) {
  if (!connectorDesc.displayName) {
    throw new Error(
      '`createConnector` requires you to provide a `displayName` property.'
    );
  }

  const isWidget =
    typeof connectorDesc.getSearchParameters === 'function' ||
    typeof connectorDesc.getMetadata === 'function' ||
    typeof connectorDesc.transitionState === 'function';

  return (Composed: ReactType) => {
    class Connector extends Component<ConnectorProps, ConnectorState> {
      static displayName = `${connectorDesc.displayName}(${getDisplayName(
        Composed
      )})`;
      // @TODO: this doesn't seem used, can it be removed?
      // static defaultClassNames = Composed.defaultClassNames;
      static propTypes = connectorDesc.propTypes;
      static defaultProps = connectorDesc.defaultProps;

      unsubscribe?: () => any;
      unregisterWidget?: () => any;

      mounted = false;
      isUnmounting = false;

      state: ConnectorState = {
        providedProps: this.getProvidedProps(this.props),
      };

      constructor(props: ConnectorProps) {
        super(props);

        needlessUsageWarning(connectorDesc);
      }

      componentWillMount() {
        if (connectorDesc.getSearchParameters) {
          this.props.contextValue.onSearchParameters(
            connectorDesc.getSearchParameters.bind(this),
            this.props.contextValue,
            this.props
          );
        }
      }

      componentDidMount() {
        this.mounted = true;

        this.unsubscribe = this.props.contextValue.store.subscribe(() => {
          if (!this.isUnmounting) {
            this.setState({
              providedProps: this.getProvidedProps(this.props),
            });
          }
        });

        if (isWidget) {
          this.unregisterWidget = this.props.contextValue.widgetsManager.registerWidget(
            this
          );
        }
      }

      componentWillReceiveProps(nextProps) {
        if (!isEqual(this.props, nextProps)) {
          this.setState({
            providedProps: this.getProvidedProps(nextProps),
          });

          if (isWidget) {
            this.props.contextValue.widgetsManager.update();

            if (typeof connectorDesc.transitionState === 'function') {
              this.props.contextValue.onSearchStateChange(
                connectorDesc.transitionState.call(
                  this,
                  nextProps,
                  this.props.contextValue.store.getState().widgets,
                  this.props.contextValue.store.getState().widgets
                )
              );
            }
          }
        }
      }

      shouldComponentUpdate(nextProps, nextState) {
        if (typeof connectorDesc.shouldComponentUpdate === 'function') {
          return connectorDesc.shouldComponentUpdate.call(
            this,
            this.props,
            nextProps,
            this.state,
            nextState
          );
        }

        const propsEqual = shallowEqual(this.props, nextProps);

        if (
          this.state.providedProps === null ||
          nextState.providedProps === null
        ) {
          if (this.state.providedProps === nextState.providedProps) {
            return !propsEqual;
          }
          return true;
        }

        return (
          !propsEqual ||
          !shallowEqual(this.state.providedProps, nextState.providedProps)
        );
      }

      componentWillUnmount() {
        this.isUnmounting = true;

        if (this.unsubscribe) {
          this.unsubscribe();
        }

        if (this.unregisterWidget) {
          this.unregisterWidget();

          if (typeof connectorDesc.cleanUp === 'function') {
            const nextState = connectorDesc.cleanUp.call(
              this,
              this.props,
              this.props.contextValue.store.getState().widgets
            );

            this.props.contextValue.store.setState({
              ...this.props.contextValue.store.getState(),
              widgets: nextState,
            });

            this.props.contextValue.onSearchStateChange(
              removeEmptyKey(nextState)
            );
          }
        }
      }

      getProvidedProps(props) {
        const {
          widgets,
          results,
          resultsFacetValues,
          searching,
          searchingForFacetValues,
          isSearchStalled,
          metadata,
          error,
        } = this.props.contextValue.store.getState();

        const searchResults = {
          results,
          searching,
          searchingForFacetValues,
          isSearchStalled,
          error,
        };

        return connectorDesc.getProvidedProps.call(
          this,
          props,
          widgets,
          searchResults,
          metadata,
          // @MAJOR: move this attribute on the `searchResults` it doesn't
          // makes sense to have it into a separate argument. The search
          // flags are on the object why not the results?
          resultsFacetValues
        );
      }

      getSearchParameters(searchParameters) {
        if (connectorDesc.getSearchParameters) {
          return connectorDesc.getSearchParameters.call(
            this,
            searchParameters,
            this.props,
            this.props.contextValue.store.getState().widgets
          );
        }

        return null;
      }

      getMetadata(nextWidgetsState) {
        if (typeof connectorDesc.getMetadata === 'function') {
          return connectorDesc.getMetadata.call(
            this,
            this.props,
            nextWidgetsState
          );
        }

        return {};
      }

      transitionState(prevWidgetsState, nextWidgetsState) {
        if (typeof connectorDesc.transitionState === 'function') {
          return connectorDesc.transitionState.call(
            this,
            this.props,
            prevWidgetsState,
            nextWidgetsState
          );
        }

        return nextWidgetsState;
      }

      refine = (...args) => {
        this.props.contextValue.onInternalStateUpdate(
          // refine will always be defined here because the prop is only given conditionally
          connectorDesc.refine!.call(
            this,
            this.props,
            this.props.contextValue.store.getState().widgets,
            ...args
          )
        );
      };

      createURL = (...args) =>
        this.props.contextValue.createHrefForState(
          // refine will always be defined here because the prop is only given conditionally
          connectorDesc.refine!.call(
            this,
            this.props,
            this.props.contextValue.store.getState().widgets,
            ...args
          )
        );

      searchForFacetValues = (...args) => {
        this.props.contextValue.onSearchForFacetValues(
          // searchForFacetValues will always be defined here because the prop is only given conditionally
          connectorDesc.searchForFacetValues!.call(
            this,
            this.props,
            this.props.contextValue.store.getState().widgets,
            ...args
          )
        );
      };

      render() {
        const { contextValue, ...props } = this.props;
        if (this.state.providedProps === null) {
          return null;
        }

        const refineProps =
          typeof connectorDesc.refine === 'function'
            ? { refine: this.refine, createURL: this.createURL }
            : {};

        const searchForFacetValuesProps =
          typeof connectorDesc.searchForFacetValues === 'function'
            ? { searchForItems: this.searchForFacetValues }
            : {};

        return (
          <Composed
            {...props}
            {...this.state.providedProps}
            {...refineProps}
            {...searchForFacetValuesProps}
          />
        );
      }
    }

    return Connector;
  };
}

const createConnectorWithContext = (connectorDesc: ConnectorDescription) => (
  Composed: ReactType
) => {
  const Connector = createConnectorWithoutContext(connectorDesc)(Composed);

  // @TODO: does this need a display name?
  return props => (
    <InstantSearchConsumer>
      {contextValue => (
        <IndexConsumer>
          {indexContextValue => (
            <Connector
              contextValue={contextValue}
              indexContextValue={indexContextValue}
              {...props}
            />
          )}
        </IndexConsumer>
      )}
    </InstantSearchConsumer>
  );
};

export default createConnectorWithContext;
