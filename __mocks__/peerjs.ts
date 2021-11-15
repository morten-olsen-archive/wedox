import EventEmitter from 'eventemitter3';

interface Peers {
  [name: string]: Peer;
}

let peers: Peers = {};
let peerId = 0;

interface PeerEvents {
  open: () => void;
  connection: (peer: DataChannel) => void;
}

interface DataChannelEvents {
  open: () => void;
  data: (data: any) => void;
}

class DataChannel extends EventEmitter<DataChannelEvents> {
  active: boolean = true;
  #sending: EventEmitter<DataChannelEvents>;
  #receving: EventEmitter<DataChannelEvents>;
  #messageQueue: any[] = [];

  constructor(sending: EventEmitter<DataChannelEvents>, receving: EventEmitter<DataChannelEvents>) {
    super();
    this.#sending = sending;
    this.#receving = receving;
    setTimeout(() => {
      this.emit('open');
    }, 10);
    this.#receving.on('data', (data) => {
      this.emit('data', data);
    })
  }

  public send = (data: any) => {
    this.#messageQueue.push(data);
    this.processQueue();
  }

  public processQueue = () => {
    if (!this.active) return;
    const data = this.#messageQueue.pop();
    if (data) {
      this.#sending.emit('data', data);
      this.processQueue();
    }
  }
}

class Peer extends EventEmitter<PeerEvents> {
  id: string;
  channels: {
    [id: string]: DataChannel;
  } = {};

  constructor(id?: string) {
    super();
    this.id = id || `id_${peerId++}`;
    setTimeout(() => {
      peers[this.id] = this;
      this.emit('open')
    }, 10);
  }

  public connect = (id: string) => {
    const target = peers[id];
    const sending = new EventEmitter<DataChannelEvents>();
    const receving = new EventEmitter<DataChannelEvents>();
    const txDataChannel = new DataChannel(sending, receving);
    const rxDataChannel = new DataChannel(receving, sending);
    this.channels[id] = txDataChannel;
    target.emit('connection', rxDataChannel);
    return txDataChannel;
  }
}

export const getPeer = (id: string) => peers[id];

export const reset = () => {
  peers = {};
}

export default Peer;
