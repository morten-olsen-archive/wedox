import Peer, { DataConnection } from 'peerjs';
import EventEmitter from 'eventemitter3';
import * as jsondiffpatch from 'jsondiffpatch';

interface Action<T = any, K = any> {
  type: string;
  payload: T;
  meta: K;
}

interface Events {
  state: (state: any) => void;
}

class Client extends EventEmitter<Events> {
  #self: Peer;
  #nextMessageId: number = 0;
  #host: DataConnection;
  #state: any;

  constructor(self: Peer, host: DataConnection, state: any) {
    super();
    this.#self = self;
    this.#host = host;
    this.#host.on('data', this.#handleMessage);
    this.#state = state;
  }

  public get state() {
    return this.#state;
  }

  public get id() {
    return this.#self.id;
  }

  #handleMessage = (action: Action) => {
    if (action.type === 'update') {
      this.emit(action.payload);
      this.#state = jsondiffpatch.patch(this.#state, action.payload.diff);
      this.emit('state', this.#state);
    }
  };

  public send = (action: any) =>
    new Promise((resolve, reject) => {
      const id = this.#nextMessageId++;
      const responseName = `response_${id}`;
      const callback = (data: any) => {
        if (!data || data.type !== responseName) {
          return;
        }
        if (data.error) {
          reject(data.error);
        } else {
          resolve(data.payload);
        }
        this.#host.off('message', callback);
      };
      this.#host.on('data', callback);
      this.#host.send({
        type: 'action',
        payload: action,
        meta: {
          id,
        },
      });
    });

  public static create = (hostId: string, config: any) =>
    new Promise<Client>((resolve, reject) => {
      const peer = new Peer();
      peer.on('open', () => {
        try {
          const host = peer.connect(hostId);
          host.on('open', () => {
            try {
              host.send({
                type: 'setup',
                payload: config,
              });
            } catch (err) {
              reject(err);
            }
          });
          const callback = (data: any) => {
            if (data.type === 'setup') {
              host.off('data', callback);
              resolve(new Client(peer, host, data.payload.state));
            }
          };
          host.on('data', callback);
        } catch (err) {
          reject(err);
        }
      });
      peer.on('error', reject);
    });
}

export default Client;
