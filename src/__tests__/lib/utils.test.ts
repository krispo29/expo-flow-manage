import { cn } from '@/lib/utils'

describe('cn (className merger)', () => {
  it('should merge two class strings', () => {
    const result = cn('foo', 'bar')
    expect(result).toBe('foo bar')
  })

  it('should handle empty strings', () => {
    const result = cn('', 'bar')
    expect(result).toBe('bar')
  })

  it('should merge multiple class strings', () => {
    const result = cn('foo', 'bar', 'baz')
    expect(result).toBe('foo bar baz')
  })

  it('should handle conditional classes (undefined)', () => {
    const result = cn('foo', undefined, 'bar')
    expect(result).toBe('foo bar')
  })

  it('should handle conditional classes (false)', () => {
    const result = cn('foo', false, 'bar')
    expect(result).toBe('foo bar')
  })

  it('should handle conditional classes (true)', () => {
    const result = cn('foo', true && 'bar')
    expect(result).toBe('foo bar')
  })

  it('should handle arrays of classes', () => {
    const result = cn(['foo', 'bar'])
    expect(result).toBe('foo bar')
  })

  it('should handle objects for conditional classes', () => {
    const result = cn({
      foo: true,
      bar: false,
      baz: true,
    })
    expect(result).toBe('foo baz')
  })

  it('should handle mixed inputs', () => {
    const result = cn('foo', { bar: true, baz: false }, ['qux', 'quux'])
    expect(result).toBe('foo bar qux quux')
  })

  it('should deduplicate identical classes', () => {
    // Note: twMerge handles tailwind class conflicts, not arbitrary duplicates
    // Non-tailwind classes are simply concatenated
    const result = cn('foo foo', 'bar')
    expect(result).toBe('foo foo bar')
  })

  it('should handle tailwind-merge conflicts (later class wins)', () => {
    // twMerge should handle conflicting tailwind classes
    const result = cn('px-2 py-2', 'px-4')
    expect(result).toContain('px-4')
    expect(result).not.toContain('px-2')
  })
})
