import { Reducer } from 'redux';

interface State {
  ready: boolean;
  state: any;
}

const createDefaults = () => ({
  ready: false,
  state: {},
});

const reducer: Reducer<State> = (state = createDefaults(), action) => {
  switch(action.type) {
    case '@@REMOTE/STATE':
      return {
        ready: true,
        state: action.payload,
      };
    default:
      return state;
  }
}

export default reducer;
