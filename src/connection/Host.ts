import Peer, { DataConnection } from 'peerjs';
import { AnyAction, Store } from 'redux';
import EventEmitter from 'eventemitter3';
import * as jsondiffpatch from 'jsondiffpatch';

interface Events {
  connection: (peer: DataConnection) => void;
}

interface PeerAction {
  type: string;
  payload: any;
  meta: {
    id: string;
  };
}

interface Options<State = any, Action extends AnyAction = AnyAction> {
  store: Store<State, Action>;
  pass: string;
  config?: any;
}

class Host<
  State = any,
  Action extends AnyAction = AnyAction
> extends EventEmitter<Events> {
  #self: Peer;
  #peers: DataConnection[];
  #eventId: number = 0;
  #options: Options<State, Action>;
  #previousState: State;

  constructor(self: Peer, options: Options<State, Action>) {
    super();
    this.#options = options;
    this.#peers = [];
    this.#self = self;
    this.#previousState = this.#options.store.getState();
    this.#self.on('connection', this.#handleConnection);
    this.#options.store.subscribe(this.#handleStoreChange);
  }

  public get id() {
    return this.#self.id;
  }

  public get state() {
    return this.#options.store.getState();
  }

  #handleStoreChange = () => {
    const nextState = this.#options.store.getState();
    const diff = jsondiffpatch.diff(this.#previousState, nextState);
    this.#previousState = nextState;
    this.send('update', {
      diff,
    });
  };

  #handleConnection = (peer: DataConnection) => {
    this.#peers.push(peer);
    const handleSetup = (action: PeerAction) => {
      if (action.type !== 'setup') {
        return;
      }
      const handleData = this.#handleData.bind(null, peer);
      peer.off('data', handleSetup);
      peer.on('data', handleData);
      peer.send({
        type: 'setup',
        payload: {
          state: this.#options.store.getState(),
        },
      });
    };
    peer.on('data', handleSetup);
  };

  #handleData = (peer: DataConnection, peerAction: PeerAction) => {
    const { type, payload: action, meta } = peerAction;
    if (type !== 'action') {
      return;
    }
    const responseName = `response_${meta.id}`;
    const run = async () => {
      await Promise.resolve(this.#options.store.dispatch(action));
      return true;
    };
    run()
      .then((result) => {
        peer.send({
          type: responseName,
          payload: result,
        });
      })
      .catch((err) => {
        console.error(err);
        peer.send({
          type: responseName,
          error: err.toString(),
        });
      });
  };

  public dispatch = (action: Action) => {
    return this.#options.store.dispatch(action);
  };

  public send = async (type: string, payload: any) => {
    const id = this.#eventId++;
    this.#peers.forEach((currentPeer) => {
      currentPeer.send({
        type,
        payload,
        meta: {
          id,
        },
      });
    });
  };

  public static create = (options: Options) =>
    new Promise<Host>((resolve, reject) => {
      const peer = new Peer(options.pass);
      peer.on('open', () => {
        const host = new Host(peer, options);
        resolve(host);
      });
      peer.on('error', reject);
    });
}

export default Host;
