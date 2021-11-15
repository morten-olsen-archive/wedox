import { Reducer } from 'redux';

interface State {
  ready: boolean;
  id?: string;
  waiting: any[];
  error?: any;
  state: any;
}

const createDefaults = () => ({
  ready: false,
  state: {},
  waiting: [],
});

const reducer = (hostReducer?: Reducer): Reducer<State> => {
  const applyWaiting = (state: State) => {
    if (!hostReducer) {
      return state;
    }
    return {
      ...state,
      state: state.waiting
        .map((a) => a.payload)
        .reduce(hostReducer, state.state),
    };
  };
  return (state = createDefaults(), action) => {
    switch (action.type) {
      case '@@REMOTE/READY':
        return {
          ...state,
          ready: true,
          id: action.payload,
        };
      case '@@REMOTE/BEGIN': {
        const updates = {
          ...state,
          waiting: [...state.waiting, action],
        };
        return applyWaiting(updates);
      }
      case '@@REMOTE/END': {
        const updates = {
          ...state,
          waiting: state.waiting.filter((a) => a.meta.id === action.meta.id),
        };
        return applyWaiting(updates);
      }
      case '@@REMOTE/STATE':
        return {
          ...state,
          error: undefined,
          state: action.payload,
        };
      case '@@REMOTE/ERROR':
        return {
          ...state,
          error: action.payload,
        };
      default:
        return state;
    }
  };
};

export default reducer;
