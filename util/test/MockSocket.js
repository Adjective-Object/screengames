export default class MockSocket {
  constructor(id) {
    this._emittedMessages = [];
  }

  emit() {
    this._emittedMessages.push(arguments);
  }

  getMockSentMessages() {
    return this._emittedMessages;
  }
}
