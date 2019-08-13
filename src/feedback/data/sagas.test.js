import { runSaga } from 'redux-saga';
import { handleErrors, handleMessages } from './sagas';
import { MESSAGE_TYPES } from './constants';
import { addMessage, clearMessages } from './actions';

describe('saga tests', () => {
  let dispatched;
  let caughtErrors;
  let error;

  beforeEach(() => {
    dispatched = [];
    caughtErrors = [];
    error = new Error();
  });

  describe('handleErrors', () => {
    it('should add a fallback error on unexpected errors', async () => {
      try {
        await runSaga(
          {
            dispatch: action => dispatched.push(action),
            onError: err => caughtErrors.push(err),
          },
          handleErrors,
          error,
        ).toPromise();
      } catch (e) {} // eslint-disable-line no-empty

      const lastAction = dispatched[dispatched.length - 1];
      expect(lastAction.payload).toEqual(expect.objectContaining({ code: 'fallback-error' }));
      expect(caughtErrors).toEqual([]);
    });

    it('should dispatch addMessage actions on API errors', async () => {
      error.errors = [
        {
          code: 'uhoh',
          userMessage: 'Uhoh oh no!',
          messageType: MESSAGE_TYPES.ERROR,
        },
        {
          code: 'oh_goodness',
          userMessage: 'This is really bad!',
          messageType: MESSAGE_TYPES.ERROR,
        },
      ];
      await runSaga(
        {
          dispatch: action => dispatched.push(action),
        },
        handleErrors,
        error,
      ).toPromise();

      expect(dispatched).toEqual([
        addMessage('uhoh', 'Uhoh oh no!', undefined, MESSAGE_TYPES.ERROR),
        addMessage('oh_goodness', 'This is really bad!', undefined, MESSAGE_TYPES.ERROR),
      ]);
    });

    it('should dispatch addMessage actions on API messages', async () => {
      error.messages = [
        {
          code: 'uhoh',
          userMessage: 'Uhoh oh no!',
          messageType: MESSAGE_TYPES.INFO,
        },
        {
          code: 'oh_goodness',
          userMessage: 'This is really bad!',
          messageType: MESSAGE_TYPES.ERROR,
        },
      ];
      await runSaga(
        {
          dispatch: action => dispatched.push(action),
        },
        handleErrors,
        error,
      ).toPromise();

      expect(dispatched).toEqual([
        addMessage('uhoh', 'Uhoh oh no!', undefined, MESSAGE_TYPES.INFO),
        addMessage('oh_goodness', 'This is really bad!', undefined, MESSAGE_TYPES.ERROR),
      ]);
    });

    it('should dispatch addMessage actions on field errors', async () => {
      error.fieldErrors = [
        {
          code: 'uhoh',
          userMessage: 'Uhoh oh no!',
          fieldName: 'field1',
        },
        {
          code: 'oh_goodness',
          userMessage: 'This is really bad!',
          fieldName: 'field2',
        },
      ];
      await runSaga(
        {
          dispatch: action => dispatched.push(action),
        },
        handleErrors,
        error,
      ).toPromise();

      expect(dispatched).toEqual([
        addMessage('uhoh', 'Uhoh oh no!', undefined, MESSAGE_TYPES.ERROR, 'field1'),
        addMessage('oh_goodness', 'This is really bad!', undefined, MESSAGE_TYPES.ERROR, 'field2'),
      ]);
    });

    it('should dispatch addMessage actions on a mix of error types', async () => {
      error.errors = [
        {
          code: 'uhoh',
          userMessage: 'Uhoh oh no!',
          messageType: MESSAGE_TYPES.ERROR,
        },
      ];
      error.fieldErrors = [
        {
          code: 'oh_goodness',
          userMessage: 'This is really bad!',
          fieldName: 'field2',
        },
      ];
      await runSaga(
        {
          dispatch: action => dispatched.push(action),
        },
        handleErrors,
        error,
      ).toPromise();

      expect(dispatched).toEqual([
        addMessage('uhoh', 'Uhoh oh no!', undefined, MESSAGE_TYPES.ERROR),
        addMessage('oh_goodness', 'This is really bad!', undefined, MESSAGE_TYPES.ERROR, 'field2'),
      ]);
    });

    it('should first clear messages if clearExistingMessages is true', async () => {
      error.messages = [
        {
          code: 'uhoh',
          userMessage: 'Uhoh oh no!',
          messageType: MESSAGE_TYPES.INFO,
        },
        {
          code: 'oh_goodness',
          userMessage: 'This is really bad!',
          messageType: MESSAGE_TYPES.ERROR,
        },
      ];
      await runSaga(
        {
          dispatch: action => dispatched.push(action),
        },
        handleErrors,
        error,
        true, // clearExistingMessages
      ).toPromise();

      expect(dispatched).toEqual([
        clearMessages(),
        addMessage('uhoh', 'Uhoh oh no!', undefined, MESSAGE_TYPES.INFO),
        addMessage('oh_goodness', 'This is really bad!', undefined, MESSAGE_TYPES.ERROR),
      ]);
    });
  });

  describe('handleMessages', () => {
    it('should dispatch addMessage for each message supplied', async () => {
      const messages = [
        {
          code: 'hey_hey',
          userMessage: 'Good stuff!',
          messageType: MESSAGE_TYPES.INFO,
        },
        {
          code: 'oh_goodness',
          userMessage: 'This is not so bad!',
          messageType: MESSAGE_TYPES.INFO,
        },
      ];
      await runSaga(
        {
          dispatch: action => dispatched.push(action),
        },
        handleMessages,
        messages,
      ).toPromise();

      expect(dispatched).toEqual([
        addMessage('hey_hey', 'Good stuff!', undefined, MESSAGE_TYPES.INFO),
        addMessage('oh_goodness', 'This is not so bad!', undefined, MESSAGE_TYPES.INFO),
      ]);
    });

    it('should first clear existing messages if clearExistingMessages is true', async () => {
      const messages = [
        {
          code: 'hey_hey',
          userMessage: 'Good stuff!',
          messageType: MESSAGE_TYPES.INFO,
        },
        {
          code: 'oh_goodness',
          userMessage: 'This is not so bad!',
          messageType: MESSAGE_TYPES.INFO,
        },
      ];
      await runSaga(
        {
          dispatch: action => dispatched.push(action),
        },
        handleMessages,
        messages,
        true, // clearExistingMessages
      ).toPromise();

      expect(dispatched).toEqual([
        clearMessages(),
        addMessage('hey_hey', 'Good stuff!', undefined, MESSAGE_TYPES.INFO),
        addMessage('oh_goodness', 'This is not so bad!', undefined, MESSAGE_TYPES.INFO),
      ]);
    });

    it('should do nothing if messages argument is not an array', async () => {
      const messages = 'notanarray';
      await runSaga(
        {
          dispatch: action => dispatched.push(action),
        },
        handleMessages,
        messages,
        true,
      ).toPromise();

      expect(dispatched).toEqual([]);
    });
  });
});
