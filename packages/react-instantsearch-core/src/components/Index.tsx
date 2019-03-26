import React, { Component, Children, ReactType } from 'react';
import PropTypes from 'prop-types';
import {
  InstantSearchConsumer,
  InstantSearchContext,
  IndexProvider,
  IndexContext,
} from '../core/context';

type Props = {
  indexName: string;
  indexId: string;
  root: {
    Root: ReactType;
    props: {}; // I think this is correct
  };
  contextValue: InstantSearchContext;
};

type State = {
  indexContext: IndexContext;
};

/**
 * @description
 * `<Index>` is the component that allows you to apply widgets to a dedicated index. It's
 * useful if you want to build an interface that targets multiple indices.
 * @kind widget
 * @name <Index>
 * @propType {string} indexName - index in which to search.
 * @propType {{ Root: string|function, props: object }} [root] - Use this to customize the root element. Default value: `{ Root: 'div' }`
 * @example
 * import React from 'react';
 * import { InstantSearch, Index, SearchBox, Hits, Configure } from 'react-instantsearch-dom';
 *
 * const App = () => (
 *   <InstantSearch
 *     appId="latency"
 *     apiKey="6be0576ff61c053d5f9a3225e2a90f76"
 *     indexName="instant_search"
 *   >
 *     <Configure hitsPerPage={5} />
 *     <SearchBox />
 *     <Index indexName="instant_search">
 *       <Hits />
 *     </Index>
 *     <Index indexName="bestbuy">
 *       <Hits />
 *     </Index>
 *   </InstantSearch>
 * );
 */
class Index extends Component<Props, State> {
  static propTypes = {
    // @TODO: These props are currently constant.
    indexName: PropTypes.string.isRequired,
    indexId: PropTypes.string.isRequired,
    children: PropTypes.node,
    root: PropTypes.shape({
      Root: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.func,
        PropTypes.object,
      ]),
      props: PropTypes.object,
    }).isRequired,
  };

  unregisterWidget?: () => void;

  state = {
    indexContext: {
      targetedIndex: this.props.indexId,
    },
  };

  componentWillMount() {
    this.unregisterWidget = this.props.contextValue.widgetsManager.registerWidget(
      this
    );

    this.props.contextValue.onSearchParameters(
      this.getSearchParameters.bind(this),
      this.state.indexContext,
      this.props
    );
  }

  componentWillReceiveProps(nextProps: Props) {
    if (this.props.indexName !== nextProps.indexName) {
      this.props.contextValue.widgetsManager.update();
    }
    if (this.props.indexId !== nextProps.indexId) {
      this.setState({
        indexContext: {
          targetedIndex: nextProps.indexId,
        },
      });
    }
  }

  componentWillUnmount() {
    if (typeof this.unregisterWidget === 'function') {
      this.unregisterWidget();
    }
  }

  getSearchParameters(searchParameters, props) {
    return searchParameters.setIndex(
      this.props ? this.props.indexName : props.indexName
    );
  }

  render() {
    const childrenCount = Children.count(this.props.children);
    const { Root, props } = this.props.root;
    if (childrenCount === 0) {
      return null;
    } else {
      return (
        <Root {...props}>
          <IndexProvider value={this.state.indexContext}>
            {this.props.children}
          </IndexProvider>
        </Root>
      );
    }
  }
}

const IndexWrapper = (props: Props) => (
  <InstantSearchConsumer>
    {contextValue => <Index contextValue={contextValue} {...props} />}
  </InstantSearchConsumer>
);

export default IndexWrapper;
