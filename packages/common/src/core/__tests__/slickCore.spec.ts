import { EditController } from '../../interfaces';
import { SlickEditorLock, SlickEvent, SlickEventData, SlickEventHandler, SlickGroup, SlickGroupTotals, SlickRange } from '../slickCore';

describe('slick.core file', () => {
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

      expect(ed.isDefaultPrevented()).toBeFalsy();

      ed.preventDefault();

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

      eventHandler.unsubscribe(onClick, spy1);

      expect(eventHandler.subscriberCount).toBe(1);
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

      eventHandler.unsubscribeAll();

      expect(eventHandler.subscriberCount).toBe(0);
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

      expect(() => elock.activate(ec2)).toThrow(`SlickEditorLock.activate: an editController is still active, can't activate another editController`)
    });

    it('should throw when trying to call activate() with an EditController that forgot to implement commitCurrentEdit() method', () => {
      const cancelSpy = jest.fn();
      const ec = { cancelCurrentEdit: cancelSpy, } as any;

      const elock = new SlickEditorLock();
      expect(() => elock.activate(ec)).toThrow(`SlickEditorLock.activate: editController must implement .commitCurrentEdit()`)
    });

    it('should throw when trying to call activate() with an EditController that forgot to implement cancelCurrentEdit() method', () => {
      const commitSpy = jest.fn();
      const ec = { commitCurrentEdit: commitSpy, } as any;

      const elock = new SlickEditorLock();
      expect(() => elock.activate(ec)).toThrow(`SlickEditorLock.activate: editController must implement .cancelCurrentEdit()`)
    });

    it('should deactivate an EditController and expect isActive() to be falsy', () => {
      const commitSpy = jest.fn();
      const cancelSpy = jest.fn();
      const ec = { commitCurrentEdit: commitSpy, cancelCurrentEdit: cancelSpy, } as EditController;

      const elock = new SlickEditorLock();
      elock.activate(ec);
      expect(elock.isActive()).toBeTruthy();

      elock.deactivate(ec);
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

      expect(() => elock.deactivate(ec2)).toThrow(`SlickEditorLock.deactivate: specified editController is not the currently active one`)
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
});