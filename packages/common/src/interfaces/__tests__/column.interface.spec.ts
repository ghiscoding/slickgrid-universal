import type { Join, PathsToStringProps } from '../column.interface';

type Expect<T extends true> = T;
type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <
  T
>() => T extends Y ? 1 : 2
  ? true
  : false;

const typeCheckValue = <T>(arg: T) => arg;

describe('the Join type', () => {
  it('should concatenate strings with a separator', () => {
    const sut = 'a.b.c';
    type TypeToTest = Join<['a', 'b', 'c'], '.'>;
    const value = typeCheckValue<TypeToTest>(sut);

    type Check = Equal<typeof value, typeof sut>;
    type Result = Expect<Check>;

    const x: Result = true;
    expect(x).toBe(true);
  });

  it('should concatenate mixed types with a separator', () => {
    const sut = 'hello.10.true';
    type TypeToTest = Join<["hello", 10, true], '.'>;
    const value = typeCheckValue<TypeToTest>(sut);

    type Check = Equal<typeof value, typeof sut>;
    type Result = Expect<Check>;

    const x: Result = true;
    expect(x).toBe(true);
  });

  it('should construct a string path from flat strings', () => {
    const sut = 'a';
    type TypeToTest = Join<PathsToStringProps<{ a: string; b: number; c: boolean }>, '.'>;
    const value = typeCheckValue<TypeToTest>(sut);

    type Check = Equal<typeof value, TypeToTest>;
    type Result = Expect<Check>;

    const x: Result = true;
    expect(x).toBe(true);
  });

  it('should construct a string path from nested string properties', () => {
    const sut_failed = 'top';
    const sut_success = 'top.nested';
    type TypeToTest = Join<PathsToStringProps<{ top: { nested: string }, foo: string }>, '.'>;

    // can't assign top level property if its an object
    // @ts-expect-error
    typeCheckValue<TypeToTest>(sut_failed);
    const value = typeCheckValue<TypeToTest>(sut_success);

    type Check = Equal<typeof value, TypeToTest>;
    type Result = Expect<Check>;

    const x: Result = true;
    expect(x).toBe(true);
  });
});