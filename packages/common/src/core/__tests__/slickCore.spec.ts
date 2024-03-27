import 'jest-extended';
import { BasePubSubService } from '@slickgrid-universal/event-pub-sub';

import { EditController } from '../../interfaces';
import { SlickEditorLock, SlickEvent, SlickEventData, SlickEventHandler, SlickGroup, SlickGroupTotals, SlickRange, Utils } from '../slickCore';

const pubSubServiceStub = {
  publish: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  unsubscribeAll: jest.fn(),
} as BasePubSubService;

describe('SlickCore file', () => {
  describe('SlickEventData class', () => {
    it('should call isPropagationStopped() and expect truthy when event propagation is stopped by calling stopPropagation()', () => {
      const evt = new CustomEvent('click');
      const ed = new SlickEventData(evt);

      expect(ed.getNativeEvent()).toEqual(evt);
      expect(ed.isPropagationStopped()).toBeFalsy();

      ed.stopPropagation();

      expect(ed.isPropagationStopped()).toBeTruthy();
    });

    it('should call isImmediatePropagationStopped() and expect truthy when event propagation is stopped by calling stopImmediatePropagation()', () => {
      const evt = new CustomEvent('click');
      const ed = new SlickEventData(evt);

      expect(ed.isImmediatePropagationStopped()).toBeFalsy();

      ed.stopImmediatePropagation();

      expect(ed.isImmediatePropagationStopped()).toBeTruthy();
    });

    it('should call isDefaultPrevented() and expect truthy when event propagation is stopped by calling preventDefault()', () => {
      const ed = new SlickEventData();

      expect(ed.defaultPrevented).toBeFalsy();
      expect(ed.isDefaultPrevented()).toBeFalsy();

      ed.preventDefault();

      expect(ed.defaultPrevented).toBeTruthy();
      expect(ed.isDefaultPrevented()).toBeTruthy();
    });

    it('should be able to retrieve arguments provided by calling getArguments() method', () => {
      const evt = new Event('click');
      const mockArgs = { hello: 'world' };
      const ed = new SlickEventData(evt, mockArgs);

      expect(ed.getArguments()).toEqual(mockArgs);
    });

    it('should call isDefaultPrevented() and expect truthy when event propagation is stopped on a native event by calling preventDefault()', () => {
      const evt = new Event('click');
      const evtSpy = jest.spyOn(evt, 'preventDefault');
      const ed = new SlickEventData(evt);

      expect(ed.defaultPrevented).toBeFalsy();
      expect(ed.isDefaultPrevented()).toBeFalsy();

      ed.preventDefault();
      ed.stopPropagation();

      expect(evtSpy).toHaveBeenCalled();
    });

    it('should be able to call addReturnValue() with input and expect the same first input value when calling getReturnValue(), calling it subsequently will always return first value', () => {
      const ed = new SlickEventData();
      ed.addReturnValue('last value');

      expect(ed.getReturnValue()).toBe('last value');

      ed.addReturnValue(false);
      expect(ed.getReturnValue()).toBe('last value');
    });

    it('should be able to reset value returned', () => {
      const ed = new SlickEventData();
      ed.addReturnValue('last value');

      expect(ed.getReturnValue()).toBe('last value');

      ed.resetReturnValue();
      expect(ed.getReturnValue()).toBeUndefined();
    });
  });

  describe('SlickEvent class', () => {
    it('should be able to subscribe to an event and call unsubscribe() and expect 1 subscriber to be dropped', () => {
      const spy1 = jest.fn();
      const spy2 = jest.fn();
      const onClick = new SlickEvent();
      onClick.subscribe(spy1);
      onClick.subscribe(spy2);

      expect(onClick.subscriberCount).toBe(2);

      onClick.unsubscribe(spy1);
      expect(onClick.subscriberCount).toBe(1);
    });

    it('should be able to call notify on SlickEventData and ignore any previous value', () => {
      const spy1 = jest.fn();
      const spy2 = jest.fn();
      const ed = new SlickEventData();
      const onClick = new SlickEvent('onClick');
      const scope = { onClick };
      const resetValSpy = jest.spyOn(ed, 'resetReturnValue');
      onClick.subscribe(spy1);
      onClick.subscribe(spy2);

      expect(onClick.subscriberCount).toBe(2);

      onClick.notify({ hello: 'world' }, ed, scope, true);

      expect(spy1).toHaveBeenCalledWith(ed, { hello: 'world' });
      expect(resetValSpy).toHaveBeenCalled();
    });

    it('should be able to subscribe to an event, call notify() and all subscribers to receive what was sent', () => {
      const spy1 = jest.fn();
      const spy2 = jest.fn();
      const ed = new SlickEventData();
      const onClick = new SlickEvent();
      onClick.subscribe(spy1);
      onClick.subscribe(spy2);

      expect(onClick.subscriberCount).toBe(2);

      onClick.notify({ hello: 'world' }, ed);

      expect(spy1).toHaveBeenCalledWith(ed, { hello: 'world' });
    });

    it('should be able to add a PubSub instance to the SlickEvent call notify() and expect PubSub .publish() to be called as well', () => {
      const ed = new SlickEventData();
      const onClick = new SlickEvent('onClick', pubSubServiceStub);

      onClick.notify({ hello: 'world' }, ed);

      expect(pubSubServiceStub.publish).toHaveBeenCalledWith('onClick', { eventData: ed, args: { hello: 'world' } }, undefined, expect.any(Function));
    });

    it('should be able to mix a PubSub with regular SlickEvent subscribe and expect both to be triggered by the SlickEvent call notify()', () => {
      const spy1 = jest.fn();
      const spy2 = jest.fn();
      const ed = new SlickEventData();
      const onClick = new SlickEvent('onClick', pubSubServiceStub);
      onClick.subscribe(spy1);
      onClick.subscribe(spy2);

      expect(onClick.subscriberCount).toBe(2);

      onClick.notify({ hello: 'world' }, ed);

      expect(spy1).toHaveBeenCalledWith(ed, { hello: 'world' });
      expect(pubSubServiceStub.publish).toHaveBeenCalledWith('onClick', { eventData: ed, args: { hello: 'world' } }, undefined, expect.any(Function));
    });

    it('should be able to call addSlickEventPubSubWhenDefined() and expect PubSub to be available in SlickEvent', () => {
      const ed = new SlickEventData();
      const onClick = new SlickEvent('onClick');
      const scope = { onClick };
      const setPubSubSpy = jest.spyOn(onClick, 'setPubSubService');

      Utils.addSlickEventPubSubWhenDefined(pubSubServiceStub, scope);
      onClick.notify({ hello: 'world' }, ed);

      expect(setPubSubSpy).toHaveBeenCalledWith(pubSubServiceStub);
      expect(pubSubServiceStub.publish).toHaveBeenCalledWith('onClick', { eventData: ed, args: { hello: 'world' } }, undefined, expect.any(Function));
    });

    it('should be able to add a PubSub instance to the SlickEvent call notify() and expect PubSub .publish() to be called and the externalize event callback be called also', () => {
      const ed = new SlickEventData();
      const pubSubCopy = { ...pubSubServiceStub };
      const onClick = new SlickEvent('onClick', pubSubCopy);
      pubSubCopy.publish = (_evtName, _data, _delay, evtCallback) => {
        evtCallback!(new CustomEvent('click'));
      }

      onClick.notify({ hello: 'world' }, ed);

      expect(ed.nativeEvent).toBeDefined();
      expect(pubSubServiceStub.publish).toHaveBeenCalledWith('onClick', { eventData: expect.any(Object), args: { hello: 'world' } }, undefined, expect.any(Function));
    });
  });

  describe('SlickEventHandler class', () => {
    it('should be able to subscribe to multiple events and call unsubscribe() a single event', () => {
      const spy1 = jest.fn();
      const spy2 = jest.fn();
      const eventHandler = new SlickEventHandler();
      const onClick = new SlickEvent();
      const onDblClick = new SlickEvent();

      eventHandler.subscribe(onClick, spy1);
      eventHandler.subscribe(onDblClick, spy2);

      expect(eventHandler.subscriberCount).toBe(2);

      const chain = eventHandler.unsubscribe(onClick, spy1);

      expect(chain).toBeUndefined(); // returns undefined when handler is found
      expect(eventHandler.subscriberCount).toBe(1);
    });

    it('should return same amount of handlers when calling unsubscribe() on an event that is not found', () => {
      const spy1 = jest.fn();
      const spy2 = jest.fn();
      const eventHandler = new SlickEventHandler();
      const onClick = new SlickEvent();
      const onDblClick = new SlickEvent();

      eventHandler.subscribe(onClick, spy1);
      eventHandler.subscribe(onDblClick, spy2);

      expect(eventHandler.subscriberCount).toBe(2);

      const chain = eventHandler.unsubscribe({} as any, spy1);

      expect(chain).toEqual(eventHandler);
      expect(eventHandler.subscriberCount).toBe(2);
    });

    it('should be able to subscribe to multiple events and expect no more event handlers when calling unsubscribeAll()', () => {
      const spy1 = jest.fn();
      const spy2 = jest.fn();
      const eventHandler = new SlickEventHandler();
      const onClick = new SlickEvent();
      const onDblClick = new SlickEvent();

      eventHandler.subscribe(onClick, spy1);
      eventHandler.subscribe(onDblClick, spy2);

      expect(eventHandler.subscriberCount).toBe(2);

      const chain = eventHandler.unsubscribeAll();

      expect(eventHandler.subscriberCount).toBe(0);
      expect(chain).toEqual(eventHandler);
    });
  });

  describe('SlickRange class', () => {
    it('should call isSingleCell() and expect truthy when fromRow equals toRow', () => {
      const range = new SlickRange(0, 2);
      range.fromCell = 0;
      range.toCell = 0;

      expect(range.isSingleCell()).toBeTruthy();
    });

    it('should call isSingleCell() and expect falsy when fromRow does not equals toRow', () => {
      const range = new SlickRange(0, 2);
      range.fromCell = 0;
      range.toCell = 2;

      expect(range.isSingleCell()).toBeFalsy();
    });

    it('should call isSingleRow() and expect truthy when fromRow equals toRow', () => {
      const range = new SlickRange(0, 0);
      range.fromRow = 0;
      range.toRow = 0;

      expect(range.isSingleRow()).toBeTruthy();
    });

    it('should call isSingleRow() and expect falsy when fromRow does not equals toRow', () => {
      const range = new SlickRange(0, 1);
      range.fromRow = 0;
      range.toRow = 2;

      expect(range.isSingleRow()).toBeFalsy();
    });

    it('should call contains() and expect falsy when row is not found', () => {
      const range = new SlickRange(0, 1, 2, 5);

      expect(range.contains(4, 0)).toBeFalsy();
    });

    it('should call contains() and expect truthy when row is found within the range', () => {
      const range = new SlickRange(0, 1, 2, 5);

      expect(range.contains(1, 3)).toBeTruthy();
    });

    it('should call toString() and expect a readable stringified result for a single cell range', () => {
      const range = new SlickRange(0, 1, 0, 1);

      expect(range.toString()).toBe('(0:1)');
    });

    it('should call toString() and expect a readable stringified result for a range including multiple cells', () => {
      const range = new SlickRange(0, 1, 2, 5);

      expect(range.toString()).toBe('(0:1 - 2:5)');
    });
  });

  describe('SlickGroup class', () => {
    it('should call equals() and return truthy when groups are equal', () => {
      const group = new SlickGroup();
      group.value = '123';
      group.count = 2;
      group.collapsed = false;
      group.level = 0;
      group.title = 'my title';
      const group2 = { ...group } as SlickGroup;

      expect(group.equals(group2)).toBeTruthy();
    });

    it('should call equals() and return false when groups have differences', () => {
      const group = new SlickGroup();
      group.value = '123';
      group.count = 2;
      group.collapsed = false;
      group.level = 0;
      group.title = 'my title';

      const group2 = { ...group } as SlickGroup;
      group2.title = 'another title';
      group.value = '222';

      expect(group.equals(group2)).toBeFalsy();
    });
  });

  describe('SlickGroupTotals class', () => {
    it('should be able to create a SlickGroupTotals and assign a SlickGroup', () => {
      const group = new SlickGroup();
      group.value = '123';
      group.count = 2;
      group.collapsed = false;
      group.level = 0;
      group.title = 'my title';

      const groupTotals = new SlickGroupTotals();
      groupTotals.group = group;
      group.totals = groupTotals;

      expect(groupTotals).toBeTruthy();
      expect(groupTotals.__nonDataRow).toBeTruthy();
      expect(groupTotals.__groupTotals).toBeTruthy();
      expect(groupTotals.initialized).toBeFalsy();

      groupTotals.initialized = true;
      expect(groupTotals.initialized).toBeTruthy();
    });
  });

  describe('SlickEditorLock class', () => {
    it('should activate an EditController and expect isActive() to be truthy', () => {
      const commitSpy = jest.fn();
      const cancelSpy = jest.fn();
      const ec = { commitCurrentEdit: commitSpy, cancelCurrentEdit: cancelSpy, } as EditController;

      const elock = new SlickEditorLock();
      elock.activate(ec);
      elock.activate(ec); // calling 2x shouldn't cause problem

      expect(elock.isActive()).toBeTruthy();
    });

    it('should throw when trying to call activate() with a second EditController', () => {
      const commitSpy = jest.fn();
      const cancelSpy = jest.fn();
      const commit2Spy = jest.fn();
      const cancel2Spy = jest.fn();
      const ec = { commitCurrentEdit: commitSpy, cancelCurrentEdit: cancelSpy, } as EditController;
      const ec2 = { commitCurrentEdit: commit2Spy, cancelCurrentEdit: cancel2Spy, } as EditController;

      const elock = new SlickEditorLock();
      elock.activate(ec);

      expect(() => elock.activate(ec2)).toThrow(`SlickEditorLock.activate: an editController is still active, can't activate another editController`);
    });

    it('should throw when trying to call activate() with an EditController that forgot to implement commitCurrentEdit() method', () => {
      const cancelSpy = jest.fn();
      const ec = { cancelCurrentEdit: cancelSpy, } as any;

      const elock = new SlickEditorLock();
      expect(() => elock.activate(ec)).toThrow(`SlickEditorLock.activate: editController must implement .commitCurrentEdit()`);
    });

    it('should throw when trying to call activate() with an EditController that forgot to implement cancelCurrentEdit() method', () => {
      const commitSpy = jest.fn();
      const ec = { commitCurrentEdit: commitSpy, } as any;

      const elock = new SlickEditorLock();
      expect(() => elock.activate(ec)).toThrow(`SlickEditorLock.activate: editController must implement .cancelCurrentEdit()`);
    });

    it('should deactivate an EditController and expect isActive() to be falsy', () => {
      const commitSpy = jest.fn();
      const cancelSpy = jest.fn();
      const ec = { commitCurrentEdit: commitSpy, cancelCurrentEdit: cancelSpy, } as EditController;

      const elock = new SlickEditorLock();
      elock.activate(ec);
      expect(elock.isActive()).toBeTruthy();

      elock.deactivate(ec);
      elock.deactivate(ec); // calling 2x should yield to same problem
      expect(elock.isActive()).toBeFalsy();
    });

    it('should throw when trying to deactivate an EditController that does not equal to the currently active EditController', () => {
      const commitSpy = jest.fn();
      const cancelSpy = jest.fn();
      const commit2Spy = jest.fn();
      const cancel2Spy = jest.fn();
      const ec = { commitCurrentEdit: commitSpy, cancelCurrentEdit: cancelSpy, } as EditController;
      const ec2 = { commitCurrentEdit: commit2Spy, cancelCurrentEdit: cancel2Spy, } as EditController;

      const elock = new SlickEditorLock();
      elock.activate(ec);

      expect(() => elock.deactivate(ec2)).toThrow(`SlickEditorLock.deactivate: specified editController is not the currently active one`);
    });

    it('should expect active EditController.commitCurrentEdit() being called when calling commitCurrentEdit() after it was activated', () => {
      const commitSpy = jest.fn().mockReturnValue(true);
      const cancelSpy = jest.fn().mockReturnValue(true);
      const ec = { commitCurrentEdit: commitSpy, cancelCurrentEdit: cancelSpy, } as EditController;

      const elock = new SlickEditorLock();
      elock.activate(ec);
      const committed = elock.commitCurrentEdit();

      expect(elock.isActive()).toBeTruthy();
      expect(commitSpy).toHaveBeenCalled();
      expect(cancelSpy).not.toHaveBeenCalled();
      expect(committed).toBeTrue();
    });

    it('should expect active EditController.commitCurrentEdit() being called when calling commitCurrentEdit() after it was activated', () => {
      const commitSpy = jest.fn().mockReturnValue(true);
      const cancelSpy = jest.fn().mockReturnValue(true);
      const ec = { commitCurrentEdit: commitSpy, cancelCurrentEdit: cancelSpy, } as EditController;

      const elock = new SlickEditorLock();
      elock.activate(ec);
      const cancelled = elock.cancelCurrentEdit();

      expect(elock.isActive()).toBeTruthy();
      expect(cancelSpy).toHaveBeenCalled();
      expect(commitSpy).not.toHaveBeenCalled();
      expect(cancelled).toBeTrue();
    });
  });

  describe('Utils', () => {
    describe('storage() function', () => {
      it('should be able to store an object and retrieve it later', () => {
        const div = document.createElement('div');
        const col = { id: 'first', field: 'firstName', name: 'First Name' };

        Utils.storage.put(div, 'column', col);
        const result = Utils.storage.get(div, 'column');

        expect(result).toEqual(col);
      });

      it('should be able to store an object and return null when element provided to .get() is invalid', () => {
        const div = document.createElement('div');
        const col = { id: 'first', field: 'firstName', name: 'First Name' };

        Utils.storage.put(div, 'column', col);
        const result = Utils.storage.get(null as any, 'column');

        expect(result).toBeNull();
      });

      it('should be able to store an object and retrieve it, then remove it and expect null', () => {
        const div = document.createElement('div');
        const col = { id: 'first', field: 'firstName', name: 'First Name' };

        Utils.storage.put(div, 'column', col);
        const result = Utils.storage.get(div, 'column');
        expect(result).toEqual(col);

        const removed = Utils.storage.remove(div, 'column');
        const result2 = Utils.storage.get(div, 'column');
        expect(result2).toBeUndefined();
        expect(removed).toBeTruthy();
      });

      it('should be able to store an object and return falsy when trying to remove something that does not exist', () => {
        const div = document.createElement('div');
        const col = { id: 'first', field: 'firstName', name: 'First Name' };

        Utils.storage.put(div, 'column', col);
        const result = Utils.storage.get(div, 'column');
        expect(result).toEqual(col);

        const removed = Utils.storage.remove(div, 'column2');
        expect(removed).toBeFalsy();
      });
    });

    describe('height() function', () => {
      it('should return null when calling without a valid element', () => {
        const result = Utils.height(null as any);
        expect(result).toBeUndefined();
      });

      it('should return client rect height when called without a 2nd argument value', () => {
        const div = document.createElement('div');
        jest.spyOn(div, 'getBoundingClientRect').mockReturnValue({ height: 120 } as DOMRect);

        const result = Utils.height(div);

        expect(result).toBe(120);
      });

      it('should apply height to element when called with a 2nd argument value', () => {
        const div = document.createElement('div');
        jest.spyOn(div, 'getBoundingClientRect').mockReturnValue({ height: 120 } as DOMRect);

        Utils.height(div, 130);

        expect(div.style.height).toBe('130px');
      });
    });

    describe('width() function', () => {
      it('should return null when calling without a valid element', () => {
        const result = Utils.width(null as any);
        expect(result).toBeUndefined();
      });

      it('should return client rect width when called without a 2nd argument value', () => {
        const div = document.createElement('div');
        jest.spyOn(div, 'getBoundingClientRect').mockReturnValue({ width: 120 } as DOMRect);

        const result = Utils.width(div);

        expect(result).toBe(120);
      });

      it('should apply width to element when called with a 2nd argument value', () => {
        const div = document.createElement('div');
        jest.spyOn(div, 'getBoundingClientRect').mockReturnValue({ width: 120 } as DOMRect);

        Utils.width(div, 130);

        expect(div.style.width).toBe('130px');
      });
    });

    describe('parents() function', () => {
      it('should return parent array when container element is hidden and we pass :hidden selector', () => {
        const container = document.createElement('div');
        const div = document.createElement('div');
        const span = document.createElement('span');
        const input = document.createElement('input');
        Object.defineProperty(div, 'offsetWidth', { writable: true, configurable: true, value: 0 });
        Object.defineProperty(div, 'offsetHeight', { writable: true, configurable: true, value: 0 });
        span.appendChild(input);
        div.appendChild(span);
        container.appendChild(div);

        const result = Utils.parents(span, ':hidden') as HTMLElement[];

        expect(result).toEqual([div]);
      });

      it('should return no parent when container element is hidden and we pass :visible selector', () => {
        const container = document.createElement('div');
        const div = document.createElement('div');
        const span = document.createElement('span');
        const input = document.createElement('input');
        Object.defineProperty(div, 'offsetWidth', { writable: true, configurable: true, value: 0 });
        Object.defineProperty(div, 'offsetHeight', { writable: true, configurable: true, value: 0 });
        span.appendChild(input);
        div.appendChild(span);
        container.appendChild(div);

        const result = Utils.parents(span, ':visible') as HTMLElement[];

        expect(result).toEqual([]);
      });

      it('should return no parent when container element itself has no parent', () => {
        const div = document.createElement('div');
        const span = document.createElement('span');
        const input = document.createElement('input');
        span.appendChild(input);
        div.appendChild(span);

        const result = Utils.parents(span, ':hidden') as HTMLElement[];

        expect(result).toEqual([]);
      });

      it('should return parent array when container element is visible and we pass :visible selector', () => {
        const container = document.createElement('div');
        const div = document.createElement('div');
        const span = document.createElement('span');
        const input = document.createElement('input');
        Object.defineProperty(div, 'offsetWidth', { writable: true, configurable: true, value: 12 });
        Object.defineProperty(div, 'offsetHeight', { writable: true, configurable: true, value: 12 });
        span.appendChild(input);
        div.appendChild(span);
        container.appendChild(div);

        const result = Utils.parents(span, ':visible') as HTMLElement[];

        expect(result).toEqual([div]);
      });

      it('should return list of parents with that includes querying selector with certain css class', () => {
        const container = document.createElement('div');
        const div = document.createElement('div');
        const span = document.createElement('span');
        const input = document.createElement('input');
        div.className = 'my-class';
        span.appendChild(input);
        div.appendChild(span);
        container.appendChild(div);

        const result = Utils.parents(span, '.my-class') as HTMLElement[];

        expect(result).toEqual([div]);
      });
    });

    describe('setStyleSize() function', () => {
      it('should execute value function when value is a function', () => {
        const mockFn = jest.fn().mockReturnValue(110);
        const div = document.createElement('div');
        Utils.setStyleSize(div, 'width', mockFn);

        expect(mockFn).toHaveBeenCalled();
        expect(div.style.width).toBe('110px');
      });
    });

    describe('isHidden() function', () => {
      it('should be falsy when element has height/width greater than 0', () => {
        const div = document.createElement('div');
        Object.defineProperty(div, 'offsetWidth', { writable: true, configurable: true, value: 10 });
        Object.defineProperty(div, 'offsetHeight', { writable: true, configurable: true, value: 10 });

        const result = Utils.isHidden(div);

        expect(result).toBeFalsy();
      });

      it('should be truthy when element has both height/width as 0', () => {
        const div = document.createElement('div');
        Object.defineProperty(div, 'offsetWidth', { writable: true, configurable: true, value: 0 });
        Object.defineProperty(div, 'offsetHeight', { writable: true, configurable: true, value: 0 });

        const result = Utils.isHidden(div);

        expect(result).toBeTruthy();
      });
    });

    describe('show() function', () => {
      it('should make element visible when providing a single element', () => {
        const div = document.createElement('div');
        div.style.display = 'none';
        Utils.show(div, 'block');

        expect(div.style.display).toBe('block');
      });

      it('should make multiple elements visible when providing an array of elements', () => {
        const div = document.createElement('div');
        const span = document.createElement('span');
        div.style.display = 'none';
        span.style.display = 'none';

        Utils.show([div, span], 'block');

        expect(div.style.display).toBe('block');
        expect(span.style.display).toBe('block');
      });
    });

    describe('hide() function', () => {
      it('should make element hidden when providing a single element', () => {
        const div = document.createElement('div');
        div.style.display = 'block';
        Utils.hide(div);

        expect(div.style.display).toBe('none');
      });

      it('should make multiple elements hidden when providing an array of elements', () => {
        const div = document.createElement('div');
        const span = document.createElement('span');
        div.style.display = 'block';
        span.style.display = 'block';

        Utils.hide([div, span]);

        expect(div.style.display).toBe('none');
        expect(span.style.display).toBe('none');
      });
    });

    describe('toFloat() function', () => {
      it('should parse string as a number', () => {
        const result = Utils.toFloat('120.2');

        expect(result).toBe(120.2);
      });

      it('should be able to parse string that include other text', () => {
        const result = Utils.toFloat('120.2px');

        expect(result).toBe(120.2);
      });

      it('should return 0 when input is not a number', () => {
        const result = Utils.toFloat('abc');

        expect(result).toBe(0);
      });
    });

    describe('applyDefaults() function', () => {
      it('should apply default values to the input object', () => {
        const defaults = {
          alwaysShowVerticalScroll: false,
          alwaysAllowHorizontalScroll: false,
        };
        const inputObj = { alwaysShowVerticalScroll: true };
        Utils.applyDefaults(inputObj, defaults);

        expect(inputObj).toEqual({
          alwaysShowVerticalScroll: true,
          alwaysAllowHorizontalScroll: false,
        });
      });
    });

  });
});