const { sanitizeProps } = require('./lucide-web-wrapper');

describe('lucide-web-wrapper sanitizeProps', () => {
  it('removes gluestack component config and preserves valid data attrs', () => {
    expect(
      sanitizeProps({
        componentConfig: { foo: 'bar' },
        dataSet: { id: 'icon', test: 'value' },
        states: { hover: true },
        sx: { color: 'red' },
        width: 16,
      }),
    ).toEqual({
      width: 16,
      'data-id': 'icon',
      'data-test': 'value',
    });
  });
});
