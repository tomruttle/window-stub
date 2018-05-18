// @flow

import EventEmitter from 'eventemitter3';
import URL from 'url-parse';

import type { StateWithAdditionsType } from '../index';

type StateEntryType = { data: ?StateWithAdditionsType, title: ?string, url: string };

export const windowEventTitles = {
  WINDOW_BEFORE_UNLOAD: 'beforeunload',
  HISTORY_PUSH_STATE: 'pushstate',
  HISTORY_POP_STATE: 'popstate',
};

function urlToLocation(url: string) {
  const parsed = new URL(url);

  return {
    hash: parsed.hash,
    host: parsed.host,
    hostname: parsed.hostname,
    href: parsed.href,
    origin: parsed.origin,
    pathname: parsed.pathname,
    port: parsed.port,
    protocol: parsed.protocol,
    search: parsed.query,
  };
}

class History {
  _state: *;
  _position: *;
  _updateLocation: *;
  _events: *;
  _location: *;
  _document: *;

  constructor(state: Array<StateEntryType>, position: number, location: Object, document: Object, events: EventEmitter) {
    this._state = state;
    this._position = position;
    this._events = events;
    this._location = location;
    this._document = document;
  }

  _updateLocation(path: string, title: ?string) {
    Object.assign(this._location, urlToLocation(path));
    Object.assign(this._document, { title });
  }

  get length(): number { return this._state.length; }

  get state(): ?StateWithAdditionsType { return (this._state[this._position] || {}).data; }

  replaceState = (data: ?StateWithAdditionsType = null, title: ?string, href?: ?string) => {
    const { title: currentTitle, url: currentUrl } = this._state[this._position];
    const newHash = href || currentUrl;
    const newTitle = title || currentTitle;

    this._state = [...this._state.slice(0, this._position), { data, title: newTitle, url: newHash }, ...this._state.slice(this._position + 1, this._state.length)];
    this._updateLocation(newHash, newTitle);
  }

  pushState = (data: ?StateWithAdditionsType = null, title: ?string, href?: ?string) => {
    const { title: currentTitle, url: currentUrl } = this._state[this._position];
    const newHash = href || currentUrl;
    const newTitle = title || currentTitle;

    this._state = [...this._state.slice(0, this._position + 1), { data, title: newTitle, url: newHash }];
    this._position += 1;
    this._updateLocation(newHash, newTitle);
  }

  back = () => {
    this._position -= 1;

    const newState = this._state[this._position];

    this._updateLocation(newState.url, newState.title);
    this._events.emit(windowEventTitles.HISTORY_POP_STATE, newState);
  }

  forward = () => {
    if (this._state[this._position + 1]) {
      this._position += 1;

      const newState = this._state[this._position];

      this._updateLocation(newState.url, newState.title);
      this._events.emit(windowEventTitles.HISTORY_POP_STATE, newState);
    }
  }

  go = (relativeIndex: number) => {
    const newPosition = this._position + relativeIndex;

    if (this._state[newPosition]) {
      this._position = newPosition;

      const newState = this._state[this._position];

      this._updateLocation(newState.url, newState.title);
      this._events.emit(windowEventTitles.HISTORY_POP_STATE, newState);
    }
  }
}

export default class WindowStub {
  _state: Array<StateEntryType>;
  _position: number;
  history: History;
  location: *;
  document: *;

  constructor(initialHistoryState: Array<StateEntryType> = [{ data: null, title: null, url: '/' }]) {
    const isInitialState = Array.isArray(initialHistoryState) && initialHistoryState.length > 0;

    this._position = isInitialState ? initialHistoryState.length - 1 : 0;
    this._state = [...initialHistoryState];

    const initialPath = isInitialState ? initialHistoryState[initialHistoryState.length - 1].url : '/';
    const initialTitle = isInitialState ? initialHistoryState[initialHistoryState.length - 1].title : null;

    this.location = urlToLocation(initialPath);
    this.document = {
      title: initialTitle,
      querySelector(_querySelector: string) { return this; },
    };

    this.history = new History(this._state, this._position, this.location, this.document, this._events);
  }

  _events = new EventEmitter();

  _onpopstatecb: ?(...args: Array<mixed>) => mixed = null;
  _onbeforeunloadecb: ?(...args: Array<mixed>) => mixed = null;

  set onpopstate(callback: mixed) {
    if (typeof callback !== 'function') {
      this._events.removeListener(windowEventTitles.HISTORY_POP_STATE, this._onpopstatecb);
      return;
    }

    if (typeof this._onpopstatecb === 'function') {
      this._events.removeListener(windowEventTitles.HISTORY_POP_STATE, this._onpopstatecb);
    }

    this._onpopstatecb = callback;
    this._events.on(windowEventTitles.HISTORY_POP_STATE, this._onpopstatecb);
  }

  get onpopstate(): ?(...args: Array<mixed>) => mixed {
    return this._onpopstatecb;
  }

  set onbeforeunload(callback: mixed) {
    if (typeof callback !== 'function') {
      this._events.removeListener(windowEventTitles.WINDOW_BEFORE_UNLOAD, this._onbeforeunloadecb);
      return;
    }

    if (typeof this._onbeforeunloadecb === 'function') {
      this._events.removeListener(windowEventTitles.WINDOW_BEFORE_UNLOAD, this._onbeforeunloadecb);
    }

    this._onbeforeunloadecb = callback;
    this._events.on(windowEventTitles.WINDOW_BEFORE_UNLOAD, this._onbeforeunloadecb);
  }

  get onbeforeunload(): ?(...args: Array<mixed>) => mixed {
    return this._onbeforeunloadecb;
  }
}
