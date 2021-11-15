import { Middleware, Reducer } from 'redux';
import Client from './connection/Client';

interface Options {
  hostReducer?: Reducer; 
}

const middleware = (options: Options): Middleware => () => (next) => {
  let client: Client | undefined;
  let actions: any[] = [];

  const setup = async (hostId: string) => {
    client = await Client.create(hostId, {});
    client.on('state', (state) => {
      let optimisitcState = {...state};
      if (options.hostReducer) {
        optimisitcState = actions.reduce(options.hostReducer, optimisitcState);
      }
      next({
        type: '@@REMOTE/STATE',
        payload: optimisitcState,
      });
    });
    return next({
      type: '@@REMOTE/STATE',
      payload: client.state,
    });
  }

  return (action) => {
    if (action.type === '@@REMOTE/SETUP') {
      return setup(action.payload);
    }
    if (action.type === '@@REMOTE/DISPATCH') {
      if (!client) {
        throw new Error('client not setup')
      }
      actions.push(action);
      return client.send(action).then(() => {
        actions = actions.filter(a => a !== action);
      });
    }
    return next(action);
  }
}

export default middleware;
