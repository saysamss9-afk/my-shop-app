import { handleSwitchAccount } from './switchAccount';

describe('handleSwitchAccount', () => {
  it('signs the user out before returning to landing', async () => {
    const signOut = jest.fn().mockResolvedValue(undefined);
    const reset = jest.fn();

    await handleSwitchAccount({ signOut, reset });

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'Landing' }],
    });
  });
});
