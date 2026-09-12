import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';

export function makeApolloClient() {
  return new ApolloClient({
    link: new HttpLink({ uri: '/api/graphql' }),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
      },
    },
  });
}
